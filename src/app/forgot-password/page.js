'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmModal from '../../components/ConfirmModal';

// --- IMPORTIAMO IL MODULO CSS ---
import styles from './ForgotPassword.module.css';

const ForgotPasswordPage = () => {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');

    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [message, setMessage] = useState({ text: '', type: '' });
    const [simulatedCode, setSimulatedCode] = useState(null);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,      
        title: '',          
        message: '',        
        onConfirm: null,    
        isDanger: false,    
        confirmText: 'OK',  
        showCancel: false   
    });

    const closeModal = () =>
        setModalConfig(prev => ({
            ...prev,       
            isOpen: false  
        }));

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
                setToken(data.debug_code); 
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
                setModalConfig({
                    isOpen: true, 
                    title: "Password Aggiornata 🎉",
                    message: "La tua password è stata cambiata con successo! Ora puoi accedere col tuo nuovo account.",
                    isDanger: false,
                    confirmText: "Vai al Login",
                    showCancel: false,
                    onConfirm: () => {
                        closeModal();
                        router.push('/login'); 
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
        <div className={styles.authContainer}>
            <h2 className={styles.authTitle}>Recupero Password 🔐</h2>

            {/* Messaggi Dinamici */}
            {message.text && (
                <div className={`${styles.messageBox} ${message.type === 'error' ? styles.messageError : styles.messageInfo}`}>
                    {message.text}
                </div>
            )}

            {/* Box Codice Simulato */}
            {step === 2 && simulatedCode && (
                <div className={styles.debugBox}>
                    <strong>🔔 SIMULAZIONE EMAIL</strong><br />
                    Il tuo codice è: <span className={styles.debugCode}>{simulatedCode}</span>
                </div>
            )}

            {step === 1 ? (
                <form onSubmit={handleRequest}>
                    <p className={styles.authDesc}>Inserisci la tua email per ricevere il codice.</p>
                    <input
                        type="email"
                        placeholder="La tua email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.formInput}
                    />
                    <button type="submit" className={styles.btnPrimary}>Invia Codice</button>
                </form>
            ) : (
                <form onSubmit={handleReset}>
                    <p className={styles.authDesc}>Codice inviato a: <strong>{email}</strong></p>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Codice di Verifica</label>
                        <input
                            type="text"
                            placeholder="Es. 123456"
                            required
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Nuova Password</label>
                        <input
                            type="password"
                            placeholder="Nuova Password sicura"
                            required
                            minLength={4}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={styles.formInput}
                        />
                    </div>

                    <button type="submit" className={styles.btnPrimary}>Reimposta Password</button>

                    <button
                        type="button"
                        onClick={() => { setStep(1); setMessage({ text: '', type: '' }); }}
                        className={styles.btnSecondary}
                    >
                        Indietro
                    </button>
                </form>
            )}

            <div className={styles.backLink}>
                <Link href="/login" className={styles.linkBlue}>Torna al Login</Link>
            </div>

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

export default ForgotPasswordPage;