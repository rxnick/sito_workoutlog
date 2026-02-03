import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../lib/db';

// Helper per gestire le query come Promise (per usare await)

// new Promise: È come dire al codice: "Fermati qui. Ti prometto che ti darò un risultato, ma devi aspettare che io finisca"
const runQuery = (query, params) => new Promise((resolve, reject) => { 
  // db.run esegue la query (INSERT, UPDATE, DELETE)
  db.run(query, params, function (err) {
    if (err)
      reject(err);    // Se va male, rompi la promessa (Errore)
    else
      resolve(this);  // Se va bene, mantieni la promessa e dai i dati
  });
});

const getQuery = (query, params) => new Promise((resolve, reject) => {
  // db.all prende tutti i risultati della query
  db.all(query, params, (err, rows) => {
    if (err)
      reject(err); // Se va male, rompi la promessa (Errore)
    else
      resolve(rows); // Se va bene, mantieni la promessa e dai i dati (le righe)
  });
});

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

    let sql = `SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC`;

    // grazie alle Promise possiamo aspettare il risultato della query
    const workouts = await getQuery(sql, [user.id]);
    // Il codice SI CONGELA qui finché la Promise non fa 'resolve'.
    return NextResponse.json(workouts);
    // Ora 'workouts' ha i dati che vogliamo
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

    const result = await runQuery(
      `INSERT INTO workouts (user_id, name, date, notes, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, name, date, notes, start_time, end_time]
    );

    const newWorkoutId = result.lastID;

    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        await runQuery(
          `INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, rest_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [newWorkoutId, ex.exercise_id, ex.sets, ex.reps, ex.weight, ex.rest_time || 0, ex.notes || '']
        );
      }
    }

    return NextResponse.json({ message: 'Allenamento salvato!', id: newWorkoutId });

  } catch (error) {
    console.error("Errore salvataggio:", error);
    return NextResponse.json({ error: 'Errore nel salvataggio' }, { status: 500 });
  }
}