export function buildSystemPrompt(data) {
  const totalTrx = data.od.reduce((a, r) => a + r.traffic, 0);
  const totRev = Object.values(data.gate_rev).reduce((a, g) => a + g.total, 0);
  const topPairs = [...data.od].sort((a, b) => b.traffic - a.traffic).slice(0, 15);
  const bankTotals = { mandiri: 0, bri: 0, bni: 0, bca: 0 };
  data.od.forEach(r => { Object.keys(bankTotals).forEach(b => bankTotals[b] += (r.bank[b] || 0)); });
  const gateRevStr = Object.entries(data.gate_rev).map(([, v]) => `  - ${v.dest}: Total Rp ${v.total.toLocaleString('id-ID')} | Tunai Rp ${v.tunai.toLocaleString('id-ID')} | E-Toll Rp ${v.etoll.toLocaleString('id-ID')}`).join('\n');
  const topPairsStr = topPairs.filter(p => p.traffic > 0).map((p, i) => `  ${i + 1}. ${p.origin} → ${p.dest}: ${p.traffic} trx`).join('\n');
  const byOrigin = {}; data.od.forEach(r => { byOrigin[r.origin] = (byOrigin[r.origin] || 0) + r.traffic; });
  const topOrigins = Object.entries(byOrigin).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const byDest = {}; data.od.forEach(r => { byDest[r.dest] = (byDest[r.dest] || 0) + r.traffic; });
  const topDests = Object.entries(byDest).sort((a, b) => b[1] - a[1]).slice(0, 8);
  
  return `Kamu adalah OD AI, asisten analitik untuk OD Matrix Tol Trans-Sumatra. Jawab dalam Bahasa Indonesia profesional.

DATA AKTIF (${data.date}):
Total Transaksi: ${totalTrx.toLocaleString('id-ID')} | Total Pendapatan: Rp ${totRev.toLocaleString('id-ID')}
OD Pair Aktif: ${data.od.filter(r => r.traffic > 0).length} | Tarif Rata-rata: Rp ${Math.round(totRev / totalTrx).toLocaleString('id-ID')}

PENDAPATAN PER GERBANG:
${gateRevStr}

TOP 15 PASANGAN OD:
${topPairsStr}

TOP 10 GERBANG ASAL: ${topOrigins.map((e, i) => `${i + 1}.${e[0]}:${e[1]}`).join(' ')}
TOP 8 GERBANG TUJUAN: ${topDests.map((e, i) => `${i + 1}.${e[0]}:${e[1]}`).join(' ')}

BANK: Mandiri:${bankTotals.mandiri}(${(bankTotals.mandiri / totalTrx * 100).toFixed(1)}%) BRI:${bankTotals.bri}(${(bankTotals.bri / totalTrx * 100).toFixed(1)}%) BNI:${bankTotals.bni}(${(bankTotals.bni / totalTrx * 100).toFixed(1)}%) BCA:${bankTotals.bca}(${(bankTotals.bca / totalTrx * 100).toFixed(1)}%)

DATA OD LENGKAP: ${data.od.filter(r => r.traffic > 0).map(r => `${r.origin}→${r.dest}:${r.traffic}`).join(' ')}

INSTRUKSI: Kembalikan JSON valid SAJA (tanpa markdown):
{"answer":"jawaban lengkap...","cards":[{"label":"nama","value":"nilai","sub":"keterangan"}],"chart":{"type":"bar|pie|none","title":"judul","categories":["A","B"],"series":[1,2]}}
Cards maks 4. Chart "none" jika tidak perlu.`;
}
