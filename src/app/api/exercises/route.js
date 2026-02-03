import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '../../../lib/db';

// --- HELPER DATABASE MIGLIORATI ---
const run = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const getAll = (sql, params) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const getOne = (sql, params) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

// --- GET: OTTIENI LISTA ESERCIZI ---
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    const user = global.sessions?.[sessionId];

    if (!user) return NextResponse.json([], { status: 401 });

    let sql = `
      SELECT e.*, u.name as creator_name 
      FROM exercises e
      JOIN users u ON e.user_id = u.id
      WHERE (e.is_public = 1 OR e.user_id = ?)
      AND e.is_deleted = 0
    `;
    
    const params = [user.id];

    if (query) {
      sql += ` AND (e.name LIKE ? OR e.muscle_group LIKE ?)`;
      params.push(`%${query}%`, `%${query}%`);
    }

    sql += ` ORDER BY e.name ASC`;

    const exercises = await getAll(sql, params);
    return NextResponse.json(exercises);

  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }w
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

    const result = await run(
      `INSERT INTO exercises (name, muscle_group, description, image_url, is_public, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, muscle_group || 'Altro', description || '', image_url || '', is_public ? 1 : 0, user.id]
    );

    return NextResponse.json({ id: result.lastID, message: 'Esercizio creato' });

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

    await run(
      `UPDATE exercises 
       SET name = ?, muscle_group = ?, description = ?, image_url = ?, is_public = ? 
       WHERE id = ? AND user_id = ?`,
      [name, muscle_group, description, image_url || '', is_public ? 1 : 0, id, user.id]
    );

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
    const targetExercise = await getOne(
        "SELECT id FROM exercises WHERE id = ? AND user_id = ?", 
        [id, user.id]
    );

    if (!targetExercise) {
       console.warn(`⚠️ Esercizio ${id} non trovato o non appartiene all'utente.`);
       return NextResponse.json({ error: 'Non autorizzato o esercizio non trovato' }, { status: 403 });
    }

    // Facciamo  UPDATE per "spegnere" l'esercizio
    await run("UPDATE exercises SET is_deleted = 1 WHERE id = ?", [id]);

    console.log(`✅ Esercizio ${id} archiviato con successo.`);
    return NextResponse.json({ message: 'Eliminato con successo' });

  } catch (error) {
    // QUESTO TI DIRÀ NEL TERMINALE ESATTAMENTE COSA SI ROMPE
    console.error("❌ ERRORE GRAVE DELETE:", error);
    return NextResponse.json({ error: 'Errore Server: ' + error.message }, { status: 500 });
  }
}