'use client';

import { useContext, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../context/AuthContext'; 
import styles from './Home.module.css'; 

export default function Home() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    /* NIENTE PIÙ CSS INLINE QUI! 🎉 */
    return <div className={styles.loadingState}>Caricamento...</div>;
  }

  return (
    <div className={styles.container}>
      
      <h1 className={styles.title}>WorkoutLog 💪</h1>
      
      <p className={styles.subtitle}>
        Il tuo diario di allenamento digitale.<br />
        Tieni traccia dei tuoi progressi, crea schede e supera i tuoi limiti.
      </p>

      <div className={styles.buttonGroup}>
        <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>
          Inizia Ora
        </Link>

        <Link href="/login" className={`${styles.btn} ${styles.btnSecondary}`}>
          Accedi
        </Link>
      </div>

    </div>
  );
}