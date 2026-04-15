// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
function renderDashboard() {
  const md     = getMonthData(curKey());
  const gastos = md.gastos;
  const budget = md.budget.total || 0;
  const spent  = gastos.reduce((s, g) => s + g.monto, 0);
  const pct    = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  document.getElementById('stat-budget').textContent    = fmt(budget);
  document.getElementById('stat-spent').textContent     = fmt(spent);
  document.getElementById('stat-spent-pct').textContent = budget > 0 ? `${pct.toFixed(0)}% del presupuesto` : 'Sin presupuesto';
  document.getElementById('stat-remaining').textContent = fmt(budget - spent);
  document.getElementById('stat-count').textContent     = gastos.length;

  const progEl = document.getElementById('prog-global');
  progEl.style.width = pct + '%';
  progEl.className   = 'progress-fill ' + (pct > 90 ? 'red' : pct > 70 ? 'yellow' : 'green');
  document.getElementById('prog-label-global').textContent = pct.toFixed(0) + '%';

  const byCat  = {};
  gastos.forEach(g => { byCat[g.cat] = (byCat[g.cat] || 0) + g.monto; });
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const maxVal = sorted[0]?.[1] || 1;
  const chartEl = document.getElementById('cat-chart');
  chartEl.innerHTML = sorted.length === 0
    ? '<div class="empty"><div class="emoji">🗂️</div><p>Sin datos este mes</p></div>'
    : sorted.map(([cat, amt]) => {
        const ci = CAT_INFO[cat] || { icon: '📦', label: cat, color: '#aaa' };
        return `<div class="bar-row"><div class="bar-row-label">${ci.icon} ${ci.label}</div><div class="bar-track"><div class="bar-fill" style="width:${(amt / maxVal) * 100}%;background:${ci.color}"></div></div><div class="bar-amount" style="color:${ci.color}">${fmt(amt)}</div></div>`;
      }).join('');

  const recent = [...gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 6);
  const recEl  = document.getElementById('recent-list');
  recEl.innerHTML = recent.length === 0
    ? '<div class="empty"><div class="emoji">📭</div><p>Sin gastos registrados</p></div>'
    : recent.map(g => {
        const ci = CAT_INFO[g.cat] || { icon: '📦' };
        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)"><span style="font-size:1.2rem">${ci.icon}</span><div style="flex:1;min-width:0"><div style="font-size:0.88rem;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.desc}</div><div style="font-size:0.75rem;color:var(--text3)">${g.fecha}</div></div><div style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:var(--accent3)">${fmt(g.monto)}</div></div>`;
      }).join('');

  renderCatAlerts();
  renderPersonasSummary();
  renderTrendChart();
  renderSavings();
}

