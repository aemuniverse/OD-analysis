import React, { useState, useMemo, useRef, useCallback } from 'react';
import { generateDayData, aggregateDays, getDaysInMonth, getDaysInYear, GATE_TO_SEGMENT } from './data/od_data_generator';
import { usePageTransition } from './hooks/usePageTransition';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Ticker } from './components/Ticker';
import { FilterBar } from './components/FilterBar';
import { AIChatbot } from './components/AIChatbot';
import { Overview } from './pages/Overview';
import { Matrix } from './pages/Matrix';
import { MapPage } from './pages/MapPage';
import { Corridor } from './pages/Corridor';
import { Revenue } from './pages/Revenue';
import { Development } from './pages/Development';
import { Upload } from './pages/Upload';
import { ExportPage } from './pages/ExportPage';

const titles = {
  overview: ['Portfolio Overview', 'Agregat Revenue, Beban, dan Net Traffic HKA'],
  matrix: ['Industry Cluster Matrix', 'Pola lalu lintas antar gerbang tol sistem tertutup'],
  map: ['Spasial Desire Line', 'Peta pembebanan origin-destination'],
  corridor: ['Analisis Koridor Wilayah', 'Demand per cluster & capture rate'],
  revenue: ['Financial Trend & Capture', 'Realisasi pendapatan per gerbang keluar'],
  development: ['Value Creation Zone', 'Skor potensi pengembangan gerbang strategis'],
  upload: ['Subsidiary Intel Validation', 'Inspeksi & validasi dataset Excel'],
  export: ['Executive Reporting', 'Ekspor ringkasan & cetak dokumen']
};

// Day cache for performance
const dayCache = {};
function getCachedDay(dateStr, uploaded) {
  if (uploaded[dateStr]) return uploaded[dateStr];
  if (!dayCache[dateStr]) dayCache[dateStr] = generateDayData(dateStr);
  return dayCache[dateStr];
}

export default function App() {
  const [page, setPage] = useState('overview');
  const [chatOpen, setChatOpen] = useState(false);
  const transitionKey = usePageTransition(page);

  // Timeframe state
  const [timeframe, setTimeframe] = useState('daily');
  const [selectedDate, setSelectedDate] = useState('2025-06-09');
  const [selectedMonth, setSelectedMonth] = useState('2025-06');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [uploadedData, setUploadedData] = useState({});
  const [loading, setLoading] = useState(false);

  // Filter state
  const [f, setF] = useState({ dest: 'ALL', origin: 'ALL', bank: 'ALL', min: 0, segment: 'ALL' });

  // Compute active data based on timeframe
  const data = useMemo(() => {
    if (timeframe === 'daily') {
      return getCachedDay(selectedDate, uploadedData);
    } else if (timeframe === 'monthly') {
      const days = getDaysInMonth(selectedMonth);
      return aggregateDays(days.map(d => getCachedDay(d, uploadedData)));
    } else {
      const days = getDaysInYear(selectedYear);
      return aggregateDays(days.map(d => getCachedDay(d, uploadedData)));
    }
  }, [timeframe, selectedDate, selectedMonth, selectedYear, uploadedData]);

  // Filter OD data
  const fod = useMemo(() => data.od.filter(r => {
    if (f.dest !== 'ALL' && r.dest !== f.dest) return false;
    if (f.origin !== 'ALL' && r.origin !== f.origin) return false;
    if (f.segment !== 'ALL' && GATE_TO_SEGMENT[r.origin] !== f.segment) return false;
    const v = f.bank === 'ALL' ? r.traffic : (r.bank[f.bank.toLowerCase()] || 0);
    if (v < f.min) return false;
    return v > 0;
  }).map(r => ({ ...r, val: f.bank === 'ALL' ? r.traffic : (r.bank[f.bank.toLowerCase()] || 0) })), [data, f]);

  const origins = useMemo(() => [...new Set(data.od.map(r => r.origin))].sort(), [data]);
  const dests = useMemo(() => [...new Set(data.od.map(r => r.dest))].sort(), [data]);
  const maxTrx = useMemo(() => Math.max(...data.od.map(r => r.traffic), 1), [data]);
  const reset = () => setF({ dest: 'ALL', origin: 'ALL', bank: 'ALL', min: 0, segment: 'ALL' });

  // Handle upload: merge uploaded data by date
  const handleUpload = useCallback((dateStr, dayData) => {
    setUploadedData(prev => ({ ...prev, [dateStr]: dayData }));
  }, []);

  const activeChips = [];
  if (f.dest !== 'ALL') activeChips.push(['Gerbang', f.dest, () => setF(s => ({ ...s, dest: 'ALL' }))]);
  if (f.origin !== 'ALL') activeChips.push(['Asal', f.origin, () => setF(s => ({ ...s, origin: 'ALL' }))]);
  if (f.bank !== 'ALL') activeChips.push(['Bank', f.bank, () => setF(s => ({ ...s, bank: 'ALL' }))]);
  if (f.segment !== 'ALL') activeChips.push(['Segmen', f.segment, () => setF(s => ({ ...s, segment: 'ALL' }))]);

  const ctx = {
    data, fod, f, setF, origins, dests, maxTrx, reset, activeChips,
    setData: handleUpload, setPage, triggerKey: transitionKey,
    timeframe, setTimeframe,
    selectedDate, setSelectedDate,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    uploadedData, setUploadedData, loading, setLoading,
  };

  return (
    <>
      <Sidebar page={page} setPage={setPage} date={data.date} />
      <main className="main">
        <TopBar page={page} titles={titles} date={data.date} />
        <Ticker data={data} timeframe={timeframe} />
        <div className="scroll">
          {page !== 'upload' && page !== 'export' && <FilterBar {...ctx} />}
          <div key={transitionKey} className="page-container">
            {page === 'overview' && <Overview {...ctx} />}
            {page === 'matrix' && <Matrix {...ctx} />}
            {page === 'map' && <MapPage {...ctx} />}
            {page === 'corridor' && <Corridor {...ctx} />}
            {page === 'revenue' && <Revenue {...ctx} />}
            {page === 'development' && <Development {...ctx} />}
            {page === 'upload' && <Upload {...ctx} />}
            {page === 'export' && <ExportPage {...ctx} />}
          </div>
        </div>
      </main>
      <AIChatbot data={data} open={chatOpen} onToggle={() => setChatOpen(v => !v)} />
    </>
  );
}
