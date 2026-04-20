// ══════════════════════════════════════════════════════
// CAPA DE DATOS — SUPABASE
// ══════════════════════════════════════════════════════
function setSyncStatus(status) { // 'syncing' | 'ok' | 'error'
  const dot = document.getElementById('sync-dot');
  const txt = document.getElementById('sync-text');
  if (!dot) return;
  dot.className = 'sync-dot ' + status;
  txt.textContent = status === 'syncing' ? 'Sincronizando...'
    : status === 'ok' ? 'Sincronizado ✓'
    : 'Error de sincronización';
}

async function loadFromSupabase() {
  if (!currentUser) return;
  setSyncStatus('syncing');
  try {
    const { data, error } = await sb
      .from('user_data')
      .select('data')
      .eq('user_id', currentUser.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    state.data = data?.data || {};
    setSyncStatus('ok');
  } catch (e) {
    setSyncStatus('error');
    const saved = localStorage.getItem('platapp_local');
    if (saved) try { state.data = JSON.parse(saved).data || {}; } catch (e2) {}
    toast('⚠️ Sin conexión — usando datos locales', true);
  }
}

async function saveToSupabase() {
  if (!currentUser) { toast('⚠️ Sin sesión activa — recargá la página', true); return; }
  setSyncStatus('syncing');
  localStorage.setItem('platapp_local', JSON.stringify({ data: state.data }));
  try {
    const { error } = await sb
      .from('user_data')
      .upsert(
        { user_id: currentUser.id, data: state.data, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
    setSyncStatus('ok');
  } catch (e) {
    setSyncStatus('error');
    toast('⚠️ Error al sincronizar — guardado localmente', true);
  }
}
