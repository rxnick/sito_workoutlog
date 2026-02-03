//import { text } from 'express';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="error-container">
      <h1 className="error-code">404</h1>
      <h2 className="error-title">Ops! Pagina non trovata 😕</h2>
      <p className="error-desc">
        Sembra che tu ti sia perso. La pagina che cerchi non esiste o è stata spostata.
      </p>
      
      <Link href="/dashboard" className="btn-back-home">
        Torna alla Dashboard 🏠
      </Link>
    </div>
  );
}