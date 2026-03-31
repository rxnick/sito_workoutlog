import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '../../../lib/db';
import bcrypt from 'bcrypt';

// --- GET: LEGGI PROFILO + STATISTICHE (Usato da AuthContext e Profilo) ---
export async function GET(request) {
  try {
    // Recupera tutti i cookie della richiesta HTTP dal request che il browser ha appena inviato
    const cookieStore = await cookies();
    // Cerca il cookie chiamato session_id 
    // ?.value serve per evitare crash se il cookie non c’è (in tal caso, il cookie è undefined)
    const sessionId = cookieStore.get('session_id')?.value;
    // Cerca la sessione che corrisponde a sessionId in global.sessions 
    const userSession = global.sessions?.[sessionId];

    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // --- Recupero Profilo ---
    const users = await sql`SELECT id, name, surname, email, country, profile_image, created_at FROM users WHERE id = ${userSession.id}`;
    const userProfile = users[0];

    // Statistiche
    // --- Recupero Statistiche (Conteggi) ---
    // In Postgres, COUNT(*) restituisce spesso una stringa, quindi usiamo parseInt per sicurezza
    const workoutRes = await sql`SELECT COUNT(*) FROM workouts WHERE user_id = ${userSession.id}`;
    const exerciseRes = await sql`SELECT COUNT(*) FROM exercises WHERE user_id = ${userSession.id} AND is_deleted = false`;

    const responseData = {
      ...userProfile,
      stats: {
        workouts: parseInt(workoutRes[0].count) || 0,
        exercises: parseInt(exerciseRes[0].count) || 0
      }
    };
    // La sintassi user : serve per incapsuale dati dentro la chiave "user"
    return NextResponse.json({ user: responseData }); // Nota: restituisco { user: ... } per compatibilità col frontend

  } catch (error) {
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}

// --- PUT: AGGIORNA PROFILO COMPLETO ---
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const userSession = global.sessions?.[sessionId];

    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, surname, country, profile_image, new_password } = body;

    // 1. Aggiorna i dati anagrafici base
    await sql`
  UPDATE users 
  SET name = ${name}, surname = ${surname}, country = ${country}, profile_image = ${profile_image} 
  WHERE id = ${userSession.id}
`;

    // 2. SE c'è una nuova password, la criptiamo e la aggiorniamo
    if (new_password && new_password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await sql`UPDATE users SET password = ${hashedPassword} WHERE id = ${userSession.id}`;
    }

    // 3. AGGIORNA SESSIONE IN MEMORIA (Fondamentale per vedere le modifiche subito!)
    if (global.sessions[sessionId]) {
      global.sessions[sessionId].name = name;
      global.sessions[sessionId].surname = surname;
      global.sessions[sessionId].country = country;
      global.sessions[sessionId].profile_image = profile_image;
    }

    return NextResponse.json({ message: 'Profilo aggiornato' });
  } catch (error) {
    console.error("Errore PUT Profile:", error);
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}

// --- DELETE: ELIMINA ACCOUNT ---
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const userSession = global.sessions?.[sessionId];

    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Elimina dal DB
    await sql`DELETE FROM users WHERE id = ${userSession.id}`;

    // Pulisce sessione e cookie
    delete global.sessions[sessionId];
    cookieStore.delete('session_id');

    return NextResponse.json({ message: 'Account eliminato' });

  } catch (error) {
    return NextResponse.json({ error: 'Errore Server' }, { status: 500 });
  }
}