import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const PredictiveInsights = ({ patientId }) => {
    const [selectedScenario, setSelectedScenario] = useState('current');

    // Mock prediction data
    const baselinePrediction = [
        { hour: 0, risk: 65, lower: 60, upper: 70 },
        { hour: 6, risk: 68, lower: 62, upper: 74 },
        { hour: 12, risk: 72, lower: 65, upper: 79 },
        { hour: 18, risk: 75, lower: 68, upper: 82 },
        { hour: 24, risk: 78, lower: 70, upper: 86 }
    ];

    const scenarios = {
        current: {
            name: 'Current Trajectory',
            description: 'Based on current vitals and trends',
            data: baselinePrediction,
            color: '#3b82f6'
        },
        intervention_fluids: {
            name: 'With IV Fluids',
            description: 'If aggressive fluid resuscitation is started',
            data: [
                { hour: 0, risk: 65, lower: 60, upper: 70 },
                { hour: 6, risk: 62, lower: 57, upper: 67 },
                { hour: 12, risk: 58, lower: 52, upper: 64 },
                { hour: 18, risk: 55, lower: 48, upper: 62 },
                { hour: 24, risk: 52, lower: 45, upper: 59 }
            ],
            color: '#10b981'
        },
        intervention_antibiotics: {
            name: 'With Antibiotics',
            description: 'If broad-spectrum antibiotics are administered',
            data: [
                { hour: 0, risk: 65, lower: 60, upper: 70 },
                { hour: 6, risk: 60, lower: 55, upper: 65 },
                { hour: 12, risk: 56, lower: 50, upper: 62 },
                { hour: 18, risk: 53, lower: 46, upper: 60 },
                { hour: 24, risk: 50, lower: 42, upper: 58 }
            ],
            color: '#10b981'
        },
        no_intervention: {
            name: 'No Intervention',
            description: 'If current condition continues without treatment',
            data: [
                { hour: 0, risk: 65, lower: 60, upper: 70 },
                { hour: 6, risk: 72, lower: 67, upper: 77 },
                { hour: 12, risk: 80, lower: 74, upper: 86 },
                { hour: 18, risk: 87, lower: 80, upper: 94 },
                { hour: 24, risk: 92, lower: 85, upper: 98 }
            ],
            color: '#ef4444'
        }
    };

    const currentScenario = scenarios[selectedScenario];

    const getRiskTrend = () => {
        const start = currentScenario.data[0].risk;
        const end = currentScenario.data[currentScenario.data.length - 1].risk;
        const change = end - start;
        return {
            direction: change > 0 ? 'increasing' : 'decreasing',
            magnitude: Math.abs(change),
            isGood: change < 0
        };
    };

    const trend = getRiskTrend();

    return (
        <div className="space-y-6">
            {/* Scenario Selector */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                    <Activity className="text-blue-600" size={20} />
                    <span>Predictive Risk Trajectory</span>
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                    Explore "what-if" scenarios to understand potential risk trajectories over the next 24 hours
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(scenarios).map(([key, scenario]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedScenario(key)}
                            className={`p-4 rounded-xl text-left transition-all ${selectedScenario === key
                                    ? 'bg-white shadow-md border-2 border-blue-500'
                                    : 'bg-white/50 border border-slate-200 hover:bg-white hover:shadow-sm'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold text-slate-900">{scenario.name}</h4>
                                {selectedScenario === key && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                )}
                            </div>
                            <p className="text-xs text-slate-600">{scenario.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Prediction Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h4 className="text-lg font-bold text-slate-900">{currentScenario.name}</h4>
                        <p className="text-sm text-slate-500 mt-1">{currentScenario.description}</p>
                    </div>
                    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${trend.isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {trend.isGood ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                        <span className="text-sm font-semibold">
                            {trend.direction === 'increasing' ? '+' : '-'}{trend.magnitude.toFixed(0)}%
                        </span>
                    </div>
                </div>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={currentScenario.data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="hour"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8' }}
                                label={{ value: 'Hours from Now', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8' }}
                                label={{ value: 'Risk Score (%)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value) => [`${value.toFixed(1)}%`, 'Risk']}
                            />

                            {/* Risk zones */}
                            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Critical', position: 'right', fill: '#ef4444' }} />
                            <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'High', position: 'right', fill: '#f59e0b' }} />
                            <ReferenceLine y={40} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Moderate', position: 'right', fill: '#10b981' }} />

                            {/* Confidence interval */}
                            <Line
                                type="monotone"
                                dataKey="upper"
                                stroke={currentScenario.color}
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Upper Bound"
                            />
                            <Line
                                type="monotone"
                                dataKey="lower"
                                stroke={currentScenario.color}
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                                name="Lower Bound"
                            />

                            {/* Main prediction line */}
                            <Line
                                type="monotone"
                                dataKey="risk"
                                stroke={currentScenario.color}
                                strokeWidth={3}
                                dot={{ r: 6, fill: currentScenario.color }}
                                name="Predicted Risk"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Insights */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-blue-900">
                            <p className="font-medium mb-1">Prediction Insights</p>
                            <p>
                                {trend.isGood ? (
                                    <>Risk is projected to <strong>decrease by {trend.magnitude.toFixed(0)}%</strong> over the next 24 hours with this intervention.</>
                                ) : (
                                    <>Risk is projected to <strong>increase by {trend.magnitude.toFixed(0)}%</strong> over the next 24 hours without intervention.</>
                                )}
                            </p>
                            <p className="mt-2 text-xs text-blue-700">
                                Confidence intervals shown as dashed lines. Predictions based on historical patient data and current vitals.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h4 className="text-lg font-bold text-slate-900 mb-4">Scenario Comparison (24h Projection)</h4>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Scenario</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Current Risk</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">24h Risk</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Change</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Outcome</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {Object.entries(scenarios).map(([key, scenario]) => {
                                const start = scenario.data[0].risk;
                                const end = scenario.data[scenario.data.length - 1].risk;
                                const change = end - start;
                                const isGood = change < 0;

                                return (
                                    <tr key={key} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium text-slate-900">{scenario.name}</td>
                                        <td className="px-4 py-3 text-slate-700">{start}%</td>
                                        <td className="px-4 py-3 text-slate-700">{end}%</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center space-x-1 ${isGood ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {isGood ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                                                <span className="font-semibold">{change > 0 ? '+' : ''}{change.toFixed(0)}%</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isGood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {isGood ? 'Improving' : 'Worsening'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PredictiveInsights;
