import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Please enter both username and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await login(username, password, role);

            // Redirect based on role
            if (role === 'admin') navigate('/admin-dashboard');
            else if (role === 'patient') navigate('/patient-dashboard');
            else navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials or server error');
        } finally {
            setLoading(false);
        }
    };

    const getTheme = () => {
        switch (role) {
            case 'admin': return { bg: 'bg-purple-600', text: 'text-purple-600', ring: 'focus:ring-purple-500', gradient: 'from-purple-500/10' };
            case 'patient': return { bg: 'bg-emerald-600', text: 'text-emerald-600', ring: 'focus:ring-emerald-500', gradient: 'from-emerald-500/10' };
            default: return { bg: 'bg-blue-600', text: 'text-blue-600', ring: 'focus:ring-blue-500', gradient: 'from-blue-500/10' };
        }
    };

    const theme = getTheme();
    const title = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';

    const getBranding = () => {
        switch (role) {
            case 'admin': return {
                label: 'CortexAdmin',
                subtitle: 'System Administration Portal',
                bg: 'bg-purple-600'
            };
            case 'patient': return {
                label: 'Patient Portal',
                subtitle: 'Personal Health Dashboard',
                bg: 'bg-emerald-600'
            };
            default: return {
                label: 'Clinical Cortex',
                subtitle: 'Clinical Monitoring Platform',
                bg: 'bg-blue-600'
            };
        }
    };
    const branding = getBranding();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className={`absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br ${theme.gradient} to-transparent rounded-full blur-[100px]`} />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-slate-200/50 rounded-full blur-[80px]" />
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/login')}
                    className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-8"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Selection
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl border border-white/50 py-8 px-4 shadow-xl rounded-2xl sm:px-10"
                >
                    {/* Logo / Branding Header */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <div className={`${branding.bg} p-3 rounded-2xl shadow-lg`}>
                                <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain brightness-0 invert" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-1">
                            {branding.label}
                        </h2>
                        <p className="text-sm text-slate-500 mb-1">{branding.subtitle}</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-slate-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className={`appearance-none block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent sm:text-sm transition-all`}
                                    placeholder="Enter your username"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`appearance-none block w-full pl-10 pr-12 py-2.5 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent sm:text-sm transition-all`}
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg"
                            >
                                {error}
                            </motion.div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white ${theme.bg} hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.ring} transition-all disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Sign in'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
