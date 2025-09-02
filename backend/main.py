"""
Constella バックエンドアプリケーション
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.api import characters, journals, comments, discovery
from app.core.database import connect_to_mongo, close_mongo_connection

# 環境変数を読み込み
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    # 起動時
    await connect_to_mongo()
    yield
    # 終了時
    await close_mongo_connection()

# FastAPIアプリケーションのインスタンス作成
app = FastAPI(
    title="Constella API",
    description="ストーリーライター向けのLLMベースのマルチエージェントツール",
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Reactフロントエンドのオリジン
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルートエンドポイント
@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "Constella API",
        "version": "1.0.0",
        "status": "running"
    }

# ヘルスチェックエンドポイント
@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy"}

# APIルーターを登録
app.include_router(characters.router, prefix="/api/characters", tags=["characters"])
app.include_router(journals.router, prefix="/api/journals", tags=["journals"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(discovery.router, prefix="/api/discovery", tags=["discovery"])