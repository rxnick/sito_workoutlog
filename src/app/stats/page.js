'use client';

import { useState, useContext, Suspense } from 'react';
import { AuthContext } from '../../context/AuthContext';
/* Invece di utilizzare useEffect e il fetch classico, utilizzo useSWR, il quale 
gestisce automaticamente la cache dei dati: se l'utente naviga via e torna sulla pagina, i grafici sono istantanei */
import useSWR from 'swr'; // SWR
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

// Fetcher generico per SWR
const fetcher = (url) => fetch(url).then((res) => res.json());

// --- SOTTO-COMPONENTE CHE GESTISCE I DATI ---
// Questo componente verrà "sospeso" finché i dati non sono pronti
const StatsContent = () => {
    const [selectedExId, setSelectedExId] = useState('');

    // 1. Fetch Esercizi (Suspense: true)
    /* useSWR restituirà un oggetto con dentro una proprietà chiamata data 
    Assegnamo alla proprietà data il nome exercises con i due punti (:)
    exercises contiene la lista degli esercizi */
    
    /*Appena React vede { suspense: true }, capisce che i dati non ci sono ancora. 
    Invece di mostrare errori o variabili undefined, "congela" il componente StatsContent e mostra al suo posto lo scheletro StatsSkeletonLoader*/
    const { data: exercises } = useSWR('/api/exercises', fetcher, { suspense: true });

    // 2. Fetch Statistiche Generali (Suspense: true)
    // generalStats contiene i dati per i grafici a torta e barre
    const { data: generalStats } = useSWR('/api/stats?type=general', fetcher, { suspense: true });

    /* SWR fa partire le richieste al server simultaneamente (in parallelo, non una dopo l'altra 
    Appena tutti i dati obbligatori sono arrivati, React rimuove lo scheletro e mostra i grafici veri*/

    // 3. Fetch Progressione 
    // SWR non esegue la fetch se la chiave è null. 
    // Nota: La suspense qui scatterà ogni volta che cambi esercizio.
    // rawProgressionData contiene i dati del grafico a linee
    const { data: rawProgressionData } = useSWR(
        selectedExId ? `/api/stats?type=progression&exercise_id=${selectedExId}` : null, 
        fetcher,
        { suspense: true } 
    );

    // Formattazione dati progressione
    const progressionData = rawProgressionData?.map(item => ({
        ...item,
        dateShort: new Date(item.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
    })) || [];

    return (
        <div className="stats-grid">
            {/* --- 1. PROGRESSIONE CARICHI --- */}
            <div className="stat-card full-width">
                <h3 className="chart-title">📈 Progressione Carichi (Massimale)</h3>
                
                <select 
                    className="select-exercise-stats" 
                    onChange={(e) => setSelectedExId(e.target.value)}
                    value={selectedExId}
                >
                    <option value="">-- Seleziona un Esercizio --</option>
                    {exercises?.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                </select>

                {selectedExId && progressionData.length > 0 ? (
                    <div className="chart-container">
                        <ResponsiveContainer>
                            <LineChart data={progressionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="dateShort" />
                                <YAxis unit="kg" domain={['dataMin - 5', 'dataMax + 5']} />
                                <Tooltip contentStyle={{ borderRadius: '10px' }} />
                                <Line 
                                    type="monotone" dataKey="max_weight" stroke="#007bff" 
                                    strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} name="Peso Max"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="empty-state">
                       {selectedExId ? "Nessun dato registrato." : "Seleziona un esercizio sopra ☝️"}
                    </p>
                )}
            </div>

            {/* --- 2. COSTANZA --- */}
            <div className="stat-card">
                <h3 className="chart-title">📅 Allenamenti al Mese</h3>
                <div className="chart-container">
                    <ResponsiveContainer>
                        <BarChart data={generalStats?.workoutsByMonth || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickFormatter={(str) => str.substring(5)} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#28a745" radius={[5, 5, 0, 0]} name="Allenamenti" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- 3. BILANCIAMENTO --- */}
            <div className="stat-card">
                <h3 className="chart-title">🕸️ Bilanciamento Allenamento</h3>
                <div className="chart-container">
                    <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={generalStats?.muscleDist || []}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="muscle_group" />
                            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
                            <Radar name="Esercizi" dataKey="count" stroke="#746fda" fill="#8884d8" fillOpacity={0.6} />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPALE (Loading Shell) ---
const StatsPage = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null; // O un redirect

  return (
    <div className="stats-container">
      <h1 className="page-title">Le tue Statistiche 📊</h1>
      
      {/* Qui avviene la magia: Il fallback viene mostrato mentre StatsContent carica i dati */}
      <Suspense fallback={<StatsSkeletonLoader />}>
         <StatsContent />
      </Suspense>
    </div>
  );
};

// Componente di caricamento (Skeleton) 
const StatsSkeletonLoader = () => (
    <div className="loading-skeleton">
        <div className="spinner-skeleton"></div>
        <p>Caricamento statistiche in corso...</p>
    </div>
);

export default StatsPage;