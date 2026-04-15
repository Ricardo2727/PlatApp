// ══════════════════════════════════════════════════════
// NAVEGACIÓN
// ══════════════════════════════════════════════════════
function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('active');
}

function closeSidebar() {
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');
}

function showPage(id, evt) {
  closeSidebar();
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  if (evt?.currentTarget) evt.currentTarget.classList.add('active');
  if (id === 'dashboard')   renderDashboard();
  if (id === 'gastos')      renderGastos();
  if (id === 'presupuesto') renderPresupuesto();
  if (id === 'informe')     renderInformePage();
  if (id === 'anual')       renderAnual();
}

function changeMonth(delta) {
  state.currentMonth += delta;
  if (state.currentMonth < 0)  { state.currentMonth = 11; state.currentYear--; }
  if (state.currentMonth > 11) { state.currentMonth = 0;  state.currentYear++; }
  updateMonthLabels();
  const active = document.querySelector('.page.active');
  if (active?.id === 'page-dashboard')   renderDashboard();
  if (active?.id === 'page-gastos')      renderGastos();
  if (active?.id === 'page-presupuesto') renderPresupuesto();
  if (active?.id === 'page-informe')     renderInformePage();
}

function updateMonthLabels() {
  const label    = `${MONTHS_ES[state.currentMonth]} ${state.currentYear}`;
  const now      = new Date();
  const isCurrent = state.currentMonth === now.getMonth() && state.currentYear === now.getFullYear();

  document.getElementById('current-month-label').textContent = label;
  document.getElementById('informe-month-label').textContent = label;
  document.getElementById('sidebar-month').textContent       = label;
  const budgetLabelEl = document.getElementById('budget-month-label');
  if (budgetLabelEl) budgetLabelEl.textContent = label;

  document.getElementById('sidebar-month-badge').classList.toggle('past', !isCurrent);

  const monthLabelEl = document.getElementById('current-month-label');
  monthLabelEl.style.color = isCurrent ? '' : '#ffb800';

  const gastosTag   = document.getElementById('gastos-period-tag');
  const gastosLabel = document.getElementById('gastos-period-label');
  if (gastosTag && gastosLabel) {
    gastosLabel.textContent = label;
    gastosTag.classList.toggle('past', !isCurrent);
  }
}
