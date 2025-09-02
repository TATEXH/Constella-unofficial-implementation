"""Friends Discovery APIエンドポイント"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
from bson import ObjectId

from app.core.database import get_database, COLLECTIONS
from app.services.ollama import generate_friends_discovery

router = APIRouter()

class FriendsDiscoveryRequest(BaseModel):
    """Friends Discovery リクエスト"""
    character_id: str
    relationship_phrase: str

class FriendsDiscoveryResponse(BaseModel):
    """Friends Discovery レスポンス"""
    characters: List[Dict[str, Any]]

@router.post("/friends", response_model=FriendsDiscoveryResponse)
async def generate_friends(request: FriendsDiscoveryRequest):
    """既存キャラクターに関連する新しいキャラクターを生成"""
    db = get_database()
    
    # キャラクター情報を取得
    character = await db[COLLECTIONS["characters"]].find_one({"_id": ObjectId(request.character_id)})
    if not character:
        raise HTTPException(status_code=404, detail="キャラクターが見つかりません")
    
    # 新しいキャラクターを生成
    new_characters = await generate_friends_discovery(character, request.relationship_phrase)
    
    return FriendsDiscoveryResponse(characters=new_characters)