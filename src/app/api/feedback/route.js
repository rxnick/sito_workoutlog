import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '../../../lib/db';

// --- GET: OTTIENI RECENSIONI DI UN ESERCIZIO ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exercise_id');

    if (!exerciseId) return NextResponse.json([], { status: 400 });

    // Prendi le recensioni e unisci con la tabella utenti per avere il nome di chi scrive
    const feedbackList = await sql`
  SELECT f.*, u.name as user_name, u.surname as user_surname
  FROM feedback f
  JOIN users u ON f.user_id = u.id
  WHERE f.exercise_id = ${exerciseId}
  ORDER BY f.created_at DESC
`;

    return NextResponse.json(feedbackList);
  } catch (error) {
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}

// --- POST: AGGIUNGI RECENSIONE ---
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { exercise_id, rating, comment } = body;

    if (!exercise_id || !rating) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }

    await sql`
  INSERT INTO feedback (user_id, exercise_id, rating, comment) 
  VALUES (${user.id}, ${exercise_id}, ${rating}, ${comment || ''})
`;

    return NextResponse.json({ message: 'Feedback inviato' });

  } catch (error) {
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}

// --- DELETE: ELIMINA RECENSIONE ---
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Cancella solo se l'ID utente corrisponde (o se sei admin, ma per ora semplifichiamo)
    await sql`
  DELETE FROM feedback 
  WHERE id = ${id} AND user_id = ${user.id}
`;
    return NextResponse.json({ message: 'Feedback eliminato' });
  } catch (error) {
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}