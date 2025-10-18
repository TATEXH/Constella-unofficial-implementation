"""コメントAPIエンドポイント"""
from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId

from app.core.database import get_database, COLLECTIONS
from app.models.comment import (
    Comment, CommentCreate, CommentUpdate, CommentGenerateRequest
)
from app.services.ollama import generate_comment

router = APIRouter()

async def enrich_character_relationships(character: dict, db) -> dict:
    """キャラクターの関係性にターゲットキャラクター名を追加

    target_character_idからキャラクター名を解決して、
    target_character_nameフィールドを追加する
    """
    enriched_relationships = []

    for rel in character.get("relationships", []):
        target_id = rel.get("target_character_id")

        # target_character_idからキャラクター情報を取得
        if target_id:
            try:
                target_char = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(target_id)})
                target_name = target_char["name"] if target_char else "不明なキャラクター"
            except Exception:
                target_name = "不明なキャラクター"
        else:
            target_name = "不明なキャラクター"

        enriched_rel = {
            "target_character_id": target_id,
            "target_character_name": target_name,
            "description": rel.get("description", "")
        }
        enriched_relationships.append(enriched_rel)

    # 元のキャラクター情報をコピーして関係性を置き換え
    enriched_character = character.copy()
    enriched_character["relationships"] = enriched_relationships

    return enriched_character

@router.get("/journal/{journal_id}", response_model=List[Comment])
async def get_journal_comments(journal_id: str):
    """特定のジャーナルのコメントを取得"""
    db = get_database()
    comments = []
    async for comment in db[COLLECTIONS["comments"]].find({"journal_id": journal_id}).sort("created_at", 1):
        comment["_id"] = str(comment["_id"])
        comments.append(Comment(**comment))
    return comments

@router.get("/character/{character_id}", response_model=List[Comment])
async def get_character_comments(character_id: str):
    """特定のキャラクターのコメントを取得"""
    db = get_database()
    comments = []
    async for comment in db[COLLECTIONS["comments"]].find({"character_id": character_id}).sort("created_at", -1):
        comment["_id"] = str(comment["_id"])
        comments.append(Comment(**comment))
    return comments

@router.get("/{comment_id}", response_model=Comment)
async def get_comment(comment_id: str):
    """特定のコメントを取得"""
    db = get_database()
    comment = await db[COLLECTIONS["comments"]].find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="コメントが見つかりません")
    comment["_id"] = str(comment["_id"])
    return Comment(**comment)

@router.post("/", response_model=Comment)
async def create_comment(comment: CommentCreate):
    """新しいコメントを作成"""
    db = get_database()
    
    comment_data = comment.dict()
    comment_data["created_at"] = datetime.now()
    comment_data["updated_at"] = datetime.now()
    
    result = await db[COLLECTIONS["comments"]].insert_one(comment_data)
    comment_data["_id"] = str(result.inserted_id)
    
    # ジャーナルのコメントIDリストを更新
    await db[COLLECTIONS["journals"]].update_one(
        {"_id": ObjectId(comment.journal_id)},
        {"$push": {"comment_ids": str(result.inserted_id)}}
    )
    
    return Comment(**comment_data)

@router.post("/generate", response_model=Comment)
async def generate_comment_endpoint(request: CommentGenerateRequest):
    """コメントを自動生成"""
    db = get_database()
    
    # ジャーナルを取得
    journal = await db[COLLECTIONS["journals"]].find_one({"_id": ObjectId(request.journal_id)})
    if not journal:
        raise HTTPException(status_code=404, detail="ジャーナルが見つかりません")
    
    # キャラクターを取得
    character = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(request.character_id)})
    if not character:
        raise HTTPException(status_code=404, detail="キャラクターが見つかりません")

    # 関係性にキャラクター名を追加
    enriched_character = await enrich_character_relationships(character, db)

    # 既存のコメントを取得
    existing_comments = []
    async for comment in db[COLLECTIONS["comments"]].find({"journal_id": request.journal_id}).sort("created_at", 1):
        existing_comments.append(comment)

    # コメントを生成
    content = await generate_comment(enriched_character, journal, existing_comments, request.parent_comment_id)
    
    # コメントを保存
    comment_data = {
        "journal_id": request.journal_id,
        "character_id": request.character_id,
        "content": content,
        "parent_comment_id": request.parent_comment_id,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    result = await db[COLLECTIONS["comments"]].insert_one(comment_data)
    comment_data["_id"] = str(result.inserted_id)
    
    # ジャーナルのコメントIDリストを更新
    await db[COLLECTIONS["journals"]].update_one(
        {"_id": ObjectId(request.journal_id)},
        {"$push": {"comment_ids": str(result.inserted_id)}}
    )
    
    return Comment(**comment_data)

@router.put("/{comment_id}", response_model=Comment)
@router.put("/{comment_id}/", response_model=Comment)
async def update_comment(comment_id: str, comment_update: CommentUpdate):
    """コメントを更新"""
    db = get_database()
    
    update_data = {
        k: v for k, v in comment_update.dict().items() if v is not None
    }
    if update_data:
        update_data["updated_at"] = datetime.now()
        
        result = await db[COLLECTIONS["comments"]].update_one(
            {"_id": ObjectId(comment_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="コメントが見つかりません")
    
    comment = await db[COLLECTIONS["comments"]].find_one({"_id": ObjectId(comment_id)})
    comment["_id"] = str(comment["_id"])
    return Comment(**comment)

@router.delete("/{comment_id}")
@router.delete("/{comment_id}/")
async def delete_comment(comment_id: str):
    """コメントを削除"""
    db = get_database()
    
    # コメントを取得
    comment = await db[COLLECTIONS["comments"]].find_one({"_id": ObjectId(comment_id)})
    if not comment:
        raise HTTPException(status_code=404, detail="コメントが見つかりません")
    
    # コメントを削除
    result = await db[COLLECTIONS["comments"]].delete_one({"_id": ObjectId(comment_id)})
    
    # ジャーナルのコメントIDリストから削除
    await db[COLLECTIONS["journals"]].update_one(
        {"_id": ObjectId(comment["journal_id"])},
        {"$pull": {"comment_ids": comment_id}}
    )
    
    return {"message": "コメントを削除しました"}