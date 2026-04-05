export type DocumentItem = {
  id: number;
  filename: string;
  file_type?: string | null;
  file_size?: number | null;
  file_path: string;
  status: string;

  extracted_title?: string | null;
  extracted_category?: string | null;
  extracted_summary?: string | null;
  extracted_keywords?: string[] | null;

  processed_result?: Record<string, unknown> | null;
  is_finalized: boolean;
  error_message?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
};