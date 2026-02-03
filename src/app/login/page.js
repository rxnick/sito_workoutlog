'use client';

import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import Link from 'next/link';

const Login = () => {
  // Prendiamo la funzione di login dal contesto
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    // Aggiorna lo stato del form con i nuovi valori
    // e.target.name è il nome del campo (email o password)
    // e.target.value è il valore inserito dall'utente
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (evento) => {
    // Evita che il browser invii i dati e ricarichi/naviga la pagina (comportamento di default)
    evento.preventDefault();
    setError('');
    try {
      // Chiama la funzione di login dal contesto
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.message || 'Credenziali non valide');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Accedi a WorkoutLog 🏋️‍♂️</h2>

      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email:</label>
          <input
            className="form-input"
            type="email"
            name="email"
            value={formData.email}
            // onChange cattura ogni modifica dell'input e aggiorna lo stato
            onChange={handleChange}
            // required indica che il campo è obbligatorio per l'invio del form
            required
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            className="form-input"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className='div-forgot-pass'>
          <Link href="/forgot-password" className='link-forgot-pass'>
            Password dimenticata?
          </Link>
        </div>
        <button type="submit" className="btn-login">Accedi</button>
      </form>

      <p className="p-registrati">
        Non hai un account? <Link href="/register" className='link-registrati'>Registrati qui</Link>
      </p>
    </div>
  );
};

export default Login;