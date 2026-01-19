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

// Core Runner using ml-kmeans
const runKMeansLibrary = (dataArray, k) => {
    if (dataArray.length === 0) return { clusters: [], centroids: [], sse: 0 };
    if (dataArray.length < k) {
        return { clusters: dataArray.map((_, i) => i % k), centroids: [], sse: 100 };
    }

    try {
        const result = kmeans(dataArray, k, {
            initialization: 'mostDistant', // Like K-Means++
            maxIterations: 100,
            tolerance: 1e-6
        });

        // Calculate SSE: ml-kmeans doesn't return it directly, so we calculate it
        const sse = dataArray.reduce((sum, p, i) => {
            const centroid = result.centroids[result.clusters[i]];
            return sum + Math.pow(distance(p, centroid), 2);
        }, 0);

        return {
            clusters: result.clusters,
            centroids: result.centroids,
            sse
        };
    } catch (e) {
        console.error("Clustering Error:", e);
        return { clusters: new Array(dataArray.length).fill(0), centroids: [], sse: 0 };
    }
};

// Elbow Method calculation
export const getElbowData = (data, columns) => {
    // Convert to simple array of arrays for ml-kmeans
    const dataArray = data.map(d => columns.map(col => d[`_${col}`] || 0));

    const sseData = [];
    const maxK = Math.min(6, dataArray.length);
    for (let k = 1; k <= maxK; k++) {
        const { sse } = runKMeansLibrary(dataArray, k);
        sseData.push({ k, sse });
    }
    return sseData;
};

// Main Exported K-Means
export const kMeans = (data, columns, k = 3) => {
    // Convert to array of arrays
    const dataArray = data.map(d => columns.map(col => d[`_${col}`] || 0));

    const clustering = runKMeansLibrary(dataArray, k);
    const silhouette = calculateSilhouette(dataArray, clustering.clusters);
    const elbowData = getElbowData(data, columns);

    // CRITICAL: RANK CLUSTERS BY MAGNITUDE OF CENTROID SCORE
    const clusterStats = clustering.centroids.map((centroid, ci) => {
        const score = centroid.reduce((s, val) => s + val, 0) / columns.length;
        return { originalId: ci, score, centroid };
    }).sort((a, b) => b.score - a.score); // Highest score = Maju

    // Explicit Label Mapping
    const labelMapping = {};
    if (clusterStats[0]) labelMapping[clusterStats[0].originalId] = { label: 'Klaster C-1 (Maju)', color: '#3b82f6', name: 'Maju' };
    if (clusterStats[1]) labelMapping[clusterStats[1].originalId] = { label: 'Klaster C-3 (Berkembang)', color: '#10b981', name: 'Berkembang' };
    if (clusterStats[2]) labelMapping[clusterStats[2].originalId] = { label: 'Klaster C-2 (Tertinggal)', color: '#ef4444', name: 'Tertinggal' };

    const clusteredData = data.map((d, i) => {
        const cid = clustering.clusters[i];
        const res = labelMapping[cid] || { label: 'Unknown', color: '#94a3b8', name: '-' };

        const readinessScore = columns.reduce((s, col) => s + (d[`_${col}`] || 0), 0) / columns.length;

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
            elbowData
        }
    };
};

export const generatePolicy = (clusterLabel) => {
    const policies = {
        'Klaster C-1 (Maju)': {
            focus: 'Inovasi & Keberlanjutan',
            strategy: 'Maintenance & Expansion',
            recommendations: [
                'Implementasi Fiber Optic ke seluruh sekolah wilayah.',
                'Program sertifikasi guru digital tingkat internasional.',
                'Pengembangan inkubator bisnis teknologi daerah.'
            ]
        },
        'Klaster C-3 (Berkembang)': {
            focus: 'Akselerasi Infrastruktur',
            strategy: 'Digital Scaling',
            recommendations: [
                'Prioritas pemerataan signal 4G di area perdesaan.',
                'Subsidi perangkat laptop untuk guru dan siswa.',
                'Pelatihan penggunaan platform merdeka mengajar secara intensif.'
            ]
        },
        'Klaster C-2 (Tertinggal)': {
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
