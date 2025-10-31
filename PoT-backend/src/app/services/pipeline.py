# src/app/services/pipeline.py
import os
import subprocess
from pathlib import Path
from app.utils.mesh_utils import write_cube_stl
import time
import json

STORAGE_DIR = Path("storage")

def session_path(session_id: str) -> Path:
    return STORAGE_DIR / session_id

def check_tool_exists(cmd: str) -> bool:
    try:
        subprocess.run([cmd, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return True
    except Exception:
        return False

def run_colmap_sfm(image_dir: str, output_dir: str) -> bool:
    """
    Example COLMAP commands:
    colmap feature_extractor --database_path ... --image_path ...
    colmap exhaustive_matcher --database_path ...
    colmap mapper --database_path ... --image_path ... --output_path ...
    colmap model_converter --input_path ... --output_path ... --output_type PLY
    """
    try:
        # This is pseudocode — adjust paths for your COLMAP install
        db_path = os.path.join(output_dir, "database.db")
        sparse_dir = os.path.join(output_dir, "sparse")
        os.makedirs(sparse_dir, exist_ok=True)

        cmds = [
            ["colmap", "feature_extractor", "--database_path", db_path, "--image_path", image_dir],
            ["colmap", "exhaustive_matcher", "--database_path", db_path],
            ["colmap", "mapper", "--database_path", db_path, "--image_path", image_dir, "--output_path", sparse_dir],
            # Optionally: model conversion
            # ["colmap", "model_converter", "--input_path", sparse_dir + "/0", "--output_path", os.path.join(output_dir, "sparse.ply"), "--output_type", "PLY"]
        ]
        for c in cmds:
            subprocess.run(c, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print("[COLMAP ERROR]", e)
        return False

def run_meshroom(image_dir: str, output_dir: str) -> bool:
    """
    If meshroom is installed, can call meshroom_batch:
    meshroom_batch --input <image_dir> --output <output_dir>
    """
    try:
        cmd = ["meshroom_batch", "--input", image_dir, "--output", output_dir]
        subprocess.run(cmd, check=True)
        return True
    except Exception as e:
        print("[Meshroom ERROR]", e)
        return False

def run_instant_ngp(image_dir: str, output_dir: str) -> bool:
    """
    Example placeholder for calling instant-ngp or other NeRF tool.
    These tools vary; often you'll need to prepare dataset and call training, then mesh extraction.
    """
    try:
        # Placeholder: not implemented here
        return False
    except Exception as e:
        print("[NGP ERROR]", e)
        return False

def mock_pipeline(session_id: str) -> dict:
    """
    Fast fallback for dev: create an STL file (cube) and return path.
    """
    p = session_path(session_id)
    output_stl = p / "output_mock.stl"
    write_cube_stl(str(output_stl), size=1.0)
    return {"status": "done", "stl": str(output_stl)}

def run_pipeline_for_session(session_id: str, prefer="auto") -> dict:
    """
    Main orchestration.
    prefer: "colmap", "meshroom", "nerf", or "auto"
    Returns dict with status and output paths.
    """
    p = session_path(session_id)
    image_dir = str(p)
    output_dir = str(p / "pipeline_output")
    os.makedirs(output_dir, exist_ok=True)

    # check available tools
    has_colmap = check_tool_exists("colmap")
    has_meshroom = check_tool_exists("meshroom_batch") or check_tool_exists("alicevision_node")
    # for nerf: check presence of instant-ngp binary
    has_ngp = check_tool_exists("instant-ngp")  # example

    print(f"[pipeline] session={session_id} available_tools: colmap={has_colmap}, meshroom={has_meshroom}, ngp={has_ngp}")

    # try photogrammetry route
    if prefer in ("colmap", "auto") and has_colmap:
        ok = run_colmap_sfm(image_dir, output_dir)
        if ok:
            # convert model to stl if possible — placeholder
            out_stl = Path(output_dir) / "output_colmap_mock.stl"
            write_cube_stl(str(out_stl), size=1.0)
            return {"status": "done", "stl": str(out_stl)}
    if prefer in ("meshroom", "auto") and has_meshroom:
        ok = run_meshroom(image_dir, output_dir)
        if ok:
            out_stl = Path(output_dir) / "output_meshroom_mock.stl"
            write_cube_stl(str(out_stl), size=1.0)
            return {"status": "done", "stl": str(out_stl)}
    if prefer in ("nerf", "auto") and has_ngp:
        ok = run_instant_ngp(image_dir, output_dir)
        if ok:
            out_stl = Path(output_dir) / "output_ngp_mock.stl"
            write_cube_stl(str(out_stl), size=1.0)
            return {"status": "done", "stl": str(out_stl)}

    # fallback mock
    time.sleep(1)  # simulate processing delay
    return mock_pipeline(session_id)
