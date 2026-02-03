import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import db from '../../../lib/db'; 

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, surname, email, password, country } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }
    // Hash della password prima di salvarla
    // 10 è il numero di "salt rounds" per bcrypt, cioè il numero di iterazioni che l'algoritmo di hashing fa
    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await new Promise((resolve, reject) => {
      const query = `INSERT INTO users (name, surname, email, password, country) VALUES (?, ?, ?, ?, ?)`;
      db.run(query, [name, surname, email, hashedPassword, country], function (err) {
        if (err) 
          reject(err);
        else 
          resolve(this.lastID);
      });
    });

    return NextResponse.json({ message: 'Registrato!', userId }, { status: 201 });

  } catch (error) {
    if (error.message && error.message.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Email già esistente' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}