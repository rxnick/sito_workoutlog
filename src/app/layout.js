import { SpeedInsights } from "@vercel/speed-insights/next";
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// === IMPORTIAMO I CSS GLOBALI ===
import './globals.css';

// === IMPORTIAMO IL MODULO DEL LAYOUT ===
import styles from './Layout.module.css';

export const metadata = {
  title: "WorkoutLog",
  description: "Tieni traccia dei tuoi allenamenti e migliora le tue performance con WorkoutLog!",
  icons: {
    icon: "/logo.png"
  }
};

{/* Aggiungiamo l'attributo suppressHydrationWarning per evitare errori di idratazione durante il rendering lato server */}
export default function RootLayout({ children }) {
  return (
    <html lang="it" suppressHydrationWarning> 
      <body>
        <ThemeProvider>
          <AuthProvider>
            <div className={styles.appLayout}>
              <Navbar />
              <div className={styles.pageContent}>
                {children}
              </div>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}