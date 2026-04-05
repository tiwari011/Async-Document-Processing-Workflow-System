import os
import json
import redis
from sqlalchemy.orm import Session
from fastapi import UploadFile
from app.models.document import Document
from app.config import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
def save_uploaded_file(file: UploadFile) -> tuple[str, int]:
  
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)


    contents = file.file.read()

    with open(file_path, "wb") as f:
        f.write(contents)

    file_size = len(contents)

    return file_path, file_size


def create_document_record(
    db: Session,
    file: UploadFile,
    file_path: str,
    file_size: int
) -> Document:

    document = Document(
        filename=file.filename,
        file_type=file.content_type,
        file_size=file_size,
        file_path=file_path,
        status="queued"
    )

    db.add(document)
    db.commit()
    db.refresh(document)


    return document


def get_all_documents(db: Session):
    return db.query(Document).order_by(Document.created_at.desc()).all()


def get_document_by_id(db: Session, document_id: int):
    return db.query(Document).filter(Document.id == document_id).first()

def publish_progress(document_id: int, event: str, progress: int, message: str):
    channel = f"document_progress:{document_id}"

    payload = {
        "document_id": document_id,
        "event": event,
        "progress": progress,
        "message": message
    }


    redis_client.publish(channel, json.dumps(payload))
def update_document_record(
    db: Session,
    document_id: int,
    extracted_title: str | None = None,
    extracted_category: str | None = None,
    extracted_summary: str | None = None,
    extracted_keywords: list[str] | None = None,
):
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        return None

    if document.is_finalized:
        raise ValueError("Finalized documents cannot be edited")

    document.extracted_title = extracted_title
    document.extracted_category = extracted_category
    document.extracted_summary = extracted_summary
    document.extracted_keywords = extracted_keywords

    document.processed_result = {
        "title": extracted_title,
        "category": extracted_category,
        "summary": extracted_summary,
        "keywords": extracted_keywords,
        "status": document.status,
    }

    db.commit()
    db.refresh(document)

    return document

def finalize_document_record(db: Session, document_id: int):
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        return None

    document.is_finalized = True
    db.commit()
    db.refresh(document)

    return document   
def retry_document_record(db: Session, document_id: int):
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        return None

    document.status = "queued"
    document.error_message = None
    db.commit()
    db.refresh(document)

    return document