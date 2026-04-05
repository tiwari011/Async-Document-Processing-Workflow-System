from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import Document
from app.config import settings
from app.routes.documents import router as document_router

app = FastAPI(
    title = "Async Document Processing API",
    description="Upload documents and process them in background",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# create upaload folder  
os.makedirs(settings.UPLOAD_DIR, exist_ok = True)

# create database tables
Base.metadata.create_all(bind=engine)

app.include_router(document_router, prefix="/api")
# check route
@app.get("/")
async def root():
    return {"message": "Async Document Processing API is running",
        "docs": "http://localhost:8001/docs"}