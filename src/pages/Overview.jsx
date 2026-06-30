import React, { useMemo } from 'react';
import { aggregate } from '../utils/aggregate';
import { fmtN, fmtRp } from '../utils/format';
import { KpiCard } from '../components/KpiCard';
import { EChart } from '../components/EChart';

const AXIS_T = { fontFamily: 'Inter', color: '#64748b', fontSize: 11 };
const icoFilter = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;

export function Overview({ fod, data, setF, setPage, triggerKey }) {
  const ag = useMemo(() => aggregate(fod), [fod]);
  
  const revNum = useMemo(() => {
    const ds = [...new Set(fod.map(r => r.dest_code))];
    return Object.entries(data.gate_rev).filter(([c]) => ds.includes(c)).reduce((a, [, g]) => a + g.total, 0);
  }, [fod, data]);

  const prodAttrOpt = useMemo(() => {
    const names = ag.prod.slice(0, 8).map(d => d.k);
    const attrMap = Object.fromEntries(ag.attr.map(a => [a.k, a.v]));
    return {
      grid: { left: 4, right: 24, top: 24, bottom: 4, containLabel: true },
      legend: { data: ['Produksi', 'Atraksi'], top: 0, textStyle: AXIS_T, itemGap: 20 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => fmtN(v) + ' trx' },
      xAxis: { type: 'value', axisLabel: AXIS_T, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      yAxis: { type: 'category', data: names.slice().reverse(), axisLabel: { ...AXIS_T, fontSize: 10.5 } },
      series: [
        { name: 'Produksi', type: 'bar', data: names.slice().reverse().map(n => ag.prod.find(d => d.k === n)?.v || 0), itemStyle: { color: '#008f81', borderRadius: [0, 4, 4, 0] }, barWidth: 8 },
        { name: 'Atraksi', type: 'bar', data: names.slice().reverse().map(n => attrMap[n] || 0), itemStyle: { color: '#f59e0b', borderRadius: [0, 4, 4, 0] }, barWidth: 8 }
      ]
    };
  }, [ag]);

  return (
    <>
      <div className="kpis">
        <KpiCard lab="TOTAL REVENUE" num={revNum} formatter="rp" trend="+8.4%" triggerKey={triggerKey} />
        <KpiCard lab="TOTAL VOLUME TRIP" num={ag.total} formatter="num" suffix=" Trx" trend="+5.1%" triggerKey={triggerKey} />
        <KpiCard lab="ACTIVE ORIGIN GATES" num={ag.prod.length} formatter="num" suffix=" / 36" trend="+2 zona" triggerKey={triggerKey} />
        <KpiCard lab="DEMAND CONCENTRATION" num={Math.round(ag.conc * 100)} formatter="pct" suffix="%" trend="-1.2%" isDown triggerKey={triggerKey} />
      </div>

      <div className="grid g2" style={{ marginBottom: 20 }}>
        <div className="panel">
          <div className="head">
            <div className="head-left">
              <h3>Produksi & Atraksi Perjalanan Console</h3>
              <p>Agregat demand asal dan tujuan per gerbang tol (36 gerbang aktif)</p>
            </div>
            <div className="head-ico">{icoFilter}</div>
          </div>
          <div className="body">
            <EChart option={prodAttrOpt} height={300} onClick={p => p.name && setF(s => ({ ...s, origin: p.name }))} triggerKey={triggerKey} />
          </div>
        </div>

        <div className="panel">
          <div className="head">
            <div className="head-left">
              <h3>Top 5 Profit & Traffic Engine</h3>
              <p>Kontribusi volume perjalanan tertinggi</p>
            </div>
          </div>
          <div className="body tight">
            <table>
              <thead><tr><th>#</th><th>Pasangan OD</th><th style={{ textAlign: 'right' }}>Trx</th><th style={{ width: 60 }}>Share</th></tr></thead>
              <tbody>
                {ag.topPairs.slice(0, 5).map((p, i) => (
                  <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setF(s => ({ ...s, origin: p.origin, dest: p.dest }))}>
                    <td><span className={'rank' + (i === 0 ? ' top' : '')}>{i + 1}</span></td>
                    <td><span className="od-pair">{p.origin} <span className="arr">→</span> {p.dest}</span></td>
                    <td className="num-c">{fmtN(p.val)}</td>
                    <td><div className="flowbar"><i style={{ width: (p.val / ag.topPairs[0].val * 100) + '%' }} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid g2e">
        <div className="panel">
          <div className="head">
            <div className="head-left">
              <h3>Watchlist & Risiko Koridor</h3>
              <p>Perlu perhatian eksekutif</p>
            </div>
            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12 }}>⚠ Risiko</span>
          </div>
          <div className="body tight">
            <table>
              <thead><tr><th>#</th><th>Koridor Demand</th><th style={{ textAlign: 'right' }}>Trx</th><th>Status</th></tr></thead>
              <tbody>
                {ag.cor.slice(0, 5).map((c, i) => (
                  <tr key={i}>
                    <td><span className="rank">{i + 1}</span></td>
                    <td style={{ fontWeight: 600 }}>{c.k}</td>
                    <td className="num-c">{fmtN(c.v)}</td>
                    <td><span style={{ fontSize: 11, fontWeight: 600, color: i === 0 ? '#008f81' : '#f59e0b' }}>{i === 0 ? '● Stabil' : '● Watchlist'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 14px' }}>
              <button className="expbtn" onClick={() => setPage('corridor')}>Lihat cluster lengkap →</button>
            </div>
          </div>
        </div>

        <div className="insight">
          <div className="ih"><span className="badge">Executive Note</span><h3>BUMN Regulatory Intel</h3></div>
          <ul>
            <li><span className="mk">1</span><span>Koridor strategis <b>{ag.cor[0]?.k}</b> memegang pangsa dominan <b>{(ag.cor[0]?.v / ag.total * 100).toFixed(1)}%</b> lalu lintas.</span></li>
            <li><span className="mk">2</span><span>Struktur pendapatan e-toll menyumbang &gt;99% keseluruhan cashflow gerbang.</span></li>
            <li><span className="mk">3</span><span>Konsentrasi demand yang sehat mendukung perluasan gerbang Tebing Tinggi 2.</span></li>
          </ul>
          <div className="note">Sistem transaksi tertutup ATT6 Trans-Sumatra Q2 2026.</div>
        </div>
      </div>
    </>
  );
}
