import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header style={{
      background: "rgba(10,10,15,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30,
            background: "linear-gradient(135deg, var(--accent), #a78bfa)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff",
            fontFamily: "var(--font-heading)",
          }}>D</div>
          <span style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 17,
            color: "var(--text-heading)",
            letterSpacing: "-0.03em",
          }}>DocFlow</span>
        </Link>

        {/* Nav links */}
        <nav style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[
            { to: "/dashboard", label: "Dashboard" },
            { to: "/upload", label: "Upload" },
          ].map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: "var(--radius)",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "var(--font-body)",
                transition: "all 0.15s",
                background: isActive(to) ? "var(--accent-subtle)" : "transparent",
                color: isActive(to) ? "var(--accent-hover)" : "var(--text)",
                border: `1px solid ${isActive(to) ? "rgba(99,102,241,0.3)" : "transparent"}`,
              }}
            >{label}</Link>
          ))}
          <Link
            to="/upload"
            style={{
              textDecoration: "none",
              marginLeft: 8,
              padding: "6px 16px",
              borderRadius: "var(--radius)",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-heading)",
              background: "var(--accent)",
              color: "#fff",
              letterSpacing: "0.01em",
              transition: "all 0.15s",
            }}
          >+ New</Link>
        </nav>
      </div>
    </header>
  );
}
