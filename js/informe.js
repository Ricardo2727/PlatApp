// ══════════════════════════════════════════════════════
// INFORME MENSUAL (IA)
// ══════════════════════════════════════════════════════
function renderInformePage() { /* labels already set by updateMonthLabels */ }

async function generateReport() {
  const md = getMonthData(curKey());
  const { gastos, budget } = md;
  const monthLabel = `${MONTHS_ES[state.currentMonth]} ${state.currentYear}`;
  const el = document.getElementById('informe-content');

  if (gastos.length === 0) {
    el.innerHTML = '<div class="empty"><div class="emoji">📭</div><p>No hay gastos registrados en este mes</p></div>';
    return;
  }

  el.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p>Analizando tus finanzas con IA...</p></div>';

  const byCat      = {};
  gastos.forEach(g => { byCat[g.cat] = (byCat[g.cat] || 0) + g.monto; });
  const totalSpent = gastos.reduce((s, g) => s + g.monto, 0);
  const catSummary = Object.entries(byCat).map(([c, a]) => `${CAT_INFO[c]?.label || c}: $${a}`).join(', ');
  const partInfo   = budget.participants?.length
    ? `Participantes: ${budget.participants.map(p => `${p.name} ($${p.amount})`).join(', ')}`
    : '';

  const prompt = `Eres un asesor financiero personal. Analiza los gastos del usuario para ${monthLabel}.
DATOS: Presupuesto: $${budget.total || 0}. Gastado: $${totalSpent}. Transacciones: ${gastos.length}. Por categoría: ${catSummary}. ${partInfo}
Responde SOLO con JSON (sin markdown):
{"resumen":"...","puntos_positivos":["..."],"puntos_mejora":["..."],"alertas":[{"titulo":"...","descripcion":"...","nivel":"warning"}],"consejos_mes_siguiente":[{"titulo":"...","descripcion":"..."}],"meta_ahorro":"..."}`;

  try {
    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    const r    = JSON.parse(data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim());
    el.innerHTML = `
      <div class="card" style="border-left:3px solid var(--accent2);margin-bottom:20px">
        <div class="card-title">📋 Resumen — ${monthLabel}</div>
        <p style="line-height:1.7;color:var(--text2);font-size:0.9rem">${r.resumen}</p>
      </div>
      <div class="two-col">
        <div class="report-section"><h3>✅ Puntos Positivos</h3>${(r.puntos_positivos || []).map(p => `<div class="tip-card">• ${p}</div>`).join('')}</div>
        <div class="report-section"><h3>⚠️ Áreas de Mejora</h3>${(r.puntos_mejora || []).map(p => `<div class="tip-card warning">• ${p}</div>`).join('')}</div>
      </div>
      ${(r.alertas || []).length ? `<div class="report-section"><h3>🚨 Alertas</h3>${r.alertas.map(a => `<div class="tip-card ${a.nivel || 'warning'}"><div class="tip-title">${a.titulo}</div>${a.descripcion}</div>`).join('')}</div>` : ''}
      <div class="report-section"><h3>💡 Consejos para el mes siguiente</h3>${(r.consejos_mes_siguiente || []).map(c => `<div class="tip-card" style="border-left-color:var(--accent2)"><div class="tip-title">${c.titulo}</div>${c.descripcion}</div>`).join('')}</div>
      ${r.meta_ahorro ? `<div class="card" style="border-left:3px solid var(--accent4)"><div class="card-title">💰 Meta de Ahorro</div><p style="color:var(--text2);font-size:0.9rem;line-height:1.7">${r.meta_ahorro}</p></div>` : ''}`;
  } catch (e) {
    el.innerHTML = `<div class="tip-card danger"><div class="tip-title">Error</div>No se pudo generar el informe. Intentá nuevamente.</div>`;
  }
}

