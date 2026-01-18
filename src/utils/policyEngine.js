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
            row[`_${col}`] = max === min ? 0 : (val - min) / (max - min);
        });
    });

    return { normalized, stats };
};

// Euclidean Distance
const distance = (a, b, columns) => {
    return Math.sqrt(
        columns.reduce((sum, col) => sum + Math.pow((a[`_${col}`] || 0) - (b[`_${col}`] || 0), 2), 0)
    );
};

// Helper to calculate SSE (Sum of Squared Errors)
const calculateSSE = (data, clusters, centroids, columns) => {
    return data.reduce((sum, d, i) => {
        const centroid = centroids[clusters[i]];
        return sum + Math.pow(distance(d, centroid, columns), 2);
    }, 0);
};

// Elbow Method calculation
export const getElbowData = (data, columns) => {
    const sseData = [];
    for (let k = 1; k <= Math.min(9, data.length); k++) {
        const { sse } = runKMeans(data, columns, k);
        sseData.push({ k, sse });
    }
    return sseData;
};

// Core K-Means runner used by both elbow and final clustering
const runKMeans = (data, columns, k) => {
    if (data.length < k) return { clusters: new Array(data.length).fill(0), centroids: [], sse: 0 };

    // Initial Centroids (Random)
    let centroids = data.sort(() => 0.5 - Math.random()).slice(0, k).map(d => {
        const c = {};
        columns.forEach(col => c[`_${col}`] = d[`_${col}`]);
        return c;
    });

    let clusters = new Array(data.length).fill(-1);
    let moved = true;
    let iterations = 0;

    while (moved && iterations < 50) {
        moved = false;
        iterations++;

        // Assignment
        data.forEach((d, i) => {
            let minDist = Infinity;
            let closestCluster = -1;
            centroids.forEach((c, ci) => {
                const d_dist = distance(d, c, columns);
                if (d_dist < minDist) {
                    minDist = d_dist;
                    closestCluster = ci;
                }
            });
            if (clusters[i] !== closestCluster) {
                clusters[i] = closestCluster;
                moved = true;
            }
        });

        // Update Centroids
        centroids = centroids.map((_, ci) => {
            const clusterPoints = data.filter((_, i) => clusters[i] === ci);
            if (clusterPoints.length === 0) return centroids[ci];
            const newCentroid = {};
            columns.forEach(col => {
                const sum = clusterPoints.reduce((s, p) => s + p[`_${col}`], 0);
                newCentroid[`_${col}`] = sum / clusterPoints.length;
            });
            return newCentroid;
        });
    }

    const sse = calculateSSE(data, clusters, centroids, columns);
    return { clusters, centroids, sse };
};

// Calculate Silhouette Score (Simplified version for Browser)
const calculateSilhouette = (data, clusters, columns) => {
    if (new Set(clusters).size < 2) return 0;

    const scores = data.map((point, i) => {
        const ownCluster = clusters[i];

        // a(i): average distance to points in same cluster
        const sameClusterPoints = data.filter((_, idx) => clusters[idx] === ownCluster && idx !== i);
        const ai = sameClusterPoints.length > 0
            ? sameClusterPoints.reduce((sum, p) => sum + distance(point, p, columns), 0) / sameClusterPoints.length
            : 0;

        // b(i): average distance to points in nearest other cluster
        const otherClusters = Array.from(new Set(clusters)).filter(c => c !== ownCluster);
        const distsToOthers = otherClusters.map(c => {
            const pointsInOther = data.filter((_, idx) => clusters[idx] === c);
            return pointsInOther.reduce((sum, p) => sum + distance(point, p, columns), 0) / pointsInOther.length;
        });
        const bi = Math.min(...distsToOthers);

        return (bi - ai) / Math.max(ai, bi);
    });

    return scores.reduce((s, val) => s + val, 0) / scores.length;
};

// Main Exported K-Means for the dashboard
export const kMeans = (data, columns, k = 3) => {
    const { clusters, centroids, sse } = runKMeans(data, columns, k);
    const silhouette = calculateSilhouette(data, clusters, columns);
    const elbowData = getElbowData(data, columns);

    // Rank clusters by their centroid average (to label them Maju/Berkembang/Tertinggal)
    const clusterStats = centroids.map((c, ci) => {
        const score = columns.reduce((s, col) => s + c[`_${col}`], 0) / columns.length;
        return { id: ci, score, centroid: c };
    }).sort((a, b) => b.score - a.score);

    const labelMap = {
        [clusterStats[0].id]: { label: 'Klaster C-1 (Maju)', color: '#3b82f6', rank: 'Tinggi', name: 'Maju' },
        [clusterStats[1]?.id]: { label: 'Klaster C-3 (Berkembang)', color: '#10b981', rank: 'Sedang', name: 'Berkembang' },
        [clusterStats[2]?.id]: { label: 'Klaster C-2 (Tertinggal)', color: '#ef4444', rank: 'Rendah', name: 'Tertinggal' }
    };

    const clusteredData = data.map((d, i) => {
        // Calculate Digital Readiness Score (Average of normalized variables)
        const readinessScore = columns.reduce((s, col) => s + (d[`_${col}`] || 0), 0) / columns.length;

        return {
            ...d,
            clusterId: clusters[i],
            clusterLabel: labelMap[clusters[i]].label,
            clusterColor: labelMap[clusters[i]].color,
            clusterName: labelMap[clusters[i]].name,
            readinessScore: parseFloat((readinessScore * 100).toFixed(2))
        };
    });

    return {
        data: clusteredData,
        centroids: clusterStats.map(s => ({ ...s, label: labelMap[s.id].label })),
        metrics: {
            sse,
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
    return policies[clusterLabel] || { focus: 'Umum', strategy: 'Standar', recommendations: ['Verifikasi data kembali.'] };
};
