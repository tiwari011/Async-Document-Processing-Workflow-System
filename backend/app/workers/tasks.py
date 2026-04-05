import time
from sqlalchemy.orm import Session

from app.workers.celery_app import celery
from app.database import SessionLocal
from app.models.document import Document
from app.services.document_service import publish_progress


@celery.task
def process_document(document_id: int):
    db: Session = SessionLocal()

    try:
        document = db.query(Document).filter(Document.id == document_id).first()

        if not document:
            return f"Document with id {document_id} not found"
    
        # Event 1: job started
        publish_progress(
            document_id=document_id,
            event="job_started",
            progress=0,
            message="Background job started"
        )

        document.status = "processing"
        db.commit()
         # Event 2: parsing started
        publish_progress(
            document_id=document_id,
            event="document_parsing_started",
            progress=25,
            message="Parsing document started"
        )

        time.sleep(3)
         # Event 3: parsing completed
        publish_progress(
            document_id=document_id,
            event="document_parsing_completed",
            progress=50,
            message="Parsing document completed"
        )
          
          # Event 4: extraction started
        publish_progress(
            document_id=document_id,
            event="field_extraction_started",
            progress=75,
            message="Field extraction started"
        )

        time.sleep(3)

        document.extracted_title = f"Processed: {document.filename}"
        document.extracted_category = "General"
        document.extracted_summary = f"This is a processed summary for {document.filename}"
        document.extracted_keywords = ["sample", "document", "processed"]

        document.processed_result = {
            "title": document.extracted_title,
            "category": document.extracted_category,
            "summary": document.extracted_summary,
            "keywords": document.extracted_keywords,
            "status": "completed"
        }
         
         # Event 5: extraction completed
        publish_progress(
            document_id=document_id,
            event="field_extraction_completed",
            progress=90,
            message="Field extraction completed"
        )
           # Step 2: mark as completed
        document.status = "completed"
        db.commit()

         # Event 6: job completed
        publish_progress(
            document_id=document_id,
            event="job_completed",
            progress=100,
            message="Document processing completed"
        )


        return f"Document {document_id} processed successfully"

    except Exception as e:
        document = db.query(Document).filter(Document.id == document_id).first()
        if document:
            document.status = "failed"
            document.error_message = str(e)
            db.commit()

        raise e

    finally:
        db.close()