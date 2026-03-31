import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import sql from '../../../lib/db'; // Sostituisci db con sql

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

    const result = await sql`
  INSERT INTO users (name, surname, email, password, country) 
  VALUES (${name}, ${surname}, ${email}, ${hashedPassword}, ${country})
  RETURNING id
`;

    // Il risultato è un array, quindi l'ID sarà nel primo elemento
    const userId = result[0].id;

    return NextResponse.json({ message: 'Registrato!', userId }, { status: 201 });

  } catch (error) {
    // Postgres usa il codice '23505' per gli errori di "Unique constraint" (email già esistente)
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Email già esistente' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Errore server' }, { status: 500 });
  }
}