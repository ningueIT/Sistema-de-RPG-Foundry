// ===========================================================================
// DOMINIO CLASH - Módulo Independente (Sem imports circulares)
// ===========================================================================

const SYSTEM_ID = 'feiticeiros-e-maldicoes';
const FLAG_ACTIVE = 'dominioActive';
const FLAG_CLASHES = 'dominioClashes';
const DEBUG = true;

// --------------------------------------------------------------------------
// FUNÇÕES AUXILIARES (Copiadas para quebrar dependência circular)
// --------------------------------------------------------------------------

function getActiveDominio(actor) {
  if (!actor?.getFlag) return null;
  return actor.getFlag(SYSTEM_ID, FLAG_ACTIVE) ?? null;
}

function _getTokenCenter(tokenDoc) {
  const obj = tokenDoc?.object;
  if (obj?.center) return { x: obj.center.x, y: obj.center.y };
  // Fallback se o objeto canvas não estiver pronto
  const x = Number(tokenDoc?.x ?? 0);
  const y = Number(tokenDoc?.y ?? 0);
  const size = canvas?.grid?.size ?? 100;
  const w = Number(tokenDoc?.width ?? 1) * size;
  const h = Number(tokenDoc?.height ?? 1) * size;
  return { x: x + (w / 2), y: y + (h / 2) };
}

function _isInsideCircle(point, center, radiusPixels) {
  if (!point || !center || !radiusPixels) return false;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return (dx * dx + dy * dy) <= (radiusPixels * radiusPixels);
}

function isTokenInsideDominio(tokenDoc, dominio) {
  if (!tokenDoc || !dominio) return false;
  const radiusPixels = Number(dominio.radiusPixels ?? 0) || 0;
  if (!radiusPixels) return false;
  const point = _getTokenCenter(tokenDoc);
  if (!dominio.center) return false;
  return _isInsideCircle(point, dominio.center, radiusPixels);
}

// --------------------------------------------------------------------------
// LÓGICA DE CLASH (Batalha de Domínio)
// --------------------------------------------------------------------------

function _log(...args) {
  if (!DEBUG) return;
  try { console.warn(`[${SYSTEM_ID}] dominioClash`, ...args); } catch (_) { /* ignore */ }
}

function _warn(...args) {
  if (!DEBUG) return;
  try { console.warn(`[${SYSTEM_ID}] dominioClash`, ...args); } catch (_) { /* ignore */ }
}

function _socketChannel() {
  return `system.${SYSTEM_ID}`;
}

function _now() {
  return Date.now();
}

