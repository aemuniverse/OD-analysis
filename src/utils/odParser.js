import * as XLSX from 'xlsx';

// Alias lookup for each logical field — normalised to lowercase + underscores
export const FIELD_ALIASES = {
  origin:      ['origin', 'asal', 'kota_asal', 'origin_name', 'from', 'dari', 'gerbang_asal', 'gate_origin', 'nama_asal', 'o'],
  dest:        ['destination', 'dest', 'tujuan', 'kota_tujuan', 'destination_name', 'to', 'ke', 'gerbang_tujuan', 'gate_dest', 'nama_tujuan', 'd'],
  traffic:     ['value', 'count', 'volume', 'demand', 'movement', 'jumlah', 'traffic', 'trips', 'trip', 'transaksi', 'total_trip', 'total', 'freq', 'frekuensi'],
  dest_code:   ['dest_code', 'kode_tujuan', 'code', 'kode', 'destination_code'],
  origin_lat:  ['origin_lat', 'lat_asal', 'o_lat', 'from_lat', 'lat_origin', 'asal_lat'],
  origin_lng:  ['origin_lng', 'lng_asal', 'lon_asal', 'o_lng', 'from_lng', 'lng_origin', 'lon_origin', 'asal_lng', 'asal_lon'],
  dest_lat:    ['dest_lat', 'lat_tujuan', 'd_lat', 'to_lat', 'lat_dest', 'tujuan_lat'],
  dest_lng:    ['dest_lng', 'lng_tujuan', 'lon_tujuan', 'd_lng', 'to_lng', 'lng_dest', 'lon_dest', 'tujuan_lng', 'tujuan_lon'],
};

export const REQUIRED_FIELDS = ['origin', 'dest', 'traffic'];

export const FIELD_META = {
  origin:     { label: 'Origin (Asal)',             required: true,  hint: 'origin, asal, from, gerbang_asal …' },
  dest:       { label: 'Destination (Tujuan)',       required: true,  hint: 'destination, dest, tujuan, ke …' },
  traffic:    { label: 'Volume / Count / Value',     required: true,  hint: 'traffic, volume, count, jumlah, trips …' },
  dest_code:  { label: 'Kode Tujuan',               required: false, hint: 'dest_code, kode, code …' },
  origin_lat: { label: 'Lintang Asal (Lat)',         required: false, hint: 'origin_lat, lat_asal, asal_lat …' },
  origin_lng: { label: 'Bujur Asal (Lng)',           required: false, hint: 'origin_lng, lng_asal, asal_lng …' },
  dest_lat:   { label: 'Lintang Tujuan (Lat)',       required: false, hint: 'dest_lat, lat_tujuan, tujuan_lat …' },
  dest_lng:   { label: 'Bujur Tujuan (Lng)',         required: false, hint: 'dest_lng, lng_tujuan, tujuan_lng …' },
};

// Stable field order for the mapping UI (required first, then optional)
export const ALL_FIELDS = ['origin', 'dest', 'traffic', 'dest_code', 'origin_lat', 'origin_lng', 'dest_lat', 'dest_lng'];

// ─── File parsing ─────────────────────────────────────────────────────────────

