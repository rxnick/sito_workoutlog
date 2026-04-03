import Link from 'next/link';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={styles.errorContainer}>
      <h1 className={styles.errorCode}>404</h1>
      <h2 className={styles.errorTitle}>Ops! Pagina non trovata 😕</h2>
      <p className={styles.errorDesc}>
        Sembra che tu ti sia perso. La pagina che cerchi non esiste o è stata spostata.
      </p>
      
      <Link href="/dashboard" className={styles.btnBackHome}>
        Torna alla Dashboard 🏠
      </Link>
    </div>
  );
}