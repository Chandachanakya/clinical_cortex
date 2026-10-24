import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, Shield, Server, Activity, LogOut,
    Settings, Search, Database, FileText, AlertTriangle,
    CheckCircle, Clock, TrendingUp, Eye, Plus, Edit, Trash2,
    Download, Upload, RefreshCw
} from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// Mock data
const systemHealthData = [
    { name: 'Mon', uptime: 99.9, latency: 245 },
    { name: 'Tue', uptime: 99.8, latency: 250 },
    { name: 'Wed', uptime: 100, latency: 238 },
    { name: 'Thu', uptime: 99.9, latency: 242 },
    { name: 'Fri', uptime: 99.7, latency: 255 },
    { name: 'Sat', uptime: 99.9, latency: 248 },
    { name: 'Sun', uptime: 100, latency: 240 },
];

const userActivityData = [
    { role: 'Doctors', count: 45, color: '#3b82f6' },
    { role: 'Nurses', count: 78, color: '#10b981' },
    { role: 'Patients', count: 1248, color: '#8b5cf6' },
    { role: 'Admins', count: 12, color: '#f59e0b' }
];

const mockUsers = [
    { id: 1, name: 'Dr. Aditi Rao', email: 'aditi.rao@hospital.com', role: 'doctor', status: 'active', lastLogin: '2024-02-02 09:30 AM' },
    { id: 2, name: 'Nurse Lakshmi Singh', email: 'lakshmi.singh@hospital.com', role: 'nurse', status: 'active', lastLogin: '2024-02-02 08:15 AM' },
    { id: 3, name: 'Dr. Vivek Mehra', email: 'vivek.mehra@hospital.com', role: 'doctor', status: 'active', lastLogin: '2024-02-01 04:45 PM' },
    { id: 4, name: 'Admin Sameer Khan', email: 'sameer.khan@hospital.com', role: 'admin', status: 'active', lastLogin: '2024-02-02 10:00 AM' },
    { id: 5, name: 'Dr. Neha Sharma', email: 'neha.sharma@hospital.com', role: 'doctor', status: 'inactive', lastLogin: '2024-01-28 02:30 PM' }
];

const mockGuidelines = [
    { id: 1, title: 'Surviving Sepsis Campaign 2021', category: 'Sepsis', version: '2.1', status: 'approved', uploadDate: '2024-01-15' },
    { id: 2, title: 'NICE Guideline NG51 - Sepsis', category: 'Sepsis', version: '1.3', status: 'approved', uploadDate: '2024-01-10' },
    { id: 3, title: 'KDIGO AKI Guidelines', category: 'AKI', version: '3.0', status: 'approved', uploadDate: '2024-01-20' },
    { id: 4, title: 'BTS Respiratory Failure Protocol', category: 'Respiratory', version: '1.5', status: 'pending', uploadDate: '2024-02-01' }
];

const mockAuditLogs = [
    { id: 1, user: 'Dr. Aditi Rao', action: 'Viewed patient record', resource: 'Patient MRN-2024-001', timestamp: '2024-02-02 10:30 AM', status: 'success' },
    { id: 2, user: 'Admin Sameer Khan', action: 'Updated user permissions', resource: 'User: lakshmi.singh@hospital.com', timestamp: '2024-02-02 10:15 AM', status: 'success' },
    { id: 3, user: 'System', action: 'Generated risk alert', resource: 'Patient MRN-2024-003', timestamp: '2024-02-02 10:05 AM', status: 'success' },
    { id: 4, user: 'Dr. Vivek Mehra', action: 'Downloaded report', resource: 'Report ID: 1234', timestamp: '2024-02-02 09:45 AM', status: 'success' },
    { id: 5, user: 'Nurse Lakshmi Singh', action: 'Updated vitals', resource: 'Patient MRN-2024-002', timestamp: '2024-02-02 09:30 AM', status: 'success' }
];

