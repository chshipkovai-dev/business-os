import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getTier(score: number): 'S' | 'A' | 'B' {
  if (score >= 8.0) return 'S'
  if (score >= 7.5) return 'A'
  return 'B'
}

export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(request.url)
  const showArchived = searchParams.get('archived') === 'true'

  let query = supabase.from('ideas').select('*').order('total_score', { ascending: false })

  if (showArchived) {
    query = query.eq('status', 'archived')
  } else {
    query = query.gte('total_score', 7.0).neq('status', 'archived')
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ideas = (data ?? []).map((row) => ({
    id: row.id,
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
    created_at: row.created_at ?? null,
  }))

  return NextResponse.json(ideas)
}
