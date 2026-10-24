import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Shield, Activity, Users, Zap,
    Lock, ArrowRight, BarChart3, Globe
} from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    const handlePortalAccess = (role) => {
        navigate(`/login/${role}`);
    };

    const features = [
        {
            icon: Activity,
            title: "Real-time Risk Monitoring",
            description: "Advanced AI agents monitor patient vitals 24/7, providing real-time risk scores for Sepsis, AKI, and Respiratory Failure."
        },
        {
            icon: Zap,
            title: "Predictive Analytics",
            description: "Harnessing ensemble ML models to predict clinical deterioration up to 6 hours before physiological onset."
        },
        {
            icon: Shield,
            title: "RAG-Enhanced Reliability",
            description: "System decisions are Cross-referenced with the latest clinical guidelines via Retrieval-Augmented Generation."
        }
    ];

    const portals = [
        {
            role: 'admin',
            name: 'System Admin',
            description: 'Infrastructure management, RBAC, and system audit.',
            color: 'from-purple-500 to-indigo-600',
            icon: Lock
        },
        {
            role: 'doctor',
            name: 'Clinical Professional',
            description: 'Patient monitoring, alert management, and decision support.',
            color: 'from-blue-500 to-cyan-600',
            icon: Shield
        },
        {
            role: 'patient',
            name: 'Patient Portal',
            description: 'Personal health records, vitals tracking, and appointments.',
            color: 'from-emerald-500 to-teal-600',
            icon: Users
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <img src="/logo.png" alt="Clinical Cortex Logo" className="h-10 w-10 object-contain" />
                        <span className="text-2xl font-bold tracking-tight text-slate-900 Outfit">ClinicalCortex</span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
                        <a href="#features" className="hover:text-blue-600 transition-colors">Platform</a>
                        <a href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</a>
                        <a href="#portals" className="px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-blue-600 transition-all duration-300">
                            Access Portals
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
                    <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
                </div>

                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-bold rounded-full mb-6 inline-block">
                            Next-Gen Clinical Intelligence
                        </span>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 leading-[1.1] Outfit">
                            Intelligent Risk Monitoring <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600">
                                For Modern Healthcare
                            </span>
                        </h1>
                        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                            Empowering clinicians with real-time AI agents that detect clinical deterioration before it happens. Built for precision, safety, and scale.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="#portals" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all text-lg flex items-center justify-center space-x-2 group">
                                <span>Enter Platform</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <button className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 font-bold rounded-2xl hover:border-blue-200 hover:bg-slate-50 transition-all text-lg">
                                View Documentation
                            </button>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* Stats/Logos */}
            <section className="py-12 border-y border-slate-100 bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "Predictive Accuracy", value: "94.2%" },
                        { label: "Active Monitors", value: "10k+" },
                        { label: "Alert Latency", value: "< 200ms" },
                        { label: "Security", value: "HIPAA Compliant" }
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                            <div className="text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4 Outfit">Enterprise Core Capabilities</h2>
                        <p className="text-slate-500 max-w-xl mx-auto font-medium">Built on a foundation of clinical excellence and computational rigor.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-10 glass-card rounded-3xl"
                            >
                                <div className="p-4 bg-blue-50 rounded-2xl w-fit mb-8">
                                    <feature.icon className="text-blue-600" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4 Outfit">{feature.title}</h3>
                                <p className="text-slate-500 leading-relaxed font-medium">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Portals Access */}
            <section id="portals" className="py-32 px-6 bg-slate-900 relative">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold text-white mb-4 Outfit">Secure Portal Access</h2>
                        <p className="text-slate-400 max-w-xl mx-auto font-medium">Select your point of entry to the Clinical Cortex ecosystem.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {portals.map((portal, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => handlePortalAccess(portal.role)}
                                className="group relative cursor-pointer"
                            >
                                <div className="h-full p-8 rounded-3xl bg-slate-800/50 border border-slate-700 hover:border-blue-500 transition-all duration-500 backdrop-blur-md">
                                    <div className={`p-4 bg-gradient-to-br ${portal.color} rounded-2xl w-fit mb-8 shadow-lg`}>
                                        <portal.icon className="text-white" size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-4 Outfit group-hover:text-blue-400 transition-colors">
                                        {portal.name}
                                    </h3>
                                    <p className="text-slate-400 leading-relaxed mb-8 font-medium">
                                        {portal.description}
                                    </p>
                                    <div className="flex items-center text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
                                        <span>Access Portal</span>
                                        <ArrowRight size={20} className="ml-2" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-slate-100 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:row items-center justify-between gap-10">
                    <div className="flex items-center space-x-3">
                        <img src="/logo.png" alt="Clinical Cortex Logo" className="h-8 w-8" />
                        <span className="text-xl font-bold Outfit">ClinicalCortex</span>
                    </div>
                    <div className="flex gap-8 text-sm font-semibold text-slate-500">
                        <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Compliance</a>
                        <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
                    </div>
                    <div className="text-slate-400 text-sm font-medium">
                        © 2026 Clinical Cortex. Enterprise Clinical AI Platform.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
