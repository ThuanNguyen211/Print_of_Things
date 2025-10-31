# src/app/api/v1.py
from fastapi import APIRouter, BackgroundTasks, UploadFile, File, Form, HTTPException
from typing import List
import uuid, os, json
from app.services.storage import save_uploads_to_job  # your existing save function
from app.services.pipeline import run_pipeline_for_session, session_path
from fastapi.responses import FileResponse

router = APIRouter()

# upload (existing)
@router.post("/upload")
async def upload_images(
    files: List[UploadFile] = File(...),
    album_name: str = Form(...)
):
    job_id = f"session_{uuid.uuid4().hex[:8]}"
    saved = await save_uploads_to_job(job_id, files)

    # 🔹 Lưu metadata (tên bộ ảnh)
    meta_path = os.path.join("storage", job_id, "meta.json")
    os.makedirs(os.path.dirname(meta_path), exist_ok=True)
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({"album_name": album_name, "session_id": job_id}, f, ensure_ascii=False, indent=2)

    return {"message": "Upload saved", "session_id": job_id, "files": saved, "album_name": album_name}

# start processing (non-blocking using BackgroundTasks)
@router.post("/process/{session_id}")
async def start_process(session_id: str, background_tasks: BackgroundTasks):
    p = session_path(session_id)
    if not p.exists():
        raise HTTPException(status_code=404, detail="session not found")

    # create status file
    status_file = p / "status.json"
    status_file.write_text(json.dumps({"status": "queued"}))

    def _task(sid):
        try:
            status_file = session_path(sid) / "status.json"
            status_file.write_text(json.dumps({"status": "processing"}))
            result = run_pipeline_for_session(sid)
            # save result
            status_file.write_text(json.dumps({"status": "done", "result": result}))
        except Exception as e:
            status_file.write_text(json.dumps({"status": "error", "error": str(e)}))

    background_tasks.add_task(_task, session_id)
    return {"message": "Processing started", "session_id": session_id}

# status
@router.get("/status/{session_id}")
def get_status(session_id: str):
    p = session_path(session_id)
    status_file = p / "status.json"
    if not status_file.exists():
        return {"status": "not_started"}
    return json.loads(status_file.read_text())

# download STL
@router.get("/download/{session_id}")
def download_obj(session_id: str): # Đổi tên hàm cho rõ nghĩa
    p = session_path(session_id)
    out = p / "pipeline_output" / "output_mock.obj" # Đổi từ .stl sang .obj
    if not out.exists():
        for path in list(p.glob("**/*.obj")): # Đổi từ .stl sang .obj
            out = path
            break
    if not out.exists():
        raise HTTPException(status_code=404, detail="OBJ not found")
    return FileResponse(out, media_type="model/obj", filename=out.name)

@router.get("/list")
async def list_uploaded_sets():
    storage_dir = "storage"
    if not os.path.exists(storage_dir):
        return {"sets": []}

    datasets = []
    for folder in os.listdir(storage_dir):
        info_file = os.path.join(storage_dir, folder, "info.json")
        album_name = folder
        if os.path.exists(info_file):
            with open(info_file, "r") as f:
                info = json.load(f)
                album_name = info.get("album_name", folder)
        datasets.append({"session_id": folder, "album_name": album_name})

    return {"sets": datasets}

