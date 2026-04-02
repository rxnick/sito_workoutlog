'use client';

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// IMPORTA IL MODULO CSS
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [workouts, setWorkouts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchWorkouts();
  }, [user]);

  const fetchWorkouts = async () => {
    try {
      const res = await fetch('/api/workouts');
      if (res.ok) {
        const data = await res.json();
        setWorkouts(data);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthCount = data.filter(workout => {
            if (!workout?.date) return false; 
            const wDate = new Date(workout.date);
            return wDate.getMonth() === currentMonth && wDate.getFullYear() === currentYear;
        }).length;

        setStats({ total: data.length, thisMonth: thisMonthCount });
      }
    } catch (error) {
      console.error("Errore caricamento:", error);
    } finally {
      setDataLoading(false);
    }
  };

  if (authLoading) return <div className={styles.loadingText}>Caricamento profilo...</div>;
  if (!user) return null;

  const recentWorkouts = workouts.slice(0, 3);

  return (
    <div className={styles.container}>

      {/* BENVENUTO */}
      <div className={styles.welcomeSection}>
        <h1 className={styles.title}>Ciao, {user.name}! 👋</h1>
        <p className={styles.subtitle}>Ecco il riassunto della tua attività.</p>
      </div>

      {/* STATISTICHE NUMERICHE */}
      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
            <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.total}</span>
                <span className={styles.statLabel}>Allenamenti Totali</span>
            </div>
            <div className={styles.statCard}>
                <span className={styles.statValue}>{stats.thisMonth}</span>
                <span className={styles.statLabel}>Questo Mese</span>
            </div>
        </div>
      </div>

      {/* AZIONI RAPIDE */}
      <h3 className={styles.sectionTitle}>Menu Rapido</h3>
      <div className={styles.dashboardGrid}>
        <Link href="/workouts/new" className={`${styles.dashboardCard} ${styles.cardNew}`}>
          <span className={styles.cardIcon}>➕</span>
          <span className={styles.cardTitle}>Nuovo</span>
          <span className={styles.cardDesc}>Crea scheda</span>
        </Link>

        <Link href="/workouts/history" className={`${styles.dashboardCard} ${styles.cardHistory}`}>
          <span className={styles.cardIcon}>📅</span>
          <span className={styles.cardTitle}>Storico</span>
          <span className={styles.cardDesc}>Vedi tutti</span>
        </Link>

        <Link href="/exercises" className={`${styles.dashboardCard} ${styles.cardExercises}`}>
          <span className={styles.cardIcon}>💪</span>
          <span className={styles.cardTitle}>Esercizi</span>
          <span className={styles.cardDesc}>La tua libreria</span>
        </Link>
      </div>

      <hr className={styles.divider} />

      {/* ULTIMI 3 ALLENAMENTI */}
      <h3 className={styles.sectionTitle}>Attività Recente</h3>    

      {dataLoading ? (
        <p className={styles.loadingText}>Caricamento...</p>
      ) : recentWorkouts.length > 0 ? (
        <div className={styles.recentList}>
            {recentWorkouts.map((workout) => (
              <Link href={`/workouts/${workout.id}`} key={workout.id} className={styles.recentCardLink}>
                  <div className={`${styles.statCard} ${styles.recentItem}`}>
                    <div className={styles.recentItemText}> {/* SOSTITUITO LO STYLE INLINE! */}
                        <span className={styles.workoutDateBadge}>{formatDate(workout.date)}</span>
                        <span className={styles.workoutNameList}>{workout.name}</span>
                    </div>
                    <span className={styles.arrowIcon}>➔</span>
                  </div>
              </Link>
            ))}
        </div>
      ) : (
        <p className={styles.emptyStateText}>Non hai ancora registrato allenamenti.</p>
      )}

    </div>
  );
};

export default Dashboard;