"""画像配信用エンドポイント"""
from fastapi import APIRouter
from fastapi.responses import FileResponse
import os
from app.core.config import settings

router = APIRouter()

@router.get("/{filename}")
async def get_upload_file(filename: str):
    """アップロードされたファイルを取得"""
    file_path = os.path.join(settings.upload_dir, filename)
    
    if not os.path.exists(file_path):
        return FileResponse(
            path=os.path.join(os.path.dirname(__file__), "../../../frontend/public/placeholder.png"),
            media_type="image/png"
        )
    
    # MIMEタイプを判定
    ext = os.path.splitext(filename)[1].lower()
    media_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }
    media_type = media_types.get(ext, 'application/octet-stream')
    
    return FileResponse(path=file_path, media_type=media_type)