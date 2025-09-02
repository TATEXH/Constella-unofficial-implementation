"""コメントモデル"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class CommentBase(BaseModel):
    """コメント基本モデル"""
    journal_id: str
    character_id: str
    content: str
    parent_comment_id: Optional[str] = None

class CommentCreate(CommentBase):
    """コメント作成モデル"""
    pass

class CommentUpdate(BaseModel):
    """コメント更新モデル"""
    content: Optional[str] = None

class CommentInDB(CommentBase):
    """データベース内のコメントモデル"""
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }

class Comment(CommentInDB):
    """APIレスポンス用コメントモデル"""
    pass

class CommentGenerateRequest(BaseModel):
    """コメント生成リクエスト"""
    journal_id: str
    character_id: str
    parent_comment_id: Optional[str] = None