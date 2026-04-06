"use client"
import { useState, useRef, useEffect } from "react"
import { ideas } from "@/lib/data"
import { Send } from "lucide-react"
import { useLang } from "@/lib/lang"
import { t } from "@/lib/translations"

type Message = {
  role: "user" | "assistant"
  content: string
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 8 ? "var(--success)" : value >= 6 ? "var(--warning)" : "var(--danger)"
  return (
    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:5}}>
      <span style={{width:80, fontSize:11, color:"var(--text-muted)", flexShrink:0}}>{label}</span>
      <div style={{flex:1, height:3, background:"var(--bg-elevated)", borderRadius:2, overflow:"hidden"}}>
        <div style={{height:"100%", width:`${value * 10}%`, background:color, borderRadius:2}} />
      </div>
      <span style={{width:14, fontSize:11, color:"var(--text-secondary)", textAlign:"right"}}>{value}</span>
    </div>
  )
}

const selectedIdea = ideas[0]

export default function AdvisorPage() {
  const { lang } = useLang()
  const a = t.advisor
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: lang === "ru"
        ? `Привет! Я готов помочь с анализом бизнес идеи **${selectedIdea.title}**. Задай любой вопрос.`
        : `Hi! I'm ready to help analyze the business idea **${selectedIdea.title}**. Ask me anything.`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"

    const newMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setIsLoading(true)

    const aiMsg: Message = { role: "assistant", content: "" }
    setMessages(prev => [...prev, aiMsg])

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, ideaContext: selectedIdea }),
      })

      if (!res.body) throw new Error("No body")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: lang === "ru"
              ? "Произошла ошибка при получении ответа. Проверьте ANTHROPIC_API_KEY."
              : "Error fetching response. Check ANTHROPIC_API_KEY.",
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
  }

  return (
    <div style={{display:"flex", gap:24, height:"calc(100vh - 64px)", animation:"fadeIn 0.2s ease"}}>
      {/* Left panel */}
      <div style={{width:300, flexShrink:0, display:"flex", flexDirection:"column", gap:16}}>
        {/* Idea context card */}
        <div style={{
          background:"var(--bg-surface)",
          border:"1px solid var(--border)",
          borderRadius:12,
          padding:20,
          boxShadow:"0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        }}>
          <div style={{fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8}}>{lang === "ru" ? "Контекст идеи" : "Idea context"}</div>
          <div style={{fontSize:14, fontWeight:600, color:"var(--text-primary)", marginBottom:4, lineHeight:1.4}}>{selectedIdea.title}</div>
          <div style={{fontSize:11, color:"var(--text-secondary)", marginBottom:12, lineHeight:1.5}}>{selectedIdea.description}</div>

          <div style={{display:"flex", gap:8, marginBottom:12}}>
            <span style={{background:"rgba(99,102,241,0.2)", color:"#818CF8", fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:6}}>{selectedIdea.tier}</span>
            <span style={{background:"var(--bg-elevated)", color:"var(--text-secondary)", fontSize:11, padding:"2px 8px", borderRadius:6}}>{selectedIdea.score}</span>
          </div>

          <ScoreBar label={a.market[lang]} value={selectedIdea.market} />
          <ScoreBar label={a.pain[lang]} value={selectedIdea.pain} />
          <ScoreBar label={a.monetization[lang]} value={selectedIdea.mono} />
          <ScoreBar label={a.speed[lang]} value={selectedIdea.speed} />
          <ScoreBar label={a.competition[lang]} value={selectedIdea.competition} />
        </div>

        {/* Competitors */}
        <div style={{
          background:"var(--bg-surface)",
          border:"1px solid var(--border)",
          borderRadius:12,
          padding:20,
          boxShadow:"0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        }}>
          <div style={{fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12}}>{a.competitors[lang]}</div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {selectedIdea.competitors.map(c => (
              <div key={c} style={{display:"flex", alignItems:"center", gap:8}}>
                <div style={{width:6, height:6, borderRadius:"50%", background:"var(--accent)", flexShrink:0}} />
                <span style={{fontSize:12, color:"var(--text-secondary)"}}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price & Audience */}
        <div style={{
          background:"var(--bg-surface)",
          border:"1px solid var(--border)",
          borderRadius:12,
          padding:20,
          boxShadow:"0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
        }}>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11, color:"var(--text-muted)", marginBottom:2}}>{a.price[lang]}</div>
            <div style={{fontSize:14, fontWeight:600, color:"var(--text-primary)"}}>{selectedIdea.price}</div>
          </div>
          <div>
            <div style={{fontSize:11, color:"var(--text-muted)", marginBottom:2}}>{a.audience[lang]}</div>
            <div style={{fontSize:12, color:"var(--text-secondary)"}}>{selectedIdea.audience}</div>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div style={{
        flex:1,
        display:"flex",
        flexDirection:"column",
        background:"var(--bg-surface)",
        border:"1px solid var(--border)",
        borderRadius:12,
        overflow:"hidden",
        boxShadow:"0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)",
      }}>
        {/* Chat header */}
        <div style={{padding:"16px 20px", borderBottom:"1px solid var(--border)"}}>
          <div style={{fontSize:14, fontWeight:600, color:"var(--text-primary)"}}>{a.title[lang]}</div>
          <div style={{fontSize:11, color:"var(--text-muted)", marginTop:2}}>claude-sonnet-4-6 · {lang === "ru" ? "Отвечает на русском языке" : "Responds in English"}</div>
        </div>

        {/* Messages */}
        <div style={{flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:12}}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display:"flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}>
              <div style={{
                maxWidth:"75%",
                padding:"10px 14px",
                borderRadius:16,
                background: msg.role === "user" ? "rgba(99,102,241,0.15)" : "var(--bg-elevated)",
                color:"var(--text-primary)",
                fontSize:13,
                lineHeight:1.6,
                whiteSpace:"pre-wrap",
                borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
              }}>
                {msg.content || (isLoading && i === messages.length - 1 ? (
                  <span style={{color:"var(--text-muted)"}}>...</span>
                ) : "")}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{padding:"12px 16px", borderTop:"1px solid var(--border)", display:"flex", gap:10, alignItems:"flex-end"}}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={lang === "ru" ? "Задай вопрос об идее... (Enter для отправки)" : "Ask a question... (Enter to send)"}
            rows={1}
            style={{
              flex:1,
              background:"var(--bg-elevated)",
              border:"1px solid var(--border)",
              borderRadius:12,
              padding:"10px 14px",
              color:"var(--text-primary)",
              fontSize:13,
              resize:"none",
              outline:"none",
              fontFamily:"inherit",
              lineHeight:1.5,
              transition:"border-color 0.15s",
            }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = "var(--accent)" }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = "var(--border)" }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{
              background: isLoading || !input.trim() ? "var(--bg-elevated)" : "var(--accent)",
              border:"none",
              borderRadius:12,
              padding:"10px 16px",
              color: isLoading || !input.trim() ? "var(--text-muted)" : "white",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              display:"flex",
              alignItems:"center",
              gap:6,
              fontSize:13,
              fontWeight:500,
              transition:"all 0.15s",
              flexShrink:0,
            }}
          >
            <Send size={14} />
            {a.send[lang]}
          </button>
        </div>
      </div>
    </div>
  )
}
