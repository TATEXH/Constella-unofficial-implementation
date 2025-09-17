"""キャラクターAPIエンドポイント"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response, StreamingResponse
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import os
import shutil
import json
import zipfile
import urllib.parse
from io import BytesIO

from app.core.database import get_database, COLLECTIONS
from app.core.config import settings
from app.models.character import (
    Character, CharacterCreate, CharacterUpdate, CharacterInDB
)

router = APIRouter()

@router.get("/", response_model=List[Character])
async def get_characters():
    """全キャラクターを取得"""
    db = get_database()
    characters = []
    async for char in db[COLLECTIONS["characters"]].find():
        char["_id"] = str(char["_id"])
        characters.append(Character(**char))
    return characters

@router.get("/{character_id}", response_model=Character)
async def get_character(character_id: str):
    """特定のキャラクターを取得"""
    db = get_database()
    char = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(character_id)})
    if not char:
        raise HTTPException(status_code=404, detail="キャラクターが見つかりません")
    char["_id"] = str(char["_id"])
    return Character(**char)

@router.post("/", response_model=Character)
async def create_character(
    name: str = Form(...),
    image: Optional[UploadFile] = File(None)
):
    """新しいキャラクターを作成"""
    db = get_database()
    
    # 画像を保存
    image_path = None
    if image:
        # ファイルサイズチェック（10MB制限）
        if image.size > settings.max_upload_size:
            raise HTTPException(
                status_code=413,
                detail=f"ファイルサイズが大きすぎます。最大{settings.max_upload_size // 1024 // 1024}MBまで"
            )
        
        # ファイル形式チェック
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
        file_extension = os.path.splitext(image.filename)[1].lower()
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"サポートされていないファイル形式です。使用可能: {', '.join(allowed_extensions)}"
            )
        
        # アップロードディレクトリを作成
        os.makedirs(settings.upload_dir, exist_ok=True)
        
        # ファイル名を生成（UUID使用）
        import uuid
        file_name = f"character_{uuid.uuid4().hex}{file_extension}"
        file_path = os.path.join(settings.upload_dir, file_name)
        
        # ファイルを保存
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        image_path = f"/uploads/{file_name}"
    
    # キャラクターデータを作成
    character_data = {
        "name": name,
        "image_path": image_path,
        "attributes": [],
        "relationships": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    # データベースに保存
    result = await db[COLLECTIONS["characters"]].insert_one(character_data)
    character_data["_id"] = str(result.inserted_id)
    
    return Character(**character_data)

@router.put("/{character_id}", response_model=Character)
async def update_character(
    character_id: str,
    character_update: CharacterUpdate
):
    """キャラクターを更新"""
    db = get_database()

    # 更新データを準備
    update_data = {
        k: v for k, v in character_update.dict().items() if v is not None
    }
    if update_data:
        update_data["updated_at"] = datetime.now()

        # データベースを更新
        result = await db[COLLECTIONS["characters"]].update_one(
            {"_id": ObjectId(character_id)},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="キャラクターが見つかりません")

    # 更新後のデータを返す
    char = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(character_id)})
    char["_id"] = str(char["_id"])
    return Character(**char)

@router.post("/{character_id}/image", response_model=Character)
async def update_character_image(
    character_id: str,
    image: UploadFile = File(...)
):
    """キャラクターの画像を更新"""
    db = get_database()

    # キャラクターの存在確認
    existing = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(character_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="キャラクターが見つかりません")

    # ファイルサイズチェック（10MB制限）
    if image.size > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail=f"ファイルサイズが大きすぎます。最大{settings.max_upload_size // 1024 // 1024}MBまで"
        )

    # ファイル形式チェック
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    file_extension = os.path.splitext(image.filename)[1].lower()
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"サポートされていないファイル形式です。使用可能: {', '.join(allowed_extensions)}"
        )

    # アップロードディレクトリを作成
    os.makedirs(settings.upload_dir, exist_ok=True)

    # ファイル名を生成（UUID使用）
    import uuid
    file_name = f"character_{uuid.uuid4().hex}{file_extension}"
    file_path = os.path.join(settings.upload_dir, file_name)

    # ファイルを保存
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    image_path = f"/uploads/{file_name}"

    # データベースを更新
    await db[COLLECTIONS["characters"]].update_one(
        {"_id": ObjectId(character_id)},
        {"$set": {"image_path": image_path, "updated_at": datetime.now()}}
    )

    # 更新後のデータを返す
    char = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(character_id)})
    char["_id"] = str(char["_id"])
    return Character(**char)

@router.get("/export/all")
async def export_all_characters():
    """全キャラクターをZIPファイルとしてエクスポート"""
    db = get_database()

    # 全キャラクターを取得
    characters = []
    async for character in db[COLLECTIONS["characters"]].find():
        characters.append(character)

    if not characters:
        raise HTTPException(status_code=404, detail="エクスポートするキャラクターがありません")

    # ZIPファイルを作成
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for character in characters:
            export_data = {
                "name": character["name"],
                "attributes": character.get("attributes", []),
                "relationships": character.get("relationships", []),
                "image_path": character.get("image_path"),
                "created_at": character["created_at"].isoformat() if character.get("created_at") else None,
                "updated_at": character["updated_at"].isoformat() if character.get("updated_at") else None,
                "export_version": "1.0"
            }

            json_content = json.dumps(export_data, ensure_ascii=False, indent=2)
            filename = f"{character['name']}.json"
            zip_file.writestr(filename, json_content)

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": "attachment; filename=characters.zip"
        }
    )

@router.get("/{character_id}/export")
async def export_character(character_id: str):
    """キャラクターをJSONファイルとしてエクスポート"""
    db = get_database()

    # キャラクターを取得
    character = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(character_id)})
    if not character:
        raise HTTPException(status_code=404, detail="キャラクターが見つかりません")

    # MongoDB固有のフィールドを除外してクリーンなデータを作成
    export_data = {
        "name": character["name"],
        "attributes": character.get("attributes", []),
        "relationships": character.get("relationships", []),
        "image_path": character.get("image_path"),
        "created_at": character["created_at"].isoformat() if character.get("created_at") else None,
        "updated_at": character["updated_at"].isoformat() if character.get("updated_at") else None,
        "export_version": "1.0"
    }

    # JSONとしてレスポンス
    json_content = json.dumps(export_data, ensure_ascii=False, indent=2)
    json_bytes = BytesIO(json_content.encode('utf-8'))

    # ファイル名を安全にエンコード
    safe_filename = urllib.parse.quote(f"{character['name']}.json")

    return StreamingResponse(
        json_bytes,
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=\"character.json\"; filename*=UTF-8''{safe_filename}"
        }
    )

@router.delete("/{character_id}")
async def delete_character(character_id: str):
    """キャラクターを削除（関連データも含む）"""
    db = get_database()

    # キャラクターの存在確認
    character = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(character_id)})
    if not character:
        raise HTTPException(status_code=404, detail="キャラクターが見つかりません")

    # 関連するジャーナルを削除
    journals_result = await db[COLLECTIONS["journals"]].delete_many({"character_id": character_id})

    # 関連するコメントを削除
    comments_result = await db[COLLECTIONS["comments"]].delete_many({"character_id": character_id})

    # 他のキャラクターの関係性から削除対象キャラクターへの関係を削除
    await db[COLLECTIONS["characters"]].update_many(
        {"relationships.target_character_id": character_id},
        {"$pull": {"relationships": {"target_character_id": character_id}}}
    )

    # キャラクター自体を削除
    result = await db[COLLECTIONS["characters"]].delete_one({"_id": ObjectId(character_id)})

    return {
        "message": f"キャラクター「{character['name']}」を削除しました",
        "deleted": {
            "character": 1,
            "journals": journals_result.deleted_count,
            "comments": comments_result.deleted_count
        }
    }

@router.post("/import")
async def import_characters(files: List[UploadFile] = File(...)):
    """キャラクターJSONファイルをインポート"""
    db = get_database()
    results = []

    for file in files:
        try:
            # ファイル形式チェック
            if not file.filename.endswith('.json'):
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": "JSONファイルのみサポートされています"
                })
                continue

            # JSONデータを読み込み
            content = await file.read()
            try:
                character_data = json.loads(content.decode('utf-8'))
            except json.JSONDecodeError:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": "無効なJSONファイルです"
                })
                continue

            # 必須フィールドのチェック
            if "name" not in character_data:
                results.append({
                    "filename": file.filename,
                    "status": "error",
                    "message": "キャラクター名が見つかりません"
                })
                continue

            character_name = character_data["name"]

            # 既存キャラクターの重複チェック
            existing_character = await db[COLLECTIONS["characters"]].find_one({"name": character_name})

            if existing_character:
                results.append({
                    "filename": file.filename,
                    "character_name": character_name,
                    "status": "duplicate",
                    "message": f"キャラクター「{character_name}」は既に存在します",
                    "existing_id": str(existing_character["_id"])
                })
                continue

            # 新しいキャラクターとして保存
            new_character = {
                "name": character_name,
                "attributes": character_data.get("attributes", []),
                "relationships": character_data.get("relationships", []),
                "image_path": None,  # 画像は別途アップロードが必要
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

            result = await db[COLLECTIONS["characters"]].insert_one(new_character)

            results.append({
                "filename": file.filename,
                "character_name": character_name,
                "status": "success",
                "message": f"キャラクター「{character_name}」をインポートしました",
                "character_id": str(result.inserted_id)
            })

        except Exception as e:
            results.append({
                "filename": file.filename,
                "status": "error",
                "message": f"インポートエラー: {str(e)}"
            })

    return {
        "message": f"{len(files)}個のファイルを処理しました",
        "results": results
    }

@router.post("/import/overwrite/{character_id}")
async def import_character_overwrite(character_id: str, file: UploadFile = File(...)):
    """既存キャラクターを上書きしてインポート"""
    db = get_database()

    try:
        # 既存キャラクターの確認
        existing_character = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(character_id)})
        if not existing_character:
            raise HTTPException(status_code=404, detail="キャラクターが見つかりません")

        # JSONデータを読み込み
        content = await file.read()
        character_data = json.loads(content.decode('utf-8'))

        # 既存キャラクターを更新
        update_data = {
            "name": character_data.get("name", existing_character["name"]),
            "attributes": character_data.get("attributes", []),
            "relationships": character_data.get("relationships", []),
            "updated_at": datetime.now()
        }

        await db[COLLECTIONS["characters"]].update_one(
            {"_id": ObjectId(character_id)},
            {"$set": update_data}
        )

        return {
            "message": f"キャラクター「{update_data['name']}」を上書きしました",
            "character_id": character_id
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="無効なJSONファイルです")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"インポートエラー: {str(e)}")