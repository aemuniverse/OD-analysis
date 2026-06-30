import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';

const AXIS_T = { fontFamily: 'Inter', color: '#64748b', fontSize: 11 };

export function InlineChart({ chart }) {
  const ref = useRef();
  const inst = useRef();

  useEffect(() => {
    if (!ref.current) return;
    inst.current = echarts.init(ref.current);
    const colors = ['#008f81', '#f59e0b', '#2563eb', '#7c3aed', '#10b981'];
    let opt = {};

    if (chart.type === 'bar') {
      opt = {
        grid: { left: 4, right: 16, top: 12, bottom: 4, containLabel: true },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: chart.categories, axisLabel: { ...AXIS_T, fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: AXIS_T, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        series: [{ type: 'bar', data: chart.series, itemStyle: { color: '#008f81', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 36 }]
      };
    } else if (chart.type === 'pie') {
      opt = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 0, textStyle: { ...AXIS_T, fontSize: 10 } },
        series: [{
          type: 'pie', radius: ['42%', '72%'], center: ['50%', '42%'],
          data: chart.categories.map((c, i) => ({ name: c, value: chart.series[i], itemStyle: { color: colors[i % colors.length] } })),
          label: { show: false }, itemStyle: { borderColor: '#fff', borderWidth: 2 }
        }]
      };
    }
    inst.current.setOption(opt);
    return () => inst.current.dispose();
  }, [chart]);

  return (
    <div className="res-chart">
      {chart.title && <div className="res-chart-title">{chart.title}</div>}
      <div ref={ref} style={{ width: '100%', height: 180 }} />
    </div>
  );
}
