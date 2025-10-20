"""設定管理API"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal
from app.core.config import settings, AIProvider
from app.core.env_manager import env_manager

router = APIRouter()


class AIProviderSettings(BaseModel):
    """AI プロバイダー設定"""
    provider: AIProvider

    # Ollama設定
    ollama_api_url: Optional[str] = None
    ollama_model: Optional[str] = None

    # OpenAI設定
    openai_api_key: Optional[str] = None
    openai_model: Optional[str] = None
    openai_base_url: Optional[str] = None

    # Anthropic設定
    anthropic_api_key: Optional[str] = None
    anthropic_model: Optional[str] = None

    # Google設定
    google_api_key: Optional[str] = None
    google_model: Optional[str] = None


class AIProviderInfo(BaseModel):
    """AI プロバイダー情報"""
    name: str
    display_name: str
    description: str
    requires_api_key: bool
    default_model: str
    available_models: list[str]


@router.get("/ai-providers")
async def get_available_providers() -> list[AIProviderInfo]:
    """利用可能なAI プロバイダー一覧を取得"""
    return [
        AIProviderInfo(
            name="ollama",
            display_name="Ollama",
            description="ローカルで実行するオープンソースLLM",
            requires_api_key=False,
            default_model="gpt-oss:20B",
            available_models=["gpt-oss:20B", "llama2", "codellama"]
        ),
        AIProviderInfo(
            name="openai",
            display_name="OpenAI",
            description="GPT-4, GPT-3.5等のAPIサービス",
            requires_api_key=True,
            default_model="gpt-4",
            available_models=["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"]
        ),
        AIProviderInfo(
            name="anthropic",
            display_name="Anthropic Claude",
            description="Claude 3 Sonnet, Haikuなど",
            requires_api_key=True,
            default_model="claude-3-sonnet-20240229",
            available_models=[
                "claude-3-opus-20240229",
                "claude-3-sonnet-20240229",
                "claude-3-haiku-20240307"
            ]
        ),
        AIProviderInfo(
            name="google",
            display_name="Google Gemini",
            description="Gemini Pro APIサービス",
            requires_api_key=True,
            default_model="gemini-pro",
            available_models=["gemini-pro", "gemini-pro-vision"]
        )
    ]


@router.get("/ai-provider")
async def get_current_provider() -> AIProviderSettings:
    """現在のAI プロバイダー設定を取得"""
    return AIProviderSettings(
        provider=settings.ai_provider,
        ollama_api_url=settings.ollama_api_url,
        ollama_model=settings.ollama_model,
        openai_api_key="***" if settings.openai_api_key else None,
        openai_model=settings.openai_model,
        openai_base_url=settings.openai_base_url,
        anthropic_api_key="***" if settings.anthropic_api_key else None,
        anthropic_model=settings.anthropic_model,
        google_api_key="***" if settings.google_api_key else None,
        google_model=settings.google_model
    )


@router.post("/ai-provider")
async def update_provider_settings(provider_settings: AIProviderSettings):
    """AI プロバイダー設定を更新"""
    try:
        # .envファイルに書き込む変数を収集
        env_updates = {}

        # AI プロバイダー選択
        env_updates["AI_PROVIDER"] = provider_settings.provider

        # Ollama設定
        if provider_settings.ollama_api_url:
            env_updates["OLLAMA_API_URL"] = provider_settings.ollama_api_url
        if provider_settings.ollama_model:
            env_updates["OLLAMA_MODEL"] = provider_settings.ollama_model

        # OpenAI設定
        if provider_settings.openai_api_key and provider_settings.openai_api_key != "***":
            env_updates["OPENAI_API_KEY"] = provider_settings.openai_api_key
        if provider_settings.openai_model:
            env_updates["OPENAI_MODEL"] = provider_settings.openai_model
        if provider_settings.openai_base_url:
            env_updates["OPENAI_BASE_URL"] = provider_settings.openai_base_url

        # Anthropic設定
        if provider_settings.anthropic_api_key and provider_settings.anthropic_api_key != "***":
            env_updates["ANTHROPIC_API_KEY"] = provider_settings.anthropic_api_key
        if provider_settings.anthropic_model:
            env_updates["ANTHROPIC_MODEL"] = provider_settings.anthropic_model

        # Google設定
        if provider_settings.google_api_key and provider_settings.google_api_key != "***":
            env_updates["GOOGLE_API_KEY"] = provider_settings.google_api_key
        if provider_settings.google_model:
            env_updates["GOOGLE_MODEL"] = provider_settings.google_model

        # .envファイルに一括書き込み
        success = env_manager.update_multiple_env_variables(env_updates)

        if not success:
            raise HTTPException(status_code=500, detail="設定ファイルの更新に失敗しました")

        # メモリ内の設定も更新（即座反映のため）
        settings.ai_provider = provider_settings.provider
        if provider_settings.ollama_api_url:
            settings.ollama_api_url = provider_settings.ollama_api_url
        if provider_settings.ollama_model:
            settings.ollama_model = provider_settings.ollama_model
        if provider_settings.openai_api_key and provider_settings.openai_api_key != "***":
            settings.openai_api_key = provider_settings.openai_api_key
        if provider_settings.openai_model:
            settings.openai_model = provider_settings.openai_model
        if provider_settings.openai_base_url:
            settings.openai_base_url = provider_settings.openai_base_url
        if provider_settings.anthropic_api_key and provider_settings.anthropic_api_key != "***":
            settings.anthropic_api_key = provider_settings.anthropic_api_key
        if provider_settings.anthropic_model:
            settings.anthropic_model = provider_settings.anthropic_model
        if provider_settings.google_api_key and provider_settings.google_api_key != "***":
            settings.google_api_key = provider_settings.google_api_key
        if provider_settings.google_model:
            settings.google_model = provider_settings.google_model

        return {
            "message": "設定を更新しました",
            "note": "設定は.envファイルに保存され、アプリ再起動後も維持されます"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"設定の更新に失敗しました: {str(e)}")


@router.post("/ai-provider/test")
async def test_ai_provider(test_settings: Optional[AIProviderSettings] = None):
    """AI プロバイダーの接続テスト

    test_settingsが指定されている場合、その設定でテスト
    指定されていない場合、現在の設定でテスト
    """
    try:
        # テスト用の設定を一時的に適用
        if test_settings:
            # 元の設定を保存
            original_provider = settings.ai_provider
            original_ollama_url = settings.ollama_api_url
            original_ollama_model = settings.ollama_model
            original_openai_key = settings.openai_api_key
            original_openai_model = settings.openai_model
            original_openai_base_url = settings.openai_base_url
            original_anthropic_key = settings.anthropic_api_key
            original_anthropic_model = settings.anthropic_model
            original_google_key = settings.google_api_key
            original_google_model = settings.google_model

            # テスト用設定を一時適用
            settings.ai_provider = test_settings.provider
            if test_settings.ollama_api_url:
                settings.ollama_api_url = test_settings.ollama_api_url
            if test_settings.ollama_model:
                settings.ollama_model = test_settings.ollama_model
            if test_settings.openai_api_key and test_settings.openai_api_key != "***":
                settings.openai_api_key = test_settings.openai_api_key
            if test_settings.openai_model:
                settings.openai_model = test_settings.openai_model
            if test_settings.openai_base_url:
                settings.openai_base_url = test_settings.openai_base_url
            if test_settings.anthropic_api_key and test_settings.anthropic_api_key != "***":
                settings.anthropic_api_key = test_settings.anthropic_api_key
            if test_settings.anthropic_model:
                settings.anthropic_model = test_settings.anthropic_model
            if test_settings.google_api_key and test_settings.google_api_key != "***":
                settings.google_api_key = test_settings.google_api_key
            if test_settings.google_model:
                settings.google_model = test_settings.google_model

        try:
            from app.services.ai_provider import generate_text

            test_prompt = "こんにちは。簡潔に挨拶を返してください。"
            response = await generate_text(test_prompt)

            return {
                "success": True,
                "provider": settings.ai_provider,
                "response": response[:100] + ("..." if len(response) > 100 else "")
            }

        finally:
            # 元の設定に戻す
            if test_settings:
                settings.ai_provider = original_provider
                settings.ollama_api_url = original_ollama_url
                settings.ollama_model = original_ollama_model
                settings.openai_api_key = original_openai_key
                settings.openai_model = original_openai_model
                settings.openai_base_url = original_openai_base_url
                settings.anthropic_api_key = original_anthropic_key
                settings.anthropic_model = original_anthropic_model
                settings.google_api_key = original_google_key
                settings.google_model = original_google_model

    except Exception as e:
        return {
            "success": False,
            "provider": settings.ai_provider if not test_settings else test_settings.provider,
            "error": str(e)
        }