import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Calendar, ShieldCheck, User, Clock, FileText, ChevronRight, RefreshCw } from 'lucide-react';
import { API_BASE } from '../config';

interface HealthVitals {
  score: number;
  status: string;
  latestMetricsCount: number;
  message: string;
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [healthVitals, setHealthVitals] = useState<HealthVitals | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);

  // Metrics are fetched to derive latestVitals, but we don't need to store them.
  
  // Vitals State for quickly looking at parameters

  const [latestVitals, setLatestVitals] = useState({
    glucose: { value: '--', unit: '', recordedDate: '' },
    bp: { value: '--', unit: '', recordedDate: '' },
    weight: { value: '--', unit: '', recordedDate: '' },
    cholesterol: { value: '--', unit: '', recordedDate: '' },
    adherence: { value: '--', unit: '', recordedDate: '' }
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const patientId = user._id || user.id;

      // 1. Fetch Health Score
      const scoreRes = await fetch(`${API_BASE}/metrics/patient/${patientId}/health-score`);
      const scoreData = await scoreRes.json();
      if (scoreData.success) {
        setHealthVitals({
          score: scoreData.score,
          status: scoreData.status,
          latestMetricsCount: scoreData.latestMetricsCount,
          message: scoreData.message
        });
      }

      // 2. Fetch Documents for Timeline
      const docsRes = await fetch(`${API_BASE}/documents/patient/${patientId}`);
      const docsData = await docsRes.json();
      if (docsData.success) {
        setDocuments(docsData.documents);
      }

      // 3. Fetch Metrics to fill Vitals stats cards
      const metricsRes = await fetch(`${API_BASE}/metrics/patient/${patientId}`);
      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        parseLatestMetrics(metricsData.metrics);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseLatestMetrics = (rawMetrics: any[]) => {
    const sorted = [...rawMetrics].sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime());
    
    const glucose = sorted.find(m => m.metricType === 'glucose');
    const bpSys = sorted.find(m => m.metricType === 'bp_systolic');
    const bpDia = sorted.find(m => m.metricType === 'bp_diastolic');
    const weight = sorted.find(m => m.metricType === 'weight');
    const cholesterol = sorted.find(m => m.metricType === 'cholesterol');
    const adherence = sorted.find(m => m.metricType === 'medication_adherence');

    setLatestVitals({
      glucose: glucose ? { value: String(glucose.value), unit: glucose.unit, recordedDate: new Date(glucose.recordedDate).toLocaleDateString() } : { value: '--', unit: '', recordedDate: '' },
      bp: bpSys && bpDia ? { value: `${bpSys.value}/${bpDia.value}`, unit: bpSys.unit, recordedDate: new Date(bpSys.recordedDate).toLocaleDateString() } : { value: '--', unit: '', recordedDate: '' },
      weight: weight ? { value: String(weight.value), unit: weight.unit, recordedDate: new Date(weight.recordedDate).toLocaleDateString() } : { value: '--', unit: '', recordedDate: '' },
      cholesterol: cholesterol ? { value: String(cholesterol.value), unit: cholesterol.unit, recordedDate: new Date(cholesterol.recordedDate).toLocaleDateString() } : { value: '--', unit: '', recordedDate: '' },
      adherence: adherence ? { value: String(adherence.value), unit: adherence.unit, recordedDate: new Date(adherence.recordedDate).toLocaleDateString() } : { value: '--', unit: '', recordedDate: '' }
    });
  };

  // Compile a list of timeline events based on documents uploaded
  const timelineEvents = documents
    .map(doc => ({
      id: doc._id || doc.id,
      date: new Date(doc.uploadDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: doc.documentType,
      title: doc.fileName,
      doctor: doc.extractedData?.doctorName || 'Unknown Doctor',
      hospital: doc.extractedData?.hospitalName || 'Unknown Facility',
      rawDate: new Date(doc.uploadDate)
    }))
    .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <span>Synchronizing patient registry dashboard...</span>
        </div>
      </div>
    );
  }



