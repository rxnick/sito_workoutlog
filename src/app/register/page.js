'use client';

import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Link from 'next/link';
import styles from './Register.module.css';

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
    <div className={styles.container}>
      <h2 className={styles.title}>Crea un Account 🚀</h2>
      
      {error && <p className={styles.errorMsg}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Nome:</label>
          <input className={styles.input} type="text" name="name" onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Cognome:</label>
          <input className={styles.input} type="text" name="surname" onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Luogo di nascita:</label>
          <input className={styles.input} type="text" name="country" onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email:</label>
          <input className={styles.input} type="email" name="email" onChange={handleChange} required />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password:</label>
          <input className={styles.input} type="password" name="password" onChange={handleChange} required />
        </div>

        <button type="submit" className={styles.btnRegister}>Registrati</button>
      </form>

      <p className={styles.footerText}>
        Hai già un account? <Link href="/login" className={styles.link}>Accedi qui</Link>
      </p>
    </div>
  );
};

export default Register;