function _systemId() {
  return game?.system?.id ?? 'feiticeiros-e-maldicoes';
}

function _norm(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function _getActorFromItem(item) {
  const parent = item?.parent;
  if (!parent) return null;
  if (parent.documentName === 'Actor') return parent;
  return null;
}

function _isPassivoDote(item) {
  if (!item || item.type !== 'dote') return false;
  const acao = _norm(item.system?.acao?.value ?? item.system?.acao ?? '');
  if (acao !== 'passiva') return false;

  // Se existir toggle de equipado/ativo, respeite. Caso não exista, assume ativo.
  const equipadoRaw = item.system?.equipado;
  const equipado = (equipadoRaw && typeof equipadoRaw === 'object' && 'value' in equipadoRaw)
    ? !!equipadoRaw.value
    : (typeof equipadoRaw === 'boolean' ? equipadoRaw : true);

  return equipado;
}

function _parseTextEffectToChanges(text) {
  const t = String(text ?? '').trim();
  if (!t) return [];

  const lines = t
    .split(/\r?\n|;/g)
    .map(s => s.trim())
    .filter(Boolean);

  const changes = [];

  for (const line of lines) {
    const ln = _norm(line);

    // atencao base
    // aceitamos: "atencao base 12" | "atencaoBase=12" | "atencao_base=12"
    const baseMatch = ln.match(/\batencao\s*base\s*(=|:)??\s*(\d+)\b/) || ln.match(/\batencaobase\s*(=|:)\s*(\d+)\b/);
    if (baseMatch) {
      const v = Number(baseMatch[2] ?? baseMatch[1]);
      if (Number.isFinite(v)) {
        changes.push({ key: 'system.percepcao.atencaoBase', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: String(v), priority: 30 });
        continue;
      }
    }

    // +N iniciativa / atencao / percepcao / defesa
    const addMatch = ln.match(/^([+-]?\d+)\s*(iniciativa|atencao|percepcao|defesa)\b/);
    if (addMatch) {
      const n = Number(addMatch[1] ?? 0) || 0;
      const what = addMatch[2];
      if (what === 'iniciativa') {
        changes.push({ key: 'system.combate.iniciativa.outrosBonus', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 });
      } else if (what === 'atencao') {
        changes.push({ key: 'system.percepcao.atencaoBonus', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 });
      } else if (what === 'percepcao') {
        changes.push({ key: 'system.pericias.percepcao.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 });
      } else if (what === 'defesa') {
        changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 });
      }
      continue;
    }

    // +N movimento (metros)
    const movMatch = ln.match(/^([+-]?\d+(?:\.\d+)?)\s*(m|metro|metros)?\s*(movimento|deslocamento)\b/);
    if (movMatch) {
      const v = Number(movMatch[1] ?? 0) || 0;
      changes.push({ key: 'system.combate.movimento.bonusAdHoc', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(v), priority: 20 });
      continue;
    }

    // fallback: não entendeu, ignora
  }

  return changes;
}

function _buildEffectDataFromItemEffects(item) {
  const systemId = _systemId();
  const itemEffects = item.effects?.contents ?? [];
  if (!itemEffects.length) return [];

  return itemEffects.map((e) => {
    const data = e.toObject();
    delete data._id;
    data.origin = item.uuid;
    data.disabled = false;
    data.flags = foundry.utils.mergeObject(data.flags ?? {}, {
      [systemId]: {
        passiveDoteEffect: true,
        sourceDoteItemId: item.id,
      }
    });
    return data;
  });
}

function _buildEffectDataFromText(item) {
  const systemId = _systemId();
  const text = item.system?.efeito?.value ?? item.system?.efeito ?? '';
  const changesJson = item.system?.changesJson?.value ?? item.system?.changesJson ?? '';

  let changes = [];
  if (String(changesJson || '').trim()) {
    try {
      const parsed = JSON.parse(String(changesJson));
      if (Array.isArray(parsed)) changes = parsed;
    } catch (e) {
      console.warn('Dote changesJson inválido (JSON):', item?.name, e);
    }
  }

  if (!changes.length) changes = _parseTextEffectToChanges(text);
  if (!changes.length) return [];

  return [
    {
      label: `${item.name} (Dote)`,
      icon: item.img || 'icons/svg/aura.svg',
      origin: item.uuid,
      disabled: false,
      changes,
      flags: {
        [systemId]: {
          passiveDoteEffect: true,
          sourceDoteItemId: item.id,
        }
      }
    }
  ];
}

function _collectEffectData(item) {
  const fromEmbedded = _buildEffectDataFromItemEffects(item);
  if (fromEmbedded.length) return fromEmbedded;
  return _buildEffectDataFromText(item);
}

export async function syncPassiveDoteEffectsForActor(actor, { quiet = true } = {}) {
  if (!actor) return { created: 0, deleted: 0 };
  if (!actor.isOwner) return { created: 0, deleted: 0 };

  const systemId = _systemId();

  const passiveItems = (actor.items?.contents ?? []).filter(_isPassivoDote);
  const passiveUuids = new Set(passiveItems.map(i => i.uuid));

  // 1) cleanup: remove efeitos órfãos
  const orphan = (actor.effects?.contents ?? []).filter(e => {
    if (!e) return false;
    const flagged = Boolean(e.getFlag(systemId, 'passiveDoteEffect'));
    if (!flagged) return false;
    const origin = e.origin;
    return origin && !passiveUuids.has(origin);
  });

  if (orphan.length) {
    try {
      await actor.deleteEmbeddedDocuments('ActiveEffect', orphan.map(e => e.id));
    } catch (e) {
      console.warn('Falha ao limpar efeitos órfãos de dotes passivos:', e);
    }
  }

  // 2) apply missing
  const existingByOrigin = new Set(
    (actor.effects?.contents ?? [])
      .filter(e => Boolean(e?.origin) && Boolean(e?.getFlag?.(systemId, 'passiveDoteEffect')))
      .map(e => e.origin)
  );

  let created = 0;
  for (const item of passiveItems) {
    const effectData = _collectEffectData(item);
    if (!effectData.length) continue;

    // já existe ao menos 1 efeito? trata como sincronizado
    if (existingByOrigin.has(item.uuid)) continue;

    try {
      await actor.createEmbeddedDocuments('ActiveEffect', effectData);
      created += effectData.length;
    } catch (e) {
      console.warn('Falha ao aplicar efeitos automáticos de dote passivo:', item?.name, e);
    }
  }

  if (!quiet && (created || orphan.length)) {
    ui?.notifications?.info?.(`Dotes passivos: ${created} efeitos aplicados, ${orphan.length} órfãos removidos.`);
  }

  return { created, deleted: orphan.length };
}

export async function removePassiveDoteEffectsForItem(item) {
  const actor = _getActorFromItem(item);
  if (!actor || !actor.isOwner) return { deleted: 0 };

  const systemId = _systemId();
  const toDelete = (actor.effects?.contents ?? []).filter(e => {
    if (!e) return false;
    if (e.origin !== item.uuid) return false;
    return Boolean(e.getFlag(systemId, 'passiveDoteEffect'));
  });

  if (!toDelete.length) return { deleted: 0 };

  try {
    await actor.deleteEmbeddedDocuments('ActiveEffect', toDelete.map(e => e.id));
    return { deleted: toDelete.length };
  } catch (e) {
    console.warn('Falha ao remover efeitos de dote passivo ao deletar item:', e);
    return { deleted: 0 };
  }
}

export async function handleDotePassivoUpdate(item) {
  const actor = _getActorFromItem(item);
  if (!actor) return;

  if (_isPassivoDote(item)) {
    await syncPassiveDoteEffectsForActor(actor);
  } else {
    await removePassiveDoteEffectsForItem(item);
  }
}
