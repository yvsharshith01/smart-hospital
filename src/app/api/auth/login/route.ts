import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, password, roles(name)')
      .eq('email', email)
      .limit(1);

    if (userError) {
      console.error('SUPABASE USER QUERY ERROR:', userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (!users || users.length === 0 || users[0].password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];
    const roleName = (user.roles as any)?.name || 'DOCTOR';

    const token = jwt.sign(
      { userId: user.id, role: roleName, name: user.name },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: `User ${user.name} (${roleName}) logged in`,
      });
    } catch (e) {
      console.warn('Audit log insert skipped:', e);
    }

    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: roleName },
    });
  } catch (error: any) {
    console.error('DATABASE LOGIN ERROR:', error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}