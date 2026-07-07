import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, BarChart, Bar 
} from 'recharts';
import { 
  Plus, Target, AlertTriangle, FileDown, 
  RefreshCw, CheckCircle2, Info
} from 'lucide-react';
import { API_BASE } from '../config';

const Analytics: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [, setHealthScore] = useState<any | null>(null);




  // Form State
  const [metricType, setMetricType] = useState('glucose');
  const [metricVal, setMetricVal] = useState('');
  const [metricUnit, setMetricUnit] = useState('mg/dL');
  
  // Custom states for BP double inputs
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');

  // Target Goals State (stored in localstorage for hackathon simplicity)
  const [goals, setGoals] = useState({
    glucose: '100',
    bpSystolic: '120',
    bpDiastolic: '80',
    weight: '70',
    cholesterol: '180'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchAnalyticsData();
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Automatically match unit based on metric type
    if (metricType === 'glucose') setMetricUnit('mg/dL');
    else if (metricType === 'weight') setMetricUnit('kg');
    else if (metricType === 'cholesterol') setMetricUnit('mg/dL');
    else if (metricType === 'bp') setMetricUnit('mmHg');
  }, [metricType]);

  const fetchAnalyticsData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const patientId = user._id || user.id;

      // 1. Fetch metrics
      const mRes = await fetch(`${API_BASE}/metrics/patient/${patientId}`);
      const mData = await mRes.json();
      if (mData.success) {
        setMetrics(mData.metrics);
      }

      // 2. Fetch health score details
      const sRes = await fetch(`${API_BASE}/metrics/patient/${patientId}/health-score`);
      const sData = await sRes.json();
      if (sData.success) {
        setHealthScore(sData);
      }



      // Load goals from local storage
      const savedGoals = localStorage.getItem(`myhealthmate_goals_${patientId}`);
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const patientId = user._id || user.id;
      
      if (metricType === 'bp') {
        // Log systolic BP
        await fetch(`${API_BASE}/metrics/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            metricType: 'bp_systolic',
            value: Number(bpSystolic),
            unit: 'mmHg'
          })
        });

        // Log diastolic BP
        await fetch(`${API_BASE}/metrics/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            metricType: 'bp_diastolic',
            value: Number(bpDiastolic),
            unit: 'mmHg'
          })
        });

        setBpSystolic('');
        setBpDiastolic('');
      } else {
        await fetch(`${API_BASE}/metrics/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            metricType,
            value: Number(metricVal),
            unit: metricUnit
          })
        });
        setMetricVal('');
      }

      // Refresh data
      fetchAnalyticsData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateGoals = (type: string, val: string) => {
    if (!user) return;
    const patientId = user._id || user.id;
    const updated = { ...goals, [type]: val };
    setGoals(updated);
    localStorage.setItem(`myhealthmate_goals_${patientId}`, JSON.stringify(updated));
  };

  // --- CHART DATA COMPILERS ---
  const getChartData = (type: string) => {
    return metrics
      .filter(m => m.metricType === type)
      .map(m => ({
        date: new Date(m.recordedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        value: Number(m.value),
        min: m.normalRangeMin,
        max: m.normalRangeMax
      }));
  };

  // Compile BP data (must align systolic and diastolic on same dates)
  const getBPChartData = () => {

    const systolic = metrics.filter(m => m.metricType === 'bp_systolic');
    const diastolic = metrics.filter(m => m.metricType === 'bp_diastolic');
    
    // Simple zip by index or date. For mock ease, zip by closest index
    const count = Math.max(systolic.length, diastolic.length);
    const data = [];
    for (let i = 0; i < count; i++) {
      const s = systolic[i];
      const d = diastolic[i];
      if (s || d) {
        const dateObj = s ? new Date(s.recordedDate) : new Date(d.recordedDate);
        data.push({
          date: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          systolic: s ? Number(s.value) : undefined,
          diastolic: d ? Number(d.value) : undefined,
          normalSys: 120,
          normalDia: 80
        });
      }
    }
    return data;
  };

  const glucoseData = getChartData('glucose');
  const bpData = getBPChartData();
  const weightData = getChartData('weight');
  const cholesterolData = getChartData('cholesterol');
  const adherenceData = getChartData('medication_adherence');

  // Check for critical warnings based on latest metrics
  const latestGlucose = [...glucoseData].pop()?.value;
  const latestBP = [...bpData].pop();
  const latestCholesterol = [...cholesterolData].pop()?.value;

  const warnings = [];
  if (latestGlucose && latestGlucose > 140) {
    warnings.push({ text: `Elevated Glucose levels: Last logged FBS was ${latestGlucose} mg/dL. Expected normal range is below 140 mg/dL.` });
  }
  if (latestBP && latestBP.systolic && latestBP.systolic > 130) {
    warnings.push({ text: `Prehypertension detected: Last BP vitals read ${latestBP.systolic}/${latestBP.diastolic} mmHg. Target normal range is 120/80 mmHg.` });
  }
  if (latestCholesterol && latestCholesterol > 200) {
    warnings.push({ text: `High cholesterol detected: Last lipid reading logged ${latestCholesterol} mg/dL. Expected normal limit is below 200 mg/dL.` });
  }

  // Trigger PDF/Report Printing window
  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <span>Compiling health analytics charts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10 text-slate-100 print:bg-white print:text-black">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Interactive Vitals & Analytics</h2>
          <p className="text-slate-400 text-sm mt-1">Review diagnostic trend lines, target goals progress, and generate PDF summary sheets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-gradient-primary hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            Export Health Report (PDF)
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-6 mb-8 text-black bg-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-wide">MYHEALTHMATE REPORT</h1>
            <p className="text-slate-600 text-xs">Ayushman Bharat Digital Registry Patient Record Summary</p>
          </div>
          <div className="text-right">
            <h4 className="text-lg font-bold">{user?.name}</h4>
            <p className="text-slate-600 text-xs">ABHA: {user?.abhaId || 'N/A'}</p>
            <p className="text-slate-600 text-xs">Date Compiled: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Grid of logger and alerts */}
      <div className="grid lg:grid-cols-3 gap-8 print:hidden">
        
        {/* Logger form */}
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 text-emerald-400">
            <Plus className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-200">Log Vitals Metric</h3>
          </div>

          <form onSubmit={handleAddMetric} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Metric Type</label>
              <select
                value={metricType}
                onChange={(e) => setMetricType(e.target.value)}
                className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
              >
                <option value="glucose">Blood Glucose (FBS)</option>
                <option value="bp">Blood Pressure (BP)</option>
                <option value="weight">Body Weight (kg)</option>
                <option value="cholesterol">Total Cholesterol</option>
              </select>
            </div>

            {metricType === 'bp' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1.5">Systolic (mmHg)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 120"
                    value={bpSystolic}
                    onChange={(e) => setBpSystolic(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1.5">Diastolic (mmHg)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 80"
                    value={bpDiastolic}
                    onChange={(e) => setBpDiastolic(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Metric Value ({metricUnit})</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={`e.g. ${metricType === 'glucose' ? '95' : metricType === 'weight' ? '70' : '180'}`}
                  value={metricVal}
                  onChange={(e) => setMetricVal(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-primary text-white font-semibold text-xs rounded-xl hover:opacity-95 transition-all cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.15)]"
            >
              Log Entry
            </button>
          </form>
        </div>

        {/* Goal Setters */}
        <div className="glass p-6 rounded-3xl border border-slate-800/80 space-y-6">
          <div className="flex items-center gap-2 text-indigo-400">
            <Target className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-200">Patient Target Goals</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-400 font-semibold">Target Glucose (mg/dL)</span>
                <input
                  type="number"
                  value={goals.glucose}
                  onChange={(e) => handleUpdateGoals('glucose', e.target.value)}
                  className="w-16 text-right bg-transparent border-b border-slate-800 focus:border-indigo-500/70 font-mono text-emerald-400 outline-none"
                />
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (Number(goals.glucose) / 120) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-400 font-semibold">Target BP Systolic (mmHg)</span>
                <input
                  type="number"
                  value={goals.bpSystolic}
                  onChange={(e) => handleUpdateGoals('bpSystolic', e.target.value)}
                  className="w-16 text-right bg-transparent border-b border-slate-800 focus:border-indigo-500/70 font-mono text-emerald-400 outline-none"
                />
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (Number(goals.bpSystolic) / 140) * 100)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-slate-400 font-semibold">Target Body Weight (kg)</span>
                <input
                  type="number"
                  value={goals.weight}
                  onChange={(e) => handleUpdateGoals('weight', e.target.value)}
                  className="w-16 text-right bg-transparent border-b border-slate-800 focus:border-indigo-500/70 font-mono text-emerald-400 outline-none"
                />
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (65 / Number(goals.weight)) * 100)}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Vital Alerts / Warnings */}
        <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase text-slate-400 mb-4">Vitals Risk Assessor</h3>
            {warnings.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>All parameters look stable and fall within standard healthy ranges. Excellent!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3.5 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-2xl text-xs leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{w.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 pt-4 mt-6 flex items-center gap-2 text-slate-500 text-[10px] leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Range parameters adhere to ABDM national clinical standards.</span>
          </div>
        </div>

      </div>

      {/* Recharts Data Visualization Dashboard Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Glucose Trends Chart */}
        <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col h-[320px] print:h-[260px] print:border-slate-300 print:text-black">
          <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono tracking-wider mb-4 print:text-indigo-600">Glucose (Fasting Blood Sugar)</span>
          <div className="flex-1 w-full text-xs">
            {glucoseData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">No glucose readings logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={glucoseData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[40, 200]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                  <Line name="Fasting Glucose (mg/dL)" type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line name="Upper Limit (Normal)" type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Blood Pressure Trends Chart */}
        <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col h-[320px] print:h-[260px] print:border-slate-300 print:text-black">
          <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono tracking-wider mb-4 print:text-indigo-600">Blood Pressure Timeline</span>
          <div className="flex-1 w-full text-xs">
            {bpData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">No BP readings logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bpData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[40, 180]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                  <Line name="Systolic BP (mmHg)" type="monotone" dataKey="systolic" stroke="#6366f1" strokeWidth={2} />
                  <Line name="Diastolic BP (mmHg)" type="monotone" dataKey="diastolic" stroke="#38bdf8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Weight / BMI Progress Chart */}
        <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col h-[320px] print:h-[260px] print:border-slate-300 print:text-black">
          <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono tracking-wider mb-4 print:text-indigo-600">Body Mass / Weight Index</span>
          <div className="flex-1 w-full text-xs">
            {weightData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">No weight entries logged.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                  <Line name="Weight (kg)" type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Medication Adherence Chart */}
        <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col h-[320px] print:h-[260px] print:border-slate-300 print:text-black">
          <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono tracking-wider mb-4 print:text-indigo-600">Medication Adherence Compliance</span>
          <div className="flex-1 w-full text-xs">
            {adherenceData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic font-mono">No active drug compliance records. Upload prescriptions.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={adherenceData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend />
                  <Bar name="Adherence (%)" dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Analytics;