// ══════════════════════════════════════════════════════
// ALERTAS DE CATEGORÍAS
// ══════════════════════════════════════════════════════
function renderCatAlerts() {
  const md   = getMonthData(curKey());
  const cats = md.budget.cats || {};
  const card = document.getElementById('cat-alerts-card');

  if (Object.keys(cats).length === 0) { card.style.display = 'none'; return; }

  const byCat = {};
  md.gastos.forEach(g => { byCat[g.cat] = (byCat[g.cat] || 0) + g.monto; });

  const alerts = Object.entries(cats)
    .map(([cat, limit]) => ({ cat, limit, spent: byCat[cat] || 0, pct: ((byCat[cat] || 0) / limit) * 100 }))
    .filter(a => a.pct >= 80)
    .sort((a, b) => b.pct - a.pct);

  if (alerts.length === 0) { card.style.display = 'none'; return; }
  card.style.display = '';

  document.getElementById('cat-alerts').innerHTML = alerts.map(a => {
    const ci     = CAT_INFO[a.cat] || { icon: '📦', label: a.cat };
    const over   = a.pct >= 100;
    const cls    = over ? 'over' : 'near';
    const color  = over ? 'var(--accent3)' : 'var(--accent4)';
    const badge  = over ? `+${fmt(a.spent - a.limit)} excedido` : `${a.pct.toFixed(0)}% usado`;
    const detail = over
      ? `Gastaste ${fmt(a.spent)} de ${fmt(a.limit)} — superaste el límite`
      : `Gastaste ${fmt(a.spent)} de ${fmt(a.limit)} — quedan ${fmt(a.limit - a.spent)}`;
    return `<div class="cat-alert-item ${cls}">
      <div class="cat-alert-icon">${ci.icon}</div>
      <div class="cat-alert-info">
        <div class="cat-alert-name">${ci.label}</div>
        <div class="cat-alert-detail">${detail}</div>
      </div>
      <div class="cat-alert-badge" style="color:${color}">${badge}</div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════
// GASTOS POR PERSONA
// ══════════════════════════════════════════════════════
function renderPersonasSummary() {
  const md           = getMonthData(curKey());
  const participants = md.budget.participants || [];
  const card         = document.getElementById('personas-card');

  if (participants.length < 2) { card.style.display = 'none'; return; }
  card.style.display = '';

  const byPersona = {};
  participants.forEach(p => { byPersona[p.name] = 0; });
  md.gastos.forEach(g => {
    if (g.persona && byPersona[g.persona] !== undefined) byPersona[g.persona] += g.monto;
    else if (g.persona) byPersona[g.persona] = (byPersona[g.persona] || 0) + g.monto;
  });

  const totalSpent = Object.values(byPersona).reduce((s, v) => s + v, 0);
  const maxSpent   = Math.max(...Object.values(byPersona), 1);

  document.getElementById('personas-summary').innerHTML = participants.map((p, i) => {
    const color      = PERSON_COLORS[i % PERSON_COLORS.length];
    const spent      = byPersona[p.name] || 0;
    const barPct     = ((spent / maxSpent) * 100).toFixed(0);
    const ofTotal    = totalSpent > 0 ? ((spent / totalSpent) * 100).toFixed(0) : 0;
    const overAporte = p.amount > 0 && spent > p.amount;
    const barColor   = overAporte ? 'var(--accent3)' : color;
    const aporteTxt  = p.amount > 0
      ? `${fmt(spent)} de ${fmt(p.amount)} aportado`
      : `${fmt(spent)} gastado`;
    return `<div class="persona-row">
      <div class="persona-avatar-sm" style="background:${color}">${p.name.slice(0, 2).toUpperCase()}</div>
      <div class="persona-info">
        <div class="persona-name">${p.name}</div>
        <div class="persona-bar-wrap"><div style="height:100%;width:${barPct}%;background:${barColor};border-radius:4px;transition:width .4s"></div></div>
        <div class="persona-amounts"><span>${aporteTxt}</span><span style="color:${barColor}">${ofTotal}% del total</span></div>
      </div>
      <div class="persona-total-spent" style="color:${barColor}">${fmt(spent)}</div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════
// TENDENCIA DE GASTOS
// ══════════════════════════════════════════════════════
function renderTrendChart() {
  const months = [];
  let y = state.currentYear, m = state.currentMonth;
  for (let i = 0; i < 6; i++) {
    const key    = monthKey(y, m);
    const d      = state.data[key];
    const budget = d?.budget?.total || 0;
    const spent  = d?.gastos?.reduce((s, g) => s + g.monto, 0) || 0;
    months.unshift({ label: MONTHS_ES[m].slice(0, 3), budget, spent });
    m--; if (m < 0) { m = 11; y--; }
  }
  const el = document.getElementById('trend-chart');
  if (months.every(m => m.budget === 0 && m.spent === 0)) {
    el.innerHTML = '<div class="empty"><div class="emoji">📈</div><p>Registrá gastos para ver la tendencia</p></div>';
    return;
  }
  const maxVal = Math.max(...months.map(m => Math.max(m.budget, m.spent)), 1);
  el.innerHTML = months.map(m => {
    const budgetPct = (m.budget / maxVal) * 100;
    const spentPct  = (m.spent  / maxVal) * 100;
    const over      = m.budget > 0 && m.spent > m.budget;
    const color     = over ? 'var(--accent3)' : m.spent > 0 ? 'var(--accent2)' : 'var(--surface2)';
    return `<div class="trend-row">
      <div class="trend-label">${m.label}</div>
      <div class="trend-bars">
        ${m.budget > 0 ? `<div class="trend-bar-wrap"><div style="height:100%;width:${budgetPct}%;background:rgba(0,229,255,0.18);border-radius:4px"></div></div>` : ''}
        <div class="trend-bar-wrap"><div style="height:100%;width:${spentPct}%;background:${color};border-radius:4px"></div></div>
      </div>
      <div class="trend-amount" style="color:${color}">${m.spent > 0 ? fmt(m.spent) : '—'}</div>
    </div>`;
  }).join('') +
  `<div class="trend-legend">
    <span><span class="legend-dot" style="background:rgba(0,229,255,0.18)"></span>Presupuesto</span>
    <span><span class="legend-dot" style="background:var(--accent2)"></span>Gastado</span>
    <span><span class="legend-dot" style="background:var(--accent3)"></span>Excedido</span>
  </div>`;
}

// ══════════════════════════════════════════════════════
// AHORRO
// ══════════════════════════════════════════════════════
function renderSavings() {
  const md     = getMonthData(curKey());
  const budget = md.budget.total || 0;
  const spent  = md.gastos.reduce((s, g) => s + g.monto, 0);
  const saving = budget - spent;
  const savingEl = document.getElementById('saving-month');

  if (budget === 0) {
    savingEl.innerHTML = '<div class="empty" style="padding:16px 0"><div class="emoji">💰</div><p>Sin presupuesto definido</p></div>';
  } else {
    const color  = saving >= 0 ? 'var(--accent2)' : 'var(--accent3)';
    const barPct = Math.min(Math.abs(saving / budget) * 100, 100).toFixed(0);
    const label  = saving >= 0 ? 'ahorrado este mes' : 'excedido este mes';
    savingEl.innerHTML = `
      <div style="text-align:center;padding:14px 0 10px">
        <div class="saving-big" style="color:${color}">${saving >= 0 ? '' : '-'}${fmt(Math.abs(saving))}</div>
        <div class="saving-sub">${label}</div>
      </div>
      <div class="progress-wrap" style="margin-top:8px">
        <div class="progress-label"><span>${saving >= 0 ? 'Porción ahorrada' : 'Exceso sobre presupuesto'}</span><span style="color:${color}">${barPct}%</span></div>
        <div class="progress-bar"><div class="progress-fill" style="width:${barPct}%;background:${color}"></div></div>
      </div>`;
  }

  // Ahorro acumulado — últimos 6 meses con presupuesto
  const history = [];
  let y = state.currentYear, m = state.currentMonth;
  for (let i = 0; i < 6; i++) {
    const key = monthKey(y, m);
    const d   = state.data[key];
    if (d?.budget?.total > 0) {
      const s = d.budget.total - (d.gastos?.reduce((a, g) => a + g.monto, 0) || 0);
      history.unshift({ label: MONTHS_ES[m].slice(0, 3), saving: s });
    }
    m--; if (m < 0) { m = 11; y--; }
  }

  const accEl = document.getElementById('saving-accumulated');
  if (history.length === 0) {
    accEl.innerHTML = '<div class="empty" style="padding:16px 0"><div class="emoji">📊</div><p>Sin historial aún</p></div>';
    return;
  }
  const total  = history.reduce((s, h) => s + h.saving, 0);
  const color  = total >= 0 ? 'var(--accent2)' : 'var(--accent3)';
  const maxAbs = Math.max(...history.map(h => Math.abs(h.saving)), 1);
  accEl.innerHTML = `
    <div style="text-align:center;padding:8px 0 14px">
      <div class="saving-big" style="color:${color};font-size:1.6rem">${total >= 0 ? '' : '-'}${fmt(Math.abs(total))}</div>
      <div class="saving-sub">${total >= 0 ? 'ahorro acumulado' : 'déficit acumulado'} (${history.length} meses)</div>
    </div>` +
  history.map(h => {
    const c   = h.saving >= 0 ? 'var(--accent2)' : 'var(--accent3)';
    const pct = (Math.abs(h.saving) / maxAbs * 100).toFixed(0);
    return `<div class="saving-month-row">
      <div class="saving-month-label">${h.label}</div>
      <div class="trend-bar-wrap" style="height:7px"><div style="height:100%;width:${pct}%;background:${c};border-radius:4px"></div></div>
      <div style="font-size:0.74rem;font-family:'Space Grotesk',sans-serif;font-weight:700;color:${c}">${h.saving >= 0 ? '+' : '-'}${fmt(Math.abs(h.saving))}</div>
    </div>`;
  }).join('');
}
