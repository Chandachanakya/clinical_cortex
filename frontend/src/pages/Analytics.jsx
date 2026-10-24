import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Download, TrendingUp, TrendingDown, AlertTriangle,
    Activity, Users, Calendar, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Mock analytics data
const riskTrendData = [
    { date: '2024-01-28', sepsis: 12, aki: 8, respiratory: 5, shock: 3 },
    { date: '2024-01-29', sepsis: 15, aki: 10, respiratory: 7, shock: 4 },
    { date: '2024-01-30', sepsis: 11, aki: 9, respiratory: 6, shock: 5 },
    { date: '2024-01-31', sepsis: 18, aki: 12, respiratory: 8, shock: 6 },
    { date: '2024-02-01', sepsis: 14, aki: 11, respiratory: 9, shock: 4 },
    { date: '2024-02-02', sepsis: 16, aki: 13, respiratory: 7, shock: 5 }
];

const alertResponseData = [
    { time: '0-5min', count: 45 },
    { time: '5-10min', count: 32 },
    { time: '10-15min', count: 18 },
    { time: '15-30min', count: 12 },
    { time: '30min+', count: 5 }
];

const modelAccuracyData = [
    { week: 'Week 1', accuracy: 0.89, precision: 0.87, recall: 0.91 },
    { week: 'Week 2', accuracy: 0.91, precision: 0.89, recall: 0.92 },
    { week: 'Week 3', accuracy: 0.90, precision: 0.88, recall: 0.93 },
    { week: 'Week 4', accuracy: 0.92, precision: 0.90, recall: 0.94 }
];

const outcomesByRiskData = [
    { risk: 'Critical', improved: 12, stable: 8, deteriorated: 5 },
    { risk: 'High', improved: 28, stable: 15, deteriorated: 7 },
    { risk: 'Medium', improved: 45, stable: 32, deteriorated: 3 },
    { risk: 'Low', improved: 78, stable: 120, deteriorated: 2 }
];

const departmentStatsData = [
    { name: 'ICU', value: 45 },
    { name: 'Emergency', value: 32 },
    { name: 'Medical', value: 28 },
    { name: 'Surgical', value: 18 },
    { name: 'Cardiology', value: 12 }
];

const patientAssessmentData = [
    { metric: 'Vitals', value: 85 },
    { metric: 'Labs', value: 78 },
    { metric: 'History', value: 92 },
    { metric: 'Symptoms', value: 88 },
    { metric: 'Medications', value: 75 }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
    const navigate = useNavigate();
    const [dateRange, setDateRange] = useState('7days');

    const handleExportPDF = () => {
        alert('PDF export functionality (requires html2canvas + jspdf integration)');
    };

    const handleExportCSV = () => {
        // Simple CSV export
        const csv = riskTrendData.map(row =>
            `${row.date},${row.sepsis},${row.aki},${row.respiratory},${row.shock}`
        ).join('\n');
        const blob = new Blob([`Date,Sepsis,AKI,Respiratory,Shock\n${csv}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'risk-trends.csv';
        a.click();
    };

    const StatCard = ({ title, value, change, trend, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
                {change && (
                    <div className={`flex items-center space-x-1 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{change}</span>
                    </div>
                )}
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
        </div>
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
                                <span>Back to Dashboard</span>
                            </button>
                            <div className="h-6 w-px bg-slate-300" />
                            <div className="flex items-center space-x-3">
                                <BarChart3 className="text-blue-600" size={24} />
                                <h1 className="text-2xl font-bold text-slate-900">Analytics & Insights</h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="px-3 py-2 bg-slate-100 border-none rounded-lg text-sm"
                            >
                                <option value="7days">Last 7 days</option>
                                <option value="30days">Last 30 days</option>
                                <option value="90days">Last 90 days</option>
                            </select>
                            <button
                                onClick={handleExportCSV}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                <Download size={18} />
                                <span>Export PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <StatCard
                        title="Total Alerts"
                        value="112"
                        change="+8%"
                        trend="up"
                        icon={AlertTriangle}
                        color="bg-amber-500"
                    />
                    <StatCard
                        title="Avg Response Time"
                        value="8.5min"
                        change="-12%"
                        trend="down"
                        icon={Activity}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Active Patients"
                        value="1,248"
                        change="+5%"
                        trend="up"
                        icon={Users}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Model Accuracy"
                        value="92%"
                        change="+2%"
                        trend="up"
                        icon={TrendingUp}
                        color="bg-purple-500"
                    />
                </div>

                {/* Risk Trends */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Risk Alert Trends Over Time</h3>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={riskTrendData}>
                                <defs>
                                    <linearGradient id="colorSepsis" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAKI" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorResp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorShock" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="sepsis" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSepsis)" name="Sepsis" />
                                <Area type="monotone" dataKey="aki" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorAKI)" name="AKI" />
                                <Area type="monotone" dataKey="respiratory" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorResp)" name="Respiratory" />
                                <Area type="monotone" dataKey="shock" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorShock)" name="Shock" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Alert Response Times */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Alert Response Times</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={alertResponseData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Department Distribution */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Alerts by Department</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={departmentStatsData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {departmentStatsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Model Performance */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Model Performance Metrics</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={modelAccuracyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                    <YAxis domain={[0.8, 1.0]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} name="Accuracy" />
                                    <Line type="monotone" dataKey="precision" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Precision" />
                                    <Line type="monotone" dataKey="recall" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} name="Recall" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Patient Assessment Radar */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Multi-Dimensional Assessment</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={patientAssessmentData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748b' }} />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                                    <Radar name="Completeness %" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Outcomes by Risk Level */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Patient Outcomes by Risk Level</h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={outcomesByRiskData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="risk" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="improved" fill="#10b981" radius={[4, 4, 0, 0]} name="Improved" />
                                <Bar dataKey="stable" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Stable" />
                                <Bar dataKey="deteriorated" fill="#ef4444" radius={[4, 4, 0, 0]} name="Deteriorated" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
