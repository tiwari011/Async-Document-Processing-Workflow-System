from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text,
    Boolean,
    JSON
)
from datetime import datetime
from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)
    file_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    file_path = Column(String, nullable=False)

    status = Column(String, default="queued", nullable=False)

    extracted_title = Column(String, nullable=True)
    extracted_category = Column(String, nullable=True)
    extracted_summary = Column(Text, nullable=True)
    extracted_keywords = Column(JSON, nullable=True)

    processed_result = Column(JSON, nullable=True)

    is_finalized = Column(Boolean, default=False)

    error_message = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)