// ══════════════════════════════════════════════════════
// RESUMEN ANUAL
// ══════════════════════════════════════════════════════
function renderAnual() {
  const year = state.currentYear;
  let total = 0, withData = 0, maxAmt = 0, maxMonth = '';
  const months = [];
  for (let m = 0; m < 12; m++) {
    const key = monthKey(year, m);
    const amt = state.data[key]?.gastos?.reduce((s, g) => s + g.monto, 0) || 0;
    months.push({ label: MONTHS_ES[m].substring(0, 3), amt, key, m });
    total += amt;
    if (amt > 0) { withData++; if (amt > maxAmt) { maxAmt = amt; maxMonth = MONTHS_ES[m]; } }
  }
  document.getElementById('anual-total').textContent   = fmt(total);
  document.getElementById('anual-avg').textContent     = withData > 0 ? fmt(total / withData) : '$0';
  document.getElementById('anual-max').textContent     = maxMonth || '—';
  document.getElementById('anual-max-amt').textContent = maxMonth ? fmt(maxAmt) : '';
  document.getElementById('anual-months').textContent  = withData;
  const maxVal = Math.max(...months.map(m => m.amt), 1);
  document.getElementById('anual-chart').innerHTML = months.map(m => {
    const c = m.m === state.currentMonth ? 'var(--accent)' : 'var(--accent2)';
    return `<div class="bar-row"><div class="bar-row-label">${m.label}</div><div class="bar-track"><div class="bar-fill" style="width:${(m.amt / maxVal) * 100}%;background:${c}"></div></div><div class="bar-amount" style="color:${c}">${m.amt > 0 ? fmt(m.amt) : '—'}</div></div>`;
  }).join('');
  document.getElementById('annual-months-grid').innerHTML = months.map(m => {
    const count = state.data[m.key]?.gastos?.length || 0;
    return `<div class="month-summary-card ${m.amt > 0 ? 'has-data' : ''}"><div class="ms-name">${MONTHS_ES[m.m]}</div><div class="ms-amount" style="color:${m.amt > 0 ? 'var(--accent3)' : 'var(--text3)'}">${m.amt > 0 ? fmt(m.amt) : 'Sin datos'}</div><div class="ms-count">${count > 0 ? count + ' transacciones' : ''}</div></div>`;
  }).join('');
}

async function generateAnnualReport() {
  const year = state.currentYear;
  let total = 0;
  const byCatGlobal = {};
  const monthData   = [];
  for (let m = 0; m < 12; m++) {
    const key = monthKey(year, m);
    const md  = state.data[key];
    if (md?.gastos?.length > 0) {
      const amt = md.gastos.reduce((s, g) => s + g.monto, 0);
      md.gastos.forEach(g => { byCatGlobal[g.cat] = (byCatGlobal[g.cat] || 0) + g.monto; });
      monthData.push({ month: MONTHS_ES[m], amt });
      total += amt;
    }
  }
  const el = document.getElementById('anual-ia-content');
  if (monthData.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="ai-loading"><div class="spinner"></div><p>Generando análisis anual con IA...</p></div>';
  const catSummary = Object.entries(byCatGlobal).sort((a, b) => b[1] - a[1]).map(([c, a]) => `${CAT_INFO[c]?.label || c}: $${a.toLocaleString()}`).join(', ');
  const prompt = `Eres un asesor financiero experto. Genera un informe anual para ${year}. Total: $${total.toLocaleString()}. Meses: ${monthData.length}. Promedio mensual: $${Math.round(total / monthData.length).toLocaleString()}. Por mes: ${monthData.map(m => `${m.month}: $${m.amt.toLocaleString()}`).join(', ')}. Por categoría: ${catSummary}. Responde SOLO con JSON (sin markdown): {"resumen_anual":"...","tendencias":["..."],"logros":["..."],"objetivos_año_siguiente":[{"objetivo":"...","accion":"..."}],"estrategia_ahorro":"...","categoria_critica":"..."}`;
  try {
    const res  = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    const r    = JSON.parse(data.content.map(i => i.text || '').join('').replace(/```json|```/g, '').trim());
    el.innerHTML = `
      <div class="card" style="border-left:3px solid var(--accent);margin-bottom:20px"><div class="card-title">📈 Análisis Anual ${year}</div><p style="line-height:1.7;color:var(--text2);font-size:0.9rem">${r.resumen_anual}</p></div>
      <div class="two-col" style="margin-bottom:20px">
        <div class="report-section"><h3>📊 Tendencias</h3>${(r.tendencias || []).map(t => `<div class="tip-card">• ${t}</div>`).join('')}</div>
        <div class="report-section"><h3>🏆 Logros</h3>${(r.logros || []).map(l => `<div class="tip-card">• ${l}</div>`).join('')}</div>
      </div>
      <div class="report-section"><h3>🎯 Objetivos para ${year + 1}</h3>${(r.objetivos_año_siguiente || []).map(o => `<div class="tip-card" style="border-left-color:var(--accent2)"><div class="tip-title">${o.objetivo}</div>${o.accion}</div>`).join('')}</div>
      ${r.categoria_critica ? `<div class="card" style="border-left:3px solid var(--accent3);margin-bottom:20px"><div class="card-title">🔍 Categoría Crítica</div><p style="color:var(--text2);font-size:0.9rem;line-height:1.7">${r.categoria_critica}</p></div>` : ''}
      ${r.estrategia_ahorro ? `<div class="card" style="border-left:3px solid var(--accent4);margin-bottom:20px"><div class="card-title">💡 Estrategia de Ahorro ${year + 1}</div><p style="color:var(--text2);font-size:0.9rem;line-height:1.7">${r.estrategia_ahorro}</p></div>` : ''}`;
  } catch (e) {
    el.innerHTML = `<div class="tip-card danger"><div class="tip-title">Error</div>No se pudo generar el análisis.</div>`;
  }
}
