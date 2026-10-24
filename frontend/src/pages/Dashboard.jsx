import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, Users, Bell, LogOut, Search, Filter,
  ChevronRight, Clock, AlertTriangle, Zap
} from 'lucide-react';
import { mockPatients } from '../data/mockClinicalData';
import { RiskBadge } from '../components/shared/Badge';
import Disclaimer from '../components/shared/Disclaimer';
import NotificationCenter from '../components/NotificationCenter';
import AdvancedSearch from '../components/AdvancedSearch';
import { useNotifications, useMockNotifications } from '../hooks/useNotifications';
import DemoPanel from '../components/shared/DemoPanel';

import api from '../services/api';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterWard, setFilterWard] = useState('ALL');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDemo, setShowDemo] = useState(false);

  React.useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await api.get('/patients/');
        setPatients(response.data);
      } catch (error) {
        console.error('Failed to fetch patients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredPatients = patients.filter(patient => {
    const name = patient.name || '';
    const mrn = patient.mrn || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || patient.risk_level === filterRisk || patient.riskLevel === filterRisk;
    const matchesWard = filterWard === 'ALL' || patient.ward === filterWard;
    return matchesSearch && matchesRisk && matchesWard;
  });

  const wards = ['ALL', ...new Set(patients.map(p => p.ward).filter(Boolean))];
  const riskLevels = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const stats = {
    total: patients.length,
    critical: patients.filter(p => p.risk_level === 'CRITICAL' || p.riskLevel === 'CRITICAL').length,
    high: patients.filter(p => p.risk_level === 'HIGH' || p.riskLevel === 'HIGH').length,
    pending: 5
  };

  const getTimeSince = (timestamp) => {
    if (!timestamp) return 'Never';
    const time = new Date(timestamp);
    if (isNaN(time.getTime())) return 'Never';
    const minutes = Math.floor((Date.now() - time) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <div
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-blue-600 mb-8 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            <span className="text-xl font-bold text-slate-800 Outfit">Clinical Cortex</span>
          </div>
          <nav className="space-y-2">
            <SidebarItem icon={Users} label="Patient Directory" active={window.location.pathname === '/patients'} onClick={() => navigate('/patients')} />
            <SidebarItem icon={Bell} label="Alert Center" active={window.location.pathname === '/alerts'} onClick={() => navigate('/alerts')} />
            <SidebarItem icon={Activity} label="Clinical Reports" onClick={() => navigate('/reports')} />
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-slate-100 space-y-3">
          {/* Demo Mode Trigger */}
          <button
            onClick={() => setShowDemo(true)}
            className="flex items-center space-x-3 w-full px-4 py-2.5 bg-gradient-to-r from-violet-500 to-blue-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium text-sm shadow-md shadow-violet-200"
          >
            <Zap size={18} />
            <span>Demo Mode</span>
            <span className="ml-auto text-xs bg-white/20 px-1.5 py-0.5 rounded">WA</span>
          </button>
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
        <Disclaimer className="mb-6" />

        <header className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Patient Monitoring</h1>
              <p className="text-slate-500 mt-1">Real-time risk assessment and clinical decision support</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Dr. {user?.username || 'Physician'}</p>
                <p className="text-xs text-slate-500">Clinical Staff</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user?.username?.[0]?.toUpperCase() || 'D'}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-xl shadow-sm border border-slate-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Total Patients</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Users className="text-blue-500" size={24} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-5 rounded-xl shadow-sm border border-red-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Critical Risk</p>
                  <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
                </div>
                <AlertTriangle className="text-red-500" size={24} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-5 rounded-xl shadow-sm border border-orange-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">High Risk</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
                </div>
                <AlertTriangle className="text-orange-500" size={24} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-5 rounded-xl shadow-sm border border-yellow-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Pending Alerts</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="text-yellow-500" size={24} />
              </div>
            </motion.div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or MRN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {riskLevels.map(level => (
                  <option key={level} value={level}>{level === 'ALL' ? 'All Risks' : level}</option>
                ))}
              </select>

              <select
                value={filterWard}
                onChange={(e) => setFilterWard(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {wards.map(ward => (
                  <option key={ward} value={ward}>{ward === 'ALL' ? 'All Wards' : ward}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Patient Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Risk Types</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Update</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatients.map((patient, index) => (
                  <motion.tr
                    key={patient.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/patient/${patient.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{patient.name}</p>
                        <p className="text-sm text-slate-500">{patient.mrn}</p>
                        <p className="text-xs text-slate-400">{patient.diagnosis}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{patient.ward}</p>
                        <p className="text-sm text-slate-500">Bed {patient.bed}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge level={patient.risk_level || patient.riskLevel} showDot />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(patient.risk_types || patient.riskTypes || []).map(type => (
                          <span key={type} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200">
                            {type}
                          </span>
                        ))}
                        {(patient.risk_types || patient.riskTypes || []).length === 0 && (
                          <span className="text-sm text-slate-400">No active risks</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-sm text-slate-600">{getTimeSince(patient.last_vitals_update || patient.lastVitalsUpdate)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm">
                        <span>View Details</span>
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPatients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">No patients found matching your filters.</p>
            </div>
          )}
        </div>
      </main>

      {/* Demo Mode Panel */}
      {showDemo && <DemoPanel onClose={() => setShowDemo(false)} />}
    </div>
  );
}

export default Dashboard;
