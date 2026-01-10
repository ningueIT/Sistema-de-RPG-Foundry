/** Helpers para Aptidões: aplicar, reverter, checar prereqs e consumir recursos. */

export async function checkPrereqs(actor, item) {
  // Placeholder: implement parsing de prerequisitos mais tarde.
  const prereq = item.system?.prerequisitos ?? '';
  if (!prereq || prereq.trim().length === 0) return { ok: true };
  // Por enquanto assume ok; retorna mensagem para futura validação
  return { ok: true };
}

export async function consumeCosts(actor, item) {
  const sys = actor.system || {};
  const energia = Number(item.system?.custoPE ?? 0) || 0;
  const dv = Number(item.system?.custoDV ?? 0) || 0;
  const de = Number(item.system?.custoDE ?? 0) || 0;

  const updates = {};
  // Energia
  if (energia > 0 && sys.recursos && sys.recursos.energia) {
    const cur = Number(sys.recursos.energia.value ?? 0);
    const next = Math.max(0, cur - energia);
    updates['system.recursos.energia.value'] = next;
  }
  // DV
  if (dv > 0 && sys.combate && sys.combate.dadosVida) {
    const cur = Number(sys.combate.dadosVida.value ?? 0);
    const next = Math.max(0, cur - dv);
    updates['system.combate.dadosVida.value'] = next;
  }
  // DE
  if (de > 0 && sys.combate && sys.combate.dadosEnergia) {
    const cur = Number(sys.combate.dadosEnergia.value ?? 0);
    const next = Math.max(0, cur - de);
    updates['system.combate.dadosEnergia.value'] = next;
  }

  if (Object.keys(updates).length === 0) return { updated: false };
  await actor.update(updates);
  return { updated: true, updates };
}

export async function activateAptidao(actor, item, { consume = true } = {}) {
  if (!actor || !item) throw new Error('actor and item required');

  const prereq = await checkPrereqs(actor, item);
  if (!prereq.ok) {
    ui.notifications.warn(prereq.message || 'Pré-requisitos não atendidos');
    return { applied: false };
  }

  // Consume resources se solicitado
  if (consume) {
    const canConsume = await hasSufficientResources(actor, item);
    if (!canConsume.ok) {
      ui.notifications.warn(canConsume.message || 'Recursos insuficientes');
      return { applied: false };
    }
    await consumeCosts(actor, item);
  }

  // Aplica efeitos do item ao ator (se houver)
  const effects = (item.effects || []).map((e) => e.toObject());
  let created = [];
  if (effects.length > 0) {
    created = await actor.createEmbeddedDocuments('ActiveEffect', effects);
  }

  // Salva referência nos flags para permitir remoção posterior
  const flagPath = `flags.aptidoes.active.${item.id}`;
  const effectIds = created.map(e => e.id);
  if (effectIds.length) await actor.setFlag('feiticeiros-e-maldicoes', `aptidoes.active.${item.id}`, effectIds);

  // Mensagem no chat
  try {
    const content = `<div class="aptidao-apply"><strong>${actor.name}</strong> ativou <b>${item.name}</b>.</div>`;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });
  } catch (e) { /* ignore */ }

  return { applied: true, effectIds };
}

export async function revertAptidao(actor, item) {
  // Remove efeitos aplicados previamente e limpa flags
  const flagKey = `aptidoes.active.${item.id}`;
  const effectIds = actor.getFlag('feiticeiros-e-maldicoes', flagKey) ?? [];
  if (Array.isArray(effectIds) && effectIds.length > 0) {
    // Apaga efeitos por id
    await actor.deleteEmbeddedDocuments('ActiveEffect', effectIds);
  }
  await actor.unsetFlag('feiticeiros-e-maldicoes', flagKey).catch(()=>{});

  try {
    const content = `<div class="aptidao-revert"><strong>${actor.name}</strong> removeu ${item.name}.</div>`;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });
  } catch (e) { /* ignore */ }

  return { reverted: true };
}

export async function hasSufficientResources(actor, item) {
  const sys = actor.system || {};
  const energia = Number(item.system?.custoPE ?? 0) || 0;
  const dv = Number(item.system?.custoDV ?? 0) || 0;
  const de = Number(item.system?.custoDE ?? 0) || 0;

  if (energia > 0 && (!sys.recursos || !sys.recursos.energia || Number(sys.recursos.energia.value ?? 0) < energia)) {
    return { ok: false, message: 'Energia insuficiente' };
  }
  if (dv > 0 && (!sys.combate || !sys.combate.dadosVida || Number(sys.combate.dadosVida.value ?? 0) < dv)) {
    return { ok: false, message: 'DV insuficientes' };
  }
  if (de > 0 && (!sys.combate || !sys.combate.dadosEnergia || Number(sys.combate.dadosEnergia.value ?? 0) < de)) {
    return { ok: false, message: 'DE insuficientes' };
  }
  return { ok: true };
}
