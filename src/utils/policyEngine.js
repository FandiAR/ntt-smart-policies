import { kmeans } from 'ml-kmeans';

// Min-Max Normalization helper
export const normalize = (data, columns) => {
    const normalized = data.map(row => ({ ...row }));
    const stats = {};

    columns.forEach(col => {
        const values = data.map(d => parseFloat(d[col]) || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        stats[col] = { min, max };

        normalized.forEach(row => {
            const val = parseFloat(row[col]) || 0;
            // Use underscore prefix for normalized values
            row[`_${col}`] = max === min ? 0 : (val - min) / (max - min);
        });
    });

    return { normalized, stats };
};

// Euclidean Distance for Silhouette
const distance = (a, b) => {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
};

// Calculate Silhouette Score
const calculateSilhouette = (points, clusters) => {
    if (!clusters || clusters.length < 2) return 0;
    const clusterIds = Array.from(new Set(clusters));
    if (clusterIds.length < 2) return 0;

    const scores = points.map((p, i) => {
        const ownCluster = clusters[i];

        // a(i)
        const sameIndices = clusters.map((c, idx) => c === ownCluster && idx !== i ? idx : -1).filter(idx => idx !== -1);
        const ai = sameIndices.length > 0
            ? sameIndices.reduce((sum, idx) => sum + distance(p, points[idx]), 0) / sameIndices.length
            : 0;

        // b(i)
        const otherClusterDists = clusterIds.filter(c => c !== ownCluster).map(c => {
            const otherIndices = clusters.map((val, idx) => val === c ? idx : -1).filter(idx => idx !== -1);
            return otherIndices.reduce((sum, idx) => sum + distance(p, points[idx]), 0) / otherIndices.length;
        });
        const bi = Math.min(...otherClusterDists);

        return (bi - ai) / Math.max(ai, bi);
    });

    return scores.reduce((s, val) => s + val, 0) / scores.length;
};

// Core Runner with n_init to match scikit-learn behavior
const runKMeansLibrary = (dataArray, k, nInit = 10) => {
    if (dataArray.length === 0) return { clusters: [], centroids: [], sse: 0 };
    if (dataArray.length < k) {
        return { clusters: dataArray.map((_, i) => i % k), centroids: [], sse: 100 };
    }

    let bestResult = null;
    let minSSE = Infinity;

    for (let i = 0; i < nInit; i++) {
        try {
            const result = kmeans(dataArray, k, {
                initialization: 'mostDistant', // K-Means++ equivalent
                maxIterations: 100,
                tolerance: 1e-6
            });

            // Calculate SSE
            const sse = dataArray.reduce((sum, p, idx) => {
                const centroid = result.centroids[result.clusters[idx]];
                return sum + Math.pow(distance(p, centroid), 2);
            }, 0);

            if (sse < minSSE) {
                minSSE = sse;
                bestResult = {
                    clusters: result.clusters,
                    centroids: result.centroids,
                    sse
                };
            }
        } catch (e) {
            console.error("Clustering Iteration Error:", e);
        }
    }

    return bestResult || { clusters: new Array(dataArray.length).fill(0), centroids: [], sse: 0 };
};

// Elbow Method calculation
export const getElbowData = (data, columns) => {
    const dataArray = data.map(d => columns.map(col => d[`_${col}`] || 0));
    const sseData = [];
    const maxK = Math.min(6, dataArray.length);
    for (let k = 1; k <= maxK; k++) {
        const { sse } = runKMeansLibrary(dataArray, k, 5); // Fewer inits for elbow is fine
        sseData.push({ k, sse });
    }
    return sseData;
};

const detectElbowK = (sseData) => {
    if (!sseData || sseData.length === 0) return 1;
    if (sseData.length <= 2) return sseData[sseData.length - 1].k;

    const first = sseData[0];
    const last = sseData[sseData.length - 1];
    const dx = last.k - first.k;
    const dy = last.sse - first.sse;
    const denom = Math.sqrt(dx * dx + dy * dy) || 1;

    let bestK = sseData[1].k;
    let maxDistance = -Infinity;

    for (let i = 1; i < sseData.length - 1; i++) {
        const point = sseData[i];
        const numerator = Math.abs(dy * point.k - dx * point.sse + last.k * first.sse - last.sse * first.k);
        const distanceToLine = numerator / denom;
        if (distanceToLine > maxDistance) {
            maxDistance = distanceToLine;
            bestK = point.k;
        }
    }

    return bestK;
};

// Main Exported K-Means
export const kMeans = (data, columns, k) => {
    const dataArray = data.map(d => columns.map(col => d[`_${col}`] || 0));

    const elbowData = getElbowData(data, columns);
    const chosenK = k || detectElbowK(elbowData);
    const clustering = runKMeansLibrary(dataArray, chosenK, 10); // Match scikit-learn n_init=10
    const silhouette = calculateSilhouette(dataArray, clustering.clusters);

    // CRITICAL: RANK CLUSTERS BY MAGNITUDE OF CENTROID SCORE
    const clusterStats = clustering.centroids.map((centroid, ci) => {
        const score = centroid.reduce((s, val) => s + val, 0) / columns.length;
        return { originalId: ci, score, centroid };
    }).sort((a, b) => b.score - a.score);

    // Explicit Label Mapping to match Python results and Thesis colors
    const labelMapping = {};
    const labelPresets = [
        { label: 'C-1 (Maju)', color: '#10b981', name: 'Maju' },
        { label: 'C-2 (Berkembang)', color: '#3b82f6', name: 'Berkembang' },
        { label: 'C-3 (Tertinggal)', color: '#ef4444', name: 'Tertinggal' }
    ];
    const fallbackColors = ['#8b5cf6', '#f59e0b', '#14b8a6', '#94a3b8'];
    clusterStats.forEach((stat, idx) => {
        if (labelPresets[idx]) {
            labelMapping[stat.originalId] = labelPresets[idx];
        } else {
            labelMapping[stat.originalId] = {
                label: `C-${idx + 1} (Tambahan)`,
                color: fallbackColors[(idx - labelPresets.length) % fallbackColors.length],
                name: 'Tambahan'
            };
        }
    });

    const clusteredData = data.map((d, i) => {
        const cid = clustering.clusters[i];
        const res = labelMapping[cid] || { label: 'Unknown', color: '#94a3b8', name: '-' };

        // Digital Readiness calculation: Mean of X1, X2, X3, X4 (skipping X5/IPM) as per Python Colab
        const readinessVariables = columns.filter(c => c !== 'X5');
        const readinessScore = readinessVariables.reduce((s, col) => s + (d[`_${col}`] || 0), 0) / readinessVariables.length;

        return {
            ...d,
            clusterLabel: res.label,
            clusterColor: res.color,
            clusterName: res.name,
            readinessScore: parseFloat((readinessScore * 100).toFixed(2))
        };
    });

    return {
        data: clusteredData,
        centroids: clusterStats.map(s => {
            const centroidObj = {};
            columns.forEach((col, idx) => {
                centroidObj[`_${col}`] = s.centroid[idx];
            });
            return {
                ...s,
                id: s.originalId,
                label: labelMapping[s.originalId]?.label,
                centroid: centroidObj
            };
        }),
        metrics: {
            sse: clustering.sse,
            silhouette,
            elbowData,
            k: chosenK
        }
    };
};

export const generatePolicy = (clusterLabel) => {
    const policies = {
        'C-1 (Maju)': {
            focus: 'Inovasi & Keberlanjutan',
            strategy: 'Maintenance & Expansion',
            recommendations: [
                'Implementasi Fiber Optic ke seluruh sekolah wilayah.',
                'Program sertifikasi guru digital tingkat internasional.',
                'Pengembangan inkubator bisnis teknologi daerah.'
            ]
        },
        'C-2 (Berkembang)': {
            focus: 'Akselerasi Infrastruktur',
            strategy: 'Digital Scaling',
            recommendations: [
                'Prioritas pemerataan signal 4G di area perdesaan.',
                'Subsidi perangkat laptop untuk guru dan siswa.',
                'Pelatihan penggunaan platform merdeka mengajar secara intensif.'
            ]
        },
        'C-3 (Tertinggal)': {
            focus: 'Pembangunan Dasar',
            strategy: 'Affirmative Action',
            recommendations: [
                'Penyediaan genset/solar panel untuk sekolah tanpa listrik.',
                'Bantuan VSAT/Satelit untuk akses internet darurat.',
                'Pelatihan literasi digital dasar untuk pengajar.'
            ]
        }
    };
    return policies[clusterLabel] || { focus: 'Umum', strategy: 'Standar', recommendations: ['Lakukan analisis data lebih lanjut.'] };
};
