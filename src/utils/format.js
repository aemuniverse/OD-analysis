export const fmtN = n => (typeof n === 'number' && !isNaN(n)) ? n.toLocaleString('id-ID') : n;
export const fmtRp = n => {
  if (typeof n !== 'number' || isNaN(n)) return n;
  if (n >= 1e9) return 'Rp ' + (n / 1e9).toFixed(2) + ' M';
  if (n >= 1e6) return 'Rp ' + (n / 1e6).toFixed(1) + ' jt';
  if (n >= 1e3) return 'Rp ' + (n / 1e3).toFixed(0) + 'rb';
  return 'Rp ' + fmtN(n);
};
export const fmtDate = s => {
  if (!s || typeof s !== 'string') return '-';
  const [y, m, d] = s.split('-');
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${+d} ${M[+m - 1]} ${y}`;
};
export const fmtTime = () => {
  const n = new Date();
  return n.getHours().toString().padStart(2, '0') + ':' + n.getMinutes().toString().padStart(2, '0');
};
