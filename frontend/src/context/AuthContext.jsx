import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const login = async (username, password, role) => {
        try {
            // Pass as raw string to bypass Axios instance Content-Type: application/json header
            // which interferes with URLSearchParams in Axios 1.x
            const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
            const response = await axios.post('http://localhost:8001/api/auth/login', body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token } = response.data;
            localStorage.setItem('token', access_token);

            // Get user info
            const userResponse = await api.get('/auth/me');
            setUser(userResponse.data);
            return true;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
