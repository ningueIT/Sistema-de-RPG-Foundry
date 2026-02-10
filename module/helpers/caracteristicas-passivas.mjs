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

function _isActiveCaracteristica(item) {
  if (!item || item.type !== 'caracteristica') return false;

  const equipadoRaw = item.system?.equipado;
  const equipado = (equipadoRaw && typeof equipadoRaw === 'object' && 'value' in equipadoRaw)
    ? !!equipadoRaw.value
    : (typeof equipadoRaw === 'boolean' ? equipadoRaw : true);

  return equipado;
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
        passiveCaracteristicaEffect: true,
        sourceCaracteristicaItemId: item.id,
      }
    });
    return data;
  });
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

    // rd <tipo> <valor>
    const rdMatch = ln.match(/^rd\s+([a-z0-9_\-]+)\s+([+-]?\d+)\b/);
    if (rdMatch) {
      const damageType = rdMatch[1];
      const v = Number(rdMatch[2] ?? 0) || 0;
      changes.push({
        key: `system.combate.rd.byType.${damageType}`,
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: String(v),
        priority: 20,
      });
      continue;
    }

    // imunidade <tipo>
    const imMatch = ln.match(/^imunidade\s+([a-z0-9_\-]+)\b/);
    if (imMatch) {
      const damageType = imMatch[1];
      changes.push({
        key: `system.combate.imunidades.byType.${damageType}`,
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: 'true',
        priority: 30,
      });
      continue;
    }

    // vulnerabilidade <tipo> x2
    const vulMatch = ln.match(/^vulnerabilidade\s+([a-z0-9_\-]+)(?:\s*x\s*([0-9]+(?:\.[0-9]+)?))?\b/);
    if (vulMatch) {
      const damageType = vulMatch[1];
      const mult = Number(vulMatch[2] ?? 2) || 2;
      changes.push({
        key: `system.combate.vulnerabilidades.byType.${damageType}`,
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: String(mult),
        priority: 30,
      });
      continue;
    }
  }

  return changes;
}

function _buildChangesFromSchema(item) {
  const categoria = String(item.system?.categoria?.value ?? item.system?.categoria ?? 'caracteristica');
  const tipo = String(item.system?.danoTipo?.value ?? item.system?.danoTipo ?? '').trim();

  if (!tipo) return [];

  if (categoria === 'resistencia') {
    const v = Number(item.system?.valor?.value ?? item.system?.valor ?? 0) || 0;
    if (!v) return [];
    return [{
      key: `system.combate.rd.byType.${tipo}`,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: String(v),
      priority: 20,
    }];
  }

  if (categoria === 'imunidade') {
    return [{
      key: `system.combate.imunidades.byType.${tipo}`,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: 'true',
      priority: 30,
    }];
  }

  if (categoria === 'vulnerabilidade') {
    const mult = Number(item.system?.multiplicador?.value ?? item.system?.multiplicador ?? 2) || 2;
    return [{
      key: `system.combate.vulnerabilidades.byType.${tipo}`,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: String(mult),
      priority: 30,
    }];
  }

  return [];
}

function _buildEffectDataFromTextOrSchema(item) {
  const systemId = _systemId();
  const changesJson = item.system?.changesJson?.value ?? item.system?.changesJson ?? '';

  let changes = [];
  if (String(changesJson || '').trim()) {
    try {
      const parsed = JSON.parse(String(changesJson));
      if (Array.isArray(parsed)) changes = parsed;
    } catch (e) {
      console.warn('Caracteristica changesJson inválido (JSON):', item?.name, e);
    }
  }

  if (!changes.length) changes = _buildChangesFromSchema(item);

  if (!changes.length) {
    const text = item.system?.efeito?.value ?? item.system?.efeito ?? '';
    changes = _parseTextEffectToChanges(text);
  }

  if (!changes.length) return [];

  return [
    {
      label: `${item.name} (Característica)`,
      icon: item.img || 'icons/svg/aura.svg',
      origin: item.uuid,
      disabled: false,
      changes,
      flags: {
        [systemId]: {
          passiveCaracteristicaEffect: true,
          sourceCaracteristicaItemId: item.id,
        }
      }
    }
  ];
}

function _collectEffectData(item) {
  const fromEmbedded = _buildEffectDataFromItemEffects(item);
  if (fromEmbedded.length) return fromEmbedded;
  return _buildEffectDataFromTextOrSchema(item);
}

export async function syncPassiveCaracteristicaEffectsForActor(actor, { quiet = true } = {}) {
  if (!actor) return { created: 0, deleted: 0 };
  if (!actor.isOwner) return { created: 0, deleted: 0 };

  const systemId = _systemId();

  const activeItems = (actor.items?.contents ?? []).filter(_isActiveCaracteristica);
  const activeUuids = new Set(activeItems.map(i => i.uuid));

  // 1) cleanup: remove efeitos órfãos
  const orphan = (actor.effects?.contents ?? []).filter(e => {
    if (!e) return false;
    const flagged = Boolean(e.getFlag(systemId, 'passiveCaracteristicaEffect'));
    if (!flagged) return false;
    const origin = e.origin;
    return origin && !activeUuids.has(origin);
  });

  if (orphan.length) {
    try {
      await actor.deleteEmbeddedDocuments('ActiveEffect', orphan.map(e => e.id));
    } catch (e) {
      console.warn('Falha ao limpar efeitos órfãos de características passivas:', e);
    }
  }

  // 2) apply missing
  const existingByOrigin = new Set(
    (actor.effects?.contents ?? [])
      .filter(e => Boolean(e?.origin) && Boolean(e?.getFlag?.(systemId, 'passiveCaracteristicaEffect')))
      .map(e => e.origin)
  );

  let created = 0;
  for (const item of activeItems) {
    const effectData = _collectEffectData(item);
    if (!effectData.length) continue;

    if (existingByOrigin.has(item.uuid)) continue;

    try {
      await actor.createEmbeddedDocuments('ActiveEffect', effectData);
      created += effectData.length;
    } catch (e) {
      console.warn('Falha ao aplicar efeitos automáticos de característica:', item?.name, e);
    }
  }

  if (!quiet && (created || orphan.length)) {
    ui?.notifications?.info?.(`Características: ${created} efeitos aplicados, ${orphan.length} órfãos removidos.`);
  }

  return { created, deleted: orphan.length };
}

export async function removePassiveCaracteristicaEffectsForItem(item) {
  const actor = _getActorFromItem(item);
  if (!actor || !actor.isOwner) return { deleted: 0 };

  const systemId = _systemId();
  const toDelete = (actor.effects?.contents ?? []).filter(e => {
    if (!e) return false;
    if (e.origin !== item.uuid) return false;
    return Boolean(e.getFlag(systemId, 'passiveCaracteristicaEffect'));
  });

  if (!toDelete.length) return { deleted: 0 };

  try {
    await actor.deleteEmbeddedDocuments('ActiveEffect', toDelete.map(e => e.id));
    return { deleted: toDelete.length };
  } catch (e) {
    console.warn('Falha ao remover efeitos de característica ao deletar item:', e);
    return { deleted: 0 };
  }
}

export async function handleCaracteristicaPassivaUpdate(item) {
  const actor = _getActorFromItem(item);
  if (!actor) return;

  if (_isActiveCaracteristica(item)) {
    await syncPassiveCaracteristicaEffectsForActor(actor);
  } else {
    await removePassiveCaracteristicaEffectsForItem(item);
  }
}
