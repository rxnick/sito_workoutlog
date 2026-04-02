'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import Link from 'next/link';

// --- IMPORTIAMO IL MODULO CSS ---
import styles from './History.module.css';

const HistoryPage = () => {
  const { user } = useContext(AuthContext);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch('/api/workouts')
        .then(res => res.json())
        .then(data => {
          setWorkouts(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setWorkouts([]); 
          setLoading(false);
        });
    }
  }, [user]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric',
    });
  };

  if (!user) return null;

  return (
    // Usa styles.workoutsContainer
    <div className={styles.workoutsContainer}>

      <h1 className={styles.pageTitle}>
        Storico Allenamenti 📅
      </h1>

      {loading && <p className={styles.loadingText}>Caricamento...</p>}

      {!loading && workouts.length === 0 && (
        <div className={styles.emptyState}>
          <p>Non hai ancora registrato nessun allenamento.</p>
          <Link href="/workouts/new" className={styles.btnStartNow}>
            Inizia il primo!
          </Link>
        </div>
      )}

      <div className={styles.workoutsGrid}>
        {workouts?.map(workout => (
          <div key={workout.id} className={styles.workoutCard}>

            <span className={styles.workoutDate}>{formatDate(workout.date)}</span>
            <h3 className={styles.workoutTitle}>{workout.name}</h3>
            
            {workout.start_time && (
              <span className={styles.workoutTimeInfo}>
                ⌚ {workout.start_time} - {workout.end_time}
              </span>
            )}
            
            {workout.notes && (
              <p className={styles.workoutNotes}>📝 {workout.notes}</p>
            )}

            <div className={styles.cardFooter}>
              <Link href={`/workouts/${workout.id}`} className={styles.btnDetails}>
                Vedi Dettagli →
              </Link>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;