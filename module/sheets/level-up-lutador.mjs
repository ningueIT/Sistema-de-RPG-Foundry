export default class LevelUpWizard extends FormApplication {
  constructor(actor, options = {}) {
    super(actor, options);
    this.actor = actor;
    this.itemsToCreate = {}; // map slotId -> item data (cloned)
    this._initialData = options.initialData || {};
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["level-up-dialog", "sheet", "window-app"],
      template: "templates/actor/level-up.hbs",
      width: 600,
      dragDrop: [{ dropSelector: ".level-slot" }],
      closeOnSubmit: true,
    });
  }

  get title() {
    return this._initialData?.title || "Ascensão de Grau";
  }

  _buildSlots() {
    // Exemplo: montar slots dinamicamente conforme necessidade do sistema
    return [
      { id: "habilidade_slot_1", label: "Escolha 1", validTypes: ["habilidade"], description: "Arraste uma Habilidade aqui" },
      { id: "habilidade_slot_2", label: "Escolha 2", validTypes: ["habilidade"], description: "Arraste uma Habilidade aqui" }
    ];
  }

  async getData(options = {}) {
    const data = await super.getData(options);
    const slots = this._buildSlots();
    const slotsWithState = slots.map(s => ({
      ...s,
      filled: this.itemsToCreate[s.id] || null
    }));
    return {
      ...data,
      actor: this.actor,
      slots: slotsWithState,
      initial: this._initialData || {}
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.slot-remove').click(this._onSlotRemove.bind(this));
    html.find('.slot-create-blank').click(this._onSlotCreateBlank.bind(this));
  }

  async _onSlotRemove(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const slotEl = btn.closest('[data-slot-id]');
    if (!slotEl) return;
    const slotId = slotEl.dataset.slotId;
    delete this.itemsToCreate[slotId];
    this.render();
  }

  async _onSlotCreateBlank(event) {
    event.preventDefault();
    const btn = event.currentTarget;
    const slotEl = btn.closest('[data-slot-id]');
    if (!slotEl) return;
    const slotId = slotEl.dataset.slotId;
    // Cria um item mínimo em branco no ator (opcional): aqui apenas marca um placeholder local
    const placeholder = {
      name: "Nova Habilidade (pré-criada)",
      type: "habilidade",
      img: "icons/svg/item-bag.svg",
      system: {}
    };
    this.itemsToCreate[slotId] = placeholder;
    this.render();
  }

  async _onDrop(event) {
    event.preventDefault();
    const raw = event.dataTransfer?.getData('text/plain') || event.dataTransfer?.getData('text');
    if (!raw) return;
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      parsed = { uuid: raw };
    }
    const uuid = parsed?.uuid || parsed?.id || parsed;
    if (!uuid) return ui.notifications.warn("Dados inválidos para arraste.");

    // Carrega o documento via fromUuid
    let doc = null;
    try {
      doc = await fromUuid(uuid);
    } catch (err) {
      console.error("Erro ao carregar UUID:", err);
    }
    if (!doc) return ui.notifications.warn("Não foi possível carregar o item arrastado.");

    // Se for um EmbeddedDocument (Item), garantir a referência correta
    const item = doc instanceof Item ? doc : (doc.object ?? doc);
    if (!item) return ui.notifications.warn("O item arrastado não é válido.");

    // Identificar slot alvo
    const slotEl = event.target.closest('[data-slot-id]');
    if (!slotEl) return ui.notifications.warn("Drop fora de um slot válido.");
    const slotId = slotEl.dataset.slotId;

    // Validação básica por tipo
    const slotDef = this._buildSlots().find(s => s.id === slotId);
    if (slotDef?.validTypes && !slotDef.validTypes.includes(item.type)) {
      return ui.notifications.warn("Você deve arrastar uma Habilidade aqui!");
    }

    // Clonar dados do item
    try {
      this.itemsToCreate[slotId] = item.toObject();
    } catch (err) {
      // fallback mínimo
      this.itemsToCreate[slotId] = { name: item.name, type: item.type, img: item.img, system: item.system };
    }

    this.render();
  }

  /** Quando o usuário confirma (submit) */
  async _updateObject(event, formData) {
    // Aplica a escolha de nível (principal / secundario)
    const choice = formData?.choice || this.element.find('input[name="choice"]:checked').val() || 'principal';
    const niveis = this.actor.system.detalhes.niveis || { principal: { value: 0 }, secundario: { value: 0 } };
    if (choice === 'principal') {
      await this.actor.update({ "system.detalhes.niveis.principal.value": (niveis.principal.value || 0) + 1 });
      ui.notifications.info(`Subiu nível de ${this._initialData.classePrincipalNome || 'Classe'}!`);
    } else {
      await this.actor.update({ "system.detalhes.niveis.secundario.value": (niveis.secundario.value || 0) + 1 });
      ui.notifications.info(`Subiu nível de ${this._initialData.multiclasseNome || 'Multiclasse'}!`);
    }

    // Cria os itens selecionados (clonados)
    const toCreate = Object.values(this.itemsToCreate).map(i => {
      const copy = duplicate(i);
      // Remover ids para criar novo
      delete copy._id;
      delete copy.id;
      return copy;
    });
    if (toCreate.length > 0) {
      await this.actor.createEmbeddedDocuments('Item', toCreate);
      ui.notifications.info(`${toCreate.length} item(s) criados na ficha.`);
    }

    // Limpa estado local
    this.itemsToCreate = {};
    this.render();
  }
}
