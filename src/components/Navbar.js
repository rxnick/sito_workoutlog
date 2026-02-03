'use client';

import { useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, loading } = useContext(AuthContext);

  return (
    <nav className="navbar">

      {/* --- SINISTRA: Logo + Saluto  --- */}
      <div className="navbar-brand">
        {/* LOGO */}
        <Link href={user ? "/dashboard" : "/"}>
          <Image src="/logo.png"
            alt="WorkoutLog Logo"
            // Dimensioni dell'immagine originale
            width={1024} 
            height={559}
            className="navbar-logo"
            priority // Carica l'immagine subito
          />
        </Link>

        {/* SALUTO */}
        {loading ? (
          // Mettiamo un div vuoto per mantenere l'altezza
          <div className="navbar-greeting"><br></br></div>
        ) : user ?
          <span className="navbar-greeting">
            Ciao, {user.name}
          </span> : <span className="navbar-greeting">
            Benvenuto!
          </span>}

      </div>

      {/* LINK A DESTRA */}
      <div className="navbar-links">
        {loading ? (
          // Mettiamo un div vuoto per mantenere l'altezza
          <div className="navbar-greeting"></div>
        ) : user ? (
          // UTENTE LOGGATO (Dashboard)
          <>
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
            <Link href="/workouts/history" className="nav-link">Storico Allenamenti</Link>
            <Link href="/exercises" className="nav-link">Esercizi</Link>
            <Link href="/stats" className="nav-link">Statistiche</Link>
            <Link href="/profile" className="nav-link">Profilo</Link>
            <button onClick={logout} className="btn-logout-nav">Esci</button>
          </>
        ) : (
          // UTENTE NON LOGGATO (Home)
          <>
            <Link href="/login" className="nav-link">Accedi</Link>
            <Link href="/register" className="nav-link btn-register-nav">Registrati</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;