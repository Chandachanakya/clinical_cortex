import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap, X, Phone, CheckCircle, AlertTriangle, Loader,
    MessageSquare, ChevronRight, Activity, Clock
} from 'lucide-react';
import api from '../../services/api';

const RISK_COLORS = {
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
    MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
    LOW: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', dot: 'bg-green-500' },
};

const DemoPanel = ({ onClose }) => {
    const [scenarios, setScenarios] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState('sepsis_critical');
    const [phone, setPhone] = useState('');
    const [doctorName, setDoctorName] = useState('Dr. Demo User');
    const [status, setStatus] = useState('idle'); // idle | loading | success | error
    const [result, setResult] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        api.get('/demo/scenarios').then(r => setScenarios(r.data)).catch(() => {});
    }, []);

    const scenario = scenarios.find(s => s.id === selectedScenario) || scenarios[0];

    const handleTrigger = async () => {
        if (!phone.trim()) return;
        setStatus('loading');
        setCurrentStep(0);
        setResult(null);

        // Animate steps appearing
        const stepTimer = setInterval(() => {
            setCurrentStep(prev => {
                if (prev >= 4) { clearInterval(stepTimer); return prev; }
                return prev + 1;
            });
        }, 500);

        try {
            const res = await api.post('/demo/trigger', {
                scenario_id: selectedScenario,
                to_phone: phone.trim(),
                doctor_name: doctorName,
            });
            clearInterval(stepTimer);
            setCurrentStep(4);
            setResult(res.data);
            setStatus('success');
        } catch (err) {
            clearInterval(stepTimer);
            setStatus('error');
            setResult({ error: err.response?.data?.detail || 'Failed to trigger demo scenario.' });
        }
    };

    const reset = () => { setStatus('idle'); setResult(null); setCurrentStep(0); };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-blue-600 p-5 flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Zap className="text-white" size={22} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Demo Mode</h3>
                            <p className="text-blue-100 text-xs mt-0.5">Twilio WhatsApp Alert Simulation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1">
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                    {status === 'idle' && (
                        <>
                            {/* Scenario Picker */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Select Scenario
                                </label>
                                <div className="space-y-2">
                                    {scenarios.map(s => {
                                        const rc = RISK_COLORS[s.risk_level] || RISK_COLORS.HIGH;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedScenario(s.id)}
                                                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                                                    selectedScenario === s.id
                                                        ? 'border-violet-500 bg-violet-50'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-slate-900 text-sm">{s.title}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${rc.bg} ${rc.text}`}>
                                                        {s.risk_level}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 leading-relaxed">{s.description}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Doctor Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Doctor Name</label>
                                <input
                                    type="text"
                                    value={doctorName}
                                    onChange={e => setDoctorName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                                    placeholder="Dr. Vivek Mehra"
                                />
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                    WhatsApp Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-1.5 flex items-start space-x-1">
                                    <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                                    <span>
                                        Must be joined to the Twilio WhatsApp Sandbox. Send <strong>"join &lt;word&gt;-&lt;word&gt;"</strong> to <strong>+1 (415) 523-8886</strong> on WhatsApp first.
                                    </span>
                                </p>
                            </div>

                            {/* Trigger Button */}
                            <button
                                onClick={handleTrigger}
                                disabled={!phone.trim()}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-200"
                            >
                                <Zap size={18} />
                                <span>Fire Demo Scenario</span>
                            </button>
                        </>
                    )}

                    {/* Loading — pipeline steps */}
                    {status === 'loading' && (
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 mb-4">
                                <Loader className="text-violet-600 animate-spin" size={22} />
                                <span className="font-semibold text-slate-700">Running demo scenario...</span>
                            </div>
                            {[
                                { label: 'Risk Model Evaluated', detail: 'XGBoost risk scoring engine' },
                                { label: 'Clinical Scores Calculated', detail: 'qSOFA + NEWS2 assessment' },
                                { label: 'Alert Generated', detail: 'Clinical alert record created' },
                                { label: 'WhatsApp Message Dispatched', detail: 'Sending via Twilio API' },
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: currentStep > i ? 1 : 0.3, x: 0 }}
                                    className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50"
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        currentStep > i ? 'bg-green-500' : 'bg-slate-200'
                                    }`}>
                                        {currentStep > i
                                            ? <CheckCircle className="text-white" size={14} />
                                            : <Clock className="text-slate-400" size={14} />
                                        }
                                    </div>
                                    <div>
                                        <p className={`text-sm font-medium ${currentStep > i ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                                        <p className="text-xs text-slate-400">{step.detail}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Success */}
                    {status === 'success' && result && (
                        <div className="space-y-4">
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle className="text-green-600" size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900">Scenario Fired!</h4>
                                <p className="text-slate-500 text-sm mt-1">
                                    {result.whatsapp_result?.status === 'mock_sent'
                                        ? '✅ WhatsApp message logged (Mock Mode — check backend console)'
                                        : `✅ WhatsApp sent to ${result.whatsapp_result?.to}`
                                    }
                                </p>
                            </div>

                            {/* Message preview */}
                            {result.whatsapp_result?.message && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-green-700 mb-2 flex items-center space-x-1">
                                        <MessageSquare size={12} />
                                        <span>WhatsApp Message Preview</span>
                                    </p>
                                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                                        {result.whatsapp_result.message}
                                    </pre>
                                </div>
                            )}

                            {/* Steps summary */}
                            <div className="space-y-2">
                                {result.steps?.map((step, i) => (
                                    <div key={i} className="flex items-center space-x-2 text-sm">
                                        <CheckCircle className="text-green-500 flex-shrink-0" size={14} />
                                        <span className="font-medium text-slate-700">{step.label}</span>
                                        <span className="text-slate-400">— {step.detail}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button onClick={reset} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium">
                                    Run Again
                                </button>
                                <button onClick={onClose} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-semibold">
                                    Done
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {status === 'error' && (
                        <div className="space-y-4">
                            <div className="text-center py-4">
                                <AlertTriangle className="mx-auto text-red-500 mb-3" size={40} />
                                <h4 className="text-lg font-bold text-slate-900">Scenario Failed</h4>
                                <p className="text-slate-500 text-sm mt-1">{result?.error || 'Something went wrong'}</p>
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={reset} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors text-sm font-semibold">
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default DemoPanel;