return (
    <div className="min-h-[80vh] max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100" />
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#2563EB]/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>


      {/* Welcome header & quick actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.name}</h2>
          <p className="text-sm mt-1 text-slate-600">Premium view of your vitals, timeline, and clinical records.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 bg-white/70 border border-slate-200 hover:border-[#2563EB]/30 text-slate-700 px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md"
          >

            <RefreshCw className="w-3.5 h-3.5 text-[#2563EB]" />
            Sync Health Registry
          </button>
          <button
            onClick={() => navigate('/analytics')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#2563EB] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-all"
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Premium layout: anatomy visualizer + metrics + overview + timeline + quick records */}
      <div className="grid xl:grid-cols-12 gap-8">
        {/* Anatomy Visualizer */}
        <div className="xl:col-span-5">
          <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Anatomy Visualizer</p>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Cardio–Respiratory View</h3>
                </div>
              </div>
              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB]">Live Context</span>
            </div>

            <div className="px-6 pb-6">
              <div className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-[#2563EB]/10 via-white dark:via-slate-900/10 to-emerald-400/10 border border-slate-200/60 dark:border-slate-800/40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2563EB33_0%,transparent_60%)]" />
                <div className="relative h-[360px] sm:h-[420px] flex items-center justify-center">
                  <svg viewBox="0 0 420 420" className="w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] drop-shadow-[0_18px_40px_rgba(37,99,235,0.22)]" aria-hidden="true">
                    <defs>
                      <linearGradient id="heartGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.95" />
                        <stop offset="60%" stopColor="#1D4ED8" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.55" />
                      </linearGradient>
                      <linearGradient id="lungGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563EB" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0.08" />
                      </linearGradient>
                      <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
                        <feGaussianBlur stdDeviation="10" result="blur" />
                        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.55 0" result="glow" />
                        <feMerge>
                          <feMergeNode in="glow" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Lungs */}
                    <g filter="url(#softGlow)" opacity="0.95">
                      <path
                        d="M145 120 C115 130, 95 165, 95 205 C95 260, 125 310, 170 318 C182 320, 195 310, 195 295 C195 260, 165 245, 165 210 C165 175, 185 165, 185 140 C185 125, 170 114, 145 120 Z"
                        fill="url(#lungGrad)" stroke="#2563EB" strokeOpacity="0.25" strokeWidth="3" />
                      <path
                        d="M275 120 C305 130, 325 165, 325 205 C325 260, 295 310, 250 318 C238 320, 225 310, 225 295 C225 260, 255 245, 255 210 C255 175, 235 165, 235 140 C235 125, 250 114, 275 120 Z"
                        fill="url(#lungGrad)" stroke="#2563EB" strokeOpacity="0.25" strokeWidth="3" />
                    </g>

                    {/* Heart */}
                    <g transform="translate(0,10)" filter="url(#softGlow)">
                      <path
                        d="M210 165
                           C210 165, 178 140, 152 160
                           C132 176, 130 208, 150 228
                           C170 248, 210 275, 210 275
                           C210 275, 250 248, 270 228
                           C290 208, 288 176, 268 160
                           C242 140, 210 165, 210 165 Z"
                        fill="url(#heartGrad)"
                        stroke="#2563EB"
                        strokeOpacity="0.25"
                        strokeWidth="3"
                      />
                      <path
                        d="M210 192 C210 192, 188 176, 172 186 C162 192, 160 210, 170 222 C184 240, 210 256, 210 256 C210 256, 236 240, 250 222 C260 210, 258 192, 248 186 C232 176, 210 192, 210 192 Z"
                        fill="#2563EB" opacity="0.18" />
                    </g>

                    {/* Pulse ring */}
                    <circle cx="210" cy="240" r="74" fill="none" stroke="#2563EB" strokeOpacity="0.15" strokeWidth="4" />
                    <circle cx="210" cy="240" r="92" fill="none" stroke="#10B981" strokeOpacity="0.10" strokeWidth="3" />
                  </svg>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Score</p>
                  <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{healthVitals?.score || 75}</p>
                </div>
                <div className="rounded-2xl bg-white/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</p>
                  <p className="text-sm font-semibold text-[#2563EB]">{healthVitals?.status || 'Good'}</p>
                </div>
                <div className="rounded-2xl bg-white/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Context</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{healthVitals?.latestMetricsCount || 0} metrics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: metrics + overview + timeline + records panel */}
        <div className="xl:col-span-7 space-y-8">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Glucose */}
            <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/60 shadow-sm p-5 transition-all hover:shadow-md">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Fasting Glucose</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{latestVitals.glucose.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{latestVitals.glucose.unit || 'mg/dL'}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                </div>
              </div>
              <p className="mt-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">{latestVitals.glucose.recordedDate ? `Updated: ${latestVitals.glucose.recordedDate}` : 'No records logged'}</p>
            </div>

            {/* BP */}
            <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/60 shadow-sm p-5 transition-all hover:shadow-md">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Blood Pressure</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{latestVitals.bp.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{latestVitals.bp.unit || 'mmHg'}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
              <p className="mt-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">{latestVitals.bp.recordedDate ? `Updated: ${latestVitals.bp.recordedDate}` : 'No records logged'}</p>
            </div>

            {/* Weight */}
            <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/60 shadow-sm p-5 transition-all hover:shadow-md">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Weight / BMI</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{latestVitals.weight.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{latestVitals.weight.unit || 'kg'}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="mt-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">{latestVitals.weight.recordedDate ? `Updated: ${latestVitals.weight.recordedDate}` : 'No records logged'}</p>
            </div>

            {/* Cholesterol */}
            <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/60 shadow-sm p-5 transition-all hover:shadow-md">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Cholesterol</p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{latestVitals.cholesterol.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{latestVitals.cholesterol.unit || 'mg/dL'}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                </div>
              </div>
              <p className="mt-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">{latestVitals.cholesterol.recordedDate ? `Updated: ${latestVitals.cholesterol.recordedDate}` : 'No records logged'}</p>
            </div>

            {/* Adherence */}
            <div className="sm:col-span-2 rounded-[28px] bg-white/70 dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/60 shadow-sm p-6 transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Medication Adherence</p>
                  <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{latestVitals.adherence.value !== '--' ? `${latestVitals.adherence.value}%` : '--'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Consistency score</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="mt-3 text-[10px] font-mono text-slate-500 dark:text-slate-400">{latestVitals.adherence.recordedDate ? `Updated: ${latestVitals.adherence.recordedDate}` : 'No prescriptions'}</p>
            </div>
          </div>

          {/* Patient overview */}
          <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/60 shadow-sm p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Patient Overview</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">{user?.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user?.gender}, {user?.age} years old</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#2563EB] text-[10px] font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user?.abhaId ? 'ABHA Linked' : 'ABHA Not Linked'}
                </span>
                <button
                  onClick={() => navigate('/share')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold shadow-sm hover:opacity-95 transition-all"
                >
                  Share Consent
                </button>
                <button
                  onClick={() => navigate('/records')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-bold hover:border-[#2563EB]/30 transition-all"
                >
                  Upload Records
                </button>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/40 p-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Email</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{user?.email}</p>
              </div>
              <div className="rounded-2xl bg-white/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/40 p-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Phone</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1 font-mono">{user?.phone}</p>
              </div>
              <div className="rounded-2xl bg-white/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/40 p-4">
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Latest Index</p>
                <p className="text-sm font-semibold text-[#2563EB] mt-1">{healthVitals?.score || 75} / 100</p>
              </div>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Activity timeline</h3>
              </div>
              <button
                onClick={() => navigate('/records')}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-all flex items-center gap-1"
              >
                Medical Records
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {timelineEvents.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/40 dark:bg-slate-900/20">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No clinical reports found</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Upload files to populate your timeline.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4">
                {timelineEvents.map((evt) => (
                  <div key={evt.id} className="relative group">
                    <div className="absolute left-[-30px] top-2 w-5 h-5 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/20" />
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => navigate('/records')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') navigate('/records');
                      }}
                      className="cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/40 hover:border-[#2563EB]/30 hover:shadow-md transition-all"
                    >
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-[#2563EB]">{evt.type.replace('_', ' ')}</span>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-0.5">{evt.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Provider: {evt.doctor} | Facility: {evt.hospital}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shrink-0">
                        {evt.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medical records panel (quick access) */}
          <div className="rounded-[28px] bg-white/70 dark:bg-slate-900/20 border border-slate-200/80 dark:border-slate-800/60 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Medical Records Panel</p>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-2">Your latest documents</h3>
              </div>
              <button
                onClick={() => navigate('/records')}
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-all"
              >
                View all
              </button>
            </div>

            <div className="mt-5 grid md:grid-cols-3 gap-4">
              {timelineEvents.slice(0, 6).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => navigate('/records')}
                  role="button"
                  tabIndex={0}
                  className="rounded-2xl bg-white/60 dark:bg-slate-900/30 border border-slate-200/70 dark:border-slate-800/40 p-4 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">{evt.type.replace('_', ' ')}</span>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{evt.date}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">{evt.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{evt.doctor}</p>
                </div>
              ))}
              {timelineEvents.length === 0 && (
                <div className="md:col-span-3 text-center py-10 text-slate-500 dark:text-slate-400">
                  Upload records to see them here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
