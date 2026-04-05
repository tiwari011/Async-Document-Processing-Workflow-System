import json
import redis
import csv
import io
from fastapi.responses import StreamingResponse,JSONResponse, Response
from app.config import settings
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.document import (
    DocumentResponse,
    DocumentUpdateRequest,
    FinalizeResponse,
)
from app.services.document_service import (
    save_uploaded_file,
    create_document_record,
    get_all_documents,
    get_document_by_id,
    update_document_record,
    finalize_document_record,
    retry_document_record,
)
from app.workers.tasks import process_document

router = APIRouter(prefix="/documents", tags=["Documents"])
redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    file_path, file_size = save_uploaded_file(file)

    document = create_document_record(db, file, file_path, file_size)

    process_document.delay(document.id)
    
    return document


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(db: Session = Depends(get_db)):
    return get_all_documents(db)


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: int, db: Session = Depends(get_db)):
    document = get_document_by_id(db, document_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document

@router.get("/{document_id}/progress")
async def stream_progress(document_id: int):
    def event_generator():
        pubsub = redis_client.pubsub()
        channel = f"document_progress:{document_id}"
        pubsub.subscribe(channel)

        try:
            for message in pubsub.listen():
                if message["type"] == "message":
                    data = message["data"]
                    yield f"data: {data}\n\n"
        finally:
            pubsub.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    payload: DocumentUpdateRequest,
    db: Session = Depends(get_db)
):
    try:
        document = update_document_record(
            db=db,
            document_id=document_id,
            extracted_title=payload.extracted_title,
            extracted_category=payload.extracted_category,
            extracted_summary=payload.extracted_summary,
            extracted_keywords=payload.extracted_keywords,
        )

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        return document

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{document_id}/finalize", response_model=FinalizeResponse)
async def finalize_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = finalize_document_record(db, document_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "message": "Document finalized successfully",
        "document": document
    }
@router.get("/{document_id}/export/json")
async def export_document_json(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = get_document_by_id(db, document_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.is_finalized:
        raise HTTPException(
            status_code=400,
            detail="Only finalized documents can be exported"
        )

    data = {
        "id": document.id,
        "filename": document.filename,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "status": document.status,
        "extracted_title": document.extracted_title,
        "extracted_category": document.extracted_category,
        "extracted_summary": document.extracted_summary,
        "extracted_keywords": document.extracted_keywords,
        "processed_result": document.processed_result,
        "is_finalized": document.is_finalized,
    }

    return JSONResponse(
        content=data,
        headers={
            "Content-Disposition": f'attachment; filename="document_{document.id}.json"'
        }
    )
@router.get("/{document_id}/export/csv")
async def export_document_csv(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = get_document_by_id(db, document_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.is_finalized:
        raise HTTPException(
            status_code=400,
            detail="Only finalized documents can be exported"
        )

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "id",
        "filename",
        "file_type",
        "file_size",
        "status",
        "extracted_title",
        "extracted_category",
        "extracted_summary",
        "extracted_keywords",
        "is_finalized",
    ])

    writer.writerow([
        document.id,
        document.filename,
        document.file_type,
        document.file_size,
        document.status,
        document.extracted_title,
        document.extracted_category,
        document.extracted_summary,
        ", ".join(document.extracted_keywords or []),
        document.is_finalized,
    ])

    csv_content = output.getvalue()
    output.close()

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="document_{document.id}.csv"'
        }
    )
@router.post("/{document_id}/retry", response_model=DocumentResponse)
async def retry_document(
    document_id: int,
    db: Session = Depends(get_db)
):
    document = retry_document_record(db, document_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    process_document.delay(document.id)

    return document