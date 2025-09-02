"""Friends Discovery生成プロンプト"""
from typing import Dict, Any

def create_discovery_prompt(character: Dict[str, Any], relationship_phrase: str) -> str:
    """Friends Discovery用のプロンプトを作成"""
    
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
    
    prompt = f"""あなたはプロのストーリーライターです。以下のキャラクターに関連する新しいキャラクターを3人作成してください。

既存のキャラクター: {character['name']}

{attributes_text}

関係性のフレーズ: {relationship_phrase}

指示:
1. 関係性のフレーズに基づいて、{character['name']}と強い関係性を持つ3人の異なるキャラクターを作成すること
2. 各キャラクターは独自の個性、背景、動機を持つこと
3. {character['name']}との双方向の関係性を詳細に記述すること
4. 創造的で興味深いキャラクターにすること

以下のJSON形式で出力してください:

{{
  "characters": [
    {{
      "name": "キャラクター名",
      "introduction": "キャラクターの簡単な紹介（50-100文字）",
      "backstory": "キャラクターの背景設定（100-200文字）",
      "my_relationship": "このキャラクターから{character['name']}への関係性の説明（50-100文字）",
      "your_relationship": "{character['name']}からこのキャラクターへの関係性の説明（50-100文字）"
    }},
    // 残り2人のキャラクター
  ]
}}

JSON出力:"""
    
    return prompt