import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '../../../lib/db';

// --- GET: OTTIENI LISTA ESERCIZI ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];

    if (!user) return NextResponse.json([], { status: 401 });

    // Cerca questo blocco e sostituiscilo:
    let exercises;
    if (query) {
      const searchTerm = `%${query}%`;
      exercises = await sql`
    SELECT e.*, u.name as creator_name 
    FROM exercises e
    JOIN users u ON e.user_id = u.id
    WHERE (e.is_public = true OR e.user_id = ${user.id})
    AND e.is_deleted = false
    AND (e.name ILIKE ${searchTerm} OR e.muscle_group ILIKE ${searchTerm})
    ORDER BY e.name ASC
  `;
    } else {
      exercises = await sql`
    SELECT e.*, u.name as creator_name 
    FROM exercises e
    JOIN users u ON e.user_id = u.id
    WHERE (e.is_public = true OR e.user_id = ${user.id})
    AND e.is_deleted = false
    ORDER BY e.name ASC
  `;
    }
    return NextResponse.json(exercises);

  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST: CREA NUOVO ESERCIZIO ---
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, muscle_group, description, image_url, is_public } = body;

    if (!name) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 });

    const result = await sql`
  INSERT INTO exercises (name, muscle_group, description, image_url, is_public, user_id) 
  VALUES (${name}, ${muscle_group || 'Altro'}, ${description || ''}, ${image_url || ''}, ${is_public ? true : false}, ${user.id})
  RETURNING id
`;

    return NextResponse.json({ id: result[0].id, message: 'Esercizio creato' });

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- PUT: MODIFICA ESERCIZIO ---
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, name, muscle_group, description, image_url, is_public } = body;

    if (!id || !name) return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });

    await sql`
  UPDATE exercises 
  SET name = ${name}, 
      muscle_group = ${muscle_group}, 
      description = ${description}, 
      image_url = ${image_url || ''}, 
      is_public = ${is_public ? true : false} 
  WHERE id = ${id} AND user_id = ${user.id}
`;

    return NextResponse.json({ message: 'Esercizio aggiornato' });

  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE: ELIMINA ESERCIZIO  ---
export async function DELETE(request) {
  try {
    // Nell'URL c'è il punto interrogativo ?. Questo si chiama Query Parameter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    console.log(`🗑️ Tentativo eliminazione esercizio ID: ${id} da parte di User: ${user.id}`);

    // 1. Controlla se l'esercizio esiste ed è dell'utente
    const exercises = await sql`
    SELECT id FROM exercises WHERE id = ${id} AND user_id = ${user.id}
`;

    if (exercises.length === 0) {
      return NextResponse.json({ error: 'Non autorizzato o esercizio non trovato' }, { status: 403 });
    }

    // 2. Facciamo UPDATE per "spegnere" l'esercizio (soft delete)
    await sql`UPDATE exercises SET is_deleted = true WHERE id = ${id}`;

    console.log(`✅ Esercizio ${id} archiviato con successo.`);
    return NextResponse.json({ message: 'Eliminato con successo' });

  } catch (error) {
    // QUESTO TI DIRÀ NEL TERMINALE ESATTAMENTE COSA SI ROMPE
    console.error("❌ ERRORE GRAVE DELETE:", error);
    return NextResponse.json({ error: 'Errore Server: ' + error.message }, { status: 500 });
  }
}