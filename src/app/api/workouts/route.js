import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '../../../lib/db';

// --- METODO GET (Per la Dashboard) ---
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    if (!global.sessions) global.sessions = {};
    const user = global.sessions[sessionId];

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    const workouts = await sql`
  SELECT * FROM workouts 
  WHERE user_id = ${user.id} 
  ORDER BY date DESC
`;
    return NextResponse.json(workouts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- METODO POST (Per Salvare Nuovo Allenamento) ---
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    if (!global.sessions) global.sessions = {};
    const user = global.sessions[sessionId];
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const body = await request.json();
    // Destrutturazione
    const { name, date, notes, start_time, end_time, exercises } = body;

    if (!name || !date) return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });

    // 1. Inserimento dell'allenamento principale
    const result = await sql`
  INSERT INTO workouts (user_id, name, date, notes, start_time, end_time) 
  VALUES (${user.id}, ${name}, ${date}, ${notes}, ${start_time}, ${end_time})
  RETURNING id
`;

    // 2. Recupero dell'ID (Postgres restituisce un array, quindi prendiamo il primo elemento)
    const newWorkoutId = result[0].id;

    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        await sql`
  INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, rest_time, notes) 
  VALUES (${newWorkoutId}, ${ex.exercise_id}, ${ex.sets}, ${ex.reps}, ${ex.weight}, ${ex.rest_time || 0}, ${ex.notes || ''})
`;
      }
    }

    return NextResponse.json({ message: 'Allenamento salvato!', id: newWorkoutId });

  } catch (error) {
    console.error("Errore salvataggio:", error);
    return NextResponse.json({ error: 'Errore nel salvataggio' }, { status: 500 });
  }
}