import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getTier(score: number): 'S' | 'A' | 'B' {
  if (score >= 8.0) return 'S'
  if (score >= 7.5) return 'A'
  return 'B'
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Порог 7.0 — совпадает со скаутом (run-daily-scout.mjs line 433)
  // Было 7.5 → идеи 7.0–7.4 сохранялись в базе но не показывались на сайте
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .gte('total_score', 7.0)
    .order('total_score', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ideas = (data ?? []).map((row, i) => ({
    id: i + 1,
    title: row.title,
    description: row.description ?? '',
    score: row.total_score ?? 0,
    tier: getTier(row.total_score ?? 0),
    market: row.market_score ?? 0,
    pain: row.market_score ?? 0,
    mono: row.monetization_score ?? 0,
    speed: row.build_difficulty ?? 0,
    competition: row.competition_score ?? 0,
    audience: row.target_audience ?? '',
    price: '',
    tags: row.tags ?? [],
    status: row.status ?? 'new',
  }))

  return NextResponse.json(ideas)
}
