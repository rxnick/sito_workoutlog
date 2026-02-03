'use client';

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext'; 
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const Dashboard = () => {
  // loading: authLoading per evitare conflitti con dataLoading
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  const [workouts, setWorkouts] = useState([]);
  // Stato di caricamento dati workout 
  const [dataLoading, setDataLoading] = useState(true);
  
  // Stati per i numeri
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

        // Calcoliamo le Statistiche al volo
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Conta quanti allenamenti sono di questo mese.
        // Il callback di `filter` viene eseguito per ogni elemento di `data`;
        // `workout` è l'oggetto allenamento che contiene la proprietà `date`.
        const thisMonthCount = data.filter(workout => {
            if (!workout?.date) 
              return false; // ignora elementi senza data
            const wDate = new Date(workout.date);
            return wDate.getMonth() === currentMonth && wDate.getFullYear() === currentYear;
        }).length;

        setStats({
            total: data.length,
            thisMonth: thisMonthCount
        });
      }
    } catch (error) {
      console.error("Errore caricamento:", error);
    } finally {
      setDataLoading(false);
    }
  };

  if (authLoading) return <div className="loading-text">Caricamento profilo...</div>;
  if (!user) return null;

  // Prendiamo solo gli ultimi 3 per la lista
  const recentWorkouts = workouts.slice(0, 3);

  return (
    <div className="dashboard-container">

      {/* BENVENUTO */}
      <div className="welcome-section">
        <h1>Ciao, {user.name}! 👋</h1>
        <p>Ecco il riassunto della tua attività.</p>
      </div>

      {/* STATISTICHE NUMERICHE (Ora usiamo la griglia per i numeri veri) */}
      <div className="stats-section">
        <div className="stats-grid">
            <div className="stat-card">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Allenamenti Totali</span>
            </div>
            <div className="stat-card">
                <span className="stat-value">{stats.thisMonth}</span>
                <span className="stat-label">Questo Mese</span>
            </div>
        </div>
      </div>

      {/* AZIONI RAPIDE */}
      <h3 className="section-title">Menu Rapido</h3>
      <div className="dashboard-grid">
        <Link href="/workouts/new" className="dashboard-card card-new">
          <span className="card-icon">➕</span>
          <span className="card-title">Nuovo</span>
          <span className="card-desc">Crea scheda</span>
        </Link>

        <Link href="/workouts/history" className="dashboard-card card-history">
          <span className="card-icon">📅</span>
          <span className="card-title">Storico</span>
          <span className="card-desc">Vedi tutti</span>
        </Link>

        <Link href="/exercises" className="dashboard-card card-exercises">
          <span className="card-icon">💪</span>
          <span className="card-title">Esercizi</span>
          <span className="card-desc">La tua libreria</span>
        </Link>
      </div>

      <hr className="divider" />

      {/* ULTIMI 3 ALLENAMENTI (Cliccabili) */}
      <h3 className="section-title">Attività Recente</h3>    

      {dataLoading ? (
        <p>Caricamento...</p>
      ) : recentWorkouts.length > 0 ? (
        <div className="recent-list">
            {recentWorkouts.map((workout) => (
              <Link href={`/workouts/${workout.id}`} key={workout.id} className="recent-card-link">
                  <div className="stat-card recent-item">
                    <div style={{textAlign:'left'}}>
                        <span className="workout-date-badge">{formatDate(workout.date)}</span>
                        <span className="workout-name-list">{workout.name}</span>
                    </div>
                    <span className="arrow-icon">➔</span>
                  </div>
              </Link>
            ))}
        </div>
      ) : (
        <p className="empty-state-text">Non hai ancora registrato allenamenti.</p>
      )}

    </div>
  );
};

export default Dashboard;