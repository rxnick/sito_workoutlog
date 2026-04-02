'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import ConfirmModal from '../../../../components/ConfirmModal';

// --- IMPORTIAMO IL MODULO CSS ---
import styles from './EditWorkout.module.css';

const EditWorkoutPage = () => {
  const { user, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();
  const { id } = useParams();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  const [availableExercises, setAvailableExercises] = useState([]);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: false,
    showCancel: false 
  });

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [resList, resWorkout] = await Promise.all([
          fetch('/api/exercises'),
          fetch(`/api/workouts/${id}`)
        ]);

        if (!resWorkout.ok) throw new Error("Errore caricamento allenamento");

        const listData = await resList.json();
        const workoutData = await resWorkout.json();

        setAvailableExercises(listData);
        setName(workoutData.workout.name || '');
        setDate(workoutData.workout.date || '');
        setStartTime(workoutData.workout.start_time || '');
        setEndTime(workoutData.workout.end_time || '');
        setNotes(workoutData.workout.notes || '');

        setWorkoutExercises(workoutData.exercises.map(ex => ({
          tempId: Math.random(),
          exercise_id: ex.exercise_id,
          sets: ex.sets || '',
          reps: ex.reps || '',
          weight: ex.weight || '',
          rest_time: ex.rest_time || '',
          notes: ex.notes || ''
        })));

      } catch (error) {
        console.error(error);
        router.push('/workouts/history');
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, [user, id, router]);

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const showFeedback = (title, message, isError = false, onSuccess = null) => {
    setModalConfig({
      isOpen: true,
      title: title,
      message: message,
      isDanger: isError,
      confirmText: "Ho capito",
      showCancel: false, 
      onConfirm: () => {
        closeModal();
        if (onSuccess) onSuccess(); 
      }
    });
  };

  const addRow = () => setWorkoutExercises([...workoutExercises, { tempId: Date.now(), exercise_id: '', sets: 3, reps: 10, weight: 0, rest_time: 60, notes: '' }]);
  const removeRow = (tid) => setWorkoutExercises(workoutExercises.filter(ex => ex.tempId !== tid));
  const updateRow = (tid, field, val) => setWorkoutExercises(prev => prev.map(ex => ex.tempId === tid ? { ...ex, [field]: val } : ex));

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!name) {
      showFeedback("Attenzione ⚠️", "Il nome della scheda è obbligatorio.", true);
      return;
    }

    const payload = {
      name, date, notes, start_time: startTime, end_time: endTime,
      exercises: workoutExercises.filter(ex => ex.exercise_id)
    };

    try {
      const res = await fetch(`/api/workouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showFeedback("Ottimo! 🎉", "Allenamento aggiornato con successo.", false, () => {
          router.push(`/workouts/${id}`);
        });
      } else {
        const errorData = await res.json();
        showFeedback("Errore Salvataggio", errorData.error || "Impossibile salvare le modifiche.", true);
      }
    } catch (err) {
      showFeedback("Errore di Connessione", "Impossibile contattare il server.", true);
    }
  };

  if (authLoading || pageLoading) return <div className={styles.container}><p className={styles.emptyStateText}>Caricamento...</p></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.sectionTitle}>Modifica Allenamento</h1>

      <form onSubmit={handleUpdate}>
        <div className={styles.editSection}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nome Scheda</label>
            <input type="text" className={styles.formControl} value={name || ''} onChange={e => setName(e.target.value)} required />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Data</label>
            <input type="date" className={styles.formControl} value={date || ''} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formCol}>
              <label className={styles.formLabel}>Inizio</label>
              <input type="time" className={styles.formControl} value={startTime || ''} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className={styles.formCol}>
              <label className={styles.formLabel}>Fine</label>
              <input type="time" className={styles.formControl} value={endTime || ''} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Note</label>
            <textarea className={styles.formControl} value={notes || ''} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Esercizi</h3>
        <div>
          {workoutExercises.map((row) => (
            <div key={row.tempId} className={styles.exerciseRowCard}>
              <select className={styles.formControl} value={row.exercise_id || ''} onChange={e => updateRow(row.tempId, 'exercise_id', e.target.value)}>
                <option value="">-- Seleziona Esercizio --</option>
                {availableExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>

              <div className={styles.gridInputs}>
                <div><small>Serie</small><input type="number" className={styles.formControl} value={row.sets || ''} onChange={e => updateRow(row.tempId, 'sets', e.target.value)} /></div>
                <div><small>Reps</small><input type="number" className={styles.formControl} value={row.reps || ''} onChange={e => updateRow(row.tempId, 'reps', e.target.value)} /></div>
                <div><small>Kg</small><input type="number" className={styles.formControl} value={row.weight || ''} onChange={e => updateRow(row.tempId, 'weight', e.target.value)} /></div>
                <div><small>Recupero</small><input type="number" className={styles.formControl} value={row.rest_time || ''} onChange={e => updateRow(row.tempId, 'rest_time', e.target.value)} /></div>
              </div>

              {/* Rimosso style inline, aggiunta classe notesInput */}
              <input type="text" className={`${styles.formControl} ${styles.notesInput}`} placeholder="Note esercizio..." value={row.notes || ''} onChange={e => updateRow(row.tempId, 'notes', e.target.value)} />
              
              <button type="button" onClick={() => removeRow(row.tempId)} className={styles.btnRemoveRow}>✕</button>
            </div>
          ))}
        </div>

        <div className={styles.btnAddRowContainer}>
          <button type="button" onClick={addRow} className={styles.btnAddRow}>+ Aggiungi Esercizio</button>
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={() => router.back()} className={styles.btnCancel}>Annulla</button>
          <button type="submit" className={styles.btnSave}>💾 Salva Modifiche</button>
        </div>
      </form>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onClose={closeModal}
        confirmText={modalConfig.confirmText}
        isDanger={modalConfig.isDanger}
        cancelText={modalConfig.showCancel ? "Annulla" : null}
      />
    </div>
  );
};

export default EditWorkoutPage;