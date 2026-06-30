import { useState, useEffect } from 'react';

export function useCountUp(targetValue, duration = 1200, triggerKey) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (typeof targetValue !== 'number' || isNaN(targetValue)) {
      setCurrent(targetValue);
      return;
    }

    let startTime = null;
    let animId = null;
    const startVal = 0;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const t = Math.min(progress / duration, 1);
      
      const ease = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const val = Math.floor(startVal + (targetValue - startVal) * ease);
      
      setCurrent(val);

      if (t < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        setCurrent(targetValue);
      }
    };

    setCurrent(0);
    animId = requestAnimationFrame(animate);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [targetValue, duration, triggerKey]);

  return current;
}
