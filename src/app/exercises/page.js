'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Link from 'next/link';
import ConfirmModal from '../../components/ConfirmModal';

// --- IMPORTIAMO IL MODULO CSS ---
import styles from './Exercises.module.css';

// --- COMPONENTE DI CARICAMENTO ---
import Loader from '../../components/Loader';

const ExercisesPage = () => {
  const { user } = useContext(AuthContext);

  const [exercises, setExercises] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [filterMuscle, setFilterMuscle] = useState('Tutti');
  const [filterType, setFilterType] = useState('Tutti');

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', onConfirm: null, isDanger: false, type: 'feedback'
  });

  const [newExercise, setNewExercise] = useState({
    name: '', muscle_group: 'Petto', description: '', image_url: '', is_public: false
  });

  useEffect(() => {
    if (!user) return;
    if (searchTerm.trim() === '') {
      fetchExercises();
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => { fetchExercises(); }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, user]);

  const fetchExercises = async () => {
    try {
      const url = searchTerm.trim() ? `/api/exercises?q=${encodeURIComponent(searchTerm)}` : '/api/exercises';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const filteredExercises = exercises.filter((ex) => {
    if (filterMuscle !== 'Tutti' && ex.muscle_group !== filterMuscle) return false;
    if (filterType === 'Miei') { if (ex.user_id !== user.id) return false; }
    else if (filterType === 'Pubblici') { if (!ex.is_public) return false; }
    else if (filterType === 'Privati') { if (ex.is_public) return false; }
    return true;
  });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const showFeedback = (title, message, isError = false) => {
    setModalConfig({
      isOpen: true, title, message, onConfirm: closeModal, confirmText: "Ho capito", isDanger: isError, type: 'feedback'
    });
  };

  const handleEditClick = (ex) => {
    setEditingId(ex.id);
    setNewExercise({
      name: ex.name, muscle_group: ex.muscle_group, description: ex.description || '',
      image_url: ex.image_url || '', is_public: ex.is_public === 1
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { ...newExercise, id: editingId } : newExercise;

    try {
      const res = await fetch('/api/exercises', {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setNewExercise({ name: '', muscle_group: 'Petto', description: '', image_url: '', is_public: false });
        showFeedback("Successo! 🎉", editingId ? "Esercizio aggiornato." : "Esercizio creato.");
        fetchExercises();
      } else { showFeedback("Errore ⚠️", "Problema nel salvataggio.", true); }
    } catch (err) { showFeedback("Errore ⚠️", "Errore di connessione.", true); }
  };

  const handleDeleteClick = (ex) => {
    setModalConfig({
      isOpen: true, title: "Attenzione ⚠️", message: `Vuoi eliminare "${ex.name}"?`,
      onConfirm: () => confirmDelete(ex.id), confirmText: "Elimina", isDanger: true, type: 'delete'
    });
  };

  const confirmDelete = async (idToDelete) => {
    try {
      const res = await fetch(`/api/exercises?id=${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setExercises(prev => prev.filter(ex => ex.id !== idToDelete));
        closeModal();
      } else { closeModal(); setTimeout(() => showFeedback("Errore", "Impossibile eliminare.", true), 300); }
    } catch (err) { closeModal(); }
  };

  if (!user) return null;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Libreria Esercizi 📚</h1>

      <div className={styles.searchBarContainer}>
        <input type="text" className={styles.searchInput} placeholder="🔍 Cerca nome esercizio..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className={styles.filtersContainer}>
        <select className={styles.filterSelect} value={filterMuscle} onChange={(e) => setFilterMuscle(e.target.value)}>
          <option value="Tutti">Tutti i Gruppi</option>
          <option value="Petto">Petto</option><option value="Dorso">Dorso</option>
          <option value="Gambe">Gambe</option><option value="Spalle">Spalle</option>
          <option value="Bicipiti">Bicipiti</option><option value="Tricipiti">Tricipiti</option>
          <option value="Addome">Addome</option><option value="Cardio">Cardio</option>
        </select>

        <select className={styles.filterSelect} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="Tutti">Tutti i Tipi</option>
          <option value="Miei">👤 Solo i Miei</option>
          <option value="Pubblici">🌍 Pubblici</option>
          <option value="Privati">🔒 Privati</option>
        </select>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className={styles.btnPrimary}>
            + Crea Nuovo Esercizio
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={styles.addExerciseForm}>
          <h3 className={styles.formTitle}>{editingId ? '✏️ Modifica Esercizio' : '✨ Nuovo Esercizio'}</h3>
          <div className={styles.formRow}>
            <div className={styles.formCol}>
              <label className={styles.formLabel}>Nome</label>
              <input type="text" className={styles.formInput} required value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
            </div>
            <div className={styles.formCol}>
              <label className={styles.formLabel}>Gruppo Muscolare</label>
              <select className={styles.formInput} value={newExercise.muscle_group}
                onChange={(e) => setNewExercise({ ...newExercise, muscle_group: e.target.value })}>
                <option>Petto</option><option>Dorso</option><option>Gambe</option><option>Spalle</option>
                <option>Bicipiti</option><option>Tricipiti</option><option>Addome</option><option>Cardio</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label className={styles.formLabel}>Immagine (URL)</label>
            <input type="text" className={styles.formInput} value={newExercise.image_url}
              onChange={(e) => setNewExercise({ ...newExercise, image_url: e.target.value })} />
          </div>
          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={newExercise.is_public}
                onChange={(e) => setNewExercise({ ...newExercise, is_public: e.target.checked })} />
              Rendi Pubblico (Visibile a tutti)
            </label>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label className={styles.formLabel}>Descrizione</label>
            <textarea className={styles.formTextarea} rows="2" value={newExercise.description}
              onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}></textarea>
          </div>
          <div className={styles.formActions}>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className={styles.btnCancel}>Annulla</button>
            <button type="submit" className={styles.btnSave}>{editingId ? 'Aggiorna' : 'Salva'}</button>
          </div>
        </form>
      )}

      {loading && <Loader />}
      {!loading && filteredExercises.length === 0 && (
        <p className={styles.emptyState}>Nessun esercizio trovato con questi filtri.</p>
      )}

      <div className={styles.exercisesList}>
        {filteredExercises.map(ex => (
          <div key={ex.id} className={`${styles.exerciseCard} ${ex.is_public ? styles.borderPublic : styles.borderPrivate}`}>
            {ex.image_url && (
              <img src={ex.image_url} alt={ex.name} className={styles.exerciseImg} onError={(e) => { e.target.style.display = 'none' }} />
            )}
            <div className={styles.exerciseContent}>
              <div className={styles.exerciseHeader}>
                <h3 className={styles.exerciseName}>{ex.name}</h3>
                <Link href={`/exercises/${ex.id}`}>
                  <button className={styles.btnIcon} title="Dettagli">👁️</button>
                </Link>
                {ex.user_id === user.id && (
                  <div className={styles.exerciseActions}>
                    <button className={`${styles.btnIcon} ${styles.btnIconEdit}`} onClick={() => handleEditClick(ex)}>✏️</button>
                    <button className={`${styles.btnIcon} ${styles.btnIconDelete}`} onClick={() => handleDeleteClick(ex)}>🗑️</button>
                  </div>
                )}
              </div>
              <div className={styles.exerciseMeta}>
                <span className={styles.muscleTag}>{ex.muscle_group}</span>
              </div>
              <p className={styles.exerciseDesc}>{ex.description}</p>
              <div className={styles.exerciseFooter}>
                {ex.is_public ? '🌍 Pubblico' : '🔒 Privato'} - Autore: <strong>{ex.creator_name || 'Tu'}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message}
        onConfirm={modalConfig.onConfirm} onClose={closeModal} confirmText={modalConfig.confirmText}
        isDanger={modalConfig.isDanger} cancelText={modalConfig.type === 'feedback' ? null : "Annulla"} />
    </div>
  );
};

export default ExercisesPage;