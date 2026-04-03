'use client';

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { useRouter } from 'next/navigation';
import ConfirmModal from '../../components/ConfirmModal';

// --- IMPORTIAMO IL MODULO CSS ---
import styles from './Profile.module.css';

// --- COMPONENTE DI CARICAMENTO ---
import Loader from '../../components/Loader';

const ProfilePage = () => {
  const { user, logout, loading: authLoading } = useContext(AuthContext);
  const { theme, setTheme } = useContext(ThemeContext);
  const router = useRouter();

  const [fullUser, setFullUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '', surname: '', country: '', profile_image: '', new_password: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, title: '', message: '', onConfirm: null, isDanger: false, showCancel: false, confirmText: 'Ho capito'
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetch('/api/me')
        .then(res => res.json())
        .then(data => {
          const userData = data.user || data;
          setFullUser(userData);
          setFormData({
            name: userData.name || '',
            surname: userData.surname || '',
            country: userData.country || 'Italia',
            profile_image: userData.profile_image || '',
            new_password: ''
          });
        })
        .catch(err => console.error(err));
    }
  }, [user, authLoading, router]);

  const startEditing = () => {
    setFormData({
      name: fullUser.name || '',
      surname: fullUser.surname || '',
      country: fullUser.country || 'Italia',
      profile_image: fullUser.profile_image || '',
      new_password: ''
    });
    setIsEditing(true);
  };

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  const showFeedback = (title, message, isError = false, onSuccess = null) => {
    setModalConfig({
      isOpen: true, title, message, isDanger: isError, confirmText: "Ho capito", showCancel: false,
      onConfirm: () => { closeModal(); if (onSuccess) onSuccess(); }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, surname: formData.surname, country: formData.country,
          profile_image: formData.profile_image, new_password: formData.new_password || undefined
        })
      });

      if (res.ok) {
        showFeedback("Profilo Aggiornato! 🚀", "I dati sono stati salvati.", false, () => window.location.reload());
        setIsEditing(false);
      } else {
        showFeedback("Errore", "Impossibile aggiornare. Riprova.", true);
      }
    } catch (err) {
      showFeedback("Errore Server", "Controlla la connessione.", true);
    }
  };

  const handleDeleteClick = () => {
    setModalConfig({
      isOpen: true,
      title: 'Elimina Account ⚠️',
      message: 'Sei sicuro? Perderai tutti i tuoi dati. Azione irreversibile.',
      isDanger: true, confirmText: 'Sì, cancella tutto', showCancel: true,
      onConfirm: confirmDeleteAccount
    });
  };

  const confirmDeleteAccount = async () => {
    try {
      const res = await fetch('/api/me', { method: 'DELETE' });
      if (res.ok) {
        logout();
        router.push('/login');
      } else {
        closeModal();
        setTimeout(() => showFeedback("Errore", "Impossibile eliminare.", true), 300);
      }
    } catch (error) {
      closeModal();
      setTimeout(() => showFeedback("Errore", "Errore di connessione.", true), 300);
    }
  };

  if (authLoading || !fullUser) return <Loader fullScreen={true} />;
  
  const joinDate = new Date(fullUser.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={styles.container}>

      <div className={styles.profileCard}>

        <div className={styles.avatarContainer}>
          {fullUser.profile_image ? (
            <img src={fullUser.profile_image} alt="Profilo" className={styles.imgReal} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {fullUser.name ? fullUser.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>

        <h1 className={styles.name}>{fullUser.name} {fullUser.surname}</h1>
        <p className={styles.email}>{fullUser.email}</p>
        <span className={styles.formHelperText}>Membro da {joinDate}</span>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{fullUser.stats?.workouts || 0}</span>
            <span className={styles.statLabel}>Allenamenti</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statNumber}>{fullUser.stats?.exercises || 0}</span>
            <span className={styles.statLabel}>Esercizi Creati</span>
          </div>
        </div>

        {!isEditing && (
          <button onClick={startEditing} className={styles.btnEditProfile}>
            ✏️ Modifica Dati
          </button>
        )}

        {isEditing && (
          <form onSubmit={handleSave} className={styles.editProfileForm}>
            <h3>Modifica Dati</h3>

            <div className={styles.formGroup}>
              <label>Nome</label>
              <input type="text" className={styles.formControl} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Cognome</label>
              <input type="text" className={styles.formControl} value={formData.surname} onChange={(e) => setFormData({ ...formData, surname: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Luogo di Nascita</label>
              <input type="text" className={styles.formControl} value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>URL Immagine Profilo</label>
              <input type="text" className={styles.formControl} placeholder="https://..." value={formData.profile_image} onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Nuova Password</label>
              <input type="password" className={styles.formControl} placeholder="Lascia vuoto per non cambiare" value={formData.new_password} onChange={(e) => setFormData({ ...formData, new_password: e.target.value })} />
            </div>

            <div className={styles.formActions}>
              <button type="button" onClick={() => setIsEditing(false)} className={styles.btnCancel}>Annulla</button>
              <button type="submit" className={styles.btnSave}>Salva Modifiche</button>
            </div>
          </form>
        )}

        {/* --- SELETTORE TEMA (PULITO) --- */}
        <div className={styles.themeSection}>
          <h4 className={styles.themeTitle}>Aspetto Applicazione</h4>
          <div className={styles.themeButtons}>
            <button
              onClick={() => setTheme('light')}
              className={`${styles.btnTheme} ${theme === 'light' ? styles.btnThemeActive : ''}`}
            >
              ☀️ Chiaro
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`${styles.btnTheme} ${theme === 'dark' ? styles.btnThemeActive : ''}`}
            >
              🌙 Scuro
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`${styles.btnTheme} ${theme === 'system' ? styles.btnThemeActive : ''}`}
            >
              💻 Sistema
            </button>
          </div>
        </div>

        {/* --- ZONA PERICOLO --- */}
        <div className={styles.dangerZone}>
          <h4 className={styles.dangerTitle}>Zona Pericolo</h4>
          <button onClick={handleDeleteClick} className={styles.btnDeleteAccount}>
            🗑️ Elimina Account Definitivamente
          </button>
        </div>

        <button onClick={logout} className={styles.btnLogout}>
          Logout
        </button>

      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message}
        onConfirm={modalConfig.onConfirm} onClose={closeModal} confirmText={modalConfig.confirmText}
        isDanger={modalConfig.isDanger} cancelText={modalConfig.showCancel ? "Annulla" : null}
      />

    </div>
  );
};

export default ProfilePage;