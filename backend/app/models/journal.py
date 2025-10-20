"""ジャーナルモデル"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class JournalBase(BaseModel):
    """ジャーナル基本モデル"""
    character_id: str
    theme: str
    content: str

class JournalCreate(JournalBase):
    """ジャーナル作成モデル"""
    pass

class JournalUpdate(BaseModel):
    """ジャーナル更新モデル"""
    content: Optional[str] = None

class JournalInDB(JournalBase):
    """データベース内のジャーナルモデル"""
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    comment_ids: List[str] = []
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class Journal(JournalInDB):
    """APIレスポンス用ジャーナルモデル"""
    pass

class JournalGenerateRequest(BaseModel):
    """ジャーナル生成リクエスト"""
    character_ids: List[str]
    theme: str

class PromptPreviewRequest(BaseModel):
    """プロンプトプレビューリクエスト"""
    character_id: str
    theme: str