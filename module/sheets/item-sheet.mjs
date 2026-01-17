import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class BoilerplateItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      // IMPORTANT: keep the system id as a class so our CSS applies.
      classes: ['feiticeiros-e-maldicoes', 'sheet', 'item', 'item-sheet'],
      width: 520,
      height: 480,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'description',
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = 'systems/feiticeiros-e-maldicoes/templates/item';
    // Return a specialized sheet for class items.
    if (this.item?.type === 'class') return `${path}/item-class-sheet.hbs`;

    // Fallback to the generic sheet for other item types.
    return `${path}/item-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = this.document.toObject(false);

    // Enrich item description for display/editors.
    // Our schema uses `system.descricao.value`.
    context.enrichedDescription = await TextEditor.enrichHTML(
      itemData.system?.descricao?.value ?? '',
      {
        secrets: this.document.isOwner,
        async: true,
        rollData: this.item.getRollData(),
        relativeTo: this.item,
      }
    );

    // Add the item's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // If the item belongs to an actor, expose the actor's perícias for the template
    try {
      const actor = this.item.actor;
      const actorPericias = actor?.system?.pericias ?? {};
      context.actorPericiasList = Object.entries(actorPericias).map(([k, v]) => ({ key: k, label: v?.label ?? k }));
    } catch (e) {
      context.actorPericiasList = [];
    }

    // Adding a pointer to the system configuration. Prefer CONFIG.FEITICEIROS when available.
    context.config = CONFIG.FEITICEIROS ?? CONFIG.BOILERPLATE;

    // Prepare active effects for easier access
    context.effects = prepareActiveEffectCategories(this.item.effects);

    // If this is a Class item, prepare a progressionLevels array (1..20)
    if (this.item?.type === 'class' || itemData.type === 'class') {
      const progression = itemData.system?.progression ?? {};
      context.progressionLevels = Array.from({ length: 20 }, (_, i) => {
        const level = i + 1;
        const entry = progression?.[String(level)] ?? {};
        return {
          level,
          features: Number(entry.features ?? 0),
          aptitudes: Number(entry.aptitudes ?? 0),
        };
      });
    }

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    html.on('click', '.jem-sheet-close', (ev) => {
      ev.preventDefault();
      this.close();
    });

    // Roll handlers, click handlers, etc. would go here.
    // Testar Ataque: usa `system.ataque.pericia` (grupo 'ataques') quando disponível
    html.on('click', '.test-attack', async (ev) => {
      ev.preventDefault();
      const item = this.item;
      const actor = item.actor;
      const periciaKey = item.system?.ataque?.pericia?.value;
      try {
        if (periciaKey && actor) {
          const sheet = actor.sheet;
          if (sheet && typeof sheet._rollPericiaByKey === 'function') {
            await sheet._rollPericiaByKey({ key: periciaKey, group: 'ataques' });
            return;
          }
        }
      } catch (e) {
        console.warn('Erro ao rolar perícia via actor.sheet, fallback para item.rollAttack()', e);
      }
      if (typeof item.rollAttack === 'function') await item.rollAttack();
    });

    // Testar Dano: rola dano do item diretamente
    html.on('click', '.test-damage', async (ev) => {
      ev.preventDefault();
      const item = this.item;
      const critMult = Number(item.system?.ataque?.critico?.mult?.value ?? item.system?.ataque?.critico?.mult ?? 2);
      if (typeof item.rollDamage === 'function') await item.rollDamage(false, critMult);
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) =>
      onManageActiveEffect(ev, this.item)
    );
  }
}
