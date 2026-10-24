import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, FileText, Download, Mail, MessageSquare,
    Eye, Calendar, User, Activity
} from 'lucide-react';
import { mockPatients } from '../data/mockClinicalData';
import Disclaimer from '../components/shared/Disclaimer';

const Reports = () => {
    const navigate = useNavigate();
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const handleGenerateReport = (patient) => {
        setSelectedPatient(patient);
        setShowPreview(true);
    };

    const handleDownload = () => {
        alert('Report downloaded successfully (mock)');
    };

    const handleEmail = () => {
        alert('Report sent via email (mock)');
    };

    const handleSMS = () => {
        alert('Secure link sent via SMS (mock)');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Back to Dashboard</span>
                        </button>
                        <div className="h-6 w-px bg-slate-300" />
                        <div className="flex items-center space-x-3">
                            <FileText className="text-blue-600" size={24} />
                            <h1 className="text-2xl font-bold text-slate-900">Clinical Reports</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                <Disclaimer className="mb-6" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Patient Selection */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Select Patient for Report</h2>
                        <div className="space-y-3">
                            {mockPatients.map((patient, index) => (
                                <motion.div
                                    key={patient.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-white p-4 rounded-xl shadow-sm border-2 transition-all cursor-pointer ${selectedPatient?.id === patient.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-300'
                                        }`}
                                    onClick={() => setSelectedPatient(patient)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                                            <p className="text-sm text-slate-500">{patient.mrn}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${patient.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                                patient.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                                    patient.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                                                        'bg-green-100 text-green-800'
                                            }`}>
                                            {patient.riskLevel}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600">{patient.diagnosis}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Report Actions */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Report Actions</h2>

                        {!selectedPatient ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                                <p className="text-slate-500">Select a patient to generate a report</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <h3 className="font-semibold text-slate-900 mb-4">Report for {selectedPatient.name}</h3>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center space-x-3 text-sm">
                                            <User className="text-slate-400" size={16} />
                                            <span className="text-slate-600">Patient: {selectedPatient.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 text-sm">
                                            <FileText className="text-slate-400" size={16} />
                                            <span className="text-slate-600">MRN: {selectedPatient.mrn}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 text-sm">
                                            <Activity className="text-slate-400" size={16} />
                                            <span className="text-slate-600">Risk Level: {selectedPatient.riskLevel}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 text-sm">
                                            <Calendar className="text-slate-400" size={16} />
                                            <span className="text-slate-600">Generated: {new Date().toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-200 pt-4">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Report Contents:</h4>
                                        <ul className="space-y-2 text-sm text-slate-600">
                                            <li className="flex items-start space-x-2">
                                                <span className="text-blue-600">•</span>
                                                <span>Risk assessment summary with probabilities</span>
                                            </li>
                                            <li className="flex items-start space-x-2">
                                                <span className="text-blue-600">•</span>
                                                <span>SHAP feature importance analysis</span>
                                            </li>
                                            <li className="flex items-start space-x-2">
                                                <span className="text-blue-600">•</span>
                                                <span>Clinical guideline citations (WHO/NICE)</span>
                                            </li>
                                            <li className="flex items-start space-x-2">
                                                <span className="text-blue-600">•</span>
                                                <span>Vitals and laboratory trends</span>
                                            </li>
                                            <li className="flex items-start space-x-2">
                                                <span className="text-blue-600">•</span>
                                                <span>Audit trail and timestamp</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <h4 className="font-semibold text-slate-900 mb-4">Delivery Options</h4>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => handleGenerateReport(selectedPatient)}
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                        >
                                            <Eye size={18} />
                                            <span>Preview Report</span>
                                        </button>

                                        <button
                                            onClick={handleDownload}
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            <Download size={18} />
                                            <span>Download PDF</span>
                                        </button>

                                        <button
                                            onClick={handleEmail}
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                                        >
                                            <Mail size={18} />
                                            <span>Email to Hospital</span>
                                        </button>

                                        <button
                                            onClick={handleSMS}
                                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                        >
                                            <MessageSquare size={18} />
                                            <span>Send Secure SMS Link</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Preview */}
                                {showPreview && (
                                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                        <h4 className="font-semibold text-slate-900 mb-4">Report Preview</h4>
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-sm space-y-3">
                                            <div className="text-center border-b border-slate-300 pb-3">
                                                <h5 className="font-bold text-lg">Clinical Risk Assessment Report</h5>
                                                <p className="text-slate-600 text-xs mt-1">Clinical Decision Support Tool - Advisory Only</p>
                                            </div>

                                            <div>
                                                <p><strong>Patient:</strong> {selectedPatient.name}</p>
                                                <p><strong>MRN:</strong> {selectedPatient.mrn}</p>
                                                <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
                                            </div>

                                            <div className="border-t border-slate-300 pt-3">
                                                <p className="font-semibold mb-2">Risk Assessment Summary:</p>
                                                <p className="text-slate-700">
                                                    Overall Risk Level: <strong>{selectedPatient.riskLevel}</strong>
                                                </p>
                                                <p className="text-slate-700">
                                                    Active Risk Types: {selectedPatient.riskTypes.join(', ') || 'None'}
                                                </p>
                                            </div>

                                            <div className="text-xs text-slate-500 border-t border-slate-300 pt-3">
                                                <p>This is a preview. Full report includes detailed charts, SHAP analysis, and guideline citations.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
