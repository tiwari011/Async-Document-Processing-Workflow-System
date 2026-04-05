import type { DocumentItem } from "../types/document";

const API_BASE_URL = "http://localhost:8001/api";

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload document");
  }

  return response.json();
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const response = await fetch(`${API_BASE_URL}/documents/`);

  if (!response.ok) {
    throw new Error("Failed to fetch documents");
  }

  return response.json();
}

export async function getDocumentById(id: string): Promise<DocumentItem> {
  const response = await fetch(`${API_BASE_URL}/documents/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch document");
  }

  return response.json();
}
export async function updateDocument(
  id: string,
  payload: {
    extracted_title?: string;
    extracted_category?: string;
    extracted_summary?: string;
    extracted_keywords?: string[];
  }
): Promise<DocumentItem> {
  const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to update document");
  }

  return response.json();
}

export async function finalizeDocument(
  id: string
): Promise<{ message: string; document: DocumentItem }> {
  const response = await fetch(`${API_BASE_URL}/documents/${id}/finalize`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to finalize document");
  }

  return response.json();
}
const FRONTEND_API_BASE = "http://localhost:8001/api";

export function getExportJsonUrl(id: string | number) {
  return `${FRONTEND_API_BASE}/documents/${id}/export/json`;
}

export function getExportCsvUrl(id: string | number) {
  return `${FRONTEND_API_BASE}/documents/${id}/export/csv`;
}
export async function retryDocument(id: string | number): Promise<DocumentItem> {
  const response = await fetch(`${API_BASE_URL}/documents/${id}/retry`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to retry document");
  }

  return response.json();
}