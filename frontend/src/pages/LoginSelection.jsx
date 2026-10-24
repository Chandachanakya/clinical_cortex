import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginSelection = () => {
    const navigate = useNavigate();

    const handleSelectRole = (role) => {
        navigate(`/login/${role}`);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 selection:bg-blue-100 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-50 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-50 rounded-full blur-[80px]" />
            </div>

            <div className="max-w-4xl w-full text-center z-10">
                <div className="flex flex-col items-center mb-16">
                    <img src="/logo.png" alt="Logo" className="h-16 w-16 mb-6 animate-float" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2 Outfit">Clinical Cortex</h1>
                    <p className="text-xl text-slate-500 font-medium">Select your portal to continue</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Admin Card */}
                    <div
                        onClick={() => handleSelectRole('admin')}
                        className="glass-card p-10 group"
                    >
                        <div className="h-20 w-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3 Outfit">System Admin</h2>
                        <p className="text-slate-500 font-medium">Infrastructure, security, and RBAC management.</p>
                    </div>

                    {/* Doctor Card */}
                    <div
                        onClick={() => handleSelectRole('doctor')}
                        className="glass-card p-10 group"
                    >
                        <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3 Outfit">Clinical Staff</h2>
                        <p className="text-slate-500 font-medium">Real-time monitoring and clinical decision support.</p>
                    </div>

                    {/* Patient Card */}
                    <div
                        onClick={() => handleSelectRole('patient')}
                        className="glass-card p-10 group"
                    >
                        <div className="h-20 w-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-3 Outfit">Patient Services</h2>
                        <p className="text-slate-500 font-medium">Secure access to records, vitals, and appointments.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginSelection;
