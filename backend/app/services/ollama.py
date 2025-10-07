"""AI API連携サービス (旧Ollama専用 -> 汎用AI対応)"""
import json
from typing import Dict, List, Any, Optional
from app.services.ai_provider import generate_text
from app.prompts import journal_prompt, comment_prompt, friends_discovery_prompt

async def call_ollama(prompt: str) -> str:
    """AI APIを呼び出し (後方互換性のため関数名維持)"""
    return await generate_text(prompt)

async def generate_journal(character: Dict[str, Any], theme: str) -> str:
    """ジャーナルエントリーを生成"""
    # プロンプトを構築
    prompt = journal_prompt.create_journal_prompt(character, theme)
    
    # Ollamaを呼び出し
    response = await call_ollama(prompt)
    
    # "Dear Diary"で始まることを確認
    if not response.strip().startswith("Dear Diary"):
        response = "Dear Diary,\n\n" + response
    
    return response

async def generate_comment(
    character: Dict[str, Any],
    journal: Dict[str, Any],
    existing_comments: List[Dict[str, Any]],
    parent_comment_id: Optional[str] = None
) -> str:
    """コメントを生成"""
    # プロンプトを構築
    prompt = comment_prompt.create_comment_prompt(
        character, journal, existing_comments, parent_comment_id
    )
    
    # Ollamaを呼び出し
    response = await call_ollama(prompt)
    
    return response.strip()

async def generate_friends_discovery(
    character: Dict[str, Any],
    relationship_phrase: str
) -> List[Dict[str, Any]]:
    """Friends Discoveryで新しいキャラクターを生成"""
    # プロンプトを構築
    prompt = friends_discovery_prompt.create_discovery_prompt(character, relationship_phrase)
    
    # Ollamaを呼び出し
    response = await call_ollama(prompt)
    
    # JSON形式でパース
    try:
        # レスポンスからJSON部分を抽出
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            return result.get("characters", [])
    except json.JSONDecodeError:
        # JSONパースに失敗した場合はデフォルトの構造を返す
        pass
    
    # フォールバック: 基本的な構造を返す
    return [
        {
            "name": "新キャラクター1",
            "introduction": "キャラクターの紹介",
            "backstory": "キャラクターの背景",
            "my_relationship": f"{character['name']}との関係",
            "your_relationship": f"{character['name']}から見た関係"
        }
    ]