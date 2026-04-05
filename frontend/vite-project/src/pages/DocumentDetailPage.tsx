import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { DocumentItem } from "../types/document";
import { getDocumentById, updateDocument, finalizeDocument, getExportJsonUrl, getExportCsvUrl } from "../lib/api";

type StatusKey = "queued" | "processing" | "completed" | "failed";
const STATUS_CONFIG: Record<StatusKey, { color: string; bg: string }> = {
  queued:     { color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
  processing: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  completed:  { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  failed:     { color: "#f87171", bg: "rgba(248,113,113,0.1)" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusKey] ?? { color: "#a8a8b8", bg: "rgba(168,168,184,0.1)" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 12px", borderRadius: 100,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)",
      letterSpacing: "0.04em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
      {status.toUpperCase()}
    </span>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontFamily: "var(--font-mono)",
  color: "var(--text-muted)", letterSpacing: "0.07em",
  marginBottom: 6, fontWeight: 500,
};

const inputStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  background: disabled ? "var(--bg)" : "var(--bg-elevated)",
  border: `1px solid ${disabled ? "var(--border)" : "var(--border-hover)"}`,
  borderRadius: "var(--radius)",
  padding: "10px 14px",
  color: disabled ? "var(--text-muted)" : "var(--text-heading)",
  fontSize: 14,
  fontFamily: "var(--font-body)",
  outline: "none",
  resize: "vertical",
  cursor: disabled ? "not-allowed" : "text",
  transition: "border-color 0.15s",
});

export default function DocumentDetailPage() {
  const { id } = useParams();
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    extracted_title: "", extracted_category: "",
    extracted_summary: "", extracted_keywords: "",
  });
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [actionOk, setActionOk] = useState(true);

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true); setError("");
      const data = await getDocumentById(id);
      setDocument(data);
      setFormData({
        extracted_title: data.extracted_title || "",
        extracted_category: data.extracted_category || "",
        extracted_summary: data.extracted_summary || "",
        extracted_keywords: data.extracted_keywords?.join(", ") || "",
      });
      if (data.status === "completed") { setProgress(100); setProgressMessage("Processing completed"); }
      else if (data.status === "processing") setProgressMessage("Processing document...");
      else if (data.status === "queued") setProgressMessage("Queued for processing...");
    } catch { setError("Failed to load document details."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchDocument(); }, [fetchDocument]);

  useEffect(() => {
    if (!id || !document) return;
    if (document.status !== "queued" && document.status !== "processing") return;
    const es = new EventSource(`http://localhost:8001/api/documents/${id}/progress`);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(data.progress ?? 0);
        setProgressMessage(data.message ?? "");
        if (data.event === "job_completed" || data.event === "job_failed") {
          es.close();
          setTimeout(() => fetchDocument(), 500);
        }
      } catch { /* ignore */ }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [id, document, fetchDocument]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setActionMessage("");
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true); setActionMessage("");
      const payload = {
        extracted_title: formData.extracted_title,
        extracted_category: formData.extracted_category,
        extracted_summary: formData.extracted_summary,
        extracted_keywords: formData.extracted_keywords.split(",").map(k => k.trim()).filter(Boolean),
      };
      const updated = await updateDocument(id, payload);
      setDocument(updated);
      setActionMessage("Changes saved successfully."); setActionOk(true);
    } catch {
      setActionMessage("Failed to save changes."); setActionOk(false);
    } finally { setSaving(false); }
  };

  const handleFinalize = async () => {
    if (!id) return;
    try {
      setFinalizing(true); setActionMessage("");
      const result = await finalizeDocument(id);
      setDocument(result.document);
      setActionMessage(result.message); setActionOk(true);
    } catch {
      setActionMessage("Failed to finalize document."); setActionOk(false);
    } finally { setFinalizing(false); }
  };

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }} className="animate-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 6 }}>
            DOCUMENT DETAIL
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-heading)", letterSpacing: "-0.03em" }}>
            {document?.filename ?? "Loading..."}
          </h1>
        </div>
        <Link to="/dashboard" style={{
          textDecoration: "none",
          padding: "8px 16px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-hover)",
          color: "var(--text)",
          borderRadius: "var(--radius)",
          fontSize: 13, fontWeight: 500,
        }}>← Back</Link>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
          <div style={{
            width: 28, height: 28, border: "2px solid var(--border)",
            borderTopColor: "var(--accent)", borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            margin: "0 auto 12px",
          }} />
          Loading document...
        </div>
      )}

      {error && (
        <div style={{ padding: "16px 20px", background: "var(--red-bg)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "var(--radius)", color: "var(--red)", fontSize: 14 }}>
          {error}
        </div>
      )}

      {!loading && !error && document && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Info card */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)", padding: "24px",
          }}>
            <h2 style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.07em", marginBottom: 20 }}>
              BASIC INFORMATION
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
              {[
                { label: "Document ID", value: `#${document.id}` },
                { label: "Filename", value: document.filename },
                { label: "File Type", value: document.file_type || "—" },
                { label: "File Size", value: document.file_size ? `${(document.file_size / 1024).toFixed(1)} KB` : "—" },
                { label: "Status", value: <StatusBadge status={document.status} /> },
                { label: "Finalized", value: document.is_finalized ? <span style={{ color: "var(--green)", fontWeight: 600 }}>✓ Yes</span> : <span style={{ color: "var(--text-muted)" }}>No</span> },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.07em", marginBottom: 4 }}>
                    {label.toUpperCase()}
                  </p>
                  <p style={{ fontSize: 14, color: "var(--text-heading)", fontWeight: 500 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          {(document.status === "queued" || document.status === "processing") && (
            <div style={{
              background: "var(--blue-bg)", border: "1px solid rgba(96,165,250,0.2)",
              borderRadius: "var(--radius-xl)", padding: "24px",
            }}>
              <h2 style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--blue)", letterSpacing: "0.07em", marginBottom: 16 }}>
                LIVE PROGRESS
              </h2>
              <div style={{
                width: "100%", height: 6,
                background: "rgba(96,165,250,0.15)",
                borderRadius: 100, overflow: "hidden", marginBottom: 12,
              }}>
                <div style={{
                  height: "100%", width: `${progress}%`,
                  background: "linear-gradient(90deg, var(--accent), var(--blue))",
                  borderRadius: 100,
                  transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: "0 0 8px rgba(96,165,250,0.5)",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 13, color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                  {progressMessage || "Waiting for updates..."}
                </p>
                <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--blue)", fontWeight: 600 }}>
                  {progress}%
                </span>
              </div>
            </div>
          )}

          {/* Edit form */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)", padding: "24px",
          }}>
            <h2 style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.07em", marginBottom: 20 }}>
              EXTRACTED DATA {document.is_finalized && <span style={{ color: "var(--green)", marginLeft: 8 }}>· LOCKED</span>}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>TITLE</label>
                <input type="text" name="extracted_title" value={formData.extracted_title}
                  onChange={handleInput} disabled={document.is_finalized}
                  style={inputStyle(document.is_finalized)} />
              </div>
              <div>
                <label style={labelStyle}>CATEGORY</label>
                <input type="text" name="extracted_category" value={formData.extracted_category}
                  onChange={handleInput} disabled={document.is_finalized}
                  style={inputStyle(document.is_finalized)} />
              </div>
              <div>
                <label style={labelStyle}>SUMMARY</label>
                <textarea name="extracted_summary" value={formData.extracted_summary}
                  onChange={handleInput} disabled={document.is_finalized} rows={4}
                  style={inputStyle(document.is_finalized)} />
              </div>
              <div>
                <label style={labelStyle}>KEYWORDS <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· comma separated</span></label>
                <input type="text" name="extracted_keywords" value={formData.extracted_keywords}
                  onChange={handleInput} disabled={document.is_finalized}
                  style={inputStyle(document.is_finalized)} />
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <button onClick={handleSave} disabled={saving || document.is_finalized} style={{
                  padding: "10px 20px", borderRadius: "var(--radius)",
                  background: document.is_finalized || saving ? "var(--bg-elevated)" : "var(--accent)",
                  color: document.is_finalized || saving ? "var(--text-muted)" : "#fff",
                  border: "none", cursor: document.is_finalized || saving ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13,
                }}>
                  {document.is_finalized ? "🔒 Locked" : saving ? "Saving..." : "Save Changes"}
                </button>

                <button onClick={handleFinalize} disabled={finalizing || document.is_finalized} style={{
                  padding: "10px 20px", borderRadius: "var(--radius)",
                  background: document.is_finalized ? "var(--green-bg)" : finalizing ? "var(--bg-elevated)" : "var(--green-bg)",
                  color: document.is_finalized ? "var(--green)" : finalizing ? "var(--text-muted)" : "var(--green)",
                  border: `1px solid ${document.is_finalized ? "rgba(52,211,153,0.3)" : "rgba(52,211,153,0.2)"}`,
                  cursor: document.is_finalized || finalizing ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 13,
                }}>
                  {document.is_finalized ? "✓ Finalized" : finalizing ? "Finalizing..." : "Finalize"}
                </button>

                <a href={getExportJsonUrl(document.id)} target="_blank" rel="noreferrer" style={{
                  padding: "10px 20px", borderRadius: "var(--radius)",
                  background: document.is_finalized ? "rgba(99,102,241,0.12)" : "var(--bg-elevated)",
                  color: document.is_finalized ? "var(--accent-hover)" : "var(--text-muted)",
                  border: `1px solid ${document.is_finalized ? "rgba(99,102,241,0.25)" : "var(--border)"}`,
                  textDecoration: "none",
                  fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13,
                  pointerEvents: document.is_finalized ? "auto" : "none",
                }}>↓ JSON</a>

                <a href={getExportCsvUrl(document.id)} target="_blank" rel="noreferrer" style={{
                  padding: "10px 20px", borderRadius: "var(--radius)",
                  background: document.is_finalized ? "rgba(251,191,36,0.08)" : "var(--bg-elevated)",
                  color: document.is_finalized ? "var(--yellow)" : "var(--text-muted)",
                  border: `1px solid ${document.is_finalized ? "rgba(251,191,36,0.2)" : "var(--border)"}`,
                  textDecoration: "none",
                  fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13,
                  pointerEvents: document.is_finalized ? "auto" : "none",
                }}>↓ CSV</a>
              </div>

              {actionMessage && (
                <div style={{
                  padding: "12px 16px", borderRadius: "var(--radius)", fontSize: 13,
                  background: actionOk ? "var(--green-bg)" : "var(--red-bg)",
                  border: `1px solid ${actionOk ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                  color: actionOk ? "var(--green)" : "var(--red)",
                }}>{actionMessage}</div>
              )}
            </div>
          </div>

          {/* JSON result */}
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)", padding: "24px",
          }}>
            <h2 style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.07em", marginBottom: 16 }}>
              PROCESSED RESULT
            </h2>
            <pre style={{
              background: "#0d0d14",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "20px", overflow: "auto",
              fontSize: 12, lineHeight: 1.7,
              color: "#a5d6a7",
              fontFamily: "var(--font-mono)",
              maxHeight: 320,
            }}>
              {JSON.stringify(document.processed_result, null, 2) || "null"}
            </pre>
          </div>

          {/* Error */}
          {document.error_message && (
            <div style={{
              background: "var(--red-bg)", border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: "var(--radius-xl)", padding: "20px 24px",
            }}>
              <h2 style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--red)", letterSpacing: "0.07em", marginBottom: 8 }}>
                ERROR
              </h2>
              <p style={{ fontSize: 13, color: "var(--red)", opacity: 0.8 }}>{document.error_message}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
