import React from 'react';
import { useCountUp } from '../hooks/useCountUp';
import { fmtN, fmtRp } from '../utils/format';

export function KpiCard({ lab, num, suffix = '', formatter = 'num', trend = '+5.2%', isDown, triggerKey }) {
  const animatedNum = useCountUp(typeof num === 'number' ? num : 0, 1200, triggerKey);

  let displayVal = num;
  if (typeof num === 'number') {
    if (formatter === 'rp') displayVal = fmtRp(animatedNum);
    else if (formatter === 'pct') displayVal = animatedNum + suffix;
    else displayVal = fmtN(animatedNum) + suffix;
  }

  return (
    <div className="kpi">
      <div className="kpi-header">
        <div className="kpi-label">{lab}</div>
      </div>
      <div className="kpi-val disp">{displayVal}</div>
      <div className="kpi-meta">
        <span className={'kpi-trend ' + (isDown ? 'down' : 'up')}>
          {isDown ? '▼' : '▲'} {trend}
        </span>
        <span>YoY</span>
      </div>
    </div>
  );
}
