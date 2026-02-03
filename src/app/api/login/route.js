import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
/* UUID (Universally Unique Identifier) è un identificatore lungo 128 bit (122 bit la v4).
Esistono più versioni di UUID, e la v4 è quella basata su numeri casuali*/
import { v4 as uuidv4 } from 'uuid';
import db from '../../../lib/db'; 
import { cookies } from 'next/headers';

// 
if (!global.sessions) {
  global.sessions = {};
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log(`Tentativo di login per: ${email}`); // LOG 1

    // Cerca Utente
    const user = await new Promise((resolve, reject) => {
      // Nota: ho aggiunto il controllo degli errori
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          console.error("❌ Errore SQL:", err); // LOG 2
          reject(err);
        }
        resolve(row);
      });
    });

    if (!user) {
      console.log("❌ Utente non trovato nel DB"); // LOG 3
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 401 });
    }

    // Controlla Password
    // Confronta la password inviata con l'hash salvato
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("❌ Password errata"); // LOG 4
      return NextResponse.json({ error: 'Password errata' }, { status: 401 });
    }

    // CREAZIONE DELLA SESSIONE

    // 1. Generiamo una stringa casuale e lunghissima (es. "550e8400-e29b...")
    // Questo sarà il codice univoco che identifica QUESTO login specifico.
    const sessionId = uuidv4();
    // 2. Creazione della sessione sul server
    // global.sessions è una variabile globale in memoria del server Node.js che serve per memorizzare le sessioni degli utenti loggati
    // Usiamo l'oggetto 'global' così la sessione non si perde se navighiamo tra le pagine.
    global.sessions[sessionId] = {
      id: user.id,
      name: user.name,
      surname: user.surname, 
      email: user.email,
      country: user.country
    };

    console.log("✅ Login riuscito! Session ID creato.");

    // Inizializziamo il gestore dei cookie di Next.js
    const cookieStore = await cookies(); 
    
    // Calcoliamo 1 giorno in secondi: 60 sec * 60 min * 24 h
    const age = 60 * 60 * 24;

    // Scriviamo il cookie nel browser dell'utente
    cookieStore.set('session_id', sessionId, {
      httpOnly: true, // Impedisce a JavaScript lato client di leggere il cookie
      path: '/', // Cookie valido per tutto il sito
      maxAge: age, // Il cookie si autodistrugge dopo 24 ore (la durata di age).
    });

    return NextResponse.json({ message: 'Login OK', user });

  } catch (error) {
    console.error("🔥 ERRORE SERVER CRITICO:", error); 
    return NextResponse.json({ error: error.message || 'Errore del server' }, { status: 500 });
  }
}