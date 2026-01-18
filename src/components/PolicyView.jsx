import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lightbulb, TrendingUp, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { generatePolicy } from '../utils/policyEngine';

const PolicyView = ({ data }) => {
    if (!data || !data.clustered) return null;

    // Grouping by cluster label
    const clusters = {};
    data.clustered.forEach(item => {
        if (!clusters[item.clusterLabel]) {
            clusters[item.clusterLabel] = [];
        }
        clusters[item.clusterLabel].push(item._name);
    });

    return (
        <div className="space-y-12 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-3xl font-bold italic-font flex items-center gap-3">
                        <ShieldCheck className="text-blue-500" size={32} />
                        Data-Driven Strategy Matrix
                    </h2>
                    <p className="text-slate-400 mt-2">Matriks rekomendasi kebijakan berbasis hasil analisis pengelompokan (K-Means).</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-white/5">
                    <FileText size={18} /> Ekspor Dokumen Kebijakan
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {Object.keys(clusters).map((label, idx) => {
                    const policy = generatePolicy(label);
                    const isMaju = label.includes('Maju');
                    const isTertinggal = label.includes('Tertinggal');

                    return (
                        <motion.div
                            key={label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`glass-card p-8 border-t-4 ${isMaju ? 'border-blue-500' : isTertinggal ? 'border-red-500' : 'border-emerald-500'
                                } flex flex-col h-full ring-1 ring-white/5`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isMaju ? 'bg-blue-500/10 text-blue-400' : isTertinggal ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'
                                    }`}>
                                    {label}
                                </span>
                                {isMaju ? <TrendingUp size={20} className="text-blue-400" /> : <Lightbulb size={20} className="text-slate-400" />}
                            </div>

                            <div className="mb-6">
                                <h3 className="text-sm text-slate-500 uppercase font-bold tracking-tight mb-1">Focus Utama</h3>
                                <div className="text-xl font-bold">{policy.focus}</div>
                                <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-tighter font-mono">Strategi: {policy.strategy}</div>
                            </div>

                            <div className="flex-grow space-y-4 mb-8">
                                <h3 className="text-xs font-bold text-slate-400 uppercase">Rekomendasi Aksi:</h3>
                                {policy.recommendations.map((rec, i) => (
                                    <div key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                                        <ChevronRight size={14} className="text-blue-500 shrink-0 mt-1" />
                                        {rec}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-white/5">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Target Wilayah ({clusters[label].length})</h4>
                                <div className="flex flex-wrap gap-2">
                                    {clusters[label].slice(0, 5).map(name => (
                                        <span key={name} className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-400 truncate max-w-[120px]">
                                            {name}
                                        </span>
                                    ))}
                                    {clusters[label].length > 5 && (
                                        <span className="text-[10px] text-slate-600 font-bold">+{clusters[label].length - 5} lainnya</span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl flex gap-4 items-start">
                <AlertCircle className="text-amber-500 shrink-0" size={24} />
                <div className="space-y-1">
                    <p className="font-bold text-amber-500 text-sm">Catatan Validitas Data</p>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Rekomendasi ini disusun secara otomatis menggunakan pembobotan variabel X1-X5 yang dipetakan oleh pengguna. Pastikan kolom yang dipetakan sebagai "IPM" (Indeks Pembangunan Manusia) benar-benar mewakili data pembangunan daerah untuk akurasi scatter plot di tab Analisis.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PolicyView;
