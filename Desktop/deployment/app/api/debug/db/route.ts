import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: failures, error } = await supabaseAdmin
      .from('failure_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('vercel_projects')
      .select('*');

    if (error || projectsError) {
      return NextResponse.json({ error: error || projectsError }, { status: 500 });
    }

    return NextResponse.json({ failures, projects });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
