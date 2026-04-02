import React from 'react';
// IMPORTIAMO IL NUOVO MODULO CSS
import styles from './ConfirmModal.module.css';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false // true = Rosso (Elimina), false = Verde/Blu (Ok/Salva)
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>

        <div className={styles.modalHeader}>
          <h3 className={isDanger ? styles.textDanger : styles.textSuccess}>
            {title}
          </h3>
        </div>

        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>

        <div className={styles.modalFooter}>
          {/* Mostra il tasto Annulla solo se cancelText esiste */}
          {cancelText && (
            <button className={styles.btnCancel} onClick={onClose}>
              {cancelText}
            </button>
          )}

          <button
            // Sceglie la classe CSS giusta in base a isDanger
            className={isDanger ? styles.btnConfirm : styles.btnSuccess}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;