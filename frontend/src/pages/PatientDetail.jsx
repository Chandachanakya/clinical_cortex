import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Activity, Heart, Droplet, Wind, Thermometer,
    AlertTriangle, FileText, Download, TrendingUp, TrendingDown,
    Clock, User, Calendar, MapPin, Info
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    mockPatients, generateVitalsData, generateLabData,
    getRiskPredictions, getShapExplanation, getGuidelineCitations,
    getUncertaintyFlags
} from '../data/mockClinicalData';
import { RiskBadge } from '../components/shared/Badge';
import RiskCard from '../components/shared/RiskCard';
import Disclaimer from '../components/shared/Disclaimer';
import api from '../services/api';

const PatientDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [liveData, setLiveData] = useState(null);
    const [liveLoading, setLiveLoading] = useState(true);
    const [liveError, setLiveError] = useState(null);
    const [livePredictions, setLivePredictions] = useState(null);

    // Fetch live identity data from API — ONLY source of truth for patient identity
    useEffect(() => {
        setLiveLoading(true);
        setLiveData(null);
        setLiveError(null);
        setLivePredictions(null);

        const fetchLiveData = async () => {
            try {
                // Monitor call is required — patient identity depends on it
                const monitorRes = await api.get(`/patients/${id}/monitor`);
                console.log('[PatientDetail] monitor data:', monitorRes.data);
                setLiveData(monitorRes.data);

                // Predictions call is optional — fail gracefully
                try {
                    const predRes = await api.get(`/patients/${id}/predictions`);
                    if (predRes.data?.available) {
                        console.log('[PatientDetail] live predictions:', predRes.data);
                        setLivePredictions(predRes.data);
                    }
                } catch (predErr) {
                    console.warn('[PatientDetail] predictions unavailable:', predErr.message);
                }
            } catch (err) {
                const msg = err.response?.data?.detail || err.message || 'Failed to load patient';
                console.error('[PatientDetail] monitor fetch failed:', msg, err);
                setLiveError(msg);
            } finally {
                setLiveLoading(false);
            }
        };

        fetchLiveData();
    }, [id]);

    // Loading spinner
    if (liveLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading patient data...</p>
                </div>
            </div>
        );
    }

    // Error state — visible reason + back button
    if (liveError) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="text-red-500" size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Could not load patient</h2>
                    <p className="text-slate-500 text-sm mb-6">{liveError}</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Build the patient object from API data (primary) + mock data for extra fields only
    // Use a stable seed index for mock chart data: (DB id - 1) mod 5, clamped to 1-5
    const mockSeedId = liveData ? ((parseInt(id) - 1) % 5) + 1 : 1;

    // Build patient entirely from API data — this guarantees correct identity
    const patient = liveData ? {
        // Identity fields — from API ONLY
        id: liveData.id,
        name: liveData.name,
        mrn: liveData.mrn,
        age: liveData.age,
        gender: liveData.gender,
        ward: liveData.ward,
        bed: liveData.bed,
        status: liveData.status,
        // Risk fields — from API ONLY
        riskLevel: liveData.risk_level || 'LOW',
        riskTypes: liveData.risk_types || [],
        qSofaScore: liveData.q_sofa_score || 0,
        news2Score: liveData.news2_score || 0,
        lastVitalsUpdate: liveData.last_vitals_update,
        // Supplemental fields — pull from mock if available (not identity-critical)
        ...(() => {
            const mock = mockPatients.find(p => p.mrn === liveData.mrn) ||
                         mockPatients[mockSeedId - 1] || mockPatients[0];
            return {
                diagnosis: mock?.diagnosis || '',
                assignedDoctor: mock?.assignedDoctor || '',
                admissionDate: mock?.admissionDate || '',
                riskScore: mock?.riskScore || 0,
            };
        })()
    } : null;

    // Mock-seeded chart data — used as fallback when live predictions aren't available yet
    const vitalsData = generateVitalsData(mockSeedId);
    const labData = generateLabData(mockSeedId);
    const mockRiskPredictions = getRiskPredictions(mockSeedId);
    const mockShapData = getShapExplanation(mockSeedId);
    const mockUncertaintyFlags = getUncertaintyFlags(mockSeedId);

    // === LIVE PREDICTION OVERRIDE ===
    // If the backend has produced real ML predictions, use them; otherwise fall back to mock
    const usingLiveML = !!livePredictions;

    const riskPredictions = usingLiveML ? {
        // Map live backend keys to the exact keys the JSX template expects
        sepsis: livePredictions.risk_breakdown?.sepsis
            ? { ...mockRiskPredictions.sepsis, probability: livePredictions.risk_breakdown.sepsis.probability, level: livePredictions.risk_breakdown.sepsis.level }
            : mockRiskPredictions.sepsis,
        aki: livePredictions.risk_breakdown?.aki
            ? { ...mockRiskPredictions.aki, probability: livePredictions.risk_breakdown.aki.probability, level: livePredictions.risk_breakdown.aki.level }
            : mockRiskPredictions.aki,
        // Backend stores it as 'respiratory_failure' — map to 'respiratory' for the template
        respiratory: livePredictions.risk_breakdown?.respiratory_failure
            ? { ...mockRiskPredictions.respiratory, probability: livePredictions.risk_breakdown.respiratory_failure.probability, level: livePredictions.risk_breakdown.respiratory_failure.level }
            : mockRiskPredictions.respiratory,
        // Shock isn't modelled in the backend yet — use mock fallback
        shock: mockRiskPredictions.shock,
    } : mockRiskPredictions;

    const shapData = usingLiveML && livePredictions.shap_explanations?.top_drivers
        ? livePredictions.shap_explanations.top_drivers.map(d => ({
            feature: d.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            importance: Math.abs(d.impact),
            direction: d.direction === 'increasing' ? 'increase' : 'decrease',
            value: '' // Potential to add real value here if passed from backend
        }))
        : mockShapData;

    const uncertaintyFlags = usingLiveML && livePredictions.uncertainty_flags?.length
        ? livePredictions.uncertainty_flags
        : mockUncertaintyFlags;

    const clinicalScores = usingLiveML ? livePredictions.clinical_scores : null;

    if (!patient) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-slate-600">Patient not found</p>
                    <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">
                        Return to Patient List
                    </button>
                </div>
            </div>
        );
    }

    const TabButton = ({ label, value }) => (
        <button
            onClick={() => setActiveTab(value)}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === value
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <ArrowLeft size={20} />
                                <span>Back to List</span>
                            </button>
                            <div className="h-6 w-px bg-slate-300" />
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">{patient.name}</h1>
                                <p className="text-sm text-slate-500">{patient.mrn} • {patient.age}y {patient.gender}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <RiskBadge level={patient.riskLevel} showDot />
                            {usingLiveML && (
                                <span className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                                    <Activity size={11} />
                                    <span>Live ML</span>
                                </span>
                            )}
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                                <Download size={18} />
                                <span>Generate Report</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                <Disclaimer className="mb-6" />

                {/* Patient Info Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="flex items-start space-x-3">
                            <MapPin className="text-slate-400 mt-1" size={20} />
                            <div>
                                <p className="text-sm text-slate-500">Location</p>
                                <p className="font-semibold text-slate-900">{patient.ward} - Bed {patient.bed}</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <Calendar className="text-slate-400 mt-1" size={20} />
                            <div>
                                <p className="text-sm text-slate-500">Admitted</p>
                                <p className="font-semibold text-slate-900">
                                    {new Date(patient.admissionDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <User className="text-slate-400 mt-1" size={20} />
                            <div>
                                <p className="text-sm text-slate-500">Attending</p>
                                <p className="font-semibold text-slate-900">{patient.assignedDoctor}</p>
                            </div>
                        </div>
                        <div className="flex items-start space-x-3">
                            <FileText className="text-slate-400 mt-1" size={20} />
                            <div>
                                <p className="text-sm text-slate-500">Diagnosis</p>
                                <p className="font-semibold text-slate-900">{patient.diagnosis}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Uncertainty Warnings */}
                {uncertaintyFlags && uncertaintyFlags.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900 mb-2">Data Quality Warnings</h3>
                                <ul className="space-y-1">
                                    {uncertaintyFlags.map((flag, idx) => (
                                        <li key={idx} className="text-sm text-amber-800">
                                            • {flag.message}
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs text-amber-700 mt-2">
                                    Risk assessment may be limited due to incomplete data.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex space-x-2 mb-6">
                    <TabButton label="Overview" value="overview" />
                    <TabButton label="Vitals & Labs" value="vitals" />
                    <TabButton label="Risk Analysis" value="risk" />
                    <TabButton label="Guidelines" value="guidelines" />
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Clinical Scores Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">qSOFA Score</h3>
                                    <div className="flex items-baseline space-x-2">
                                        <span className={`text-3xl font-black ${patient.qSofaScore >= 2 ? 'text-red-600' : 'text-slate-900'}`}>{patient.qSofaScore}</span>
                                        <span className="text-sm text-slate-400">/ 3</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {patient.qSofaScore >= 2 ? '⚠️ High risk of poor outcome' : 'Low risk of poor outcome'}
                                    </p>
                                </div>
                                <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center relative overflow-hidden">
                                    <div
                                        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${patient.qSofaScore >= 2 ? 'bg-red-500' : 'bg-blue-500'}`}
                                        style={{ height: `${(patient.qSofaScore / 3) * 100}%`, opacity: 0.2 }}
                                    />
                                    <Activity className={patient.qSofaScore >= 2 ? 'text-red-600' : 'text-blue-600'} size={24} />
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">NEWS2 Score</h3>
                                    <div className="flex items-baseline space-x-2">
                                        <span className={`text-3xl font-black ${patient.news2Score >= 7 ? 'text-red-600' : (patient.news2Score >= 5 ? 'text-orange-600' : 'text-slate-900')}`}>{patient.news2Score}</span>
                                        <span className="text-sm text-slate-400">/ 20</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {patient.news2Score >= 7 ? '🚨 Immediate clinical response required' : (patient.news2Score >= 5 ? '⚠️ Urgent clinical review required' : 'Routine monitoring')}
                                    </p>
                                </div>
                                <div className="w-16 h-16 rounded-full border-4 border-slate-100 flex items-center justify-center relative overflow-hidden">
                                    <div
                                        className={`absolute bottom-0 left-0 w-full transition-all duration-1000 ${patient.news2Score >= 7 ? 'bg-red-500' : (patient.news2Score >= 5 ? 'bg-orange-500' : 'bg-blue-500')}`}
                                        style={{ height: `${(patient.news2Score / 20) * 100}%`, opacity: 0.2 }}
                                    />
                                    <TrendingUp className={patient.news2Score >= 7 ? 'text-red-600' : (patient.news2Score >= 5 ? 'text-orange-600' : 'text-blue-600')} size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Risk Predictions */}
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Risk Predictions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <RiskCard
                                    title="Sepsis Risk"
                                    probability={riskPredictions.sepsis.probability}
                                    confidence={riskPredictions.sepsis.confidence}
                                    timeWindow={riskPredictions.sepsis.timeWindow}
                                />
                                <RiskCard
                                    title="AKI Risk"
                                    probability={riskPredictions.aki.probability}
                                    confidence={riskPredictions.aki.confidence}
                                    timeWindow={riskPredictions.aki.timeWindow}
                                />
                                <RiskCard
                                    title="Respiratory Failure"
                                    probability={riskPredictions.respiratory.probability}
                                    confidence={riskPredictions.respiratory.confidence}
                                    timeWindow={riskPredictions.respiratory.timeWindow}
                                />
                                <RiskCard
                                    title="Shock Risk"
                                    probability={riskPredictions.shock.probability}
                                    confidence={riskPredictions.shock.confidence}
                                    timeWindow={riskPredictions.shock.timeWindow}
                                />
                            </div>
                        </div>

                        {/* Quick Vitals */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Current Vitals</h3>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                    { icon: Heart, label: 'Heart Rate', value: vitalsData[vitalsData.length - 1].hr.toFixed(0), unit: 'bpm', color: 'text-red-600' },
                                    { icon: Activity, label: 'Blood Pressure', value: `${vitalsData[vitalsData.length - 1].sbp.toFixed(0)}/${vitalsData[vitalsData.length - 1].dbp.toFixed(0)}`, unit: 'mmHg', color: 'text-blue-600' },
                                    { icon: Wind, label: 'Resp. Rate', value: vitalsData[vitalsData.length - 1].rr.toFixed(0), unit: '/min', color: 'text-cyan-600' },
                                    { icon: Droplet, label: 'SpO₂', value: vitalsData[vitalsData.length - 1].spo2.toFixed(0), unit: '%', color: 'text-sky-600' },
                                    { icon: Thermometer, label: 'Temperature', value: vitalsData[vitalsData.length - 1].temp.toFixed(1), unit: '°C', color: 'text-orange-600' }
                                ].map((vital, idx) => (
                                    <div key={idx} className="text-center">
                                        <vital.icon className={`mx-auto mb-2 ${vital.color}`} size={24} />
                                        <p className="text-xs text-slate-500 mb-1">{vital.label}</p>
                                        <p className="text-xl font-bold text-slate-900">{vital.value}</p>
                                        <p className="text-xs text-slate-500">{vital.unit}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'vitals' && (
                    <div className="space-y-6">
                        {/* Vitals Chart */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Vital Signs Trend (24h)</h3>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={vitalsData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                            }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2} name="Heart Rate" dot={false} />
                                        <Line type="monotone" dataKey="rr" stroke="#06b6d4" strokeWidth={2} name="Resp Rate" dot={false} />
                                        <Line type="monotone" dataKey="spo2" stroke="#0ea5e9" strokeWidth={2} name="SpO₂" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Lab Results */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Laboratory Trends</h3>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={labData}>
                                        <defs>
                                            <linearGradient id="colorLactate" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorCreatinine" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Legend />
                                        <Area type="monotone" dataKey="lactate" stroke="#f59e0b" fillOpacity={1} fill="url(#colorLactate)" name="Lactate (mmol/L)" />
                                        <Area type="monotone" dataKey="creatinine" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCreatinine)" name="Creatinine (mg/dL)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'risk' && (
                    <div className="space-y-6">
                        {/* SHAP Explanation */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Feature Importance (SHAP)</h3>
                                    <p className="text-sm text-slate-500 mt-1">Top factors contributing to risk assessment</p>
                                </div>
                                <Info className="text-slate-400" size={20} />
                            </div>

                            <div className="space-y-3">
                                {shapData.map((item, idx) => (
                                    <div key={idx} className="flex items-center space-x-4">
                                        <div className="w-40 text-sm font-medium text-slate-700">{item.feature}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${item.direction === 'increase' ? 'bg-red-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${item.importance * 100}%` }}
                                                    />
                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
                                                        {(item.importance * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                {item.direction === 'increase' ? (
                                                    <TrendingUp className="text-red-500" size={18} />
                                                ) : (
                                                    <TrendingDown className="text-green-500" size={18} />
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-24 text-sm text-slate-600 text-right">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Risk Score Breakdown */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Risk Score Breakdown</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={shapData.slice(0, 6)}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="feature" tick={{ fill: '#64748b', fontSize: 11 }} angle={-45} textAnchor="end" height={100} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="importance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'guidelines' && (
                    <div className="space-y-4">
                        {patient.riskTypes.map(riskType => {
                            const guidelines = getGuidelineCitations(riskType);
                            return (
                                <div key={riskType} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <h3 className="text-lg font-bold text-slate-900 mb-4">{riskType} - Clinical Guidelines</h3>
                                    <div className="space-y-4">
                                        {guidelines.map((guideline, idx) => (
                                            <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h4 className="font-semibold text-slate-900">{guideline.source}</h4>
                                                        <p className="text-sm text-slate-500">{guideline.section}</p>
                                                    </div>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                                                        {(guideline.relevance * 100).toFixed(0)}% relevant
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-700 leading-relaxed">{guideline.citation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {patient.riskTypes.length === 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                                <p className="text-slate-500">No active risk alerts. Guidelines will appear when risks are detected.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientDetail;
