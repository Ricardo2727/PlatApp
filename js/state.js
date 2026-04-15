// ══════════════════════════════════════════════════════
// ESTADO GLOBAL
// ══════════════════════════════════════════════════════
let state = {
  currentYear:  new Date().getFullYear(),
  currentMonth: new Date().getMonth(),
  data: {}
};

function monthKey(y, m) { return `${y}-${String(m + 1).padStart(2, '0')}`; }
function curKey()        { return monthKey(state.currentYear, state.currentMonth); }
function budgetKey()     { return curKey(); }

function getMonthData(key) {
  if (!state.data[key]) state.data[key] = { gastos: [], budget: { total: 0, cats: {}, participants: [] } };
  if (!state.data[key].budget.participants) state.data[key].budget.participants = [];
  return state.data[key];
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
