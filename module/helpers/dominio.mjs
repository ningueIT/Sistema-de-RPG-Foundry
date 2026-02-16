const SYSTEM_ID = 'feiticeiros-e-maldicoes';

const FLAG_ACTIVE = 'dominioActive';
const FLAG_BURNOUT = 'dominioBurnout';

const EFFECT_FLAG_PATH = 'dominio.effect';
const EFFECT_NAME = 'Expansão de Domínio';

// Defaults (ajuste livremente depois)
const DEFAULT_BURNOUT_ROUNDS = {
  incompleta: 10, // ~1 minuto
  completa: 20,
};

// Tabelas (padrões). Preencha com os valores exatos do livro quando tiver.
// Mantive apenas os exemplos explícitos do seu plano como defaults.
const DOMINIO_CONFIG = {
  amplificacaoTecnica: {
    0: { dice: 0, flat: 0 },
    1: { dice: 1, flat: 5 },
    2: { dice: 2, flat: 5 },
    3: { dice: 0, flat: 0 },
    4: { dice: 0, flat: 0 },
    5: { dice: 0, flat: 0 },
  },
  amplificacaoCorporal: {
    0: { defense: 0 },
    1: { defense: 0 },
    2: { defense: 0 },
    3: { defense: 0 },
    4: { defense: 0 },
    5: { defense: 0 },
  },
  ambiental: {
    dano: {
      1: { formula: '1d10 + 10', type: 'generic' },
      2: { formula: '', type: 'generic' },
      3: { formula: '', type: 'generic' },
      4: { formula: '', type: 'generic' },
      5: { formula: '', type: 'generic' },
    },
    lentidao: { movePenalty: -3 },
  },
};

function _normalizeDominioConfig(raw = {}) {
  const cfg = raw && typeof raw === 'object' ? raw : {};
  return {
    amplificacaoTecnica: Number(cfg.amplificacaoTecnica ?? 0) || 0,
    amplificacaoCorporal: Number(cfg.amplificacaoCorporal ?? 0) || 0,
    efeitoAmbiental: String(cfg.efeitoAmbiental ?? 'nenhum'),
    ambientalSave: String(cfg.ambientalSave ?? 'fortitude'),
    ambientalDcBonus: Number(cfg.ambientalDcBonus ?? 0) || 0,
    ambientalCondicao: String(cfg.ambientalCondicao ?? 'abalado'),
  };
}

function _getTokenCenter(tokenDoc) {
  const obj = tokenDoc?.object;
  if (obj?.center) return { x: obj.center.x, y: obj.center.y };
  const x = Number(tokenDoc?.x ?? 0);
  const y = Number(tokenDoc?.y ?? 0);
  const w = Number(tokenDoc?.width ?? 1) * (canvas?.grid?.size ?? 100);
  const h = Number(tokenDoc?.height ?? 1) * (canvas?.grid?.size ?? 100);
  return { x: x + (w / 2), y: y + (h / 2) };
}

function _isInsideCircle(point, center, radiusPixels) {
  if (!point || !center || !radiusPixels) return false;
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return (dx * dx + dy * dy) <= (radiusPixels * radiusPixels);
}

function _getTokenDocForActor(actor) {
  try {
    const token = actor?.getActiveTokens?.(true, true)?.[0] ?? null;
    return token?.document ?? null;
  } catch (_) {
    return null;
  }
}

function actorHasAntiDominio(actor) {
  if (!actor) return false;
  try {
    const flag = actor.getFlag?.(SYSTEM_ID, 'antiDominio') ?? null;
    if (flag === true) return true;
    if (flag && typeof flag === 'object') {
      if (flag.immuneToSureHit === true) return true;
      if (flag.immuneSureHit === true) return true;
    }
  } catch (_) { /* ignore */ }

  try {
    const effects = actor.effects?.filter?.(e => !e.disabled) ?? [];
    return effects.some(e => {
      const a = e?.flags?.[SYSTEM_ID]?.antiDominio;
      if (a === true) return true;
      if (a && typeof a === 'object') {
        return a.immuneToSureHit === true || a.immuneSureHit === true;
      }
      return false;
    });
  } catch (_) {
    return false;
  }
}

function isTokenInsideDominio(tokenDoc, dominio) {
  if (!tokenDoc || !dominio) return false;
  const radiusPixels = Number(dominio.radiusPixels ?? 0) || 0;
  if (!radiusPixels) return false;
  const point = _getTokenCenter(tokenDoc);
  return _isInsideCircle(point, dominio.center, radiusPixels);
}

