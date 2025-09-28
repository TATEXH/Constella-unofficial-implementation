"""アプリケーション設定"""
from pydantic_settings import BaseSettings
from typing import Optional, Literal

AIProvider = Literal["ollama", "openai", "anthropic", "google"]

class Settings(BaseSettings):
    """アプリケーション設定"""

    # MongoDB設定
    mongodb_url: str = "mongodb://admin:constella_password_2024@mongodb:27017/constella?authSource=admin"
    database_name: str = "constella"

    # AI プロバイダー設定
    ai_provider: AIProvider = "ollama"

    # Ollama API設定
    ollama_api_url: str = "http://192.168.1.7:11434"
    ollama_model: str = "gpt-oss:20B"

    # OpenAI API設定
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4"
    openai_base_url: Optional[str] = None

    # Anthropic API設定
    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-3-sonnet-20240229"

    # Google AI API設定
    google_api_key: Optional[str] = None
    google_model: str = "gemini-pro"

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