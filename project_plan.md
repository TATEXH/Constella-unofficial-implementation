Constellaの実装に関する完全な計画書を以下に示します。

### 1\. プロジェクトの概要

このプロジェクトは、ストーリーライター向けのLLMベースのマルチエージェントツール「Constella」を構築することを目的としています。このツールは、キャラクターの創造と関係性の構築を支援するために、3つの主要なAI機能を提供します。

  * [cite\_start]**FRIENDS DISCOVERY**: 既存のキャラクターに関連する新しいキャラクターを3人生成します [cite: 6, 7]。
  * [cite\_start]**JOURNALS**: 複数のキャラクターが共通のテーマについて日記形式のエントリーを作成し、彼らの内面を探求します [cite: 8, 9]。
  * [cite\_start]**COMMENTS**: キャラクター同士が互いの日記に反応し、関係性の層を掘り下げます [cite: 10, 11]。

-----

### 2\. 技術スタック

  * [cite\_start]**フロントエンド**: React.js [cite: 607]
  * **バックエンド**: Python FastAPI と Uvicorn
  * [cite\_start]**データベース**: MongoDB [cite: 608]
  * [cite\_start]**ファイルストレージ**: Google Cloud Storage [cite: 608]
  * [cite\_start]**AIモデル**: 192.168.1.7で動いているollamaのgpt-oss:20Bモデル

-----

### 3\. 実装計画

#### 3.1 フェーズ1: 基本構造とUIの構築

  * **タスク**:
      * React.jsの環境をセットアップします。
      * FastAPIとUvicornのバックエンドを初期化します。
      * MongoDBとGoogle Cloud Storageへの接続を確立します。
      * [cite\_start]基本的なUIレイアウト（メインキャンバス、左・右サイドバー）を実装します [cite: 362]。
      * [cite\_start]`New Character Panel`と`Profile Panel`の基本フォーム（名前、画像アップロード）を作成します [cite: 385]。
      * キャラクターのCRUD（作成、読み取り、更新、削除）APIエンドポイントを実装します。

#### 3.2 フェーズ2: 主要機能の実装（Friends DiscoveryとJournals）

  * **タスク**:
      * **Friends Discovery**:
          * [cite\_start]`Profile Panel`に「Friends Discovery」ボタンを追加します [cite: 429]。
          * [cite\_start]リレーションシップのプロンプトを受け取る入力フィールドを実装します [cite: 466]。
          * [cite\_start]バックエンドに、プロンプトとキャラクターの属性情報から、3つのミニプロフィールを生成するAPIエンドポイントを実装します [cite: 466]。
          * [cite\_start]生成されたミニプロフィールをUIに表示する機能を実装します [cite: 466]。
          * [cite\_start]プロンプトの設計: 論文の指示に従い、静的指示、コンテキスト、出力形式（JSON）を定義します [cite: 619, 621, 622]。
      * **Journals**:
          * [cite\_start]`Journals Panel`を実装し、既存のエントリーのフィードと「New Journal」ボタンを追加します [cite: 486, 489, 490]。
          * [cite\_start]キャラクター選択フィールドとテーマ入力フィールドを持つ`New Journal`のUIを構築します [cite: 507]。
          * [cite\_start]バックエンドに、複数のキャラクターのジャーナルエントリーをテーマに基づいて生成するAPIエンドポイントを実装します [cite: 538]。
          * [cite\_start]生成されたジャーナルをUIに表示し、編集可能にします [cite: 540]。
          * [cite\_start]プロンプトの設計: キャラクターとしてロールプレイし、内面を深く掘り下げるためのルールを定義します [cite: 624, 626]。

#### 3.3 フェーズ3: Commentsと履歴機能、最終調整

  * **タスク**:
      * **Comments**:
          * [cite\_start]ジャーナルエントリーの下にコメント欄を実装します [cite: 574]。
          * [cite\_start]バックエンドに、ジャーナルエントリーに対するキャラクターのコメントを生成するAPIエンドポイントを実装します [cite: 576]。
          * [cite\_start]コメントスレッド（ジャーナル作者とコメント者が交互に返信する）をサポートするロジックを実装します [cite: 580]。
          * [cite\_start]プロンプトの設計: オープンエンドな反応と、スレッドの連続性を維持するためのルールを定義します [cite: 628, 629, 630]。
      * **履歴機能**:
          * [cite\_start]`Profile Panel`に`Journals History Tab`と`Comments History Tab`を実装し、キャラクターごとの履歴を表示します [cite: 484]。
      * **全体**:
          * データベーススキーマを確定し、全てのデータモデルが意図した機能をサポートできるようにします。
          * システム全体のテスト（単体テスト、統合テスト）を実施します。
          * デプロイメントの準備を行います。

-----

### 4\. プロンプトテンプレート

