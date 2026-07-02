from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

from routers import chat, engagement

app = FastAPI(title="PitchFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(engagement.router, prefix="/api/engagement", tags=["engagement"])

@app.get("/")
def root():
    return {"status": "PitchFlow API running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}
