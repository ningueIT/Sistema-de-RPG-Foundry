// Macro: debug-progression-lookup
// Verifica se um Item existe no compêndio pelo nome (normalizado) e sugere possíveis correspondências.

const PACK = 'world.habilidades-amaldicoadas';
const TARGET = 'Reflexo Evasivo';

const normalize = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

const pack = game.packs.get(PACK);
if (!pack) {
  ui.notifications?.error?.(`Compêndio não encontrado: ${PACK}`);
  console.error('[FEITICEIROS] debug-progression-lookup | pack missing', PACK);
} else {
  const idx = await pack.getIndex();
  const t = normalize(TARGET);

  const exact = idx.find(e => normalize(e.name) === t);
  if (exact) {
    ui.notifications?.info?.(`OK: encontrado "${TARGET}" no compêndio ${PACK}`);
    console.log('[FEITICEIROS] debug-progression-lookup | exact match', { PACK, TARGET, id: exact._id, name: exact.name });
  } else {
    ui.notifications?.warn?.(`NÃO achei "${TARGET}" no compêndio ${PACK}. Veja o console.`);

    const tokens = t.split(/\s+/g).filter(Boolean);
    const candidates = idx
      .map(e => ({ id: e._id, name: e.name, n: normalize(e.name) }))
      .filter(e => tokens.every(tok => e.n.includes(tok)) || e.n.includes(tokens[0] ?? ''))
      .slice(0, 25)
      .map(e => ({ id: e.id, name: e.name }));

    console.warn('[FEITICEIROS] debug-progression-lookup | NOT FOUND', { PACK, TARGET });
    console.log('[FEITICEIROS] debug-progression-lookup | suggestions (first 25)', candidates);
  }
}
