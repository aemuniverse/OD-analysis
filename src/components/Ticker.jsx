import React, { useMemo } from 'react';
import { fmtN, fmtRp } from '../utils/format';

export function Ticker({ data }) {
  const tickerItems = useMemo(() => {
    const top = [...data.od].sort((a, b) => b.traffic - a.traffic).find(r => r.traffic > 0) || { origin: '-', dest: '-', traffic: 0 };
    const totTrx = data.od.reduce((a, r) => a + r.traffic, 0);
    const totRev = Object.values(data.gate_rev).reduce((a, g) => a + g.total, 0);
    
    return [
      { text: `Total transaksi jaringan ${fmtN(totTrx)} kendaraan — sistem tertutup full operation` },
      { text: `OD pair dominan ${top.origin} → ${top.dest} mencapai ${top.traffic} trx hari ini` },
      { text: `Realisasi pendapatan harian tercatat ${fmtRp(totRev)} — pertumbuhan positif` },
      { text: `Gerbang Tebing Tinggi 2 kontribusi lalu lintas tertinggi dalam jaringan` }
    ];
  }, [data]);

  return (
    <div className="ticker">
      <div className="ticker-badge">OD TODAY</div>
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
