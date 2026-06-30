import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { buildSystemPrompt } from '../utils/ai';
import { fmtN, fmtRp, fmtDate } from '../utils/format';
import { InlineChart } from './InlineChart';

const OR_API = 'https://openrouter.ai/api/v1/chat/completions';
const OR_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OR_MODEL = 'anthropic/claude-3-haiku';

const icoBot = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>;
const icoSparkle = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;
const icoSend = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;

const QUICK_QUESTIONS = [
  { label: 'Traffic & OD', qs: ['Pasangan OD dengan traffic terbesar?', 'Gerbang asal yang paling aktif?', 'Berapa total transaksi keseluruhan?', 'Distribusi traffic ke Sinaksak dari mana saja?'] },
  { label: 'Revenue Analitik', qs: ['Total pendapatan per gerbang keluar?', 'Ruas tol mana kontribusi pendapatan terbesar?', 'Perbandingan tunai vs e-toll?', 'Berapa rata-rata tarif per transaksi?'] },
  { label: 'Bank Pembayaran', qs: ['Bank mana yang paling dominan?', 'Breakdown pembayaran di Indrapura?', 'Berapa transaksi BNI secara keseluruhan?'] },
  { label: 'Rekomendasi Strategis', qs: ['Koridor mana yang paling sibuk?', 'Rekomendasi pengembangan gerbang prioritas?', 'Buat ringkasan eksekutif dashboard ini.'] }
];

const FOLLOWUP_DEFAULT = ['Berikan analisis lengkap dashboard', 'Koridor mana paling berisiko?', 'Tampilkan kinerja gerbang keseluruhan'];

