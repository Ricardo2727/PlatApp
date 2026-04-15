// ══════════════════════════════════════════════════════
// PRESUPUESTO
// ══════════════════════════════════════════════════════
function renderPresupuesto() {
  const md     = getMonthData(budgetKey());
  const budget = md.budget;
  document.getElementById('p-total').value = budget.total || '';
  const numP = budget.participants?.length || 1;
  document.getElementById('p-num-personas').value = String(numP);
  renderParticipantsInputs(budget.participants);
  const cats = Object.keys(CAT_INFO);
  document.getElementById('budget-cat-inputs').innerHTML = cats.map(cat => {
    const ci = CAT_INFO[cat];
    return `<div class="form-group"><label>${ci.icon} ${ci.label}</label><input type="number" id="pcat-${cat}" placeholder="Sin límite" min="0" value="${budget.cats?.[cat] || ''}"></div>`;
  }).join('');
  renderBudgetStatus();
  renderParticipantsSummary(budget.participants || []);
}

function renderParticipantsInputs(savedParticipants) {
  const num = parseInt(document.getElementById('p-num-personas').value) || 1;
  let html = '';
  for (let i = 0; i < num; i++) {
    const saved = savedParticipants?.[i];
    const color = PERSON_COLORS[i % PERSON_COLORS.length];
    html += `<div class="participant-row">
      <div class="form-group"><label style="color:${color}">👤 Persona ${i + 1} — Nombre</label><input type="text" id="p-name-${i}" placeholder="Ej: Juan" value="${saved?.name || ''}"></div>
      <div class="form-group"><label>Aporte ($)</label><input type="number" id="p-amt-${i}" placeholder="0" min="0" value="${saved?.amount || ''}" oninput="updateTotalFromParticipants()"></div>
    </div>`;
  }
  document.getElementById('participants-inputs').innerHTML = html;
}

function updateTotalFromParticipants() {
  const num = parseInt(document.getElementById('p-num-personas').value) || 1;
  let total = 0;
  for (let i = 0; i < num; i++) total += parseFloat(document.getElementById(`p-amt-${i}`)?.value) || 0;
  if (total > 0) document.getElementById('p-total').value = total;
}

async function saveBudget() {
  const md   = getMonthData(budgetKey());
  const num  = parseInt(document.getElementById('p-num-personas').value) || 1;
  const participants = [];
  for (let i = 0; i < num; i++) {
    const name   = document.getElementById(`p-name-${i}`)?.value.trim() || `Persona ${i + 1}`;
    const amount = parseFloat(document.getElementById(`p-amt-${i}`)?.value) || 0;
    participants.push({ name, amount });
  }
  md.budget.participants = participants;
  const inputTotal = parseFloat(document.getElementById('p-total').value) || 0;
  const sumPart    = participants.reduce((s, p) => s + p.amount, 0);
  md.budget.total  = inputTotal || sumPart;
  md.budget.cats   = {};
  Object.keys(CAT_INFO).forEach(cat => {
    const v = parseFloat(document.getElementById('pcat-' + cat)?.value);
    if (v > 0) md.budget.cats[cat] = v;
  });
  await saveToSupabase();
  renderBudgetStatus();
  renderParticipantsSummary(participants);
  renderDashboard();
  document.getElementById('welcome-banner').classList.add('hidden');
  toast('💾 Presupuesto guardado');
}

function renderParticipantsSummary(participants) {
  const el = document.getElementById('participants-summary');
  if (!participants || participants.length === 0 || participants.every(p => p.amount === 0)) {
    el.innerHTML = '<div class="empty" style="padding:20px 0;"><div class="emoji">👥</div><p>Sin aportes registrados</p></div>';
    return;
  }
  const total = participants.reduce((s, p) => s + p.amount, 0);
  let html = participants.map((p, i) => {
    const color = PERSON_COLORS[i % PERSON_COLORS.length];
    const pct   = total > 0 ? ((p.amount / total) * 100).toFixed(0) : 0;
    return `<div class="participant-chip" style="margin-bottom:8px;">
      <div class="participant-avatar" style="background:${color}">${p.name.slice(0, 2).toUpperCase()}</div>
      <div class="participant-chip-info">
        <div class="participant-chip-name">${p.name}</div>
        <div class="participant-chip-amt">${fmt(p.amount)}</div>
      </div>
      <div class="participant-chip-pct" style="color:${color}">${pct}%</div>
    </div>`;
  }).join('');
  html += `<div class="contrib-bar-wrap">
    <div style="font-size:0.72rem;color:var(--text2);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Distribución de aportes</div>
    <div class="contrib-bar">${participants.map((p, i) => `<div style="flex:${total > 0 ? (p.amount / total * 100).toFixed(1) : 0};background:${PERSON_COLORS[i % PERSON_COLORS.length]};height:100%;border-radius:2px;"></div>`).join('')}</div>
    <div style="text-align:right;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:0.88rem;margin-top:8px;color:var(--accent)">Total: ${fmt(total)}</div>
  </div>`;
  el.innerHTML = html;
}

function renderBudgetStatus() {
  const md = getMonthData(budgetKey());
  const { gastos, budget } = md;
  const el = document.getElementById('budget-status');
  if (!budget.total) {
    el.innerHTML = '<div class="empty" style="padding:20px 0;"><div class="emoji">🎯</div><p>Configurá tu presupuesto total</p></div>';
    return;
  }
  const byCat      = {};
  gastos.forEach(g => { byCat[g.cat] = (byCat[g.cat] || 0) + g.monto; });
  const totalSpent = gastos.reduce((s, g) => s + g.monto, 0);
  const pct        = Math.min((totalSpent / budget.total) * 100, 100);
  let html = `<div class="budget-item"><div class="budget-icon" style="background:rgba(0,229,255,0.08)">💰</div><div class="budget-info"><div class="budget-name">Total General</div><div class="budget-amounts"><strong>${fmt(totalSpent)}</strong> de ${fmt(budget.total)}</div><div class="budget-progress"><div class="progress-bar"><div class="progress-fill ${pct > 90 ? 'red' : pct > 70 ? 'yellow' : 'green'}" style="width:${pct}%"></div></div></div></div><div style="font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:1rem;color:${pct > 90 ? 'var(--accent3)' : pct > 70 ? 'var(--accent4)' : 'var(--accent)'}">${pct.toFixed(0)}%</div></div>`;
  Object.entries(budget.cats || {}).forEach(([cat, limit]) => {
    const ci    = CAT_INFO[cat];
    const spent = byCat[cat] || 0;
    const p     = Math.min((spent / limit) * 100, 100);
    html += `<div class="budget-item"><div class="budget-icon" style="background:rgba(255,255,255,0.04)">${ci.icon}</div><div class="budget-info"><div class="budget-name">${ci.label}</div><div class="budget-amounts"><strong>${fmt(spent)}</strong> de ${fmt(limit)}</div><div class="budget-progress"><div class="progress-bar"><div class="progress-fill ${p > 90 ? 'red' : p > 70 ? 'yellow' : 'green'}" style="width:${p}%"></div></div></div></div><div style="font-size:0.8rem;font-weight:700;color:${p > 90 ? 'var(--accent3)' : p > 70 ? 'var(--accent4)' : 'var(--accent)'}">${p.toFixed(0)}%</div></div>`;
  });
  el.innerHTML = html;
}
