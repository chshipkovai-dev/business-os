import Sidebar from "@/components/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0A0A0F" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 40px", overflowY: "auto", minHeight: "100vh" }}>
        {children}
      </main>
    </div>
  )
}
