'use client';

import { createContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// AuthContext ci permette di condividere lo stato di autenticazione in tutta l'app
export const AuthContext = createContext();
// AuthProvider avvolge l'app e fornisce le funzioni di login, registrazione e logout
// children sono i componenti figli che avranno accesso al contesto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  const router = useRouter();

  // 1. Al caricamento della pagina, chiediamo al server: "Chi sono?"
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const res = await fetch('/api/me'); // Chiama la tua API

        if (res.ok) {
          const data = await res.json();
          setUser(data.user); // Se ok, salva l'utente
        } else {
          setUser(null); // Se 401, nessuno è loggato
        }
      } catch (error) {
        console.error('Errore nel controllare lo stato di login:', error);
        setUser(null);
      } finally {
        setLoading(false); // Abbiamo finito di controllare
      }
    };
    checkUserLoggedIn();
  }, []);

  // 2. Funzione di Login
  const login = async (email, password) => {
    // "fetch" è il comando che dice al browser: "Prepara il pacchetto e SPEDISCILO a /api/login"
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Errore Login'); // Lancia l'errore se password errata
    }

    setUser(data.user);
    router.push('/dashboard'); // Porta alla dashboard
  };

  // 3. Funzione di Registrazione
  const register = async (formData) => {
    const res = await fetch('/api/register', {

      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Errore Registrazione');
    }

    // Dopo la registrazione, rimandiamo al login
    router.push('/login');
  };

  // 4. Logout (Semplice: puliamo lo stato e via al login)
  const logout = async () => {
    try {
      // Chiamiamo il server per cancellare il cookie (Passo 2)
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error("Errore logout server", err);
    }

    // Puliamo la RAM e andiamo via
    setUser(null);
    router.push('/login');
  };

  // AuthContext.Provider rende disponibili user, login, register, logout a tutta l'app
  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};