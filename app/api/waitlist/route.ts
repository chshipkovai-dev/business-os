import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Insert email (ignore duplicate)
  const { error } = await supabase
    .from('waitlist')
    .upsert({ email, product: 'freelance-payment-agent' }, { onConflict: 'email' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get total count
  const { count } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
    .eq('product', 'freelance-payment-agent')

  return NextResponse.json({ ok: true, count: count ?? 1 })
}
