import { NextResponse } from 'next/server';
import db from '../../../lib/db'; 
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Inizializzo global.resetTokens, un oggetto che salvo in memoria e che uso come archivio temporaneo per i codici OTP (One Time Password)
if (!global.resetTokens) {
    global.resetTokens = {};
}

// Helper DB
const run = (sql, params) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
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

export async function POST(request) {
    try {
        const body = await request.json();
        const { action, email, token, new_password } = body;

        // --- FASE 1: GENERA CODICE ---
        if (action === 'request') {
            const user = await getOne("SELECT id FROM users WHERE email = ?", [email]);
            
            if (!user) {
                return NextResponse.json({ error: 'Email non trovata.' }, { status: 404 });
            }

            const resetToken = crypto.randomInt(100000, 999999).toString();
            
            global.resetTokens[email] = {
                token: resetToken,
                expires: Date.now() + 15 * 60 * 1000 // il token dura 15 minuti
            };

            // Restituisce il codice al frontend per la simulazione
            return NextResponse.json({ 
                message: 'Codice generato!', 
                debug_code: resetToken 
            });
        }

        // --- FASE 2: CAMBIA PASSWORD ---
        if (action === 'reset') {
            // Vai nell'oggetto, cerca l'etichetta con la mail che mi interessa e dammi tutto quello che c'è dentro (token e scadenza) 
            const savedData = global.resetTokens[email];

            if (!savedData) return NextResponse.json({ error: 'Richiesta scaduta o non trovata.' }, { status: 400 });
            if (savedData.token !== String(token)) return NextResponse.json({ error: 'Codice errato.' }, { status: 400 }); // Conversione in stringa per sicurezza
            
            // Hash della nuova password
            const hashedPassword = await bcrypt.hash(new_password, 10);
            
            // Aggiornamento nel DB
            await run("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

            // Pulizia così il codice non può essere riutilizzato
            delete global.resetTokens[email];

            return NextResponse.json({ message: 'Password aggiornata!' });
        }

        return NextResponse.json({ error: 'Azione non valida' }, { status: 400 });

    } catch (error) {
        console.error("ERRORE API:", error);
        return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
    }
}