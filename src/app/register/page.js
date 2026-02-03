'use client';

import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Link from 'next/link';

const Register = () => {
  const { register } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    country: ''
  });
  
  const [error, setError] = useState('');

  const handleChange = (e) => {
    // Aggiorna lo stato del form con i nuovi valori
    // e.target.name è il nome del campo (name, surname, email, password, country)
    // e.target.value è il valore inserito dall'utente
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(formData);
    } catch (err) {
      setError(err.message || 'Errore durante la registrazione');
    }
  };

  return (
    /* CAMBIO CLASSE: register-container */
    <div className="register-container">
      <h2>Crea un Account 🚀</h2>
      
      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit}>
        {/* Ho aggiunto className="form-input" a tutti gli input */}
        <div className="form-group">
          <label>Nome:</label>
          <input className="form-input" type="text" name="name" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Cognome:</label>
          <input className="form-input" type="text" name="surname" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Luogo di nascita:</label>
          <input className="form-input" type="text" name="country" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input className="form-input" type="email" name="email" onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input className="form-input" type="password" name="password" onChange={handleChange} required />
        </div>

        {/* CAMBIO CLASSE: btn-register */}
        <button type="submit" className="btn-register">Registrati</button>
      </form>

      <p className='p-login'>
        Hai già un account? <Link href="/login" className='link-login'>Accedi qui</Link>
      </p>
    </div>
  );
};

export default Register;