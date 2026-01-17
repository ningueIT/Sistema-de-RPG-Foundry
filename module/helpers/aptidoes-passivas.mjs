function _systemId() {
  return game?.system?.id ?? 'feiticeiros-e-maldicoes';
}

function _isPassivaAptidao(item) {
  if (!item || item.type !== 'aptidao') return false;
  const acao = String(item.system?.acao?.value ?? item.system?.acao ?? '').toLowerCase().trim();
  return acao === 'passiva';
}

function _getActorFromItem(item) {
  const parent = item?.parent;
  if (!parent) return null;
  // Foundry expõe `parent` como Actor quando é Item embutido.
  if (parent.documentName === 'Actor') return parent;
  return null;
}

export async function syncPassiveAptidaoEffectsForActor(actor, { quiet = true } = {}) {
  if (!actor) return { created: 0, deleted: 0 };
  if (!actor.isOwner) return { created: 0, deleted: 0 };

  const systemId = _systemId();

  const passiveItems = (actor.items?.contents ?? []).filter(_isPassivaAptidao);
  const passiveUuids = new Set(passiveItems.map(i => i.uuid));

  // 1) cleanup: remove efeitos órfãos
  const orphan = (actor.effects?.contents ?? []).filter(e => {
    if (!e) return false;
    const flagged = Boolean(e.getFlag(systemId, 'passiveAptidaoEffect'));
    if (!flagged) return false;
    const origin = e.origin;
    return origin && !passiveUuids.has(origin);
  });

  if (orphan.length) {
    try {
      await actor.deleteEmbeddedDocuments('ActiveEffect', orphan.map(e => e.id));
    } catch (e) {
      console.warn('Falha ao limpar efeitos órfãos de aptidões passivas:', e);
    }
  }

  // 2) apply missing
  const existingByOrigin = new Set(
    (actor.effects?.contents ?? [])
      .filter(e => Boolean(e?.origin) && Boolean(e?.getFlag?.(systemId, 'passiveAptidaoEffect')))
      .map(e => e.origin)
  );

  let created = 0;
  for (const item of passiveItems) {
    const itemEffects = item.effects?.contents ?? [];
    if (!itemEffects.length) continue;

    // Se já existe ao menos 1 efeito do item no ator, consideramos sincronizado.
    if (existingByOrigin.has(item.uuid)) continue;

    const toCreate = itemEffects.map((e) => {
      const data = e.toObject();
      delete data._id;
      data.origin = item.uuid;
      data.disabled = false;
      data.flags = foundry.utils.mergeObject(data.flags ?? {}, {
        [systemId]: {
          passiveAptidaoEffect: true,
          sourceAptidaoItemId: item.id,
        }
      });
      return data;
    });

    if (toCreate.length) {
      try {
        await actor.createEmbeddedDocuments('ActiveEffect', toCreate);
        created += toCreate.length;
      } catch (e) {
        console.warn('Falha ao aplicar efeitos automáticos de aptidão passiva:', item?.name, e);
      }
    }
  }

  if (!quiet && (created || orphan.length)) {
    ui?.notifications?.info?.(`Aptidões passivas: ${created} efeitos aplicados, ${orphan.length} órfãos removidos.`);
  }

  return { created, deleted: orphan.length };
}

export async function removePassiveAptidaoEffectsForItem(item) {
  const actor = _getActorFromItem(item);
  if (!actor || !actor.isOwner) return { deleted: 0 };

  const systemId = _systemId();
  const toDelete = (actor.effects?.contents ?? []).filter(e => {
    if (!e) return false;
    if (e.origin !== item.uuid) return false;
    return Boolean(e.getFlag(systemId, 'passiveAptidaoEffect'));
  });

  if (!toDelete.length) return { deleted: 0 };

  try {
    await actor.deleteEmbeddedDocuments('ActiveEffect', toDelete.map(e => e.id));
    return { deleted: toDelete.length };
  } catch (e) {
    console.warn('Falha ao remover efeitos de aptidão passiva ao deletar item:', e);
    return { deleted: 0 };
  }
}

export async function handleAptidaoPassivaUpdate(item) {
  const actor = _getActorFromItem(item);
  if (!actor) return;

  // Se for passiva, garante efeitos; se não for, remove efeitos passivos ligados.
  if (_isPassivaAptidao(item)) {
    await syncPassiveAptidaoEffectsForActor(actor);
  } else {
    await removePassiveAptidaoEffectsForItem(item);
  }
}
