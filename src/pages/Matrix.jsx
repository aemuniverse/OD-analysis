import React, { useMemo } from 'react';
import { aggregate } from '../utils/aggregate';
import { fmtN } from '../utils/format';
import { KpiCard } from '../components/KpiCard';
import { EChart } from '../components/EChart';

const AXIS_T = { fontFamily: 'Inter', color: '#64748b', fontSize: 11 };

export function Matrix({ fod, setF, triggerKey }) {
  const ag = useMemo(() => aggregate(fod), [fod]);
  const origins2 = useMemo(() => ag.prod.slice(0, 16).map(p => p.k), [ag]);
  const dests2 = useMemo(() => ag.attr.map(a => a.k), [ag]);

  const hmOption = useMemo(() => {
    const cell = {}; fod.forEach(r => { cell[r.origin + '|' + r.dest] = r.val; });
    const hmData = [];
    origins2.forEach((o, oi) => dests2.forEach((d, di) => hmData.push([di, oi, cell[o + '|' + d] || 0])));
    const maxV = Math.max(1, ...hmData.map(x => x[2]));

    return {
      grid: { left: 4, right: 16, top: 12, bottom: 76, containLabel: true },
      tooltip: { position: 'top', formatter: p => `<b>${origins2[p.value[1]]}</b> → ${dests2[p.value[0]]}<br/>${fmtN(p.value[2])} transaksi` },
      xAxis: { type: 'category', data: dests2, axisLabel: { ...AXIS_T, rotate: 36, fontSize: 10 }, splitArea: { show: true } },
      yAxis: { type: 'category', data: origins2, axisLabel: { ...AXIS_T, fontSize: 10 }, splitArea: { show: true } },
      visualMap: { min: 0, max: maxV, calculable: true, orient: 'horizontal', left: 'center', bottom: 0, inRange: { color: ['#f8fafc', '#ccfbf1', '#008f81', '#045c52', '#0f172a'] }, textStyle: AXIS_T, itemHeight: 90 },
      series: [{ type: 'heatmap', data: hmData, label: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: 1 } }]
    };
  }, [fod, origins2, dests2]);

  return (
    <>
      <div className="kpis">
        <KpiCard lab="FILTERED TRIPS" num={ag.total} formatter="num" trend="+4.2%" triggerKey={triggerKey} />
        <KpiCard lab="ACTIVE OD PAIRS" num={fod.length} formatter="num" trend="Stabil" triggerKey={triggerKey} />
        <KpiCard lab="TOP 5 CONCENTRATION" num={Math.round(ag.conc * 100)} formatter="pct" suffix="%" trend="-0.5%" isDown triggerKey={triggerKey} />
        <KpiCard lab="AVERAGE TRIP / PAIR" num={Math.round(ag.total / (fod.length || 1))} formatter="num" trend="+12 trx" triggerKey={triggerKey} />
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="head"><div className="head-left"><h3>Cluster Health Heatmap Matrix</h3><p>Intensitas perjalanan gerbang asal × gerbang tujuan</p></div></div>
        <div className="body"><EChart option={hmOption} height={440} onClick={p => p.value && setF(s => ({ ...s, origin: origins2[p.value[1]], dest: dests2[p.value[0]] }))} triggerKey={triggerKey} /></div>
      </div>

      <div className="grid g3">
        <RankCard title="Produksi Perjalanan" sub="Gerbang asal teraktif" rows={ag.prod.slice(0, 8)} max={ag.prod[0]?.v} onPick={k => setF(s => ({ ...s, origin: k }))} />
        <RankCard title="Atraksi Perjalanan" sub="Gerbang keluar teraktif" rows={ag.attr.slice(0, 8)} max={ag.attr[0]?.v} color="#f59e0b" onPick={k => setF(s => ({ ...s, dest: k }))} />
        <div className="panel"><div className="head"><div className="head-left"><h3>System Audit Note</h3><p>Evaluasi pola matriks</p></div></div><div className="body" style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Pola perjalanan terpusat pada gerbang Amplas dan Tanjung Selamat menuju koridor gerbang Tebing Tinggi 2. Jaringan menunjukkan kapabilitas pembebanan yang stabil.</div></div>
      </div>
    </>
  );
}

function RankCard({ title, sub, rows, max, color = '#008f81', onPick }) {
  return (
    <div className="panel">
      <div className="head"><div className="head-left"><h3>{title}</h3><p>{sub}</p></div></div>
      <div className="body tight">
        <table>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ cursor: onPick ? 'pointer' : 'default' }} onClick={() => onPick && onPick(r.k)}>
                <td style={{ width: 24 }}><span className={'rank' + (i === 0 ? ' top' : '')}>{i + 1}</span></td>
                <td style={{ fontWeight: 600, fontSize: 12 }}>{r.k}</td>
                <td style={{ width: 80 }}><div className="flowbar"><i style={{ width: (r.v / max * 100) + '%', background: color }} /></div></td>
                <td className="num-c" style={{ width: 44 }}>{fmtN(r.v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
