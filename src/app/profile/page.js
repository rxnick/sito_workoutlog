'use client';

import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import ConfirmModal from '../../components/ConfirmModal';

const ProfilePage = () => {
  const { user, logout, loading: authLoading } = useContext(AuthContext);
  const router = useRouter();

  // fullUser: I dati "Reali" salvati nel database (per la visualizzazione)
  const [fullUser, setFullUser] = useState(null);
  
  // formData: I dati "Temporanei" mentre modifichi (per il form)
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    country: '',
    profile_image: '',
    new_password: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  // Configurazione Modale
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    isDanger: false,
    showCancel: false,
    confirmText: 'Ho capito'
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
            // Inizializziamo il form con i dati attuali
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

  // --- QUANDO CLICCHI "MODIFICA PROFILO" ---
  const startEditing = () => {
    // Reset del form ai valori attuali (per annullare modifiche precedenti non salvate)
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
      isOpen: true,
      title: title,
      message: message,
      isDanger: isError,
      confirmText: "Ho capito",
      showCancel: false,
      onConfirm: () => {
        closeModal();
        if (onSuccess) onSuccess();
      }
    });
  };

  // --- SALVATAGGIO ---
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          surname: formData.surname,
          country: formData.country,
          profile_image: formData.profile_image,
          new_password: formData.new_password || undefined
        })
      });

      if (res.ok) {
        showFeedback(
          "Profilo Aggiornato! 🚀", 
          "I dati sono stati salvati.", 
          false, 
          () => window.location.reload()
        );
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
      isDanger: true,
      confirmText: 'Sì, cancella tutto',
      showCancel: true,
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

  if (authLoading || !fullUser) return <div className="profile-loading">Caricamento...</div>;

  const joinDate = new Date(fullUser.created_at).toLocaleDateString('it-IT', {day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="profile-container">
      
      <div className="profile-card">
        
        {/* AVATAR (Usa fullUser perché è quello "vero") */}
        <div className="profile-avatar-container">
          {fullUser.profile_image ? (
             <img src={fullUser.profile_image} alt="Profilo" className="profile-img-real" />
          ) : (
             <div className="profile-avatar-placeholder">
               {fullUser.name ? fullUser.name.charAt(0).toUpperCase() : '?'}
             </div>
          )}
        </div>

        <h1 className="profile-name">{fullUser.name} {fullUser.surname}</h1>
        <p className="profile-email">{fullUser.email}</p>
        <p className="form-helper-text">Membro da {joinDate}</p>

        {/* STATISTICHE (Ora arrivano dal backend!) */}
        <div className="profile-stats-grid">
          <div className="stat-box">
            <span className="stat-number">{fullUser.stats?.workouts || 0}</span>
            <span className="stat-label">Allenamenti</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{fullUser.stats?.exercises || 0}</span>
            <span className="stat-label">Esercizi Creati</span>
          </div>
        </div>

        {!isEditing && (
          <button onClick={startEditing} className="btn-edit-profile">
            ✏️ Modifica Dati
          </button>
        )}

        {/* FORM MODIFICA (Usa formData) */}
        {isEditing && (
          <form onSubmit={handleSave} className="edit-profile-form">
            <hr />
            <h3>Modifica Dati</h3>
            
            <div className="form-group">
              <label>Nome</label>
              <input 
                 type="text" className="form-control"
                 value={formData.name} 
                 onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Cognome</label>
              <input 
                 type="text" className="form-control"
                 value={formData.surname} 
                 onChange={(e) => setFormData({...formData, surname: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Luogo di Nascita</label>
              <input 
                 type="text" className="form-control"
                 value={formData.country} 
                 onChange={(e) => setFormData({...formData, country: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>URL Immagine Profilo</label>
              <input 
                type="text" className="form-control"
                placeholder="https://..."
                value={formData.profile_image}
                onChange={(e) => setFormData({...formData, profile_image: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Nuova Password</label>
              <input 
                type="password" className="form-control"
                placeholder="Lascia vuoto per non cambiare"
                value={formData.new_password}
                onChange={(e) => setFormData({...formData, new_password: e.target.value})}
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setIsEditing(false)} className="btn-cancel">Annulla</button>
              <button type="submit" className="btn-save">Salva Modifiche</button>
            </div>
          </form>
        )}

        {/* ZONA PERICOLO */}
        <div style={{ marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '20px', textAlign: 'center' }}>
            <h4 style={{ color: '#d32f2f', marginBottom: '10px' }}>Zona Pericolo</h4>
            <button 
                onClick={handleDeleteClick} 
                className="btn-logout-profile" 
                style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}
            >
                🗑️ Elimina Account Definitivamente
            </button>
        </div>

        <button onClick={logout} className="btn-logout-profile" style={{marginTop: '20px'}}>
          Logout
        </button>

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

export default ProfilePage;