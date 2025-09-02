"""アプリケーション設定"""
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # MongoDB設定
    mongodb_url: str = "mongodb://admin:constella_password_2024@mongodb:27017/constella?authSource=admin"
    database_name: str = "constella"
    
    # Ollama API設定
    ollama_api_url: str = "http://192.168.1.7:11434"
    ollama_model: str = "gpt-oss:20B"
    
    # ファイルアップロード設定
    upload_dir: str = "/app/uploads"
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    
    # API設定
    api_port: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# シングルトンインスタンス
settings = Settings()