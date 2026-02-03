'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import Link from 'next/link';

const HistoryPage = () => {
  const { user } = useContext(AuthContext);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetch('/api/workouts')
        .then(res => res.json())
        .then(data => {
          setWorkouts(data);
          setLoading(false);
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  // --- FUNZIONE PER FORMATTARE LA DATA ---
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Crea un oggetto Data
    const date = new Date(dateString);
    // Trasforma in Italiano (giorno numerico, mese lungo, anno numerico)
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long', // Usa 'short' se vuoi "Gen", 'numeric' se vuoi "01"
      year: 'numeric',
    });
  };

  if (!user) return null;

  return (
    <div className="workouts-container">

      <h1 className="page-title">
        Storico Allenamenti 📅
      </h1>

      {loading && <p className="loading-text">Caricamento...</p>}

      {!loading && workouts.length === 0 && (
        <div className="empty-state">
          <p>Non hai ancora registrato nessun allenamento.</p>
          <Link href="/workouts/new" className="btn-start-now">
            Inizia il primo!
          </Link>
        </div>
      )}

      <div className="workouts-grid">
        {workouts.map(workout => (
          <div key={workout.id} className="workout-card">

            <span className="workout-date">{formatDate(workout.date)}</span>
            <h3 className="workout-title">{workout.name}</h3>

            {workout.notes && (
              <p className="workout-notes">📝 {workout.notes}</p>
            )}

            <div className="card-footer">
              <Link href={`/workouts/${workout.id}`} className="btn-details">
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