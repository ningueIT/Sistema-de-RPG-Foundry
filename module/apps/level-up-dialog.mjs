export default class LevelUpDialog extends FormApplication {

  /**
   * @param {Actor} actor
   * @param {Item} classItem
   */
  constructor(actor, classItem, options = {}) {
    super(actor, options);
    this.actor = actor;
    this.classItem = classItem;

    // Staging area state
    this.selectedFeatures = [];
    this.selectedAptitudes = [];

    // next level to apply (assume classItem.system.level exists)
    this.nextLevel = Number(this.classItem?.system?.level ?? 0) + 1;
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['feiticeiros-e-maldicoes', 'level-up'],
      template: 'systems/feiticeiros-e-maldicoes/templates/apps/level-up.hbs',
      width: 600,
      height: 'auto',
      dragDrop: [{ dragSelector: null, dropSelector: '.drop-zone' }],
      closeOnSubmit: true
    });
  }

  get title() {
    const name = this.classItem?.name ?? 'Level Up';
    return `Ascensão — ${name} → Nível ${this.nextLevel}`;
  }

  /**
   * Prepare data for the template
   */
  async getData(options = {}) {
    const data = await super.getData(options);

    if (!this.classItem) return { ...data, error: 'Missing class item' };

    // Prefer the data-model helper if available
    let progression = {};
    try {
      progression = (typeof this.classItem.system?.getProgressionAt === 'function')
        ? this.classItem.system.getProgressionAt(this.nextLevel)
        : (this.classItem.system?.progression?.[String(this.nextLevel)] ?? {});
    } catch (e) {
      progression = this.classItem.system?.progression?.[String(this.nextLevel)] ?? {};
    }

    const hpGain = Number(this.classItem?.system?.hp?.perLevel ?? 0);
    const epGain = Number(this.classItem?.system?.ep?.perLevel ?? 0);

    const featureCount = Number(progression?.features ?? 0);
    const aptitudeCount = Number(progression?.aptitudes ?? 0);

    // Build slot arrays padded with existing selections or nulls
    const featureSlots = Array.from({ length: Math.max(0, featureCount) }, (_, i) => this.selectedFeatures[i] ?? null);
    const aptitudeSlots = Array.from({ length: Math.max(0, aptitudeCount) }, (_, i) => this.selectedAptitudes[i] ?? null);

    return {
      ...data,
      actor: this.actor,
      classItem: this.classItem,
      nextLevel: this.nextLevel,
      hpGain,
      epGain,
      featureSlots,
      aptitudeSlots,
      progression
    };
  }

  /* -------------------------------------------- */
  /* Drag & Drop handling (staging area) */

  async _onDrop(event) {
    event.preventDefault();

    // Extract drag data (supports both TextEditor helper and raw data)
    let dragData = {};
    try {
      dragData = TextEditor.getDragEventData(event);
    } catch (e) {
      // fallback to older approach
      const raw = event.dataTransfer?.getData('text/plain') || event.dataTransfer?.getData('text');
      try { dragData = JSON.parse(raw); } catch (_) { dragData = { uuid: raw }; }
    }

    const uuid = dragData?.uuid || dragData?.id || dragData;
    if (!uuid) return ui.notifications?.warn?.('Dados inválidos no arraste.');

    let doc = null;
    try {
      doc = await fromUuid(uuid);
    } catch (err) {
      console.error('Erro ao carregar UUID arrastado:', err);
      return ui.notifications?.warn?.('Não foi possível carregar o item arrastado.');
    }

    const item = (doc instanceof Item) ? doc : (doc?.object ?? doc);
    if (!item) return ui.notifications?.warn?.('O item arrastado não é um Item.');

    // Find drop target element with data-type and data-index
    const dropEl = event.target.closest('[data-type][data-index]') || event.target.closest('.drop-zone');
    if (!dropEl) return ui.notifications?.warn?.('Drop fora de uma área válida.');

    const slotType = dropEl.dataset.type; // 'feature' | 'aptitude'
    const slotIndex = Number(dropEl.dataset.index ?? -1);
    if (!slotType || slotIndex < 0) return ui.notifications?.warn?.('Slot alvo inválido.');

    // Validate types
    if (slotType === 'feature' && item.type !== 'feature') {
      return ui.notifications?.warn?.('Este slot aceita somente Habilidades (feature).');
    }
    if (slotType === 'aptitude' && item.type !== 'aptitude') {
      return ui.notifications?.warn?.('Este slot aceita somente Aptidões (aptitude).');
    }

    // Store a clone (object) of the item in the staging arrays
    try {
      const obj = item.toObject ? item.toObject() : duplicate(item);
      if (slotType === 'feature') this.selectedFeatures[slotIndex] = obj;
      else this.selectedAptitudes[slotIndex] = obj;
    } catch (e) {
      console.warn('Falha ao clonar item arrastado, armazenando fallback:', e);
      const fallback = { name: item.name ?? 'Item', type: item.type ?? 'item', img: item.img ?? '', system: item.system ?? {} };
      if (slotType === 'feature') this.selectedFeatures[slotIndex] = fallback;
      else this.selectedAptitudes[slotIndex] = fallback;
    }

    this.render();
  }

  /* -------------------------------------------- */

  /**
   * Ao confirmar o formulário: aplicar alterações no Ator e criar itens selecionados
   */
  async _updateObject(event, formData) {
    // Determine gains from the class item
    const hpGain = Number(this.classItem?.system?.hp?.perLevel ?? 0);
    const epGain = Number(this.classItem?.system?.ep?.perLevel ?? 0);

    const updates = {};

    // Update actor HP (system.recursos.hp.value / max)
    try {
      const sys = this.actor.system ?? {};
      const curHpMax = Number(sys.recursos?.hp?.max ?? 0);
      const curHpVal = Number(sys.recursos?.hp?.value ?? curHpMax);
      updates['system.recursos.hp.max'] = curHpMax + hpGain;
      updates['system.recursos.hp.value'] = curHpVal + hpGain;

      const curEpMax = Number(sys.recursos?.energia?.max ?? 0);
      const curEpVal = Number(sys.recursos?.energia?.value ?? curEpMax);
      updates['system.recursos.energia.max'] = curEpMax + epGain;
      updates['system.recursos.energia.value'] = curEpVal + epGain;
    } catch (e) {
      console.warn('Falha ao calcular updates de recursos do ator:', e);
    }

    // Prepare class item update (increment level)
    const classUpdate = { 'system.level': Number(this.classItem?.system?.level ?? 0) + 1 };

    // Prepare items to create on actor from selected arrays
    const toCreate = [];
    for (const sel of (this.selectedFeatures ?? [])) if (sel) {
      const copy = duplicate(sel);
      delete copy._id; delete copy.id;
      toCreate.push(copy);
    }
    for (const sel of (this.selectedAptitudes ?? [])) if (sel) {
      const copy = duplicate(sel);
      delete copy._id; delete copy.id;
      toCreate.push(copy);
    }

    // Execute operations
    const promises = [];
    try {
      if (Object.keys(updates).length) promises.push(this.actor.update(updates));
      if (this.classItem && typeof this.classItem.update === 'function') promises.push(this.classItem.update(classUpdate));
      if (toCreate.length) promises.push(this.actor.createEmbeddedDocuments('Item', toCreate));

      const results = await Promise.all(promises);
      ui.notifications?.info?.('Subida de nível aplicada com sucesso.');
    } catch (e) {
      console.error('Erro ao aplicar subida de nível:', e);
      ui.notifications?.error?.('Falha ao aplicar subida de nível. Veja o console para mais detalhes.');
      throw e;
    }

    // Reset staging
    this.selectedFeatures = [];
    this.selectedAptitudes = [];
    this.render();
  }

}
