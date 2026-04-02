'use client';

import { useState, useEffect, useContext, use } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import Link from 'next/link';
import ConfirmModal from '../../../components/ConfirmModal';

// --- IMPORTIAMO I DUE MODULI SEPARATI ---
import styles from './ExerciseDetail.module.css';
import fStyles from './Feedback.module.css';

const ExerciseDetailPage = ({ params }) => {
    const { id } = use(params);
    const { user } = useContext(AuthContext);

    const [exercise, setExercise] = useState(null);
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false, title: '', message: '', onConfirm: null, isDanger: false, confirmText: 'Ho capito', showCancel: false
    });

    useEffect(() => {
        if (user && id) {
            loadData();
        }
    }, [user, id]);

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const showFeedback = (title, message, isError = false) => {
        setModalConfig({
            isOpen: true, title: title, message: message, isDanger: isError, confirmText: "Ho capito", showCancel: false, onConfirm: closeModal
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
                body: JSON.stringify({ exercise_id: id, rating: newRating, comment: newComment })
            });

            if (res.ok) {
                setNewRating(0); setNewComment(''); loadData();
                showFeedback("Grazie! 🎉", "Il tuo feedback è stato pubblicato.");
            } else {
                showFeedback("Errore", "Impossibile inviare il feedback.", true);
            }
        } catch (err) {
            showFeedback("Errore", "Errore di connessione.", true);
        }
    };

    const handleDeleteClick = (feedbackId) => {
        setModalConfig({
            isOpen: true, title: "Elimina Recensione 🗑️", message: "Sei sicuro di voler rimuovere questa recensione?",
            isDanger: true, confirmText: "Elimina", showCancel: true,
            onConfirm: () => confirmDelete(feedbackId)
        });
    };

    const confirmDelete = async (feedbackId) => {
        try {
            const res = await fetch(`/api/feedback?id=${feedbackId}`, { method: 'DELETE' });
            if (res.ok) {
                loadData(); closeModal();
            } else {
                closeModal();
                setTimeout(() => showFeedback("Errore", "Impossibile eliminare.", true), 300);
            }
        } catch (err) {
            closeModal();
            setTimeout(() => showFeedback("Errore", "Errore di connessione.", true), 300);
        }
    };

    if (loading) return <div className={styles.loadingText}>Caricamento...</div>;
    if (!exercise) return <div className={styles.errorText}>Esercizio non trovato.</div>;

    return (
        <div className={styles.detailContainer}>

            {/* ZONA 1: DETTAGLIO ESERCIZIO (Usa styles) */}
            <Link href="/exercises">
                <button className={styles.btnBack}>← Torna alla Libreria</button>
            </Link>

            <div className={styles.detailCard}>
                <div className={styles.imgContainer}>
                    {exercise.image_url ? (
                        <img src={exercise.image_url} alt={exercise.name} className={styles.img} />
                    ) : (
                        <div className={styles.imgPlaceholder}>Nessuna Immagine 📷</div>
                    )}
                </div>

                <div className={styles.content}>
                    <h1 className={styles.title}>{exercise.name}</h1>

                    <div className={styles.badges}>
                        <span className={`${styles.badge} ${styles.badgeMuscle}`}>{exercise.muscle_group}</span>
                        <span className={`${styles.badge} ${exercise.is_public ? styles.badgePublic : styles.badgePrivate}`}>
                            {exercise.is_public ? '🌍 Pubblico' : '🔒 Privato'}
                        </span>
                        <span className={styles.author}>
                            Creato da: <strong>{exercise.creator_name || 'Tu'}</strong>
                        </span>
                    </div>

                    <p className={styles.desc}>{exercise.description || "Nessuna descrizione disponibile."}</p>
                </div>
            </div>

            {/* ZONA 2: FEEDBACK E RECENSIONI (Usa fStyles) */}
            <div className={fStyles.feedbackSection}>
                <h2 className={fStyles.sectionTitle}>Recensioni e Feedback ⭐</h2>

                <form onSubmit={handleSubmitFeedback} className={fStyles.addFeedbackForm}>
                    <h4 className={fStyles.formSubtitle}>Lascia la tua opinione</h4>

                    <div className={fStyles.starRatingInput} onMouseLeave={() => setHoverRating(0)}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                className={`${fStyles.star} ${(hoverRating || newRating) >= star ? fStyles.active : ''}`}
                                onMouseEnter={() => setHoverRating(star)}
                                onClick={() => setNewRating(star)}
                            >
                                ★
                            </span>
                        ))}
                        <span className={fStyles.ratingCount}>
                            {newRating > 0 ? `${newRating}/5` : 'Vota'}
                        </span>
                    </div>

                    <textarea
                        className={fStyles.formTextarea}
                        placeholder="Scrivi un commento (opzionale)..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    ></textarea>

                    <button type="submit" className={fStyles.btnSubmitFeedback}>Invia Recensione</button>
                </form>

                <div className={fStyles.feedbackList}>
                    {feedbacks.length === 0 && <p className={fStyles.feedbackEmpty}>Nessuna recensione ancora. Sii il primo!</p>}

                    {feedbacks.map(fb => (
                        <div key={fb.id} className={fStyles.feedbackItem}>
                            <div className={fStyles.feedbackHeader}>
                                <span className={fStyles.feedbackUser}>{fb.user_name} {fb.user_surname?.charAt(0)}.</span>
                                <span className={fStyles.feedbackStarsStatic}>
                                    {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)}
                                </span>
                            </div>
                            <p className={fStyles.feedbackComment}>{fb.comment}</p>

                            {fb.user_id === user.id && (
                                <button onClick={() => handleDeleteClick(fb.id)} className={fStyles.btnDeleteFeedback}>
                                    Elimina
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <ConfirmModal
                isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message}
                onConfirm={modalConfig.onConfirm} onClose={closeModal} confirmText={modalConfig.confirmText}
                isDanger={modalConfig.isDanger} cancelText={modalConfig.showCancel ? "Annulla" : null}
            />

        </div>
    );
};

export default ExerciseDetailPage;