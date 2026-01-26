import {
  ShieldCheck,
  Lightbulb,
  TrendingUp,
  AlertCircle,
  FileText,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { generatePolicy } from "../utils/policyEngine";

const PolicyView = ({ data }) => {
  if (!data || !data.clustered) return null;

  // Grouping by cluster label
  const clusters = {};
  data.clustered.forEach((item) => {
    if (!clusters[item.clusterLabel]) {
      clusters[item.clusterLabel] = [];
    }
    clusters[item.clusterLabel].push(item._name);
  });

  const MotionDiv = motion.div;

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const handleExport = () => {
    const exportWindow = window.open("", "_blank", "width=960,height=720");
    if (!exportWindow) {
      alert("Pop-up diblokir. Izinkan pop-up untuk ekspor PDF.");
      return;
    }

    const policies = Object.keys(clusters).map((label) => {
      const policy = generatePolicy(label);
      return {
        label,
        focus: policy.focus,
        strategy: policy.strategy,
        recommendations: policy.recommendations,
        regions: clusters[label],
      };
    });

    const formattedDate = new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const policyBlocks = policies
      .map((policy) => {
        const recs = policy.recommendations
          .map((rec) => `<li>${escapeHtml(rec)}</li>`)
          .join("");
        const regions = policy.regions
          .map((region) => `<span class="tag">${escapeHtml(region)}</span>`)
          .join("");

        return `
                <section class="card">
                    <div class="cluster">${escapeHtml(policy.label)}</div>
                    <h3>${escapeHtml(policy.focus)}</h3>
                    <div class="meta">Strategi: ${escapeHtml(
                      policy.strategy
                    )}</div>
                    <h4>Rekomendasi Aksi</h4>
                    <ul>${recs}</ul>
                    <h4>Target Wilayah (${policy.regions.length})</h4>
                    <div class="tags">${regions}</div>
                </section>
            `;
      })
      .join("");

    const html = `
            <!doctype html>
            <html lang="id">
            <head>
                <meta charset="utf-8" />
                <title>Dokumen Kebijakan</title>
                <style>
                    * { box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 32px; color: #0f172a; }
                    h1 { font-size: 24px; margin: 0 0 6px; }
                    h2 { font-size: 14px; font-weight: 600; margin: 0 0 20px; color: #475569; }
                    h3 { font-size: 16px; margin: 12px 0 6px; }
                    h4 { font-size: 12px; margin: 14px 0 6px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
                    .header { margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
                    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
                    .cluster { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; background: #e2e8f0; color: #1e293b; padding: 4px 10px; border-radius: 999px; }
                    .meta { font-size: 12px; color: #475569; }
                    ul { padding-left: 18px; margin: 8px 0 0; }
                    li { margin-bottom: 6px; font-size: 13px; }
                    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
                    .tag { background: #f1f5f9; color: #475569; font-size: 11px; padding: 4px 8px; border-radius: 999px; }
                    .note { margin-top: 24px; font-size: 11px; color: #475569; background: #fef3c7; border: 1px solid #fde68a; padding: 12px; border-radius: 10px; }
                    @media print {
                        body { margin: 0; padding: 24px; }
                        .card { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Dokumen Kebijakan Pendidikan Digital</h1>
                    <h2>Tanggal Ekspor: ${escapeHtml(formattedDate)}</h2>
                </div>
                ${policyBlocks}
                <div class="note">
                    Rekomendasi ini disusun otomatis berdasarkan hasil clustering variabel X1-X5 yang dipetakan pengguna.
                </div>
            </body>
            </html>
        `;

    exportWindow.document.open();
    exportWindow.document.write(html);
    exportWindow.document.close();
    exportWindow.focus();
    exportWindow.onload = () => {
      exportWindow.print();
      exportWindow.close();
    };
  };

  return (
    <div className="space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl font-bold italic-font flex items-center gap-3">
            <ShieldCheck className="text-blue-500" size={32} />
            Matriks Strategi Berbasis Data
          </h2>
          <p className="text-slate-400 mt-2">
            Matriks rekomendasi kebijakan berbasis hasil analisis pengelompokan
            (K-Means).
          </p>
        </div>
        <button
          onClick={handleExport}
          className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all border border-white/5"
        >
          <FileText size={18} /> Ekspor Dokumen Kebijakan
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {Object.keys(clusters).map((label, idx) => {
          const policy = generatePolicy(label);
          const isMaju = label.includes("Maju");
          const isTertinggal = label.includes("Tertinggal");

          return (
            <MotionDiv
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card p-8 border-t-4 ${
                isMaju
                  ? "border-emerald-500"
                  : isTertinggal
                  ? "border-red-500"
                  : "border-blue-500"
              } flex flex-col h-full ring-1 ring-white/5`}
            >
              <div className="flex items-center justify-between mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    isMaju
                      ? "bg-emerald-500/10 text-emerald-400"
                      : isTertinggal
                      ? "bg-red-500/10 text-red-500"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {label}
                </span>
                {isMaju ? (
                  <TrendingUp size={20} className="text-blue-400" />
                ) : (
                  <Lightbulb size={20} className="text-slate-400" />
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm text-slate-500 uppercase font-bold tracking-tight mb-1">
                  Fokus Utama
                </h3>
                <div className="text-xl font-bold">{policy.focus}</div>
                <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-tighter font-mono">
                  Strategi: {policy.strategy}
                </div>
              </div>

              <div className="flex-grow space-y-4 mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase">
                  Rekomendasi Aksi:
                </h3>
                {policy.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex gap-3 text-sm text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5"
                  >
                    <ChevronRight
                      size={14}
                      className="text-blue-500 shrink-0 mt-1"
                    />
                    {rec}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">
                  Target Wilayah ({clusters[label].length})
                </h4>
                <div className="flex flex-wrap gap-2 pt-2">
                  {clusters[label].map((name) => (
                    <span
                      key={name}
                      className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-400 truncate max-w-[150px]"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </MotionDiv>
          );
        })}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-2xl flex gap-4 items-start">
        <AlertCircle className="text-amber-500 shrink-0" size={24} />
        <div className="space-y-1">
          <p className="font-bold text-amber-500 text-sm">
            Catatan Validitas Data
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rekomendasi ini disusun secara otomatis menggunakan pembobotan
            variabel X1-X5 yang dipetakan oleh pengguna. Pastikan kolom yang
            dipetakan sebagai "IPM" (Indeks Pembangunan Manusia) benar-benar
            mewakili data pembangunan daerah untuk akurasi scatter plot di tab
            Analisis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PolicyView;
