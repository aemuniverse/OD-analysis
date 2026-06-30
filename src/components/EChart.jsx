import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';

export function EChart({ option, height = 320, onClick, triggerKey }) {
  const ref = useRef();
  const inst = useRef();

  useEffect(() => {
    inst.current = echarts.init(ref.current);
    if (onClick) inst.current.on('click', onClick);
    const ro = new ResizeObserver(() => inst.current && inst.current.resize());
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
      inst.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (!inst.current) return;
    const animatedOption = {
      ...option,
      animation: true,
      animationDuration: 1100,
      animationEasing: 'cubicOut',
      animationDurationUpdate: 600,
      animationEasingUpdate: 'quinticInOut'
    };
    inst.current.setOption(animatedOption, true);
  }, [option, triggerKey]);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
