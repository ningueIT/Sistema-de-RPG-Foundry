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
    // Use a single sheet for all item types to avoid missing-template errors.
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

    // Adding a pointer to CONFIG.BOILERPLATE
    context.config = CONFIG.BOILERPLATE;

    // Prepare active effects for easier access
    context.effects = prepareActiveEffectCategories(this.item.effects);

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

    // Active Effect management
    html.on('click', '.effect-control', (ev) =>
      onManageActiveEffect(ev, this.item)
    );
  }
}
