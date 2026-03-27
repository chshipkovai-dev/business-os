import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getDB() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const db = getDB()
  const { data, error } = await db
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const tasks = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    notes: row.notes || undefined,
    dueDate: row.due_date || undefined,
    category: row.category,
    priority: row.priority,
    source: row.source,
    done: row.done,
  }))
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-token')
  if (token !== process.env.INTERNAL_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { title, notes, dueDate, category = 'other', priority = 'normal', source = 'bot' } = body
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const db = getDB()
  const { data, error } = await db
    .from('tasks')
    .insert({ title, notes: notes || null, due_date: dueDate || null, category, priority, source })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, task: data })
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const body = await req.json()
  const db = getDB()
  const { error } = await db.from('tasks').update(body).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const db = getDB()
  const { error } = await db.from('tasks').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
