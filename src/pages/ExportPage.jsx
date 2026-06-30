import React from 'react';
export function ExportPage() {
  return <div className="panel"><div className="head"><div className="head-left"><h3>Executive Reporting Export</h3><p>Unduh rekapitulasi</p></div></div><div className="body" style={{ display: 'flex', gap: 12 }}><button className="expbtn primary" onClick={() => window.print()}>Cetak PDF Laporan</button></div></div>;
}
