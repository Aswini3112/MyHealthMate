import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Heart, Mail, Lock } from 'lucide-react';

const Auth: React.FC = () => {
  const { loginWithAbha, verifyAbhaOtp, registerRegular, loginRegular } = useAuth();



  const navigate = useNavigate();
  
  const [tab, setTab] = useState<'abha' | 'register' | 'login'>('abha');
  const [abhaId, setAbhaId] = useState('');

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [txnId, setTxnId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  


  // Register Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [password, setPassword] = useState('');
  const [abhaIdManual, setAbhaIdManual] = useState('');


  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const clearForm = () => {
    setError('');
    setOtpSent(false);
    setOtp('');
  };

  const handleAbhaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!otpSent) {
      // Step 1: Send OTP
      const res = await loginWithAbha(abhaId);
      setLoading(false);
      if (res.success) {
        setOtpSent(true);
        setTxnId(res.transactionId || '');
      } else {
        setError(res.message);
      }
    } else {
      // Step 2: Verify OTP
      const res = await verifyAbhaOtp(abhaId, otp, txnId);
      setLoading(false);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setError(res.message);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const regData = {
      name,
      email,
      phone,
      age,
      gender,
      password,
      abhaId: abhaIdManual ? abhaIdManual : undefined
    };


    const res = await registerRegular(regData);
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginRegular({ email: loginEmail, password: loginPass });
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex items-center justify-center bg-[#0f172a] text-slate-100 px-6 py-12">
      {/* Background Glows */}
      <div className="absolute top-10 left-10 w-[30vw] h-[30vw] rounded-full bg-emerald-500/5 blur-[80px]" />
      <div className="absolute bottom-10 right-10 w-[30vw] h-[30vw] rounded-full bg-indigo-500/5 blur-[80px]" />

      <div className="w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl relative z-10 border border-slate-800/80">
        {/* Logo and Greeting */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-slate-800 bg-slate-900/40">
          <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 pulse-primary">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gradient">Welcome to MyHealthMate</h2>
          <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Manage files, review diagnostics, and share consents securely.
          </p>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-800 bg-slate-900/20 text-sm font-medium">
          <button
            onClick={() => { setTab('abha'); clearForm(); }}
            className={`flex-1 py-4 text-center border-b-2 transition-all ${
              tab === 'abha' 
                ? 'border-emerald-500 text-emerald-400 font-semibold bg-emerald-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Manual Login
          </button>

          <button
            onClick={() => { setTab('register'); clearForm(); }}
            className={`flex-1 py-4 text-center border-b-2 transition-all ${
              tab === 'register' 
                ? 'border-emerald-500 text-emerald-400 font-semibold bg-emerald-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => { setTab('login'); clearForm(); }}
            className={`flex-1 py-4 text-center border-b-2 transition-all ${
              tab === 'login' 
                ? 'border-emerald-500 text-emerald-400 font-semibold bg-emerald-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Card Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {/* TAB 1: ABHA LOGIN */}
          {tab === 'abha' && (
            <form onSubmit={handleAbhaSubmit} className="space-y-6">
              {!otpSent ? (
                <div>

                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2.5">
                    Enter ABHA ID
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="91-9283-1283-9128"
                      value={abhaId}
                      onChange={(e) => setAbhaId(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-slate-200 placeholder-slate-600 transition-all font-mono"
                    />
                  </div>

                </div>
              ) : (
                <div className="space-y-4">

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2.5">
                      Verify OTP (6 digits)
                    </label>
                      <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full text-center tracking-[0.5em] font-bold py-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 text-slate-200 placeholder-slate-600 transition-all"
                    />

                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
              >
                {loading ? 'Processing...' : otpSent ? 'Verify & Link Profile' : 'Request OTP'}
              </button>
            </form>
          )}

          {/* TAB 2: REGULAR REGISTER */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold uppercase mb-1.5">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-3 pr-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500/60 text-slate-200 placeholder-slate-600 transition-all text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500/60 text-slate-200 placeholder-slate-600 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-400 text-[11px] font-semibold uppercase mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="9988776655"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500/60 text-slate-200 placeholder-slate-600 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold uppercase mb-1.5">Age</label>
                  <input
                    type="number"
                    required
                    placeholder="38"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500/60 text-slate-200 placeholder-slate-600 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold uppercase mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500/60 text-slate-200 text-sm"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold uppercase mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500/60 text-slate-200 placeholder-slate-600 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-slate-400 text-[11px] font-semibold uppercase mb-1.5">ABHA ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 91-XXXX-XXXX-XXXX"
                  value={abhaIdManual}
                  onChange={(e) => setAbhaIdManual(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:border-emerald-500/60 text-slate-200 placeholder-slate-600 transition-all text-sm font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  If you already have an official government ABHA ID, enter it here.
                </p>
              </div>


              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
              >
                {loading ? 'Creating Account...' : 'Complete Sign Up'}
              </button>
            </form>
          )}

          {/* TAB 3: REGULAR LOGIN */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="rajesh.kumar@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl focus:outline-none focus:border-emerald-500/60 text-slate-200 placeholder-slate-600 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl focus:outline-none focus:border-emerald-500/60 text-slate-200 placeholder-slate-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-primary text-white font-semibold text-sm hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