function _hashStringToUint(str = '') {
  let h = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function _hashToRange(str, min, max) {
  const a = Number(min);
  const b = Number(max);
  const lo = Number.isFinite(a) ? a : 0;
  const hi = Number.isFinite(b) ? b : 1;
  const span = Math.max(1e-9, hi - lo);
  const u = _hashStringToUint(str) / 4294967295;
  return lo + (u * span);
}

function _normalizeDeg(deg) {
  let d = Number(deg);
  if (!Number.isFinite(d)) d = 0;
  d %= 360;
  if (d < 0) d += 360;
  return d;
}

function _shortestAngularDistanceDeg(a, b) {
  const da = _normalizeDeg(a);
  const db = _normalizeDeg(b);
  let diff = da - db;
  diff = ((diff + 540) % 360) - 180;
  return Math.abs(diff);
}

function _safeInt(n, fallback = 0) {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.trunc(v);
}

function _resolveActorById(actorId) {
  if (!actorId) return null;
  const a = game.actors?.get?.(actorId) ?? null;
  if (a) return a;
  try {
    const tokenActors = (canvas?.tokens?.placeables ?? [])
      .map(t => t?.actor)
      .filter(x => x && String(x.id) === String(actorId));
    return tokenActors?.[0] ?? null;
  } catch (_) {
    return null;
  }
}

function _getPrimaryTokenDoc(actor) {
  try {
    const token = actor?.getActiveTokens?.(true, true)?.[0] ?? null;
    return token?.document ?? null;
  } catch (_) {
    return null;
  }
}

function _getDominioItemForActor(actor) {
  try {
    const items = actor?.items ?? [];
    return (items.find(i => i?.type === 'dominio' && (i?.system?.dominio?.ativo?.value === true))
      ?? items.find(i => i?.type === 'dominio')
      ?? null);
  } catch (_) {
    return null;
  }
}

function _computeActorDominioRadiusSquares(actor) {
  const active = getActiveDominio(actor);
  try {
    const activeSq = Number(active?.squares ?? 0) || 0;
    if (activeSq > 0) return Math.max(1, Math.round(activeSq));
    const px = Number(active?.radiusPixels ?? 0) || 0;
    const grid = Number(canvas?.grid?.size ?? 0) || 0;
    if (px > 0 && grid > 0) return Math.max(1, Math.round(px / grid));
  } catch (_) { /* ignore */ }

  const gridMeters = Number(canvas?.scene?.grid?.distance ?? canvas?.scene?.gridDistance ?? 1.5) || 1.5;
  const dominioItem = _getDominioItemForActor(actor);
  const tipoFromItem = String(dominioItem?.system?.dominio?.tipo?.value ?? '').trim();
  const tipo = tipoFromItem || 'completa';

  let radiusMeters = 9;
  if (tipo === 'incompleta') {
    const baseTreino = Number(actor?.system?.detalhes?.treinamento?.value ?? 0) || 0;
    radiusMeters = 4.5 * Math.max(1, baseTreino);
  }

  const squares = radiusMeters / gridMeters;
  return Math.max(1, Math.round(squares));
}

function actorHasDominioExpansion(actor) {
  if (!actor) return false;
  const sysId = game?.system?.id ?? SYSTEM_ID;
  try {
    const aptDom = actor?.system?.aptidoes?.dominio ?? {};
    const viaSystem = !!(
      aptDom?.expansaoDeDominioIncompleta
      || aptDom?.expansaoDeDominioCompleta
      || aptDom?.expansaoDeDominioSemBarreiras
      || aptDom?.acertoGarantido
    );

    const items = actor.items?.contents ?? actor.items ?? [];
    const keys = [];
    const names = [];
    for (const i of items) {
      const key = i?.getFlag?.(sysId, 'aptidaoKey');
      if (key) keys.push(String(key));
      const name = String(i?.name ?? '').trim();
      if (name) names.push(name);
    }

    let eligible = viaSystem
      || keys.includes('dominio.expansaoDeDominioIncompleta')
      || keys.includes('dominio.expansaoDeDominioCompleta')
      || keys.includes('dominio.expansaoDeDominioSemBarreiras')
      || keys.includes('dominio.acertoGarantido');

    if (!eligible) {
      const joined = names.join(' | ').toLowerCase();
      const hasExp = joined.includes('expans') && joined.includes('dom') && joined.includes('nio');
      const hasAcerto = joined.includes('acerto') && joined.includes('garant');
      eligible = hasExp || hasAcerto;
    }

    _log('actorHasDominioExpansion', { actor: actor?.name, actorId: actor?.id, eligible, viaSystem, aptDom, keys, names });
    return eligible;
  } catch (_) {
    return false;
  }
}

function countDominioHabilidades(actor) {
  if (!actor) return 0;
  const sysId = game?.system?.id ?? SYSTEM_ID;
  try {
    const items = actor.items?.contents ?? actor.items ?? [];
    let n = 0;
    for (const i of items) {
      const key = String(i?.getFlag?.(sysId, 'aptidaoKey') ?? '');
      if (!key) continue;
      if (!key.startsWith('dominio.')) continue;
      n += 1;
    }
    return n;
  } catch (_) {
    return 0;
  }
}

function getDominioAptidaoNivel(actor) {
  return _safeInt(actor?.system?.aptidaoNiveis?.dominio?.value ?? 0, 0);
}

function computeDominioClashBonus(actor) {
  const domNivel = getDominioAptidaoNivel(actor);
  const habilidades = countDominioHabilidades(actor);
  return Math.max(0, domNivel + habilidades);
}

function _skillCheckDifficultyFromHits(hits) {
  const h = Math.max(0, _safeInt(hits, 0));
  return h;
}

async function getSceneClashes() {
  try {
    const cur = canvas?.scene?.getFlag?.(SYSTEM_ID, FLAG_CLASHES) ?? null;
    if (!cur || typeof cur !== 'object') return {};
    return cur;
  } catch (_) {
    return {};
  }
}

async function setSceneClashes(next) {
  if (!canvas?.scene?.setFlag) return;
  await canvas.scene.setFlag(SYSTEM_ID, FLAG_CLASHES, next);
}

function _makeClashId({ ownerActorId, challengerActorId } = {}) {
  const a = String(ownerActorId ?? '');
  const b = String(challengerActorId ?? '');
  return `clash:${a}:${b}:${_now()}`;
}

function _clashWhisperUserIds(ownerActor, challengerActor) {
  const ids = new Set();
  try {
    const users = game.users?.contents ?? [];
    for (const u of users) {
      if (!u?.active) continue;
      if (u.isGM) ids.add(u.id);
      else {
        try {
          if (ownerActor?.testUserPermission?.(u, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) ids.add(u.id);
          if (challengerActor?.testUserPermission?.(u, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) ids.add(u.id);
        } catch (_) { /* ignore */ }
      }
    }
  } catch (_) { /* ignore */ }
  return Array.from(ids);
}

function _emitToSocket(action, data) {
  try {
    try {
      _log('socket emit', { action, data, user: game.user?.name, userId: game.user?.id, isGM: !!game.user?.isGM });
    } catch (_) { /* ignore */ }
    game.socket?.emit?.(_socketChannel(), { scope: 'dominioClash', action, data });
  } catch (e) {
    console.warn('dominioClash: falha ao emitir socket', e);
  }
}

function _activeGMCount() {
  try {
    return (game.users?.contents ?? []).filter(u => u?.active && u.isGM).length;
  } catch (_) {
    return 0;
  }
}

function _shouldHandleLocallyAsGM() {
  return !!game.user?.isGM && _activeGMCount() <= 1;
}

function _hasOtherActiveOwner(actor) {
  try {
    const users = game.users?.contents ?? [];
    for (const u of users) {
      if (!u?.active) continue;
      if (u.id === game.user?.id) continue;
      try {
        if (actor?.testUserPermission?.(u, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) return true;
      } catch (_) { /* ignore */ }
    }
  } catch (_) { /* ignore */ }
  return false;
}

function _hasActiveNonGMOwner(actor) {
  try {
    const users = game.users?.contents ?? [];
    for (const u of users) {
      if (!u?.active) continue;
      if (u.isGM) continue;
      try {
        if (actor?.testUserPermission?.(u, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) return true;
      } catch (_) { /* ignore */ }
    }
  } catch (_) { /* ignore */ }
  return false;
}

async function _requestRoll({ clashId, actorId, tokenUuid = null, round } = {}) {
  const actor = _resolveActorById(actorId);

  try {
    _log('requestRoll: gm dispatch', {
      clashId,
      actorId,
      actorFound: !!actor,
      actor: actor?.name ?? null,
      tokenUuid,
      round,
      localUser: game.user?.name,
      localUserId: game.user?.id,
      localIsGM: !!game.user?.isGM,
    });
  } catch (_) { /* ignore */ }

  _emitToSocket('requestRoll', { clashId, actorId, tokenUuid, round });

  if (!actor) return;

  try {
    const otherOwnerOnline = _hasOtherActiveOwner(actor);
    try {
      _log('requestRoll: owner presence', {
        clashId,
        actorId,
        actor: actor?.name,
        otherOwnerOnline,
        actorIsOwnerHere: !!actor?.isOwner,
        localIsGM: !!game.user?.isGM,
      });
    } catch (_) { /* ignore */ }
    if (!otherOwnerOnline && actor.isOwner) {
      _log('requestRoll: open locally', { clashId, actorId, actor: actor.name, round, isGM: !!game.user?.isGM });
      await _openRollDialog({ clashId, actor, round });
    } else {
      _log('requestRoll: rely on remote owner', { clashId, actorId, actor: actor.name, round, otherOwnerOnline });
    }
  } catch (_) { /* ignore */ }
}

async function requestStartDominioClash({ ownerActorId, challengerActorId, challengerTokenId } = {}) {
  const payload = {
    ownerActorId,
    challengerActorId,
    challengerTokenId: challengerTokenId ?? null,
    sceneId: canvas?.scene?.id ?? null,
    requestedBy: game.user?.id ?? null,
    clashId: _makeClashId({ ownerActorId, challengerActorId }),
    source: arguments?.[0]?.source ?? null,
  };

  _log('requestStart: called', { ...payload, isGM: !!game.user?.isGM, user: game.user?.name, userId: game.user?.id });

  if (!game.user?.isGM) {
    try {
      const gmIds = _gmWhisperGMUserIds();
      if (!gmIds.length) {
        ui.notifications?.warn?.('Nenhum Mestre está online para aprovar o Confronto de Domínio.');
        return;
      }

      const ownerActor = _resolveActorById(ownerActorId);
      const challengerActor = _resolveActorById(challengerActorId);

      _log('startRequest: create GM approval card', { ownerActorId, challengerActorId });

      await ChatMessage.create({
        content: _renderApprovalCard({ ownerActor, challengerActor, challengerTokenId: payload.challengerTokenId, requestedBy: payload.requestedBy }),
        whisper: gmIds,
      });
    } catch (e) {
      console.warn('dominioClash: falha ao criar card de aprovação para o GM', e);
      try { ui.notifications?.warn?.('Falha ao enviar solicitação ao Mestre. Veja o console.'); } catch (_) { /* ignore */ }
    }
    _emitToSocket('startRequest', payload);
    return;
  }

  try {
    _log('requestStart: GM handle locally', payload);
    await _gmStartClash(payload);
  } catch (e) {
    console.warn('dominioClash: falha ao iniciar clash localmente (GM)', e);
  }

  if (!_shouldHandleLocallyAsGM()) _emitToSocket('start', payload);
}

function requestRejectDominioClash({ ownerActorId, challengerActorId, challengerTokenId, requestedBy } = {}) {
  const payload = { ownerActorId, challengerActorId, challengerTokenId: challengerTokenId ?? null, requestedBy: requestedBy ?? (game.user?.id ?? null), sceneId: canvas?.scene?.id ?? null };
  if (_shouldHandleLocallyAsGM()) {
    _log('requestReject: single GM, handle locally', payload);
    _gmRejectRequest(payload);
    return;
  }
  _emitToSocket('reject', payload);
}

function _gmWhisperGMUserIds() {
  try {
    return (game.users?.contents ?? []).filter(u => u?.active && u.isGM).map(u => u.id);
  } catch (_) {
    return [];
  }
}

function _renderApprovalCard({ ownerActor, challengerActor, challengerTokenId, requestedBy } = {}) {
  const requesterName = (() => {
    try {
      const u = requestedBy ? game.users?.get?.(requestedBy) : null;
      return u?.name ?? '—';
    } catch (_) {
      return '—';
    }
  })();

  return `
    <div><strong>Solicitação de Confronto de Domínio</strong></div>
    <div class="flavor-text">Desafiante: <strong>${challengerActor?.name ?? '—'}</strong></div>
    <div class="flavor-text">Dono do Domínio: <strong>${ownerActor?.name ?? '—'}</strong></div>
    <div class="flavor-text">Solicitado por: <strong>${requesterName}</strong></div>
    <div style="margin-top:8px; display:flex; gap:8px;">
      <button class="jem-dominio-clash-approve jem-btn jem-btn--confirm" data-owner-actor-id="${ownerActor?.id ?? ''}" data-challenger-actor-id="${challengerActor?.id ?? ''}" data-challenger-token-id="${challengerTokenId ?? ''}">Aprovar e Iniciar</button>
      <button class="jem-dominio-clash-reject jem-btn jem-btn--deny" data-owner-actor-id="${ownerActor?.id ?? ''}" data-challenger-actor-id="${challengerActor?.id ?? ''}" data-challenger-token-id="${challengerTokenId ?? ''}" data-requested-by="${requestedBy ?? ''}">Recusar</button>
    </div>`;
}

async function _gmStartRequest({ ownerActorId, challengerActorId, challengerTokenId, requestedBy } = {}) {
  const ownerActor = _resolveActorById(ownerActorId);
  const challengerActor = _resolveActorById(challengerActorId);
  if (!ownerActor || !challengerActor) return;

  try {
    const all = await getSceneClashes();
    const active = Object.values(all ?? {}).find(c => c && c.status === 'active' &&
      ((String(c.ownerActorId) === String(ownerActor.id) && String(c.challengerActorId) === String(challengerActor.id)) ||
        (String(c.ownerActorId) === String(challengerActor.id) && String(c.challengerActorId) === String(ownerActor.id))));
    if (active?.id) {
      const clashId = String(active.id);
      try {
        active.status = 'finished';
        active.finishedAt = _now();
        active.reason = 'restarted';
        all[clashId] = active;
        await setSceneClashes(all);
      } catch (_) { /* ignore */ }
      await ChatMessage.create({
        content: `<div><strong>Batalha de Domínio reiniciada</strong>: o confronto anterior entre <strong>${challengerActor.name}</strong> e <strong>${ownerActor.name}</strong> foi encerrado e um novo poderá ser iniciado.</div>`,
        whisper: _clashWhisperUserIds(ownerActor, challengerActor),
      });
    }
  } catch (_) { /* ignore */ }

  await ChatMessage.create({
    content: _renderApprovalCard({ ownerActor, challengerActor, challengerTokenId, requestedBy }),
  });
}

async function _gmRejectRequest({ ownerActorId, challengerActorId, challengerTokenId, requestedBy } = {}) {
  const requesterName = (() => {
    try {
      const u = requestedBy ? game.users?.get?.(requestedBy) : null;
      return u?.name ?? '—';
    } catch (_) {
      return '—';
    }
  })();
  await ChatMessage.create({
    content: `<div><strong>Confronto de Domínio recusado</strong> pelo Mestre.</div><div class="flavor-text">Solicitante: <strong>${requesterName}</strong></div>`,
  });
}

function requestNextRound({ clashId } = {}) {
  const payload = { clashId, sceneId: canvas?.scene?.id ?? null, requestedBy: game.user?.id ?? null };
  if (_shouldHandleLocallyAsGM()) {
    _log('requestNextRound: single GM, handle locally', payload);
    _gmNextRound(payload);
    return;
  }
  _emitToSocket('nextRound', payload);
}

function requestEndClash({ clashId } = {}) {
  const payload = { clashId, sceneId: canvas?.scene?.id ?? null, requestedBy: game.user?.id ?? null };
  if (_shouldHandleLocallyAsGM()) {
    _log('requestEnd: single GM, handle locally', payload);
    _gmEndClash(payload);
    return;
  }
  _emitToSocket('end', payload);
}

async function _gmStartClash({ ownerActorId, challengerActorId, challengerTokenId, clashId } = {}) {
  const ownerActor = _resolveActorById(ownerActorId);
  const challengerActor = _resolveActorById(challengerActorId);
  if (!ownerActor || !challengerActor) return;

  try {
    const allExisting = await getSceneClashes();
    const existing = clashId ? (allExisting?.[clashId] ?? null) : null;
    if (existing && existing.status === 'active') return;
  } catch (_) { /* ignore */ }

  const dominio = getActiveDominio(ownerActor);
  if (!dominio) return;

  try {
    const allExistingPairs = await getSceneClashes();
    const alreadyActive = Object.values(allExistingPairs ?? {}).find(c => c && c.status === 'active' &&
      ((String(c.ownerActorId) === String(ownerActor.id) && String(c.challengerActorId) === String(challengerActor.id)) ||
        (String(c.ownerActorId) === String(challengerActor.id) && String(c.challengerActorId) === String(ownerActor.id))));
    if (alreadyActive) {
      const activeClashId = alreadyActive?.id ?? null;
      try {
        if (activeClashId) {
          alreadyActive.status = 'finished';
          alreadyActive.finishedAt = _now();
          alreadyActive.reason = 'restarted';
          allExistingPairs[String(activeClashId)] = alreadyActive;
          await setSceneClashes(allExistingPairs);
          await ChatMessage.create({
            content: `<div><strong>Batalha de Domínio reiniciada</strong>: o confronto anterior foi encerrado e um novo será iniciado.</div>`,
            whisper: _clashWhisperUserIds(ownerActor, challengerActor),
          });
        }
      } catch (_) { /* ignore */ }
    }
  } catch (_) { /* ignore */ }

  if (dominio.sceneId && canvas?.scene?.id && String(dominio.sceneId) !== String(canvas.scene.id)) return;

  const ownerTokenDoc = (() => {
    try {
      const token = dominio?.tokenId ? canvas?.tokens?.get?.(dominio.tokenId) : null;
      return token?.document ?? null;
    } catch (_) {
      return null;
    }
  })();

  const challengerTokenDoc = (() => {
    try {
      if (challengerTokenId) {
        const t = canvas?.tokens?.get?.(String(challengerTokenId)) ?? null;
        return t?.document ?? null;
      }
    } catch (_) { /* ignore */ }
    return _getPrimaryTokenDoc(challengerActor);
  })();
  if (!challengerTokenDoc) return;

  let insideOrOverlap = false;
  try {
    insideOrOverlap = isTokenInsideDominio(challengerTokenDoc, dominio);
  } catch (_) { insideOrOverlap = false; }

  if (!insideOrOverlap) {
    try {
      const challengerDom = getActiveDominio(challengerActor);
      const sameScene = (!dominio?.sceneId || !challengerDom?.sceneId) ? true : (String(dominio.sceneId) === String(challengerDom.sceneId));
      const overlap = sameScene && challengerDom?.center && challengerDom?.radiusPixels && dominio?.center && dominio?.radiusPixels
        ? (() => {
          const dx = (Number(dominio.center.x ?? 0) - Number(challengerDom.center.x ?? 0));
          const dy = (Number(dominio.center.y ?? 0) - Number(challengerDom.center.y ?? 0));
          const dist2 = (dx * dx) + (dy * dy);
          const r = (Number(dominio.radiusPixels ?? 0) || 0) + (Number(challengerDom.radiusPixels ?? 0) || 0);
          return dist2 <= (r * r);
        })()
        : false;

      if (overlap) insideOrOverlap = true;
    } catch (_) { /* ignore */ }
  }

  if (!insideOrOverlap) return;
  if (!actorHasDominioExpansion(challengerActor)) return;

  const baseAreaOwner = Math.max(1, _safeInt(_computeActorDominioRadiusSquares(ownerActor), 1));
  const baseAreaChal = Math.max(1, _safeInt(_computeActorDominioRadiusSquares(challengerActor), 1));
  const maxAreaOwner = baseAreaOwner + 5;
  const maxAreaChal = baseAreaChal + 5;
  const finalClashId = _makeClashId({ ownerActorId, challengerActorId });

  const clash = {
    id: finalClashId,
    sceneId: canvas?.scene?.id ?? null,
    status: 'active',
    createdAt: _now(),
    round: 1,
    ownerActorId: ownerActor.id,
    challengerActorId: challengerActor.id,
    points: { [ownerActor.id]: 0, [challengerActor.id]: 0 },
    area: { [ownerActor.id]: baseAreaOwner, [challengerActor.id]: baseAreaChal },
    maxArea: { [ownerActor.id]: maxAreaOwner, [challengerActor.id]: maxAreaChal },
    lastRolls: {},
    pending: { [ownerActor.id]: null, [challengerActor.id]: null },
    skillCheckHits: { [ownerActor.id]: 0, [challengerActor.id]: 0 },
    tokenUuids: { [ownerActor.id]: ownerTokenDoc?.uuid ?? null, [challengerActor.id]: challengerTokenDoc?.uuid ?? null },
  };

  const all = await getSceneClashes();
  if (all?.[finalClashId]?.status === 'active') return;
  all[finalClashId] = clash;
  await setSceneClashes(all);

  await ChatMessage.create({
    content: _renderClashCard(clash, { ownerActor, challengerActor, header: 'Batalha de Domínio iniciada' }),
    whisper: _clashWhisperUserIds(ownerActor, challengerActor),
  });

  await _requestRoll({ clashId: finalClashId, actorId: ownerActor.id, tokenUuid: ownerTokenDoc?.uuid ?? null, round: clash.round });
  await _requestRoll({ clashId: finalClashId, actorId: challengerActor.id, tokenUuid: challengerTokenDoc?.uuid ?? null, round: clash.round });
}

async function _gmNextRound({ clashId } = {}) {
  const all = await getSceneClashes();
  const clash = all?.[clashId] ?? null;
  if (!clash || clash.status !== 'active') return;

  const ownerActor = _resolveActorById(clash.ownerActorId);
  const challengerActor = _resolveActorById(clash.challengerActorId);
  if (!ownerActor || !challengerActor) return;

  clash.round = _safeInt(clash.round, 1) + 1;
  clash.pending = { [ownerActor.id]: null, [challengerActor.id]: null };
  await setSceneClashes(all);

  await ChatMessage.create({
    content: _renderClashCard(clash, { ownerActor, challengerActor, header: `Rodada ${clash.round}` }),
    whisper: _clashWhisperUserIds(ownerActor, challengerActor),
  });

  const ownerTokenUuid = clash?.tokenUuids?.[ownerActor.id] ?? null;
  const challengerTokenUuid = clash?.tokenUuids?.[challengerActor.id] ?? null;

  await _requestRoll({ clashId, actorId: ownerActor.id, tokenUuid: ownerTokenUuid, round: clash.round });
  await _requestRoll({ clashId, actorId: challengerActor.id, tokenUuid: challengerTokenUuid, round: clash.round });
}

async function _gmEndClash({ clashId, reason = 'ended' } = {}) {
  const all = await getSceneClashes();
  const clash = all?.[clashId] ?? null;
  if (!clash) return;
  clash.status = 'finished';
  clash.finishedAt = _now();
  clash.reason = reason;
  await setSceneClashes(all);
}

async function _gmReceiveRollResult({ clashId, actorId, total, formula, roll, skillCheck, forfeit } = {}) {
  const all = await getSceneClashes();
  const clash = all?.[clashId] ?? null;
  if (!clash || clash.status !== 'active') return;

  const ownerActor = _resolveActorById(clash.ownerActorId);
  const challengerActor = _resolveActorById(clash.challengerActorId);
  if (!ownerActor || !challengerActor) return;

  if (!clash.pending || typeof clash.pending !== 'object') clash.pending = {};
  if (!Object.prototype.hasOwnProperty.call(clash.pending, actorId)) return;

  if (forfeit === true) {
    const aId0 = ownerActor.id;
    const bId0 = challengerActor.id;
    const winnerActorId = (String(actorId) === String(aId0)) ? bId0 : aId0;
    clash.status = 'finished';
    clash.finishedAt = _now();
    clash.winnerActorId = winnerActorId;
    clash.reason = 'forfeit';
    clash.lastRolls = clash.lastRolls || {};
    clash.lastRolls[actorId] = {
      total: _safeInt(total, 0),
      formula: String(formula ?? 'FORFEIT'),
      at: _now(),
      roll,
      skillCheck: (skillCheck && typeof skillCheck === 'object') ? skillCheck : { result: 'forfeit' },
      forfeit: true,
    };
    await setSceneClashes(all);
    await ChatMessage.create({
      content: _renderClashCard(clash, {
        ownerActor,
        challengerActor,
        header: 'Batalha de Domínio finalizada',
        extra: `<div class="flavor-text"><strong>${_resolveActorById(actorId)?.name ?? '—'}</strong> desistiu. Vitória automática do oponente.</div>`,
      }),
      whisper: _clashWhisperUserIds(ownerActor, challengerActor),
    });
    return;
  }

  clash.pending[actorId] = _safeInt(total, 0);
  clash.lastRolls = clash.lastRolls || {};
  clash.lastRolls[actorId] = {
    total: _safeInt(total, 0),
    formula: String(formula ?? ''),
    at: _now(),
    roll,
    skillCheck: (skillCheck && typeof skillCheck === 'object') ? skillCheck : null,
  };

  const aId = ownerActor.id;
  const bId = challengerActor.id;
  const aRoll = clash.pending[aId];
  const bRoll = clash.pending[bId];

  await setSceneClashes(all);

  if (aRoll == null || bRoll == null) return;

  const aRes = String(clash.lastRolls?.[aId]?.skillCheck?.result ?? '').toLowerCase();
  const bRes = String(clash.lastRolls?.[bId]?.skillCheck?.result ?? '').toLowerCase();
  const deltaFor = (res) => {
    if (res === 'great') return 2;
    if (res === 'success') return 1;
    return -1;
  };

  const aDelta = deltaFor(aRes);
  const bDelta = deltaFor(bRes);
  clash.points[aId] = _safeInt(clash.points?.[aId], 0) + aDelta;
  clash.points[bId] = _safeInt(clash.points?.[bId], 0) + bDelta;

  const diff = Math.abs(_safeInt(clash.points[aId], 0) - _safeInt(clash.points[bId], 0));
  if (diff >= 5) {
    clash.status = 'finished';
    clash.finishedAt = _now();
    clash.winnerActorId = (_safeInt(clash.points[aId], 0) > _safeInt(clash.points[bId], 0)) ? aId : bId;
    clash.reason = 'diff-5';
  }

  try {
    if (!clash.skillCheckHits || typeof clash.skillCheckHits !== 'object') clash.skillCheckHits = {};
    if (aRes === 'success') clash.skillCheckHits[aId] = _safeInt(clash.skillCheckHits[aId], 0) + 1;
    else if (aRes === 'great') clash.skillCheckHits[aId] = _safeInt(clash.skillCheckHits[aId], 0) + 2;
    if (bRes === 'success') clash.skillCheckHits[bId] = _safeInt(clash.skillCheckHits[bId], 0) + 1;
    else if (bRes === 'great') clash.skillCheckHits[bId] = _safeInt(clash.skillCheckHits[bId], 0) + 2;
  } catch (_) { /* ignore */ }

  await setSceneClashes(all);

  await ChatMessage.create({
    content: _renderClashCard(clash, {
      ownerActor,
      challengerActor,
      header: clash.status === 'finished' ? 'Batalha de Domínio finalizada' : `Resultado da Rodada ${clash.round}`,
      extra: `<div class="flavor-text">Checks: <strong>${ownerActor.name}</strong> ${String(aRes || 'fail').toUpperCase()} (${aRoll}) vs <strong>${challengerActor.name}</strong> ${String(bRes || 'fail').toUpperCase()} (${bRoll})</div>`,
    }),
    whisper: _clashWhisperUserIds(ownerActor, challengerActor),
  });

  if (clash.status !== 'finished') {
    clash.round = _safeInt(clash.round, 1) + 1;
    clash.pending = { [ownerActor.id]: null, [challengerActor.id]: null };
    await setSceneClashes(all);

    await ChatMessage.create({
      content: _renderClashCard(clash, { ownerActor, challengerActor, header: `Rodada ${clash.round}` }),
      whisper: _clashWhisperUserIds(ownerActor, challengerActor),
    });

    const ownerTokenUuid = clash?.tokenUuids?.[ownerActor.id] ?? null;
    const challengerTokenUuid = clash?.tokenUuids?.[challengerActor.id] ?? null;

    await _requestRoll({ clashId, actorId: ownerActor.id, tokenUuid: ownerTokenUuid, round: clash.round });
    await _requestRoll({ clashId, actorId: challengerActor.id, tokenUuid: challengerTokenUuid, round: clash.round });
  }
}

function _renderClashCard(clash, { ownerActor, challengerActor, header = 'Batalha de Domínio', extra = '' } = {}) {
  const aId = ownerActor?.id ?? clash?.ownerActorId;
  const bId = challengerActor?.id ?? clash?.challengerActorId;
  const aPts = _safeInt(clash?.points?.[aId], 0);
  const bPts = _safeInt(clash?.points?.[bId], 0);
  const aArea = _safeInt(clash?.area?.[aId], 1);
  const bArea = _safeInt(clash?.area?.[bId], 1);
  const done = clash?.status === 'finished';
  const winner = done ? (clash?.winnerActorId === aId ? ownerActor?.name : challengerActor?.name) : null;
  const btns = done
    ? `<button class="jem-dominio-clash-end jem-btn" data-clash-id="${clash.id}" disabled>Encerrado</button>`
    : `<button class="jem-btn" disabled>Rodadas automáticas...</button>`;

  return `
    <div class="jem-clash-card" style="padding:6px 2px;">
      <div><strong>${header}</strong></div>
      <div class="flavor-text">${ownerActor?.name ?? '—'} vs ${challengerActor?.name ?? '—'} (Rodada ${_safeInt(clash?.round, 1)})</div>
      <hr/>
      <div><strong>${ownerActor?.name ?? '—'}</strong>: Pontos ${aPts} | Área (raio) ${aArea}</div>
      <div><strong>${challengerActor?.name ?? '—'}</strong>: Pontos ${bPts} | Área (raio) ${bArea}</div>
      ${winner ? `<div style="margin-top:6px;"><strong>Vencedor:</strong> ${winner}</div>` : ''}
      ${extra || ''}
      <div style="margin-top:8px; display:flex; gap:8px;">
        ${btns}
      </div>
    </div>`;
}

async function notifyTokensInsideDominio({ ownerActor, dominio } = {}) {
  if (!ownerActor || !dominio) return;

  _log('notifyTokensInsideDominio: start', {
    owner: { name: ownerActor?.name, id: ownerActor?.id },
    sceneId: dominio?.sceneId ?? null,
    radiusMeters: dominio?.radiusMeters ?? null,
  });

  const tokens = canvas?.tokens?.placeables ?? [];
  if (!tokens.length) return;

  const ownerName = ownerActor.name;
  const radiusMeters = Number(dominio.radiusMeters ?? 0) || 0;

  for (const tok of tokens) {
    try {
      const tokenDoc = tok?.document;
      const actor = tok?.actor;
      if (!tokenDoc || !actor) continue;
      if (dominio.sceneId && tokenDoc.scene?.id && String(dominio.sceneId) !== String(tokenDoc.scene.id)) continue;
      if (String(actor.id) === String(ownerActor.id)) continue;

      const inside = isTokenInsideDominio(tokenDoc, dominio);
      if (!inside) continue;

      const hasOwner = !!(game.users?.contents ?? []).some(u => u?.active && !u.isGM && actor.testUserPermission?.(u, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER));
      if (!hasOwner && !game.user?.isGM) continue;

      const eligible = actorHasDominioExpansion(actor);
      const whisper = [];
      try {
        const users = game.users?.contents ?? [];
        for (const u of users) {
          if (!u?.active) continue;
          if (u.isGM) {
            whisper.push(u.id);
            continue;
          }
          try {
            if (actor.testUserPermission?.(u, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) whisper.push(u.id);
          } catch (_) { /* ignore */ }
        }
      } catch (_) { /* ignore */ }

      if (!whisper.length) continue;

      const btn = eligible
        ? `<div style="margin-top:8px;"><button class="jem-dominio-clash-start jem-btn jem-btn--primary" data-owner-actor-id="${ownerActor.id}" data-challenger-actor-id="${actor.id}" data-challenger-token-id="${String(tok?.id ?? tokenDoc?.id ?? '')}">Solicitar Confronto (Batalha de Domínio)</button></div>`
        : '';

      const msg = `
        <div><strong>${ownerName}</strong> expandiu um Domínio.</div>
        <div class="flavor-text">Você está dentro da área (raio ${radiusMeters || '—'} m).</div>
        ${eligible ? '<div class="flavor-text">Você pode reagir expandindo seu Domínio para contestar (Batalha de Domínio).</div>' : '<div class="flavor-text">Você não possui Expansão de Domínio para contestar.</div>'}
        ${btn}`;

      await ChatMessage.create({
        content: msg,
        whisper,
      });
    } catch (e) {
      _warn('falha ao notificar token dentro do domínio', e);
    }
  }
}

function registerDominioClashSocket() {
  if (!game.socket?.on) return;
  try {
    _log('socket: registered', { channel: _socketChannel(), user: game.user?.name, userId: game.user?.id, isGM: !!game.user?.isGM });
  } catch (_) { /* ignore */ }

  game.socket.on(_socketChannel(), async (message) => {
    try {
      if (!message || message.scope !== 'dominioClash') return;
      const action = message.action;
      const data = message.data || {};

      _log('socket recv', { action, data, user: game.user?.name, userId: game.user?.id, isGM: !!game.user?.isGM });

      if (action === 'requestRoll') {
        const { clashId, actorId, tokenUuid, round } = data;

        let actor = _resolveActorById(actorId);
        if (!actor && tokenUuid) {
          try {
            const tokenDoc = await fromUuid(tokenUuid);
            actor = tokenDoc?.actor ?? tokenDoc?.object?.actor ?? null;
          } catch (_) { /* ignore */ }
        }

        if (!actor) return;
        if (!actor.isOwner) return;

        if (game.user?.isGM && _hasActiveNonGMOwner(actor)) return;

        await _openRollDialog({ clashId, actor, round });
        return;
      }

      if (!game.user?.isGM) return;

      if (action === 'startRequest') return _gmStartRequest(data);
      if (action === 'reject') return _gmRejectRequest(data);
      if (action === 'start') return _gmStartClash(data);
      if (action === 'nextRound') return _gmNextRound(data);
      if (action === 'end') return _gmEndClash(data);
      if (action === 'rollResult') return _gmReceiveRollResult(data);
    } catch (e) {
      console.warn('dominioClash: erro no socket handler', e);
    }
  });
}

async function _openRollDialog({ clashId, actor, round } = {}) {
  const bonus = computeDominioClashBonus(actor);
  const domNivel = getDominioAptidaoNivel(actor);

  let hits = 0;
  try {
    const all = await getSceneClashes();
    const clash = all?.[clashId] ?? null;
    hits = _skillCheckDifficultyFromHits(clash?.skillCheckHits?.[actor?.id]);
  } catch (_) {
    hits = 0;
  }

  const baseSpeedDegPerSec = Math.max(120, 260 - (domNivel * 20));
  const baseSuccessWidthDeg = Math.min(120, 40 + (domNivel * 10));
  const baseGreatWidthDeg = Math.min(60, 12 + (domNivel * 4));

  const speedDegPerSec = Math.round(baseSpeedDegPerSec * (1 + (hits * 0.12)));
  const successWidthDeg = Math.max(18, Math.round(baseSuccessWidthDeg - (hits * 4)));
  const greatWidthDeg = Math.max(6, Math.round(baseGreatWidthDeg - (hits * 2)));

  const r = _safeInt(round, 1);
  // A zona muda a cada vez que o modal abre.
  // (Antes era determinístico por hash; aqui intencionalmente é aleatório.)
  const zoneAngle = (() => {
    try {
      // Preferir crypto quando disponível.
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return _normalizeDeg((a[0] / 0xFFFFFFFF) * 360);
    } catch (_) {
      return _normalizeDeg(Math.random() * 360);
    }
  })();
  const baseByResult = { fail: 0, success: 10, great: 20 };

  return new Promise((resolve) => {
    let submitted = false;
    let rafId = null;
    let startTs = null;
    let lastAngle = 0;
    let rootEl = null;
    let skillcheckEl = null;

    const content = `
      <div class="jem-skillcheck">
        <div><strong>Batalha de Domínio — Skill Check</strong></div>
        <div class="flavor-text">Ator: <strong>${actor?.name ?? '—'}</strong></div>
        <div class="flavor-text">Bônus fixo: <strong>+${bonus}</strong> (Aptidão em Domínio + Habilidades de Domínio)</div>
        <div class="jem-skillcheck__wrap" style="margin-top:10px;">
          <div class="jem-skillcheck__dial">
            <div class="jem-skillcheck__band jem-skillcheck__band--success"></div>
            <div class="jem-skillcheck__band jem-skillcheck__band--great"></div>
            <div class="jem-skillcheck__hole"></div>
            <div class="jem-skillcheck__marker" title="Zona de acerto"></div>
            <div class="jem-skillcheck__needle"></div>
            <div class="jem-skillcheck__center"></div>
          </div>
          <div style="flex: 1; min-width: 220px;">
            <div class="flavor-text">Aperte <strong>Espaço</strong> (ou clique em <strong>Bater</strong>) quando o ponteiro estiver dentro da área.</div>
            <div class="jem-skillcheck__hint flavor-text">Nível de Domínio: <strong>${domNivel}</strong> | Sequência (acertos): <strong>${hits}</strong> | Velocidade: <strong>${Math.round(speedDegPerSec)}</strong></div>
            <div class="jem-skillcheck__result"></div>
          </div>
        </div>
      </div>`;

    const dialog = new Dialog({
      title: 'Batalha de Domínio — Skill Check',
      content,
      buttons: {
        hit: {
          label: 'Bater',
          callback: async () => { await finalize('hit'); },
        },
        cancel: {
          label: 'Cancelar',
          callback: async () => { await finalize('cancel'); },
        },
      },
      default: 'hit',
      close: async () => { await finalize('close'); resolve(true); },
    }, { width: 720, height: 'auto' });

    const cleanup = () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      rafId = null;
      try { window.removeEventListener('keydown', onKeyDown, true); } catch (_) { /* ignore */ }
    };

    const tick = (ts, needleEl) => {
      if (startTs == null) startTs = ts;
      const elapsed = (ts - startTs) / 1000;
      lastAngle = _normalizeDeg(elapsed * speedDegPerSec);
      // Sempre atualiza o transform da agulha diretamente (mais robusto do que depender apenas de CSS vars).
      // Também mantém a CSS var com unidade 'deg' para compatibilidade com estilos existentes.
      try {
        needleEl.style.transform = `translate(-50%, -100%) rotate(${lastAngle}deg)`;
      } catch (_) { /* ignore */ }
      // CSS espera um número (pois multiplica por 1deg no stylesheet).
      if (skillcheckEl) skillcheckEl.style.setProperty('--jem-needle-angle', String(lastAngle));
      rafId = requestAnimationFrame((t) => tick(t, needleEl));
    };

    async function submitResult(resultKey, { forfeit = false } = {}) {
      const base = baseByResult[resultKey] ?? 0;
      const total = _safeInt(base + bonus, 0);
      const formula = `SKILLCHECK:${String(resultKey).toUpperCase()} + ${bonus}`;
      const payload = {
        clashId,
        actorId: actor.id,
        total,
        formula,
        roll: null,
        userId: game.user?.id ?? null,
        forfeit: forfeit === true,
        skillCheck: {
          result: resultKey,
          base,
          bonus,
          angle: Math.round(lastAngle),
          zoneAngle: Math.round(zoneAngle),
          successWidthDeg,
          greatWidthDeg,
          speedDegPerSec,
          round: r,
        },
      };

      if (_shouldHandleLocallyAsGM()) {
        await _gmReceiveRollResult(payload);
        return;
      }
      _emitToSocket('rollResult', payload);
    }

    async function finalize(kind) {
      if (submitted) return;
      submitted = true;
      cleanup();
      let resultKey = 'fail';
      let isForfeit = false;
      if (kind === 'hit') {
        const dist = _shortestAngularDistanceDeg(lastAngle, zoneAngle);
        if (dist <= (greatWidthDeg / 2)) resultKey = 'great';
        else if (dist <= (successWidthDeg / 2)) resultKey = 'success';
        else resultKey = 'fail';
      } else {
        resultKey = 'fail';
        isForfeit = true;
      }
      try {
        const resEl = dialog?.element?.[0]?.querySelector?.('.jem-skillcheck__result');
        if (resEl) {
          resEl.textContent = `Resultado: ${resultKey.toUpperCase()} (Total: ${_safeInt((baseByResult[resultKey] ?? 0) + bonus, 0)})`;
          resEl.classList.remove('success', 'great', 'fail');
          resEl.classList.add(String(resultKey));
        }
      } catch (_) { /* ignore */ }
      try { await submitResult(resultKey, { forfeit: isForfeit }); } catch (_) { /* ignore */ }
      setTimeout(() => { try { dialog.close(); } catch (_) { /* ignore */ } }, 350);
    }

    function onKeyDown(ev) {
      if (ev?.code === 'Space' || ev?.key === ' ') {
        ev.preventDefault();
        ev.stopPropagation();
        finalize('hit');
      }
    }

    dialog.render(true);

    setTimeout(() => {
      try {
        rootEl = dialog?.element?.[0] ?? null;
        if (!rootEl) return;
        skillcheckEl = rootEl.querySelector('.jem-skillcheck');
        const targetEl = skillcheckEl || rootEl;
        // Importante: `.jem-skillcheck` define defaults das CSS vars, então precisamos setar nela
        // (setar no pai não sobrescreve as declarações locais).
        targetEl.style.setProperty('--jem-zone-angle', String(zoneAngle));
        targetEl.style.setProperty('--jem-success-width', String(successWidthDeg));
        targetEl.style.setProperty('--jem-great-width', String(greatWidthDeg));
        targetEl.style.setProperty('--jem-needle-angle', '0');
        const needleEl = rootEl.querySelector('.jem-skillcheck__needle');
        if (needleEl) rafId = requestAnimationFrame((t) => tick(t, needleEl));
        window.addEventListener('keydown', onKeyDown, true);
      } catch (_) { /* ignore */ }
    }, 0);
  });
}

export {
  notifyTokensInsideDominio,
  registerDominioClashSocket,
  requestStartDominioClash,
  requestNextRound,
  requestEndClash,
  requestRejectDominioClash,
  actorHasDominioExpansion,
  computeDominioClashBonus,
};