import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Columns, CheckCircle2, AlertCircle, ArrowRight, HelpCircle, Table } from 'lucide-react';

const ColumnMapper = ({ rawData, onComplete, onCancel }) => {
    const [columns, setColumns] = useState([]);
    const [mapping, setMapping] = useState({
        region: '',
        x1: '',
        x2: '',
        x3: '',
        x4: '',
        x5: ''
    });

    const thesisVariables = [
        { key: 'region', label: 'Nama Wilayah', type: 'string', desc: 'Kolom berisi nama Kabupaten/Kota' },
        { key: 'x1', label: 'Variabel X1', type: 'number', desc: 'Saran: Isi dengan data Listrik' },
        { key: 'x2', label: 'Variabel X2', type: 'number', desc: 'Saran: Isi dengan data Sinyal/Internet' },
        { key: 'x3', label: 'Variabel X3', type: 'number', desc: 'Saran: Isi dengan data Sekolah/Fasilitas' },
        { key: 'x4', label: 'Variabel X4', type: 'number', desc: 'Saran: Isi dengan data Guru/SDM' },
        { key: 'x5', label: 'Variabel X5', type: 'number', desc: 'Saran: Isi dengan data IPM/Ekonomi' },
    ];

    useEffect(() => {
        if (rawData && rawData.length > 0) {
            const cols = Object.keys(rawData[0]);
            setColumns(cols);

            // Smart Auto-Mapping
            const newMapping = { ...mapping };
            cols.forEach(col => {
                const c = col.toLowerCase();
                if (c.includes('wilayah') || c.includes('kabupaten') || c.includes('nama')) newMapping.region = col;
                if (c.includes('listrik') || c.includes('daya')) newMapping.x1 = col;
                if (c.includes('sinyal') || c.includes('4g') || c.includes('warnet')) newMapping.x2 = col;
                if (c.includes('internet') || c.includes('sekolah') || c.includes('pos')) newMapping.x3 = col;
                if (c.includes('guru') || c.includes('ekspedisi')) newMapping.x4 = col;
                if (c.includes('ipm') || c.includes('hdi')) newMapping.x5 = col;
            });
            setMapping(newMapping);
        }
    }, [rawData]);

    const handleDone = () => {
        if (!mapping.region) {
            alert("Mohon pilih kolom 'Nama Wilayah'.");
            return;
        }
        onComplete(mapping);
    };

    const getPreview = (colName) => {
        if (!colName) return "";
        return rawData.slice(0, 3).map(row => row[colName] || "-").join(" | ");
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 max-w-5xl w-full mx-auto shadow-2xl border-white/10"
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                        <Table className="text-white" size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold italic-font">Data Variable Mapping</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Petakan kolom dari file Anda ke variabel analisis kami.
                        </p>
                    </div>
                </div>
                <div className="px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                    <span className="text-xs text-slate-500 font-mono">Found {columns.length} Columns</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 mb-10">
                {thesisVariables.map((v) => (
                    <div key={v.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                {v.label}
                            </label>
                            <div className="text-[10px] text-slate-600 italic font-medium">{v.desc}</div>
                        </div>

                        <div className="relative group">
                            <select
                                value={mapping[v.key]}
                                onChange={(e) => setMapping({ ...mapping, [v.key]: e.target.value })}
                                className={`w-full bg-slate-900 border ${mapping[v.key] ? 'border-blue-500/50 bg-blue-500/5 ring-1 ring-blue-500/20' : 'border-white/10'} rounded-xl px-4 py-3.5 text-sm focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none shadow-inner`}
                            >
                                <option value="">-- Lewati / Tidak Ada --</option>
                                {columns.map(col => (
                                    <option key={col} value={col}>{col || "Tanpa Judul"}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                <Columns size={14} />
                            </div>
                        </div>

                        {mapping[v.key] && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl"
                            >
                                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold mb-1">
                                    <CheckCircle2 size={12} /> BERHASIL DIPETAKAN
                                </div>
                                <div className="text-[10px] text-slate-400 truncate font-mono">
                                    Isi Data: {getPreview(mapping[v.key])}...
                                </div>
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-between p-6 bg-slate-800/50 border border-white/5 rounded-2xl">
                <div className="flex gap-4 items-center">
                    <AlertCircle className="text-blue-400 flex-shrink-0" size={24} />
                    <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                        <strong>Catatan:</strong> Sistem telah menggabungkan judul kolom yang bertingkat (misal: "Warnet" + "2024"). Gunakan <strong>Isi Data</strong> sebagai panduan jika judul terlihat asing.
                    </p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Batalkan
                    </button>
                    <button
                        onClick={handleDone}
                        className="flex-grow md:flex-grow-0 bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-xl font-bold shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        Mulai Analisis <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ColumnMapper;
