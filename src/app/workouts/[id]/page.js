'use client';

import { useState, useEffect, useContext, use } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Serve per il redirect dopo l'eliminazione
import ConfirmModal from '../../../components/ConfirmModal'; // Importiamo il modale

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

  // --- LOGICA ELIMINAZIONE ---
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
            // Se eliminato con successo, torna allo storico
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
  if (loading) return <div className="workout-detail-container"><p className="loading-text">Caricamento dettagli...</p></div>;
  if (error) return <div className="workout-detail-container"><p className="error-text">{error}</p></div>;
  if (!workoutData || !workoutData.workout) return <div className="workout-detail-container"><p className="error-text">Allenamento non trovato.</p></div>;

  const { workout, exercises } = workoutData;

  return (
    <div className="workout-detail-container">

      <Link href="/workouts/history">
        <button className="btn-back">← Torna allo Storico</button>
      </Link>

      <div className="detail-header">
        <span className="detail-date">{formatDate(workout.date)}</span>
        <h1>{workout.name}</h1>
        <span className="form-label">{workout.start_time} - {workout.end_time}</span>
        {workout.notes && (
          <div className="detail-notes">
            📝 Note Allenamento: {workout.notes}
          </div>
        )}
      </div>

      <h3 className="section-title">Esercizi Svolti</h3>

      {exercises && exercises.length > 0 ? (
        <div className="table-responsive">
          <table className="workout-table">
            <thead>
              <tr>
                <th>Esercizio</th>
                <th className="text-center">Serie</th>
                <th className="text-center">Reps</th>
                <th className="text-center">Kg</th>
                <th className="text-center">Recupero</th>
                <th>Note Esercizio</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((ex, index) => (
                <tr key={index}>
                  <td>{ex.name || 'Esercizio'}</td>
                  <td className="text-center">{ex.sets}</td>
                  <td className="text-center">{ex.reps}</td>
                  <td className="text-center">{ex.weight}</td>
                  <td className="text-center">{ex.rest_time} sec</td>
                  <td className="note-cell">
                    {ex.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty-state-text">
          Nessun esercizio registrato per questo allenamento.
        </p>
      )}

      {/* Bottoni Azione */}
      <div className="action-buttons-container">
        
        {/* Tasto ELIMINA (Nuovo) - Stile inline per fare veloce, rosso */}
        <button 
            onClick={handleDeleteClick} 
            className="btn-cancel" 
        >
            🗑️ Elimina
        </button>

        <Link href={`/workouts/${id}/edit`} className="btn-edit">
          ✏️ Modifica Allenamento
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