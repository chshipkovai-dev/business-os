import Sidebar from "@/components/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", position: "relative" }}>
      {/* Dot grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(0,229,255,0.07) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />
      {/* Top accent line */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 1, zIndex: 10,
        background: "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.6) 30%, rgba(124,58,237,0.6) 70%, transparent 100%)",
      }} />
      <Sidebar />
      <main style={{ flex: 1, padding: "40px 44px", overflowY: "auto", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {children}
      </main>
    </div>
  )
}
