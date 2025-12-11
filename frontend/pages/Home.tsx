import { Link } from 'react-router-dom';
import {
    ShieldCheck,
    Zap,
    Play,
    Globe
} from 'lucide-react';
import { Navbar } from '../components/Navbar';

export function Home() {
    return (
        <div className="min-h-screen bg-white font-sans text-slate-800">
            {/* Navbar */}
            {/* Navbar */}
            <Navbar />

            <main>
                {/* Hero Section */}
                <div className="relative overflow-hidden pt-20 pb-28 lg:pt-32 lg:pb-40">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
                        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-fade-in-up">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Online Code Compiler & Execution Engine
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-tight">
                            Code, Compile, & Run <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                                In Your Browser
                            </span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Execute code in 5+ languages securely with real-time output. No setup required. Perfect for practice, testing, and learning.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/demo"
                                className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20"
                            >
                                Start Coding Now <ChevronRight className="w-4 h-4" />
                            </Link>
                            <a
                                href="#features"
                                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4" /> How it Works
                            </a>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div id="features" className="py-24 bg-slate-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Everything you need to code</h2>
                            <p className="mt-4 text-lg text-slate-600">Powerful features tailored for seamless remote execution.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Language Support</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Support for Python, Java, C++, JavaScript (Node.js), and Go. Switch languages instantly.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Secure Sandboxing</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Code runs in isolated Docker containers with strictly enforced resource limits for security.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6 text-amber-600 group-hover:scale-110 transition">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time Execution</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Experience low-latency execution with WebSocket streaming for instant stdout/stderr feedback.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supported Languages */}
                <div className="py-24 bg-white border-t border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-12">Supported Environments</h2>
                        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Mock Logos placeholders using text for simplicity/react-icons unavailable */}
                            <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-bold text-2xl">JS</div>
                                <span className="text-sm font-medium">Node.js</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">Py</div>
                                <span className="text-sm font-medium">Python</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-2xl">J</div>
                                <span className="text-sm font-medium">Java</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">C++</div>
                                <span className="text-sm font-medium">C++</span>
                            </div>
                            <div className="flex flex-col items-center gap-2 hover:scale-105 transition">
                                <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center text-cyan-600 font-bold text-2xl">Go</div>
                                <span className="text-sm font-medium">Go</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simple Footer */}
                <footer className="bg-slate-50 py-12 border-t border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-slate-500 text-sm">© 2024 RCE Engine. Built for developers.</p>
                    </div>
                </footer>

            </main>
        </div>
    );
}

// Icon component needed for the button
function ChevronRight(props: any) {
    return (
        <svg
            {...props}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}
