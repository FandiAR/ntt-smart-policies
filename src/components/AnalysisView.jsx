import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, ZAxis, Cell, ReferenceLine
} from 'recharts';
import { Activity, Target, Users, Map, BarChart2, Info } from 'lucide-react';

const AnalysisView = ({ data }) => {
    if (!data || !data.metrics) return null;

    const { metrics, centroids, clustered, variables } = data;

    // Helper for variable labeling
    const labelMap = {
        X1: 'Listrik',
        X2: 'Sinyal 4G',
        X3: 'Internet Sek',
        X4: 'Guru Dig',
        X5: 'IPM'
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 border-l-4 border-purple-500">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="text-purple-400" size={18} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Metode Elbow (SSE)</span>
                    </div>
                    <div className="text-2xl font-bold">{metrics.sse.toFixed(4)}</div>
                    <p className="text-[10px] text-slate-500 mt-1">Sum of Squared Errors pada K=3</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-emerald-500">
                    <div className="flex items-center gap-3 mb-2">
                        <Target className="text-emerald-400" size={18} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Silhouette Score</span>
                    </div>
                    <div className="text-2xl font-bold">{metrics.silhouette.toFixed(4)}</div>
                    <p className="text-[10px] text-slate-500 mt-1">Kualitas pengelompokan (Optimal {'>'} 0.5)</p>
                </div>
                <div className="glass-card p-6 border-l-4 border-blue-500">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="text-blue-400" size={18} />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Keanggotaan Klaster</span>
                    </div>
                    <div className="text-2xl font-bold">{centroids.length} Grups</div>
                    <p className="text-[10px] text-slate-500 mt-1">Terbagi menjadi Maju, Berkembang, Tertinggal</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Elbow Method Chart */}
                <div className="glass-card p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                        <BarChart2 className="text-purple-400" size={20} /> Metode Elbow: Penentuan K Optimal
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics.elbowData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="k" stroke="#94a3b8" fontSize={12} label={{ value: 'Jumlah Cluster (k)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }} />
                                <YAxis stroke="#94a3b8" fontSize={12} label={{ value: 'SSE', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#a855f7' }}
                                />
                                <ReferenceLine x={3} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'K=3 (Siku)', position: 'top', fill: '#ef4444', fontSize: 10 }} />
                                <Line type="monotone" dataKey="sse" stroke="#a855f7" strokeWidth={3} dot={{ r: 6, fill: '#a855f7' }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 bg-purple-500/5 rounded-xl border border-purple-500/10 flex gap-3">
                        <Info className="text-purple-400 shrink-0" size={16} />
                        <p className="text-[10px] text-slate-400 leading-relaxed text-italic">
                            Berdasarkan grafik di atas, penurunan SSE melambat secara signifikan pada titik <strong>k=3</strong>, yang mengukuhkan validitas penggunaan 3 klaster sesuai standar tesis.
                        </p>
                    </div>
                </div>

                {/* Final Centroids Table */}
                <div className="glass-card p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                        <Target className="text-emerald-400" size={20} /> Nilai Centroid Akhir (Final Cluster Centers)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="text-slate-500 uppercase tracking-tighter border-b border-white/5">
                                <tr>
                                    <th className="py-3 px-2">Variabel</th>
                                    {centroids.map(c => (
                                        <th key={c.id} className="py-3 px-2 text-center">{c.label.split(' ')[0]}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                {variables.map(varKey => (
                                    <tr key={varKey} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-2 font-medium">{labelMap[varKey] || varKey}</td>
                                        {centroids.map(c => (
                                            <td key={c.id} className="py-3 px-2 text-center font-mono">
                                                {(c.centroid[`_${varKey}`] * 100).toFixed(2)}%
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-4 italic">*Nilai menunjukkan rata-rata skor normalisasi (0-100%) dalam klaster tersebut.</p>
                </div>
            </div>

            {/* Scatter Plot */}
            <div className="glass-card p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                    <Map className="text-blue-400" size={20} /> Peta Sebaran Wilayah: Kesiapan Digital vs IPM
                </h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" dataKey="readinessScore" name="Digital Score" stroke="#94a3b8" unit="%" label={{ value: 'Skor Kesiapan Digital (%)', position: 'bottom', fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis type="number" dataKey="X5" name="IPM" stroke="#94a3b8" unit="pt" label={{ value: 'Indeks Pembangunan Manusia (IPM)', angle: -90, position: 'left', fill: '#94a3b8', fontSize: 12 }} />
                            <ZAxis type="category" dataKey="_name" name="Wilayah" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-slate-900 border border-white/10 p-3 rounded-lg shadow-xl">
                                                <div className="text-xs font-bold text-white mb-1">{d._name}</div>
                                                <div className="text-[10px] text-blue-400">Digital: {d.readinessScore}%</div>
                                                <div className="text-[10px] text-emerald-400">IPM: {d.X5}</div>
                                                <div className="text-[10px] uppercase font-bold mt-2" style={{ color: d.clusterColor }}>{d.clusterLabel}</div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter name="Wilayah" data={data.clustered}>
                                {data.clustered.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.clusterColor} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Final Membership Table */}
            <div className="glass-card p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                    <Users className="text-emerald-400" size={20} /> Hasil Akhir Keanggotaan Klaster & Skor Kesiapan
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-800 text-slate-400 uppercase tracking-tighter">
                            <tr>
                                <th className="py-3 px-4 rounded-tl-xl font-bold">No</th>
                                <th className="py-3 px-4 font-bold">Wilayah (Kabupaten/Kota)</th>
                                <th className="py-3 px-4 text-center font-bold">Keanggotaan Klaster</th>
                                <th className="py-3 px-4 text-center font-bold">Skor Kesiapan Digital</th>
                                <th className="py-3 px-4 rounded-tr-xl text-center font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-300">
                            {data.clustered.map((row, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-4 font-mono text-slate-500">{i + 1}</td>
                                    <td className="py-4 px-4 font-semibold">{row._name}</td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.clusterColor }}></div>
                                            {row.clusterLabel}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="font-bold text-blue-400">{row.readinessScore}%</div>
                                        <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${row.readinessScore}%` }}></div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${row.clusterName === 'Maju' ? 'bg-blue-500/10 text-blue-400' :
                                            row.clusterName === 'Berkembang' ? 'bg-emerald-500/10 text-emerald-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                            {row.clusterName}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AnalysisView;
