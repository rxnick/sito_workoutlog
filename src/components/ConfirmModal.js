import React from 'react';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h3 className={isDanger ? "text-danger" : "text-success"}>
            {title}
          </h3>
        </div>

        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="modal-footer">
          {/* Mostra il tasto Annulla solo se cancelText esiste */}
          {cancelText && (
            <button className="btn-cancel" onClick={onClose}>
              {cancelText}
            </button>
          )}

          <button
            // Sceglie la classe CSS giusta in base a isDanger
            className={isDanger ? "btn-confirm" : "btn-success"}
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