'use client';

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Link from 'next/link';
import ConfirmModal from '../../components/ConfirmModal';

const ExercisesPage = () => {
  const { user } = useContext(AuthContext);

  // Dati API
  const [exercises, setExercises] = useState([]);

  // Stati UI
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // --- NUOVI STATI PER I FILTRI ---
  const [filterMuscle, setFilterMuscle] = useState('Tutti'); // Filtro Gruppo
  const [filterType, setFilterType] = useState('Tutti');     // Filtro Tipo (Miei, Pubblici, ecc)

  // Config Modale
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: false,
    type: 'feedback'
  });

  const [newExercise, setNewExercise] = useState({
    name: '', muscle_group: 'Petto', description: '', image_url: '', is_public: false
  });

  // 1. CARICAMENTO DATI
  useEffect(() => {
    if (!user) return;
    // Se la ricerca testuale è vuota, carica tutto
    if (searchTerm.trim() === '') {
      fetchExercises();
      return;
    }
    // Debounce per la ricerca
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LOGICA DI FILTRAGGIO (La magia avviene qui) ---
  const filteredExercises = exercises.filter((ex) => {
    // A. Filtro per Gruppo Muscolare
    if (filterMuscle !== 'Tutti' && ex.muscle_group !== filterMuscle) {
      return false;
    }

    // B. Filtro per Tipo (Miei, Pubblici, Privati)
    if (filterType === 'Miei') {
      // Mostra solo quelli creati da me
      if (ex.user_id !== user.id) return false;
    } else if (filterType === 'Pubblici') {
      // Mostra solo quelli pubblici
      if (!ex.is_public) return false;
    } else if (filterType === 'Privati') {
      // Mostra solo quelli privati (ovviamente solo i miei privati, gli altri non li vedo cmq)
      if (ex.is_public) return false;
    }

    return true; // Se passa tutti i controlli, mostralo
  });


  // --- GESTIONE MODALE ---
  // Prev serva per dire a rect di darmi l'oggetto Modale com'è adesso, e lo chiamiamo prev
  // Uso ...prev (spread operator) per creare una copia superficiale dello stato precedente
  // Questo mi permette di modificare solo la proprietà isOpen mantenendo intatte tutte le altre configurazioni del modale (title, message, etc.).
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const showFeedback = (title, message, isError = false) => {
    setModalConfig({
      isOpen: true,
      title: title,
      message: message,
      onConfirm: closeModal,
      confirmText: "Ho capito",
      isDanger: isError,
      type: 'feedback'
    });
  };

  const handleEditClick = (ex) => {
    // Ci segniamo l'ID. Ora sappiamo che siamo in modalità modifica.
    setEditingId(ex.id);
    // Riempiamo il form "newExercise" con i dati VECCHI dell'esercizio cliccato
    setNewExercise({
      name: ex.name,
      muscle_group: ex.muscle_group,
      description: ex.description || '',
      image_url: ex.image_url || '',
      is_public: ex.is_public === 1
    });
    setShowForm(true);
    // Porta la vista all'inizio della pagina (top: 0) in modo fluido (smooth)
    // così l'utente vede subito il form di modifica/apertura.
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // SE c'è un editingId (quindi ho cliccato la matita), il metodo è PUT.
    // ALTRIMENTI (è null), il metodo è POST.
    const method = editingId ? 'PUT' : 'POST';
    // SE c'è un editingId, aggiungo l'ID al pacchetto dati (fondamentale per l'UPDATE SQL).
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
      } else {
        showFeedback("Errore ⚠️", "C'è stato un problema nel salvataggio.", true);
      }
    } catch (err) {
      showFeedback("Errore ⚠️", "Errore di connessione.", true);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewExercise({ name: '', muscle_group: 'Petto', description: '', image_url: '', is_public: false });
  };

  const handleDeleteClick = (ex) => {
    setModalConfig({
      isOpen: true,
      title: "Attenzione ⚠️",
      message: `Vuoi eliminare "${ex.name}"?`,
      onConfirm: () => confirmDelete(ex.id),
      confirmText: "Elimina",
      isDanger: true,
      type: 'delete'
    });
  };

  const confirmDelete = async (idToDelete) => {
    try {
      const res = await fetch(`/api/exercises?id=${idToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        // Uso la arrow function dentro il setter di stato (setExercises) per accedere in modo sicuro allo stato precedente (prev). 
        // Questo garantisce che il filtraggio avvenga sempre sulla lista dati più aggiornata, evitando bug di sincronizzazione.
        setExercises(prev => prev.filter(ex => ex.id !== idToDelete));
        closeModal();
      } else {
        closeModal();
        setTimeout(() => showFeedback("Errore", "Impossibile eliminare.", true), 300);
      }
    } catch (err) { closeModal(); }
  };

  if (!user) return null;

  return (
    <div className="exercises-container">

      <h1 className="page-title">Libreria Esercizi 📚</h1>

      {/* BARRA DI RICERCA */}
      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Cerca nome esercizio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- NUOVI FILTRI --- */}
      <div className="filters-container">

        {/* Filtro Gruppo Muscolare */}
        <select
          className="filter-select"
          value={filterMuscle}
          onChange={(e) => setFilterMuscle(e.target.value)}
        >
          <option value="Tutti">Tutti i Gruppi</option>
          <option value="Petto">Petto</option>
          <option value="Dorso">Dorso</option>
          <option value="Gambe">Gambe</option>
          <option value="Spalle">Spalle</option>
          <option value="Bicipiti">Bicipiti</option>
          <option value="Tricipiti">Tricipiti</option>
          <option value="Addome">Addome</option>
          <option value="Cardio">Cardio</option>
        </select>

        {/* Filtro Tipo (Miei / Pubblici) */}
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="Tutti">Tutti i Tipi</option>
          <option value="Miei">👤 Solo i Miei</option>
          <option value="Pubblici">🌍 Pubblici</option>
          <option value="Privati">🔒 Privati</option>
        </select>

      </div>

      <div className="text-center mb-30">
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Crea Nuovo Esercizio
          </button>
        )}
      </div>

      {/* FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="add-exercise-form">
          <h3 className="form-title">{editingId ? '✏️ Modifica Esercizio' : '✨ Nuovo Esercizio'}</h3>

          <div className="form-row">
            <div className="form-col">
              <label className="form-label">Nome</label>
              <input type="text" className="form-input" required value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })} />
            </div>
            <div className="form-col">
              <label className="form-label">Gruppo Muscolare</label>
              <select className="form-input" value={newExercise.muscle_group}
                onChange={(e) => setNewExercise({ ...newExercise, muscle_group: e.target.value })}>
                <option>Petto</option><option>Dorso</option><option>Gambe</option><option>Spalle</option>
                <option>Bicipiti</option><option>Tricipiti</option><option>Addome</option><option>Cardio</option>
              </select>
            </div>
          </div>

          <div className="mb-15">
            <label className="form-label">Immagine (URL)</label>
            <input type="text" className="form-input" value={newExercise.image_url}
              onChange={(e) => setNewExercise({ ...newExercise, image_url: e.target.value })} />
          </div>

          <div className="checkbox-row">
            <label className="checkbox-label">
              <input type="checkbox" checked={newExercise.is_public}
                onChange={(e) => setNewExercise({ ...newExercise, is_public: e.target.checked })} />
              Rendi Pubblico (Visibile a tutti)
            </label>
          </div>

          <div className="mb-15">
            <label className="form-label">Descrizione</label>
            <textarea className="form-textarea" rows="2" value={newExercise.description}
              onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}></textarea>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleCancelForm} className="btn-cancel">Annulla</button>
            <button type="submit" className="btn-save">{editingId ? 'Aggiorna' : 'Salva'}</button>
          </div>
        </form>
      )}

      {/* RISULTATI (Qui usiamo filteredExercises invece di exercises) */}
      {loading && <p className="loading-text">Caricamento...</p>}

      {!loading && filteredExercises.length === 0 && (
        <p className="empty-state">Nessun esercizio trovato con questi filtri.</p>
      )}

      <div className="exercises-list">
        {filteredExercises.map(ex => (
          <div key={ex.id} className={`exercise-card ${ex.is_public ? 'border-public' : 'border-private'}`}>

            {ex.image_url && (
              <img src={ex.image_url} alt={ex.name} className="exercise-img" onError={(e) => { e.target.style.display = 'none' }} />
            )}

            <div className="exercise-content">
              <div className="exercise-header">
                <h3 className="exercise-name">{ex.name}</h3>
                {/* TASTO OCCHIO PER ANDARE AI DETTAGLI */}
                <Link href={`/exercises/${ex.id}`}>
                  <button className="btn-icon" title="Vedi Dettagli e Recensioni">👁️</button>
                </Link>
                {ex.user_id === user.id && (
                  <div className="exercise-actions">
                    <button className="btn-icon edit" onClick={() => handleEditClick(ex)} title="Modifica">✏️</button>
                    <button className="btn-icon delete" onClick={() => handleDeleteClick(ex)} title="Elimina">🗑️</button>
                  </div>
                )}
              </div>

              <div className="exercise-meta">
                <span className="muscle-tag">{ex.muscle_group}</span>
              </div>

              <p className="exercise-desc">{ex.description}</p>

              <div className="exercise-footer">
                {ex.is_public ? '🌍 Pubblico' : '🔒 Privato'} - Creato da: <strong>{ex.creator_name || 'Tu'}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

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

export default ExercisesPage;