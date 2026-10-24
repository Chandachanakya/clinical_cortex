import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const RiskCard = ({ title, probability, confidence, timeWindow, trend = 'stable', className = '' }) => {
    const getRiskLevel = (prob) => {
        if (prob >= 0.7) return { level: 'CRITICAL', color: 'red' };
        if (prob >= 0.5) return { level: 'HIGH', color: 'orange' };
        if (prob >= 0.3) return { level: 'MEDIUM', color: 'amber' };
        return { level: 'LOW', color: 'green' };
    };

    const { level, color } = getRiskLevel(probability);

    const colorClasses = {
        red: 'bg-red-50 border-red-200 text-red-900',
        orange: 'bg-orange-50 border-orange-200 text-orange-900',
        amber: 'bg-amber-50 border-amber-200 text-amber-900',
        green: 'bg-green-50 border-green-200 text-green-900'
    };

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

    return (
        <div className={`bg-white border-2 ${colorClasses[color].split(' ')[1]} rounded-xl p-5 ${className}`}>
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClasses[color]}`}>
                    {level}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-slate-900">
                        {(probability * 100).toFixed(0)}%
                    </span>
                    <TrendIcon size={20} className={`${trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-slate-400'}`} />
                </div>

                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Confidence: {(confidence * 100).toFixed(0)}%</span>
                    <span className="text-slate-500">{timeWindow}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 mt-3">
                    <div
                        className={`h-2 rounded-full transition-all duration-500 ${color === 'red' ? 'bg-red-500' :
                                color === 'orange' ? 'bg-orange-500' :
                                    color === 'amber' ? 'bg-amber-500' :
                                        'bg-green-500'
                            }`}
                        style={{ width: `${probability * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default RiskCard;
