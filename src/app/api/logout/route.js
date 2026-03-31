import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // 1. Recuperiamo l'ID della sessione prima di cancellarlo
  const sessionId = cookieStore.get('session_id')?.value;

  // 2. Pulizia lato Server: 
  // Eliminiamo i dati dalla memoria globale (se la sessione esiste)
  if (sessionId && global.sessions && global.sessions[sessionId]) {
    delete global.sessions[sessionId];
    console.log(`🗑️ Sessione ${sessionId} rimossa dal server.`);
  }

  // 3. Pulizia lato Browser:
  // Elimina il cookie 'session_id'
  cookieStore.delete('session_id');

  return NextResponse.json({ message: 'Logout effettuato' });
}