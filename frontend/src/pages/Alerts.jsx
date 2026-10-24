import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Bell, CheckCircle, X, AlertTriangle,
  Clock, Mail, MessageSquare, TrendingUp, User
} from 'lucide-react';
import { mockAlerts } from '../data/mockClinicalData';
import { RiskBadge, Badge } from '../components/shared/Badge';
import Disclaimer from '../components/shared/Disclaimer';

const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(mockAlerts);
  const [filter, setFilter] = useState('ALL');

  const handleAcknowledge = (alertId) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, status: 'acknowledged', acknowledged: true, acknowledgedBy: 'Dr. Current User' }
        : alert
    ));
  };

  const handleMarkFeedback = (alertId, feedback) => {
    setAlerts(alerts.map(alert =>
      alert.id === alertId
        ? { ...alert, feedback, status: 'resolved' }
        : alert
    ));
  };

  const filteredAlerts = filter === 'ALL'
    ? alerts
    : alerts.filter(a => a.status === filter.toLowerCase());

  const getTimeSince = (timestamp) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

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
                <Bell className="text-blue-600" size={24} />
                <h1 className="text-2xl font-bold text-slate-900">Alert Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {['ALL', 'PENDING', 'ACKNOWLEDGED', 'RESOLVED'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Disclaimer className="mb-6" />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Alerts</p>
                <p className="text-2xl font-bold text-slate-900">{alerts.length}</p>
              </div>
              <Bell className="text-blue-500" size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-yellow-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {alerts.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 mb-1">Acknowledged</p>
                <p className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.status === 'acknowledged').length}
                </p>
              </div>
              <CheckCircle className="text-blue-500" size={24} />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-green-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500 mb-1">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {alerts.filter(a => a.status === 'resolved').length}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        {/* Alert List */}
        <div className="space-y-4">
          {filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Risk level icon — matches dashboard badge colours */}
                  <div className={`p-3 rounded-xl ${
                    alert.riskLevel === 'CRITICAL' ? 'bg-red-100' :
                    alert.riskLevel === 'HIGH'     ? 'bg-orange-100' :
                    alert.riskLevel === 'MEDIUM'   ? 'bg-amber-100' :
                                                     'bg-green-100'
                  }`}>
                    <AlertTriangle className={`${
                      alert.riskLevel === 'CRITICAL' ? 'text-red-600' :
                      alert.riskLevel === 'HIGH'     ? 'text-orange-600' :
                      alert.riskLevel === 'MEDIUM'   ? 'text-amber-600' :
                                                       'text-green-600'
                    }`} size={24} />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{alert.riskType}</h3>
                      <RiskBadge level={alert.riskLevel} showDot />
                      <Badge variant={alert.status}>{alert.status.toUpperCase()}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Patient:</span>
                        <span className="ml-2 font-medium text-slate-900">{alert.patientName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">MRN:</span>
                        <span className="ml-2 font-medium text-slate-900">{alert.mrn}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Probability:</span>
                        <span className="ml-2 font-medium text-slate-900">{(alert.probability * 100).toFixed(0)}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Time:</span>
                        <span className="ml-2 font-medium text-slate-900">{getTimeSince(alert.timestamp)}</span>
                      </div>
                    </div>

                    {/* Delivery Status */}
                    <div className="flex items-center space-x-4 text-xs">
                      <span className="text-slate-500">Delivered via:</span>
                      {alert.deliveryStatus.dashboard && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">Dashboard</span>
                      )}
                      {alert.deliveryStatus.sms && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded flex items-center space-x-1">
                          <MessageSquare size={12} />
                          <span>SMS</span>
                        </span>
                      )}
                      {alert.deliveryStatus.email && (
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded flex items-center space-x-1">
                          <Mail size={12} />
                          <span>Email</span>
                        </span>
                      )}
                      {alert.escalated && (
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded flex items-center space-x-1">
                          <TrendingUp size={12} />
                          <span>Escalated</span>
                        </span>
                      )}
                    </div>

                    {alert.acknowledged && (
                      <div className="mt-3 text-sm text-slate-600 flex items-center space-x-2">
                        <User size={14} />
                        <span>Acknowledged by {alert.acknowledgedBy}</span>
                        {alert.acknowledgedAt && (
                          <span className="text-slate-400">• {getTimeSince(alert.acknowledgedAt)}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/patient/${alert.patientId}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Patient
                </button>
              </div>

              {/* Actions */}
              {alert.status === 'pending' && (
                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircle size={16} />
                    <span>Acknowledge Alert</span>
                  </button>
                </div>
              )}

              {alert.status === 'acknowledged' && !alert.feedback && (
                <div className="flex items-center space-x-3 pt-4 border-t border-slate-200">
                  <span className="text-sm text-slate-600">Alert accurate?</span>
                  <button
                    onClick={() => handleMarkFeedback(alert.id, 'true')}
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm font-semibold"
                  >
                    <CheckCircle size={14} />
                    <span>True</span>
                  </button>
                  <button
                    onClick={() => handleMarkFeedback(alert.id, 'false')}
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
                  >
                    <X size={14} />
                    <span>False</span>
                  </button>
                </div>
              )}

              {alert.feedback && (
                <div className="pt-4 border-t border-slate-200">
                  <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    alert.feedback === 'true'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {alert.feedback === 'true' ? <CheckCircle size={14} /> : <X size={14} />}
                    <span>Marked as {alert.feedback === 'true' ? 'True' : 'False'}</span>
                  </span>
                </div>
              )}
            </motion.div>
          ))}

          {filteredAlerts.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Bell className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500">No alerts found matching your filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
