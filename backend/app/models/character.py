"""キャラクターモデル"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class CharacterAttribute(BaseModel):
    """キャラクター属性"""
    type: str  # "description", "personality", "currentStatus", "backstory"
    content: str

class CharacterRelationship(BaseModel):
    """キャラクター関係性"""
    target_character_id: str
    description: str

class CharacterBase(BaseModel):
    """キャラクター基本モデル"""
    name: str
    image_path: Optional[str] = None
    attributes: List[CharacterAttribute] = []
    relationships: List[CharacterRelationship] = []

class CharacterCreate(CharacterBase):
    """キャラクター作成モデル"""
    pass

class CharacterUpdate(BaseModel):
    """キャラクター更新モデル"""
    name: Optional[str] = None
    image_path: Optional[str] = None
    attributes: Optional[List[CharacterAttribute]] = None
    relationships: Optional[List[CharacterRelationship]] = None

class CharacterInDB(CharacterBase):
    """データベース内のキャラクターモデル"""
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class Character(CharacterInDB):
    """APIレスポンス用キャラクターモデル"""
    pass