import React from 'react';

const icoGrid = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
const icoMatrix = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>;
const icoMap = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>;
const icoCorridor = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>;
const icoRev = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const icoDev = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const icoUp = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const icoExp = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>;
const icoLogout = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

const NAV = [
  ['ANALYTICS & OVERVIEW', [
    ['overview', 'Portfolio Overview', icoGrid],
    ['matrix', 'OD Matrix Explorer', icoMatrix],
    ['map', 'Spasial Desire Line', icoMap],
    ['corridor', 'Analisis Koridor', icoCorridor]
  ]],
  ['PERFORMANCE & IMPACT', [
    ['revenue', 'Pendapatan & Capture', icoRev],
    ['development', 'Value Creation Zone', icoDev]
  ]],
  ['SYSTEM ADMIN', [
    ['upload', 'Data Validation', icoUp],
    ['export', 'Laporan Eksekutif', icoExp]
  ]]
];

export function Sidebar({ page, setPage, date }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">
          <div className="brand-symbol">OD</div>
          <div className="brand-text">
            <h1>OD MATRIX</h1>
            <p>REGULATORY COCKPIT</p>
          </div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map(([grp, items]) => (
          <div key={grp}>
            <div className="nav-group">{grp}</div>
            {items.map(([id, lab, Ic]) => (
              <div
                key={id}
                className={'nav-item' + (page === id ? ' on' : '')}
                onClick={() => setPage(id)}
              >
                <span className="nav-icon">{Ic}</span>
                {lab}
              </div>
            ))}
          </div>
        ))}
      </nav>
      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">AV</div>
          <div className="sb-userinfo">
            <p>Admin Validator</p>
            <span>Admin · {date}</span>
          </div>
          <div className="sb-logout" title="Keluar sistem">{icoLogout}</div>
        </div>
      </div>
    </aside>
  );
}
