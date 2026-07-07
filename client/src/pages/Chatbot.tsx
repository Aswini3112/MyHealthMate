import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bot, Send, Globe, AlertTriangle, ShieldCheck,
  Cpu
} from 'lucide-react';
import { API_BASE } from '../config';



const Chatbot: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<'english' | 'hindi' | 'tamil'>('english');
  const [sending, setSending] = useState(false);

  // Medical context preview states
  const [medicalContext, setMedicalContext] = useState({
    conditions: [] as string[],
    medications: [] as any[],
    metrics: [] as any[]
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchChatHistory();
    fetchMedicalContext();
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Scroll to bottom when messages load/add
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchChatHistory = async () => {
    if (!user) return;
    try {
      const patientId = user._id || user.id;
      const res = await fetch(`${API_BASE}/chatbot/history/${patientId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicalContext = async () => {
    if (!user) return;
    try {
      const patientId = user._id || user.id;
      
      const docsRes = await fetch(`${API_BASE}/documents/patient/${patientId}`);
      const docsData = await docsRes.json();
      
      const metricsRes = await fetch(`${API_BASE}/metrics/patient/${patientId}`);
      const metricsData = await metricsRes.json();

      const conditions: string[] = [];
      const medications: any[] = [];
      const metrics: any[] = [];

      if (docsData.success) {
        docsData.documents.forEach((d: any) => {
          if (d.extractedData?.diagnosis) conditions.push(...d.extractedData.diagnosis);
          if (d.extractedData?.medications) medications.push(...d.extractedData.medications);
        });
      }

      if (metricsData.success) {
        // Get latest of each type
        const latest: Record<string, any> = {};
        metricsData.metrics.forEach((m: any) => {
          const key = m.metricType;
          if (!latest[key] || new Date(m.recordedDate) > new Date(latest[key].recordedDate)) {
            latest[key] = m;
          }
        });
        Object.keys(latest).forEach(k => {
          metrics.push({ type: latest[k].metricType, value: latest[k].value, unit: latest[k].unit });
        });
      }

      setMedicalContext({
        conditions: Array.from(new Set(conditions)),
        medications: medications.slice(0, 4), // Cap at 4
        metrics
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !user || sending) return;

    setInputText('');
    setSending(true);

    // Append raw client side message temporarily for responsive feel
    const tempUserMsg = {
      _id: 'temp-usr-' + Date.now(),
      message: text,
      response: '...',
      language,
      createdAt: new Date().toISOString(),
      isTemp: true
    };

    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const patientId = user._id || user.id;
      const res = await fetch(`${API_BASE}/chatbot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          message: text,
          language
        })
      });

      const data = await res.json();
      if (data.success) {
        // Replace temp message with server saved message
        setMessages(prev => prev.filter(m => !m.isTemp).concat(data.chat));
      }
    } catch (err) {
      console.error(err);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => !m.isTemp));
    } finally {
      setSending(false);
    }
  };

  const suggestionChips = [
    'Explain my fasting glucose trend',
    'What diet modifications should I make?',
    'Explain Telmisartan usage & frequency',
    'Review my recent blood pressure vitals'
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10 text-slate-100">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">AI Health Companion</h2>
        <p className="text-slate-400 text-sm mt-1">Consult Amazon Bedrock AI, fully context-aware of your uploaded medical history.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8 items-stretch h-[70vh]">
        
        {/* Left Column: Context Preview */}
        <div className="glass p-6 rounded-3xl border border-slate-800 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-emerald-400 pb-4 border-b border-slate-800">
              <Cpu className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">System Context Injected</h3>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Conditions</span>
              {medicalContext.conditions.length === 0 ? (
                <p className="text-xs text-slate-600 italic">None imported</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {medicalContext.conditions.map((c, i) => (
                    <span key={i} className="text-[10px] px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/15 rounded-lg font-medium">{c}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Medications */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Medications</span>
              {medicalContext.medications.length === 0 ? (
                <p className="text-xs text-slate-600 italic">None imported</p>
              ) : (
                <div className="space-y-1.5">
                  {medicalContext.medications.map((m, i) => (
                    <div key={i} className="p-2 bg-slate-900/60 border border-slate-800 rounded-xl text-[10px] flex justify-between">
                      <span className="font-semibold text-slate-300">{m.name}</span>
                      <span className="text-slate-500">{m.dosage}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vitals */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Latest Vitals</span>
              {medicalContext.metrics.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No vitals logged</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {medicalContext.metrics.map((m, i) => (
                    <div key={i} className="p-2 bg-slate-900/60 border border-slate-800 rounded-xl text-[10px]">
                      <span className="text-slate-500 block uppercase font-bold tracking-wide text-[8px]">{m.type.replace('bp_', '')}</span>
                      <span className="font-semibold text-slate-200 mt-0.5">{m.value} {m.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center gap-2 text-slate-500 text-[10px] leading-relaxed">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Context complies with HIPAA privacy regulations.</span>
          </div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="lg:col-span-3 glass rounded-3xl border border-slate-800 flex flex-col overflow-hidden">
          
          {/* Chat header with language selector */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center pulse-primary">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-200">MyHealthMate Companion</h3>
                <span className="text-[10px] text-slate-500 font-mono">Bedrock Llama 3 Client</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-300 outline-none"
              >
                <option value="english">🇬🇧 English</option>
                <option value="hindi">🇮🇳 Hindi (सर्वम एआई)</option>
                <option value="tamil">🇮🇳 Tamil (सर्वम एआई)</option>
              </select>
            </div>
          </div>

          {/* Messages Log Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            
            {/* System welcome bubble */}
            <div className="flex items-start gap-3 max-w-[85%]">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 text-indigo-400">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs leading-relaxed text-slate-300">
                <p>Hello! I am your AI Health Companion. I have synchronized with your digital health record profile and am ready to review your laboratory values, vitals charts, or answer medication queries. What can I do for you today?</p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-6 text-slate-600 text-xs font-mono">Syncing dialog transcripts...</div>
            ) : (
              messages.map((msg) => (
                <React.Fragment key={msg._id}>
                  {/* User Bubble */}
                  <div className="flex items-start gap-3 max-w-[85%] ml-auto flex-row-reverse">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed text-slate-200">
                      <p>{msg.message}</p>
                    </div>
                  </div>

                  {/* AI Bubble */}
                  <div className="flex items-start gap-3 max-w-[85%]">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 text-indigo-400">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                      {msg.response === '...' ? (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75" />
                          <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150" />
                        </div>
                      ) : (
                        <p>{msg.response}</p>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick chips / Suggestions */}
          {messages.length < 3 && (
            <div className="px-6 py-2 flex flex-wrap gap-2 shrink-0">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="px-3 py-1.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-[10px] font-semibold transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Form and Safety Disclaimer Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/20 shrink-0 space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about vitals, explanations, recommendations..."
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={sending || !inputText.trim()}
                className="px-5 bg-gradient-primary hover:opacity-95 disabled:opacity-40 text-white rounded-2xl flex items-center justify-center shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-600 text-center uppercase tracking-wider font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500/60" />
              <span>Simulated Bedrock client. Consult your medical professional for diagnoses.</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Chatbot;
