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

        # 関係性にキャラクター名を追加
        enriched_character = await enrich_character_relationships(character, db)

        # ジャーナルを生成
        content = await generate_journal(enriched_character, request.theme)
        
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
@router.put("/{journal_id}/", response_model=Journal)
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
@router.delete("/{journal_id}/")
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