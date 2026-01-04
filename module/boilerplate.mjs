// Import document classes.
import { BoilerplateActor } from './documents/actor.mjs';
import { BoilerplateItem } from './documents/item.mjs';
// Import sheet classes.
import { BoilerplateActorSheet } from './sheets/actor-sheet.mjs';
import { BoilerplateItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { BOILERPLATE } from './helpers/config.mjs';
import { seedAptidoesCompendium } from './helpers/seed-aptidoes.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.boilerplate = {
    BoilerplateActor,
    BoilerplateItem,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.BOILERPLATE = BOILERPLATE;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d20 + @abilities.dex.mod',
    decimals: 2,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = BoilerplateActor;
  CONFIG.Item.documentClass = BoilerplateItem;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('boilerplate', BoilerplateActorSheet, {
    makeDefault: true,
    label: 'BOILERPLATE.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('boilerplate', BoilerplateItemSheet, {
    makeDefault: true,
    label: 'BOILERPLATE.SheetLabels.Item',
  });

  // Marca se o Compendium de Aptidões já foi populado por código (por versão do sistema)
  game.settings.register(game.system.id, 'aptidoesCompendiumSeedVersion', {
    scope: 'world',
    config: false,
    default: '',
    type: String
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Exponibiliza helper pra você poder rodar manualmente no console, se quiser:
  // game.feiticeirosEAMaldicoes.seedAptidoesCompendium()
  game.feiticeirosEAMaldicoes = {
    ...(game.feiticeirosEAMaldicoes ?? {}),
    seedAptidoesCompendium
  };

  // Funções utilitárias para macro de descanso em massa (aplicar aos tokens selecionados)
  // Helper para coletar tokens por filtro: 'selected' | 'players' | 'npcs'
  function _getTokensByFilter(filter = 'selected') {
    const all = canvas.tokens?.placeables ?? [];
    if (filter === 'players') return all.filter(t => t.actor && t.actor.type !== 'npc');
    if (filter === 'npcs') return all.filter(t => t.actor && t.actor.type === 'npc');
    if (filter === 'all') return all.filter(t => t.actor);
    return canvas.tokens.controlled ?? [];
  }

  game.feiticeirosEAMaldicoes.massLongRestSelected = async function(filter = 'selected') {
    if (!game.user.isGM) return ui.notifications.warn('Apenas o Mestre pode executar descanso em massa.');
    const tokens = _getTokensByFilter(filter);
    if (!tokens.length) return ui.notifications.warn('Nenhum token encontrado para o filtro selecionado.');
    const summary = [];
    for (const t of tokens) {
      const actor = t.actor;
      if (!actor) continue;
      try {
        const res = await actor.longRest();
        summary.push({ name: actor.name, recoveredDV: res?.recoveredDV ?? 0, recoveredDE: res?.recoveredDE ?? 0 });
      } catch (e) {
        console.error('Erro longRest em massLongRestSelected para', actor?.name, e);
      }
    }
    // Mensagem resumida no chat
    const parts = ['<div class="mass-rest"><strong>Descanso Longo (em massa)</strong> aplicado pelo Mestre.</div>'];
    for (const s of summary) parts.push(`<div>${s.name}: +DV ${s.recoveredDV}, +DE ${s.recoveredDE}</div>`);
    await ChatMessage.create({ content: parts.join('') });
    ui.notifications.info('Descanso Longo (massa) aplicado.');
  };

  game.feiticeirosEAMaldicoes.massShortRestSelected = async function(filter = 'selected', applyToPlayers = false) {
    if (!game.user.isGM) return ui.notifications.warn('Apenas o Mestre pode executar descanso em massa.');
    const tokens = _getTokensByFilter(filter);
    if (!tokens.length) return ui.notifications.warn('Nenhum token encontrado para o filtro selecionado.');
    const parts = ['<div class="mass-short-rest"><strong>Descanso Curto (em massa)</strong> declarado pelo Mestre.</div>'];
    for (const t of tokens) {
      const actor = t.actor;
      if (!actor) continue;
      try {
        if (actor.type === 'npc') {
          // Aplicar regra simplificada para NPCs: recuperar 50% do HP máximo (arredondado para baixo)
          const sys = actor.system ?? {};
          const maxHP = Number(sys.recursos?.hp?.max ?? 0) || 0;
          const curHP = Number(sys.recursos?.hp?.value ?? 0) || 0;
          const addHP = Math.floor(maxHP / 2);
          const newHP = Math.min(maxHP, curHP + addHP);

          // Para DV/DE, usa actor.shortRest() que recupera 1/4 dos dados (mínimo 1)
          const { recoveredDV, recoveredDE } = await actor.shortRest();

          const updates = {};
          if (maxHP > 0) updates['system.recursos.hp.value'] = newHP;
          if (Object.keys(updates).length) await actor.update(updates);
          parts.push(`<div>${actor.name} (NPC): HP +${newHP - curHP}, DV +${recoveredDV}, DE +${recoveredDE}</div>`);
        } else {
          // Personagem jogador: aplicar shortRest automaticamente se solicitado
          if (applyToPlayers) {
            const { recoveredDV, recoveredDE } = await actor.shortRest();
            parts.push(`<div>${actor.name} (PC): DV +${recoveredDV}, DE +${recoveredDE}</div>`);
          } else {
            await actor.setFlag(game.system.id, 'lastShortRest', Date.now());
            parts.push(`<div>${actor.name}: Descanso Curto declarado (jogador deve gastar DV/DE manualmente).</div>`);
          }
        }
      } catch (e) {
        console.error('Erro massShortRestSelected para', actor?.name, e);
      }
    }
    await ChatMessage.create({ content: parts.join('') });
    ui.notifications.info('Descanso Curto (massa) aplicado.');
  };

  // Dialog de seleção para executar descanso em massa com filtro (opção padrão: Selecionados)
  game.feiticeirosEAMaldicoes.massRestDialog = async function(restType = 'short') {
    if (!game.user.isGM) return ui.notifications.warn('Apenas o Mestre pode executar descanso em massa.');
    const title = restType === 'long' ? 'Descanso Longo (Massa)' : 'Descanso Curto (Massa)';
    const content = `
      <form class="mass-rest-dialog">
        <div class="form-group">
          <label class="title">Alvo</label>
          <div class="form-fields">
            <label class="option"><input type="radio" name="target" value="selected" checked><span>Selecionados</span></label>
            <label class="option"><input type="radio" name="target" value="players"><span>Personagens (PCs)</span></label>
            <label class="option"><input type="radio" name="target" value="npcs"><span>NPCs</span></label>
            <label class="option"><input type="radio" name="target" value="all"><span>Todos (toda a cena)</span></label>
          </div>
          <div class="hint">Dica: 'Selecionados' é padrão para evitar curar toda a cena por engano.</div>
        </div>
        <div class="form-group">
          <label class="title">Opções</label>
          <div class="form-fields">
            <label class="option"><input type="checkbox" name="applyToPlayers" value="1"><span>Aplicar automaticamente a Personagens (recuperar DV/DE)</span></label>
          </div>
        </div>
      </form>
    `;
    new Dialog({
      title,
      content,
      buttons: {
        ok: {
          icon: '<i class="fas fa-check"></i>',
          label: 'Confirmar',
          callback: (html) => {
            const filter = html.find('input[name="target"]:checked').val() || 'selected';
            const applyToPlayers = Boolean(html.find('input[name="applyToPlayers"]:checked').val());
            if (restType === 'long') game.feiticeirosEAMaldicoes.massLongRestSelected(filter);
            else game.feiticeirosEAMaldicoes.massShortRestSelected(filter, applyToPlayers);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancelar'
        }
      },
      default: 'ok'
    }, { id: 'mass-rest-dialog' }).render(true);
  };

  // Cria macros utilitárias (se não existirem) para facilitar uso rápido
  function _createMacroIfMissing(name, command, img) {
    if (game.macros.find(m => m.name === name && m.command === command)) return;
    return Macro.create({
      name,
      type: 'script',
      img: img || 'icons/svg/dice.svg',
      command,
      flags: { [game.system.id || 'system']: { massRestMacro: true } }
    });
  }

  // Tenta criar macros de Descanso Curto/Longo sem atribuí-las ao hotbar
  (async () => {
    try {
      await _createMacroIfMissing('Descanso Curto (Massa)', "game.feiticeirosEAMaldicoes.massRestDialog('short');", 'icons/svg/rest.svg');
      await _createMacroIfMissing('Descanso Longo (Massa)', "game.feiticeirosEAMaldicoes.massRestDialog('long');", 'icons/svg/rest.svg');
    } catch (e) {
      console.warn('Erro ao criar macros de descanso automático:', e);
    }
  })();

  // Seed automático (não destrutivo): cria entradas faltantes no compendium.
  // Roda uma vez por versão do sistema.
  (async () => {
    if (!game.user.isGM) return;
    const seededVersion = game.settings.get(game.system.id, 'aptidoesCompendiumSeedVersion') || '';
    const currentVersion = game.system.version || '';
    if (seededVersion === currentVersion) return;

    const result = await seedAptidoesCompendium({ notify: true });
    if (result?.reason === 'ok' || result?.reason === 'nothing-to-do') {
      await game.settings.set(game.system.id, 'aptidoesCompendiumSeedVersion', currentVersion);
    }
  })();

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.boilerplate.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'boilerplate.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
