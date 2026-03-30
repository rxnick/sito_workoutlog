// Usiamo la libreria 'postgres' che è ottimizzata per Supabase e Vercel
import postgres from 'postgres';

// DATABASE_URL verrà letto dalle variabili d'ambiente di Vercel (o dal file .env locale)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ Attenzione: DATABASE_URL non trovata. Il database non funzionerà.");
}

// Creiamo il client di connessione
const sql = postgres(connectionString, {
  ssl: 'require', // Obbligatorio per connettersi in sicurezza a Supabase
});

// In PostgreSQL non serve PRAGMA foreign_keys perché sono attive di default.
// Esportiamo 'sql' per usarlo nelle tue rotte API
export default sql;