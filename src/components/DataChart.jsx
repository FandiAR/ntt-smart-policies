import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const DataChart = ({ data, columns, type = 'bar' }) => {
    if (!data || data.length === 0) return null;

    // Intelligent Key Selection
    // If standardized data exists (from ColumnMapper/transformAndProcess), use _name as X
    const hasStandardName = data[0] && '_name' in data[0];
    const xKey = hasStandardName ? '_name' : columns[0];

    // Choose Y: Priority X1 (Listrik), then X2, or any numeric column
    let yKey = columns.find(col => typeof data[0][col] === 'number') || columns[1];
    if (data[0] && 'X1' in data[0]) yKey = 'X1';

    // Label Map for display
    const labelMap = {
        X1: 'Akses Listrik (%)',
        X2: 'Sinyal 4G (%)',
        X3: 'Internet Sekolah (%)',
        X4: 'Guru Digital (%)',
        X5: 'IPM / HDI'
    };

    const displayY = labelMap[yKey] || yKey;

    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <LineChart data={data.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={11} tick={{ fill: '#94a3b8' }} />
                        <YAxis stroke="#94a3b8" fontSize={11} tick={{ fill: '#94a3b8' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                        />
                        <Line type="monotone" dataKey={yKey} stroke="#3b82f6" strokeWidth={2} name={displayY} />
                    </LineChart>
                );
            case 'pie': {
                const pieData = data.slice(0, 6).map((item) => ({
                    name: item[xKey],
                    value: item[yKey]
                }));
                return (
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                        >
                            {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                );
            }
            default:
                return (
                    <BarChart data={data.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey={xKey} stroke="#94a3b8" fontSize={11} tick={{ fill: '#94a3b8' }} />
                        <YAxis stroke="#94a3b8" fontSize={11} tick={{ fill: '#94a3b8' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                        />
                        <Bar dataKey={yKey} fill="#3b82f6" radius={[4, 4, 0, 0]} name={displayY} />
                    </BarChart>
                );
        }
    };

    const titleMap = {
        bar: `Distribusi ${displayY}`,
        line: `Tren ${displayY}`,
        pie: `Proporsi ${displayY}`
    };

    const chartTitle = titleMap[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Analisis`;

    return (
        <div className="glass-card p-6 h-[400px]">
            <h3 className="text-lg font-semibold mb-6 flex justify-between items-center">
                {chartTitle}
                <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded uppercase tracking-tighter">
                    {xKey} vs {displayY}
                </span>
            </h3>
            <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DataChart;
