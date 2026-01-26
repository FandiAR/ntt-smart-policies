import React, { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Table as TableIcon,
  Settings,
  LogOut,
  Database,
  Columns,
  Rows,
  Activity,
  FileSpreadsheet,
  Plus,
  ShieldCheck,
  Download,
  ArrowRight
} from 'lucide-react';
import FileUpload from './components/FileUpload';
import StatsCard from './components/StatsCard';
import DataChart from './components/DataChart';
import PolicyView from './components/PolicyView';
import ColumnMapper from './components/ColumnMapper';
import AnalysisView from './components/AnalysisView';
import { transformAndProcess } from './utils/dataProcessor';

function App() {
  const [datasets, setDatasets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddingMore, setIsAddingMore] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null);

  const currentData = datasets[currentIndex] || null;

  const handleDataLoaded = (newDatasets) => {
    // If multiple files, we take the first one to map (simplification)
    // In a real app, we might queue them.
    if (newDatasets && newDatasets.length > 0) {
      setPendingUpload(newDatasets[0]);
    }
  };

  const handleMappingComplete = (mapping) => {
    const processed = transformAndProcess(pendingUpload.raw, mapping, pendingUpload.fileName);
    if (processed) {
      setDatasets(prev => [...prev, processed]);
      setCurrentIndex(datasets.length);
      setActiveTab('dashboard');
    }
    setPendingUpload(null);
    setIsAddingMore(false);
    setError(null);
  };

  const handleReset = () => {
    setDatasets([]);
    setCurrentIndex(0);
    setError(null);
    setPendingUpload(null);
  };

  const renderContent = () => {
    if (activeTab === 'analysis') {
      return <AnalysisView data={currentData} />;
    }

    if (activeTab === 'table') {
      return (
        <div className="glass-card p-6 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4">Eksplorasi Data Mentah</h3>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="text-xs text-slate-500 uppercase border-b border-white/5 sticky top-0 bg-slate-900/50 backdrop-blur-md">
                <tr>
                  {currentData.columns.map(col => (
                    <th key={col} className="px-4 py-3 font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.raw.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    {currentData.columns.map(col => (
                      <td key={col} className="px-4 py-3 whitespace-nowrap">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'policy') {
      return <PolicyView data={currentData} />;
    }

    // Default: Dasbor
    return (
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard title="Total Rows" value={currentData.stats.totalRows} icon={Rows} color="blue" />
          <StatsCard title="Total Columns" value={currentData.stats.totalColumns} icon={Columns} color="emerald" />
          <StatsCard title="Siap Kebijakan" value={currentData.clustered ? "YA" : "TIDAK"} icon={Database} color="amber" />
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DataChart data={currentData.clustered || currentData.raw} columns={currentData.columns} type="bar" />
          <div className="glass-card p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="text-blue-400" size={18} /> Wawasan Otomatis
            </h3>
            <div className="flex-grow flex flex-col justify-center">
              {currentData.clustered ? (
                <div className="space-y-4">
                  <p className="text-slate-400 leading-relaxed text-sm">
                    Sistem telah berhasil mengelompokkan data ke dalam <span className="text-blue-400 font-bold">3 klaster</span> berdasarkan variabel yang Anda petakan.
                  </p>
                  <button
                    onClick={() => setActiveTab('policy')}
                    className="btn-primary w-fit flex items-center gap-2 text-sm"
                  >
                    Lihat Rekomendasi Kebijakan <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">
                  Data belum dipetakan secara optimal untuk analisis clustering.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Pratinjau Asli: {currentData.fileName}</h3>
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-500 uppercase border-b border-white/5">
              <tr>
                {currentData.columns.slice(0, 5).map(col => (
                  <th key={col} className="px-4 py-3 font-medium">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentData.raw.slice(0, 5).map((row, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  {currentData.columns.slice(0, 5).map(col => (
                    <td key={col} className="px-4 py-3">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col gap-8 sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Activity className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">PintarDash</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsAddingMore(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' && !isAddingMore && !pendingUpload ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <LayoutDashboard size={20} /> Dasbor
          </button>
          <button
            disabled={datasets.length === 0}
            onClick={() => { setActiveTab('analysis'); setIsAddingMore(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${datasets.length === 0 ? 'opacity-50 cursor-not-allowed' : activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <BarChart3 size={20} /> Analisis
          </button>
          <button
            disabled={datasets.length === 0}
            onClick={() => { setActiveTab('policy'); setIsAddingMore(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${datasets.length === 0 ? 'opacity-50 cursor-not-allowed' : activeTab === 'policy' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <ShieldCheck size={20} /> Saran Kebijakan
          </button>
          <button
            disabled={datasets.length === 0}
            onClick={() => { setActiveTab('table'); setIsAddingMore(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${datasets.length === 0 ? 'opacity-50 cursor-not-allowed' : activeTab === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <TableIcon size={20} /> Tabel Data
          </button>

          <div className="mt-8 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Datasets ({datasets.length})
          </div>
          {datasets.map((ds, idx) => (
            <button
              key={ds.id}
              onClick={() => { setCurrentIndex(idx); setIsAddingMore(false); setPendingUpload(null); }}
              className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-all truncate ${currentIndex === idx && !isAddingMore && !pendingUpload ? 'bg-white/10 text-blue-400 border border-white/10' : 'text-slate-400 hover:bg-white/5'}`}
              title={ds.fileName}
            >
              <FileSpreadsheet size={16} /> <span className="truncate">{ds.fileName}</span>
            </button>
          ))}
          <button
            onClick={() => setIsAddingMore(true)}
            className="flex items-center gap-3 px-4 py-2 text-sm text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all mt-2"
          >
            <Plus size={16} /> Tambah Dataset
          </button>
        </nav>

        <div className="pt-6 border-t border-white/10 flex flex-col gap-2">
          <a
            href="https://github.com/FandiAR/ntt-smart-policies"
            target="_blank"
            className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-white/5 rounded-xl transition-all"
          >
            <Settings size={20} /> GitHub Proyek
          </a>
          <button onClick={handleReset} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
            <LogOut size={20} /> Reset Semua
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold italic-font">Halo, Analis!</h2>
            <p className="text-slate-400 mt-1">
              {pendingUpload ? `Pemetaan Data: ${pendingUpload.fileName}` : isAddingMore ? 'Silakan upload file tambahan.' : currentData ? `Menganalisis: ${currentData.fileName}` : 'Selamat datang! Mari mulai analisis data Anda.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-300">Sistem Siap</span>
            </div>
          </div>
        </header>

        {pendingUpload ? (
          <div className="flex flex-col items-center">
            <ColumnMapper
              rawData={pendingUpload.raw}
              onComplete={handleMappingComplete}
              onCancel={() => { setPendingUpload(null); setIsAddingMore(false); }}
            />
          </div>
        ) : (datasets.length === 0 || isAddingMore) ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="w-full max-w-2xl">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 animate-shake">
                  <Activity size={20} /> {error}
                </div>
              )}
              <FileUpload onDataLoaded={handleDataLoaded} onError={setError} />

              <div className="mt-8 p-6 glass-card border-blue-500/20 bg-blue-500/5">
                <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-2">
                  <Download size={14} /> Contoh Data Tesis
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Gunakan data Akses Pendidikan NTT - Thesis Tahun 2026 (22 Wilayah) untuk uji coba cepat.
                </p>
                <div className="flex gap-4">
                  <a
                    href="/ntt_data.csv"
                    className="text-xs text-blue-400 hover:underline font-bold"
                    download
                  >
                    Unduh Contoh CSV
                  </a>
                </div>
              </div>

              {isAddingMore && datasets.length > 0 && (
                <button
                  onClick={() => setIsAddingMore(false)}
                  className="mt-4 text-slate-400 hover:text-white transition-colors block w-full text-center text-sm"
                >
                  Batal dan kembali ke dasbor
                </button>
              )}
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
}

export default App;
