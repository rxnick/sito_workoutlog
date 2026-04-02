import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <p className={styles.text}>&copy; 2026 WorkoutLog. Tutti i diritti riservati.</p>
    </footer>
  );
};

export default Footer;