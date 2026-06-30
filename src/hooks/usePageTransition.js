import { useState, useEffect } from 'react';

export function usePageTransition(pageKey) {
  const [animKey, setAnimKey] = useState(pageKey);

  useEffect(() => {
    setAnimKey(pageKey + '_' + Date.now());
  }, [pageKey]);

  return animKey;
}
