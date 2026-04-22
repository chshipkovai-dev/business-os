import Sidebar from "@/components/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-base)", position: "relative" }}>
      {/* Dot grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, rgba(0,229,255,0.06) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />
      {/* Ambient glow — top right */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 600, height: 600,
        borderRadius: "50%", zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(circle, rgba(0,229,255,0.06) 0%, transparent 65%)",
      }} />
      {/* Ambient glow — bottom left */}
      <div style={{
        position: "fixed", bottom: -200, left: 50, width: 500, height: 500,
        borderRadius: "50%", zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)",
      }} />
      {/* Top accent line */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 1, zIndex: 10,
        background: "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.7) 30%, rgba(124,58,237,0.7) 70%, transparent 100%)",
      }} />
      <Sidebar />
      <main style={{
        flex: 1, padding: "40px 44px", overflowY: "auto",
        minHeight: "100vh", position: "relative", zIndex: 1,
      }}>
        {children}
      </main>
    </div>
  )
}
