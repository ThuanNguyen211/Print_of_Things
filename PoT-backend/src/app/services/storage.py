from pathlib import Path
import aiofiles
from fastapi import UploadFile
import os

BASE = Path("storage")

async def save_uploads_to_job(job_id: str, uploads: list[UploadFile]) -> list[str]:
    """
    Lưu nhiều file upload vào thư mục storage/{job_id}/
    """
    job_dir = BASE / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    saved_paths = []
    for i, upload in enumerate(uploads, start=1):
        ext = os.path.splitext(upload.filename)[1] or ".jpg"
        dest = job_dir / f"input_{i}{ext}"
        async with aiofiles.open(dest, "wb") as out_file:
            content = await upload.read()
            await out_file.write(content)
        saved_paths.append(str(dest.resolve()))
    return saved_paths
