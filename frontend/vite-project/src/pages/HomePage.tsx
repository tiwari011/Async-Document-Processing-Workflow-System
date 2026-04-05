import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main style={{ flex: 1 }}>
      {/* Hero */}
      <section style={{
        maxWidth: 1200, margin: "0 auto", padding: "100px 24px 80px",
        display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--accent-subtle)",
          border: "1px solid rgba(99,102,241,0.25)",
          borderRadius: 100, padding: "5px 14px",
          marginBottom: 32,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
          <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--accent-hover)", letterSpacing: "0.05em" }}>
            ASYNC PROCESSING · LIVE UPDATES
          </span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-heading)", fontWeight: 800,
          fontSize: "clamp(40px, 6vw, 72px)",
          color: "var(--text-heading)", lineHeight: 1.08,
          letterSpacing: "-0.03em", marginBottom: 24, maxWidth: 800,
        }}>
          Document processing,{" "}
          <span style={{
            background: "linear-gradient(135deg, var(--accent), #a78bfa, #60a5fa)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>reimagined</span>
        </h1>

        <p style={{
          fontSize: 18, color: "var(--text)", maxWidth: 540,
          lineHeight: 1.65, marginBottom: 40,
        }}>
          Upload documents, watch them process in real-time, and export structured data — all in one seamless workflow.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link to="/upload" style={{
            textDecoration: "none", padding: "13px 28px",
            background: "var(--accent)",
            color: "#fff", borderRadius: "var(--radius)",
            fontWeight: 600, fontSize: 15,
            fontFamily: "var(--font-heading)",
            letterSpacing: "-0.01em",
            boxShadow: "0 0 30px var(--accent-glow)",
            transition: "all 0.2s",
          }}>Upload a document →</Link>
          <Link to="/dashboard" style={{
            textDecoration: "none", padding: "13px 28px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-hover)",
            color: "var(--text-heading)", borderRadius: "var(--radius)",
            fontWeight: 500, fontSize: 15,
            transition: "all 0.2s",
          }}>View Dashboard</Link>
        </div>
      </section>

      {/* Feature grid */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}>
          {[
            { icon: "⬆", title: "Smart Upload", desc: "Drag-and-drop any file format. We handle the rest automatically." },
            { icon: "⚡", title: "Live Progress", desc: "Watch processing in real-time via server-sent events. No refresh needed." },
            { icon: "✏", title: "Review & Edit", desc: "Review extracted data, make corrections before finalizing." },
            { icon: "📦", title: "Export Ready", desc: "Export as JSON or CSV once finalized for downstream use." },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "28px 24px",
              transition: "all 0.2s",
            }}>
              <div style={{
                width: 42, height: 42,
                background: "var(--accent-subtle)",
                border: "1px solid rgba(99,102,241,0.2)",
                borderRadius: "var(--radius)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, marginBottom: 16,
              }}>{icon}</div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text-heading)" }}>
                {title}
              </h3>
              <p style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
