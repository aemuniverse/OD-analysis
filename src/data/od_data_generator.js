/* ============================================================
   OD Data Generator – Seluruh Wilayah Operasional HKA
   Generates realistic dummy OD data for Trans-Sumatera toll roads
   ============================================================ */

// ── PRNG (Seeded Random) ─────────────────────────────────────
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h) || 1;
}
function mulberry32(seed) {
  let s = seed;
  return () => {
    let t = s += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function rr(rng, a, b) { return a + rng() * (b - a); }
function ri(rng, a, b) { return Math.floor(rr(rng, a, b + 1)); }

// ── Temporal Factors ─────────────────────────────────────────
const DOW_F = [0.75, 1.0, 1.0, 1.0, 1.05, 1.15, 0.85]; // Sun..Sat
const MON_F = [0.90, 0.85, 0.95, 1.05, 1.10, 1.15, 1.05, 0.95, 0.90, 0.95, 1.00, 1.10]; // Jan..Dec

// ── Gate Definitions ─────────────────────────────────────────
// { lat, lng, ruas, region, imp(importance 1-5) }
export const GATE_DEFS = {
  // === ACEH: Sigli – Banda Aceh (SBA) ===
  'BANDA ACEH':      { lat: 5.548, lng: 95.323, ruas: 'SBA', region: 'Banda Aceh', imp: 4 },
  'BLANG BINTANG':   { lat: 5.523, lng: 95.428, ruas: 'SBA', region: 'Aceh Besar', imp: 2 },
  'SEULIMEUM':       { lat: 5.463, lng: 95.641, ruas: 'SBA', region: 'Aceh Besar', imp: 2 },
  'SIGLI':           { lat: 5.387, lng: 96.073, ruas: 'SBA', region: 'Pidie', imp: 3 },

  // === ACEH: Binjai – Langsa (BIL) ===
  'LANGSA':          { lat: 4.468, lng: 97.968, ruas: 'BIL', region: 'Langsa', imp: 3 },
  'KUALA SIMPANG':   { lat: 4.250, lng: 97.930, ruas: 'BIL', region: 'Aceh Tamiang', imp: 2 },
  'TANJUNG SELAMAT': { lat: 4.100, lng: 98.150, ruas: 'BIL', region: 'Deli Serdang', imp: 2 },
  'PANGKALAN SUSU':  { lat: 4.350, lng: 98.100, ruas: 'BIL', region: 'Langkat', imp: 2 },

  // === SUMUT: Medan – Binjai (MEBI) ===
  'BINJAI':          { lat: 3.600, lng: 98.485, ruas: 'MEBI', region: 'Binjai', imp: 3 },
  'BINJAI UTAMA':    { lat: 3.610, lng: 98.480, ruas: 'MEBI', region: 'Binjai', imp: 2 },

  // === SUMUT: Helvetia–Marelan–Binjai (HMW) ===
  'HELVETIA':        { lat: 3.620, lng: 98.640, ruas: 'HMW', region: 'Medan Barat', imp: 3 },
  'SEMAYANG':        { lat: 3.610, lng: 98.630, ruas: 'HMW', region: 'Medan Barat', imp: 2 },
  'MARELAN':         { lat: 3.690, lng: 98.650, ruas: 'HMW', region: 'Medan Utara', imp: 2 },

  // === SUMUT: Binjai–Stabat (BINSA) ===
  'STABAT':          { lat: 3.760, lng: 98.450, ruas: 'BINSA', region: 'Langkat', imp: 2 },
  'KUALA BINGAI':    { lat: 3.800, lng: 98.380, ruas: 'BINSA', region: 'Langkat', imp: 1 },
  'PANGKALAN BRANDAN': { lat: 4.020, lng: 98.230, ruas: 'BINSA', region: 'Langkat', imp: 2 },
  'TANJUNG PURA':    { lat: 3.895, lng: 98.410, ruas: 'BINSA', region: 'Langkat', imp: 2 },

  // === SUMUT: Belmera (BELMERA) ===
  'BELAWAN':         { lat: 3.780, lng: 98.690, ruas: 'BELMERA', region: 'Medan Utara', imp: 3 },
  'MABAR 1':         { lat: 3.670, lng: 98.680, ruas: 'BELMERA', region: 'Medan Utara', imp: 2 },
  'TANJUNG MULIA':   { lat: 3.650, lng: 98.670, ruas: 'BELMERA', region: 'Medan Utara', imp: 2 },
  'BANDAR SELAMAT 4':{ lat: 3.600, lng: 98.710, ruas: 'BELMERA', region: 'Medan Kota', imp: 3 },
  'AMPLAS':          { lat: 3.550, lng: 98.715, ruas: 'BELMERA', region: 'Medan Kota', imp: 5 },
  'TANJUNG MORAWA':  { lat: 3.530, lng: 98.790, ruas: 'BELMERA', region: 'Medan Kota', imp: 3 },
  'H. ANIF 1':       { lat: 3.630, lng: 98.660, ruas: 'BELMERA', region: 'Medan Kota', imp: 2 },

  // === SUMUT: Kualanamu – Tebing Tinggi (MKTT) ===
  'KUALANAMU':       { lat: 3.6422, lng: 98.8853, ruas: 'MKTT', region: 'Bandara/Timur', imp: 4 },
  'KEMIRI':          { lat: 3.609, lng: 98.840, ruas: 'MKTT', region: 'Bandara/Timur', imp: 2 },
  'LUBUK PAKAM':     { lat: 3.557, lng: 98.873, ruas: 'MKTT', region: 'Deli Serdang', imp: 3 },
  'PERBAUNGAN':      { lat: 3.568, lng: 98.958, ruas: 'MKTT', region: 'Serdang Bedagai', imp: 2 },
  'TELUK MENGKUDU':  { lat: 3.490, lng: 99.060, ruas: 'MKTT', region: 'Serdang Bedagai', imp: 2 },
  'SEI RAMPAH':      { lat: 3.450, lng: 99.150, ruas: 'MKTT', region: 'Serdang Bedagai', imp: 2 },
  'TEBING TINGGI':   { lat: 3.328, lng: 99.162, ruas: 'MKTT', region: 'Tebing Tinggi', imp: 3 },
  'TEBING TINGGI 2': { lat: 3.310, lng: 99.140, ruas: 'MKTT', region: 'Tebing Tinggi', imp: 3 },
  'DOLOK MERAWAN':   { lat: 3.280, lng: 99.050, ruas: 'MKTT', region: 'Serdang Bedagai', imp: 2 },

  // === SUMUT: Indrapura – Kisaran (INKIS) ===
  'INDRAPURA':       { lat: 3.220, lng: 99.350, ruas: 'INKIS', region: 'Batubara', imp: 3 },
  'KUALA TANJUNG':   { lat: 3.370, lng: 99.440, ruas: 'INKIS', region: 'Batubara', imp: 4 },
  'SINAKSAK':        { lat: 3.020, lng: 99.220, ruas: 'INKIS', region: 'Simalungun', imp: 3 },
  'SIMPANG PANEI':   { lat: 2.980, lng: 99.420, ruas: 'INKIS', region: 'Simalungun', imp: 3 },
  'LIMA PULUH':      { lat: 3.190, lng: 99.410, ruas: 'INKIS', region: 'Batubara', imp: 2 },
  'KISARAN':         { lat: 2.983, lng: 99.625, ruas: 'INKIS', region: 'Asahan', imp: 3 },

  // === RIAU: Pekanbaru – Bangkinang (PBK) ===
  'PEKANBARU':       { lat: 0.509, lng: 101.450, ruas: 'PBK', region: 'Pekanbaru', imp: 5 },
  'BANGKINANG':      { lat: 0.333, lng: 101.050, ruas: 'PBK', region: 'Kampar', imp: 3 },

  // === RIAU: Pekanbaru – Dumai (PKD) ===
  'MINAS':           { lat: 1.000, lng: 101.420, ruas: 'PKD', region: 'Siak', imp: 2 },
  'PERAWANG':        { lat: 0.700, lng: 101.440, ruas: 'PKD', region: 'Siak', imp: 2 },
  'KANDIS':          { lat: 1.200, lng: 101.380, ruas: 'PKD', region: 'Siak', imp: 2 },
  'DURI':            { lat: 1.390, lng: 101.380, ruas: 'PKD', region: 'Bengkalis', imp: 3 },
  'SEI PAKNING':     { lat: 1.450, lng: 101.400, ruas: 'PKD', region: 'Bengkalis', imp: 2 },
  'LUBUK GAUNG':     { lat: 1.600, lng: 101.420, ruas: 'PKD', region: 'Dumai', imp: 2 },
  'DUMAI':           { lat: 1.680, lng: 101.450, ruas: 'PKD', region: 'Dumai', imp: 4 },

  // === SUMBAR: Padang – Sicincin (PSC) ===
  'PADANG':          { lat: -0.950, lng: 100.360, ruas: 'PSC', region: 'Padang', imp: 4 },
  'LUBUK ALUNG':     { lat: -0.780, lng: 100.350, ruas: 'PSC', region: 'Padang Pariaman', imp: 2 },
  'SICINCIN':        { lat: -0.600, lng: 100.300, ruas: 'PSC', region: 'Padang Pariaman', imp: 2 },

  // === JAMBI: Betung – Tempino – Jambi (BTJ) ===
  'BETUNG':          { lat: -1.850, lng: 104.100, ruas: 'BTJ', region: 'Banyuasin', imp: 2 },
  'TEMPINO':         { lat: -1.750, lng: 103.800, ruas: 'BTJ', region: 'Batanghari', imp: 2 },
  'JAMBI':           { lat: -1.600, lng: 103.620, ruas: 'BTJ', region: 'Jambi', imp: 4 },

  // === SUMSEL: Palembang – Indralaya (PLI) ===
  'PALEMBANG':       { lat: -2.976, lng: 104.775, ruas: 'PLI', region: 'Palembang', imp: 5 },
  'JAKABARING':      { lat: -3.023, lng: 104.790, ruas: 'PLI', region: 'Palembang', imp: 3 },
  'INDRALAYA':       { lat: -3.240, lng: 104.640, ruas: 'PLI', region: 'Ogan Ilir', imp: 3 },

  // === SUMSEL: Indralaya – Prabumulih (IPR) ===
  'PRABUMULIH':      { lat: -3.450, lng: 104.230, ruas: 'IPR', region: 'Prabumulih', imp: 3 },
  'MUARA ENIM':      { lat: -3.690, lng: 103.770, ruas: 'IPR', region: 'Muara Enim', imp: 3 },

  // === BENGKULU: Bengkulu – Taba Penanjung (BTP) ===
  'BENGKULU':        { lat: -3.800, lng: 102.270, ruas: 'BTP', region: 'Bengkulu', imp: 3 },
  'TABA PENANJUNG':  { lat: -3.620, lng: 102.400, ruas: 'BTP', region: 'Bengkulu Tengah', imp: 2 },

  // === LAMPUNG: Bakauheni – Terbanggi Besar (BKTB) ===
  'BAKAUHENI':       { lat: -5.870, lng: 105.760, ruas: 'BKTB', region: 'Lampung Selatan', imp: 4 },
  'KALIANDA':        { lat: -5.720, lng: 105.620, ruas: 'BKTB', region: 'Lampung Selatan', imp: 2 },
  'SIDOMULYO':       { lat: -5.560, lng: 105.550, ruas: 'BKTB', region: 'Lampung Selatan', imp: 2 },
  'BANDAR LAMPUNG':  { lat: -5.420, lng: 105.260, ruas: 'BKTB', region: 'Bandar Lampung', imp: 5 },
  'NATAR':           { lat: -5.300, lng: 105.180, ruas: 'BKTB', region: 'Lampung Selatan', imp: 2 },
  'TEGINENENG':      { lat: -5.150, lng: 105.050, ruas: 'BKTB', region: 'Pesawaran', imp: 2 },
  'KOTABUMI':        { lat: -4.820, lng: 104.880, ruas: 'BKTB', region: 'Lampung Utara', imp: 3 },

  // === LAMPUNG: Terbanggi Besar – Kayu Agung (TBKA) ===
  'TERBANGGI BESAR': { lat: -4.730, lng: 105.300, ruas: 'TBKA', region: 'Lampung Tengah', imp: 3 },
  'BANDAR JAYA':     { lat: -4.800, lng: 105.280, ruas: 'TBKA', region: 'Lampung Tengah', imp: 2 },
  'GUNUNG SUGIH':    { lat: -4.900, lng: 105.200, ruas: 'TBKA', region: 'Lampung Tengah', imp: 2 },
  'METRO':           { lat: -5.110, lng: 105.300, ruas: 'TBKA', region: 'Metro', imp: 3 },
  'SIMPANG PEMATANG':{ lat: -4.180, lng: 105.050, ruas: 'TBKA', region: 'Mesuji', imp: 2 },
  'KAYU AGUNG':      { lat: -3.420, lng: 104.790, ruas: 'TBKA', region: 'OKI', imp: 3 },

  // === JAKARTA: JORR-S (JORRS) ===
  'JORR S CIKUNIR':  { lat: -6.300, lng: 106.950, ruas: 'JORRS', region: 'Bekasi', imp: 4 },
  'JORR S PONDOK AREN': { lat: -6.270, lng: 106.710, ruas: 'JORRS', region: 'Tangerang Selatan', imp: 3 },
  'JORR S ULUJAMI':  { lat: -6.250, lng: 106.750, ruas: 'JORRS', region: 'Jakarta Selatan', imp: 3 },

  // === JAKARTA: Akses Tanjung Priok (ATP) ===
  'ATP CILINCING':   { lat: -6.100, lng: 106.930, ruas: 'ATP', region: 'Jakarta Utara', imp: 3 },
  'ATP JAMPEA':      { lat: -6.120, lng: 106.890, ruas: 'ATP', region: 'Jakarta Utara', imp: 3 },
  'ATP ANCOL TIMUR': { lat: -6.130, lng: 106.840, ruas: 'ATP', region: 'Jakarta Utara', imp: 3 },
};

// ── Ruas Definitions ─────────────────────────────────────────
export const RUAS_DEFS = {
  SBA:    { label: 'Sigli – Banda Aceh',           km: 48.5 },
  BIL:    { label: 'Binjai – Langsa',              km: 57.8 },
  MEBI:   { label: 'Medan – Binjai',               km: 17.3 },
  HMW:    { label: 'Helvetia–Marelan–Binjai',       km: 28 },
  BINSA:  { label: 'Binjai – Stabat',              km: 30 },
  BELMERA:{ label: 'Belmera',                      km: 34 },
  MKTT:   { label: 'Kualanamu – Tebing Tinggi',    km: 84 },
  INKIS:  { label: 'Indrapura – Kisaran',          km: 47.6 },
  PBK:    { label: 'Pekanbaru – Bangkinang',       km: 56 },
  PKD:    { label: 'Pekanbaru – Dumai',            km: 130.4 },
  PSC:    { label: 'Padang – Sicincin',            km: 35 },
  BTJ:    { label: 'Betung – Tempino – Jambi',     km: 33 },
  PLI:    { label: 'Palembang – Indralaya',        km: 21.9 },
  IPR:    { label: 'Indralaya – Prabumulih',       km: 64.5 },
  BTP:    { label: 'Bengkulu – Taba Penanjung',    km: 17.8 },
  BKTB:   { label: 'Bakauheni – Terbanggi Besar',  km: 140.4 },
  TBKA:   { label: 'Terbanggi Besar – Kayu Agung', km: 189.4 },
  JORRS:  { label: 'JORR-S',                       km: 14.25 },
  ATP:    { label: 'Akses Tanjung Priok',          km: 11.4 },
};

// ── Ruas Paths (for map polylines) ───────────────────────────
export const RUAS_PATHS = {
  SBA:    [[5.387, 96.073],[5.463, 95.641],[5.523, 95.428],[5.548, 95.323]],
  BIL:    [[4.100, 98.150],[4.350, 98.100],[4.250, 97.930],[4.468, 97.968]],
  MEBI:   [[3.620, 98.640],[3.615, 98.560],[3.600, 98.485]],
  HMW:    [[3.620, 98.640],[3.610, 98.630],[3.690, 98.650],[3.600, 98.485]],
  BINSA:  [[3.600, 98.485],[3.760, 98.450],[3.800, 98.380],[3.895, 98.410],[4.020, 98.230]],
  BELMERA:[[3.780, 98.690],[3.670, 98.680],[3.650, 98.670],[3.630, 98.660],[3.600, 98.710],[3.550, 98.715],[3.530, 98.790]],
  MKTT:   [[3.6422, 98.8853],[3.609, 98.840],[3.557, 98.873],[3.568, 98.958],[3.490, 99.060],[3.450, 99.150],[3.328, 99.162],[3.310, 99.140],[3.280, 99.050]],
  INKIS:  [[3.310, 99.140],[3.220, 99.350],[3.370, 99.440],[3.190, 99.410],[3.020, 99.220],[2.980, 99.420],[2.983, 99.625]],
  PBK:    [[0.509, 101.450],[0.420, 101.250],[0.333, 101.050]],
  PKD:    [[0.509, 101.450],[0.700, 101.440],[1.000, 101.420],[1.200, 101.380],[1.390, 101.380],[1.450, 101.400],[1.600, 101.420],[1.680, 101.450]],
  PSC:    [[-0.950, 100.360],[-0.780, 100.350],[-0.600, 100.300]],
  BTJ:    [[-1.850, 104.100],[-1.750, 103.800],[-1.600, 103.620]],
  PLI:    [[-2.976, 104.775],[-3.023, 104.790],[-3.240, 104.640]],
  IPR:    [[-3.240, 104.640],[-3.450, 104.230],[-3.690, 103.770]],
  BTP:    [[-3.800, 102.270],[-3.620, 102.400]],
  BKTB:   [[-5.870, 105.760],[-5.720, 105.620],[-5.560, 105.550],[-5.420, 105.260],[-5.300, 105.180],[-5.150, 105.050],[-4.820, 104.880]],
  TBKA:   [[-4.730, 105.300],[-4.800, 105.280],[-4.900, 105.200],[-5.110, 105.300],[-4.180, 105.050],[-3.420, 104.790]],
  JORRS:  [[-6.300, 106.950],[-6.270, 106.850],[-6.250, 106.750],[-6.270, 106.710]],
  ATP:    [[-6.100, 106.930],[-6.120, 106.890],[-6.130, 106.840]],
};

// ── Segment Definitions ──────────────────────────────────────
const SEGMENTS = [
  {
    id: 'SBA', label: 'Sigli – Banda Aceh', ruas: ['SBA'],
    gates: ['BANDA ACEH', 'BLANG BINTANG', 'SEULIMEUM', 'SIGLI'],
    destGates: { BA: 'BANDA ACEH', SGL: 'SIGLI' },
    baseTrx: 35, avgTariff: 35000,
  },
  {
    id: 'BIL', label: 'Binjai – Langsa', ruas: ['BIL'],
    gates: ['LANGSA', 'KUALA SIMPANG', 'TANJUNG SELAMAT', 'PANGKALAN SUSU'],
    destGates: { LGS: 'LANGSA', KSM: 'KUALA SIMPANG' },
    baseTrx: 22, avgTariff: 45000,
  },
  {
    id: 'SUMUT', label: 'Trans Sumatera Utara', ruas: ['HMW', 'BINSA', 'MEBI', 'BELMERA', 'MKTT', 'INKIS'],
    gates: [
      'KUALANAMU','KEMIRI','LUBUK PAKAM','PERBAUNGAN','TELUK MENGKUDU','SEI RAMPAH',
      'TEBING TINGGI','TEBING TINGGI 2','BELAWAN','MABAR 1','TANJUNG MULIA',
      'BANDAR SELAMAT 4','AMPLAS','TANJUNG MORAWA','H. ANIF 1','HELVETIA','SEMAYANG',
      'BINJAI','MARELAN','BINJAI UTAMA','STABAT','KUALA BINGAI','PANGKALAN BRANDAN',
      'TANJUNG PURA','INDRAPURA','KUALA TANJUNG','DOLOK MERAWAN','SINAKSAK',
      'SIMPANG PANEI','LIMA PULUH','KISARAN'
    ],
    destGates: { DL: 'DOLOK MERAWAN', IDR: 'INDRAPURA', KTJ: 'KUALA TANJUNG', SNK: 'SINAKSAK', SPN: 'SIMPANG PANEI', TTM: 'TEBING TINGGI 2' },
    baseTrx: 55, avgTariff: 52000,
  },
  {
    id: 'PBK', label: 'Pekanbaru – Bangkinang', ruas: ['PBK'],
    gates: ['PEKANBARU', 'BANGKINANG'],
    destGates: { PKB: 'PEKANBARU', BKG: 'BANGKINANG' },
    baseTrx: 45, avgTariff: 40000,
  },
  {
    id: 'PKD', label: 'Pekanbaru – Dumai', ruas: ['PKD'],
    gates: ['MINAS', 'PERAWANG', 'KANDIS', 'DURI', 'SEI PAKNING', 'LUBUK GAUNG', 'DUMAI'],
    destGates: { DMI: 'DUMAI', DRI: 'DURI' },
    baseTrx: 32, avgTariff: 70000,
  },
  {
    id: 'PSC', label: 'Padang – Sicincin', ruas: ['PSC'],
    gates: ['PADANG', 'LUBUK ALUNG', 'SICINCIN'],
    destGates: { PDG: 'PADANG', SCN: 'SICINCIN' },
    baseTrx: 28, avgTariff: 25000,
  },
  {
    id: 'BTJ', label: 'Betung – Tempino – Jambi', ruas: ['BTJ'],
    gates: ['BETUNG', 'TEMPINO', 'JAMBI'],
    destGates: { JBI: 'JAMBI', BTG: 'BETUNG' },
    baseTrx: 22, avgTariff: 30000,
  },
  {
    id: 'PLI', label: 'Palembang – Indralaya', ruas: ['PLI'],
    gates: ['PALEMBANG', 'JAKABARING', 'INDRALAYA'],
    destGates: { PLB: 'PALEMBANG', IDL: 'INDRALAYA' },
    baseTrx: 55, avgTariff: 25000,
  },
  {
    id: 'IPR', label: 'Indralaya – Prabumulih', ruas: ['IPR'],
    gates: ['PRABUMULIH', 'MUARA ENIM'],
    destGates: { PBM: 'PRABUMULIH', MRE: 'MUARA ENIM' },
    baseTrx: 28, avgTariff: 45000,
  },
  {
    id: 'BTP', label: 'Bengkulu – Taba Penanjung', ruas: ['BTP'],
    gates: ['BENGKULU', 'TABA PENANJUNG'],
    destGates: { BKL: 'BENGKULU', TPN: 'TABA PENANJUNG' },
    baseTrx: 18, avgTariff: 20000,
  },
  {
    id: 'BKTB', label: 'Bakauheni – Terbanggi Besar', ruas: ['BKTB'],
    gates: ['BAKAUHENI', 'KALIANDA', 'SIDOMULYO', 'BANDAR LAMPUNG', 'NATAR', 'TEGINENENG', 'KOTABUMI'],
    destGates: { BKH: 'BAKAUHENI', BDL: 'BANDAR LAMPUNG' },
    baseTrx: 60, avgTariff: 85000,
  },
  {
    id: 'TBKA', label: 'Terbanggi Besar – Kayu Agung', ruas: ['TBKA'],
    gates: ['TERBANGGI BESAR', 'BANDAR JAYA', 'GUNUNG SUGIH', 'METRO', 'SIMPANG PEMATANG', 'KAYU AGUNG'],
    destGates: { TBB: 'TERBANGGI BESAR', KYA: 'KAYU AGUNG' },
    baseTrx: 35, avgTariff: 110000,
  },
  {
    id: 'JORRS', label: 'JORR-S', ruas: ['JORRS'],
    gates: ['JORR S CIKUNIR', 'JORR S PONDOK AREN', 'JORR S ULUJAMI'],
    destGates: { JSC: 'JORR S CIKUNIR', JSP: 'JORR S PONDOK AREN' },
    baseTrx: 220, avgTariff: 15000,
  },
  {
    id: 'ATP', label: 'Akses Tanjung Priok', ruas: ['ATP'],
    gates: ['ATP CILINCING', 'ATP JAMPEA', 'ATP ANCOL TIMUR'],
    destGates: { ATC: 'ATP CILINCING', ATA: 'ATP ANCOL TIMUR' },
    baseTrx: 160, avgTariff: 12000,
  },
];

// ── Gate → Segment Mapping ───────────────────────────────────
export const GATE_TO_SEGMENT = {};
SEGMENTS.forEach(seg => seg.gates.forEach(g => { GATE_TO_SEGMENT[g] = seg.id; }));

// ── Segment list export (for FilterBar) ──────────────────────
export const SEGMENT_LIST = SEGMENTS.map(s => ({ id: s.id, label: s.label }));

// ── Generate Day Data ────────────────────────────────────────
export function generateDayData(dateStr) {
  const dt = new Date(dateStr + 'T00:00:00');
  if (isNaN(dt)) return null;
  const dow = dt.getDay();
  const month = dt.getMonth();
  const rng = mulberry32(hashStr(dateStr));

  const od = [];
  const dest_meta = {};
  const gate_rev = {};
  const ruas_rev = {};
  const coords = {};

  // Build coords
  Object.entries(GATE_DEFS).forEach(([name, g]) => { coords[name] = [g.lat, g.lng]; });

  // Generate per segment
  SEGMENTS.forEach(seg => {
    const dowF = DOW_F[dow];
    const monF = MON_F[month];

    // Register dest gates
    Object.entries(seg.destGates).forEach(([code, name]) => {
      dest_meta[code] = name;
      gate_rev[code] = { dest: name, tunai: 0, etoll: 0, total: 0 };
      ruas_rev[code] = {};
      seg.ruas.forEach(r => { ruas_rev[code][r] = 0; });
    });

    // OD pairs
    seg.gates.forEach(origin => {
      Object.entries(seg.destGates).forEach(([destCode, destName]) => {
        if (origin === destName) {
          od.push({ origin, dest: destName, dest_code: destCode, traffic: 0,
            bank: { mandiri: 0, bri: 0, bni: 0, bca: 0, total: 0 } });
          return;
        }
        const oG = GATE_DEFS[origin] || { imp: 2 };
        const dG = GATE_DEFS[destName] || { imp: 2 };
        const impF = (oG.imp + dG.imp) / 4;
        const noise = rr(rng, 0.3, 2.0);
        const traffic = Math.max(0, Math.round(seg.baseTrx * impF * dowF * monF * noise));

        // Bank split
        const mR = rr(rng, 0.60, 0.78);
        const bR = rr(rng, 0.08, 0.18);
        const nR = rr(rng, 0.04, 0.12);
        const mandiri = Math.round(traffic * mR);
        const bri = Math.round(traffic * bR);
        const bni = Math.round(traffic * nR);
        const bca = Math.max(0, traffic - mandiri - bri - bni);

        od.push({
          origin, dest: destName, dest_code: destCode, traffic,
          bank: { mandiri, bri, bni, bca, total: traffic }
        });

        // Revenue
        const rev = traffic * seg.avgTariff;
        const tunaiPct = rr(rng, 0.002, 0.008);
        const tunai = Math.round(rev * tunaiPct);
        const etoll = Math.round(rev * (1 - tunaiPct));
        gate_rev[destCode].tunai += tunai;
        gate_rev[destCode].etoll += etoll;
        gate_rev[destCode].total += tunai + etoll;

        // Ruas revenue: attribute to origin's ruas
        const oRuas = oG.ruas || seg.ruas[0];
        if (ruas_rev[destCode][oRuas] !== undefined) {
          ruas_rev[destCode][oRuas] += tunai + etoll;
        } else {
          ruas_rev[destCode][seg.ruas[0]] += tunai + etoll;
        }
      });
    });
  });

  return { date: dateStr, dest_meta, od, gate_rev, ruas_rev, coords };
}

// ── Multi-day Aggregation ────────────────────────────────────
export function aggregateDays(daysData) {
  if (!daysData || daysData.length === 0) return generateDayData('2025-06-09');
  if (daysData.length === 1) return daysData[0];

  const first = daysData[0], last = daysData[daysData.length - 1];
  const combined = {
    date: `${first.date} — ${last.date}`,
    dest_meta: { ...first.dest_meta },
    od: [],
    gate_rev: {},
    ruas_rev: {},
    coords: { ...first.coords },
  };

  const odMap = {};
  daysData.forEach(day => {
    // Merge dest_meta
    Object.assign(combined.dest_meta, day.dest_meta);
    Object.assign(combined.coords, day.coords);

    day.od.forEach(r => {
      const k = r.origin + '|' + r.dest;
      if (!odMap[k]) {
        odMap[k] = { origin: r.origin, dest: r.dest, dest_code: r.dest_code,
          traffic: 0, bank: { mandiri: 0, bri: 0, bni: 0, bca: 0, total: 0 } };
      }
      odMap[k].traffic += r.traffic;
      odMap[k].bank.mandiri += r.bank.mandiri;
      odMap[k].bank.bri += r.bank.bri;
      odMap[k].bank.bni += r.bank.bni;
      odMap[k].bank.bca += r.bank.bca;
      odMap[k].bank.total += r.bank.total;
    });

    Object.entries(day.gate_rev).forEach(([c, g]) => {
      if (!combined.gate_rev[c]) combined.gate_rev[c] = { dest: g.dest, tunai: 0, etoll: 0, total: 0 };
      combined.gate_rev[c].tunai += g.tunai;
      combined.gate_rev[c].etoll += g.etoll;
      combined.gate_rev[c].total += g.total;
    });

    Object.entries(day.ruas_rev).forEach(([dc, ro]) => {
      if (!combined.ruas_rev[dc]) combined.ruas_rev[dc] = {};
      Object.entries(ro).forEach(([rc, v]) => {
        combined.ruas_rev[dc][rc] = (combined.ruas_rev[dc][rc] || 0) + v;
      });
    });
  });

  combined.od = Object.values(odMap);
  return combined;
}

// ── Date Utilities ───────────────────────────────────────────
export const DATE_RANGE = { start: '2025-01-01', end: '2026-06-30' };

export function getDaysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const n = new Date(y, m, 0).getDate();
  return Array.from({ length: n }, (_, i) =>
    `${y}-${String(m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
}

export function getDaysInYear(year) {
  const y = Number(year);
  const maxM = y === 2026 ? 6 : 12;
  const days = [];
  for (let m = 1; m <= maxM; m++) {
    const n = new Date(y, m, 0).getDate();
    for (let d = 1; d <= n; d++) {
      days.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
  }
  return days;
}

export function getAvailableMonths() {
  const months = [];
  for (let y = 2025; y <= 2026; y++) {
    const endM = y === 2026 ? 6 : 12;
    for (let m = 1; m <= endM; m++) {
      months.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }
  return months;
}

export function getAvailableYears() { return ['2025', '2026']; }

export function monthLabel(ym) {
  const M = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const [y, m] = ym.split('-');
  return `${M[+m - 1]} ${y}`;
}