export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Gagal membaca file. Coba lagi.'));

    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        if (!wb.SheetNames.length) {
          return reject(new Error('File Excel tidak memiliki sheet yang dapat dibaca.'));
        }
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        // defval: '' ensures empty cells don't disappear; blankrows: false drops genuinely empty rows
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '', blankrows: false });
        resolve({ raw, sheetName, sheetNames: wb.SheetNames });
      } catch {
        reject(new Error('File tidak dapat dibaca. Pastikan format Excel valid (.xlsx / .xls).'));
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

// ─── Column auto-mapping ──────────────────────────────────────────────────────

export function autoMapColumns(columns) {
  const norm = (s) => String(s).toLowerCase().replace(/[\s\-\/]/g, '_');
  const normCols = columns.map(norm);
  const mapping = {};

  ALL_FIELDS.forEach((field) => {
    const idx = normCols.findIndex((nc) => FIELD_ALIASES[field].includes(nc));
    if (idx !== -1) mapping[field] = columns[idx];
  });

  return mapping;
}

// ─── Numeric parser (handles comma-decimals and dot-thousands) ────────────────

function parseNumeric(raw) {
  if (raw === '' || raw == null) return { value: null, err: 'kosong' };
  const s = String(raw).trim();
  // Indonesian format: periods as thousands-sep, comma as decimal
  // Also handle plain numbers and scientific notation
  const clean = s.replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(clean);
  if (isNaN(n)) return { value: null, err: `"${raw}" bukan angka` };
  return { value: Math.round(n), err: null };
}

// ─── Validation + normalisation ───────────────────────────────────────────────

export function validateAndNormalize(raw, mapping) {
  const validRows = [];
  const invalidRows = [];
  const seen = new Set();

  raw.forEach((row, idx) => {
    const rowNum = idx + 2; // +1 for header, +1 for 1-indexing

    // Skip rows that are entirely blank
    if (Object.values(row).every((v) => v === '' || v == null)) return;

    const errors = [];
    const originRaw = mapping.origin ? String(row[mapping.origin] ?? '').trim() : '';
    const destRaw   = mapping.dest   ? String(row[mapping.dest]   ?? '').trim() : '';

    if (!originRaw) errors.push('Origin kosong');
    if (!destRaw)   errors.push('Destination kosong');

    let traffic = 0;
    if (mapping.traffic) {
      const { value, err } = parseNumeric(row[mapping.traffic]);
      if (err) errors.push(`Nilai traffic ${err}`);
      else     traffic = value;
    } else {
      errors.push('Kolom traffic tidak dipetakan');
    }

    const preview = [
      originRaw || '—',
      destRaw   || '—',
      mapping.traffic ? String(row[mapping.traffic] ?? '—') : '—',
    ];

    if (errors.length) {
      invalidRows.push({ rowNum, errors, preview });
      return;
    }

    const key = `${originRaw.toUpperCase()}|${destRaw.toUpperCase()}`;
    if (seen.has(key)) {
      invalidRows.push({ rowNum, errors: ['Duplikat pasangan OD'], preview });
      return;
    }
    seen.add(key);

    const destCode = mapping.dest_code
      ? String(row[mapping.dest_code] ?? '').trim().toUpperCase() || destRaw.slice(0, 3).toUpperCase()
      : destRaw.slice(0, 3).toUpperCase();

    const cleaned = {
      origin:    originRaw.toUpperCase(),
      dest:      destRaw.toUpperCase(),
      dest_code: destCode,
      traffic,
      bank: { mandiri: 0, bri: 0, bni: 0, bca: 0, total: traffic },
    };

    // Optional lat/lng — stored with underscore prefix so buildAppData can strip them
    ['origin_lat', 'origin_lng', 'dest_lat', 'dest_lng'].forEach((f) => {
      if (mapping[f]) {
        const v = parseFloat(row[mapping[f]]);
        if (!isNaN(v)) cleaned[`_${f}`] = v;
      }
    });

    validRows.push(cleaned);
  });

  return { validRows, invalidRows };
}

// ─── Assemble the app-compatible data object ──────────────────────────────────

export function buildAppData(validRows, date) {
  const coords    = {};
  const dest_meta = {};
  const gate_rev  = {};

  validRows.forEach((r) => {
    if (r._origin_lat != null && r._origin_lng != null) coords[r.origin] = [r._origin_lat, r._origin_lng];
    if (r._dest_lat   != null && r._dest_lng   != null) coords[r.dest]   = [r._dest_lat,   r._dest_lng];
    dest_meta[r.dest_code] = r.dest;
    if (!gate_rev[r.dest_code]) gate_rev[r.dest_code] = { dest: r.dest, tunai: 0, etoll: 0, total: 0 };
  });

  // Strip internal lat/lng fields before storing OD rows
  const od = validRows.map(({ _origin_lat, _origin_lng, _dest_lat, _dest_lng, ...r }) => r);

  return {
    date:     date || new Date().toISOString().slice(0, 10),
    od,
    coords,
    dest_meta,
    gate_rev,
    ruas_rev: {},
  };
}
