'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import ConfirmModal from '../../../../components/ConfirmModal';

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

  // 2. Stato per la configurazione del Modale
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: false,
    showCancel: false // Trucco per nascondere "Annulla" nei messaggi informativi
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

  // --- Helper per il Modale ---
  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  /*onSucces serve a dire: "Mostra il messaggio, e QUANDO l'utente clicca OK, esegui questa azione specifica".
    Se è un Errore: Non passi nulla. L'utente clicca OK e il modale si chiude. Fine.
    Se è un Successo: Passi una funzione (es. () => router.push(...)). L'utente clicca OK -> Il modale si chiude -> La pagina cambia.*/

  const showFeedback = (title, message, isError = false, onSuccess = null) => {
    setModalConfig({
      isOpen: true,
      title: title,
      message: message,
      isDanger: isError,
      confirmText: "Ho capito",
      showCancel: false, // Non mostriamo "Annulla" per i messaggi di feedback
      onConfirm: () => {
        closeModal();
        if (onSuccess) onSuccess(); // Eseguiamo azione (es. redirect) dopo la chiusura
      }
    });
  };

  const addRow = () => setWorkoutExercises([...workoutExercises, { tempId: Date.now(), exercise_id: '', sets: 3, reps: 10, weight: 0, rest_time: 60, notes: '' }]);
  const removeRow = (tid) => setWorkoutExercises(workoutExercises.filter(ex => ex.tempId !== tid));
  const updateRow = (tid, field, val) => setWorkoutExercises(prev => prev.map(ex => ex.tempId === tid ? { ...ex, [field]: val } : ex));

  const handleUpdate = async (e) => {
    e.preventDefault();

    // VALIDAZIONE CON MODALE
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
        // SUCCESSO CON MODALE -> Poi Redirect
        showFeedback("Ottimo! 🎉", "Allenamento aggiornato con successo.", false, () => {
          router.push(`/workouts/${id}`);
        });
      } else {
        // ERRORE API CON MODALE
        const errorData = await res.json();
        showFeedback("Errore Salvataggio", errorData.error || "Impossibile salvare le modifiche.", true);
      }
    } catch (err) {
      // ERRORE RETE CON MODALE
      showFeedback("Errore di Connessione", "Impossibile contattare il server.", true);
    }
  };

  if (authLoading || pageLoading) return <div className="workout-detail-container"><p className="empty-state-text">Caricamento...</p></div>;

  return (
    <div className="workout-detail-container">
      <h1 className="section-title">Modifica Allenamento</h1>

      <form onSubmit={handleUpdate}>
        <div className="edit-section">
          <div className="form-group">
            <label className="form-label">Nome Scheda</label>
            <input type="text" className="form-control" value={name || ''} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Data</label>
            <input type="date" className="form-control" value={date || ''} onChange={e => setDate(e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Inizio</label>
              <input type="time" className="form-control" value={startTime || ''} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="form-col">
              <label className="form-label">Fine</label>
              <input type="time" className="form-control" value={endTime || ''} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <textarea className="form-control" value={notes || ''} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <h3 className="section-title">Esercizi</h3>
        <div>
          {workoutExercises.map((row) => (
            <div key={row.tempId} className="exercise-row-card">
              <select className="form-control" value={row.exercise_id || ''} onChange={e => updateRow(row.tempId, 'exercise_id', e.target.value)}>
                <option value="">-- Seleziona Esercizio --</option>
                {availableExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>

              <div className="grid-inputs">
                <div><small>Serie</small><input type="number" className="form-control" value={row.sets || ''} onChange={e => updateRow(row.tempId, 'sets', e.target.value)} /></div>
                <div><small>Reps</small><input type="number" className="form-control" value={row.reps || ''} onChange={e => updateRow(row.tempId, 'reps', e.target.value)} /></div>
                <div><small>Kg</small><input type="number" className="form-control" value={row.weight || ''} onChange={e => updateRow(row.tempId, 'weight', e.target.value)} /></div>
                <div><small>Recupero</small><input type="number" className="form-control" value={row.rest_time || ''} onChange={e => updateRow(row.tempId, 'rest_time', e.target.value)} /></div>
              </div>

              <input type="text" className="form-control" placeholder="Note esercizio..." value={row.notes || ''} onChange={e => updateRow(row.tempId, 'notes', e.target.value)} style={{ marginTop: '10px' }} />
              <button type="button" onClick={() => removeRow(row.tempId)} className="btn-remove-row">✕</button>
            </div>
          ))}
        </div>

        <div className="btn-add-row-container">
          <button type="button" onClick={addRow} className="btn-add-row">+ Aggiungi Esercizio</button>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => router.back()} className="btn-cancel">Annulla</button>
          <button type="submit" className="btn-save">💾 Salva Modifiche</button>
        </div>
      </form>

      {/* 3. INSERIMENTO DEL MODALE */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onClose={closeModal}
        confirmText={modalConfig.confirmText}
        isDanger={modalConfig.isDanger}
        // Se showCancel è false, passiamo null a cancelText per nasconderlo
        cancelText={modalConfig.showCancel ? "Annulla" : null}
      />
    </div>
  );
};

export default EditWorkoutPage;