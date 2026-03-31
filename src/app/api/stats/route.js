import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '../../../lib/db';

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

      // In Supabase, per formattare la data come "YYYY-MM", si usa TO_CHAR(date, 'YYYY-MM').

      // TO_CHAR(date::date, 'YYYY-MM') serve a formattare la data in modo da avere solo anno e mese (es: 2024-06). 
      // In questo modo posso raggruppare tutti gli allenamenti che hanno la stessa data (stesso mese e anno) e contare quanti sono.

      // Nota: date::date serve a dire a Postgres "tratta questa stringa come una data". 
      // ::int assicura che il conteggio sia un numero e non una stringa.

      // Uso group by per raggruppare tutti gli allenamenti che hanno lo stesso mese e anno

      const workoutsByMonth = await sql`
    SELECT TO_CHAR(date::date, 'YYYY-MM') as month, COUNT(*)::int as count 
    FROM workouts 
    WHERE user_id = ${user.id} 
    GROUP BY month 
    ORDER BY month ASC 
    LIMIT 6
`;

      // 2. Distribuzione Muscoli (Conta quante volte hai fatto esercizi di quel gruppo)
      const muscleDist = await sql`
    SELECT e.muscle_group, COUNT(*)::int as count
    FROM workout_exercises we
    JOIN exercises e ON we.exercise_id = e.id
    JOIN workouts w ON we.workout_id = w.id
    WHERE w.user_id = ${user.id}
    GROUP BY e.muscle_group
`;

      return NextResponse.json({ workoutsByMonth, muscleDist });
    }

    // --- B. PROGRESSIONE CARICHI ---
    if (type === 'progression') {
      const exerciseId = searchParams.get('exercise_id');
      if (!exerciseId) return NextResponse.json([], { status: 400 });

      // Estraiamo la Data e il PESO MASSIMO sollevato in quel giorno per quell'esercizio
      const history = await sql`
    SELECT w.date, MAX(we.weight) as max_weight
    FROM workout_exercises we
    JOIN workouts w ON we.workout_id = w.id
    WHERE w.user_id = ${user.id} AND we.exercise_id = ${exerciseId}
    GROUP BY w.date
    ORDER BY w.date ASC
`;

      return NextResponse.json(history);
    }

    return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}