import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../../lib/db'; 

// --- DEFINIZIONE DEGLI HELPER (QUESTI SONO FONDAMENTALI!) ---
const run = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const getOne = (sql, params) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const getAll = (sql, params) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

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

    // Prendi il workout
    const workout = await getOne(
      `SELECT * FROM workouts WHERE id = ? AND user_id = ?`, 
      [id, user.id]
    );

    if (!workout) {
      return NextResponse.json({ error: 'Allenamento non trovato' }, { status: 404 });
    }

    // Prendi gli esercizi
    const exercises = await getAll(
      `SELECT we.*, e.name 
       FROM workout_exercises we
       LEFT JOIN exercises e ON we.exercise_id = e.id
       WHERE we.workout_id = ?`, 
      [id]
    );

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

    // Aggiorna Info Generali
    await run(
      `UPDATE workouts 
       SET name = ?, date = ?, notes = ?, start_time = ?, end_time = ? 
       WHERE id = ? AND user_id = ?`,
      [name, date, notes, start_time, end_time, id, user.id]
    );

    // Aggiorna Esercizi (Elimina vecchi -> Metti nuovi)
    await run(`DELETE FROM workout_exercises WHERE workout_id = ?`, [id]);

    if (exercises && exercises.length > 0) {
      for (const ex of exercises) {
        if (!ex.exercise_id) continue;

        await run(
          `INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, rest_time, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            ex.exercise_id, 
            ex.sets || 0, 
            ex.reps || 0, 
            ex.weight || 0, 
            ex.rest_time || 60, 
            ex.notes || ''
          ]
        );
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

    await run(`DELETE FROM workouts WHERE id = ? AND user_id = ?`, [id, user.id]);

    return NextResponse.json({ message: 'Allenamento eliminato' });

  } catch (error) {
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}