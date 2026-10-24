import { useState, useEffect } from 'react';

// Custom hook for managing notifications
export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load notifications from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('notifications');
        if (stored) {
            const parsed = JSON.parse(stored);
            setNotifications(parsed);
            setUnreadCount(parsed.filter(n => !n.read).length);
        }
    }, []);

    // Save to localStorage whenever notifications change
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
        setUnreadCount(notifications.filter(n => !n.read).length);
    }, [notifications]);

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const deleteNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll
    };
};

// Mock notification generator (simulates real-time notifications)
export const useMockNotifications = (addNotification) => {
    useEffect(() => {
        const mockNotifications = [
            { type: 'alert', title: 'High Risk Alert', message: 'Patient Priya Patel - Sepsis risk increased to 89%', severity: 'critical' },
            { type: 'report', title: 'Report Ready', message: 'Lab results for Patient MRN-2024-001 are now available', severity: 'info' },
            { type: 'appointment', title: 'Upcoming Appointment', message: 'Appointment with Dr. Aditi Rao in 30 minutes', severity: 'warning' },
            { type: 'system', title: 'System Update', message: 'Guidelines database updated with latest NICE protocols', severity: 'info' }
        ];

        // Generate random notifications every 30 seconds
        const interval = setInterval(() => {
            const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
            addNotification(randomNotification);
        }, 30000);

        return () => clearInterval(interval);
    }, [addNotification]);
};
