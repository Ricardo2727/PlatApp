// ══════════════════════════════════════════════════════
// ⚙️  CONFIGURACIÓN DE SUPABASE
// ══════════════════════════════════════════════════════
const SUPABASE_URL = 'https://lwxomixucbmivzzkjzhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3eG9taXh1Y2JtaXZ6emtqemhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTY5MTcsImV4cCI6MjA5MTIzMjkxN30.N5NA7Uv0YBqTkiynkS9v82P8ac7WP-2jod8OV9M9Uwc';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ══════════════════════════════════════════════════════
// CONSTANTES
// ══════════════════════════════════════════════════════
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CAT_INFO = {
  vivienda:        { label: 'Vivienda',        icon: '🏠', color: '#00e5ff' },
  alimentos:       { label: 'Alimentación',    icon: '🛒', color: '#ffd166' },
  transporte:      { label: 'Transporte',      icon: '🚗', color: '#7c6ffd' },
  salud:           { label: 'Salud',           icon: '🏥', color: '#ff6b6b' },
  entretenimiento: { label: 'Entretenimiento', icon: '🎮', color: '#63caff' },
  educacion:       { label: 'Educación',       icon: '📚', color: '#ffa050' },
  ropa:            { label: 'Ropa',            icon: '👗', color: '#ff78c8' },
  servicios:       { label: 'Servicios',       icon: '💡', color: '#50dca0' },
  deudas:          { label: 'Deudas',          icon: '💳', color: '#ff5050' },
  ahorros:         { label: 'Ahorros',         icon: '💰', color: '#7fffcc' },
  streaming:       { label: 'Streaming',       icon: '🎬', color: '#a78bfa' },
  delivery:        { label: 'Delivery',        icon: '🛵', color: '#fb923c' },
  cafe:            { label: 'Café / Salidas',  icon: '☕', color: '#d97706' },
  suscripciones:   { label: 'Suscripciones',   icon: '📱', color: '#34d399' },
  otros:           { label: 'Otros',           icon: '📦', color: '#aaa'    },
};

const PERSON_COLORS = ['#00e5ff','#6c63ff','#ff4d6d','#ffb703','#50dca0','#ff78c8'];
