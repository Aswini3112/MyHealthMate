import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
FileText, Search, Filter, UploadCloud, Eye, 

  Check, RefreshCw, FileUp, Sparkles, UserCheck, X, AlertCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const Records: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('prescription');
  const [uploadDoctor, setUploadDoctor] = useState('');
  const [uploadHospital, setUploadHospital] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Inspector Modal States
  const [activeInspectorDoc, setActiveInspectorDoc] = useState<any | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    fetchDocuments();
  }, [isAuthenticated, user, selectedCategory, searchQuery]);

  const fetchDocuments = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const patientId = user._id || user.id;
      let url = `${API_BASE}/documents/patient/${patientId}`;
      const params = new URLSearchParams();
      
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setUploadSuccess(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !user) return;

    setUploading(true);
    setUploadProgress(10);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('patientId', user._id || user.id || '');
      formData.append('documentType', uploadDocType);
      formData.append('doctorName', uploadDoctor);
      formData.append('hospitalName', uploadHospital);

      // Simulate network progress bar
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 20;
        });
      }, 200);

      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData
      });
      
      clearInterval(interval);
      setUploadProgress(100);

      const data = await res.json();
      if (data.success) {
        setUploadSuccess(true);
        setUploadFile(null);
        setUploadDoctor('');
        setUploadHospital('');
        // Refresh records
        fetchDocuments();
      } else {
        setErrorMsg(data.message || 'Failed to upload document.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error occurred during report upload.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const [errorMsg, setErrorMsg] = useState('');

  const toggleShareConsent = async (docId: string, currentShared: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/documents/${docId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShared: !currentShared })
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.map(d => {
          const id = d._id || d.id;
          if (id === docId) {
            return { ...d, isShared: !currentShared, shareCount: !currentShared ? d.shareCount + 1 : d.shareCount };
          }
          return d;
        }));
        if (activeInspectorDoc && (activeInspectorDoc._id === docId || activeInspectorDoc.id === docId)) {
          setActiveInspectorDoc((prev: any) => ({
            ...prev,
            isShared: !currentShared,
            shareCount: !currentShared ? prev.shareCount + 1 : prev.shareCount
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'prescription', label: 'Prescriptions' },
    { value: 'lab_report', label: 'Lab Reports' },
    { value: 'imaging', label: 'Imaging (X-ray, MRI)' },
    { value: 'discharge_summary', label: 'Discharges' },
    { value: 'vaccination', label: 'Vaccinations' },
    { value: 'insurance', label: 'Insurance' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 relative z-10 text-slate-100">
      
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Records Management Console</h2>
        <p className="text-slate-400 text-sm mt-1">Upload reports, scan with Amazon Textract OCR, and check extracted diagnostic entities.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Upload Column */}
        <div className="glass p-6 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-200">Amazon OCR Ingestion</h3>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errorMsg}
              </div>
            )}
            
            {uploadSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4" />
                Report analyzed and stored successfully!
              </div>
            )}

            {/* Drag & Drop File Container */}
            <div className="relative border-2 border-dashed border-slate-800 hover:border-emerald-500/40 rounded-2xl p-6 text-center bg-slate-900/20 transition-all flex flex-col items-center justify-center min-h-[140px] cursor-pointer">
              <input
                type="file"
                required
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
              {uploadFile ? (
                <div>
                  <p className="text-xs font-semibold text-emerald-400">{uploadFile.name}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-300">Choose file or drag here</p>
                  <p className="text-[10px] text-slate-500 mt-1">Supports PDF, PNG, JPG (Max 5MB)</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Category</label>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
              >
                <option value="prescription">Prescription</option>
                <option value="lab_report">Lab Report</option>
                <option value="imaging">Imaging (X-ray, MRI, CT)</option>
                <option value="discharge_summary">Discharge Summary</option>
                <option value="vaccination">Vaccination Record</option>
                <option value="insurance">Insurance Document</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Doctor's Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Dr. Ramesh Kumar"
                value={uploadDoctor}
                onChange={(e) => setUploadDoctor(e.target.value)}
                className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">Hospital Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Apollo Clinics"
                value={uploadHospital}
                onChange={(e) => setUploadHospital(e.target.value)}
                className="block w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Extracting medical entities...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !uploadFile}
              className="w-full py-3 bg-gradient-primary text-white font-semibold text-xs rounded-xl hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.15)]"
            >
              <FileUp className="w-4 h-4" />
              {uploading ? 'Analyzing Document...' : 'Ingest & Scan'}
            </button>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters & Search Header */}
          <div className="glass p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search documents, diagnoses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 w-full"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full md:w-44 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Documents Listing */}
          {loading && documents.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
              Updating clinical database...
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">No medical records found</p>
              <p className="text-xs text-slate-500 mt-1">Upload prescriptions or lab reports to run OCR scanning.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {documents.map((doc) => {
                const id = doc._id || doc.id;
                return (
                  <div key={id} className="glass p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-bold text-indigo-400 uppercase font-mono tracking-wider px-2 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                          {doc.documentType.replace('_', ' ')}
                        </span>
                        <span className="text-slate-500 text-[10px] font-mono">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                      
                      <h4 className="font-bold text-slate-200 text-sm mt-3.5 line-clamp-1">{doc.fileName}</h4>
                      <p className="text-slate-500 text-xs mt-1 truncate">
                        Provider: {doc.extractedData?.doctorName || 'Unknown Doctor'}
                      </p>
                      
                      {/* Diagnostic tags summary */}
                      {doc.extractedData?.diagnosis && doc.extractedData.diagnosis.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {doc.extractedData.diagnosis.map((d: string, idx: number) => (
                            <span key={idx} className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/10">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 mt-2">
                      <button
                        onClick={() => toggleShareConsent(id, doc.isShared)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          doc.isShared 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        {doc.isShared ? 'Shared' : 'Restrict'}
                      </button>

                      <button
                        onClick={() => setActiveInspectorDoc(doc)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-slate-100 rounded-lg text-[10px] font-bold transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect OCR
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* OCR INSPECTOR SPLIT PANEL MODAL */}
      {activeInspectorDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6">
          <div className="bg-[#1e293b] border border-slate-800 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">Amazon Textract & Comprehend Inspector</h3>
                  <span className="text-slate-400 text-xs font-mono">{activeInspectorDoc.fileName}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveInspectorDoc(null)}
                className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Split Panel Body */}
            <div className="flex-1 grid md:grid-cols-2 overflow-hidden">
              
              {/* Left Panel: Raw OCR Scanned Text */}
              <div className="p-6 overflow-y-auto border-r border-slate-800 bg-slate-900/30 flex flex-col">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Raw Scanned Document Text (OCR)</span>
                <pre className="flex-1 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-emerald-400/90 font-mono whitespace-pre-wrap leading-relaxed overflow-y-auto select-text">
                  {activeInspectorDoc.ocrText}
                </pre>
              </div>

              {/* Right Panel: Comprehend Medical Entities */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-3">Clinical Metadata</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs">
                      <p className="text-slate-400">Doctor / Provider</p>
                      <p className="font-semibold text-slate-200 mt-1">{activeInspectorDoc.extractedData?.doctorName || 'Unknown Doctor'}</p>
                    </div>
                    <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-xs">
                      <p className="text-slate-400">Facility / Clinic</p>
                      <p className="font-semibold text-slate-200 mt-1">{activeInspectorDoc.extractedData?.hospitalName || 'Unknown Facility'}</p>
                    </div>
                  </div>
                </div>

                {/* Extracted Diagnoses */}
                {activeInspectorDoc.extractedData?.diagnosis && activeInspectorDoc.extractedData.diagnosis.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-3">Identified Conditions (Comprehend Medical)</span>
                    <div className="flex flex-wrap gap-2">
                      {activeInspectorDoc.extractedData.diagnosis.map((diag: string, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold">
                          {diag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Medications */}
                {activeInspectorDoc.extractedData?.medications && activeInspectorDoc.extractedData.medications.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-3">Active Medications & Dosages</span>
                    <div className="space-y-2">
                      {activeInspectorDoc.extractedData.medications.map((med: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-900/40 border border-slate-800/60 rounded-xl text-xs">
                          <div>
                            <p className="font-bold text-slate-200">{med.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{med.frequency} | {med.duration}</p>
                          </div>
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md font-semibold font-mono text-[10px]">
                            {med.dosage}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Lab Values */}
                {activeInspectorDoc.extractedData?.labValues && activeInspectorDoc.extractedData.labValues.length > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-3">Extracted Lab Parameters</span>
                    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/20">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-900/60 text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase tracking-wider">
                            <th className="p-3">Test Parameter</th>
                            <th className="p-3 text-center">Result</th>
                            <th className="p-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeInspectorDoc.extractedData.labValues.map((lab: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-800/40 last:border-0 hover:bg-slate-900/20">
                              <td className="p-3 font-semibold text-slate-300">{lab.parameter}</td>
                              <td className="p-3 text-center font-mono text-slate-200">{lab.value} {lab.unit}</td>
                              <td className="p-3 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded font-extrabold uppercase text-[9px] ${
                                  lab.status === 'high' 
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                    : lab.status === 'low' 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {lab.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/20">
              <span className="text-[10px] text-slate-500 font-mono">Shared log count: {activeInspectorDoc.shareCount} accesses</span>
              <div className="flex gap-3">
                <button
                  onClick={() => toggleShareConsent(activeInspectorDoc._id || activeInspectorDoc.id, activeInspectorDoc.isShared)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    activeInspectorDoc.isShared
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {activeInspectorDoc.isShared ? 'Restrict sharing' : 'Allow doctor sharing'}
                </button>
                <button
                  onClick={() => setActiveInspectorDoc(null)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Records;
