import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Stethoscope, KeyRound, QrCode, ShieldCheck, FileText,
  User, AlertTriangle, RefreshCw, CheckCircle2
} from 'lucide-react';

const DoctorPortal: React.FC = () => {
  const { doctorSession, verifyDoctorOtp, verifyDoctorQr, doctorLogout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab, setTab] = useState<'otp' | 'qr'>('otp');
  const [doctorName, setDoctorName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [qrHash, setQrHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const qrParam = searchParams.get('qr');
    if (qrParam) {
      setTab('qr');
      setQrHash(qrParam);
      handleQrVerify(qrParam);
    }
  }, [searchParams]);

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const res = await verifyDoctorOtp(otpCode, doctorName);
    setLoading(false);

    if (res.success) {
      setSuccess(res.message);
    } else {
      setError(res.message);
    }
  };

  const handleQrVerify = async (hash?: string) => {
    const hashToUse = hash || qrHash;
    if (!hashToUse.trim()) {
      setError('QR hash is required.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const res = await verifyDoctorQr(hashToUse.trim());
    setLoading(false);

    if (res.success) {
      setSuccess(res.message);
    } else {
      setError(res.message);
    }
  };

  if (doctorSession?.verified) {
    const { patient, documents } = doctorSession;

    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 text-slate-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Stethoscope className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Doctor Portal — Verified Access</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Patient Medical Profile</h2>
            <p className="text-slate-400 text-sm mt-1">
              Consent-granted view for {doctorSession.doctorName}. Access is time-limited and audited.
            </p>
          </div>
          <button
            onClick={() => {
              doctorLogout();
              navigate('/doctor-portal');
            }}
            className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold hover:bg-rose-500/20 transition-all"
          >
            End Session
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="glass p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{patient.name}</h3>
                <span className="text-xs text-slate-400">{patient.gender}, {patient.age} years</span>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 space-y-2 text-sm">
              {patient.abhaId && (
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs">ABHA ID</span>
                  <span className="text-emerald-400 font-mono text-xs">{patient.abhaId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Phone</span>
                <span className="text-slate-200 text-xs font-mono">{patient.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Email</span>
                <span className="text-slate-200 text-xs">{patient.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>ABDM Consent Manager — access verified via {doctorSession.accessType === 'otp' ? 'OTP' : 'QR code'}</span>
            </div>
          </div>

          <div className="lg:col-span-2 glass p-6 rounded-3xl border border-slate-800">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base">Shared Medical Records ({documents.length})</h3>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No records were included in this consent grant.
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {documents.map((doc: any) => {
                  const id = doc._id || doc.id;
                  return (
                    <div key={id} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-bold text-indigo-400 uppercase font-mono">
                            {doc.documentType.replace('_', ' ')}
                          </span>
                          <h4 className="font-bold text-sm text-slate-200 mt-1">{doc.fileName}</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {doc.extractedData?.doctorName} · {doc.extractedData?.hospitalName}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                      </div>

                      {doc.extractedData?.diagnosis?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {doc.extractedData.diagnosis.map((d: string, i: number) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded-md font-semibold">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}

                      {doc.extractedData?.medications?.length > 0 && (
                        <div className="text-xs space-y-1">
                          <span className="text-slate-500 font-semibold uppercase text-[9px]">Medications</span>
                          {doc.extractedData.medications.map((m: any, i: number) => (
                            <p key={i} className="text-slate-300">
                              {m.name} {m.dosage} — {m.frequency}
                            </p>
                          ))}
                        </div>
                      )}

                      {doc.extractedData?.labValues?.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {doc.extractedData.labValues.map((lab: any, i: number) => (
                            <div key={i} className="p-2 bg-slate-950/60 rounded-lg text-[10px]">
                              <span className="text-slate-500 block">{lab.parameter}</span>
                              <span className={`font-bold ${lab.status === 'high' ? 'text-rose-400' : lab.status === 'low' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {lab.value} {lab.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {doc.ocrText && (
                        <details className="text-xs">
                          <summary className="text-slate-500 cursor-pointer hover:text-slate-300">View OCR text</summary>
                          <pre className="mt-2 p-3 bg-slate-950/60 rounded-xl text-emerald-400/80 font-mono text-[10px] whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {doc.ocrText}
                          </pre>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center bg-[#0f172a] text-slate-100 px-6 py-12">
      <div className="absolute top-10 left-10 w-[30vw] h-[30vw] rounded-full bg-indigo-500/5 blur-[80px]" />
      <div className="absolute bottom-10 right-10 w-[30vw] h-[30vw] rounded-full bg-emerald-500/5 blur-[80px]" />

      <div className="w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-slate-800/80">
        <div className="px-8 pt-8 pb-6 text-center border-b border-slate-800 bg-slate-900/40">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Doctor Portal</h2>
          <p className="text-slate-400 text-xs mt-1.5">
            Verify patient consent via OTP or QR scan to access shared records.
          </p>
        </div>

        <div className="flex border-b border-slate-800 bg-slate-900/20 text-sm font-medium">
          <button
            onClick={() => { setTab('otp'); setError(''); }}
            className={`flex-1 py-4 text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
              tab === 'otp'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            OTP Access
          </button>
          <button
            onClick={() => { setTab('qr'); setError(''); }}
            className={`flex-1 py-4 text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
              tab === 'qr'
                ? 'border-indigo-500 text-indigo-400 font-semibold bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR Scan
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {tab === 'otp' ? (
            <form onSubmit={handleOtpVerify} className="space-y-5">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Doctor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dr. Ramesh Kumar"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500/60 text-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  Patient OTP (6 digits)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter OTP from patient"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="block w-full text-center tracking-[0.5em] font-bold py-3 bg-slate-900/60 border border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500/60 text-slate-200"
                />
                <p className="text-[10px] text-slate-500 mt-2">OTP expires in 10 minutes. Single use only.</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Verify & Access Records'}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  QR Consent Hash
                </label>
                <input
                  type="text"
                  placeholder="QR-xxxxxxxxxxxx"
                  value={qrHash}
                  onChange={(e) => setQrHash(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl focus:outline-none focus:border-indigo-500/60 text-slate-200 font-mono text-sm"
                />
                <p className="text-[10px] text-slate-500 mt-2">Paste the hash from the patient&apos;s QR code or scan link.</p>
              </div>
              <button
                type="button"
                onClick={() => handleQrVerify()}
                disabled={loading || !qrHash.trim()}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                {loading ? 'Verifying...' : 'Verify QR Access'}
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back to MyHealthMate Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPortal;
