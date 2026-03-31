import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '../../../../lib/db';

// --- GET: OTTIENI DETTAGLI ---
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;

    // Controlla sessione
    const user = global.sessions?.[sessionId];
    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }

    // 1. Prendi il workout
    const workouts = await sql`
  SELECT * FROM workouts 
  WHERE id = ${id} AND user_id = ${user.id}
`;
    const workout = workouts[0]; // Prendi il primo (e unico) risultato

    if (!workout) {
      return NextResponse.json({ error: 'Allenamento non trovato' }, { status: 404 });
    }

    // 2. Prendi gli esercizi collegati
    const exercises = await sql`
  SELECT we.*, e.name 
  FROM workout_exercises we
  LEFT JOIN exercises e ON we.exercise_id = e.id
  WHERE we.workout_id = ${id}
`;

    return NextResponse.json({ workout, exercises });

  } catch (error) {
    console.error("Errore GET Workout:", error);
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}

// --- PUT: MODIFICA ---
export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    // Auth
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    const body = await request.json();
    const { name, date, notes, start_time, end_time, exercises } = body;

    // 1. Aggiorna Info Generali
    await sql`
  UPDATE workouts 
  SET name = ${name}, date = ${date}, notes = ${notes}, start_time = ${start_time}, end_time = ${end_time} 
  WHERE id = ${id} AND user_id = ${user.id}
`;

    // 2. Aggiorna Esercizi (Elimina vecchi -> Metti nuovi)
    await sql`DELETE FROM workout_exercises WHERE workout_id = ${id}`;

    if (exercises && exercises.length > 0) {
      // Prepariamo i dati per un inserimento multiplo o usiamo un loop
      for (const ex of exercises) {
        if (!ex.exercise_id) continue;

        await sql`
      INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, rest_time, notes) 
      VALUES (${id}, ${ex.exercise_id}, ${ex.sets || 0}, ${ex.reps || 0}, ${ex.weight || 0}, ${ex.rest_time || 60}, ${ex.notes || ''})
    `;
      }
    }

    return NextResponse.json({ message: 'Allenamento aggiornato con successo!' });

  } catch (error) {
    console.error("Errore PUT Workout:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: ELIMINA ---
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    await sql`DELETE FROM workouts WHERE id = ${id} AND user_id = ${user.id}`;

    return NextResponse.json({ message: 'Allenamento eliminato' });

  } catch (error) {
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}