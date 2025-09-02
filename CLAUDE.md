# Constella プロジェクト開発ガイド

## プロジェクト概要
Constellaは、AI支援によるクリエイティブライティングシステムです。キャラクター作成、ジャーナル生成、コメント機能を通じて、ストーリーテリングを支援します。

## 技術スタック
- **フロントエンド**: React.js
- **バックエンド**: Python FastAPI + Uvicorn
- **データベース**: MongoDB
- **ファイルストレージ**: ローカルストレージ（開発環境）
- **AIモデル**: Ollama (gpt-oss:20B)
- **開発環境**: Docker

## Ollama設定
- **エンドポイント**: http://192.168.1.7:11434
- **モデル**: gpt-oss:20B
- **API呼び出し例**:
```python
import httpx

async def call_ollama(prompt: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'http://192.168.1.7:11434/api/generate',
            json={
                'model': 'gpt-oss:20B',
                'prompt': prompt,
                'stream': False
            },
            timeout=60.0
        )
        return response.json()
```

## プロジェクト構成
```
Constella/
├── frontend/          # React.jsフロントエンド
│   ├── src/
│   │   ├── components/   # UIコンポーネント
│   │   ├── services/     # API通信サービス
│   │   └── utils/        # ユーティリティ関数
├── backend/           # Python FastAPIバックエンド
│   ├── app/
│   │   ├── api/          # APIエンドポイント
│   │   ├── models/       # Pydanticモデル・MongoDBスキーマ
│   │   ├── services/     # ビジネスロジック
│   │   ├── prompts/      # AIプロンプトテンプレート
│   │   └── core/         # 設定・データベース接続
├── docker-compose.yml # Docker設定
└── .env               # 環境変数
```

## 主要機能

### 1. Friends Discovery
既存キャラクターの関係性から新しいキャラクターを3体生成する機能。

### 2. Journals
キャラクターの視点から日記形式のエントリーを自動生成。「Dear Diary」で始まる形式。

### 3. Comments
ジャーナルエントリーに対して、他のキャラクターがコメントを生成する機能。

## 開発規約

### コーディング規約
- **言語**: 全てのコード、コメント、ドキュメントは日本語を使用
- **命名規則**: 
  - 変数名・関数名: camelCase（英語）
  - コンポーネント名: PascalCase（英語）
  - ファイル名: kebab-case（英語）
  - コメント・ドキュメント: 日本語

### Git コミットメッセージ
- 日本語で記述
- 形式: `[機能名] 変更内容`
- 例: `[Friends Discovery] キャラクター生成ロジックを実装`

### テスト実行
```bash
# フロントエンドテスト
cd frontend && npm test

# バックエンドテスト
cd backend && pytest

# リント実行（Python）
cd backend && ruff check .

# 型チェック（Python）
cd backend && mypy .
```

## データモデル

### Character (キャラクター)
```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CharacterAttribute(BaseModel):
    type: str  # "description", "personality", "currentStatus", "backstory"
    content: str

class CharacterRelationship(BaseModel):
    target_character_id: str
    description: str

class Character(BaseModel):
    id: Optional[str]
    name: str
    image_path: Optional[str]
    attributes: List[CharacterAttribute]
    relationships: List[CharacterRelationship]
    created_at: datetime
    updated_at: datetime
```

### Journal (ジャーナル)
```python
class Journal(BaseModel):
    id: Optional[str]
    character_id: str
    theme: str
    content: str
    created_at: datetime
    updated_at: datetime
    comment_ids: List[str] = []
```

### Comment (コメント)
```python
class Comment(BaseModel):
    id: Optional[str]
    journal_id: str
    character_id: str
    content: str
    parent_comment_id: Optional[str]  # 返信の場合
    created_at: datetime
    updated_at: datetime
```

## AIプロンプト設計

### Friends Discovery プロンプト
- 役割: プロのストーリーライター
- 入力: 関係フレーズ、既存キャラクター情報
- 出力: JSON形式で3つのキャラクタープロフィール

### Journals プロンプト
- 役割: 高度に創造的な俳優
- 入力: キャラクター属性、関係性、テーマ
- 出力: 「Dear Diary」から始まる日記エントリー

### Comments プロンプト
- 役割: キャラクターとして演技
- 入力: キャラクター属性、ジャーナル内容、既存コメント
- 出力: 探索的なコメント

## 環境変数 (.env)
```
MONGODB_URL=mongodb://admin:constella_password_2024@localhost:27017/constella?authSource=admin
OLLAMA_API_URL=http://192.168.1.7:11434
OLLAMA_MODEL=gpt-oss:20B
UPLOAD_DIR=/app/uploads
API_PORT=8000
```

## Docker起動コマンド
```bash
# 開発環境起動
docker-compose up -d

# ログ確認
docker-compose logs -f

# 環境停止
docker-compose down
```

## トラブルシューティング

### Ollamaへの接続エラー
- 192.168.1.7のOllamaサービスが起動していることを確認
- ファイアウォール設定を確認
- `curl http://192.168.1.7:11434/api/tags` でモデル一覧を確認
- Pythonコードでの接続テスト:
```python
import httpx
response = httpx.get('http://192.168.1.7:11434/api/tags')
print(response.json())
```

### MongoDBエラー
- Dockerコンテナが起動していることを確認
- データベース接続文字列を確認
- `docker exec -it constella-mongodb mongosh` で接続テスト

## 注意事項
- ステートレスな生成: キャラクターは以前の会話を記憶しない設計
- ローカルストレージ: 画像ファイルはローカルに保存
- セキュリティ: 本番環境では適切な認証・認可機構を実装すること