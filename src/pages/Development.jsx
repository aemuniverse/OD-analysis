import React, { useMemo } from 'react';
import { aggregate } from '../utils/aggregate';
import { KpiCard } from '../components/KpiCard';

export function Development({ fod, triggerKey }) {
  const ag = useMemo(() => aggregate(fod), [fod]);
  return (
    <>
      <div className="kpis">
        <KpiCard lab="VALUE CREATION ZONES" num={ag.prod.length} formatter="num" trend="Active" triggerKey={triggerKey} />
        <KpiCard lab="HIGH MATERIALITY" num={12} formatter="num" trend="Gerbang" triggerKey={triggerKey} />
      </div>
      <div className="panel"><div className="head"><div className="head-left"><h3>Value Creation Mapping Zone</h3><p>Potensi pengembangan wilayah</p></div></div><div className="body" style={{ fontSize: 13, color: '#64748b' }}>Zona prioritas pengembangan terfokus pada koridor gerbang Kuala Tanjung dan Indrapura guna mendukung arus logistik Pelabuhan Kuala Tanjung.</div></div>
    </>
  );
}
