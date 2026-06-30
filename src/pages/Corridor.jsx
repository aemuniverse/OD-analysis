import React, { useMemo } from 'react';
import { aggregate, corridorOf } from '../utils/aggregate';
import { fmtN } from '../utils/format';
import { KpiCard } from '../components/KpiCard';
import { EChart } from '../components/EChart';

const AXIS_T = { fontFamily: 'Inter', color: '#64748b', fontSize: 11 };
const COL = ['#008f81', '#f59e0b', '#2563eb', '#7c3aed', '#10b981', '#ef4444'];

export function Corridor({ fod, triggerKey }) {
  const ag = useMemo(() => aggregate(fod), [fod]);
  const donutOpt = useMemo(() => ({
    tooltip: { trigger: 'item' },
    legend: { type: 'scroll', orient: 'vertical', right: 10, top: 'center', textStyle: AXIS_T },
    series: [{ type: 'pie', radius: ['50%', '76%'], center: ['32%', '50%'], data: ag.cor.slice(0, 8).map((c, i) => ({ name: c.k, value: c.v, itemStyle: { color: COL[i % COL.length] } })), label: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: 2 } }]
  }), [ag]);

  return (
    <>
      <div className="kpis">
        <KpiCard lab="IDENTIFIED CLUSTERS" num={ag.cor.length} formatter="num" trend="Wilayah" triggerKey={triggerKey} />
        <KpiCard lab="DOMINANT CLUSTER SHARE" num={ag.cor[0] ? Math.round(ag.cor[0].v / ag.total * 100) : 0} formatter="pct" suffix="%" trend={ag.cor[0]?.k} triggerKey={triggerKey} />
        <KpiCard lab="TOP CLUSTER VOLUME" num={ag.cor[0]?.v || 0} formatter="num" suffix=" Trx" trend="+6.2%" triggerKey={triggerKey} />
        <KpiCard lab="TOP 3 CONCENTRATION" num={Math.round(ag.cor.slice(0, 3).reduce((a, c) => a + c.v, 0) / (ag.total || 1) * 100)} formatter="pct" suffix="%" trend="Agregat" triggerKey={triggerKey} />
      </div>

      <div className="grid g2">
        <div className="panel"><div className="head"><div className="head-left"><h3>Peringkat Demand Koridor Wilayah</h3><p>Share transaksi antar cluster</p></div></div><div className="body">{ag.cor.slice(0, 8).map((c, i) => <div className="corbar" key={i}><div className="top"><span className="cn">{c.k}</span><span className="cv"><b>{fmtN(c.v)}</b> trx · {(c.v / ag.total * 100).toFixed(1)}%</span></div><div className="track"><i style={{ width: (c.v / ag.cor[0].v * 100) + '%', background: COL[i % COL.length] }} /></div></div>)}</div></div>
        <div className="panel"><div className="head"><div className="head-left"><h3>Komposisi Cluster</h3><p>Proporsi pangsa pasar</p></div></div><div className="body"><EChart option={donutOpt} height={320} triggerKey={triggerKey} /></div></div>
      </div>
    </>
  );
}
