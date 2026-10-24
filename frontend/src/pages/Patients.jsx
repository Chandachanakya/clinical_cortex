import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Users, Search, Filter, ChevronRight,
  MoreHorizontal, ArrowUpDown, UserPlus, Grid, List as ListIcon,
  Heart, Wind, Droplet, Thermometer, AlertCircle
} from 'lucide-react';
import { RiskBadge } from '../components/shared/Badge';
import Disclaimer from '../components/shared/Disclaimer';

import api from '../services/api';

const Patients = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.mrn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'ALL' || patient.riskLevel === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const stats = {
    total: patients.length,
    critical: patients.filter(p => p.risk_level === 'CRITICAL').length,
    high: patients.filter(p => p.risk_level === 'HIGH').length,
    active: patients.filter(p => p.status === 'active').length
  };

  const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-opacity-10 ${color.replace('text', 'bg')}`}>
        <Icon size={24} className={color} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <Disclaimer className="mb-8" />

      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Patient Directory</h1>
          <p className="text-slate-500 mt-1">Cross-ward patient monitoring and risk assessment</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors">
            <ArrowUpDown size={18} />
            <span>Sort</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
            <UserPlus size={18} />
            <span>Admit Patient</span>
          </button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Patients" value={stats.total} icon={Users} color="text-slate-700" />
        <StatCard label="Critical Risk" value={stats.critical} icon={AlertCircle} color="text-red-600" />
        <StatCard label="High Risk" value={stats.high} icon={Activity} color="text-orange-600" />
        <StatCard label="Currently Active" value={stats.active} icon={Activity} color="text-blue-600" />
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search by name, MRN, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ListIcon size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Grid size={18} />
            </button>
          </div>
          <select
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Patient Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Patient</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Ward / Bed</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Risk Level</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">qSOFA / NEWS2</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/patient/${patient.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-white transition-colors">
                          {patient.name[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{patient.name}</p>
                          <p className="text-xs text-slate-500">{patient.mrn} • {patient.age}y {patient.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">{patient.ward}</p>
                      <p className="text-xs text-slate-500">Bed {patient.bed}</p>
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge level={patient.riskLevel} showDot />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">qSOFA</p>
                          <p className={`text-sm font-bold ${patient.qSofaScore >= 2 ? 'text-red-600' : 'text-slate-700'}`}>{patient.qSofaScore}</p>
                        </div>
                        <div className="w-px h-6 bg-slate-200" />
                        <div className="text-center">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">NEWS2</p>
                          <p className={`text-sm font-bold ${patient.news2Score >= 7 ? 'text-red-600' : (patient.news2Score >= 5 ? 'text-orange-500' : 'text-slate-700')}`}>{patient.news2Score}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => navigate(`/patient/${patient.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {patient.name[0]}
                  </div>
                  <RiskBadge level={patient.riskLevel} />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{patient.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{patient.mrn} • {patient.ward}</p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">qSOFA</p>
                    <p className={`text-lg font-bold ${patient.qSofaScore >= 2 ? 'text-red-600' : 'text-slate-700'}`}>{patient.qSofaScore}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">NEWS2</p>
                    <p className={`text-lg font-bold ${patient.news2Score >= 7 ? 'text-red-600' : (patient.news2Score >= 5 ? 'text-orange-500' : 'text-slate-700')}`}>{patient.news2Score}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex space-x-2">
                    <Heart size={14} className="text-red-400" />
                    <Wind size={14} className="text-cyan-400" />
                    <Droplet size={14} className="text-blue-400" />
                  </div>
                  <span className="text-xs text-slate-400 flex items-center">
                    Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {filteredPatients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Search size={48} className="mb-4 opacity-20" />
          <p className="text-lg">No patients found matching your criteria</p>
          <button
            onClick={() => { setSearchTerm(''); setFilterRisk('ALL'); }}
            className="mt-2 text-blue-600 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Patients;
