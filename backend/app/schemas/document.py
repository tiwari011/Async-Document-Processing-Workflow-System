from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
class DocumentResponse(BaseModel):
    id:int
    filename:str
    file_type: Optional[str]=None
    file_size: Optional[int]=None
    file_path:str
    status:str

    extracted_title: Optional[str]=None
    extracted_category: Optional[str]=None
    extracted_summary: Optional[str]=None
    extracted_keywords: Optional[list[str]]=None

    processed_result: Optional[dict]=None
    is_finalized: bool
    error_message: Optional[str]=None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class Config:
 from_attributes = True

class UploadResponse(BaseModel):
      message:str
      documents: List[DocumentResponse]
class DocumentUpdateRequest(BaseModel):
    extracted_title: Optional[str] = None
    extracted_category: Optional[str] = None
    extracted_summary: Optional[str] = None
    extracted_keywords: Optional[List[str]] = None


class FinalizeResponse(BaseModel):
    message: str
    document: DocumentResponse