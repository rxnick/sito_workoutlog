'use client';

import { useState, useEffect, useContext, use } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import ConfirmModal from '../../../components/ConfirmModal'; 

// --- IMPORTIAMO IL MODULO CSS ---
import styles from './WorkoutDetail.module.css';

const WorkoutDetailPage = ({ params }) => {
  const { id } = use(params);
  const { user } = useContext(AuthContext);
  const router = useRouter();
  
  const [workoutData, setWorkoutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configurazione Modale
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: false
  });

  useEffect(() => {
    if (user && id) {
      fetch(`/api/workouts/${id}`)
        .then(res => {
          if (!res.ok) throw new Error("Errore nel caricamento");
          return res.json();
        })
        .then(data => {
          if (data.error) throw new Error(data.error);
          setWorkoutData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError("Impossibile caricare l'allenamento.");
          setLoading(false);
        });
    }
  }, [user, id]);

  const handleDeleteClick = () => {
    setModalConfig({
        isOpen: true,
        title: "Elimina Allenamento ⚠️",
        message: "Sei sicuro di voler eliminare questa scheda? L'operazione non è reversibile.",
        isDanger: true,
        confirmText: "Sì, Elimina",
        onConfirm: confirmDelete
    });
  };

  const confirmDelete = async () => {
    try {
        const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' });
        if (res.ok) {
            router.push('/workouts/history'); 
        } else {
            alert("Errore durante l'eliminazione.");
        }
    } catch (err) {
        alert("Errore di connessione.");
    } finally {
        setModalConfig({ ...modalConfig, isOpen: false });
    }
  };

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  if (!user) return null;
  
  if (loading) return <div className={styles.container}><p className={styles.loadingText}>Caricamento dettagli...</p></div>;
  if (error) return <div className={styles.container}><p className={styles.errorText}>{error}</p></div>;
  if (!workoutData || !workoutData.workout) return <div className={styles.container}><p className={styles.errorText}>Allenamento non trovato.</p></div>;

  const { workout, exercises } = workoutData;

  return (
    <div className={styles.container}>

      <Link href="/workouts/history">
        <button className={styles.btnBack}>← Torna allo Storico</button>
      </Link>

      <div className={styles.detailHeader}>
        <span className={styles.detailDate}>{formatDate(workout.date)}</span>
        <h1 className={styles.title}>{workout.name}</h1>
        
        <span className={styles.timeInfo}>
          {workout.start_time} - {workout.end_time}
        </span>

        {workout.notes && (
          <div className={styles.detailNotes}>
            📝 Note Allenamento: {workout.notes}
          </div>
        )}
      </div>

      <h3 className={styles.sectionTitle}>Esercizi Svolti</h3>

      {exercises && exercises.length > 0 ? (
        <div className={styles.tableResponsive}>
          <table className={styles.workoutTable}>
            <thead>
              <tr>
                <th>Esercizio</th>
                <th className={styles.textCenter}>Serie</th>
                <th className={styles.textCenter}>Reps</th>
                <th className={styles.textCenter}>Kg</th>
                <th className={styles.textCenter}>Recupero</th>
                <th>Note Esercizio</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex, index) => (
                <tr key={index}>
                  <td>{ex.name || 'Esercizio'}</td>
                  <td className={styles.textCenter}>{ex.sets}</td>
                  <td className={styles.textCenter}>{ex.reps}</td>
                  <td className={styles.textCenter}>{ex.weight}</td>
                  <td className={styles.textCenter}>{ex.rest_time} sec</td>
                  <td className={styles.noteCell}>
                    {ex.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.emptyStateText}>
          Nessun esercizio registrato per questo allenamento.
        </p>
      )}

      {/* Bottoni Azione */}
      <div className={styles.actionButtonsContainer}>
        <button onClick={handleDeleteClick} className={styles.btnDelete}>
            🗑️ Elimina
        </button>

        <Link href={`/workouts/${id}/edit`} className={styles.btnEdit}>
          ✏️ Modifica
        </Link>
      </div>

      {/* Modale */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onClose={closeModal}
        confirmText={modalConfig.confirmText}
        isDanger={modalConfig.isDanger}
        cancelText="Annulla"
      />

    </div>
  );
};

export default WorkoutDetailPage;