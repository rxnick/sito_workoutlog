// Importi la libreria sqlite3
// .verbose() serve solo a avere errori più dettagliati e messaggi di debug più chiari
const sqlite3 = require('sqlite3').verbose();
// Serve per lavorare con i percorsi dei file
const path = require('path');

// Usiamo path.resolve per trovare il file nella cartella principale del progetto
// path.resolve(...) → crea un percorso assoluto
// process.cwd() → cartella principale del progetto
// 'database.sqlite' → nome del file del database. 
// Se il file non esiste, SQLite lo crea automaticamente. Se esiste, lo apre
const dbPath = path.resolve(process.cwd(), 'database.sqlite');

// Apertura o creazione del database SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Errore apertura DB:", err.message);
  } else {
    console.log("✅ Connesso al database SQLite.");

    // Attiva il supporto alle chiavi esterne
    // SQLite NON applica le foreign key di default. 
    // Questa riga: attiva i vincoli e rende validi ON DELETE CASCADE
    db.run("PRAGMA foreign_keys = ON");

    // Creazione Tabelle in ordine
    db.serialize(() => {

      // === 1. UTENTE ===
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        surname TEXT,          
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        country TEXT,          
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // === 2. ESERCIZIO ===
      db.run(`CREATE TABLE IF NOT EXISTS exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        muscle_group TEXT,
        image_url TEXT,       
        is_public INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        user_id INTEGER, 
        is_deleted INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // === 3. ALLENAMENTO ===
      db.run(`CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,              
        date TEXT NOT NULL,
        notes TEXT,
        start_time TEXT,        
        end_time TEXT,          
        user_id INTEGER NOT NULL, 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`);

      // === 4. COMPOSIZIONE ALLENAMENTO ===
      db.run(`CREATE TABLE IF NOT EXISTS workout_exercises (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workout_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        sets INTEGER,
        reps INTEGER,
        weight REAL,
        rest_time INTEGER DEFAULT 60, 
        notes TEXT,             
        FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id)
      )`);

      // === 5. FEEDBACK ===
      db.run(`CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,     
        exercise_id INTEGER NOT NULL, 
        rating INTEGER,               
        comment TEXT,                 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      )`);

    });
  }
});

// Rende disponibile il database per l'importazione alle routes
module.exports = db;