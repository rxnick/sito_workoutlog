import React from 'react';
import styles from './Loader.module.css';

export default function Loader({ fullScreen = false }) {
  return (
    <div className={`${styles.loaderContainer} ${fullScreen ? styles.fullScreen : ''}`}>
      <div className={styles.spinner}></div>
    </div>
  );
}