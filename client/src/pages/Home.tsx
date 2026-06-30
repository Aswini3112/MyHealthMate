import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Activity, FileText, Bot, Shield, UserCheck, ArrowRight, ScanLine } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="relative min-height-screen flex flex-col bg-[#0f172a] text-slate-100 overflow-hidden pb-16">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />

      <main className="flex-1 max-w-7xl mx-auto px-6 pt-16 md:pt-24 relative z-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8 animate-pulse">
            <Heart className="w-3.5 h-3.5" />
            HackHazards '26 Innovation
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Take Control of Your Medical History with <span className="text-gradient">MyHealthMate</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
            The next-generation digital health record companion for Indian patients. Store documents, track trends, chat with AI, and share records securely via ABHA ID.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-primary hover:opacity-95 text-white font-semibold px-8 py-4 rounded-2xl shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-0.5"
            >
              Get Started with ABHA ID
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/doctor-portal"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--primary-blue)] hover:opacity-95 border border-[var(--primary-blue)] text-white font-semibold px-8 py-4 rounded-2xl transition-all duration-200"
            >
              <ScanLine className="w-5 h-5 text-white" />
              Doctor Portal Access
            </Link>

          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-24 md:mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features Built for Indian Healthcare</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Fully compliant with the Ayushman Bharat Digital Mission (ABDM) guidelines for secure health data exchange.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="glass glass-hover p-8 rounded-3xl">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">ABHA ID Authentication</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect instantly with ABDM central registries using OTP verification. Linking your profile pulls historic records from India's official digital network.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass glass-hover p-8 rounded-3xl">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">Amazon Textract OCR</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload prescriptions, lab sheets, and discharge reports. Our pipeline parses and isolates medical parameters, doctor info, and dosages automatically.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass glass-hover p-8 rounded-3xl">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">Interactive Analytics</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Monitor HbA1c glucose levels, systolic/diastolic blood pressure, BMI, and cholesterol lines. Set target goals and download quarterly PDF health reports.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass glass-hover p-8 rounded-3xl">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">AI Medical Chatbot</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Consult a chatbot powered by Bedrock (Llama 3/Titan). Fully context-aware of your medical records. Supports English, Hindi, and Tamil via Sarvam AI.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass glass-hover p-8 rounded-3xl">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">Granular Doctor Consent</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Share reports on your terms. Select specific prescriptions to release, generate a time-limited 10-minute OTP or 24-hour QR token, and audit doctor logs.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass glass-hover p-8 rounded-3xl">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">Vitals & Health Score</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Receive an immediate feedback grade (0-100) detailing your cardiac and glycemic standing, highlighting critical conditions that require doctor checks.
              </p>
            </div>
          </div>
        </div>

        {/* Demo ABDM OTP Notice */}
        <div className="mt-20 glass border border-amber-500/20 bg-amber-500/5 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl font-bold text-sm font-mono">Demo Mode</span>
            <p className="text-slate-300 text-sm">
              Use test ABHA ID <span className="font-mono text-emerald-400 font-bold bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">91-9283-1283-9128</span> and OTP <span className="font-mono text-emerald-400 font-bold bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800">123456</span> to experience pre-seeded patient clinical data.
            </p>
          </div>
          <Link
            to="/auth"
            className="text-amber-400 hover:text-amber-300 text-sm font-semibold flex items-center gap-1.5 group shrink-0"
          >
            Try Demo Login
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;
