import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const RealTimeVitals = ({ patientId, isLive = false }) => {
    const [vitalsData, setVitalsData] = useState({
        hr: { value: 72, trend: 'stable', history: [] },
        bp: { systolic: 120, diastolic: 80, trend: 'stable', history: [] },
        rr: { value: 16, trend: 'stable', history: [] },
        spo2: { value: 98, trend: 'stable', history: [] },
        temp: { value: 36.6, trend: 'stable', history: [] }
    });

    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Simulate real-time updates
    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            setVitalsData(prev => {
                const generateValue = (current, min, max, variance) => {
                    const change = (Math.random() - 0.5) * variance;
                    const newValue = Math.max(min, Math.min(max, current + change));
                    return Math.round(newValue * 10) / 10;
                };

                const newHr = generateValue(prev.hr.value, 60, 100, 3);
                const newSystolic = generateValue(prev.bp.systolic, 100, 140, 5);
                const newDiastolic = generateValue(prev.bp.diastolic, 60, 90, 3);
                const newRr = generateValue(prev.rr.value, 12, 20, 2);
                const newSpo2 = generateValue(prev.spo2.value, 95, 100, 1);
                const newTemp = generateValue(prev.temp.value, 36, 37.5, 0.2);

                return {
                    hr: {
                        value: newHr,
                        trend: newHr > prev.hr.value ? 'up' : newHr < prev.hr.value ? 'down' : 'stable',
                        history: [...prev.hr.history.slice(-19), newHr]
                    },
                    bp: {
                        systolic: newSystolic,
                        diastolic: newDiastolic,
                        trend: newSystolic > prev.bp.systolic ? 'up' : newSystolic < prev.bp.systolic ? 'down' : 'stable',
                        history: [...prev.bp.history.slice(-19), newSystolic]
                    },
                    rr: {
                        value: newRr,
                        trend: newRr > prev.rr.value ? 'up' : newRr < prev.rr.value ? 'down' : 'stable',
                        history: [...prev.rr.history.slice(-19), newRr]
                    },
                    spo2: {
                        value: newSpo2,
                        trend: newSpo2 > prev.spo2.value ? 'up' : newSpo2 < prev.spo2.value ? 'down' : 'stable',
                        history: [...prev.spo2.history.slice(-19), newSpo2]
                    },
                    temp: {
                        value: newTemp,
                        trend: newTemp > prev.temp.value ? 'up' : newTemp < prev.temp.value ? 'down' : 'stable',
                        history: [...prev.temp.history.slice(-19), newTemp]
                    }
                };
            });
            setLastUpdate(new Date());
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [isLive]);

    const getStatusColor = (value, min, max, critical) => {
        if (value < critical.min || value > critical.max) return 'text-red-600 bg-red-50';
        if (value < min || value > max) return 'text-amber-600 bg-amber-50';
        return 'text-green-600 bg-green-50';
    };

    const VitalCard = ({ label, value, unit, trend, history, statusColor, icon: Icon }) => (
        <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                    {Icon && <Icon size={18} className="text-slate-400" />}
                    <span className="text-sm font-medium text-slate-600">{label}</span>
                </div>
                {trend !== 'stable' && (
                    <div className={`${trend === 'up' ? 'text-red-500' : 'text-blue-500'}`}>
                        {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                )}
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <span className={`text-2xl font-bold ${statusColor}`}>{value}</span>
                    <span className="text-sm text-slate-500 ml-1">{unit}</span>
                </div>
                {history.length > 0 && (
                    <div className="w-20 h-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history.map((v, i) => ({ value: v }))}>
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={statusColor.includes('red') ? '#ef4444' : statusColor.includes('amber') ? '#f59e0b' : '#10b981'}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Live Indicator */}
            {isLive && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl">
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                        </div>
                        <span className="text-sm font-medium text-blue-900">Live Monitoring Active</span>
                    </div>
                    <span className="text-xs text-blue-700">
                        Last update: {lastUpdate.toLocaleTimeString()}
                    </span>
                </div>
            )}

            {/* Vitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <VitalCard
                    label="Heart Rate"
                    value={vitalsData.hr.value}
                    unit="bpm"
                    trend={vitalsData.hr.trend}
                    history={vitalsData.hr.history}
                    statusColor={getStatusColor(vitalsData.hr.value, 60, 100, { min: 40, max: 120 })}
                    icon={Activity}
                />
                <VitalCard
                    label="Blood Pressure"
                    value={`${vitalsData.bp.systolic}/${vitalsData.bp.diastolic}`}
                    unit="mmHg"
                    trend={vitalsData.bp.trend}
                    history={vitalsData.bp.history}
                    statusColor={getStatusColor(vitalsData.bp.systolic, 100, 140, { min: 80, max: 160 })}
                />
                <VitalCard
                    label="Respiratory Rate"
                    value={vitalsData.rr.value}
                    unit="bpm"
                    trend={vitalsData.rr.trend}
                    history={vitalsData.rr.history}
                    statusColor={getStatusColor(vitalsData.rr.value, 12, 20, { min: 8, max: 30 })}
                />
                <VitalCard
                    label="SpO₂"
                    value={vitalsData.spo2.value}
                    unit="%"
                    trend={vitalsData.spo2.trend}
                    history={vitalsData.spo2.history}
                    statusColor={getStatusColor(vitalsData.spo2.value, 95, 100, { min: 90, max: 100 })}
                />
                <VitalCard
                    label="Temperature"
                    value={vitalsData.temp.value}
                    unit="°C"
                    trend={vitalsData.temp.trend}
                    history={vitalsData.temp.history}
                    statusColor={getStatusColor(vitalsData.temp.value, 36, 37.5, { min: 35, max: 39 })}
                />
            </div>
        </div>
    );
};

export default RealTimeVitals;
