import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from '../context/AuthContext'; 
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// === IMPORTIAMO I CSS GLOBALI (Solo le variabili) ===
import './globals.css';          

// === IMPORTIAMO IL MODULO DEL LAYOUT ===
import styles from './Layout.module.css';

// === CSS VECCHI (Li elimineremo man mano che li convertiamo in moduli) ===
import '../styles/Dashboard.css';
import '../styles/Workouts.css'; 
import '../styles/Exercises.css'; 
import '../styles/ConfirmModal.css'; 
import '../styles/Profile.css'; 
import '../styles/Feedback.css'; 
import '../styles/Stats.css'; 

export const metadata = {
  title: "WorkoutLog", 
  description: "Tieni traccia dei tuoi allenamenti e migliora le tue performance con WorkoutLog!",
  icons: {
    icon: "/logo.png" 
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <AuthProvider>
          {/* Usiamo le classi dal modulo! */}
          <div className={styles.appLayout}>
            <Navbar />
            <div className={styles.pageContent}>
              {children} 
            </div>
            <Footer />
          </div>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}