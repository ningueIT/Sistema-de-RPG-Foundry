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
      width: 700,
      // Let the window be resizable and default to a comfortable height
      height: 800,
      resizable: true,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'descricao',
        },
      ],
    });
  }

  /** @override */
  get template() {
    const path = 'systems/feiticeiros-e-maldicoes/templates/item';
    // Return a specialized sheet for class items.
    if (this.item?.type === 'class') return `${path}/item-class-sheet.hbs`;
    if (this.item?.type === 'uniforme') return `${path}/item-uniform-sheet.hbs`;
    if (this.item?.type === 'acao-npc') return `${path}/item-acao-npc-sheet.hbs`;
    if (this.item?.type === 'dote') return `${path}/item-dote-sheet.hbs`;
    if (this.item?.type === 'caracteristica') return `${path}/item-caracteristica-sheet.hbs`;
    if (this.item?.type === 'dominio') return `${path}/item-dominio-sheet.hbs`;

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

    const img = html.find('.profile-img')[0];
    if (img) {
        img.addEventListener('dragstart', (event) => {
          try {
            const itemData = this.item?.toObject(false) ?? { name: this.item?.name ?? 'Item' };
            const payload = JSON.stringify({ type: 'Item', data: itemData });
            event.dataTransfer.setData('text/plain', payload);
            event.dataTransfer.setData('application/json', payload);
            const uuid = img.dataset?.uuid || this.item?.uuid;
            if (uuid) event.dataTransfer.setData('text/uri-list', uuid);
            img.classList.add('dragging');
            window.__FE_UNIFORM_DRAG = itemData;

            const dropHandler = async (ev) => {
              try {
                const target = ev.target;
                const apps = Object.values(ui.windows || {});
                let targetApp = null;
                for (const app of apps) {
                  try {
                    if (app?.element && app.element[0] && app.element[0].contains(target)) {
                      targetApp = app;
                      break;
                    }
                  } catch (e) {}
                }
                if (targetApp && targetApp.document && (targetApp.document.documentName === 'Actor' || targetApp.document.constructor.name === 'Actor')) {
                  ev.preventDefault();
                  ev.stopPropagation();
                  const actor = targetApp.document;
                  const itemPayload = window.__FE_UNIFORM_DRAG;
                  if (actor && itemPayload) {
                    await actor.createEmbeddedDocuments('Item', [itemPayload]);
                  }
                }
              } catch (err) {
                console.warn('Uniform drop handler failed', err);
              } finally {
                try { document.removeEventListener('drop', dropHandler); } catch(e){}
                try { delete window.__FE_UNIFORM_DRAG; } catch(e){}
              }
            };
            document.addEventListener('drop', dropHandler, { once: true });
            if (event.dataTransfer.setDragImage) {
              const crt = img.cloneNode(true);
              crt.style.width = '96px';
              crt.style.height = '96px';
              crt.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
              document.body.appendChild(crt);
              event.dataTransfer.setDragImage(crt, 48, 48);
              setTimeout(() => document.body.removeChild(crt), 0);
            }
          } catch (e) {
            console.warn('Drag start failed for item image', e);
          }
        });
        img.addEventListener('dragend', () => {
          img.classList.remove('dragging');
          try { delete window.__FE_UNIFORM_DRAG; } catch(e){}
        });
    }

    html.on('submit', 'form', async (ev) => {
      ev.preventDefault();
      console.log('[ItemSheet] form submit detected for', this.item?.name);
      const form = html.find('form')[0];
      const fd = form ? new FormData(form) : null;
      const entries = {};
      if (fd) for (const [k, v] of fd.entries()) entries[k] = v;

      try {
        const descEl = html.find('[name="system.descricao.value"]')[0];
        if (descEl) {
          const val = descEl.value ?? descEl.innerHTML ?? descEl.textContent ?? '';
          if (val && !entries['system.descricao.value']) entries['system.descricao.value'] = val;
        }
      } catch (e) {
      }

      const updateData = foundry.utils.expandObject(entries);
      console.log('[ItemSheet] flattened entries:', entries);
      console.log('[ItemSheet] expanded updateData:', updateData);

      try {
        await this.item.update(updateData);
        console.log('[ItemSheet] update successful');
        try {
          this.close();
          console.log('[ItemSheet] sheet closed after successful save');
        } catch (err) {
          console.warn('[ItemSheet] failed to close sheet after save:', err);
        }
      } catch (err) {
        console.warn('[ItemSheet] submit/update failed:', err);
      }
    });

    html.on('click', '.jem-btn--primary', (ev) => {
      try {
        const btn = ev.currentTarget;
        const form = btn?.form || html.find('form')[0];
        const fd = form ? new FormData(form) : null;
        const entries = {};
        if (fd) for (const [k,v] of fd.entries()) entries[k] = v;
        console.log('[ItemSheet] Save button clicked - form entries:', entries);
      } catch (e) { console.warn('Save click log failed', e); }
    });

    html.on('click', '.jem-sheet-close', (ev) => {
      ev.preventDefault();
      this.close();
    });

    html.on('click', '.header-button.control.close', (ev) => {
      ev.preventDefault();
      this.close();
    });

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

    html.on('click', '.test-damage', async (ev) => {
      ev.preventDefault();
      const item = this.item;
      const critMult = Number(item.system?.ataque?.critico?.mult?.value ?? item.system?.ataque?.critico?.mult ?? 2);
      if (typeof item.rollDamage === 'function') await item.rollDamage(false, critMult);
    });

    html.on('click', '.effect-control', (ev) =>
      onManageActiveEffect(ev, this.item)
    );
  }
}
