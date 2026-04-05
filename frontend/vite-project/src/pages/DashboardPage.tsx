import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDocuments, retryDocument } from "../lib/api";
import type { DocumentItem } from "../types/document";

type StatusKey = "queued" | "processing" | "completed" | "failed";

const STATUS_CONFIG: Record<StatusKey, { color: string; bg: string; dot: string; label: string }> = {
  queued:     { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  dot: "#fbbf24", label: "Queued" },
  processing: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  dot: "#60a5fa", label: "Processing" },
  completed:  { color: "#34d399", bg: "rgba(52,211,153,0.1)",  dot: "#34d399", label: "Completed" },
  failed:     { color: "#f87171", bg: "rgba(248,113,113,0.1)", dot: "#f87171", label: "Failed" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as StatusKey] ?? { color: "#a8a8b8", bg: "rgba(168,168,184,0.1)", dot: "#a8a8b8", label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 100,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 600, fontFamily: "var(--font-mono)",
      letterSpacing: "0.04em",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
      {cfg.label.toUpperCase()}
    </span>
  );
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  const fetchDocuments = async () => {
    try { setLoading(true); setError(""); setDocuments(await getDocuments()); }
    catch { setError("Failed to load documents."); }
    finally { setLoading(false); }
  };

  const handleRetry = async (id: number) => {
    try { setLoading(true); await retryDocument(id); await fetchDocuments(); }
    catch { setError("Failed to retry document."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const filtered = useMemo(() => {
    const f = documents.filter(d =>
      d.filename.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || d.status === statusFilter)
    );
    switch (sortOption) {
      case "oldest":       return [...f].sort((a, b) => a.id - b.id);
      case "filename_asc": return [...f].sort((a, b) => a.filename.localeCompare(b.filename));
      case "filename_desc":return [...f].sort((a, b) => b.filename.localeCompare(a.filename));
      default:             return [...f].sort((a, b) => b.id - a.id);
    }
  }, [documents, searchTerm, statusFilter, sortOption]);

  const stats = useMemo(() => ({
    total: documents.length,
    completed: documents.filter(d => d.status === "completed").length,
    processing: documents.filter(d => d.status === "processing" || d.status === "queued").length,
    failed: documents.filter(d => d.status === "failed").length,
  }), [documents]);

  const inputStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "9px 14px",
    color: "var(--text-heading)",
    fontSize: 13,
    fontFamily: "var(--font-body)",
    outline: "none",
    width: "100%",
  };

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }} className="animate-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, gap: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 6 }}>
            DOCUMENT DASHBOARD
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-heading)", letterSpacing: "-0.03em" }}>
            All Documents
          </h1>
        </div>
        <Link to="/upload" style={{
          textDecoration: "none",
          padding: "10px 20px",
          background: "var(--accent)",
          color: "#fff",
          borderRadius: "var(--radius)",
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: 14,
          boxShadow: "0 0 20px var(--accent-glow)",
        }}>+ Upload New</Link>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total", value: stats.total, color: "var(--text-heading)" },
          { label: "Completed", value: stats.completed, color: "var(--green)" },
          { label: "In Progress", value: stats.processing, color: "var(--blue)" },
          { label: "Failed", value: stats.failed, color: "var(--red)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 20px",
          }}>
            <p style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-muted)", letterSpacing: "0.07em", marginBottom: 6 }}>
              {label.toUpperCase()}
            </p>
            <p style={{ fontSize: 28, fontFamily: "var(--font-heading)", fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Search by filename..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="all">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="filename_asc">Filename A–Z</option>
          <option value="filename_desc">Filename Z–A</option>
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
      }}>
        {loading && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            <div style={{
              width: 24, height: 24, border: "2px solid var(--border)",
              borderTopColor: "var(--accent)", borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
              margin: "0 auto 12px",
            }} />
            Loading documents...
          </div>
        )}

        {error && (
          <div style={{ padding: 24, color: "var(--red)", fontSize: 14 }}>{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: "60px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📭</p>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No documents found.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["ID", "Filename", "Type", "Size", "Status", "Finalized", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 11, fontFamily: "var(--font-mono)",
                    color: "var(--text-muted)", letterSpacing: "0.07em",
                    fontWeight: 500,
                  }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, i) => (
                <tr key={doc.id} style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>#{doc.id}</span>
                  </td>
                  <td style={{ padding: "14px 16px", maxWidth: 200 }}>
                    <span style={{
                      color: "var(--text-heading)", fontSize: 14, fontWeight: 500,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
                    }}>{doc.filename}</span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                      {doc.file_type || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)}KB` : "—"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <StatusBadge status={doc.status} />
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: 12, fontFamily: "var(--font-mono)",
                      color: doc.is_finalized ? "var(--green)" : "var(--text-muted)",
                    }}>
                      {doc.is_finalized ? "✓ Yes" : "No"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Link to={`/documents/${doc.id}`} style={{
                        textDecoration: "none",
                        fontSize: 12, fontWeight: 600,
                        color: "var(--accent-hover)",
                        fontFamily: "var(--font-heading)",
                        padding: "4px 10px",
                        background: "var(--accent-subtle)",
                        borderRadius: 6,
                        border: "1px solid rgba(99,102,241,0.2)",
                      }}>View →</Link>
                      {doc.status === "failed" && (
                        <button onClick={() => handleRetry(doc.id)} style={{
                          border: "1px solid rgba(248,113,113,0.3)",
                          background: "rgba(248,113,113,0.08)",
                          color: "var(--red)",
                          borderRadius: 6, padding: "4px 10px",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          fontFamily: "var(--font-heading)",
                        }}>Retry</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
        Showing {filtered.length} of {documents.length} documents
      </p>
    </main>
  );
}
