"""データベース接続管理"""
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging
from .config import settings

logger = logging.getLogger(__name__)

class DataBase:
    client: Optional[AsyncIOMotorClient] = None
    db = None

db = DataBase()

async def connect_to_mongo():
    """MongoDBに接続"""
    try:
        logger.info(f"MongoDBに接続中: {settings.mongodb_url}")
        db.client = AsyncIOMotorClient(settings.mongodb_url)
        db.db = db.client[settings.database_name]
        
        # 接続確認
        await db.client.server_info()
        logger.info("MongoDBに正常に接続しました")
    except Exception as e:
        logger.error(f"MongoDB接続エラー: {e}")
        raise

async def close_mongo_connection():
    """MongoDB接続を閉じる"""
    if db.client:
        db.client.close()
        logger.info("MongoDB接続を閉じました")

def get_database():
    """データベースインスタンスを取得"""
    return db.db

# コレクション名の定義
COLLECTIONS = {
    "characters": "characters",
    "journals": "journals",
    "comments": "comments"
}