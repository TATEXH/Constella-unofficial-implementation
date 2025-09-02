"""コメント生成プロンプト"""
from typing import Dict, Any, List, Optional

def create_comment_prompt(
    character: Dict[str, Any],
    journal: Dict[str, Any],
    existing_comments: List[Dict[str, Any]],
    parent_comment_id: Optional[str] = None
) -> str:
    """コメント生成用のプロンプトを作成"""
    
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
    
    # 既存のコメントを整形
    comments_text = ""
    if existing_comments:
        comments_text = "\n既存のコメント:\n"
        for comment in existing_comments:
            # parent_comment_idが指定されている場合、そのコメントへの返信
            if parent_comment_id and str(comment.get("_id")) == parent_comment_id:
                comments_text += f"[返信対象] {comment.get('content', '')}\n"
            else:
                comments_text += f"- {comment.get('content', '')}\n"
    
    prompt = f"""あなたは創造的な俳優です。以下のキャラクターを演じて、ジャーナルエントリーに対してコメントを書いてください。

あなたが演じるキャラクター: {character['name']}

{attributes_text}

ジャーナルの内容:
{journal.get('content', '')}

{comments_text}

重要な指示:
1. キャラクターの性格や視点を維持すること
2. ジャーナルの内容に対して探索的で意味のある反応をすること
3. 既存のコメントがある場合は、会話の流れを考慮すること
4. 100-200文字程度で簡潔に記述すること
5. キャラクター同士の関係性を深める内容にすること

コメント:"""
    
    return prompt