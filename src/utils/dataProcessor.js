import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { normalize, kMeans } from './policyEngine';

export const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};

const isYear = (val) => {
    if (!val) return false;
    const str = val.toString().trim();
    const n = parseInt(str);
    return !isNaN(n) && n > 1900 && n < 2100 && str.length === 4;
};

export const parseExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

                if (rows.length === 0) {
                    resolve([]);
                    return;
                }

                let anchorIdx = -1;
                for (let i = 0; i < Math.min(25, rows.length); i++) {
                    const rowText = rows[i].map(c => c.toString().trim().toLowerCase());
                    if (rowText.includes("wilayah") || rowText.includes("kabupaten") || rowText.includes("kabupaten/kota")) {
                        anchorIdx = i;
                        break;
                    }
                }

                if (anchorIdx === -1) anchorIdx = 0;

                const headerRows = [];
                const startScan = Math.max(0, anchorIdx - 2);
                for (let i = startScan; i <= anchorIdx; i++) {
                    headerRows.push(rows[i].map(c => c.toString().trim()));
                }

                const propagatedRows = headerRows.map(row => {
                    const pRow = [];
                    let lastVal = "";
                    row.forEach((cell, idx) => {
                        if (cell !== "" && !isYear(cell)) lastVal = cell;
                        pRow[idx] = cell === "" ? lastVal : cell;
                        if (isYear(cell)) lastVal = "";
                    });
                    return pRow;
                });

                const colCount = rows[anchorIdx].length;
                const finalHeaders = [];
                for (let j = 0; j < colCount; j++) {
                    let columnParts = [];
                    propagatedRows.forEach(pRow => {
                        const val = pRow[j] || "";
                        if (val && !columnParts.includes(val)) columnParts.push(val);
                    });

                    if (columnParts.some(p => p.toLowerCase().includes("wilayah"))) {
                        finalHeaders[j] = "Wilayah";
                    } else {
                        finalHeaders[j] = columnParts.join(" ") || `Col_${j + 1}`;
                    }
                }

                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    range: anchorIdx + 1,
                    header: finalHeaders,
                    defval: ""
                });

                resolve(jsonData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};

const cleanNumber = (val) => {
    if (typeof val === 'number') return val;
    if (val === null || val === undefined || val === "" || val === "-" || val === " - ") return 0;
    const cleaned = val.toString().replace(/[^\d.-]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

export const transformAndProcess = (rawData, mapping, fileName) => {
    if (!rawData || rawData.length === 0) return null;

    const transformed = rawData.map(row => {
        const newRow = { _original: row };
        newRow._name = row[mapping.region] || 'Unknown';
        // Map variables X1-X5
        newRow.X1 = cleanNumber(row[mapping.x1]);
        newRow.X2 = cleanNumber(row[mapping.x2]);
        newRow.X3 = cleanNumber(row[mapping.x3]);
        newRow.X4 = cleanNumber(row[mapping.x4]);
        newRow.X5 = cleanNumber(row[mapping.x5]);

        // Explicitly keep IPM for scatter plot if mapped
        newRow.IPM = cleanNumber(row[mapping.x5]);

        return newRow;
    }).filter(row => {
        const name = row._name.toString().trim().toLowerCase();
        return name !== 'unknown' &&
            name !== '' &&
            name !== 'wilayah' &&
            !name.includes('total') &&
            !name.includes('provinsi') &&
            !name.includes('nusa tenggara');
    });

    if (transformed.length === 0) return null;

    const variables = ['X1', 'X2', 'X3', 'X4', 'X5'];
    const { normalized } = normalize(transformed, variables);

    // Call advanced kMeans
    const clusterResult = kMeans(normalized, variables);

    return {
        raw: rawData,
        clustered: clusterResult.data,
        centroids: clusterResult.centroids,
        metrics: clusterResult.metrics,
        fileName,
        id: Math.random().toString(36).substr(2, 9),
        columns: Object.keys(rawData[0]),
        variables,
        stats: {
            totalRows: transformed.length,
            totalColumns: Object.keys(rawData[0]).length,
            ready: true
        }
    };
};

export const processData = (data) => {
    if (!data || data.length === 0) return null;
    return {
        raw: data,
        columns: Object.keys(data[0]),
        stats: {
            totalRows: data.length,
            totalColumns: Object.keys(data[0]).length
        }
    };
};
