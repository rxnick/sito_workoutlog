'use client';

import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '../../../context/AuthContext';
import ConfirmModal from '../../../components/ConfirmModal';

// --- IMPORTIAMO IL MODULO CSS ---
import styles from './NewWorkout.module.css';

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

  const handleSubmit = async (e) => {
    e.preventDefault(); 

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
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Nuova Sessione di Allenamento</h1>

      <form onSubmit={handleSubmit}>

        {/* INTESTAZIONE */}
        <div className={styles.workoutHeaderForm}>
          <div className={styles.inputGroup}>
            <label className={styles.formLabel}>Nome Scheda *</label>
            <input
              type="text"
              className={styles.formInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Gambe e Spalle"
              required
            />
          </div>

          <div className={styles.rowInputs}>
            <div className={styles.inputGroup}>
              <label className={styles.formLabel}>Data *</label>
              <input type="date" className={styles.formInput} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.formLabel}>Inizio</label>
              <input type="time" className={styles.formInput} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.formLabel}>Fine</label>
              <input type="time" className={styles.formInput} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.formLabel}>Note Generali Allenamento</label>
            <textarea className={styles.formTextarea} value={workoutNotes} onChange={(e) => setWorkoutNotes(e.target.value)} placeholder="Come ti sentivi oggi?"></textarea>
          </div>
        </div>

        {/* SELEZIONE ESERCIZI */}
        <div className={styles.addExerciseSection}>
          <select className={styles.exerciseSelect} value={exerciseToAdd} onChange={(e) => setExerciseToAdd(e.target.value)} >
            <option value="">-- Seleziona Esercizio --</option>
            {availableExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name} ({ex.muscle_group})</option>
            ))}
          </select>
          <button type="button" className={styles.btnAddExercise} onClick={handleAddExercise}>+ Aggiungi</button>
        </div>

        {/* LISTA ESERCIZI */}
        <div>
          {selectedExercises.map((item, index) => (
            <div key={index} className={styles.exerciseRowCard}>
              
              <div className={styles.rowHeader}>
                <strong>{item.name}</strong>
                <button type="button" className={styles.btnRemove} onClick={() => handleRemoveExercise(index)}>🗑️</button>
              </div>
              
              <div className={styles.gridInputs}>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Serie</label>
                  <input type="number" className={styles.inputTiny} value={item.sets} onChange={(e) => handleChangeExercise(index, 'sets', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Reps</label>
                  <input type="number" className={styles.inputTiny} value={item.reps} onChange={(e) => handleChangeExercise(index, 'reps', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Kg</label>
                  <input type="number" className={styles.inputTiny} value={item.weight} onChange={(e) => handleChangeExercise(index, 'weight', e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.formLabel}>Recupero (s)</label>
                  <input type="number" className={styles.inputTiny} value={item.rest_time} onChange={(e) => handleChangeExercise(index, 'rest_time', e.target.value)} placeholder="60" />
                </div>
              </div>

              <div className={styles.notesInputContainer}>
                <input type="text" className={styles.formInput} 
                  placeholder="Note esercizio (es. cedimento, dropset...)"
                  value={item.notes} onChange={(e) => handleChangeExercise(index, 'notes', e.target.value)} />
              </div>

            </div>
          ))}
        </div>

        <button type="submit" className={styles.btnSaveWorkout}>Salva Allenamento</button>

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