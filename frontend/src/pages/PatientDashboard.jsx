import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Activity, Heart, Thermometer, Wind, Calendar,
    LogOut, User, FileText, Bell, ChevronRight, Shield,
    Eye, Download, CheckCircle, X, Clock, AlertCircle
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

// Mock patient data for current user
const mockPatientData = {
    name: 'Arjun Nair',
    mrn: 'MRN-2024-P001',
    age: 45,
    status: 'stable',
    lastCheckup: '2024-02-01',
    nextAppointment: '2024-02-15',
    careTeam: ['Dr. Aditi Rao', 'Nurse Lakshmi Singh']
};

const vitalsTrendData = [
    { day: 'Mon', bp: 120, hr: 72 },
    { day: 'Tue', bp: 118, hr: 74 },
    { day: 'Wed', bp: 122, hr: 71 },
    { day: 'Thu', bp: 121, hr: 72 },
    { day: 'Fri', bp: 119, hr: 75 },
    { day: 'Sat', bp: 124, hr: 78 },
    { day: 'Sun', bp: 120, hr: 73 },
];

const mockReports = [
    {
        id: 1,
        title: 'Health Assessment Report',
        date: '2024-02-01',
        doctor: 'Dr. Aditi Rao',
        type: 'Routine Checkup',
        status: 'available',
        summary: 'Your recent health assessment shows stable vital signs. Blood pressure and heart rate are within normal ranges.'
    },
    {
        id: 2,
        title: 'Lab Results - Blood Work',
        date: '2024-01-28',
        doctor: 'Dr. Aditi Rao',
        type: 'Laboratory',
        status: 'available',
        summary: 'All blood test results are within normal limits. No immediate concerns identified.'
    },
    {
        id: 3,
        title: 'Cardiology Consultation',
        date: '2024-01-20',
        doctor: 'Dr. Vivek Mehra',
        type: 'Specialist',
        status: 'available',
        summary: 'Cardiac function is normal. Continue current lifestyle and medication regimen.'
    }
];

