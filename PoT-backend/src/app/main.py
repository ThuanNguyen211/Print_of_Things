from fastapi import FastAPI
from app.api.v1 import router as v1_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PoT Backend")

# 🔓 Cho phép CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hoặc ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include router
app.include_router(v1_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "PoT Backend is running!"}
