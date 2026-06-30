import React, { useMemo } from 'react';
import { fmtN, fmtRp } from '../utils/format';

const TF_LABEL = { daily: 'OD TODAY', monthly: 'OD BULAN INI', yearly: 'OD TAHUN INI' };

export function Ticker({ data, timeframe }) {
  const tickerItems = useMemo(() => {
    const top = [...data.od].sort((a, b) => b.traffic - a.traffic).find(r => r.traffic > 0) || { origin: '-', dest: '-', traffic: 0 };
    const totTrx = data.od.reduce((a, r) => a + r.traffic, 0);
    const totRev = Object.values(data.gate_rev).reduce((a, g) => a + g.total, 0);
    const gateCount = Object.keys(data.coords || {}).length;
    
    return [
      { text: `Total transaksi jaringan ${fmtN(totTrx)} kendaraan — ${gateCount} gerbang aktif` },
      { text: `OD pair dominan ${top.origin} → ${top.dest} mencapai ${fmtN(top.traffic)} trx` },
      { text: `Realisasi pendapatan tercatat ${fmtRp(totRev)} — pertumbuhan positif` },
      { text: `Wilayah operasional HKA Trans-Sumatera — sistem tol tertutup & terbuka` }
    ];
  }, [data]);

  return (
    <div className="ticker">
      <div className="ticker-badge">{TF_LABEL[timeframe] || 'OD TODAY'}</div>
      <div className="ticker-track">
        <div className="ticker-inner">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} className="ticker-item">
              <span>●</span>
              <span>{t.text}</span>
              <span className="ticker-sep">———</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
