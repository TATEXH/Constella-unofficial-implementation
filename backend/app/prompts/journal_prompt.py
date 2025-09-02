"""ジャーナル生成プロンプト"""
from typing import Dict, Any

def create_journal_prompt(character: Dict[str, Any], theme: str) -> str:
    """ジャーナルエントリー生成用のプロンプトを作成"""
    
    # キャラクター属性を整形
    attributes_text = ""
    for attr in character.get("attributes", []):
        if attr["type"] == "description":
            attributes_text += f"説明: {attr['content']}\n"
        elif attr["type"] == "personality":
            attributes_text += f"性格: {attr['content']}\n"
        elif attr["type"] == "currentStatus":
            attributes_text += f"現在の状況: {attr['content']}\n"
        elif attr["type"] == "backstory":
            attributes_text += f"背景: {attr['content']}\n"
    
    # 関係性を整形
    relationships_text = ""
    for rel in character.get("relationships", []):
        relationships_text += f"- {rel['description']}\n"
    
    prompt = f"""あなたは高度に創造的な俳優です。以下のキャラクターを演じて、与えられたテーマについて日記を書いてください。

キャラクター名: {character['name']}

{attributes_text}

関係性:
{relationships_text if relationships_text else "なし"}

テーマ: {theme}

重要な指示:
1. 必ず「Dear Diary」（親愛なる日記へ）から始めること
2. キャラクターの内面的な思考や感情を深く掘り下げること
3. テーマに関連した個人的な体験や感想を詳細に記述すること
4. キャラクターの性格や背景と一貫性を保つこと
5. 500-800文字程度で記述すること

日記エントリー:"""
    
    return prompt