import api from '../services/api';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');

    // Real state
    const [stats, setStats] = useState({ total_users: 0, active_alerts: 0, system_health: 100, audit_events: 0, user_distribution: [] });
    const [users, setUsers] = useState([]);
    const [guidelines, setGuidelines] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add User Modal State
    const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', role: 'doctor', password: '' });
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [createSuccess, setCreateSuccess] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, guidelinesRes, auditRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/guidelines'),
                api.get('/admin/audit')
            ]);
            setStats(statsRes.data);
            setUsers(usersRes.data);
            setGuidelines(guidelinesRes.data);
            setAuditLogs(auditRes.data);
        } catch (error) {
            console.error('Failed to fetch admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);
        try {
            await api.post('/admin/users', newUser);
            setCreateSuccess(true);
            fetchData(); // Refresh list
            setTimeout(() => {
                setIsAddUserModalOpen(false);
                setNewUser({ username: '', email: '', role: 'doctor', password: '' });
                setCreateSuccess(false);
            }, 1500);
        } catch (error) {
            setFormError(error.response?.data?.detail || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            fetchData(); // Refresh list
        } catch (error) {
            alert('Failed to delete user');
        }
    };

    const TabButton = ({ label, value, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(value)}
            className={`flex items-center space-x-2 px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === value
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
        >
            {Icon && <Icon size={18} />}
            <span>{label}</span>
        </button>
    );

    const StatCard = ({ title, value, change, icon: Icon, color }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
                {change && (
                    <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {change}
                    </span>
                )}
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('overview')}>
                    <div className="bg-purple-600 p-1 rounded-lg">
                        <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain brightness-0 invert" />
                    </div>
                    <span className="text-xl font-bold text-slate-900 Outfit">CortexAdmin</span>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-purple-500 outline-none w-64"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold border border-purple-200">
                            A
                        </div>
                        <span className="font-medium text-slate-700 hidden sm:block">Admin</span>
                    </div>
                    <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex space-x-2 mb-6">
                    <TabButton label="Overview" value="overview" icon={Activity} />
                    <TabButton label="User Management" value="users" icon={Users} />
                    <TabButton label="Data Integrations" value="integrations" icon={Database} />
                    <TabButton label="Guidelines KB" value="guidelines" icon={FileText} />
                    <TabButton label="Audit Logs" value="audit" icon={Eye} />
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
                            <p className="text-slate-500 mt-1">Monitoring agents, user activity, and system health.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard
                                title="Total Users"
                                value={stats.total_users.toLocaleString()}
                                change="+12%"
                                icon={Users}
                                color="bg-purple-500"
                            />
                            <StatCard
                                title="System Health"
                                value={`${stats.system_health}%`}
                                change="Stable"
                                icon={Server}
                                color="bg-emerald-500"
                            />
                            <StatCard
                                title="Active Alerts"
                                value={stats.active_alerts}
                                change="-5"
                                icon={AlertTriangle}
                                color="bg-amber-500"
                            />
                            <StatCard
                                title="Audit Events"
                                value={`${(stats.audit_events / 1000).toFixed(1)}k`}
                                change="+18%"
                                icon={Activity}
                                color="bg-blue-500"
                            />
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* System Health Chart */}
                            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800">System Performance (7 Days)</h3>
                                    <select className="bg-slate-50 border-none rounded-lg text-sm px-3 py-1 text-slate-600 focus:ring-0">
                                        <option>Last 7 days</option>
                                        <option>Last 30 days</option>
                                    </select>
                                </div>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={systemHealthData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend />
                                            <Line yAxisId="left" type="monotone" dataKey="uptime" stroke="#10b981" strokeWidth={3} name="Uptime %" dot={false} />
                                            <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#8b5cf6" strokeWidth={3} name="Latency (ms)" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* User Distribution */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-6">User Distribution</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.user_distribution}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="count"
                                            >
                                                {stats.user_distribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.role === 'admin' ? '#f59e0b' : entry.role === 'doctor' ? '#3b82f6' : '#10b981'} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Model Health */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">ML Model Health</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Model Uptime</p>
                                    <p className="text-2xl font-bold text-slate-900">99.8%</p>
                                    <p className="text-xs text-green-600 mt-1">Excellent</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Avg Latency</p>
                                    <p className="text-2xl font-bold text-slate-900">245ms</p>
                                    <p className="text-xs text-green-600 mt-1">Within target</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Requests Today</p>
                                    <p className="text-2xl font-bold text-slate-900">8,432</p>
                                    <p className="text-xs text-blue-600 mt-1">+12% vs yesterday</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <p className="text-sm text-slate-500 mb-1">Failure Rate</p>
                                    <p className="text-2xl font-bold text-slate-900">0.2%</p>
                                    <p className="text-xs text-green-600 mt-1">Below threshold</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* User Management Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
                                <p className="text-slate-500 mt-1">Manage user accounts and permissions (RBAC)</p>
                            </div>
                            <button
                                onClick={() => setIsAddUserModalOpen(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Plus size={18} />
                                <span>Add User</span>
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Login</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {users.map((user, index) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{user.username}</p>
                                                        <p className="text-sm text-slate-500">{user.email}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {user.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                                        }`}>
                                                        {user.status.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-600">{new Date(user.created_at).toLocaleDateString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Integrations Tab */}
                {activeTab === 'integrations' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Data Integrations</h2>
                            <p className="text-slate-500 mt-1">Monitor HL7/FHIR connections and data pipeline status</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* HL7/FHIR Status */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">HL7/FHIR Connection</h3>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
                                        <CheckCircle size={14} />
                                        <span>Connected</span>
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Endpoint:</span>
                                        <span className="font-medium text-slate-900">fhir.hospital.local:8080</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Last Sync:</span>
                                        <span className="font-medium text-slate-900">2 minutes ago</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Records Synced:</span>
                                        <span className="font-medium text-slate-900">1,248 patients</span>
                                    </div>
                                </div>
                                <button className="w-full mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2">
                                    <RefreshCw size={16} />
                                    <span>Sync Now</span>
                                </button>
                            </div>

                            {/* Lab Integration */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">Laboratory System (LIS)</h3>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center space-x-1">
                                        <CheckCircle size={14} />
                                        <span>Active</span>
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Connection:</span>
                                        <span className="font-medium text-slate-900">lis.hospital.local</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Last Result:</span>
                                        <span className="font-medium text-slate-900">5 minutes ago</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Pending Results:</span>
                                        <span className="font-medium text-slate-900">12 tests</span>
                                    </div>
                                </div>
                                <button className="w-full mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2">
                                    <Settings size={16} />
                                    <span>Configure</span>
                                </button>
                            </div>
                        </div>

                        {/* Data Freshness */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">Data Freshness Monitoring</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-green-900">Vitals Data</span>
                                        <CheckCircle className="text-green-600" size={20} />
                                    </div>
                                    <p className="text-2xl font-bold text-green-900">95%</p>
                                    <p className="text-xs text-green-700 mt-1">Fresh within 15 minutes</p>
                                </div>
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-amber-900">Lab Results</span>
                                        <AlertTriangle className="text-amber-600" size={20} />
                                    </div>
                                    <p className="text-2xl font-bold text-amber-900">78%</p>
                                    <p className="text-xs text-amber-700 mt-1">Fresh within 6 hours</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-900">EHR Data</span>
                                        <CheckCircle className="text-blue-600" size={20} />
                                    </div>
                                    <p className="text-2xl font-bold text-blue-900">88%</p>
                                    <p className="text-xs text-blue-700 mt-1">Synced within 1 hour</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Guidelines KB Tab */}
                {activeTab === 'guidelines' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Clinical Guidelines Knowledge Base</h2>
                                <p className="text-slate-500 mt-1">Manage approved clinical guidelines for RAG system</p>
                            </div>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                <Upload size={18} />
                                <span>Upload Guideline</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {guidelines.map((guideline, index) => (
                                <motion.div
                                    key={guideline.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="p-3 bg-purple-50 rounded-xl">
                                                <FileText className="text-purple-600" size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-900 mb-1">{guideline.title}</h3>
                                                <div className="flex items-center space-x-4 text-sm text-slate-500 mb-2">
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                                        {guideline.source}
                                                    </span>
                                                    <span>Version {guideline.version}</span>
                                                    <span>Published: {new Date(guideline.publication_date).toLocaleDateString()}</span>
                                                </div>
                                                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${guideline.status === 'active'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {guideline.status === 'active' ? <CheckCircle size={14} /> : <Clock size={14} />}
                                                    <span>{guideline.status.toUpperCase()}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Download size={18} />
                                            </button>
                                            <button className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                                                <Edit size={18} />
                                            </button>
                                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Audit Logs Tab */}
                {activeTab === 'audit' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Audit & Compliance Logs</h2>
                                <p className="text-slate-500 mt-1">Complete system activity and access logs</p>
                            </div>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                                <Download size={18} />
                                <span>Export Logs</span>
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Resource</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {auditLogs.map((log, index) => (
                                            <motion.tr
                                                key={log.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-slate-50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-slate-900">{log.agent_name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-700">{log.event_type}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-600">{log.details}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                                                        <Clock size={14} />
                                                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        SUCCESS
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                            <div className="flex items-start space-x-3">
                                <Eye className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                                <div className="text-sm text-blue-900">
                                    <p className="font-medium mb-1">Compliance Notice</p>
                                    <p>All system activities are logged for audit and compliance purposes. Logs are retained for 7 years as per HIPAA requirements.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            {/* Add User Modal */}
            {isAddUserModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-purple-50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
                                <p className="text-xs text-slate-500 mt-0.5">New user will be able to log in immediately</p>
                            </div>
                            <button
                                onClick={() => { setIsAddUserModalOpen(false); setFormError(''); setCreateSuccess(false); }}
                                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg hover:bg-white"
                            >
                                ✕
                            </button>
                        </div>

                        {createSuccess ? (
                            <div className="p-12 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="text-green-600" size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-1">User Created!</h4>
                                <p className="text-slate-500 text-sm">The new user account is ready and can log in now.</p>
                            </div>
                        ) : (
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            {formError && (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-start space-x-2">
                                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{formError}</span>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. dr_smith"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newUser.username}
                                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="e.g. doctor@hospital.com"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Password <span className="text-red-500">*</span></label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="Min 6 characters"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="doctor">🩺 Doctor</option>
                                    <option value="nurse">💊 Nurse</option>
                                    <option value="admin">🔐 Administrator</option>
                                    <option value="patient">👤 Patient</option>
                                </select>
                            </div>
                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsAddUserModalOpen(false); setFormError(''); }}
                                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-md shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {submitting ? (
                                        <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /><span>Creating...</span></>
                                    ) : (
                                        <><Plus size={16} /><span>Create User</span></>
                                    )}
                                </button>
                            </div>
                        </form>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
