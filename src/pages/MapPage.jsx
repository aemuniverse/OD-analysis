import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as L from 'leaflet';
import { aggregate } from '../utils/aggregate';
import { fmtN } from '../utils/format';
import { KpiCard } from '../components/KpiCard';
import { RUAS_PATHS, RUAS_DEFS } from '../data/od_data_generator';

const RUAS_COLOR = '#dc2626';

export function MapPage({ fod, data, setF, triggerKey }) {
  const mapRef = useRef(); const layerRef = useRef(); const ruasRef = useRef(); const inst = useRef();
  const ag = useMemo(() => aggregate(fod), [fod]);
  const [topN, setTopN] = useState(40);
  const sorted = useMemo(() => [...fod].sort((a, b) => b.val - a.val).slice(0, topN), [fod, topN]);
  const maxV = Math.max(1, ...fod.map(r => r.val));

  // Compute map center & zoom from data
  const bounds = useMemo(() => {
    const coords = Object.values(data.coords);
    if (coords.length === 0) return { center: [0.5, 102], zoom: 5 };
    const lats = coords.map(c => c[0]);
    const lngs = coords.map(c => c[1]);
    return {
      sw: [Math.min(...lats) - 0.5, Math.min(...lngs) - 0.5],
      ne: [Math.max(...lats) + 0.5, Math.max(...lngs) + 0.5],
    };
  }, [data.coords]);

  useEffect(() => {
    inst.current = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([0.5, 102.0], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(inst.current);
    ruasRef.current = L.layerGroup().addTo(inst.current);
    layerRef.current = L.layerGroup().addTo(inst.current);

    // Draw HKA ruas network
    Object.entries(RUAS_PATHS).forEach(([code, path]) => {
      if (path.length < 2) return;
      const line = L.polyline(path, { color: RUAS_COLOR, weight: 3, opacity: 0.5, dashArray: '6 4' });
      line.bindTooltip(`<b>${RUAS_DEFS[code]?.label || code}</b><br/>${RUAS_DEFS[code]?.km || '?'} Km`, { className: 'od-tt', sticky: true });
      ruasRef.current.addLayer(line);
    });

    return () => inst.current.remove();
  }, []);

  // Fit bounds when data changes
  useEffect(() => {
    if (inst.current && bounds.sw) {
      inst.current.fitBounds([bounds.sw, bounds.ne], { padding: [30, 30], maxZoom: 12 });
    }
  }, [bounds]);

  useEffect(() => {
    const lg = layerRef.current; if (!lg || !inst.current) return;
    lg.clearLayers(); const C = data.coords; const used = new Set();
    sorted.forEach(r => {
      const o = C[r.origin], d = C[r.dest]; if (!o || !d || r.origin === r.dest) return;
      used.add(r.origin); used.add(r.dest);
      
      // Hitung properti visual dinamis berdasarkan rasio traffic
      const ratio = Math.min(1, Math.max(0, r.val / maxV));
      // Ketebalan: makin tinggi traffic makin tebal (dari 1px sampai 14px)
      const w = 1 + Math.pow(ratio, 0.6) * 13;
      // Transparansi: makin sedikit makin transparan (0.15), makin banyak makin pekat (0.95)
      const op = 0.15 + Math.pow(ratio, 0.5) * 0.8;
      // Kepekatan warna kuning/amber
      let col = '#fde68a'; // kuning muda tipis & transparan untuk traffic rendah
      if (ratio > 0.6) col = '#d97706';      // kuning pekat / amber tua untuk traffic tinggi
      else if (ratio > 0.3) col = '#f59e0b'; // amber standar
      else if (ratio > 0.1) col = '#fbbf24'; // kuning sedang

      const line = L.polyline([o, d], { color: col, weight: w, opacity: op });
      line.bindTooltip(`<b>${r.origin}</b> → <b>${r.dest}</b><br/>${fmtN(r.val)} trx`, { className: 'od-tt' });
      line.on('mouseover', e => e.target.setStyle({ color: '#008f81', opacity: 1, weight: Math.max(w + 2, 4) }));
      line.on('mouseout', e => e.target.setStyle({ color: col, opacity: op, weight: w }));
      line.on('click', () => setF(s => ({ ...s, origin: r.origin, dest: r.dest })));
      lg.addLayer(line);
    });
    used.forEach(g => {
      const c = C[g]; if (!c) return;
      const isD = data.od.some(r => r.dest === g);
      const m = L.marker(c, { icon: L.divIcon({ className: '', html: `<div class="gate-dot${isD ? ' dest' : ''}" style="width:${isD?14:10}px;height:${isD?14:10}px"></div>`, iconSize: [14, 14] }) });
      m.bindTooltip(g, { className: 'od-tt', direction: 'top' });
      m.on('click', () => isD ? setF(s => ({ ...s, dest: g })) : setF(s => ({ ...s, origin: g })));
      lg.addLayer(m);
    });
  }, [sorted, maxV, data]);

  return (
    <>
      <div className="kpis">
        <KpiCard lab="PLOTTED DESIRE LINES" num={sorted.length} formatter="num" trend="Spasial" triggerKey={triggerKey} />
        <KpiCard lab="MAPPED VOLUME" num={sorted.reduce((a, r) => a + r.val, 0)} formatter="num" suffix=" Trx" trend="+98% coverage" triggerKey={triggerKey} />
        <KpiCard lab="ACTIVE NODES" num={new Set(sorted.flatMap(r => [r.origin, r.dest])).size} formatter="num" trend="Gerbang" triggerKey={triggerKey} />
        <KpiCard lab="TOP DESIRE LINE" num={sorted[0]?.val || 0} formatter="num" suffix=" Trx" trend={sorted[0]?.dest || '-'} triggerKey={triggerKey} />
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="head-left"><h3>Desire Line Spasial Mapping – Seluruh HKA</h3><p>Visualisasi pembebanan jalan tol seluruh wilayah operasional</p></div>
          <div className="fl" style={{ minWidth: 200 }}><label>Top N Aliran: {topN}</label><input type="range" min="10" max={Math.max(fod.length, 10)} value={topN} onChange={e => setTopN(+e.target.value)} /></div>
        </div>
        <div style={{ position: 'relative' }}><div id="map" ref={mapRef} /></div>
      </div>
    </>
  );
}
