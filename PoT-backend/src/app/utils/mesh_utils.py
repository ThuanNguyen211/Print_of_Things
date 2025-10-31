from pathlib import Path
import numpy as np

def write_cube_stl(path: str, size=1.0):
    half = size / 2
    v = np.array([
        [-half, -half, -half],
        [ half, -half, -half],
        [ half,  half, -half],
        [-half,  half, -half],
        [-half, -half,  half],
        [ half, -half,  half],
        [ half,  half,  half],
        [-half,  half,  half],
    ])

    faces = [
        (0,1,2),(0,2,3),
        (4,5,6),(4,6,7),
        (0,1,5),(0,5,4),
        (2,3,7),(2,7,6),
        (1,2,6),(1,6,5),
        (0,3,7),(0,7,4)
    ]

    def normal(a, b, c):
        n = np.cross(b - a, c - a)
        norm = np.linalg.norm(n)
        return n / norm if norm != 0 else np.zeros(3)

    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        f.write("solid cube\n")
        for tri in faces:
            a, b, c = [v[i] for i in tri]   # ✅ Sửa chỗ này
            n = normal(a, b, c)
            f.write(f"  facet normal {n[0]} {n[1]} {n[2]}\n")
            f.write("    outer loop\n")
            for p in (a, b, c):
                f.write(f"      vertex {p[0]} {p[1]} {p[2]}\n")
            f.write("    endloop\n  endfacet\n")
        f.write("endsolid cube\n")