const mockAccessLog = [
    { id: 1, accessor: 'Dr. Aditi Rao', role: 'Cardiologist', action: 'Viewed medical records', timestamp: '2024-02-01 10:30 AM' },
    { id: 2, accessor: 'Nurse Lakshmi Singh', role: 'Registered Nurse', action: 'Updated vitals', timestamp: '2024-02-01 09:15 AM' },
    { id: 3, accessor: 'Dr. Vivek Mehra', role: 'Physician', action: 'Reviewed lab results', timestamp: '2024-01-28 02:45 PM' },
    { id: 4, accessor: 'Lab Technician', role: 'Laboratory', action: 'Uploaded test results', timestamp: '2024-01-28 11:20 AM' }
];

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [consentSettings, setConsentSettings] = useState({
        shareWithSpecialists: true,
        shareForResearch: false,
        allowDataAnalytics: true,
        emailNotifications: true,
        smsNotifications: false
    });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const toggleConsent = (key) => {
        setConsentSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'stable': return 'bg-green-100 text-green-800 border-green-200';
            case 'observation': return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'high-risk': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
        <div
            onClick={onClick}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </div>
    );

    const TabButton = ({ label, value, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(value)}
            className={`flex items-center space-x-2 px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === value
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
        >
            {Icon && <Icon size={18} />}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
                <div className="p-6">
                    <div className="flex items-center space-x-2 text-emerald-600 mb-8 cursor-pointer" onClick={() => setActiveTab('overview')}>
                        <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
                        <span className="text-xl font-bold text-slate-800 Outfit">MyHealth</span>
                    </div>
                    <nav className="space-y-2">
                        <SidebarItem icon={Activity} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                        <SidebarItem icon={FileText} label="Health Reports" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                        <SidebarItem icon={Bell} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                        <SidebarItem icon={Shield} label="Privacy & Consent" active={activeTab === 'consent'} onClick={() => setActiveTab('consent')} />
                        <SidebarItem icon={Eye} label="Access Log" active={activeTab === 'access'} onClick={() => setActiveTab('access')} />
                    </nav>
                </div>
                <div className="mt-auto p-6 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 text-slate-500 hover:text-red-500 transition-colors w-full"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-8 overflow-y-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {mockPatientData.name}</h1>
                        <p className="text-slate-500">Here's your health overview for today.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                            {mockPatientData.name[0]}
                        </div>
                    </div>
                </header>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 mb-2">Your Health Status</h2>
                                    <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
                                </div>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(mockPatientData.status)}`}>
                                    {mockPatientData.status.toUpperCase()}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Last Checkup</p>
                                    <p className="text-lg font-semibold text-slate-900">{mockPatientData.lastCheckup}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Next Appointment</p>
                                    <p className="text-lg font-semibold text-slate-900">{mockPatientData.nextAppointment}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Care Team</p>
                                    <p className="text-lg font-semibold text-slate-900">{mockPatientData.careTeam.length} members</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Vitals Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-red-50 rounded-lg text-red-500">
                                        <Heart size={24} />
                                    </div>
                                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">Normal</span>
                                </div>
                                <h3 className="text-slate-500 text-sm font-medium">Heart Rate</h3>
                                <div className="flex items-baseline space-x-2 mt-2">
                                    <span className="text-3xl font-bold text-slate-900">72</span>
                                    <span className="text-sm text-slate-500">bpm</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Your heart rate is healthy</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                                        <Activity size={24} />
                                    </div>
                                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">Normal</span>
                                </div>
                                <h3 className="text-slate-500 text-sm font-medium">Blood Pressure</h3>
                                <div className="flex items-baseline space-x-2 mt-2">
                                    <span className="text-3xl font-bold text-slate-900">120/80</span>
                                    <span className="text-sm text-slate-500">mmHg</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Within healthy range</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-sky-50 rounded-lg text-sky-500">
                                        <Wind size={24} />
                                    </div>
                                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">Normal</span>
                                </div>
                                <h3 className="text-slate-500 text-sm font-medium">Oxygen Level</h3>
                                <div className="flex items-baseline space-x-2 mt-2">
                                    <span className="text-3xl font-bold text-slate-900">98</span>
                                    <span className="text-sm text-slate-500">%</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Excellent oxygen saturation</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
                                        <Thermometer size={24} />
                                    </div>
                                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">Normal</span>
                                </div>
                                <h3 className="text-slate-500 text-sm font-medium">Temperature</h3>
                                <div className="flex items-baseline space-x-2 mt-2">
                                    <span className="text-3xl font-bold text-slate-900">36.6</span>
                                    <span className="text-sm text-slate-500">°C</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Body temperature normal</p>
                            </motion.div>
                        </div>

                        {/* Health Trends Chart */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
                        >
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Your Health Trends (Last 7 Days)</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={vitalsTrendData}>
                                        <defs>
                                            <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="bp" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorBp)" name="Blood Pressure" />
                                        <Area type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" name="Heart Rate" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Your Health Reports</h2>
                            <p className="text-sm text-slate-500">{mockReports.length} reports available</p>
                        </div>

                        {mockReports.map((report, index) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className="p-3 bg-emerald-50 rounded-xl">
                                            <FileText className="text-emerald-600" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-slate-900 mb-1">{report.title}</h3>
                                            <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                                                <span className="flex items-center space-x-1">
                                                    <Calendar size={14} />
                                                    <span>{report.date}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <User size={14} />
                                                    <span>{report.doctor}</span>
                                                </span>
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                                    {report.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed">{report.summary}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col space-y-2 ml-4">
                                        <button className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                                            <Eye size={16} />
                                            <span>View</span>
                                        </button>
                                        <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium">
                                            <Download size={16} />
                                            <span>Download</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Notifications & Reminders</h2>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 border border-blue-200 p-6 rounded-2xl"
                        >
                            <div className="flex items-start space-x-3">
                                <Bell className="text-blue-600 flex-shrink-0 mt-1" size={24} />
                                <div>
                                    <h3 className="font-semibold text-blue-900 mb-1">Upcoming Appointment</h3>
                                    <p className="text-sm text-blue-800">You have an appointment with Dr. Aditi Rao on {mockPatientData.nextAppointment} at 10:00 AM</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-green-50 border border-green-200 p-6 rounded-2xl"
                        >
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={24} />
                                <div>
                                    <h3 className="font-semibold text-green-900 mb-1">New Report Available</h3>
                                    <p className="text-sm text-green-800">Your recent health assessment report is now available to view</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-amber-50 border border-amber-200 p-6 rounded-2xl"
                        >
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="text-amber-600 flex-shrink-0 mt-1" size={24} />
                                <div>
                                    <h3 className="font-semibold text-amber-900 mb-1">Medication Reminder</h3>
                                    <p className="text-sm text-amber-800">Remember to take your prescribed medication as directed by your doctor</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {activeTab === 'consent' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Privacy & Consent Management</h2>
                            <p className="text-sm text-slate-500">Control how your health information is shared and used</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-4">Data Sharing Preferences</h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'shareWithSpecialists', label: 'Share with Specialist Doctors', description: 'Allow your care team to share records with specialists for consultations' },
                                    { key: 'shareForResearch', label: 'Contribute to Medical Research', description: 'Allow anonymized data to be used for medical research (optional)' },
                                    { key: 'allowDataAnalytics', label: 'Health Analytics', description: 'Enable analysis of your health trends for better care recommendations' }
                                ].map((item) => (
                                    <div key={item.key} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-slate-900 mb-1">{item.label}</h4>
                                            <p className="text-sm text-slate-600">{item.description}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleConsent(item.key)}
                                            className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${consentSettings[item.key] ? 'bg-emerald-600' : 'bg-slate-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${consentSettings[item.key] ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-semibold text-slate-900 mb-4">Notification Preferences</h3>
                            <div className="space-y-4">
                                {[
                                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates and reminders via email' },
                                    { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive urgent alerts via text message' }
                                ].map((item) => (
                                    <div key={item.key} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-slate-900 mb-1">{item.label}</h4>
                                            <p className="text-sm text-slate-600">{item.description}</p>
                                        </div>
                                        <button
                                            onClick={() => toggleConsent(item.key)}
                                            className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${consentSettings[item.key] ? 'bg-emerald-600' : 'bg-slate-300'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${consentSettings[item.key] ? 'translate-x-6' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                            <div className="flex items-start space-x-3">
                                <Shield className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">Your Privacy is Protected</p>
                                    <p>All your health data is encrypted and stored securely. You can change these settings at any time.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'access' && (
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Access Log</h2>
                            <p className="text-sm text-slate-500">See who has accessed your medical records</p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {mockAccessLog.map((log, index) => (
                                            <motion.tr
                                                key={log.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-semibold text-sm">
                                                            {log.accessor[0]}
                                                        </div>
                                                        <span className="font-medium text-slate-900">{log.accessor}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-600">{log.role}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-900">{log.action}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                                                        <Clock size={14} />
                                                        <span>{log.timestamp}</span>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                            <p className="text-sm text-slate-600">
                                <strong>Note:</strong> This log shows all access to your medical records in the last 30 days.
                                If you notice any unauthorized access, please contact our privacy team immediately.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PatientDashboard;
