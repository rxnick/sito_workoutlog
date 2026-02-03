import { AuthProvider } from '../context/AuthContext'; // Importa il context
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
// === IMPORTIAMO I CSS ===
import './globals.css';          // Reset di base
import '../styles/Layout.css';   // Struttura pagina
import '../styles/Navbar.css';   // Stile menu
import '../styles/Footer.css';   // Stile footer
import '../styles/Home.css';     // Stile home page
import '../styles/Login.css';    // Stile login
import '../styles/Register.css'; // Stile registrazione
import '../styles/Dashboard.css';// Stile dashboard
import '../styles/Workouts.css'; // Stile allenamenti
import '../styles/Exercises.css'; // Stile gestione esercizi
import '../styles/ConfirmModal.css'; // Stile modale conferma
import '../styles/Profile.css'; // Stile profilo utente
import '../styles/Feedback.css'; // Stile feedback
import '../styles/Stats.css'; // Stile statistiche

//L'oggetto metadata controlla quello che appare nella linguettta del browser (in alto)
export const metadata = {
  title: "WorkoutLog", 
  description: "Tieni traccia dei tuoi allenamenti e migliora le tue performance con WorkoutLog!",
  icons: {
    icon: "/logo.png" // Icona della linguetta del browser
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <AuthProvider>
          <div className="app-layout">
            <Navbar />
            <div className="page-content">
              {/*children rappresenta il contenuto specifico di ogni pagina*/}
              {children} 
            </div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}