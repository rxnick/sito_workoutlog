'use client';

import { useState, useEffect, useContext, use } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import Link from 'next/link';
import ConfirmModal from '../../../components/ConfirmModal';

const ExerciseDetailPage = ({ params }) => {
    const { id } = use(params);
    const { user } = useContext(AuthContext);

    const [exercise, setExercise] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Stato per il nuovo feedback
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    // CONFIGURAZIONE MODALE
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        isDanger: false,
        confirmText: 'Ho capito',
        showCancel: false
    });

    useEffect(() => {
        if (user && id) {
            loadData();
        }
    }, [user, id]);

    // --- HELPER PER IL MODALE ---
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const showFeedback = (title, message, isError = false) => {
        setModalConfig({
            isOpen: true,
            title: title,
            message: message,
            isDanger: isError,
            confirmText: "Ho capito",
            showCancel: false, // Nasconde "Annulla" per i messaggi informativi
            onConfirm: closeModal
        });
    };

    const loadData = async () => {
        try {
            const resEx = await fetch(`/api/exercises`);
            const dataEx = await resEx.json();
            const found = dataEx.find(e => e.id == id);
            setExercise(found);

            const resFeed = await fetch(`/api/feedback?exercise_id=${id}`);
            const dataFeed = await resFeed.json();
            setFeedbacks(dataFeed);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- AGGIUNTA FEEDBACK  ---
    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        
        if (newRating === 0) {
            showFeedback("Attenzione ⭐", "Devi selezionare almeno una stella per votare.", true);
            return;
        }

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exercise_id: id,
                    rating: newRating,
                    comment: newComment
                })
            });

            if (res.ok) {
                setNewRating(0);
                setNewComment('');
                loadData();
                showFeedback("Grazie! 🎉", "Il tuo feedback è stato pubblicato.");
            } else {
                showFeedback("Errore", "Impossibile inviare il feedback.", true);
            }
        } catch (err) {
            showFeedback("Errore", "Errore di connessione.", true);
        }
    };

    // --- ELIMINAZIONE FEEDBACK ---
    
    // Click sul tasto elimina -> Apre modale
    const handleDeleteClick = (feedbackId) => {
        setModalConfig({
            isOpen: true,
            title: "Elimina Recensione 🗑️",
            message: "Sei sicuro di voler rimuovere questa recensione?",
            isDanger: true,
            confirmText: "Elimina",
            showCancel: true, // Qui serve il tasto Annulla
            onConfirm: () => confirmDelete(feedbackId)
        });
    };

    // Conferma nel modale -> Esegue la fetch
    const confirmDelete = async (feedbackId) => {
        try {
            const res = await fetch(`/api/feedback?id=${feedbackId}`, { method: 'DELETE' });
            if (res.ok) {
                loadData();
                closeModal();
            } else {
                closeModal(); // Chiudi prima per mostrare errore pulito
                setTimeout(() => showFeedback("Errore", "Impossibile eliminare.", true), 300);
            }
        } catch (err) {
            closeModal();
            setTimeout(() => showFeedback("Errore", "Errore di connessione.", true), 300);
        }
    };

    if (loading) return <div className="loading-text">Caricamento...</div>;
    if (!exercise) return <div className="error-text">Esercizio non trovato.</div>;

    return (
        <div className="detail-container">

            <Link href="/exercises">
                <button className="btn-back">← Torna alla Libreria</button>
            </Link>

            <div className="detail-card">
                <div className="detail-img-container">
                    {exercise.image_url ? (
                        <img src={exercise.image_url} alt={exercise.name} className="detail-img" />
                    ) : (
                        <div className="detail-img-placeholder">Nessuna Immagine 📷</div>
                    )}
                </div>

                <div className="detail-content">
                    <h1 className="detail-title">{exercise.name}</h1>

                    <div className="detail-badges">
                        <span className="badge badge-muscle">{exercise.muscle_group}</span>
                        <span className={`badge ${exercise.is_public ? 'badge-public' : 'badge-private'}`}>
                            {exercise.is_public ? '🌍 Pubblico' : '🔒 Privato'}
                        </span>
                        <span className="detail-author">
                            Creato da: <strong>{exercise.creator_name || 'Tu'}</strong>
                        </span>
                    </div>

                    <p className="detail-desc">{exercise.description || "Nessuna descrizione disponibile."}</p>
                </div>
            </div>

            <div className="feedback-section">
                <h2 className="section-title">Recensioni e Feedback ⭐</h2>

                <form onSubmit={handleSubmitFeedback} className="add-feedback-form">
                    <h4 className="form-subtitle">Lascia la tua opinione</h4>

                    <div className="star-rating-input" onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={`star ${(hoverRating || newRating) >= star ? 'active' : ''}`}
                                onMouseEnter={() => setHoverRating(star)}
                                onClick={() => setNewRating(star)}
                            >
                                ★
                            </span>
                        ))}
                        <span className="rating-count">
                            {newRating > 0 ? `${newRating}/5` : 'Vota'}
                        </span>
                    </div>

                    <textarea
                        className="form-textarea"
                        placeholder="Scrivi un commento (opzionale)..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    ></textarea>

                    <button type="submit" className="btn-primary btn-submit-feedback">Invia Recensione</button>
                </form>

                <div className="feedback-list">
                    {feedbacks.length === 0 && <p className="feedback-empty">Nessuna recensione ancora. Sii il primo!</p>}

                    {feedbacks.map(fb => (
                        <div key={fb.id} className="feedback-item">
                            <div className="feedback-header">
                                <span className="feedback-user">{fb.user_name} {fb.user_surname?.charAt(0)}.</span>
                                <span className="feedback-stars-static">
                                    {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                                </span>
                            </div>
                            <p className="feedback-comment">{fb.comment}</p>

                            {fb.user_id === user.id && (
                                // QUI ORA USIAMO handleDeleteClick INVECE DI QUELLO VECCHIO
                                <button onClick={() => handleDeleteClick(fb.id)} className="btn-delete-feedback">
                                    Elimina
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* INSERIAMO IL MODALE ALLA FINE */}
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

export default ExerciseDetailPage;