function _tokensHaveDifferentDisposition(sourceTokenDoc, targetTokenDoc) {
  try {
    const a = Number(sourceTokenDoc?.disposition);
    const b = Number(targetTokenDoc?.disposition);
    if (Number.isNaN(a) || Number.isNaN(b)) return true;
    return a !== b;
  } catch (_) {
    return true;
  }
}

function isSureHitActiveForActor(actor) {
  const dominio = getActiveDominio(actor);
  if (!dominio) return false;
  if (!dominio.acertoGarantido) return false;
  if (dominio.clash) return false;
  return true;
}

function getSureHitTargetsForAttack(attackerActor, targetTokenDocs = []) {
  if (!attackerActor) return [];
  const dominio = getActiveDominio(attackerActor);
  if (!dominio || !dominio.acertoGarantido || dominio.clash) return [];

  const attackerTokenDoc = _getTokenDocForActor(attackerActor);
  const sceneId = dominio.sceneId ?? canvas?.scene?.id ?? null;

  const sureHit = [];
  for (const targetTokenDoc of (targetTokenDocs || [])) {
    try {
      if (!targetTokenDoc?.actor) continue;
      if (sceneId && targetTokenDoc.scene?.id && String(targetTokenDoc.scene.id) !== String(sceneId)) continue;
      if (!isTokenInsideDominio(targetTokenDoc, dominio)) continue;
      if (actorHasAntiDominio(targetTokenDoc.actor)) continue;
      if (attackerTokenDoc && !_tokensHaveDifferentDisposition(attackerTokenDoc, targetTokenDoc)) continue;
      sureHit.push(targetTokenDoc);
    } catch (_) { /* ignore per-target */ }
  }

  return sureHit;
}

function isSureHitApplicableToTarget({ sourceActor, targetTokenDoc } = {}) {
  if (!sourceActor || !targetTokenDoc?.actor) return false;
  const dominio = getActiveDominio(sourceActor);
  if (!dominio || !dominio.acertoGarantido || dominio.clash) return false;
  if (actorHasAntiDominio(targetTokenDoc.actor)) return false;
  const sourceTokenDoc = _getTokenDocForActor(sourceActor);
  if (sourceTokenDoc && !_tokensHaveDifferentDisposition(sourceTokenDoc, targetTokenDoc)) return false;
  return isTokenInsideDominio(targetTokenDoc, dominio);
}

function getActiveDominio(actor) {
  if (!actor?.getFlag) return null;
  return actor.getFlag(SYSTEM_ID, FLAG_ACTIVE) ?? null;
}

async function setActiveDominio(actor, data) {
  if (!actor?.setFlag) return;
  await actor.setFlag(SYSTEM_ID, FLAG_ACTIVE, data);
}

async function clearActiveDominio(actor) {
  if (!actor?.unsetFlag) return;
  try { await actor.unsetFlag(SYSTEM_ID, FLAG_ACTIVE); } catch (_) { /* ignore */ }
}

function getBurnout(actor) {
  if (!actor?.getFlag) return null;
  return actor.getFlag(SYSTEM_ID, FLAG_BURNOUT) ?? null;
}

async function setBurnout(actor, data) {
  if (!actor?.setFlag) return;
  await actor.setFlag(SYSTEM_ID, FLAG_BURNOUT, data);
}

async function clearBurnout(actor) {
  if (!actor?.unsetFlag) return;
  try { await actor.unsetFlag(SYSTEM_ID, FLAG_BURNOUT); } catch (_) { /* ignore */ }
}

function computeDominioDurationRounds(actor, tipo) {
  const domNivel = Number(actor?.system?.aptidaoNiveis?.dominio?.value ?? 0) || 0;
  if (tipo === 'incompleta') return 1 + domNivel;
  return 3 + domNivel;
}

function computePeCostWithDominio(actor, baseCost) {
  const cost = Number(baseCost ?? 0) || 0;
  if (cost <= 0) return 0;

  const dominio = getActiveDominio(actor);
  if (!dominio) return cost;

  // Redução só se o ator estiver dentro do próprio domínio
  const token = actor?.getActiveTokens?.(true, true)?.[0] ?? null;
  if (!token?.document) return cost;
  if (token.document?.scene?.id && dominio.sceneId && token.document.scene.id !== dominio.sceneId) return cost;

  const center = dominio.center;
  const radiusPixels = Number(dominio.radiusPixels ?? 0) || 0;
  const point = _getTokenCenter(token.document);
  const inside = _isInsideCircle(point, center, radiusPixels);
  if (!inside) return cost;

  return Math.max(0, cost - 1);
}

