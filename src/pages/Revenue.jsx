import React, { useMemo } from 'react';
import { aggregate, RUAS_LABEL } from '../utils/aggregate';
import { fmtN, fmtRp } from '../utils/format';
import { KpiCard } from '../components/KpiCard';
import { EChart } from '../components/EChart';

const AXIS_T = { fontFamily: 'Inter', color: '#64748b', fontSize: 11 };

export function Revenue({ data, fod, f, triggerKey }) {
  const ds = f.dest === 'ALL' ? Object.keys(data.gate_rev) : Object.keys(data.gate_rev).filter(c => data.gate_rev[c].dest === f.dest);
  const gates = useMemo(() => ds.map(c => ({ c, ...data.gate_rev[c] })), [ds, data]);
  const totRev = useMemo(() => gates.reduce((a, g) => a + g.total, 0), [gates]);
  const totTunai = useMemo(() => gates.reduce((a, g) => a + g.tunai, 0), [gates]);
  const totEtoll = useMemo(() => gates.reduce((a, g) => a + g.etoll, 0), [gates]);

  const gateBarOpt = useMemo(() => ({
    grid: { left: 4, right: 20, top: 26, bottom: 4, containLabel: true },
    legend: { data: ['Tunai', 'E-Toll'], top: 0, textStyle: AXIS_T },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => fmtRp(v) },
    xAxis: { type: 'value', axisLabel: { ...AXIS_T, formatter: v => (v / 1e6).toFixed(0) + 'jt' } },
    yAxis: { type: 'category', data: gates.map(g => g.dest).reverse(), axisLabel: AXIS_T },
    series: [{ name: 'Tunai', type: 'bar', stack: 'r', data: gates.map(g => g.tunai).reverse(), itemStyle: { color: '#f59e0b' }, barWidth: 14 }, { name: 'E-Toll', type: 'bar', stack: 'r', data: gates.map(g => g.etoll).reverse(), itemStyle: { color: '#008f81', borderRadius: [0, 4, 4, 0] }, barWidth: 14 }]
  }), [gates]);

  return (
    <>
      <div className="kpis">
        <KpiCard lab="TOTAL REALIZED REVENUE" num={totRev} formatter="rp" trend="+7.4% YoY" triggerKey={triggerKey} />
        <KpiCard lab="E-TOLL CASHFLOW" num={totEtoll} formatter="rp" trend={(totEtoll / totRev * 100).toFixed(1) + '%'} triggerKey={triggerKey} />
        <KpiCard lab="CASH REVENUE" num={totTunai} formatter="rp" trend="Tunai" isDown triggerKey={triggerKey} />
        <KpiCard lab="INDICATIVE TARIFF / TRIP" num={Math.round(totRev / (fod.reduce((a,r)=>a+r.val,0)||1))} formatter="rp" trend="Rata-rata" triggerKey={triggerKey} />
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="head"><div className="head-left"><h3>Financial Trend per Exit Gate</h3><p>Komposisi metode pembayaran</p></div></div>
        <div className="body"><EChart option={gateBarOpt} height={320} triggerKey={triggerKey} /></div>
      </div>
    </>
  );
}
