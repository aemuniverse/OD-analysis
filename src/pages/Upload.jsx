import React, { useState, useRef, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { GATE_DEFS } from '../data/od_data_generator';

const allGateNames = Object.keys(GATE_DEFS);

// Column detection helper
function findCol(headers, aliases) {
  for (const a of aliases) {
    const found = headers.find(h => h.toLowerCase().replace(/[_\s]/g, '').includes(a.toLowerCase().replace(/[_\s]/g, '')));
    if (found) return found;
  }
  return null;
}

export function Upload({ setData, data }) {
  const [step, setStep] = useState(0); // 0=upload, 1=mapping, 2=preview, 3=done
  const [rawRows, setRawRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [colMap, setColMap] = useState({ origin: '', dest: '', traffic: '', mandiri: '', bri: '', bni: '', bca: '' });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().slice(0, 10));
  const [dragOver, setDragOver] = useState(false);
  const [invalidRows, setInvalidRows] = useState([]);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (json.length === 0) { setError('Sheet kosong. Pastikan file memiliki data.'); return; }
        const hdrs = Object.keys(json[0]);
        setRawRows(json);
        setHeaders(hdrs);
        // Auto-detect columns
        const detected = {
          origin: findCol(hdrs, ['origin', 'asal', 'dari', 'gerbang_asal', 'gerbangasal']) || '',
          dest: findCol(hdrs, ['dest', 'destination', 'tujuan', 'ke', 'gerbang_keluar', 'gerbangkeluar']) || '',
          traffic: findCol(hdrs, ['traffic', 'volume', 'transaksi', 'trx', 'jumlah', 'total']) || '',
          mandiri: findCol(hdrs, ['mandiri']) || '',
          bri: findCol(hdrs, ['bri']) || '',
          bni: findCol(hdrs, ['bni']) || '',
          bca: findCol(hdrs, ['bca']) || '',
        };
        setColMap(detected);
        setStep(1);
      } catch (err) {
        setError('Gagal membaca file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onDrop = useCallback(e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }, [handleFile]);
  const onPick = useCallback(e => { if (e.target.files[0]) handleFile(e.target.files[0]); }, [handleFile]);

  // Process mapping → preview
  const processMapping = useCallback(() => {
    if (!colMap.origin || !colMap.dest || !colMap.traffic) {
      setError('Kolom Origin, Destination, dan Traffic wajib dipetakan.');
      return;
    }
    setError(null);
    const parsed = []; const inv = [];
    rawRows.forEach((row, idx) => {
      const origin = String(row[colMap.origin] || '').toUpperCase().trim();
      const dest = String(row[colMap.dest] || '').toUpperCase().trim();
      const traffic = Number(row[colMap.traffic]) || 0;
      if (!origin || !dest) { inv.push({ row: idx + 2, reason: 'Origin/Dest kosong' }); return; }
      if (traffic < 0) { inv.push({ row: idx + 2, reason: 'Traffic negatif' }); return; }
      const mandiri = colMap.mandiri ? (Number(row[colMap.mandiri]) || 0) : Math.round(traffic * 0.7);
      const bri = colMap.bri ? (Number(row[colMap.bri]) || 0) : Math.round(traffic * 0.15);
      const bni = colMap.bni ? (Number(row[colMap.bni]) || 0) : Math.round(traffic * 0.1);
      const bca = colMap.bca ? (Number(row[colMap.bca]) || 0) : Math.max(0, traffic - mandiri - bri - bni);
      // Find dest_code
      const destMeta = Object.entries(data.dest_meta || {}).find(([, v]) => v === dest);
      const dest_code = destMeta ? destMeta[0] : dest.slice(0, 3).toUpperCase();
      parsed.push({ origin, dest, dest_code, traffic, bank: { mandiri, bri, bni, bca, total: traffic } });
    });
    setInvalidRows(inv);
    setPreview(parsed);
    setStep(2);
  }, [rawRows, colMap, data]);

  // Apply to dashboard
  const applyData = useCallback(() => {
    if (!preview || preview.length === 0) return;
    // Build coords from known gates
    const coords = {};
    preview.forEach(r => {
      if (GATE_DEFS[r.origin]) coords[r.origin] = [GATE_DEFS[r.origin].lat, GATE_DEFS[r.origin].lng];
      if (GATE_DEFS[r.dest]) coords[r.dest] = [GATE_DEFS[r.dest].lat, GATE_DEFS[r.dest].lng];
    });
    // Build dest_meta
    const dest_meta = {};
    preview.forEach(r => { dest_meta[r.dest_code] = r.dest; });
    // Build gate_rev (estimated)
    const gate_rev = {};
    preview.forEach(r => {
      if (!gate_rev[r.dest_code]) gate_rev[r.dest_code] = { dest: r.dest, tunai: 0, etoll: 0, total: 0 };
      const rev = r.traffic * 50000;
      gate_rev[r.dest_code].etoll += Math.round(rev * 0.995);
      gate_rev[r.dest_code].tunai += Math.round(rev * 0.005);
      gate_rev[r.dest_code].total += rev;
    });
    // Build ruas_rev
    const ruas_rev = {};
    Object.keys(gate_rev).forEach(dc => { ruas_rev[dc] = { UPLOAD: gate_rev[dc].total }; });

    const dayData = { date: uploadDate, dest_meta, od: preview, gate_rev, ruas_rev, coords };
    setData(uploadDate, dayData);
    setStep(3);
  }, [preview, uploadDate, setData]);

  const resetAll = () => { setStep(0); setRawRows([]); setHeaders([]); setPreview(null); setError(null); setInvalidRows([]); };

  const totalTrx = useMemo(() => preview ? preview.reduce((a, r) => a + r.traffic, 0) : 0, [preview]);
  const uniqueOrigins = useMemo(() => preview ? new Set(preview.map(r => r.origin)).size : 0, [preview]);
  const uniqueDests = useMemo(() => preview ? new Set(preview.map(r => r.dest)).size : 0, [preview]);

  return (
    <div className="panel">
      <div className="head">
        <div className="head-left">
          <h3>Data Validation & Ingestion</h3>
          <p>Unggah laporan harian Excel (.xlsx) OD Matrix</p>
        </div>
      </div>
      <div className="body">
        {/* Steps indicator */}
        <div className="upload-steps">
          {['Upload File', 'Mapping Kolom', 'Preview & Validasi', 'Selesai'].map((s, i) => (
            <div key={i} className={'upload-step' + (i < step ? ' step-done' : i === step ? ' step-active' : '')}>
              <div className="us-dot">{i < step ? '✓' : i + 1}</div>
              <span className="us-label">{s}</span>
            </div>
          ))}
        </div>

        {error && <div className="up-alert err">⚠ {error}</div>}

        {/* Step 0: Upload */}
        {step === 0 && (
          <>
            <div className={'upload-zone' + (dragOver ? ' drag' : '')}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              tabIndex={0}
            >
              <div className="uz-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div className="uz-title">Klik atau drop file ke sini</div>
              <div className="uz-sub">Upload file OD Matrix Excel untuk divalidasi dan diterapkan ke dashboard</div>
              <div className="uz-ext">
                <span className="ext-badge">.XLSX</span>
                <span className="ext-badge">.XLS</span>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={onPick} style={{ display: 'none' }} />
            </div>
            <div className="up-alert info" style={{ marginTop: 16 }}>
              💡 <span>Format yang didukung: Kolom <b>Origin/Asal</b>, <b>Dest/Tujuan</b>, <b>Traffic/Volume</b> (wajib). Bank breakdown (Mandiri, BRI, BNI, BCA) opsional.</span>
            </div>
          </>
        )}

        {/* Step 1: Column Mapping */}
        {step === 1 && (
          <>
            <div className="file-card">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div><div className="file-card-name">{fileName}</div><div className="file-card-meta">{rawRows.length} baris · {headers.length} kolom</div></div>
            </div>

            <div className="fl" style={{ marginBottom: 16 }}>
              <label>Tanggal Data</label>
              <input type="date" className="fl-date" value={uploadDate} onChange={e => setUploadDate(e.target.value)} />
            </div>

            <table className="map-tbl">
              <thead><tr><th>Field Dashboard</th><th>Kolom Excel</th><th></th></tr></thead>
              <tbody>
                {[
                  ['origin', 'Origin / Gerbang Asal', true],
                  ['dest', 'Destination / Gerbang Keluar', true],
                  ['traffic', 'Traffic / Volume', true],
                  ['mandiri', 'Bank Mandiri', false],
                  ['bri', 'Bank BRI', false],
                  ['bni', 'Bank BNI', false],
                  ['bca', 'Bank BCA', false],
                ].map(([key, label, req]) => (
                  <tr key={key}>
                    <td style={{ fontWeight: 600 }}>{label}{req && <span className="req-w">Wajib</span>}</td>
                    <td>
                      <select className={'map-sel' + (colMap[key] ? ' mapped' : '')}
                        value={colMap[key]}
                        onChange={e => setColMap(prev => ({ ...prev, [key]: e.target.value }))}>
                        <option value="">— Pilih kolom —</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </td>
                    <td>{colMap[key] && <span style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>✓</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="expbtn" onClick={resetAll}>← Kembali</button>
              <button className="expbtn primary" onClick={processMapping}>Proses & Preview →</button>
            </div>
          </>
        )}

        {/* Step 2: Preview */}
        {step === 2 && preview && (
          <>
            <div className="sum-row">
              <div className="sum-stat"><div className="sum-val" style={{ color: 'var(--teal)' }}>{preview.length}</div><div className="sum-lbl">OD Pairs Valid</div></div>
              <div className="sum-stat"><div className="sum-val">{totalTrx.toLocaleString('id-ID')}</div><div className="sum-lbl">Total Transaksi</div></div>
              <div className="sum-stat"><div className="sum-val">{uniqueOrigins}</div><div className="sum-lbl">Gerbang Asal</div></div>
              <div className="sum-stat"><div className="sum-val">{uniqueDests}</div><div className="sum-lbl">Gerbang Tujuan</div></div>
            </div>

            {invalidRows.length > 0 && (
              <div className="up-alert warn" style={{ marginBottom: 16 }}>
                ⚠ <span><b>{invalidRows.length} baris</b> tidak valid dan akan diskip.</span>
              </div>
            )}
            {invalidRows.length > 0 && (
              <div className="inv-tbl-wrap">
                <table className="inv-tbl">
                  <thead><tr><th>Baris</th><th>Alasan</th></tr></thead>
                  <tbody>{invalidRows.slice(0, 20).map((r, i) => <tr key={i}><td>{r.row}</td><td>{r.reason}</td></tr>)}</tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 10, fontFamily: 'Space Grotesk' }}>Preview Data (20 baris pertama)</h4>
              <div className="prev-wrap">
                <table>
                  <thead><tr><th>#</th><th>Origin</th><th>Dest</th><th style={{ textAlign:'right' }}>Traffic</th><th style={{ textAlign:'right' }}>Mandiri</th><th style={{ textAlign:'right' }}>BRI</th><th style={{ textAlign:'right' }}>BNI</th><th style={{ textAlign:'right' }}>BCA</th></tr></thead>
                  <tbody>
                    {preview.slice(0, 20).map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{r.origin}</td>
                        <td>{r.dest}</td>
                        <td className="num-c">{r.traffic.toLocaleString('id-ID')}</td>
                        <td className="num-c">{r.bank.mandiri.toLocaleString('id-ID')}</td>
                        <td className="num-c">{r.bank.bri.toLocaleString('id-ID')}</td>
                        <td className="num-c">{r.bank.bni.toLocaleString('id-ID')}</td>
                        <td className="num-c">{r.bank.bca.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="up-alert info" style={{ marginTop: 16 }}>
              💡 Data akan diterapkan untuk tanggal <b>{uploadDate}</b>. Data dummy untuk tanggal tersebut akan diganti.
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button className="expbtn" onClick={() => setStep(1)}>← Kembali</button>
              <button className="expbtn primary" onClick={applyData}>✓ Terapkan ke Dashboard</button>
            </div>
          </>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="done-wrap">
            <div className="done-circle">✓</div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>Data Berhasil Diterapkan!</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>
              {preview?.length || 0} OD pairs telah dimuat untuk tanggal {uploadDate}.
              Data akan langsung terlihat di semua halaman dashboard.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="expbtn" onClick={resetAll}>Upload Data Lain</button>
              <button className="expbtn primary" onClick={() => window.location.hash = '#overview'}>Lihat Dashboard →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
