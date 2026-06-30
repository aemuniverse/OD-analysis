import React from 'react';

export function FilterBar({ f, setF, origins, dests, maxTrx, reset, activeChips }) {
  return (
    <div className="filters">
      <div className="fl">
        <label>Cari / Gerbang Keluar</label>
        <select value={f.dest} onChange={e => setF(s => ({ ...s, dest: e.target.value }))}>
          <option value="ALL">Semua Gerbang</option>
          {dests.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="fl">
        <label>Gerbang Asal</label>
        <select value={f.origin} onChange={e => setF(s => ({ ...s, origin: e.target.value }))}>
          <option value="ALL">Semua Asal</option>
          {origins.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>
      <div className="fl">
        <label>Metode Bayar</label>
        <select value={f.bank} onChange={e => setF(s => ({ ...s, bank: e.target.value }))}>
          <option value="ALL">Semua Bank</option>
          <option>Mandiri</option>
          <option>BRI</option>
          <option>BNI</option>
          <option>BCA</option>
        </select>
      </div>
      <div className="fl">
        <label>Min Volume (<span className="rv">≥ {f.min}</span>)</label>
        <input type="range" min="0" max={maxTrx} value={f.min} onChange={e => setF(s => ({ ...s, min: +e.target.value }))} />
      </div>
      <div className="chipbar">
        {activeChips.map(([k, v, clr], i) => (
          <span key={i} className="chip">
            <span>{k}: {v}</span>
            <span className="x" onClick={clr}>✕</span>
          </span>
        ))}
        {activeChips.length > 0 && (
          <button className="resetbtn" onClick={reset}>Reset Filter</button>
        )}
      </div>
    </div>
  );
}
