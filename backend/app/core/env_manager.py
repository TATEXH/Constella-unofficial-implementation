""".envファイル管理クラス"""
import os
import re
from pathlib import Path
from typing import Dict, Optional


class EnvManager:
    """環境変数ファイル（.env）の読み書き管理"""

    def __init__(self, env_path: str = None):
        # プロジェクトルートの.envファイルを使用
        if env_path is None:
            # Dockerコンテナ内からプロジェクトルートの.envにアクセス
            self.env_path = Path("/app/../.env")
        else:
            self.env_path = Path(env_path)

    def read_env_file(self) -> str:
        """現在の.envファイル内容を読み取り"""
        if self.env_path.exists():
            try:
                with open(self.env_path, 'r', encoding='utf-8') as f:
                    return f.read()
            except IOError as e:
                print(f".envファイル読み取りエラー: {e}")
        return ""

    def write_env_file(self, content: str) -> bool:
        """新しい内容で.envファイルを書き込み"""
        try:
            # ディレクトリが存在しない場合は作成
            self.env_path.parent.mkdir(parents=True, exist_ok=True)

            with open(self.env_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except IOError as e:
            print(f".envファイル書き込みエラー: {e}")
            return False

    def update_env_variable(self, key: str, value: str) -> bool:
        """単一の環境変数を更新"""
        content = self.read_env_file()
        lines = content.split('\n')
        updated = False

        # 既存の変数を更新（コメントアウトされた行も含む）
        for i, line in enumerate(lines):
            if not line.strip():
                continue

            # コメントアウトされた変数も検出
            stripped_line = line.strip()
            if stripped_line.startswith('#'):
                # "# KEY=value" 形式を検出
                comment_content = stripped_line[1:].strip()
                if '=' in comment_content:
                    existing_key = comment_content.split('=')[0].strip()
                    if existing_key == key:
                        # コメントを外して値を更新
                        lines[i] = f"{key}={value}"
                        updated = True
                        break
            elif '=' in line:
                existing_key = line.split('=')[0].strip()
                if existing_key == key:
                    lines[i] = f"{key}={value}"
                    updated = True
                    break

        # 新しい変数として追加
        if not updated:
            # 関連する変数グループの後に追加
            insert_index = self._find_insert_position(lines, key)
            lines.insert(insert_index, f"{key}={value}")

        new_content = '\n'.join(lines)
        return self.write_env_file(new_content)

    def update_multiple_env_variables(self, variables: Dict[str, str]) -> bool:
        """複数の環境変数を一括更新"""
        content = self.read_env_file()
        lines = content.split('\n')

        # 各変数を更新
        for key, value in variables.items():
            updated = False

            # 既存の変数を更新（コメントアウトされた行も含む）
            for i, line in enumerate(lines):
                if not line.strip():
                    continue

                # コメントアウトされた変数も検出
                stripped_line = line.strip()
                if stripped_line.startswith('#'):
                    # "# KEY=value" 形式を検出
                    comment_content = stripped_line[1:].strip()
                    if '=' in comment_content:
                        existing_key = comment_content.split('=')[0].strip()
                        if existing_key == key:
                            # コメントを外して値を更新
                            lines[i] = f"{key}={value}"
                            updated = True
                            break
                elif '=' in line:
                    existing_key = line.split('=')[0].strip()
                    if existing_key == key:
                        lines[i] = f"{key}={value}"
                        updated = True
                        break

            # 新しい変数として追加
            if not updated:
                insert_index = self._find_insert_position(lines, key)
                lines.insert(insert_index, f"{key}={value}")

        new_content = '\n'.join(lines)
        return self.write_env_file(new_content)

    def _find_insert_position(self, lines: list, key: str) -> int:
        """新しい環境変数の挿入位置を決定"""
        # プロバイダーごとのグループ化
        provider_groups = {
            'AI_PROVIDER': 'ai',
            'OLLAMA_': 'ollama',
            'OPENAI_': 'openai',
            'ANTHROPIC_': 'anthropic',
            'GOOGLE_': 'google'
        }

        target_group = None
        for prefix, group in provider_groups.items():
            if key.startswith(prefix):
                target_group = group
                break

        if target_group:
            # 関連するグループの最後の行を見つける
            last_group_index = -1
            for i, line in enumerate(lines):
                if line.strip().startswith('#') or not line.strip():
                    continue

                if '=' in line:
                    existing_key = line.split('=')[0].strip()
                    for prefix, group in provider_groups.items():
                        if existing_key.startswith(prefix) and group == target_group:
                            last_group_index = i
                            break

            if last_group_index >= 0:
                return last_group_index + 1

        # デフォルトはファイルの末尾
        return len(lines)

    def get_env_variable(self, key: str) -> Optional[str]:
        """環境変数の値を取得"""
        content = self.read_env_file()
        lines = content.split('\n')

        for line in lines:
            if line.strip().startswith('#') or not line.strip():
                continue

            if '=' in line:
                existing_key, value = line.split('=', 1)
                if existing_key.strip() == key:
                    return value.strip()

        return None

    def remove_env_variable(self, key: str) -> bool:
        """環境変数を削除"""
        content = self.read_env_file()
        lines = content.split('\n')
        updated_lines = []

        for line in lines:
            if line.strip().startswith('#') or not line.strip():
                updated_lines.append(line)
                continue

            if '=' in line:
                existing_key = line.split('=')[0].strip()
                if existing_key != key:
                    updated_lines.append(line)
                # keyと一致する行は除外
            else:
                updated_lines.append(line)

        new_content = '\n'.join(updated_lines)
        return self.write_env_file(new_content)


# シングルトンインスタンス
env_manager = EnvManager("/app/.env")