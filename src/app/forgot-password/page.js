'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmModal from '../../components/ConfirmModal';
// Usa global.css importato già in layout.js

const ForgotPasswordPage = () => {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');

    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [message, setMessage] = useState({ text: '', type: '' });
    const [simulatedCode, setSimulatedCode] = useState(null);

    // CONFIGURAZIONE DEL MODALE
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,      // All'inizio è invisibile (FALSE)
        title: '',          // Nessun titolo
        message: '',        // Nessun messaggio
        onConfirm: null,    // Nessuna azione se premi OK
        isDanger: false,    // Non è rosso (pericolo)
        confirmText: 'OK',  // Testo del bottone
        showCancel: false   // Niente tasto "Annulla"
    });

    const closeModal = () =>
        setModalConfig(prev => ({
            ...prev,       // <--- 1. Prendi TUTTO quello che c'era nel vecchio modale e copialo qui
            isOpen: false  // <--- 2. ORA sovrascrivi solo questa cosa specifica
        }));

    // --- FASE 1: INVIO EMAIL ---
    const handleRequest = async (e) => {
        e.preventDefault();
        setMessage({ text: 'Verifica in corso...', type: 'info' });
        setSimulatedCode(null);

        try {
            const res = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'request', email })
            });

            const data = await res.json();

            if (res.ok) {
                setSimulatedCode(data.debug_code);
                setToken(data.debug_code); // Pre-compila il campo codice
                setMessage({ text: '', type: '' });
                setStep(2);
            } else {
                setMessage({ text: '❌ ' + data.error, type: 'error' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ text: '❌ Errore di connessione', type: 'error' });
        }
    };

    // --- FASE 2: CAMBIO PASSWORD ---
    const handleReset = async (e) => {
        e.preventDefault();
        setMessage({ text: 'Aggiornamento password...', type: 'info' });

        try {
            const res = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'reset',
                    email,
                    token,
                    new_password: newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                // QUI USIAMO IL MODALE 
                setModalConfig({
                    isOpen: true, //// <--- APRITI!
                    title: "Password Aggiornata 🎉",
                    message: "La tua password è stata cambiata con successo! Ora puoi accedere col tuo nuovo account.",
                    isDanger: false,
                    confirmText: "Vai al Login",
                    showCancel: false,
                    onConfirm: () => {
                        closeModal();
                        router.push('/login'); // Reindirizza solo quando clicchi il bottone
                    }
                });
            } else {
                setMessage({ text: '❌ ' + data.error, type: 'error' });
            }
        } catch (err) {
            setMessage({ text: '❌ Errore durante il reset.', type: 'error' });
        }
    };

    return (
        <div className="auth-container">
            <h2 className="auth-title">Recupero Password 🔐</h2>

            {/* Messaggi */}
            {message.text && (
                <div className={`message-box ${message.type === 'error' ? 'message-error' : 'message-info'}`}>
                    {message.text}
                </div>
            )}

            {/* Box Codice Simulato */}
            {step === 2 && simulatedCode && (
                <div className="debug-box">
                    <strong>🔔 SIMULAZIONE EMAIL</strong><br />
                    Il tuo codice è: <span className="debug-code">{simulatedCode}</span>
                </div>
            )}

            {step === 1 ? (
                <form onSubmit={handleRequest}>
                    <p className="auth-desc">Inserisci la tua email per ricevere il codice.</p>
                    <input
                        type="email"
                        placeholder="La tua email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-input"
                    />
                    <button type="submit" className="btn-primary">Invia Codice</button>
                </form>
            ) : (
                <form onSubmit={handleReset}>
                    <p className="auth-desc">Codice inviato a: <strong>{email}</strong></p>

                    <div className="form-group">
                        <label className="form-label">Codice di Verifica</label>
                        <input
                            type="text"
                            placeholder="Es. 123456"
                            required
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Nuova Password</label>
                        <input
                            type="password"
                            placeholder="Nuova Password sicura"
                            required
                            minLength={4}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="form-input"
                        />
                    </div>

                    <button type="submit" className="btn-primary">Reimposta Password</button>

                    <button
                        type="button"
                        onClick={() => { setStep(1); setMessage({ text: '', type: '' }); }}
                        className="btn-secondary"
                    >
                        Indietro
                    </button>
                </form>
            )}

            <div className="back-link">
                <Link href="/login" className="link-blue">Torna al Login</Link>
            </div>

            {/* INSERIAMO IL COMPONENTE MODALE QUI IN FONDO */}
            {/*Infine, dobbiamo dire dove disegnare questo modale*/}
            <ConfirmModal
                isOpen={modalConfig.isOpen} //...se questo è FALSE, il modale non si vede (restituisce null)
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onClose={closeModal} // Se clicca sulla X o fuori
                confirmText={modalConfig.confirmText}
                isDanger={modalConfig.isDanger}
                // Se showCancel è false, passiamo null a cancelText per nascondere il bottone "Annulla"
                cancelText={modalConfig.showCancel ? "Annulla" : null}
            />
        </div>
    );
};

export default ForgotPasswordPage;