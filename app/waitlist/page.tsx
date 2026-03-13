'use client'

import { useState } from 'react'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [count, setCount] = useState<number | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus('success')
      setCount(data.count)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #080810 0%, #0f0f20 50%, #080810 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#F0F0FF',
      padding: '24px',
    }}>

      {/* Badge */}
      <div style={{
        background: 'rgba(99,102,241,0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: '100px',
        padding: '6px 16px',
        fontSize: '13px',
        color: '#A5B4FC',
        marginBottom: '32px',
        letterSpacing: '0.03em',
      }}>
        For freelancers tired of chasing money
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 'clamp(36px, 6vw, 64px)',
        fontWeight: 800,
        textAlign: 'center',
        margin: '0 0 20px',
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
        maxWidth: '720px',
      }}>
        Stop chasing clients<br />
        <span style={{ color: '#6366F1' }}>Let AI do it.</span>
      </h1>

      {/* Subheadline */}
      <p style={{
        fontSize: 'clamp(17px, 2.5vw, 21px)',
        color: '#8B8FA8',
        textAlign: 'center',
        maxWidth: '540px',
        lineHeight: 1.6,
        margin: '0 0 48px',
      }}>
        Add your overdue invoice → AI writes the perfect follow-up email →
        you approve and send in <strong style={{ color: '#F0F0FF' }}>10 seconds.</strong>
      </p>

      {/* 3 steps */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '52px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          { icon: '📋', label: 'Paste invoice details' },
          { icon: '🤖', label: 'AI writes 3 email versions' },
          { icon: '✅', label: 'You pick one and send' },
        ].map((step, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '15px',
          }}>
            <span style={{ fontSize: '20px' }}>{step.icon}</span>
            <span style={{ color: '#C8C8E8' }}>{step.label}</span>
          </div>
        ))}
      </div>

      {/* Form or Success */}
      {status === 'success' ? (
        <div style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '16px',
          padding: '28px 40px',
          textAlign: 'center',
          maxWidth: '440px',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🎉</div>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#22C55E' }}>
            You&apos;re on the list!
          </div>
          <div style={{ fontSize: '15px', color: '#8B8FA8' }}>
            {count && count > 1 ? `${count} people` : 'You'} are waiting.
            We&apos;ll email you when we launch.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          gap: '12px',
          width: '100%',
          maxWidth: '480px',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={status === 'loading'}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '14px 20px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px',
              color: '#F0F0FF',
              fontSize: '16px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '14px 28px',
              background: status === 'loading' ? '#4348A0' : '#6366F1',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: status === 'loading' ? 'wait' : 'pointer',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {status === 'loading' ? 'Joining...' : 'Join waitlist — free'}
          </button>
          {status === 'error' && (
            <p style={{ width: '100%', textAlign: 'center', color: '#EF4444', fontSize: '14px', margin: '4px 0 0' }}>
              Something went wrong. Try again.
            </p>
          )}
        </form>
      )}

      {/* Social proof placeholder */}
      <p style={{
        marginTop: '20px',
        fontSize: '13px',
        color: '#525472',
      }}>
        No credit card required &bull; Free forever plan
      </p>

      {/* Pain stats */}
      <div style={{
        marginTop: '80px',
        display: 'flex',
        gap: '48px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {[
          { num: '70%', label: 'of freelancers deal with late payments' },
          { num: '$8,400', label: 'average lost per year to unpaid invoices' },
          { num: '2+ hrs', label: 'wasted weekly chasing clients' },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#6366F1' }}>{stat.num}</div>
            <div style={{ fontSize: '13px', color: '#525472', maxWidth: '140px', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

    </div>
  )
}
