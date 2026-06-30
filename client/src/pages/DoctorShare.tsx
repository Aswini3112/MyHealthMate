import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Share2, QrCode, KeyRound, Clock, 
  ChevronRight, RefreshCw, ClipboardList, CheckCircle2
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const DoctorShare: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Share Form state
  const [doctorName, setDoctorName] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [durationHours, setDurationHours] = useState('24');

  // Outputs
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [generatedQr, setGeneratedQr] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchShareContext();
  }, [isAuthenticated, user]);

  const fetchShareContext = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const patientId = user._id || user.id;

      // 1. Fetch patient's documents
      const docsRes = await fetch(`${API_BASE}/documents/patient/${patientId}`);
      const docsData = await docsRes.json();
      if (docsData.success) {
        setDocuments(docsData.documents);
        // By default, select all documents
        setSelectedDocs(docsData.documents.map((d: any) => d._id || d.id));
      }

      // 2. Fetch doctor access audit logs
      const logsRes = await fetch(`${API_BASE}/doctor/patient/${patientId}/access-logs`);
      const logsData = await logsRes.json();
      if (logsData.success) {
        setLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocToggle = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleGenerateOtp = async () => {
    if (!user || !doctorName.trim()) return;
    setGeneratedQr('');
    
    try {
      const res = await fetch(`${API_BASE}/doctor/generate-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user._id || user.id,
          doctorName,
          allowedRecords: selectedDocs
        })
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedOtp(data.otpCode);
        setExpiresAt(new Date(data.expiresAt).toLocaleTimeString());
        fetchShareContext(); // Refresh logs list
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    try {
      const res = await fetch(`${API_BASE}/doctor/revoke/${accessId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchShareContext();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQr = async () => {
    if (!user || !doctorName.trim()) return;
    setGeneratedOtp('');

    try {
      const res = await fetch(`${API_BASE}/doctor/generate-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: user._id || user.id,
          doctorName,
          allowedRecords: selectedDocs,
          durationHours
        })
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedQr(data.qrCodeHash);
        setExpiresAt(new Date(data.expiresAt).toLocaleTimeString());
        fetchShareContext();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <span>Synchronizing security consent protocols...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10 text-slate-100">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Consent Manager & Sharing</h2>
        <p className="text-slate-400 text-sm mt-1">Generate time-bound OTP verification values or QR scan tokens, and review access logs.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Column: Generate Consent panel */}
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 text-emerald-400 pb-4 border-b border-slate-800">
            <Share2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-200">Generate Access Token</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Doctor / Facility Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Ramesh Kumar (Apollo)"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="block w-full px-3.5 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Select Reports to Include</label>
              {documents.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No reports available to share. Ingest files first.</p>
              ) : (
                <div className="max-h-[140px] overflow-y-auto border border-slate-800/80 rounded-2xl p-3.5 bg-slate-900/20 space-y-2.5">
                  {documents.map((doc) => {
                    const id = doc._id || doc.id;
                    return (
                      <label key={id} className="flex items-center gap-2.5 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={selectedDocs.includes(id)}
                          onChange={() => handleDocToggle(id)}
                          className="rounded border-slate-800 bg-slate-900 text-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="text-slate-300 truncate">{doc.fileName} ({doc.documentType})</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Access Duration (For QR Code)</label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
              >
                <option value="1">1 Hour</option>
                <option value="24">24 Hours</option>
                <option value="168">7 Days</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                type="button"
                onClick={handleGenerateOtp}
                disabled={!doctorName.trim()}
                className="py-3 bg-slate-900 hover:bg-slate-850/80 border border-slate-800 text-slate-200 hover:text-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40"
              >
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Generate OTP
              </button>
              
              <button
                type="button"
                onClick={handleGenerateQr}
                disabled={!doctorName.trim()}
                className="py-3 bg-slate-900 hover:bg-slate-850/80 border border-slate-800 text-slate-200 hover:text-slate-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40"
              >
                <QrCode className="w-4 h-4 text-indigo-400" />
                Generate QR
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Token display */}
        <div className="space-y-6">
          
          {/* OTP display */}
          {generatedOtp && (
            <div className="glass p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4 animate-fadeIn">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Secure Doctor OTP Access</span>
              <div className="text-4xl font-extrabold tracking-[0.25em] text-slate-100 py-2.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl max-w-[200px] mx-auto">
                {generatedOtp}
              </div>
              <p className="text-xs text-slate-400 px-6 leading-relaxed">
                Provide this OTP to <strong>{doctorName}</strong>. The code expires at <span className="font-mono text-emerald-400 font-bold">{expiresAt}</span> (10 minutes duration).
              </p>
            </div>
          )}

          {/* QR display */}
          {generatedQr && (
            <div className="glass p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 text-center space-y-4 animate-fadeIn">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Consent QR Scan-Token</span>
              
              {/* Scan box simulation */}
              <div className="w-40 h-40 bg-white p-3 rounded-2xl flex items-center justify-center mx-auto border-2 border-indigo-500/30">
                <div className="w-full h-full border-4 border-dashed border-slate-900 flex flex-col items-center justify-center text-slate-900 font-mono text-[9px] font-bold text-center leading-normal">
                  <QrCode className="w-14 h-14 text-indigo-600 mb-1" />
                  <span>MyHealthMate QR</span>
                  <span className="text-[8px] text-slate-500 truncate max-w-[100px]">{generatedQr}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-300">Target Doctor: {doctorName}</p>
                <p className="text-[10px] text-slate-500 leading-normal">
                  QR Hash: <span className="font-mono">{generatedQr}</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Link expires at <span className="font-semibold text-emerald-400">{expiresAt}</span> ({durationHours} hours).
                </p>
              </div>

              {/* Simulation Help CTA */}
              <div className="pt-2">
                <button
                  onClick={() => navigate(`/doctor-portal?qr=${generatedQr}`)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  Simulate QR Scan (Doctor View)
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {!generatedOtp && !generatedQr && (
            <div className="glass p-6 rounded-3xl border border-slate-800/80 text-center py-16 text-slate-500 text-xs">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <span>Input a doctor's name and select a verification token type above to display access codes.</span>
            </div>
          )}
        </div>
      </div>

      {/* Audit logs trail */}
      <div className="glass p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center gap-2 mb-6">
          <ClipboardList className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-base text-slate-200">Doctor Access Audit Logs</h3>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">No doctor access entries recorded. All consents are secure.</div>
        ) : (
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/10">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="p-4">Doctor / Specialist</th>
                  <th className="p-4">Authorization</th>
                  <th className="p-4">Records Released</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const id = log._id || log.id;
                  const isExpired = new Date() > new Date(log.expiresAt);
                  return (
                    <tr key={id} className="border-b border-slate-850 hover:bg-slate-900/20">
                      <td className="p-4 font-semibold text-slate-200">{log.doctorName}</td>
                      <td className="p-4 font-mono text-slate-400 uppercase text-[10px]">{log.accessType.replace('_', ' ')}</td>
                      <td className="p-4 font-medium text-slate-400">{log.allowedRecords?.length || 0} Reports</td>
                      <td className="p-4 text-slate-500 font-mono text-[10px]">{new Date(log.expiresAt).toLocaleString()}</td>
                      <td className="p-4 text-center">
                        {log.isUsed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px]">
                            <CheckCircle2 className="w-3 h-3" />
                            VERIFIED
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-500 border border-slate-800 font-bold text-[9px]">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-[9px]">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {!log.isUsed && !isExpired && (
                          <button
                            onClick={() => handleRevokeAccess(id)}
                            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default DoctorShare;
