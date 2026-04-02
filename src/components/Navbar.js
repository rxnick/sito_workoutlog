'use client';

import { useContext, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthContext } from '../context/AuthContext';
import styles from './Navbar.module.css'; 

const Navbar = () => {
  const { user, logout, loading } = useContext(AuthContext);
  // Stato per il menu del telefono (aperto/chiuso)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Funzione per chiudere il menu dopo aver cliccato un link
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className={styles.navbar}>

      {/* --- SINISTRA: Logo + Identificativo Utente --- */}
      <div className={styles.brand}>
        {/* LOGO */}
        <Link href={user ? "/dashboard" : "/"} onClick={closeMenu}>
          <Image src="/logo.png"
            alt="WorkoutLog Logo"
            width={1024} 
            height={559}
            className={styles.logo}
          />
        </Link>

        {/* IDENTIFICATIVO */}
        {loading ? (
          <div className={styles.greeting}><br></br></div>
        ) : user ?
          /* Rimosso "Ciao," per evitare ripetizioni con la dashboard */
          <span className={styles.greeting}>{user.name}</span> 
          : 
          <span className={styles.greeting}>Benvenuto!</span>
        }
      </div>

      {/* --- BOTTONE MENU HAMBURGER (Solo Telefono) --- */}
      <button 
        className={styles.menuToggle} 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? '✖' : '☰'} 
      </button>

      {/* --- LINK A DESTRA --- */}
      {/* Se il menu è aperto, aggiunge la classe styles.linksOpen */}
      <div className={`${styles.links} ${isMenuOpen ? styles.linksOpen : ''}`}>
        
        {loading ? (
          <div className={styles.greeting}></div>
        ) : user ? (
          <>
            <Link href="/dashboard" className={styles.navLink} onClick={closeMenu}>Dashboard</Link>
            <Link href="/workouts/history" className={styles.navLink} onClick={closeMenu}>Storico Allenamenti</Link>
            <Link href="/exercises" className={styles.navLink} onClick={closeMenu}>Esercizi</Link>
            <Link href="/stats" className={styles.navLink} onClick={closeMenu}>Statistiche</Link>
            <Link href="/profile" className={styles.navLink} onClick={closeMenu}>Profilo</Link>
            <button onClick={() => { logout(); closeMenu(); }} className={styles.btnLogout}>Esci</button>
          </>
        ) : (
          <>
            <Link href="/login" className={styles.navLink} onClick={closeMenu}>Accedi</Link>
            <Link href="/register" className={`${styles.navLink} ${styles.btnRegister}`} onClick={closeMenu}>Registrati</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;