async function _ensureDominioEffect(actor, { enabled, dominio } = {}) {
  if (!actor) return null;
  const existing = actor.effects?.find?.(e => e?.flags?.[SYSTEM_ID]?.dominio?.effect) ?? null;

  const cfg = _normalizeDominioConfig(dominio?.config ?? {});
  const tech = DOMINIO_CONFIG.amplificacaoTecnica?.[cfg.amplificacaoTecnica] ?? { dice: 0, flat: 0 };
  const corp = DOMINIO_CONFIG.amplificacaoCorporal?.[cfg.amplificacaoCorporal] ?? { defense: 0 };

  const changes = [
    { key: 'system.aptidaoNiveis.aura.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: '2', priority: 20 },
    { key: 'system.aptidaoNiveis.controleELeitura.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: '2', priority: 20 },
    { key: 'system.aptidaoNiveis.energiaReversa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: '2', priority: 20 },
    { key: 'system.combate.movimento.emDominio', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 'true', priority: 20 },
  ];

  // Amplificação Técnica: bônus para dano de técnica (feitiços)
  try {
    const dice = Number(tech?.dice ?? 0) || 0;
    const flat = Number(tech?.flat ?? 0) || 0;
    if (dice) changes.push({ key: `flags.${SYSTEM_ID}.bonuses.dominio.techDice`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(dice), priority: 20 });
    if (flat) changes.push({ key: `flags.${SYSTEM_ID}.bonuses.dominio.techFlat`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(flat), priority: 20 });
  } catch (_) { /* ignore */ }

  // Amplificação Corporal: placeholder (ex: Defesa). Preencha DOMINIO_CONFIG.amplificacaoCorporal.
  try {
    const defense = Number(corp?.defense ?? 0) || 0;
    if (defense) changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(defense), priority: 20 });
  } catch (_) { /* ignore */ }

  const effectData = {
    name: EFFECT_NAME,
    icon: 'icons/svg/target.svg',
    disabled: !enabled,
    changes,
    flags: { [SYSTEM_ID]: { dominio: { effect: true } } },
  };

  if (!existing) {
    const created = await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
    return created?.[0] ?? null;
  }

  try {
    await existing.update({ disabled: !enabled, changes: effectData.changes });
  } catch (_) { /* ignore */ }
  return existing;
}

async function refreshDominioForActor(actor) {
  const dominio = getActiveDominio(actor);
  if (!dominio) {
    // Garante que o efeito não fica perdido
    const existing = actor.effects?.find?.(e => e?.flags?.[SYSTEM_ID]?.dominio?.effect) ?? null;
    if (existing) {
      try { await actor.deleteEmbeddedDocuments('ActiveEffect', [existing.id]); } catch (_) { /* ignore */ }
    }
    return;
  }

  const token = actor?.getActiveTokens?.(true, true)?.[0] ?? null;
  if (!token?.document) return;
  if (token.document?.scene?.id && dominio.sceneId && token.document.scene.id !== dominio.sceneId) return;

  const point = _getTokenCenter(token.document);
  const enabled = _isInsideCircle(point, dominio.center, Number(dominio.radiusPixels ?? 0) || 0);
  await _ensureDominioEffect(actor, { enabled, dominio });
}

function _computeDominioBarreiraHpMax(actor) {
  const system = actor?.system ?? {};
  const barNivel = Number(system?.aptidaoNiveis?.barreiras?.value ?? 0) || 0;
  const detalhes = system?.detalhes ?? {};
  const nivelPrincipal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
  const nivelSecundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;
  const charNivel = (nivelPrincipal || nivelSecundario)
    ? (nivelPrincipal + nivelSecundario)
    : (Number(detalhes?.nivel?.value ?? 0) || 0);

  const usoParedesResistentes = !!system?.aptidoes?.barreiras?.paredesResistentes;
  const pvPadrao = 5 + (barNivel * Math.floor(charNivel / 2));
  const pvResist = 10 + (barNivel * charNivel);
  const pvParede = usoParedesResistentes ? pvResist : pvPadrao;

  // Regra do plano: "dobro de 6 paredes" => 12 paredes-equivalentes
  return Math.max(0, (Number(pvParede) || 0) * 12);
}

async function _applyAmbientalEffectToToken({ dominioOwnerActor, dominio, targetTokenDoc } = {}) {
  if (!game.user?.isGM) return;
  if (!dominioOwnerActor || !dominio || !targetTokenDoc?.actor) return;

  const cfg = _normalizeDominioConfig(dominio.config ?? {});
  const type = String(cfg.efeitoAmbiental || 'nenhum');
  if (!type || type === 'nenhum') return;

  // Só inimigos
  try {
    const ownerTokenDoc = _getTokenDocForActor(dominioOwnerActor);
    if (ownerTokenDoc && !_tokensHaveDifferentDisposition(ownerTokenDoc, targetTokenDoc)) return;
  } catch (_) { /* ignore */ }

  const targetActor = targetTokenDoc.actor;

  if (type === 'lentidao') {
    const movePenalty = Number(DOMINIO_CONFIG.ambiental?.lentidao?.movePenalty ?? -3) || -3;
    const effectData = {
      name: 'Domínio — Lentidão Ambiental',
      icon: 'icons/svg/frozen.svg',
      disabled: false,
      origin: null,
      changes: [
        { key: 'system.combate.movimento.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(movePenalty), priority: 20 },
      ],
      duration: {},
      flags: { [SYSTEM_ID]: { dominio: { ambiental: true } } },
    };
    if (game.combat) {
      effectData.duration.rounds = 1;
      effectData.duration.startRound = Number(game.combat.round ?? 0) || 0;
      effectData.duration.startTurn = Number(game.combat.turn ?? 0) || 0;
    }
    try { await targetActor.createEmbeddedDocuments('ActiveEffect', [effectData]); } catch (_) { /* ignore */ }
    try { await ChatMessage.create({ content: `<div><strong>${targetActor.name}</strong> sofre <strong>Lentidão</strong> pelo efeito ambiental do domínio.</div>` }); } catch (_) {}
    return;
  }

  if (type === 'dano') {
    const domNivel = Number(dominioOwnerActor?.system?.aptidaoNiveis?.dominio?.value ?? 0) || 0;
    const entry = DOMINIO_CONFIG.ambiental?.dano?.[domNivel] ?? null;
    const formula = String(entry?.formula ?? '').trim();
    if (!formula) return;

    try {
      const { rollFormula } = await import('./rolls.mjs');
      const roll = await rollFormula(formula, { actor: dominioOwnerActor }, { asyncEval: true, toMessage: true, flavor: `<b>Domínio — Dano Ambiental</b> (${dominioOwnerActor.name})` });
      const amount = Number(roll?.total ?? 0) || 0;
      if (amount > 0 && typeof targetActor.applyDamage === 'function') {
        await targetActor.applyDamage(amount, String(entry?.type ?? 'generic'), false, { ignoreRD: false });
        await ChatMessage.create({ content: `<div><strong>${targetActor.name}</strong> sofre <strong>${amount}</strong> de dano ambiental do domínio.</div>` });
      }
    } catch (e) {
      console.warn('Domínio: falha ao aplicar dano ambiental', e);
    }
    return;
  }

  if (type === 'condicao') {
    // Solicita TR no chat; aplicação da condição é tratada no handler .jem-roll-save (boilerplate)
    const saveKey = String(cfg.ambientalSave || 'fortitude');
    const dcBase = Number(dominioOwnerActor?.system?.combate?.cd?.value ?? dominioOwnerActor?.system?.combate?.cd ?? dominioOwnerActor?.system?.cd?.value ?? 10) || 10;
    const dc = dcBase + (Number(cfg.ambientalDcBonus ?? 0) || 0);
    const condKey = String(cfg.ambientalCondicao || 'abalado');
    const saveLabel = ({ fortitude: 'Fortitude', reflexos: 'Reflexos', vontade: 'Vontade', astucia: 'Astúcia' })[saveKey] || saveKey;

    const html = `
      <div><strong>Domínio — Efeito Ambiental</strong> (${dominioOwnerActor.name})</div>
      <div style="margin-top:6px;"><strong>${targetActor.name}</strong> deve rolar TR de <strong>${saveLabel}</strong> (CD <strong>${dc}</strong>).</div>
      <div class="flavor-text">Em falha: aplica <strong>${condKey}</strong> por 1 rodada.</div>
      <div style="margin-top:8px; display:flex; gap:8px;">
        <button class="jem-roll-save jem-btn jem-btn--primary" data-source-actor-id="${dominioOwnerActor.id}" data-save-key="${saveKey}" data-dc="${dc}" data-target-token-id="${String(targetTokenDoc.id)}" data-target-actor-id="${String(targetActor.id)}" data-on-fail-condition="${condKey}" data-condition-rounds="1">Rolar TR (${targetActor.name})</button>
      </div>`;
    try { await ChatMessage.create({ content: html }); } catch (_) {}
    return;
  }
}

async function maybeApplyDominioAmbientalOnCombatUpdate(combat, changed) {
  if (!combat || !changed) return;
  if (!game.user?.isGM) return;
  if (!Object.prototype.hasOwnProperty.call(changed, 'turn') && !Object.prototype.hasOwnProperty.call(changed, 'round')) return;

  const combatant = combat.combatant;
  const tokenId = combatant?.tokenId ?? combatant?.token?.id;
  const targetToken = tokenId ? canvas.tokens?.get?.(tokenId) : null;
  const targetTokenDoc = targetToken?.document ?? combatant?.token?.document ?? null;
  if (!targetTokenDoc) return;

  for (const token of (canvas?.tokens?.placeables ?? [])) {
    const ownerActor = token?.actor;
    if (!ownerActor) continue;
    const dominio = getActiveDominio(ownerActor);
    if (!dominio) continue;
    if (dominio.sceneId && targetTokenDoc.scene?.id && String(dominio.sceneId) !== String(targetTokenDoc.scene.id)) continue;
    if (String(dominio.ownerActorId) === String(targetTokenDoc.actor?.id)) continue;

    if (!isTokenInsideDominio(targetTokenDoc, dominio)) continue;
    await _applyAmbientalEffectToToken({ dominioOwnerActor: ownerActor, dominio, targetTokenDoc });
  }
}

async function deleteDominioWalls(scene, wallIds = []) {
  if (!game.user?.isGM) return;
  if (!scene) return;

  const ids = Array.from(new Set((wallIds || [])
    .map(w => (typeof w === 'string' ? w : w?.id))
    .filter(Boolean)
    .map(String)));
  if (!ids.length) return;

  // Evita erro do Foundry ao tentar deletar IDs que já não existem na cena.
  const wallCollection = scene.walls;
  const existingIds = (wallCollection?.has && typeof wallCollection.has === 'function')
    ? ids.filter(id => wallCollection.has(id))
    : ids;
  if (!existingIds.length) return;

  try {
    if (typeof scene.deleteEmbeddedDocuments === 'function') await scene.deleteEmbeddedDocuments('Wall', existingIds);
    else if (typeof scene.deleteEmbeddedEntity === 'function') await scene.deleteEmbeddedEntity('Wall', existingIds);
  } catch (e) {
    // Se mesmo assim falhar (ex.: race condition), tenta mais uma vez filtrando de novo.
    try {
      const retryIds = (wallCollection?.has && typeof wallCollection.has === 'function')
        ? existingIds.filter(id => wallCollection.has(id))
        : existingIds;
      if (!retryIds.length) return;
      if (typeof scene.deleteEmbeddedDocuments === 'function') await scene.deleteEmbeddedDocuments('Wall', retryIds);
      else if (typeof scene.deleteEmbeddedEntity === 'function') await scene.deleteEmbeddedEntity('Wall', retryIds);
    } catch (e2) {
      console.warn('Falha ao deletar walls do domínio:', e2);
    }
  }
}

async function endDominio(actor, { reason = 'ended', applyBurnout = true } = {}) {
  const dominio = getActiveDominio(actor);
  if (!dominio) return;

  const sceneId = dominio.sceneId;
  const scene = sceneId ? (game.scenes?.get?.(sceneId) ?? null) : (canvas?.scene ?? null);
  await deleteDominioWalls(scene, dominio.wallIds);

  // Remove efeito
  const existing = actor.effects?.find?.(e => e?.flags?.[SYSTEM_ID]?.dominio?.effect) ?? null;
  if (existing) {
    try { await actor.deleteEmbeddedDocuments('ActiveEffect', [existing.id]); } catch (_) { /* ignore */ }
  }

  await clearActiveDominio(actor);

  // Burnout (bloqueia novas expansões por um tempo)
  if (applyBurnout) {
    const combat = game.combat;
    const round = Number(combat?.round ?? 0) || 0;
    const tipo = String(dominio.tipo || 'completa');
    const dur = Number(DEFAULT_BURNOUT_ROUNDS[tipo] ?? DEFAULT_BURNOUT_ROUNDS.completa) || 0;
    if (dur > 0 && combat) {
      await setBurnout(actor, { untilRound: round + dur, tipo, reason });
    }
  }
}

async function maybeExpireDominioOnCombatUpdate(combat, changed) {
  if (!combat || !changed) return;

  // Expira no avanço de rodada
  if (!Object.prototype.hasOwnProperty.call(changed, 'round')) return;
  const round = Number(combat.round ?? 0) || 0;

  for (const token of (canvas?.tokens?.placeables ?? [])) {
    const actor = token?.actor;
    if (!actor) continue;

    // Limpa burnout vencido
    const burnout = getBurnout(actor);
    if (burnout?.untilRound != null) {
      const until = Number(burnout.untilRound ?? 0) || 0;
      if (until > 0 && round >= until) await clearBurnout(actor);
    }

    const dominio = getActiveDominio(actor);
    if (!dominio) continue;
    if (dominio.sceneId && (combat.scene?.id || combat.scene) && String(dominio.sceneId) !== String(combat.scene?.id ?? combat.scene)) continue;

    const endsAt = Number(dominio.endsAtRound ?? 0) || 0;
    if (endsAt > 0 && round >= endsAt) {
      await endDominio(actor, { reason: 'expired' });
      try {
        await ChatMessage.create({ content: `<div><strong>${actor.name}</strong>: Expansão de Domínio terminou.</div>` });
      } catch (_) { /* ignore */ }
    } else {
      await refreshDominioForActor(actor);
    }
  }
}

function _circleOverlap(aCenter, aR, bCenter, bR) {
  const dx = (aCenter?.x ?? 0) - (bCenter?.x ?? 0);
  const dy = (aCenter?.y ?? 0) - (bCenter?.y ?? 0);
  const dist2 = dx * dx + dy * dy;
  const r = (Number(aR ?? 0) || 0) + (Number(bR ?? 0) || 0);
  return dist2 <= (r * r);
}

async function _rollConfronto(actor, label) {
  // Este era o fluxo antigo (por dados). Se isso aparecer no console,
  // algum trecho ainda está chamando o confronto antigo por engano.
  try {
    console.warn(`[${SYSTEM_ID}] ATENÇÃO: _rollConfronto (DADOS) foi chamado`, {
      actor: actor?.name,
      actorId: actor?.id,
      label,
      user: game.user?.name,
      userId: game.user?.id,
      isGM: !!game.user?.isGM,
    });
  } catch (_) { /* ignore */ }

  const feit = Number(actor?.system?.pericias?.feiticaria?.value ?? 0) || 0;
  const bt = Number(actor?.system?.detalhes?.treinamento?.value ?? 0) || 0;
  const totalMod = feit + bt;
  const formula = `1d20 + ${totalMod}`;
  const { rollFormula } = await import('./rolls.mjs');
  const roll = await rollFormula(formula, { actor }, { asyncEval: true, toMessage: true, flavor: `<b>Confrontação de Domínio</b> — ${label}` });
  return roll?.total ?? 0;
}

async function resolveDominioClashIfAny(newActor, newDominio) {
  if (!canvas?.tokens?.placeables?.length) return;

  for (const token of canvas.tokens.placeables) {
    const otherActor = token?.actor;
    if (!otherActor || otherActor.id === newActor.id) continue;
    const otherDom = getActiveDominio(otherActor);
    if (!otherDom) continue;
    if (otherDom.sceneId && newDominio.sceneId && String(otherDom.sceneId) !== String(newDominio.sceneId)) continue;

    const overlaps = _circleOverlap(newDominio.center, newDominio.radiusPixels, otherDom.center, otherDom.radiusPixels);
    if (!overlaps) continue;

    // Marca clash
    newDominio.clash = true;
    otherDom.clash = true;
    await setActiveDominio(newActor, newDominio);
    await setActiveDominio(otherActor, otherDom);

    // NOVO: em vez de rolar dados (confronto antigo), dispara a Batalha de Domínio (skillcheck).
    // Observação: overlap não garante que o token esteja "dentro" do outro domínio; o fluxo novo trata isso.
    try {
      console.warn(`[${SYSTEM_ID}] dominio overlap: acionando Batalha de Domínio (skillcheck)`, {
        ownerActorId: String(otherActor.id),
        challengerActorId: String(newActor.id),
        sceneId: canvas?.scene?.id ?? null,
        user: game.user?.name,
        userId: game.user?.id,
        isGM: !!game.user?.isGM,
      });
    } catch (_) { /* ignore */ }

    try {
      await ChatMessage.create({ content: `<div><strong>Choque de Domínios!</strong> ${newActor.name} entrou em confronto com ${otherActor.name} (Batalha de Domínio).</div>` });
    } catch (_) { /* ignore */ }

    try {
      const { requestStartDominioClash } = await import('./dominio-clash.mjs');
      await requestStartDominioClash({
        ownerActorId: otherActor.id,
        challengerActorId: newActor.id,
        challengerTokenId: newDominio?.tokenId ?? null,
        source: 'overlap',
      });
    } catch (e) {
      console.warn(`[${SYSTEM_ID}] dominio overlap: falha ao iniciar Batalha de Domínio (skillcheck)`, e);
    }
    return;
  }
}

async function activateDominio(actor, tokenDoc, { tipo, acertoGarantido, center, radiusPixels, radiusMeters, squares, wallIds, dominioItemUuid, config } = {}) {
  if (!actor || !tokenDoc) throw new Error('Ator/token inválidos');

  // Se já existe, remove antes
  await endDominio(actor, { reason: 'replaced', applyBurnout: false });

  const combat = game.combat;
  const round = Number(combat?.round ?? 0) || 0;
  const durationRounds = combat ? computeDominioDurationRounds(actor, tipo) : 0;
  const endsAtRound = combat ? (round + durationRounds) : 0;

  const tipoNorm = String(tipo || 'completa');
  const cfg = _normalizeDominioConfig(config ?? {});
  const hpMax = (tipoNorm === 'sem_barreiras') ? 0 : _computeDominioBarreiraHpMax(actor);

  const dominioData = {
    tipo: tipoNorm,
    acertoGarantido: Boolean(acertoGarantido),
    ownerActorId: actor.id,
    dominioItemUuid: dominioItemUuid ?? null,
    config: cfg,
    sceneId: tokenDoc.scene?.id ?? canvas?.scene?.id ?? null,
    tokenId: tokenDoc.id,
    center,
    radiusPixels,
    radiusMeters,
    squares,
    startedAtRound: combat ? round : null,
    durationRounds: combat ? durationRounds : null,
    endsAtRound: combat ? endsAtRound : null,
    wallIds: (wallIds || []).map(w => (typeof w === 'string' ? w : w?.id)).filter(Boolean),
    hpBarreira: { value: hpMax, max: hpMax },
    clash: false,
  };

  await setActiveDominio(actor, dominioData);
  await refreshDominioForActor(actor);

  // Confronto se encostar em outro domínio
  await resolveDominioClashIfAny(actor, dominioData);

  return dominioData;
}

function registerDominioHooks() {
  Hooks.on('updateToken', async (tokenDoc, changed, opts, userId) => {
    try {
      if (!tokenDoc?.actor) return;
      if (!('x' in (changed || {})) && !('y' in (changed || {}))) return;
      await refreshDominioForActor(tokenDoc.actor);
    } catch (_) { /* ignore */ }
  });

  Hooks.on('updateCombat', async (combat, changed, options, userId) => {
    try { await maybeExpireDominioOnCombatUpdate(combat, changed); } catch (e) { console.warn('Dominio: falha no updateCombat(expire)', e); }
    try { await maybeApplyDominioAmbientalOnCombatUpdate(combat, changed); } catch (e) { console.warn('Dominio: falha no updateCombat(ambiental)', e); }
  });
}

export {
  SYSTEM_ID,
  FLAG_ACTIVE,
  FLAG_BURNOUT,
  getActiveDominio,
  getBurnout,
  actorHasAntiDominio,
  isSureHitActiveForActor,
  isTokenInsideDominio,
  getSureHitTargetsForAttack,
  isSureHitApplicableToTarget,
  computePeCostWithDominio,
  refreshDominioForActor,
  activateDominio,
  endDominio,
  registerDominioHooks,
};
