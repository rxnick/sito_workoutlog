'use client';

import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Link from 'next/link';
import styles from './Login.module.css';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (evento) => {
    evento.preventDefault();
    setError('');
    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Credenziali non valide');
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Accedi a WorkoutLog 🏋️‍♂️</h2>

      {error && <p className={styles.errorMsg}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email:</label>
          <input
            className={styles.input}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password:</label>
          <input
            className={styles.input}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className={styles.forgotPass}>
          <Link href="/forgot-password" className={styles.link}>
            Password dimenticata?
          </Link>
        </div>
        <button type="submit" className={styles.btnLogin}>Accedi</button>
      </form>

      <p className={styles.footerText}>
        Non hai un account? <Link href="/register" className={styles.link}>Registrati qui</Link>
      </p>
    </div>
  );
};

export default Login;