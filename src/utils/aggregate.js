export const RUAS_LABEL = {
  HMW: 'Helvetia-Marelan-Binjai',
  BINSA: 'Binjai-Stabat',
  MEBI: 'Medan-Binjai',
  BELMERA: 'Belmera',
  MKTT: 'Kualanamu-Tebing Tinggi',
  INKIS: 'Indrapura-Kisaran'
};

export const REGION = {
  'KUALANAMU': 'Bandara/Timur', 'KEMIRI': 'Bandara/Timur', 'LUBUK PAKAM': 'Deli Serdang',
  'PERBAUNGAN': 'Serdang Bedagai', 'TELUK MENGKUDU': 'Serdang Bedagai', 'SEI RAMPAH': 'Serdang Bedagai',
  'TEBING TINGGI': 'Tebing Tinggi', 'TEBING TINGGI 2': 'Tebing Tinggi', 'BELAWAN': 'Medan Utara',
  'MABAR 1': 'Medan Utara', 'TANJUNG MULIA': 'Medan Utara', 'MARELAN': 'Medan Utara',
  'BANDAR SELAMAT 4': 'Medan Kota', 'AMPLAS': 'Medan Kota', 'TANJUNG MORAWA': 'Medan Kota',
  'H. ANIF 1': 'Medan Kota', 'HELVETIA': 'Medan Barat', 'SEMAYANG': 'Medan Barat',
  'BINJAI': 'Binjai', 'BINJAI UTAMA': 'Binjai', 'STABAT': 'Langkat',
  'KUALA BINGAI': 'Langkat', 'PANGKALAN BRANDAN': 'Langkat', 'TANJUNG PURA': 'Langkat',
  'INDRAPURA': 'Batubara', 'KUALA TANJUNG': 'Batubara', 'DOLOK MERAWAN': 'Serdang Bedagai',
  'SINAKSAK': 'Simalungun', 'SIMPANG PANEI': 'Simalungun', 'LIMA PULUH': 'Batubara',
  'KISARAN': 'Asahan'
};

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
