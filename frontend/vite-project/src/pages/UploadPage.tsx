import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadDocument } from "../lib/api";
import type { DocumentItem } from "../types/document";

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const unique = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...unique];
    });
    setMessage("");
    setError("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
    // Reset input so same files can be re-selected if removed
    event.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files || []);
    addFiles(files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setMessage("");
    setError("");
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file.");
      return;
    }
    try {
      setIsUploading(true);
      setError("");
      setMessage("");

      const results: DocumentItem[] = [];
      for (const file of selectedFiles) {
        const uploaded = await uploadDocument(file);
        results.push(uploaded);
      }

      const count = results.length;
      setSelectedFiles([]);
      setMessage(
        count === 1
          ? `Uploaded! Document ID: ${results[0].id}`
          : `Uploaded ${count} documents successfully!`
      );

      if (count === 1) {
        setTimeout(() => navigate(`/documents/${results[0].id}`), 900);
      } else {
        setTimeout(() => navigate("/dashboard"), 900);
      }
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <main style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }} className="animate-in">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 8 }}>
          DOCUMENT UPLOAD
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "var(--text-heading)", letterSpacing: "-0.03em", marginBottom: 8 }}>
          Upload files
        </h1>
        <p style={{ color: "var(--text)", fontSize: 15 }}>
          Select or drop one or more documents to begin async background processing.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "var(--accent)" : hasFiles ? "rgba(99,102,241,0.4)" : "var(--border-hover)"}`,
          borderRadius: "var(--radius-xl)",
          background: dragOver ? "var(--accent-subtle)" : hasFiles ? "var(--bg-elevated)" : "var(--bg-card)",
          padding: "52px 32px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          marginBottom: 16,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {!hasFiles ? (
          <>
            <div style={{
              width: 56, height: 56,
              background: "var(--accent-subtle)",
              border: "1px solid rgba(99,102,241,0.25)",
              borderRadius: "var(--radius-lg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: 22,
            }}>📂</div>
            <p style={{ fontFamily: "var(--font-heading)", fontWeight: 600, color: "var(--text-heading)", marginBottom: 6 }}>
              Drop your files here
            </p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
              or click to browse · multiple files supported · any format
            </p>
          </>
        ) : (
          <div style={{ textAlign: "left" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected · click to add more
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{
                    width: 40, height: 40,
                    background: "var(--accent-subtle)",
                    border: "1px solid rgba(99,102,241,0.3)",
                    borderRadius: "var(--radius)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 16,
                  }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 600, color: "var(--text-heading)",
                      fontFamily: "var(--font-heading)", fontSize: 14,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {formatSize(file.size)} · {file.type || "Unknown type"}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "var(--text-muted)", fontSize: 16, padding: 4, flexShrink: 0,
                    }}
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={isUploading || !hasFiles}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "var(--radius-lg)",
          border: "none",
          background: isUploading || !hasFiles ? "var(--bg-elevated)" : "var(--accent)",
          color: isUploading || !hasFiles ? "var(--text-muted)" : "#fff",
          cursor: isUploading || !hasFiles ? "not-allowed" : "pointer",
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: "-0.01em",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: hasFiles && !isUploading ? "0 0 25px var(--accent-glow)" : "none",
        }}
      >
        {isUploading ? (
          <>
            <span style={{
              width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "#fff", borderRadius: "50%",
              animation: "spin 0.7s linear infinite", display: "inline-block",
            }} />
            Uploading...
          </>
        ) : selectedFiles.length > 1
          ? `Upload ${selectedFiles.length} Documents`
          : "Upload Document"}
      </button>

      {/* Feedback */}
      {message && (
        <div style={{
          marginTop: 16, padding: "14px 18px",
          background: "var(--green-bg)", border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: "var(--radius)", color: "var(--green)", fontSize: 14,
        }}>{message}</div>
      )}
      {error && (
        <div style={{
          marginTop: 16, padding: "14px 18px",
          background: "var(--red-bg)", border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "var(--radius)", color: "var(--red)", fontSize: 14,
        }}>{error}</div>
      )}
    </main>
  );
}