'use client';

import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import useSWR from 'swr';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// --- IMPORTIAMO IL MODULO CSS E IL LOADER ---
import styles from './Stats.module.css';
import Loader from '../../components/Loader';

const fetcher = (url) => fetch(url).then((res) => res.json());

const StatsPage = () => {
    const { user } = useContext(AuthContext);
    const [selectedExId, setSelectedExId] = useState('');

    // ESTRAIAMO isLoading DA SWR (Addio Suspense!)
    const { data: exercises, isLoading: loadingEx } = useSWR(user ? '/api/exercises' : null, fetcher);
    const { data: generalStats, isLoading: loadingStats } = useSWR(user ? '/api/stats?type=general' : null, fetcher);

    const { data: rawProgressionData, isLoading: loadingProg } = useSWR(
        user && selectedExId ? `/api/stats?type=progression&exercise_id=${selectedExId}` : null,
        fetcher
    );

    if (!user) return null;

    // Se stiamo scaricando i dati iniziali, mostriamo un SINGOLO loader a tutto schermo
    if (loadingEx || loadingStats) {
        return <Loader fullScreen={true} />;
    }

    const progressionData = rawProgressionData?.map(item => ({
        ...item,
        dateShort: new Date(item.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
    })) || [];

    return (
        <div className={styles.statsContainer}>
            <h1 className={styles.pageTitle}>Le tue Statistiche 📊</h1>

            <div className={styles.statsGrid}>
                {/* --- 1. PROGRESSIONE CARICHI --- */}
                <div className={`${styles.statCard} ${styles.fullWidth}`}>
                    <h3 className={styles.chartTitle}>📈 Progressione Carichi (Massimale)</h3>

                    <select
                        className={styles.selectExerciseStats}
                        onChange={(e) => setSelectedExId(e.target.value)}
                        value={selectedExId}
                    >
                        <option value="">-- Seleziona un Esercizio --</option>
                        {exercises?.map(ex => (
                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                        ))}
                    </select>

                    {/* UX PRO: Loader piccolo SOLO dentro questo box quando cambi esercizio */}
                    {selectedExId ? (
                        loadingProg ? (
                            <div className={styles.chartContainer} style={{ display: 'flex', alignItems: 'center' }}>
                                <Loader />
                            </div>
                        ) : progressionData.length > 0 ? (
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer>
                                    <LineChart data={progressionData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="dateShort" />
                                        <YAxis unit="kg" domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', borderRadius: '10px', color: 'var(--text-main)' }}
                                            itemStyle={{ color: 'var(--primary-blue)' }}
                                        />
                                        <Line
                                            type="monotone" dataKey="max_weight" stroke="#007bff"
                                            strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} name="Peso Max"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className={styles.emptyState}>Nessun dato registrato.</p>
                        )
                    ) : (
                        <p className={styles.emptyState}>Seleziona un esercizio sopra ☝️</p>
                    )}
                </div>

                {/* --- 2. COSTANZA --- */}
                <div className={styles.statCard}>
                    <h3 className={styles.chartTitle}>📅 Allenamenti al Mese</h3>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer>
                            <BarChart data={generalStats?.workoutsByMonth || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" tickFormatter={(str) => str.substring(5)} />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }}
                                    cursor={{ fill: 'var(--bg-secondary)' }}
                                />
                                <Bar dataKey="count" fill="#28a745" radius={[5, 5, 0, 0]} name="Allenamenti" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- 3. BILANCIAMENTO --- */}
                <div className={styles.statCard}>
                    <h3 className={styles.chartTitle}>🕸️ Bilanciamento Allenamento</h3>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={generalStats?.muscleDist || []}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="muscle_group" />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} />
                                <Radar name="Esercizi" dataKey="count" stroke="#746fda" fill="#8884d8" fillOpacity={0.6} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)', borderRadius: '8px', color: 'var(--text-main)' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;