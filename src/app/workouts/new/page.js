'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/AuthContext';
import ConfirmModal from '../../../components/ConfirmModal';

const NewWorkoutPage = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');

  const [selectedExercises, setSelectedExercises] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [exerciseToAdd, setExerciseToAdd] = useState('');

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: false,
    confirmText: 'Ho capito',
    type: 'feedback'
  });

  useEffect(() => {
    if (user) {
      fetch('/api/exercises')
        .then(res => res.json())
        .then(data => setAvailableExercises(data))
        .catch(err => console.error(err));
    }
  }, [user]);

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const showFeedback = (title, message, isError = false, onSuccess = null) => {
    setModalConfig({
      isOpen: true,
      title: title,
      message: message,
      isDanger: isError,
      confirmText: "Ho capito",
      onConfirm: () => {
        closeModal();
        if (onSuccess) onSuccess();
      },
      type: 'feedback'
    });
  };

  const handleAddExercise = () => {
    if (!exerciseToAdd) return;
    const exerciseInfo = availableExercises.find(e => e.id == exerciseToAdd);

    setSelectedExercises(prev => [
      ...prev,
      {
        exercise_id: exerciseToAdd,
        name: exerciseInfo.name,
        sets: 3,
        reps: 10,
        weight: 0,
        rest_time: 60,
        notes: ''
      }
    ]);
    setExerciseToAdd('');
  };

  const handleRemoveExercise = (index) => {
    const newList = [...selectedExercises];
    newList.splice(index, 1);
    setSelectedExercises(newList);
  };

  const handleChangeExercise = (index, field, value) => {
    const newList = [...selectedExercises];
    newList[index][field] = value;
    setSelectedExercises(newList);
  };

  // --- SUBMIT DEL FORM ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Blocca il ricaricamento della pagina standard

    const payload = {
      name, date,
      start_time: startTime,
      end_time: endTime,
      notes: workoutNotes,
      exercises: selectedExercises
    };

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showFeedback("Ottimo! 🎉", "Allenamento creato con successo.", false, () => {
          router.push('/dashboard');
        });
      } else {
        showFeedback("Errore ❌", "C'è stato un problema nel salvataggio.", true);
      }
    } catch (error) {
      showFeedback("Errore ❌", "Errore di connessione al server.", true);
    }
  };

  if (!user) return null;

  return (
    <div className="new-workout-container">
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Nuova Sessione di Allenamento</h1>

      {/* IMPORTANTE: Usiamo il tag <form> con onSubmit. 
         Questo attiva la validazione nativa del browser (il fumetto "Compila questo campo").
      */}
      <form onSubmit={handleSubmit}>

        {/* INTESTAZIONE: Nome, Data, Orari */}
        <div className="workout-header-form">
          <div className="input-group">
            <label>Nome Scheda *</label>
            {/* AGGIUNTO 'required': Ora se è vuoto esce il fumetto nativo */}
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Gambe e Spalle"
              required
            />
          </div>

          <div className="row-inputs" style={{ marginTop: '10px' }}>
            <div className="input-group">
              <label>Data *</label>
              <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Inizio</label>
              <input type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Fine</label>
              <input type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '10px' }}>
            <label>Note Generali Allenamento</label>
            <textarea className="form-textarea" style={{ minHeight: '60px' }} value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)} placeholder="Come ti sentivi oggi?"></textarea>
          </div>
        </div>

        {/* SELEZIONE ESERCIZI */}
        <div className="add-exercise-section">
          {/*Ho messo la possibilità di creare un allenamento vuoto di esercizi, */}
          {/*ma con una semplice Nota, quindi non è required*/}
          <select className="exercise-select" value={exerciseToAdd} onChange={(e) => setExerciseToAdd(e.target.value)} >
            <option value="">-- Seleziona Esercizio --</option>
            {availableExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscle_group})</option>
            ))}
          </select>
          {/* IMPORTANTE: type="button" serve per NON far inviare il form quando clicchi Aggiungi */}
          <button type="button" className="btn-add-exercise" onClick={handleAddExercise}>+ Aggiungi</button>
        </div>

        {/* LISTA ESERCIZI */}
        <div className="workout-exercises-list">
          {selectedExercises.map((item, index) => (
            <div key={index} className="exercise-row-card">
              <div className="row-header">
                <strong>{item.name}</strong>
                <button type="button" className="btn-remove" onClick={() => handleRemoveExercise(index)}>🗑️</button>
              </div>
              
              {}
              <div className="grid-inputs">
                <div className="input-group">
                  <label>Serie</label>
                  <input type="number" className="input-tiny" value={item.sets} onChange={(e) => handleChangeExercise(index, 'sets', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Reps</label>
                  <input type="number" className="input-tiny" value={item.reps} onChange={(e) => handleChangeExercise(index, 'reps', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Kg</label>
                  <input type="number" className="input-tiny" value={item.weight} onChange={(e) => handleChangeExercise(index, 'weight', e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Tempo di recupero</label>
                  <input type="number" className="input-tiny" value={item.rest_time} onChange={(e) => handleChangeExercise(index, 'rest_time', e.target.value)} placeholder="60" />
                </div>
              </div>

              <div style={{ marginTop: '10px' }}>
                <input type="text" className="form-input" style={{ fontSize: '0.9rem', padding: '6px' }}
                  placeholder="Note esercizio (es. cedimento, dropset...)"
                  value={item.notes} onChange={(e) => handleChangeExercise(index, 'notes', e.target.value)} />
              </div>

            </div>
          ))}
        </div>

        {/* TASTO SALVA: type="submit" scatena la validazione 'required' */}
        <button type="submit" className="btn-save-workout">Salva Allenamento</button>

      </form>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onClose={closeModal}
        confirmText={modalConfig.confirmText}
        isDanger={modalConfig.isDanger}
        cancelText={modalConfig.type === 'feedback' ? null : "Annulla"}
      />
    </div>
  );
};

export default NewWorkoutPage;