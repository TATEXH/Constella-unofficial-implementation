"""ジャーナルAPIエンドポイント"""
from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from bson import ObjectId

from app.core.database import get_database, COLLECTIONS
from app.models.journal import (
    Journal, JournalCreate, JournalUpdate, JournalGenerateRequest
)
from app.services.ollama import generate_journal

router = APIRouter()

@router.get("", response_model=List[Journal])
@router.get("/", response_model=List[Journal])
async def get_journals():
    """全ジャーナルを取得"""
    db = get_database()
    journals = []
    async for journal in db[COLLECTIONS["journals"]].find().sort("created_at", -1):
        journal["_id"] = str(journal["_id"])
        journals.append(Journal(**journal))
    return journals

@router.get("/{journal_id}", response_model=Journal)
async def get_journal(journal_id: str):
    """特定のジャーナルを取得"""
    db = get_database()
    journal = await db[COLLECTIONS["journals"]].find_one({"_id": ObjectId(journal_id)})
    if not journal:
        raise HTTPException(status_code=404, detail="ジャーナルが見つかりません")
    journal["_id"] = str(journal["_id"])
    return Journal(**journal)

@router.post("", response_model=Journal)
@router.post("/", response_model=Journal)
async def create_journal(journal: JournalCreate):
    """新しいジャーナルを作成"""
    db = get_database()
    
    journal_data = journal.dict()
    journal_data["created_at"] = datetime.now()
    journal_data["updated_at"] = datetime.now()
    journal_data["comment_ids"] = []
    
    result = await db[COLLECTIONS["journals"]].insert_one(journal_data)
    journal_data["_id"] = str(result.inserted_id)
    
    return Journal(**journal_data)

@router.post("/generate", response_model=List[Journal])
async def generate_journals(request: JournalGenerateRequest):
    """複数のキャラクターのジャーナルを自動生成"""
    db = get_database()
    generated_journals = []
    
    for character_id in request.character_ids:
        # キャラクター情報を取得
        character = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(character_id)})
        if not character:
            continue
        
        # ジャーナルを生成
        content = await generate_journal(character, request.theme)
        
        # ジャーナルを保存
        journal_data = {
            "character_id": character_id,
            "theme": request.theme,
            "content": content,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "comment_ids": []
        }
        
        result = await db[COLLECTIONS["journals"]].insert_one(journal_data)
        journal_data["_id"] = str(result.inserted_id)
        generated_journals.append(Journal(**journal_data))
    
    return generated_journals

@router.put("/{journal_id}", response_model=Journal)
async def update_journal(journal_id: str, journal_update: JournalUpdate):
    """ジャーナルを更新"""
    db = get_database()
    
    update_data = {
        k: v for k, v in journal_update.dict().items() if v is not None
    }
    if update_data:
        update_data["updated_at"] = datetime.now()
        
        result = await db[COLLECTIONS["journals"]].update_one(
            {"_id": ObjectId(journal_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="ジャーナルが見つかりません")
    
    journal = await db[COLLECTIONS["journals"]].find_one({"_id": ObjectId(journal_id)})
    journal["_id"] = str(journal["_id"])
    return Journal(**journal)

@router.delete("/{journal_id}")
async def delete_journal(journal_id: str):
    """ジャーナルを削除（関連コメントも含む）"""
    db = get_database()

    # ジャーナルの存在確認
    journal = await db[COLLECTIONS["journals"]].find_one({"_id": ObjectId(journal_id)})
    if not journal:
        raise HTTPException(status_code=404, detail="ジャーナルが見つかりません")

    # 関連するコメントを削除
    comments_result = await db[COLLECTIONS["comments"]].delete_many({"journal_id": journal_id})

    # ジャーナル自体を削除
    result = await db[COLLECTIONS["journals"]].delete_one({"_id": ObjectId(journal_id)})

    return {
        "message": "ジャーナルを削除しました",
        "deleted": {
            "journal": 1,
            "comments": comments_result.deleted_count
        }
    }