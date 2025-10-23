"""AI プロバイダー抽象化レイヤー"""
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from app.core.config import settings, AIProvider


class BaseAIProvider(ABC):
    """AI プロバイダーの基底クラス"""

    @abstractmethod
    async def generate_text(self, prompt: str) -> str:
        """テキスト生成"""
        pass


class OllamaProvider(BaseAIProvider):
    """Ollama プロバイダー"""

    async def generate_text(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{settings.ollama_api_url}/api/generate",
                    json={
                        "model": settings.ollama_model,
                        "prompt": prompt,
                        "stream": False
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result.get("response", "")
            except httpx.RequestError as e:
                print(f"Ollama API request error: {e}")
                raise
            except Exception as e:
                print(f"Unexpected error: {e}")
                raise


class OpenAIProvider(BaseAIProvider):
    """OpenAI プロバイダー"""

    async def generate_text(self, prompt: str) -> str:
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key is not set")

        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json"
        }

        base_url = settings.openai_base_url or "https://api.openai.com/v1"

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"{base_url}/chat/completions",
                    headers=headers,
                    json={
                        "model": settings.openai_model,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ],
                        "max_tokens": 2000,
                        "temperature": 0.7
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result["choices"][0]["message"]["content"]
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    raise ValueError("OpenAI API rate limit exceeded. Please check your usage limits or wait before retrying.")
                elif e.response.status_code == 401:
                    raise ValueError("Invalid OpenAI API key. Please check your API key settings.")
                elif e.response.status_code == 404:
                    raise ValueError(f"Model '{settings.openai_model}' not found. Available models: gpt-4o-mini, gpt-4o, gpt-4-turbo, gpt-3.5-turbo")
                print(f"OpenAI API HTTP error: {e}")
                raise
            except httpx.RequestError as e:
                print(f"OpenAI API request error: {e}")
                raise
            except Exception as e:
                print(f"Unexpected error: {e}")
                raise


class AnthropicProvider(BaseAIProvider):
    """Anthropic Claude プロバイダー"""

    async def generate_text(self, prompt: str) -> str:
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key is not set")

        headers = {
            "x-api-key": settings.anthropic_api_key,
            "content-type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers=headers,
                    json={
                        "model": settings.anthropic_model,
                        "max_tokens": 2000,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result["content"][0]["text"]
            except httpx.HTTPStatusError as e:
                error_detail = ""
                try:
                    error_json = e.response.json()
                    error_detail = error_json.get("error", {}).get("message", str(error_json))
                except:
                    error_detail = e.response.text

                if e.response.status_code == 429:
                    raise ValueError("Anthropic API rate limit exceeded. Please check your usage limits or wait before retrying.")
                elif e.response.status_code == 401:
                    raise ValueError("Invalid Anthropic API key. Please check your API key settings.")
                elif e.response.status_code == 404:
                    raise ValueError(f"Anthropic API endpoint not found (404). This may indicate an invalid API key or account access issue. Available models: claude-sonnet-4-5-20250929, claude-3-5-sonnet-20241022. Details: {error_detail}")
                elif e.response.status_code == 400:
                    raise ValueError(f"Bad request to Anthropic API: {error_detail}. Available models: claude-sonnet-4-5-20250929, claude-3-5-sonnet-20241022")
                print(f"Anthropic API HTTP error: {e}, Details: {error_detail}")
                raise
            except httpx.RequestError as e:
                print(f"Anthropic API request error: {e}")
                raise
            except Exception as e:
                print(f"Unexpected error: {e}")
                raise


class GoogleProvider(BaseAIProvider):
    """Google Gemini プロバイダー"""

    async def generate_text(self, prompt: str) -> str:
        if not settings.google_api_key:
            raise ValueError("Google API key is not set")

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{settings.google_model}:generateContent?key={settings.google_api_key}",
                    json={
                        "contents": [
                            {
                                "parts": [
                                    {"text": prompt}
                                ]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 2000
                        }
                    }
                )
                response.raise_for_status()
                result = response.json()
                return result["candidates"][0]["content"]["parts"][0]["text"]
            except httpx.RequestError as e:
                print(f"Google API request error: {e}")
                raise
            except Exception as e:
                print(f"Unexpected error: {e}")
                raise


def get_ai_provider() -> BaseAIProvider:
    """現在の設定に基づいてAI プロバイダーを取得"""
    provider_map = {
        "ollama": OllamaProvider,
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "google": GoogleProvider
    }

    provider_class = provider_map.get(settings.ai_provider)
    if not provider_class:
        raise ValueError(f"Unsupported AI provider: {settings.ai_provider}")

    return provider_class()


async def generate_text(prompt: str) -> str:
    """統一API: テキスト生成"""
    provider = get_ai_provider()
    return await provider.generate_text(prompt)