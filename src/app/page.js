'use client';

import { useContext, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div style={{textAlign: 'center', marginTop: '50px'}}>Caricamento...</div>;
  }

  return (
    // Usa le classi di Home.css
    <div className="home-container">
      
      <h1 className="home-title">WorkoutLog 💪</h1>
      
      <p className="home-subtitle">
        Il tuo diario di allenamento digitale.<br />
        Tieni traccia dei tuoi progressi, crea schede e supera i tuoi limiti.
      </p>

      <div style={{ marginTop: '30px' }}>
        {/* Classi combinate: btn-home (generale) + btn-primary (colore blu) */}
        <Link href="/register" className="btn-home btn-primary">
          Inizia Ora
        </Link>

        {/* Classi combinate: btn-home (generale) + btn-secondary (colore grigio) */}
        <Link href="/login" className="btn-home btn-secondary">
          Accedi
        </Link>
      </div>

    </div>
  );
}