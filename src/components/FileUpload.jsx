import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileType, Download } from 'lucide-react';
import { parseCSV, parseExcel, processData } from '../utils/dataProcessor';

const FileUpload = ({ onDataLoaded, onError }) => {
    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        try {
            const processedDatasets = [];

            for (const file of acceptedFiles) {
                let data;
                if (file.name.endsWith('.csv')) {
                    data = await parseCSV(file);
                } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                    data = await parseExcel(file);
                } else {
                    continue; // Skip unsupported formats
                }

                const processed = processData(data);
                if (processed) {
                    processedDatasets.push({
                        ...processed,
                        fileName: file.name,
                        id: Math.random().toString(36).substr(2, 9)
                    });
                }
            }

            if (processedDatasets.length > 0) {
                onDataLoaded(processedDatasets);
            } else {
                onError('Format data tidak valid atau file kosong.');
            }
        } catch (err) {
            onError(err.message);
        }
    }, [onDataLoaded, onError]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
        },
        multiple: true
    });

    return (
        <div className="space-y-6 w-full">
            <div
                {...getRootProps()}
                className={`glass-card p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-2 border-dashed ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/30'
                    }`}
            >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                    <Upload className="text-blue-400 w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Upload Data Analisis</h2>
                <p className="text-slate-400 text-center max-w-xs text-sm">
                    Tarik dan lepas file CSV atau Excel di sini, atau klik untuk memilih file.
                </p>
                <div className="mt-6 flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><FileType size={14} /> CSV</span>
                    <span className="flex items-center gap-1"><FileType size={14} /> XLSX</span>
                </div>
            </div>

            <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                        <Download className="text-white" size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-blue-400">Gunakan Template Standar</h4>
                        <p className="text-[11px] text-slate-400">Agar hasil analisis akurat, kami sarankan mengisi data menggunakan template kami.</p>
                    </div>
                </div>
                <a
                    href="/template_analisis.csv"
                    download="template_analisis_pendidikan.csv"
                    className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/20 text-center"
                >
                    Download Template (.CSV)
                </a>
            </div>
        </div>
    );
};

export default FileUpload;
