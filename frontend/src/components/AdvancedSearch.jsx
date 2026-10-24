import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, User, FileText, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdvancedSearch = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Mock search data
    const searchData = [
        { id: 1, type: 'patient', name: 'Rajesh Kumar', mrn: 'MRN-2024-001', category: 'Patients' },
        { id: 2, type: 'patient', name: 'Amit Sharma', mrn: 'MRN-2024-002', category: 'Patients' },
        { id: 3, type: 'patient', name: 'Priya Patel', mrn: 'MRN-2024-003', category: 'Patients' },
        { id: 4, type: 'report', name: 'Health Assessment Report', date: '2024-02-01', category: 'Reports' },
        { id: 5, type: 'guideline', name: 'NICE Guideline NG51 - Sepsis', source: 'NICE', category: 'Guidelines' },
        { id: 6, type: 'guideline', name: 'KDIGO AKI Guidelines', source: 'KDIGO', category: 'Guidelines' },
        { id: 7, type: 'alert', name: 'High Risk Sepsis Alert', patient: 'Priya Patel', category: 'Alerts' }
    ];

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('recentSearches');
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onClose ? onClose() : null;
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Search logic
    useEffect(() => {
        if (query.trim() === '') {
            setResults([]);
            return;
        }

        const filtered = searchData.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            (item.mrn && item.mrn.toLowerCase().includes(query.toLowerCase())) ||
            (item.source && item.source.toLowerCase().includes(query.toLowerCase()))
        );

        setResults(filtered);
    }, [query]);

    const handleSelect = (item) => {
        // Save to recent searches
        const updated = [item, ...recentSearches.filter(s => s.id !== item.id)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));

        // Navigate based on type
        if (item.type === 'patient') {
            navigate(`/patient/${item.id}`);
        }

        setQuery('');
        onClose();
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const getIcon = (type) => {
        switch (type) {
            case 'patient': return User;
            case 'report': return FileText;
            case 'guideline': return FileText;
            case 'alert': return TrendingUp;
            default: return Search;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
            >
                {/* Search Input */}
                <div className="p-4 border-b border-slate-200">
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search patients, reports, guidelines..."
                            className="w-full pl-12 pr-12 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center justify-between mt-2 px-1">
                        <span className="text-xs text-slate-500">
                            Press <kbd className="px-2 py-0.5 bg-slate-200 rounded text-xs">ESC</kbd> to close
                        </span>
                        <span className="text-xs text-slate-500">
                            <kbd className="px-2 py-0.5 bg-slate-200 rounded text-xs">⌘K</kbd> or <kbd className="px-2 py-0.5 bg-slate-200 rounded text-xs">Ctrl+K</kbd>
                        </span>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {query === '' && recentSearches.length > 0 && (
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                                    <Clock size={16} />
                                    <span>Recent Searches</span>
                                </h3>
                                <button
                                    onClick={clearRecentSearches}
                                    className="text-xs text-slate-500 hover:text-slate-700"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="space-y-1">
                                {recentSearches.map((item) => {
                                    const Icon = getIcon(item.type);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item)}
                                            className="w-full flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors text-left"
                                        >
                                            <Icon size={18} className="text-slate-400" />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{item.name}</p>
                                                {item.mrn && <p className="text-xs text-slate-500">{item.mrn}</p>}
                                            </div>
                                            <span className="text-xs text-slate-400">{item.category}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {query !== '' && results.length === 0 && (
                        <div className="p-12 text-center text-slate-500">
                            <Search className="mx-auto mb-2 text-slate-300" size={48} />
                            <p>No results found for "{query}"</p>
                        </div>
                    )}

                    {query !== '' && results.length > 0 && (
                        <div className="p-4">
                            <h3 className="text-sm font-semibold text-slate-700 mb-3">
                                {results.length} result{results.length !== 1 ? 's' : ''}
                            </h3>
                            <div className="space-y-1">
                                {results.map((item) => {
                                    const Icon = getIcon(item.type);
                                    return (
                                        <motion.button
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            onClick={() => handleSelect(item)}
                                            className="w-full flex items-center space-x-3 p-3 hover:bg-blue-50 rounded-lg transition-colors text-left group"
                                        >
                                            <div className="p-2 bg-slate-100 group-hover:bg-blue-100 rounded-lg transition-colors">
                                                <Icon size={18} className="text-slate-600 group-hover:text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{item.name}</p>
                                                <p className="text-xs text-slate-500">
                                                    {item.mrn || item.source || item.patient || item.date}
                                                </p>
                                            </div>
                                            <span className="text-xs text-slate-400 px-2 py-1 bg-slate-100 rounded">
                                                {item.category}
                                            </span>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AdvancedSearch;
