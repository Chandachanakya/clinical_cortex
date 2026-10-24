import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const Disclaimer = ({ className = '' }) => {
    return (
        <div className={`bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-3 ${className}`}>
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-amber-900">
                <strong>Clinical Decision Support Tool:</strong> This is an advisory system only.
                No autonomous diagnosis or treatment. All clinical decisions must be made by qualified healthcare professionals.
            </p>
        </div>
    );
};

export default Disclaimer;
