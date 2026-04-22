interface MetricCardProps {
  emoji: string
  value: string | number
  label: string
  color?: string
}

export function MetricCard({ emoji, value, label, color = "var(--accent)" }: MetricCardProps) {
  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      flex: 1,
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = color; el.style.transform = "translateY(-2px)" }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border)"; el.style.transform = "translateY(0)" }}
    >
      {/* Glow top-left */}
      <div style={{
        position: "absolute", top: -20, left: -20,
        width: 80, height: 80,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
      <div>
        <div style={{
          fontSize: 22, fontWeight: 800, color,
          lineHeight: 1.1, fontFamily: "var(--font-display)",
          textShadow: `0 0 20px ${color}50`,
        }}>{value}</div>
        <div style={{
          fontSize: 10, color: "var(--text-muted)", marginTop: 3,
          letterSpacing: "1px", textTransform: "uppercase",
          fontFamily: "var(--font-mono)",
        }}>{label}</div>
      </div>
    </div>
  )
}
