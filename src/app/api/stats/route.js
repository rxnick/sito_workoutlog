import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../lib/db';

const getAll = (sql, params) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'general' o 'progression'

    // --- A. STATISTICHE GENERALI ---
    if (type === 'general') {
        
        // 1. Allenamenti al Mese (Ultimi 6 mesi)
        // SQLite usa strftime per estrarre mese e anno e togliere il giorno
        // Uso group by per raggruppare tutti gli allenamenti che hanno lo stesso mese e anno
        const workoutsByMonth = await getAll(`
            SELECT strftime('%Y-%m', date) as month, COUNT(*) as count 
            FROM workouts 
            WHERE user_id = ? 
            GROUP BY month 
            ORDER BY month ASC 
            LIMIT 6
        `, [user.id]);

        // 2. Distribuzione Muscoli (Conta quante volte hai fatto esercizi di quel gruppo)
        const muscleDist = await getAll(`
            SELECT e.muscle_group, COUNT(*) as count
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            JOIN workouts w ON we.workout_id = w.id
            WHERE w.user_id = ?
            GROUP BY e.muscle_group
        `, [user.id]);

        return NextResponse.json({ workoutsByMonth, muscleDist });
    }

    // --- B. PROGRESSIONE CARICHI ---
    if (type === 'progression') {
        const exerciseId = searchParams.get('exercise_id');
        if (!exerciseId) return NextResponse.json([], { status: 400 });

        // Estraiamo la Data e il PESO MASSIMO sollevato in quel giorno per quell'esercizio
        const history = await getAll(`
            SELECT w.date, MAX(we.weight) as max_weight
            FROM workout_exercises we
            JOIN workouts w ON we.workout_id = w.id
            WHERE w.user_id = ? AND we.exercise_id = ?
            GROUP BY w.date
            ORDER BY w.date ASC
        `, [user.id, exerciseId]);

        return NextResponse.json(history);
    }

    return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}