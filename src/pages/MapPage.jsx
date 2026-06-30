import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as L from 'leaflet';
import { aggregate, corridorOf } from '../utils/aggregate';
import { fmtN } from '../utils/format';
import { KpiCard } from '../components/KpiCard';

export function MapPage({ fod, data, setF, triggerKey }) {
  const mapRef = useRef(); const layerRef = useRef(); const inst = useRef();
  const ag = useMemo(() => aggregate(fod), [fod]);
  const [topN, setTopN] = useState(40);
  const sorted = useMemo(() => [...fod].sort((a, b) => b.val - a.val).slice(0, topN), [fod, topN]);
  const maxV = Math.max(1, ...fod.map(r => r.val));

  useEffect(() => {
    inst.current = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([3.45, 99.0], 9);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 18 }).addTo(inst.current);
    layerRef.current = L.layerGroup().addTo(inst.current);
    return () => inst.current.remove();
  }, []);

  useEffect(() => {
    const lg = layerRef.current; if (!lg || !inst.current) return;
    lg.clearLayers(); const C = data.coords; const used = new Set();
    sorted.forEach(r => {
      const o = C[r.origin], d = C[r.dest]; if (!o || !d || r.origin === r.dest) return;
      used.add(r.origin); used.add(r.dest);
      const w = 1 + (r.val / maxV) * 8; const op = 0.3 + (r.val / maxV) * 0.6;
      const line = L.polyline([o, d], { color: '#f59e0b', weight: w, opacity: op });
      line.bindTooltip(`<b>${r.origin}</b> → <b>${r.dest}</b><br/>${fmtN(r.val)} trx`, { className: 'od-tt' });
      line.on('mouseover', e => e.target.setStyle({ color: '#008f81', opacity: 1 }));
      line.on('mouseout', e => e.target.setStyle({ color: '#f59e0b', opacity: op }));
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
          <div className="head-left"><h3>Desire Line Spasial Mapping</h3><p>Visualisasi pembebanan jalan tol</p></div>
          <div className="fl" style={{ minWidth: 200 }}><label>Top N Aliran: {topN}</label><input type="range" min="10" max={fod.length} value={topN} onChange={e => setTopN(+e.target.value)} /></div>
        </div>
        <div style={{ position: 'relative' }}><div id="map" ref={mapRef} /></div>
      </div>
    </>
  );
}
