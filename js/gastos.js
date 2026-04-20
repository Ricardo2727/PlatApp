// ══════════════════════════════════════════════════════
// GASTOS
// ══════════════════════════════════════════════════════
async function addGasto() {
  if ((state.data[curKey()]?.budget?.total || 0) === 0) {
    document.getElementById('modal-no-budget').classList.remove('hidden');
    return;
  }
  const fecha   = document.getElementById('g-fecha').value;
  const monto   = parseFloat(document.getElementById('g-monto').value);
  const cat     = document.getElementById('g-categoria').value;
  const desc    = document.getElementById('g-descripcion').value.trim();
  const metodo  = document.getElementById('g-metodo').value;
  const notas   = document.getElementById('g-notas').value.trim();
  const persona = document.getElementById('g-persona').value;
  const participants = getMonthData(curKey()).budget.participants || [];

  if (!fecha || !monto || monto <= 0 || !cat || !desc) {
    toast('⚠️ Completá los campos obligatorios', true);
    return;
  }
  if (participants.length > 1 && !persona) {
    toast('⚠️ Seleccioná quién realizó el gasto', true);
    return;
  }

  const [y, m] = fecha.split('-').map(Number);
  const key    = monthKey(y, m - 1);
  getMonthData(key).gastos.push({
    id: Date.now(), fecha, monto, cat, desc, metodo, notas,
    persona: persona || participants[0]?.name || 'Yo'
  });

  await saveToSupabase();

  document.getElementById('g-monto').value       = '';
  document.getElementById('g-categoria').value   = '';
  document.getElementById('g-descripcion').value = '';
  document.getElementById('g-notas').value       = '';
  if (participants.length > 1) document.getElementById('g-persona').value = '';

  toast('✅ Gasto registrado');

  // Verificar si este gasto cruzó algún límite de categoría
  const mdCheck  = getMonthData(monthKey(y, m - 1));
  const catLimit = mdCheck.budget.cats?.[cat];
  if (catLimit) {
    const catSpent = mdCheck.gastos.filter(g => g.cat === cat).reduce((s, g) => s + g.monto, 0);
    const pct      = (catSpent / catLimit) * 100;
    const ci       = CAT_INFO[cat] || { icon: '📦', label: cat };
    if (pct >= 100) toast(`⚠️ ${ci.icon} ${ci.label}: superaste el límite (${fmt(catSpent)} de ${fmt(catLimit)})`, true);
    else if (pct >= 80) toast(`⚡ ${ci.icon} ${ci.label}: ${pct.toFixed(0)}% del límite usado (${fmt(catLimit - catSpent)} restante)`, true);
  }

  renderGastos();
  renderDashboard();
}

async function deleteGasto(id, key) {
  if (!confirm('¿Eliminar este gasto?')) return;
  const md = getMonthData(key);
  md.gastos = md.gastos.filter(g => g.id !== id);
  await saveToSupabase();
  renderGastos();
  renderDashboard();
}

async function clearMonthGastos() {
  if (!confirm('¿Eliminar todos los gastos del mes?')) return;
  getMonthData(curKey()).gastos = [];
  await saveToSupabase();
  renderGastos();
  renderDashboard();
  toast('🗑 Gastos eliminados');
}

function renderGastos() {
  const now       = new Date();
  const isCurrent = state.currentMonth === now.getMonth() && state.currentYear === now.getFullYear();
  document.getElementById('g-fecha').value = isCurrent
    ? now.toISOString().split('T')[0]
    : new Date(state.currentYear, state.currentMonth + 1, 0).toISOString().split('T')[0];

  const md           = getMonthData(curKey());
  const participants = md.budget.participants || [];

  // Selector de persona en el formulario
  const personaSelect = document.getElementById('g-persona');
  if (participants.length <= 1) {
    const name = participants[0]?.name || 'Yo';
    personaSelect.innerHTML = `<option value="${name}">${name}</option>`;
    personaSelect.value     = name;
    document.getElementById('g-persona-group').style.display = 'none';
  } else {
    const current = personaSelect.value;
    personaSelect.innerHTML = '<option value="">Seleccionar...</option>' +
      participants.map(p => `<option value="${p.name}"${p.name === current ? ' selected' : ''}>${p.name}</option>`).join('');
    document.getElementById('g-persona-group').style.display = '';
  }

  // Filtro de persona en la tabla
  const fPersona = document.getElementById('f-persona');
  if (participants.length >= 2) {
    const cur = fPersona.value;
    fPersona.innerHTML = '<option value="">Todas las personas</option>' +
      participants.map(p => `<option value="${p.name}"${p.name === cur ? ' selected' : ''}>${p.name}</option>`).join('');
    fPersona.style.display = '';
  } else {
    fPersona.style.display = 'none';
    fPersona.value = '';
  }

  // Limpiar filtros al cambiar de mes
  document.getElementById('f-busqueda').value  = '';
  document.getElementById('f-categoria').value = '';

  renderGastosTable();
}

function renderGastosTable() {
  const busqueda      = document.getElementById('f-busqueda').value.toLowerCase().trim();
  const catFiltro     = document.getElementById('f-categoria').value;
  const personaFiltro = document.getElementById('f-persona').value;

  const md  = getMonthData(curKey());
  const key = curKey();
  let gastos = [...md.gastos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (busqueda)      gastos = gastos.filter(g => g.desc.toLowerCase().includes(busqueda));
  if (catFiltro)     gastos = gastos.filter(g => g.cat === catFiltro);
  if (personaFiltro) gastos = gastos.filter(g => g.persona === personaFiltro);

  const hayFiltros = busqueda || catFiltro || personaFiltro;
  const countEl    = document.getElementById('filter-count');
  countEl.textContent = hayFiltros ? `Mostrando ${gastos.length} de ${md.gastos.length} gastos` : '';

  const METODO_LABEL = {
    efectivo:      '💵 Efectivo',
    debito:        '💳 Débito',
    credito:       '🏦 Crédito',
    transferencia: '📲 Transferencia',
    mercadopago:   '💙 Mercado Pago',
  };

  document.getElementById('gastos-tbody').innerHTML = gastos.length === 0
    ? `<tr><td colspan="7"><div class="empty"><div class="emoji">${hayFiltros ? '🔍' : '📭'}</div><p>${hayFiltros ? 'Sin resultados para ese filtro' : 'Sin gastos este mes'}</p></div></td></tr>`
    : gastos.map(g => {
        const ci     = CAT_INFO[g.cat] || { label: g.cat, icon: '📦' };
        const metodo = METODO_LABEL[g.metodo] || g.metodo || '—';
        return `<tr><td>${g.fecha}</td><td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.desc}</td><td><span class="cat-badge cat-${g.cat}">${ci.icon} ${ci.label}</span></td><td style="color:var(--text2);font-size:0.85rem">${g.persona || '—'}</td><td style="color:var(--text2);font-size:0.82rem;white-space:nowrap">${metodo}</td><td style="font-family:'Space Grotesk',sans-serif;font-weight:700;color:var(--accent3)">${fmt(g.monto)}</td><td><button class="del-btn" onclick="deleteGasto(${g.id},'${key}')">🗑</button></td></tr>`;
      }).join('');
}
