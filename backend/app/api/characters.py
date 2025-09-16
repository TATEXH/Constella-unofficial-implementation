"""キャラクターAPIエンドポイント"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import os
import shutil

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

@router.delete("/{character_id}")
async def delete_character(character_id: str):
    """キャラクターを削除"""
    db = get_database()
    result = await db[COLLECTIONS["characters"]].delete_one({"_id": ObjectId(character_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="キャラクターが見つかりません")
    
    return {"message": "キャラクターを削除しました"}