export function AIChatbot({ data, open, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState({ 0: true });
  const chatEndRef = useRef();

  const stats = useMemo(() => {
    const totalTrx = data.od.reduce((a, r) => a + r.traffic, 0);
    const totRev = Object.values(data.gate_rev).reduce((a, g) => a + g.total, 0);
    const activePairs = data.od.filter(r => r.traffic > 0).length;
    const bankTotals = { mandiri: 0, bri: 0, bni: 0, bca: 0 };
    data.od.forEach(r => { Object.keys(bankTotals).forEach(b => bankTotals[b] += (r.bank[b] || 0)); });
    const topBank = Object.entries(bankTotals).sort((a, b) => b[1] - a[1])[0];
    return { totalTrx, totRev, activePairs, topBank };
  }, [data]);

  useEffect(() => {
    if (open && chatEndRef.current) setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, [messages, open]);

  const sendMessage = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const sysPrompt = buildSystemPrompt(data);
      const res = await fetch(OR_API, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + OR_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OR_MODEL,
          messages: [{ role: 'system', content: sysPrompt }, ...messages.filter(m => m.role).map(m => ({ role: m.role, content: m.role === 'user' ? m.text : (m.raw || m.answer || '') })), { role: 'user', content: q }],
          temperature: 0.3, max_tokens: 1200
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rawContent = json.choices?.[0]?.message?.content || '';
      let parsed = { answer: '', cards: [], chart: { type: 'none' } };
      try {
        const m = rawContent.match(/\{[\s\S]*\}/);
        if (m) parsed = { ...parsed, ...JSON.parse(m[0]) };
        else parsed.answer = rawContent;
      } catch (e) { parsed.answer = rawContent; }
      if (!parsed.answer) parsed.answer = rawContent;

      setMessages(prev => [...prev, { role: 'assistant', answer: parsed.answer, cards: parsed.cards || [], chart: parsed.chart || { type: 'none' }, raw: rawContent }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', answer: 'Maaf, terjadi kendala koneksi AI: ' + err.message }]);
    }
    setLoading(false);
  }, [input, loading, messages, data]);

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const toggleGroup = i => setOpenGroups(p => ({ ...p, [i]: !p[i] }));

  if (!open) {
    return (
      <button className="ai-fab" onClick={onToggle}>
        <span style={{ display: 'flex' }}>{icoSparkle}</span>
        <span>OD AI</span>
      </button>
    );
  }

  return (
    <>
      <div className="ai-modal-overlay" onClick={onToggle} />
      <div className={'ai-modal' + (expanded ? ' expanded' : '')} onClick={e => e.stopPropagation()}>
        <div className="ai-mhead">
          <div className="ai-mhead-left">
            <div className="ai-avatar">{icoBot}</div>
            <div className="ai-mhead-info">
              <h3>OD AI <span className="ai-online-badge">Online</span></h3>
              <p>Regulatory Cockpit Intelligence</p>
            </div>
          </div>
          <div className="ai-mhead-actions">
            {messages.length > 0 && <button className="ai-hbtn" onClick={() => setMessages([])} title="Hapus chat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>}
            <button className="ai-hbtn" onClick={() => setExpanded(v => !v)}>{expanded ? '⊙' : '⊞'}</button>
            <button className="ai-hbtn" onClick={onToggle}>✕</button>
          </div>
        </div>

        {messages.length === 0 && (
          <>
            <div className="ai-briefing">
              <h4>{icoSparkle} Briefing Ringkas Eksekutif</h4>
              <p>Pada {fmtDate(data.date)}, jaringan tol mencatat <b>{fmtN(stats.totalTrx)} transaksi</b> dengan total pendapatan <b>{fmtRp(stats.totRev)}</b>. Pasangan OD dominan: <b>AMPLAS → TEBING TINGGI 2</b>.</p>
            </div>
            <div className="ai-stats">
              <div className="ai-stat-card"><div className="ai-stat-val" style={{ color: '#008f81' }}>{fmtN(stats.totalTrx)}</div><div className="ai-stat-label">Total Volume Trx</div></div>
              <div className="ai-stat-card"><div className="ai-stat-val" style={{ color: '#0f172a' }}>{fmtRp(stats.totRev)}</div><div className="ai-stat-label">Total Pendapatan</div></div>
            </div>
            <div className="ai-quick">
              <div className="ai-quick-title">Eksplorasi Pertanyaan</div>
              {QUICK_QUESTIONS.map((grp, i) => (
                <div className="ai-quick-group" key={i}>
                  <div className="ai-quick-group-header" onClick={() => toggleGroup(i)}>
                    <span>{grp.label}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>{openGroups[i] ? '▼' : '▶'}</span>
                  </div>
                  {openGroups[i] && (
                    <div className="ai-quick-chips">
                      {grp.qs.map((q, j) => <span key={j} className="ai-qchip" onClick={() => sendMessage(q)}>{q}</span>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {messages.length > 0 && (
          <div className="ai-chat-area">
            {messages.map((msg, i) => (
              msg.role === 'user' ? (
                <div key={i} className="chat-msg-user"><div className="chat-bubble-user">{msg.text}</div></div>
              ) : (
                <div key={i} className="chat-msg-ai">
                  <div className="chat-ai-avatar">{icoBot}</div>
                  <div className="chat-ai-content">
                    <div className="chat-ai-name">OD AI</div>
                    <div className="chat-ai-bubble">
                      <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{msg.answer}</div>
                      {msg.cards?.length > 0 && (
                        <div className="res-cards">
                          {msg.cards.slice(0, 4).map((c, ci) => (
                            <div key={ci} className="res-card">
                              <div className="res-card-val">{c.value}</div>
                              <div className="res-card-label">{c.label}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.chart?.type !== 'none' && msg.chart?.series && <InlineChart chart={msg.chart} />}
                      <div className="res-followup">
                        <div className="res-followup-title">Pertanyaan Lanjutan</div>
                        <div className="res-followup-chips">
                          {FOLLOWUP_DEFAULT.map((q, fi) => <span key={fi} className="res-fchip" onClick={() => sendMessage(q)}>{q}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
            {loading && <div className="chat-msg-ai"><div className="chat-ai-avatar">{icoBot}</div><div className="chat-ai-bubble" style={{ color: '#94a3b8' }}>Menganalisis data...</div></div>}
            <div ref={chatEndRef} />
          </div>
        )}

        <div className="ai-input-area">
          <div className="ai-input-row">
            <textarea className="ai-input" rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} placeholder="Tanya tentang performa OD atau gerbang..." disabled={loading} />
            <button className="ai-send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>{icoSend}</button>
          </div>
          <div className="ai-input-footer">BUMN Regulatory Cockpit Intelligence</div>
        </div>
      </div>
    </>
  );
}
