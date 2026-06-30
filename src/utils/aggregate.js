import { GATE_DEFS, RUAS_DEFS } from '../data/od_data_generator';

export const RUAS_LABEL = Object.fromEntries(
  Object.entries(RUAS_DEFS).map(([code, def]) => [code, def.label])
);

export const REGION = Object.fromEntries(
  Object.entries(GATE_DEFS).map(([name, def]) => [name, def.region])
);

export const corridorOf = (o, d) => (REGION[o] || 'Lainnya') + ' → ' + (REGION[d] || d);

export function aggregate(fod) {
  const byOrigin = {}, byDest = {}, byCorridor = {}, pairs = [];
  fod.forEach(r => {
    byOrigin[r.origin] = (byOrigin[r.origin] || 0) + r.val;
    byDest[r.dest] = (byDest[r.dest] || 0) + r.val;
    const c = corridorOf(r.origin, r.dest);
    byCorridor[c] = (byCorridor[c] || 0) + r.val;
    pairs.push({ ...r });
  });
  const total = fod.reduce((a, r) => a + r.val, 0);
  const topPairs = [...pairs].sort((a, b) => b.val - a.val);
  const prod = Object.entries(byOrigin).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
  const attr = Object.entries(byDest).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
  const cor = Object.entries(byCorridor).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
  const conc = total ? topPairs.slice(0, 5).reduce((a, p) => a + p.val, 0) / total : 0;
  return { total, topPairs, prod, attr, cor, conc };
}
