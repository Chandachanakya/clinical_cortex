import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertTriangle, FileText, Calendar, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter = ({ notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'alert': return AlertTriangle;
            case 'report': return FileText;
            case 'appointment': return Calendar;
            default: return Info;
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-50 border-red-200 text-red-900';
            case 'warning': return 'bg-amber-50 border-amber-200 text-amber-900';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-900';
            default: return 'bg-slate-50 border-slate-200 text-slate-900';
        }
    };

    const getIconColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-red-600';
            case 'warning': return 'text-amber-600';
            case 'info': return 'text-blue-600';
            default: return 'text-slate-600';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon with Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={onMarkAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <Bell className="mx-auto mb-2 text-slate-300" size={48} />
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {notifications.map((notification) => {
                                        const Icon = getIcon(notification.type);
                                        return (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`p-4 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''
                                                    }`}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className={`p-2 rounded-lg ${getSeverityColor(notification.severity)}`}>
                                                        <Icon size={18} className={getIconColor(notification.severity)} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <h4 className="font-semibold text-sm text-slate-900 mb-1">
                                                                {notification.title}
                                                            </h4>
                                                            <button
                                                                onClick={() => onDelete(notification.id)}
                                                                className="text-slate-400 hover:text-slate-600 ml-2"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                        <p className="text-sm text-slate-600 mb-2">{notification.message}</p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-400">
                                                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                                            </span>
                                                            {!notification.read && (
                                                                <button
                                                                    onClick={() => onMarkAsRead(notification.id)}
                                                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                                                                >
                                                                    <Check size={12} />
                                                                    <span>Mark as read</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