#### 4.1 FRIENDS DISCOVERY

  * [cite\_start]**役割**: プロのストーリーライター [cite: 1556]
  * [cite\_start]**目標**: `$`characterName\`と直接的につながる、現実的で強力な関係性を持つ3つの異なるキャラクターを作成する [cite: 1558]。
  * [cite\_start]**入力**: `$`characterName\`の属性、関係性のフレーズ [cite: 1559, 1562]。
  * [cite\_start]**出力形式**: JSONオブジェクト [cite: 1573, 1574, 1575]。
  * **例**:
      * [cite\_start]ユーザー入力: `Binggu's greatest enemy` [cite: 15, 592]
      * モデル出力（例）:
        [cite\_start]`{ "characters": [ { "name": "Metal Monster", "introduction": "Metal Monster is a cruel creature...", "backstory": "Metal Monster is a mechanical lifeform...", "my_relationship": "I am the ultimate enemy...", "your_relationship": "He is the one Binggu must have to grow stronger..." }, ... ] }` [cite: 16, 31, 32, 33, 34, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 592]

#### 4.2 JOURNALS

  * [cite\_start]**役割**: 創造的な俳優 [cite: 1597]
  * [cite\_start]**目標**: キャラクターの個性、行動、感情を維持しながら、提供されたテーマに基づいてジャーナルエントリーを作成する [cite: 1598, 1603]。
  * [cite\_start]**入力**: キャラクター名、属性、関係性の属性、ジャーナルのテーマ [cite: 1598]。
  * [cite\_start]**出力形式**: 「親愛なる日記帳へ（Dear Diary）」から始まる詳細なテキスト [cite: 1609]。
  * **例**:
      * [cite\_start]テーマ: `I tasted a sweet candy for the first time ever on Earth.` [cite: 1608]
      * モデル出力（例）:
        [cite\_start]`Dear Diary, ... I couldn't help but let out a cynical laugh when I realized that, unlike me, nothing here shares my metallic nature...` [cite: 1630, 1631, 1632, 1633]

#### 4.3 COMMENTS

  * [cite\_start]**役割**: 創造的な俳優 [cite: 1647]
  * [cite\_start]**目標**: 他のキャラクターのジャーナルエントリーに、自身のキャラクターの視点から自然なコメントを生成する [cite: 1660]。
  * [cite\_start]**入力**: キャラクター名、属性、関係性の属性、ジャーナルエントリーの内容、コメント履歴 [cite: 1649, 1650, 1653, 1668, 1677]。
  * [cite\_start]**出力形式**: 簡潔で意味のあるテキスト [cite: 1665]。
  * **例**:
      * [cite\_start]ジャーナルエントリーの内容: `I'm not quite sure how to describe it, but I put a small object in my mouth-something that was just... sweet.` [cite: 1631]
      * モデル出力（例）:
        `...But it's kind of strange, you said that one little candy felt more powerful than your whole kingdom? [cite_start]Makes me wonder if, like the bomb that made us crash onto Earth, there's something else hidden inside it too.` [cite: 1695, 1696]

-----

### 5\. 開発スケジュール（アジャイル）

| スプリント | 期間 | 主な目標 |
| :--- | :--- | :--- |
| **スプリント1** | 2週間 | - バックエンドとデータベースのセットアップ\<br\>- キャラクタープロフィール管理（CRUD）機能の実装\<br\>- 基本的なフロントエンドUIの構築\<br\>- **成果物**: 基本的なキャラクター作成・閲覧機能 |
| **スプリント2** | 2週間 | - Friends Discovery機能のバックエンドとフロントエンドの統合\<br\>- Journals機能のバックエンドとフロントエンドの統合\<br\>- **成果物**: Friends DiscoveryとJournalsの自動生成機能 |
| **スプリント3** | 2週間 | - Comments機能のバックエンドとフロントエンドの統合\<br\>- ジャーナル・コメント履歴機能の実装\<br\>- プロンプトの反復改善\<br\>- **成果物**: 主要機能の全てが動作するプロトタイプ |
| **スプリント4** | 2週間 | - 全体のテストとバグ修正\<br\>- パフォーマンス最適化とセキュリティ強化\<br\>- ドキュメント作成と最終的なデプロイメント\<br\>- **成果物**: 完成した製品版 |

-----

### 6\. リスクと軽減策

  * [cite\_start]**リスク**: LLMの出力が単調またはステレオタイプになる [cite: 1049, 1054]。
      * [cite\_start]**軽減策**: キャラクタープロフィールの詳細な入力の重要性をユーザーに伝え、プロンプトの設計を継続的に改善します [cite: 1055, 1056]。
  * [cite\_start]**リスク**: ユーザーがシステムの操作を煩雑に感じる（特にプロフィールの更新） [cite: 1058]。
      * [cite\_start]**軽減策**: 生成されたテキストの変更をキャラクタープロフィールに自動的に反映させる機能や、履歴管理機能の導入を検討します [cite: 1161, 1162]。
  * [cite\_start]**リスク**: ユーザーの創造性を損なう可能性がある [cite: 148]。
      * [cite\_start]**軽減策**: 中間的な素材（日記、コメント）を生成することで、ユーザーが自身の解釈や創造性を発揮できる余地を残します [cite: 154, 1128]。

この計画書は、論文で示された要件をすべて満たし、PythonとUvicornをバックエンドに採用することで、より堅牢でスケーラブルなシステムを構築するための明確な道筋を示しています。