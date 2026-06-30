import React from 'react';
import { fmtDate } from '../utils/format';

const icoSearch = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const icoMoon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
const icoBell = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;

export function TopBar({ page, titles, date }) {
  const currentTitle = titles[page] || ['Console', ''];
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{currentTitle[0]}</div>
        <div className="topbar-sub">{fmtDate(date)} · {currentTitle[1]}</div>
      </div>
      <div className="topbar-search">
        <span className="search-ico">{icoSearch}</span>
        <input type="text" placeholder="Cari entitas, KPI, laporan..." />
      </div>
      <div className="topbar-actions">
        <button className="tb-btn" title="Mode Gelap">{icoMoon}</button>
        <button className="tb-btn" title="Notifikasi">{icoBell}</button>
      </div>
    </header>
  );
}
