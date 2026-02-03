import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Elimina il cookie 'session_id'
  cookieStore.delete('session_id');

  return NextResponse.json({ message: 'Logout effettuato' });
}