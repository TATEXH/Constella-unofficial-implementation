# Constella

AI支援によるクリエイティブライティングシステム

## 概要

Constellaは、複数のAIプロバイダー（Ollama、OpenAI GPT-4、Anthropic Claude、Google Gemini）を活用してストーリーテリングを支援するWebアプリケーションです。キャラクター作成、ジャーナル生成、コメント機能を通じて、創作活動を効率化し、新しいアイデアの発見を促進します。

**⚠️ 重要事項:** 本プロジェクトは学術研究論文の概念実証として開発されており、プルリクエストやIssuesの受け付けは行っておりません。MITライセンスの下で自由にご利用いただけますが、サポートや継続的な開発は予定されていません。

### 📄 学術論文

このプロジェクトは以下の研究論文に基づいて実装されています：

**"Constella: A Multi-LLM, Multi-Agent Architecture for Automated Story Generation"**
- **arXiv論文**: [https://www.arxiv.org/abs/2507.05820](https://www.arxiv.org/abs/2507.05820)
- **概要**: マルチLLM・マルチエージェントアーキテクチャを用いた自動ストーリー生成システムの研究
- **主要機能**: Friends Discovery、Journals、Comments の3つのAI支援機能

本実装では論文で提案されたコンセプトを基に、実用的なWebアプリケーションとして開発されています。

**📌 プロジェクトの位置づけ:**
- 学術研究の概念実証（Proof of Concept）として実装
- 論文で提案された技術的アプローチの実証
- 商用製品や継続的なサービス提供を目的としない
- コミュニティによる独自フォーク・改良を歓迎

## 主な機能

### 🎭 キャラクター管理
- **キャラクター作成・編集・削除**
- **画像アップロード**（プロフィール画像の設定）
- **属性管理**（詳細な設定項目）
- **関係性管理**（キャラクター同士のつながり）
- **インポート/エクスポート**（JSON形式でのバックアップ・共有）

### 🤖 AI生成機能
- **Friends Discovery**: 既存キャラクターから新しい関連キャラクターを3体自動生成
- **ジャーナル生成**: キャラクターの視点から日記形式のエントリーを生成
- **コメント生成**: ジャーナルに対する他キャラクターからのコメントを生成
- **スレッド機能**: コメントの返信・階層表示
- **マルチAI対応**: Ollama、OpenAI、Anthropic、Googleの各プロバイダーから選択可能

### 💬 インタラクション機能
- **コメントスレッド**: 返信機能付きの階層コメント表示
- **履歴管理**: キャラクター別のジャーナル・コメント履歴
- **リアルタイム更新**: 生成処理中のローディング表示

## キャラクター属性の詳細

キャラクター作成時に設定できる属性の種類と記入例：

### 📝 description（説明・外見）
キャラクターの基本的な紹介や外見的特徴

**例:**
```
元気いっぱいの17歳の高校生。黒髪のショートカットで、いつも明るい笑顔を浮かべている。
```

**詳細な例:**
```
25歳の図書館司書。肩まで伸びた栗色の髪を後ろで束ね、丸縁の眼鏡をかけている。
穏やかな表情だが、好きな本の話になると目が輝く。身長は160cm程度で、
落ち着いた色合いのカーディガンを好んで着用している。
```

### 💭 personality（性格・内面）
キャラクターの性格、思考パターン、価値観

**例:**
```
好奇心旺盛で行動力がある。時々おっちょこちょいだが、困っている人を見ると放っておけない性格。
```

**詳細な例:**
```
内向的で慎重な性格。新しい環境に馴染むのに時間がかかるが、一度打ち解けると
深い信頼関係を築く。完璧主義的な一面があり、責任感が強い。
読書と静かな音楽を愛し、人混みよりも少数の親しい友人との時間を大切にする。
```

### 🌟 currentStatus（現在の状況・状態）
現時点でのキャラクターの置かれた状況や抱えている問題

**例:**
```
大学受験を控えており、将来の進路について悩んでいる。部活動と勉強の両立に苦労中。
```

**詳細な例:**
```
転職活動中で新しい職場を探している。前職での人間関係のストレスから
一時的に実家に戻って心を休めている状態。新しいスタートを切りたい気持ちと
不安な気持ちが入り混じっている。週末は地域のボランティア活動に参加して
社会とのつながりを保っている。
```

### 📚 backstory（背景・過去）
キャラクターの生い立ちや重要な過去の出来事

**例:**
```
幼少期に両親を亡くし、祖母に育てられた。祖母の影響で料理が得意になり、人を喜ばせることに生きがいを感じる。
```

**詳細な例:**
```
東京で生まれ育ったが、10歳の時に父親の仕事の都合で地方の小さな町に引っ越した。
最初は都会との違いに戸惑ったが、地域の図書館で出会った年配の司書に影響を受け、
本の世界に深く魅力を感じるようになった。高校卒業後は都市部の大学で文学を学び、
卒業後は故郷の町に戻って図書館司書として働いている。
```

## 関係性の設定

キャラクター同士の関係性を設定することで、より豊かなストーリー展開が可能になります。

### Friends Discovery機能
既存のキャラクターに「関係性のフレーズ」を入力することで、AI が関連する新しいキャラクターを3体生成します。

**関係性フレーズの例:**
- `最大の敵`
- `幼馴染`
- `憧れの先輩`
- `ライバル関係`
- `師弟関係`
- `兄弟のような存在`
- `秘密を共有する仲間`

## 技術スタック

### フロントエンド
- **React.js** - UI構築
- **Bootstrap** - スタイリング
- **Axios** - API通信

### バックエンド
- **FastAPI** - Webフレームワーク
- **Python 3.11** - プログラミング言語
- **MongoDB** - データベース
- **Motor** - 非同期MongoDBドライバー
- **Pydantic** - データ検証

### AI・その他
- **マルチAIプロバイダー対応**:
  - **Ollama** - ローカルLLM実行環境
  - **OpenAI API** - GPT-4、GPT-3.5等
  - **Anthropic API** - Claude 3 Sonnet、Opus等
  - **Google AI API** - Gemini Pro等
- **Docker** - コンテナ化
- **uvicorn** - ASGI サーバー

## セットアップ

### 必要な環境
- Docker & Docker Compose
- 以下のいずれかのAIプロバイダー:
  - **Ollama**（ローカル実行、APIキー不要）
  - **OpenAI API**（GPT-4等、APIキー必要）
  - **Anthropic API**（Claude等、APIキー必要）
  - **Google AI API**（Gemini等、APIキー必要）

### 起動手順

1. **リポジトリのクローン**
```bash
git clone https://github.com/TATEXH/Constella-unofficial-implementation.git
cd Constella
```

2. **環境変数の設定**
```bash
# .envファイルを作成
cp .env.example .env

# 必要に応じて設定を編集
```

3. **Docker環境の起動**
```bash
docker-compose up -d
```

4. **アクセス**
- **フロントエンド**: http://localhost:3000
- **バックエンド API**: http://localhost:8000
- **MongoDB管理**: http://localhost:8081

5. **AI プロバイダー設定**
   - フロントエンドの左サイドバーの⚙️ボタンをクリック
   - 使用したいAIプロバイダーを選択して設定

### 環境変数

```env
# 基本設定
MONGODB_URL=mongodb://admin:constella_password_2024@localhost:27017/constella?authSource=admin
UPLOAD_DIR=/app/uploads
API_PORT=8000

# AI プロバイダー選択
AI_PROVIDER=ollama

# Ollama設定（デフォルト）
OLLAMA_API_URL=http://192.168.1.7:11434
OLLAMA_MODEL=gpt-oss:20B

# OpenAI設定（オプション）
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic設定（オプション）
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Google AI設定（オプション）
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_MODEL=gemini-pro
```

## AI プロバイダー設定詳細

### 🏠 Ollama（ローカル実行）

**特徴**:
- APIキー不要
- ローカルでプライベートに実行
- インターネット接続不要（初回モデルダウンロード後）

**設定手順**:
1. [Ollama公式サイト](https://ollama.com/)からインストール
2. モデルをダウンロード:
   ```bash
   ollama pull gpt-oss:20B
   # または他のモデル
   ollama pull llama2
   ollama pull codellama
   ```
3. Ollamaサーバーを起動:
   ```bash
   ollama serve
   ```
4. 設定画面でOllamaを選択
5. API URLとモデルを設定（デフォルト: http://localhost:11434）

**おすすめモデル**:
- `gpt-oss:20B` - 高品質なテキスト生成
- `llama2` - 汎用的な用途
- `codellama` - コード生成に特化

---

### 🌐 OpenAI API（GPT-4、GPT-3.5）

**特徴**:
- 最高品質のテキスト生成
- 豊富なモデル選択肢
- 使用量に応じた課金制

**設定手順**:
1. [OpenAI Platform](https://platform.openai.com/)でアカウント作成
2. 支払い方法を設定（初回$5程度の入金推奨）
3. 「API keys」セクションで新しいAPIキーを作成
4. 設定画面でOpenAIを選択
5. `sk-`で始まるAPIキーを入力
6. 使用したいモデルを選択

**利用可能モデル**:
- `gpt-4` - 最高性能、複雑な推論が得意
- `gpt-4-turbo` - GPT-4の高速版
- `gpt-3.5-turbo` - コストパフォーマンスが良い

**料金目安**:
- GPT-4: 1000トークンあたり約$0.03
- GPT-3.5-turbo: 1000トークンあたり約$0.001

---

### 🤖 Anthropic API（Claude）

**特徴**:
- 安全性を重視した設計
- 長い文脈を理解可能
- 創作・分析に優れた性能

**設定手順**:
1. [Anthropic Console](https://console.anthropic.com/)でアカウント作成
2. 支払い方法を設定
3. 「API Keys」でAPIキーを作成
4. 設定画面でAnthropicを選択
5. `sk-ant-`で始まるAPIキーを入力
6. 使用したいモデルを選択

**利用可能モデル**:
- `claude-3-opus-20240229` - 最高性能モデル
- `claude-3-sonnet-20240229` - バランス型
- `claude-3-haiku-20240307` - 高速・低コスト

**料金目安**:
- Claude 3 Opus: 1000トークンあたり約$0.015
- Claude 3 Sonnet: 1000トークンあたり約$0.003
- Claude 3 Haiku: 1000トークンあたり約$0.00025

---

### 🔍 Google AI API（Gemini）

**特徴**:
- Googleの最新AI技術
- マルチモーダル対応
- 競合他社より低価格

**設定手順**:
1. [Google AI Studio](https://aistudio.google.com/)にアクセス
2. Googleアカウントでログイン
3. 「Get API key」でAPIキーを作成
4. 設定画面でGoogleを選択
5. `AIza`で始まるAPIキーを入力
6. 使用したいモデルを選択

**利用可能モデル**:
- `gemini-pro` - テキスト生成に最適
- `gemini-pro-vision` - 画像も理解可能

**料金目安**:
- Gemini Pro: 1000トークンあたり約$0.0005（非常に安価）

---

### 💡 プロバイダー選択のガイド

**初心者・プライバシー重視**:
→ **Ollama** がおすすめ
- APIキー不要
- ローカル実行でプライベート
- 無料で利用可能

**最高品質を求める場合**:
→ **OpenAI GPT-4** または **Anthropic Claude 3 Opus**
- 創作の質を最優先
- 予算に余裕がある場合

**コストパフォーマンス重視**:
→ **Google Gemini Pro** または **OpenAI GPT-3.5-turbo**
- 低コストで高品質
- 大量の生成を行う場合

**長文・詳細な創作**:
→ **Anthropic Claude 3**
- 長い文脈を理解
- 安全で一貫性のある創作

### 🔧 設定画面の使い方

1. **左サイドバーの⚙️ボタン**をクリック
2. **プロバイダーカード**から使用したいAIを選択
3. **API設定**を入力（Ollama以外はAPIキーが必要）
4. **接続テスト**ボタンで動作確認
5. **設定を保存**で確定

## API エンドポイント

### キャラクター関連
- `GET /api/characters/` - キャラクター一覧取得
- `POST /api/characters/` - キャラクター作成
- `PUT /api/characters/{id}` - キャラクター更新
- `DELETE /api/characters/{id}` - キャラクター削除
- `POST /api/characters/{id}/image` - 画像アップロード
- `GET /api/characters/export/all` - 全キャラクターエクスポート
- `POST /api/characters/import` - キャラクターインポート

### ジャーナル関連
- `GET /api/journals/` - ジャーナル一覧取得
- `POST /api/journals/generate` - ジャーナル生成
- `PUT /api/journals/{id}` - ジャーナル編集
- `DELETE /api/journals/{id}` - ジャーナル削除

### コメント関連
- `GET /api/comments/journal/{journal_id}` - ジャーナルのコメント取得
- `POST /api/comments/generate` - コメント生成
- `DELETE /api/comments/{id}` - コメント削除

### AI生成関連
- `POST /api/discovery/friends` - Friends Discovery実行

### 設定関連
- `GET /api/settings/ai-providers` - 利用可能AIプロバイダー一覧取得
- `GET /api/settings/ai-provider` - 現在のAIプロバイダー設定取得
- `POST /api/settings/ai-provider` - AIプロバイダー設定更新
- `POST /api/settings/ai-provider/test` - AIプロバイダー接続テスト

## 開発情報

### テスト実行
```bash
# フロントエンドテスト
cd frontend && npm test

# バックエンドテスト
cd backend && pytest

# リント実行
cd backend && ruff check .

# 型チェック
cd backend && mypy .
```

### コーディング規約
- **日本語**: コメント・ドキュメントは日本語
- **命名規則**:
  - 変数・関数: camelCase
  - コンポーネント: PascalCase
  - ファイル: kebab-case

### コミットメッセージ
```
[機能名] 変更内容

例: [キャラクター管理] 属性編集機能を追加
```

## 引用・参考文献

このプロジェクトの実装は以下の研究論文に基づいています：

```bibtex
@article{constella2024,
  title={Constella: A Multi-LLM, Multi-Agent Architecture for Automated Story Generation},
  author={[著者名]},
  journal={arXiv preprint arXiv:2507.05820},
  year={2024},
  url={https://www.arxiv.org/abs/2507.05820}
}
```

**論文概要:**
マルチLLM・マルチエージェントアーキテクチャを用いた自動ストーリー生成システムの研究。Friends Discovery、Journals、Commentsの3つの主要機能を通じて、創作者の創造性を支援するフレームワークを提案。

## ライセンス

MIT License

## 貢献・サポートについて

**重要なお知らせ:**
- 本プロジェクトは現在、**プルリクエストを受け付けておりません**
- **Issues（イシュー）への対応予定もございません**
- 本実装は学術研究論文の概念実証として開発されたものです

**コードの利用について:**
- MITライセンスの下、自由にフォーク・改変・利用していただけます
- 独自の改良や機能追加は、各自のフォークリポジトリで行ってください
- バグ報告や機能要望は参考として拝見いたしますが、対応をお約束するものではありません

**代替案:**
- バグ修正や機能追加をご希望の場合は、フォークして独自に開発してください
- コミュニティ主導のフォークプロジェクトの立ち上げを歓迎します

---

**Constella** - AI と共に創る、新しいストーリーテリング体験