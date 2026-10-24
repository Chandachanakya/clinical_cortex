import React from 'react';

const riskColors = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200',
    LOW: 'bg-green-100 text-green-800 border-green-200',
    STABLE: 'bg-blue-100 text-blue-800 border-blue-200'
};

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    acknowledged: 'bg-blue-100 text-blue-800 border-blue-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    discharged: 'bg-slate-100 text-slate-800 border-slate-200'
};

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1.5 text-base'
    };

    const variantClasses = {
        ...riskColors,
        ...statusColors,
        default: 'bg-slate-100 text-slate-800 border-slate-200'
    };

    return (
        <span
            className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${variantClasses[variant] || variantClasses.default} ${className}`}
        >
            {children}
        </span>
    );
};

export const RiskBadge = ({ level, showDot = false }) => {
    return (
        <Badge variant={level} size="sm">
            {showDot && <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />}
            {level}
        </Badge>
    );
};

export default Badge;
