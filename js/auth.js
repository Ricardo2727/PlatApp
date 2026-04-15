// ══════════════════════════════════════════════════════
// AUTENTICACIÓN
// ══════════════════════════════════════════════════════
let currentUser = null;

async function loginWith(provider) {
  const { error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.href }
  });
  if (error) toast('❌ Error al iniciar sesión: ' + error.message, true);
}

async function logout() {
  currentUser = null;
  state.data = {};
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-screen').classList.add('hidden');
  await sb.auth.signOut();
}

async function initAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) {
    await onLogin(session.user);
  }
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      await onLogin(session.user);
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      state.data = {};
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('app-screen').classList.add('hidden');
    }
  });
}

async function onLogin(user) {
  currentUser = user;
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-screen').classList.remove('hidden');
  const meta = user.user_metadata;
  document.getElementById('user-name').textContent  = meta.full_name || meta.name || meta.user_name || 'Usuario';
  document.getElementById('user-email').textContent = user.email || '';
  const avatar   = meta.avatar_url || meta.picture || '';
  const avatarEl = document.getElementById('user-avatar');
  if (avatar) { avatarEl.src = avatar; } else { avatarEl.style.display = 'none'; }

  await loadFromSupabase();
  updateMonthLabels();

  const isNewUser          = Object.keys(state.data).length === 0;
  const hasBudgetThisMonth = (state.data[curKey()]?.budget?.total || 0) > 0;

  if (isNewUser) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-presupuesto').classList.add('active');
    document.querySelector('[onclick*="presupuesto"]').classList.add('active');
    document.getElementById('welcome-banner').classList.remove('hidden');
    renderPresupuesto();
  } else if (!hasBudgetThisMonth) {
    renderDashboard();
    document.getElementById('modal-no-budget').classList.remove('hidden');
  } else {
    renderDashboard();
  }
}

function goToBudgetFromModal() {
  document.getElementById('modal-no-budget').classList.add('hidden');
  showPage('presupuesto', { currentTarget: document.querySelector('[onclick*="presupuesto"]') });
}
