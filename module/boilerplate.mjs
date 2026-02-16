// Import document classes.
import { BoilerplateActor } from './documents/actor.mjs';
import { BoilerplateItem } from './documents/item.mjs';
// Import sheet classes.
import { BoilerplateActorSheet } from './sheets/actor-sheet.mjs';
import { BoilerplateItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { BOILERPLATE, FEITICEIROS } from './helpers/config.mjs';
import { seedAptidoesCompendium } from './helpers/seed-aptidoes.mjs';
import { seedHabilidades } from './helpers/seed-habilidades.mjs';
import * as ImportWeapons from './scripts/import-weapons.mjs';
import { registerDominioHooks, computePeCostWithDominio, isSureHitApplicableToTarget, getActiveDominio, endDominio, isTokenInsideDominio, SYSTEM_ID, FLAG_ACTIVE } from './helpers/dominio.mjs';
import { registerDominioClashSocket, requestStartDominioClash, requestNextRound, requestRejectDominioClash } from './helpers/dominio-clash.mjs';
import { rollFormula } from './helpers/rolls.mjs';
import { MAPA_ATRIBUTOS } from './sheets/actor-sheet/atributos.mjs';

// Caso o ciclo de hooks não exponha por timing, tenta anexar imediatamente ao `window`.
try {
  if (typeof window !== 'undefined') {
    window.ImportWeapons = window.ImportWeapons || {};
    if (ImportWeapons && typeof ImportWeapons.importarTudo === 'function') window.ImportWeapons.importarTudo = ImportWeapons.importarTudo;
  }
} catch (e) { /* ignore */ }
import {
  syncPassiveAptidaoEffectsForActor,
  removePassiveAptidaoEffectsForItem,
  handleAptidaoPassivaUpdate,
} from './helpers/aptidoes-passivas.mjs';

import {
  syncPassiveDoteEffectsForActor,
  removePassiveDoteEffectsForItem,
  handleDotePassivoUpdate,
} from './helpers/dotes-passivos.mjs';

import {
  syncPassiveCaracteristicaEffectsForActor,
  removePassiveCaracteristicaEffectsForItem,
  handleCaracteristicaPassivaUpdate,
} from './helpers/caracteristicas-passivas.mjs';

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
  // Expor configurações do sistema (origens, classes, labels)
  CONFIG.FEITICEIROS = FEITICEIROS;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d20 + @iniciativa',
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
  // Verifica se 'uniforme' existe em runtime (dropdown do Item). Não tenta
  // escrever em `game.system.documentTypes` pois a propriedade pode ser
  // somente-leitura em algumas versões/ambientes do Foundry.
  try {
    const cur = game?.system?.documentTypes?.Item;
    const hasUniform = (Array.isArray(cur) && cur.includes('uniforme'))
      || (cur instanceof Set && typeof cur.has === 'function' && cur.has('uniforme'))
      || (cur && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur, 'uniforme'));
    if (!hasUniform) {
      console.warn('[Sistema] Tipo de Item "uniforme" não encontrado em runtime. Certifique-se de declará-lo em system.json; seguindo sem forçar atribuição.');
    }

    // Garantir rótulo visível no dropdown (padrão simples, pode ser substituído por localização)
    CONFIG.Item = CONFIG.Item || {};
    CONFIG.Item.typeLabels = CONFIG.Item.typeLabels || {};
    if (!CONFIG.Item.typeLabels.uniforme) CONFIG.Item.typeLabels.uniforme = 'Uniforme';
  } catch (e) {
    console.warn('Falha ao verificar/registrar tipo uniforme em runtime:', e);
  }

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
  // Hooks do sistema de Domínio (duração em combate, buff dentro do domínio, etc.)
  try { registerDominioHooks(); } catch (e) { console.warn('Falha ao registrar hooks de domínio:', e); }

  // Socket + fluxo de Batalha de Domínio (expansão → whisper → rolagens via Dialog)
  try { registerDominioClashSocket(); } catch (e) { console.warn('Falha ao registrar socket de Batalha de Domínio:', e); }

  try {
    console.warn(`[${SYSTEM_ID}] dominioClash ready: sistema carregado (${new Date().toISOString()})`);
  } catch (_) { /* ignore */ }

  // Handler global (delegado) para botões no chat.
  // Motivo: em alguns cenários o binding por mensagem pode falhar (re-render/DOM trocado),
  // e aí o clique parece "não fazer nada".
  try {
    if (typeof window !== 'undefined' && !window.__jemDominioClashHandlersBound) {
      window.__jemDominioClashHandlersBound = true;

      $(document).on('click', '.jem-dominio-clash-start', async (event) => {
        event.preventDefault();
        const btn = $(event.currentTarget);
        if (btn.data('jem-processing')) return;
        btn.data('jem-processing', true);
        try { btn.prop('disabled', true); } catch (_) { /* ignore */ }

        try {
          const ownerActorId = String(btn.data('owner-actor-id') || '');
          const challengerActorId = String(btn.data('challenger-actor-id') || '');
          const challengerTokenId = String(btn.data('challenger-token-id') || '');

          try {
            console.warn(`[${SYSTEM_ID}] dominioClash delegated click start`, { ownerActorId, challengerActorId, user: game.user?.name, userId: game.user?.id, isGM: !!game.user?.isGM });
          } catch (_) { /* ignore */ }

          if (!ownerActorId || !challengerActorId) return ui.notifications.warn('Dados insuficientes para iniciar a Batalha de Domínio.');

          // Quem clica precisa ser dono do desafiante (ou GM). Resolve por game.actors ou token.
          let challenger = null;
          try {
            challenger = game.actors?.get?.(challengerActorId) ?? null;
            if (!challenger) {
              challenger = (canvas?.tokens?.placeables ?? []).map(t => t?.actor).find(a => a && String(a.id) === String(challengerActorId)) ?? null;
            }
          } catch (_) { /* ignore */ }

          try {
            if (!game.user?.isGM) {
              const ownedByUser = (() => {
                try {
                  if (challenger) return challenger.isOwner || !!challenger.testUserPermission?.(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
                  const charId = game.user?.character?.id;
                  return !!charId && String(charId) === String(challengerActorId);
                } catch (_) {
                  return false;
                }
              })();
              if (!ownedByUser) return ui.notifications.warn('Apenas o dono do personagem pode solicitar o confronto.');
            }
          } catch (_) { /* ignore */ }

          // Fluxo único: helper lida com player (solicita aprovação) vs GM (inicia direto).
          if (!game.user?.isGM) ui.notifications.info('Batalha de Domínio: solicitação enviada ao Mestre.');
          else ui.notifications.info('Batalha de Domínio: iniciando...');
          requestStartDominioClash({ ownerActorId, challengerActorId, challengerTokenId: challengerTokenId || null });
        } finally {
          try {
            btn.data('jem-processing', false);
            btn.prop('disabled', false);
          } catch (_) { /* ignore */ }
        }
      });

      $(document).on('click', '.jem-dominio-clash-next', async (event) => {
        event.preventDefault();
        const btn = $(event.currentTarget);
        if (btn.data('jem-processing')) return;
        btn.data('jem-processing', true);
        try { btn.prop('disabled', true); } catch (_) { /* ignore */ }

        try {
          const clashId = String(btn.data('clash-id') || '');
          try {
            console.warn(`[${SYSTEM_ID}] dominioClash delegated click next`, { clashId, user: game.user?.name, userId: game.user?.id, isGM: !!game.user?.isGM });
          } catch (_) { /* ignore */ }

          if (!clashId) return;
          requestNextRound({ clashId });
        } finally {
          try {
            btn.data('jem-processing', false);
            btn.prop('disabled', false);
          } catch (_) { /* ignore */ }
        }
      });

      $(document).on('click', '.jem-dominio-clash-approve', async (event) => {
        event.preventDefault();
        const btn = $(event.currentTarget);
        if (btn.data('jem-processing')) return;
        btn.data('jem-processing', true);
        try { btn.prop('disabled', true); } catch (_) { /* ignore */ }

        try {
          const ownerActorId = String(btn.data('owner-actor-id') || '');
          const challengerActorId = String(btn.data('challenger-actor-id') || '');
          const challengerTokenId = String(btn.data('challenger-token-id') || '');

          try {
            console.warn(`[${SYSTEM_ID}] dominioClash delegated click approve`, { ownerActorId, challengerActorId, user: game.user?.name, userId: game.user?.id, isGM: !!game.user?.isGM });
          } catch (_) { /* ignore */ }

          if (!game.user?.isGM) return ui.notifications.warn('Apenas o Mestre pode aprovar o confronto.');
          if (!ownerActorId || !challengerActorId) return ui.notifications.warn('Dados insuficientes para aprovar o confronto.');

          ui.notifications.info('Confronto aprovado: iniciando Batalha de Domínio.');
          requestStartDominioClash({ ownerActorId, challengerActorId, challengerTokenId: challengerTokenId || null });
        } finally {
          try {
            btn.data('jem-processing', false);
            btn.prop('disabled', false);
          } catch (_) { /* ignore */ }
        }
      });

      $(document).on('click', '.jem-dominio-clash-reject', async (event) => {
        event.preventDefault();
        const btn = $(event.currentTarget);
        if (btn.data('jem-processing')) return;
        btn.data('jem-processing', true);
        try { btn.prop('disabled', true); } catch (_) { /* ignore */ }

        try {
          const ownerActorId = String(btn.data('owner-actor-id') || '');
          const challengerActorId = String(btn.data('challenger-actor-id') || '');
          const challengerTokenId = String(btn.data('challenger-token-id') || '');
          const requestedBy = String(btn.data('requested-by') || '');

          try {
            console.warn(`[${SYSTEM_ID}] dominioClash delegated click reject`, { ownerActorId, challengerActorId, requestedBy, user: game.user?.name, userId: game.user?.id, isGM: !!game.user?.isGM });
          } catch (_) { /* ignore */ }

          if (!game.user?.isGM) return ui.notifications.warn('Apenas o Mestre pode recusar o confronto.');
          if (!ownerActorId || !challengerActorId) return ui.notifications.warn('Dados insuficientes para recusar o confronto.');

          ui.notifications.info('Confronto recusado.');
          requestRejectDominioClash({ ownerActorId, challengerActorId, challengerTokenId: challengerTokenId || null, requestedBy: requestedBy || null });
        } finally {
          try {
            btn.data('jem-processing', false);
            btn.prop('disabled', false);
          } catch (_) { /* ignore */ }
        }
      });
    }
  } catch (e) {
    console.warn('Falha ao registrar handlers delegados de dominioClash', e);
  }

  // Exponibiliza helper pra você poder rodar manualmente no console, se quiser:
  // game.feiticeirosEAMaldicoes.seedAptidoesCompendium()
  game.feiticeirosEAMaldicoes = {
    ...(game.feiticeirosEAMaldicoes ?? {}),
    seedAptidoesCompendium,
    seedHabilidades
  };

  // Também expor a configuração principal globalmente para conveniência em macros/console
  try {
    if (typeof window !== 'undefined') window.FEITICEIROS = CONFIG.FEITICEIROS;
  } catch (e) { /* ignore */ }

  // Expor importador de armas via namespace global para uso em console/macros
  try {
    window.ImportWeapons = window.ImportWeapons || {};
    if (ImportWeapons && typeof ImportWeapons.importarTudo === 'function') window.ImportWeapons.importarTudo = ImportWeapons.importarTudo;
  } catch (e) { console.warn('Não foi possível expor ImportWeapons globalmente', e); }

  // Funções utilitárias para macro de descanso em massa (aplicar aos tokens selecionados)
  // Helper para coletar tokens por filtro: 'selected' | 'players' | 'npcs'
  function _getTokensByFilter(filter = 'selected') {
    const all = canvas.tokens?.placeables ?? [];
    if (filter === 'players') return all.filter(t => t.actor && t.actor.type !== 'npc' && t.actor.type !== 'inimigo');
    if (filter === 'npcs') return all.filter(t => t.actor && (t.actor.type === 'npc' || t.actor.type === 'inimigo'));
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
        if (actor.type === 'npc' || actor.type === 'inimigo') {
          // Aplicar regra simplificada para NPCs: recuperar 50% do HP máximo (arredondado para baixo)
          const sys = actor.system ?? {};
          const maxHP = Number(sys.recursos?.hp?.max ?? 0) || 0;
          const curHP = Number(sys.recursos?.hp?.value ?? 0) || 0;
          const addHP = Math.floor(maxHP / 2);
          const newHP = Math.min(maxHP, curHP + addHP);

          const { recoveredDV, recoveredDE } = await actor.shortRest();

          const updates = {};
          if (maxHP > 0) updates['system.recursos.hp.value'] = newHP;
          if (Object.keys(updates).length) await actor.update(updates);
          parts.push(`<div>${actor.name} (NPC): HP +${newHP - curHP} (DV/DE: recuperam apenas no Descanso Longo)</div>`);
        } else {
          // Personagem jogador: aplicar shortRest automaticamente se solicitado
          if (applyToPlayers) {
            await actor.shortRest();
            parts.push(`<div>${actor.name} (PC): Descanso Curto (DV/DE recuperam apenas no Descanso Longo)</div>`);
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
          <div class="hint">Regra: DV/DE recuperam apenas no Descanso Longo (1 vez por dia). Descanso Curto não recupera DV/DE.</div>
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
            if (restType === 'long') game.feiticeirosEAMaldicoes.massLongRestSelected(filter);
            else game.feiticeirosEAMaldicoes.massShortRestSelected(filter, false);
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
      img: img || 'icons/svg/d20-black.svg',
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

  // ---------------------------------------------------------------------------
  // APTIDÕES PASSIVAS: garantir que efeitos fiquem sempre ativos
  // ---------------------------------------------------------------------------
  // - Ao criar/atualizar/deletar itens de aptidão embutidos, sincroniza efeitos.
  // - No ready, faz um sync leve nos atores acessíveis (sem notificações).
  Hooks.on('createItem', async (item) => {
    try {
      if (item?.parent?.documentName !== 'Actor') return;
      await handleAptidaoPassivaUpdate(item);
      if (item?.type === 'dote') await handleDotePassivoUpdate(item);
      if (item?.type === 'caracteristica') await handleCaracteristicaPassivaUpdate(item);
    } catch (e) {
      console.warn('Erro ao sincronizar aptidão passiva (createItem):', e);
    }
  });
  Hooks.on('updateItem', async (item) => {
    try {
      if (item?.parent?.documentName !== 'Actor') return;
      await handleAptidaoPassivaUpdate(item);
      if (item?.type === 'dote') await handleDotePassivoUpdate(item);
      if (item?.type === 'caracteristica') await handleCaracteristicaPassivaUpdate(item);
    } catch (e) {
      console.warn('Erro ao sincronizar aptidão passiva (updateItem):', e);
    }
  });
  Hooks.on('deleteItem', async (item) => {
    try {
      if (item?.parent?.documentName !== 'Actor') return;
      await removePassiveAptidaoEffectsForItem(item);
      if (item?.type === 'dote') await removePassiveDoteEffectsForItem(item);
      if (item?.type === 'caracteristica') await removePassiveCaracteristicaEffectsForItem(item);
    } catch (e) {
      console.warn('Erro ao remover efeitos de aptidão passiva (deleteItem):', e);
    }
  });

  (async () => {
    try {
      const actors = (game.actors?.contents ?? []).filter(a => a?.isOwner);
      for (const actor of actors) {
        // Só tenta sincronizar se houver ao menos uma aptidão passiva embutida
        const hasPassive = (actor.items?.contents ?? []).some(i => i?.type === 'aptidao' && String(i.system?.acao?.value ?? '').toLowerCase() === 'passiva');
        if (!hasPassive) continue;
        await syncPassiveAptidaoEffectsForActor(actor, { quiet: true });

        // Sync leve para dotes passivos também
        const hasPassiveDote = (actor.items?.contents ?? []).some(i => i?.type === 'dote' && String(i.system?.acao?.value ?? '').toLowerCase() === 'passiva');
        if (hasPassiveDote) await syncPassiveDoteEffectsForActor(actor, { quiet: true });

        // Sync leve para características com efeitos também
        const hasCaracteristica = (actor.items?.contents ?? []).some(i => i?.type === 'caracteristica');
        if (hasCaracteristica) await syncPassiveCaracteristicaEffectsForActor(actor, { quiet: true });
      }
    } catch (e) {
      console.warn('Falha ao sincronizar aptidões passivas no ready:', e);
    }
  })();

  // Aplica estilo a todas as mensagens do tipo `li.chat-message.message.flexcol`
  Hooks.on('renderChatMessage', (app, html) => {
    try {
      // `html` é o conteúdo renderizado; sobe até o elemento de lista da mensagem
      const root = html.closest('li.chat-message.message.flexcol');
      if (!root || !root.length) return;
      root.css({
        background: '#000',
        color: '#fff',
        'border-left': '4px solid #6f42c1',
        padding: '6px 8px',
        'border-radius': '6px'
      });
      // Força texto branco dentro do container e deixa o card interno transparente
      root.find('*').css('color', '#fff');
      root.find('.card.chat-card').css('background', 'transparent');
    } catch (e) {
      console.error('Erro ao estilizar chat message:', e);
    }
    try {
      // Handler: atacar paredes do domínio (barreira)
      html.on('click', '.jem-attack-dominio-barrier', async (event) => {
        event.preventDefault();
        const btn = $(event.currentTarget);
        const ownerActorId = String(btn.data('owner-actor-id') || '');
        if (!ownerActorId) return ui.notifications.warn('Dono do domínio não informado.');
        const ownerActor = game.actors.get(ownerActorId);
        if (!ownerActor) return ui.notifications.warn('Ator dono do domínio não encontrado.');

        // Domínio pode estar setado no Actor "de mundo" OU no Actor sintético do Token (quando o domínio foi criado a partir da cena).
        let dominio = getActiveDominio(ownerActor);
        if (!dominio) {
          try {
            const tokenActors = (canvas?.tokens?.placeables ?? [])
              .map(t => t?.actor)
              .filter(a => a && String(a.id) === String(ownerActorId));
            for (const a of tokenActors) {
              dominio = getActiveDominio(a);
              if (dominio) break;
            }
          } catch (_) { /* ignore */ }
        }

        if (!dominio) return ui.notifications.warn('Este ator não tem um domínio ativo (ou o token com domínio não está na cena atual).');

        const attackerToken = (canvas.tokens?.controlled?.[0])
          ?? (game.user?.character?.getActiveTokens?.(true, true)?.[0])
          ?? null;
        const attackerTokenDoc = attackerToken?.document ?? null;
        const insideAuto = attackerTokenDoc ? isTokenInsideDominio(attackerTokenDoc, dominio) : false;

        const current = Number(dominio?.hpBarreira?.value ?? 0) || 0;
        const max = Number(dominio?.hpBarreira?.max ?? 0) || 0;
        if (max <= 0) return ui.notifications.warn('Este domínio não possui barreira.');

        const content = `
          <p><strong>Barreira do Domínio</strong> — PV ${current} / ${max}</p>
          <p class="flavor-text">Detecção automática: ${insideAuto ? '<strong>por dentro</strong>' : '<strong>por fora</strong>'} ${attackerTokenDoc ? `(token: ${attackerToken?.name ?? '—'})` : '(nenhum token selecionado)'}</p>
          <div class="form-group">
            <label>Lado do ataque:</label>
            <select name="sideMode">
              <option value="auto" selected>Automático (pelo token selecionado)</option>
              <option value="outside">Forçar: por fora</option>
              <option value="inside">Forçar: por dentro</option>
            </select>
          </div>
          <div class="form-group">
            <label>Dano causado:</label>
            <input type="number" name="damage" min="0" value="0" />
          </div>
          <div class="form-group">
            <label><input type="checkbox" name="reversao" /> Usar Reversão (ignora regra interna; por fora, vulnerável)</label>
          </div>
          <div class="form-group">
            <label><input type="checkbox" name="spell3" /> Feitiço nível 3+ (necessário por dentro, sem Reversão)</label>
          </div>`;

        new Dialog({
          title: 'Atacar Paredes do Domínio',
          content,
          buttons: {
            ok: {
              label: 'Aplicar',
              callback: async (htmlDlg) => {
                const sideMode = String(htmlDlg.find('select[name="sideMode"]').val() || 'auto');
                const dmg = Number(htmlDlg.find('input[name="damage"]').val() || 0) || 0;
                const reversao = !!htmlDlg.find('input[name="reversao"]')[0]?.checked;
                const spell3 = !!htmlDlg.find('input[name="spell3"]')[0]?.checked;

                let inside = insideAuto;
                if (sideMode === 'inside') inside = true;
                else if (sideMode === 'outside') inside = false;

                let effective = dmg;
                if (inside) {
                  if (!reversao && !spell3) effective = 0;
                  else if (!reversao) effective = Math.floor(dmg * 0.5);
                } else {
                  if (reversao) effective = Math.floor(dmg * 2);
                }

                const next = Math.max(0, current - Math.max(0, effective));
                dominio.hpBarreira = dominio.hpBarreira || { value: current, max };
                dominio.hpBarreira.value = next;

                try { await ownerActor.setFlag(SYSTEM_ID, FLAG_ACTIVE, dominio); } catch (_) { /* ignore */ }

                // Atualiza Item Domínio vinculado, se existir
                try {
                  if (dominio?.dominioItemUuid) {
                    const doc = await fromUuid(dominio.dominioItemUuid);
                    if (doc && typeof doc.update === 'function') {
                      await doc.update({
                        'system.dominio.hpBarreira.value': next,
                        'system.dominio.hpBarreira.max': max,
                      });
                    }
                  }
                } catch (_) { /* ignore */ }

                await ChatMessage.create({
                  content: `<div><strong>${ownerActor.name}</strong> — Barreira do Domínio: PV ${next} / ${max} (dano efetivo ${effective}).</div>`
                });

                if (next <= 0) {
                  await endDominio(ownerActor, { reason: 'barreira-destruida', applyBurnout: true });
                  await ChatMessage.create({ content: `<div><strong>${ownerActor.name}</strong>: a barreira colapsou e o Domínio foi desfeito.</div>` });
                }
              }
            },
            cancel: { label: 'Cancelar' }
          },
          default: 'ok'
        }).render(true);
      });

      // Debug: confirmar se o botão está sendo renderizado no cliente que recebeu o whisper
      try {
        const startBtns = html.find('.jem-dominio-clash-start');
        if (startBtns?.length) {
          const btn = startBtns.first();
          console.log(`[${SYSTEM_ID}] dominioClash render: botão start encontrado`, {
            ownerActorId: String(btn.data('owner-actor-id') || ''),
            challengerActorId: String(btn.data('challenger-actor-id') || ''),
            messageId: app?.message?.id ?? null,
          });
        }
      } catch (_) { /* ignore */ }

      // Handlers de Batalha de Domínio (por mensagem)
      // Se o handler global delegado estiver ativo, evita bind duplo.
      if (!(typeof window !== 'undefined' && window.__jemDominioClashHandlersBound)) {
        // Handler: iniciar Batalha de Domínio (a partir do whisper recebido por quem está dentro da área)
        html.on('click', '.jem-dominio-clash-start', async (event) => {
          event.preventDefault();
          const btn = $(event.currentTarget);
          const ownerActorId = String(btn.data('owner-actor-id') || '');
          const challengerActorId = String(btn.data('challenger-actor-id') || '');

          try {
            console.log(`[${SYSTEM_ID}] dominioClash click start`, { ownerActorId, challengerActorId, user: game.user?.name, userId: game.user?.id, isGM: !!game.user?.isGM });
          } catch (_) { /* ignore */ }

          if (!ownerActorId || !challengerActorId) return ui.notifications.warn('Dados insuficientes para iniciar a Batalha de Domínio.');

          // Quem clica precisa ser dono do desafiante (ou GM)
          try {
            if (!game.user?.isGM) {
              const challenger = game.actors.get(challengerActorId);
              if (!challenger || !challenger.isOwner) return ui.notifications.warn('Apenas o dono do personagem pode iniciar a Batalha de Domínio.');
            }
          } catch (_) { /* ignore */ }

          requestStartDominioClash({ ownerActorId, challengerActorId });
        });

        // Handler: próxima rodada (GM consolida e solicita rolagens via socket)
        html.on('click', '.jem-dominio-clash-next', async (event) => {
          event.preventDefault();
          const btn = $(event.currentTarget);
          const clashId = String(btn.data('clash-id') || '');

          try {
            console.log(`[${SYSTEM_ID}] dominioClash click next`, { clashId, user: game.user?.name, userId: game.user?.id, isGM: !!game.user?.isGM });
          } catch (_) { /* ignore */ }

          if (!clashId) return;
          requestNextRound({ clashId });
        });
      }

      // Listener: quem clicou em 'Causar Dano' deve ser quem rolou; cria solicitação de aprovação para o Mestre
      html.on('click', '.apply-damage', async (event) => {
        event.preventDefault();
        const btn = $(event.currentTarget);
        const rollerId = String(btn.data('roller') || '');
        const baseValue = Number(btn.data('value')) || 0;
        const preferredMultiplier = (btn.data('multiplier') !== undefined) ? Number(btn.data('multiplier')) : 1;
        const damageType = btn.data('type') || '';
        const isSoul = String(btn.data('soul')) === 'true';
        const ignoreRD = String(btn.data('ignore-rd')) === 'true';

        if (!rollerId) return ui.notifications.warn('Não foi possível identificar o autor da rolagem.');

        // Apenas o autor pode solicitar aplicação — Mestre aprovará
        if (game.user.id !== rollerId) return ui.notifications.warn('Apenas quem realizou o ataque pode solicitar aplicação; o Mestre deve aprovar.');

        // Recolhe alvos do autor (targets)
        const targetsSet = game.user?.targets ?? new Set();
        const targetIds = Array.from(targetsSet).map(t => t.id);
        if (!targetIds.length) return ui.notifications.warn('Selecione ao menos um alvo (use a ferramenta de Target) para solicitar aplicação.');

        // Cria mensagem de solicitação para o Mestre aprovar/rejeitar
        const originalMsgId = btn.closest('li.chat-message')?.attr('data-message-id') || '';
        const requestHtml = `
          <div><strong>${game.user.name}</strong> solicita que o Mestre aplique <strong>${baseValue}</strong> dano ${damageType ? `(${damageType})` : ''} a ${targetIds.length} alvo(s).</div>
          <div class="flavor-text">Dano base: <strong>${baseValue}</strong>. Ao aprovar, o sistema aplicará o dano ${ignoreRD ? '<strong>ignorando RD/Resistência</strong>' : 'e subtrairá automaticamente a Resistência de Dano (RD)'} dos alvos.</div>
          <div style="margin-top:8px; display:flex; gap:8px;">
            <button class="damage-approval jem-btn jem-btn--confirm" data-action="approve" data-requestor="${rollerId}" data-damage="${baseValue}" data-damage-type="${String(damageType)}" data-soul="${isSoul}" data-ignore-rd="${ignoreRD}" data-targets="${targetIds.join(',')}" data-original="${originalMsgId}">Aprovar</button>
            <button class="damage-approval jem-btn jem-btn--deny" data-action="reject" data-requestor="${rollerId}" data-damage="${baseValue}" data-damage-type="${String(damageType)}" data-soul="${isSoul}" data-ignore-rd="${ignoreRD}" data-targets="${targetIds.join(',')}" data-original="${originalMsgId}">Rejeitar</button>
          </div>`;

        await ChatMessage.create({ content: requestHtml });
      });

      // Handler: quem clicou em 'Rolar Dano' na mensagem de ataque
      html.on('click', '.roll-weapon-damage', async (event) => {
        event.preventDefault();
        const btn = $(event.currentTarget);
        const itemId = String(btn.data('item-id') || '');
        const actorId = String(btn.data('actor-id') || '');
        const itemUuid = String(btn.data('item-uuid') || '');
        const itemName = String(btn.data('item-name') || '');
        if (!actorId) return ui.notifications.warn('Dados do ator faltando para rolar dano.');
        const actor = game.actors.get(actorId);
        if (!actor) return ui.notifications.warn('Ator não encontrado.');

        // Tenta resolver o item de formas diferentes: por id embutido, por nome, por UUID (compêndio)
        let item = null;
        try {
          if (itemId) item = actor.items.get(itemId) || null;
          if (!item && itemName) item = actor.items.find(i => String(i.name || '') === itemName) || null;
          if (!item && itemUuid) {
            try {
              const doc = await fromUuid(itemUuid);
              if (doc) {
                // Se o documento já está embutido no ator, use-o
                if (doc.parent && doc.parent === actor) item = doc;
                else {
                  // Cria uma instância temporária do Item com o ator como parent (não persiste)
                  try {
                    const tmp = new Item(doc.toObject(), { parent: actor });
                    item = tmp;
                  } catch (e) {
                    console.warn('Falha ao instanciar item temporário a partir do compêndio', e);
                  }
                }
              }
            } catch (e) { console.warn('Falha ao resolver UUID do item:', e); }
          }
        } catch (e) { console.error('Erro ao localizar item no ator:', e); }

        if (!item) return ui.notifications.warn('Item não encontrado no ator.');

        // Se o item encontrado não expõe o método `rollDamage`, tente envolver/instanciar
        // usando a classe de documento customizada `BoilerplateItem` (garante métodos do sistema).
        try {
          if (typeof item.rollDamage !== 'function' && typeof BoilerplateItem === 'function') {
            try {
              const data = (typeof item.toObject === 'function') ? item.toObject() : (item ?? {});
              item = new BoilerplateItem(data, { parent: actor });
            } catch (e) {
              console.warn('Falha ao instanciar BoilerplateItem para garantir métodos do documento:', e);
            }
          }
        } catch (e) { /* ignore */ }

        try {
          // Ler se o botão indicou crítico e multiplicador
          const isCritical = String(btn.data('critical') || 'false') === 'true';
          const critMult = Number(btn.data('crit-mult') || 2) || 2;
          // Chamamos o método do documento Item que implementa a rolagem de dano
          if (item.rollDamage) {
            await item.rollDamage(isCritical, critMult);
          } else if (item.document && item.document.rollDamage) {
            await item.document.rollDamage(isCritical, critMult);
          } else {
            return ui.notifications.warn('Este item não suporta rolagem de dano via ataque.');
          }
        } catch (e) {
          console.error('Erro ao rolar dano do item via chat:', e);
        }
      });

      // Handler para botões de aprovação (Mestre)
      html.on('click', '.damage-approval', async (event) => {
        event.preventDefault();
        if (!game.user?.isGM) return ui.notifications.warn('Apenas o Mestre pode aprovar/rejeitar solicitações.');
        const btn = $(event.currentTarget);
        const action = btn.data('action');
        const targetIds = String(btn.data('targets') || '').split(',').filter(Boolean);
        const baseValue = Number(btn.data('damage')) || 0;
        const damageType = String(btn.data('damage-type') || '');
        const isSoul = String(btn.data('soul')) === 'true';
        const ignoreRD = String(btn.data('ignore-rd')) === 'true';
        const originalMsgId = btn.data('original') || '';
        const approvalApp = app; // app refere-se à mensagem atual (a solicitação)

        if (action === 'approve') {
          // Aplicar dano pleno (multiplicador 1)
          const applied = [];
          for (const id of targetIds) {
            try {
              const token = canvas.tokens.get(id);
              if (!token) continue;
              const actor = token.actor;
              if (!actor || !actor.applyDamage) continue;
              const amount = Math.round(baseValue);
              const res = await actor.applyDamage(amount, damageType || 'generic', isSoul, { ignoreRD });
              applied.push({ name: actor.name, applied: res.applied ?? amount, mitigated: res.mitigated ?? 0, resource: res.resource, newValue: res.newValue });
            } catch (e) { console.error('Erro ao aplicar dano no approve', e); }
          }
          // Atualiza mensagem de solicitação para indicar aprovação
          try {
            const li = btn.closest('li.chat-message');
            const msgId = li?.attr?.('data-message-id') || '';
            if (msgId) {
              const origMsg = game.messages.get(msgId) || (await ChatMessage.get(msgId));
              if (origMsg && typeof origMsg.update === 'function') await origMsg.update({ content: `<div>Solicitação aprovada pelo Mestre. Aplicado: ${baseValue} a ${applied.length} alvos.</div>` });
            }
          } catch(e){console.warn('Falha ao atualizar mensagem de aprovação', e);} 
          // Resumo no chat
          const parts = ['<div class="jem-apply-damage-summary"><strong>Aplicação de Dano (Aprovado)</strong></div>'];
          for (const a of applied) parts.push(`<div>${a.name}: -${a.applied} (mitigado ${a.mitigated}) → ${a.resource}=${a.newValue}</div>`);
          await ChatMessage.create({ content: parts.join('') });
        }
        else if (action === 'reject') {
          // Substitui conteúdo da solicitação por opções do Mestre (sem dano/metade/dobro)
          const decisionHtml = `
            <div>Solicitação rejeitada. Escolha ajuste a aplicar:</div>
            <div class="flavor-text">Você pode optar por não aplicar dano, aplicar metade ou dobro. A escolha será aplicada aos alvos selecionados.</div>
            <div style="margin-top:8px; display:flex; gap:8px;">
              <button class="damage-decision jem-btn jem-btn--neutral" data-multiplier="0" data-damage="${baseValue}" data-damage-type="${String(damageType)}" data-soul="${isSoul}" data-ignore-rd="${ignoreRD}" data-targets="${targetIds.join(',')}">Sem Dano</button>
              <button class="damage-decision jem-btn jem-btn--warning" data-multiplier="0.5" data-damage="${baseValue}" data-damage-type="${String(damageType)}" data-soul="${isSoul}" data-ignore-rd="${ignoreRD}" data-targets="${targetIds.join(',')}">Metade</button>
              <button class="damage-decision jem-btn jem-btn--danger" data-multiplier="2" data-damage="${baseValue}" data-damage-type="${String(damageType)}" data-soul="${isSoul}" data-ignore-rd="${ignoreRD}" data-targets="${targetIds.join(',')}">Dobro</button>
            </div>`;
          try {
            const li = btn.closest('li.chat-message');
            const msgId = li?.attr?.('data-message-id') || '';
            if (msgId) {
              const origMsg = game.messages.get(msgId) || (await ChatMessage.get(msgId));
              if (origMsg && typeof origMsg.update === 'function') await origMsg.update({ content: decisionHtml });
            }
          } catch(e){console.warn('Falha ao atualizar solicitação com decisões', e);} 
        }
      });

      // Handler: executar Ação de NPC (consome PE, realiza rolagem conforme tipo)
      html.on('click', '.npc-action-exec', async (event) => {
        event.preventDefault();
        const btn = $(event.currentTarget);
        const itemUuid = String(btn.data('item-uuid') || '');
        const actorId = String(btn.data('actor-id') || '');
        const baseCusto = Number(btn.data('custo') || 0) || 0;

        // Só o Mestre ou o dono do ator pode executar ações de NPC via interface
        if (!game.user.isGM && !game.user.character) return ui.notifications.warn('Apenas o Mestre pode executar ações NPC desta forma.');

        // Resolve actor e item
        let actor = game.actors.get(actorId) || null;
        let item = null;
        try {
          if (itemUuid) {
            const doc = await fromUuid(itemUuid);
            if (doc) item = doc;
          }
          if (!item && actor) item = actor.items.find(i => String(i.name || '') === String(btn.closest('.card').find('div').first().text().trim()));
        } catch (e) { /* ignore */ }
        if (!actor) return ui.notifications.warn('Ator não encontrado para executar a ação.');
        if (!item) return ui.notifications.warn('Item de ação não resolvido.');

        // Custo efetivo (Condenado + Domínio)
        let custo = baseCusto;
        try {
          const condCondenado = Boolean(actor.system?.condicoes?.fisicas?.condenado);
          if (condCondenado && custo > 0) custo = custo + 1;
        } catch (e) { /* ignore */ }
        try {
          custo = computePeCostWithDominio(actor, custo);
        } catch (e) { /* ignore */ }

        // Verifica PE suficiente
        const energia = Number(actor.system?.recursos?.energia?.value ?? 0) || 0;
        if (energia < custo) return ui.notifications.warn('Energia insuficiente para executar a ação.');

        // Deduz PE
        try {
          await actor.update({ ['system.recursos.energia.value']: Math.max(0, energia - custo) });
        } catch (e) { console.error('Falha ao deduzir PE do ator:', e); }

        // Executa lógica de acerto e publica resultado (simples)
        try {
          const tipo = String(item.system?.tipoAcerto?.value ?? item.system?.tipoAcerto ?? 'atributo_bt');
          const atributo = String(item.system?.atributo?.value ?? item.system?.atributo ?? 'forca');
          const danoMedio = Number(item.system?.danoMedio?.value ?? item.system?.danoMedio ?? 0) || 0;

          let resultHtml = `<div><strong>${actor.name}</strong> executa <strong>${item.name}</strong>.</div>`;
          if (tipo === 'automatico') {
            resultHtml += `<div>Acerto automático.</div>`;
          } else if (tipo === 'cd') {
            resultHtml += `<div>Teste contra CD (Mestre escolhe alvo). Nenhuma rolagem automática aqui.</div>`;
          } else if (tipo === 'tr' || tipo === 'tr_area') {
            // Solicitar TR aos alvos selecionados
            const targetsSet = game.user?.targets ?? new Set();
            const targetTokenDocs = Array.from(targetsSet).map(t => t?.document).filter(Boolean);
            if (!targetTokenDocs.length) {
              await ChatMessage.create({ content: `${resultHtml}<div><strong>TR:</strong> selecione ao menos um alvo (Target) para solicitar o teste.</div>` });
              return;
            }

            const defaultDc = Number(actor.system?.cd?.value ?? actor.system?.cd ?? 10) || 10;
            const dlgContent = `
              <form class="jem-save-request">
                <div class="form-group">
                  <label>Salvaguarda</label>
                  <select name="saveKey">
                    <option value="fortitude">Fortitude</option>
                    <option value="reflexos">Reflexos</option>
                    <option value="vontade">Vontade</option>
                    <option value="astucia">Astúcia</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>CD</label>
                  <input type="number" name="dc" value="${defaultDc}" />
                </div>
              </form>`;

            const request = await new Promise((resolve) => {
              new Dialog({
                title: `${actor.name} — Solicitar TR`,
                content: dlgContent,
                buttons: {
                  ok: { label: 'Criar Solicitação', callback: (htmlDlg) => {
                    const saveKey = String(htmlDlg.find('select[name="saveKey"]').val() || 'fortitude');
                    const dc = Number(htmlDlg.find('input[name="dc"]').val() || defaultDc) || defaultDc;
                    resolve({ saveKey, dc });
                  } },
                  cancel: { label: 'Cancelar', callback: () => resolve(null) }
                },
                default: 'ok'
              }).render(true);
            });
            if (!request) return;

            const saveKey = request.saveKey;
            const dc = request.dc;
            const saveLabel = ({ fortitude: 'Fortitude', reflexos: 'Reflexos', vontade: 'Vontade', astucia: 'Astúcia' })[saveKey] || saveKey;
            const reductionText = (tipo === 'tr_area')
              ? 'Em sucesso, dano reduzido pela metade.'
              : 'Em sucesso, dano reduzido em 1 ND.';

            const buttons = targetTokenDocs.map(t => {
              const targetName = t?.name ?? t?.actor?.name ?? 'Alvo';
              const targetTokenId = String(t.id);
              const targetActorId = String(t.actor?.id ?? '');
              return `<button class="jem-roll-save jem-btn jem-btn--primary" data-source-actor-id="${actor.id}" data-save-key="${saveKey}" data-dc="${dc}" data-target-token-id="${targetTokenId}" data-target-actor-id="${targetActorId}">Rolar TR (${targetName})</button>`;
            }).join(' ');

            resultHtml += `<div><strong>TR:</strong> ${saveLabel} — CD <strong>${dc}</strong>. ${reductionText}</div>`;
            resultHtml += `<div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;">${buttons}</div>`;
          } else {
            // atributo_bt
            const attrVal = Number(actor.system?.atributos?.[atributo]?.value ?? 10) || 10;
            const attrMod = Number(actor.system?.atributos?.[atributo]?.mod ?? Math.floor((attrVal - 10) / 2)) || 0;
            const bt = Number(actor.system?.detalhes?.treinamento?.value ?? actor.system?.treinamento ?? actor.system?.bt ?? 0) || 0;
            const formula = `1d20 + ${attrMod + bt}`;
            const roll = await (new Roll(formula)).roll({async: true});
            await roll.toMessage({ flavor: `${actor.name} — ${item.name} (Ataque de NPC)` });
            resultHtml += `<div>Rolagem: <strong>${roll.total}</strong> (1d20 + ${attrMod} + ${bt}).</div>`;
          }

          if (danoMedio) {
            resultHtml += `<div style="margin-top:6px;">Dano médio sugerido: <strong>${danoMedio}</strong>. Use os botões abaixo para solicitar aplicação.</div>`;
            resultHtml += `<div style="margin-top:8px;"><button class="button apply-damage" data-value="${danoMedio}" data-type="generic" data-multiplier="1" data-soul="false" data-ignore-rd="false" data-roller="${game.user.id}">Solicitar Aplicação</button></div>`;
          }

          await ChatMessage.create({ content: resultHtml });
        } catch (e) {
          console.error('Erro ao executar ação NPC:', e);
        }
      });

      // Handler: rolar TR solicitado via chat
      html.on('click', '.jem-roll-save', async (event) => {
        event.preventDefault();
        const btn = $(event.currentTarget);
        const sourceActorId = String(btn.data('source-actor-id') || '');
        const saveKey = String(btn.data('save-key') || 'fortitude');
        const dc = Number(btn.data('dc') || 10) || 10;
        const targetTokenId = String(btn.data('target-token-id') || '');
        const targetActorId = String(btn.data('target-actor-id') || '');
        const onFailCondition = String(btn.data('on-fail-condition') || '').trim();
        const conditionRounds = Number(btn.data('condition-rounds') || 0) || 0;

        const targetToken = targetTokenId ? canvas.tokens.get(targetTokenId) : null;
        const targetActor = (targetToken?.actor) || (targetActorId ? game.actors.get(targetActorId) : null);
        const sourceActor = sourceActorId ? game.actors.get(sourceActorId) : null;

        if (!targetActor) return ui.notifications.warn('Alvo não encontrado para rolar TR.');

        // Permissão: GM ou dono do ator alvo
        try {
          const canRoll = game.user?.isGM || targetActor.isOwner || targetActor.testUserPermission?.(game.user, 'OWNER');
          if (!canRoll) return ui.notifications.warn('Você não tem permissão para rolar TR para este ator.');
        } catch (_) { /* ignore */ }

        const saveLabel = ({ fortitude: 'Fortitude', reflexos: 'Reflexos', vontade: 'Vontade', astucia: 'Astúcia' })[saveKey] || saveKey;

        // Sure-hit do Domínio: se aplicável ao alvo, falha automática
        let sureHit = false;
        try {
          if (sourceActor && targetToken?.document) sureHit = isSureHitApplicableToTarget({ sourceActor, targetTokenDoc: targetToken.document });
        } catch (_) { sureHit = false; }

        const system = targetActor.system ?? {};
        const pericia = system?.salvaguardas?.[saveKey] ?? null;
        if (!pericia) return ui.notifications.warn('Salvaguarda inválida.');
        const grauTreino = Number(pericia.value ?? 0) || 0;

        const atributoKey = MAPA_ATRIBUTOS?.[saveKey];
        const atributoMod = Number(system?.atributos?.[atributoKey]?.mod ?? 0) || 0;
        const baseTreino = Number(system?.detalhes?.treinamento?.value ?? 0) || 0;
        let treinoBonus = 0;
        if (grauTreino === 1) treinoBonus = baseTreino;
        else if (grauTreino === 2) treinoBonus = Math.floor(baseTreino * 1.5);

        const nivelTotalDerivado = system.detalhes?.nivel?.value ?? ((system.detalhes?.niveis?.principal?.value || 0) + (system.detalhes?.niveis?.secundario?.value || 0));
        const metadeNivel = Math.floor((Number(nivelTotalDerivado) || 0) / 2);

        const dieTerm = sureHit ? '1' : '1d20';
        let formula = `${dieTerm} + ${atributoMod}[Atributo]`;
        if (treinoBonus > 0) formula += ` + ${treinoBonus}[Treino]`;
        if (metadeNivel > 0) formula += ` + ${metadeNivel}[MetadeNivel]`;

        const flavor = sureHit
          ? `<b>TR — ${saveLabel}</b> (Falha automática: Acerto Garantido do Domínio)`
          : `<b>TR — ${saveLabel}</b> (CD ${dc})`;

        let roll;
        try {
          roll = await rollFormula(formula, { actor: targetActor }, { asyncEval: true, toMessage: true, flavor });
        } catch (e) {
          console.warn('Falha ao rolar TR:', e);
          return ui.notifications.error('Falha ao rolar TR.');
        }

        const total = Number(roll?.total ?? 0) || 0;
        const success = (!sureHit) && (total >= dc);
        const outcome = sureHit ? 'FALHA AUTOMÁTICA' : (success ? 'SUCESSO' : 'FALHA');

        // Se a mensagem solicitou condição em falha, aplica aqui
        if (!success && onFailCondition) {
          try {
            const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
            const norm = String(onFailCondition).toLowerCase();
            const condMap = {
              abalado: 'system.condicoes.mentais.abalado',
              amedrontado: 'system.condicoes.mentais.amedrontado',
              exposto: 'system.condicoes.mentais.exposto',
              confuso: 'system.condicoes.mentais.confuso',
              desprevenido: 'system.condicoes.sensoriais.desprevenido',
              desorientado: 'system.condicoes.sensoriais.desorientado',
              lento: 'system.condicoes.movimento.lento',
              caido: 'system.condicoes.movimento.caido',
              agarrado: 'system.condicoes.movimento.agarrado',
              atordoado: 'system.condicoes.movimento.atordoado',
              paralisado: 'system.condicoes.fisicas.paralisado',
            };

            const key = norm.startsWith('system.') ? norm : (norm.includes('.') ? `system.${norm}` : (condMap[norm] || ''));
            if (key) {
              // Atualiza o boolean no system
              try { await targetActor.update({ [key]: true }); } catch (_) { /* ignore */ }

              // Cria um ActiveEffect simples (não depende da UI da ficha)
              const keyNoSystem = key.replace(/^system\./, '');
              const existing = targetActor.effects?.find?.(e => e?.flags?.[sysId]?.condition === keyNoSystem) ?? null;

              const changes = [];
              const system = targetActor.system ?? {};
              const pericias = Object.keys(system?.pericias || {});
              const ataques = Object.keys(system?.ataques || {});
              const salvaguardas = Object.keys(system?.salvaguardas || {});

              const addPericias = (n) => { for (const p of pericias) changes.push({ key: `system.pericias.${p}.value`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 }); };
              const addAtaques = (n) => { for (const a of ataques) changes.push({ key: `system.ataques.${a}.value`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 }); };
              const addSalv = (n) => { for (const s of salvaguardas) changes.push({ key: `system.salvaguardas.${s}.value`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 }); };

              if (keyNoSystem === 'condicoes.mentais.abalado') { addPericias(-1); addAtaques(-1); }
              else if (keyNoSystem === 'condicoes.mentais.amedrontado') { addPericias(-3); addAtaques(-3); }
              else if (keyNoSystem === 'condicoes.sensoriais.desprevenido') {
                changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-3), priority: 20 });
                if (salvaguardas.includes('reflexos')) addSalv(-3);
              }
              else if (keyNoSystem === 'condicoes.movimento.lento') { changes.push({ key: 'system.combate.movimento.value', mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: '0.5', priority: 20 }); }
              else if (keyNoSystem === 'condicoes.movimento.caido') {
                changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-3), priority: 20 });
                changes.push({ key: 'system.combate.movimento.value', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: String(4.5), priority: 20 });
              }

              const effectData = {
                label: `Condição: ${keyNoSystem.split('.').pop()} (Domínio)`,
                icon: 'icons/svg/downgrade.svg',
                origin: sourceActor?.uuid ?? sourceActor?.id ?? null,
                disabled: false,
                changes: changes.length ? changes : undefined,
                duration: {},
                flags: { [sysId]: { condition: keyNoSystem, fromDominioAmbiental: true } },
              };

              if (game.combat && conditionRounds > 0) {
                effectData.duration.rounds = Number(conditionRounds) || 1;
                effectData.duration.startRound = Number(game.combat.round ?? 0) || 0;
                effectData.duration.startTurn = Number(game.combat.turn ?? 0) || 0;
              }

              if (!existing) {
                try { await targetActor.createEmbeddedDocuments('ActiveEffect', [effectData]); } catch (_) { /* ignore */ }
              }
            }
          } catch (e) {
            console.warn('Falha ao aplicar condição em falha de TR:', e);
          }
        }

        await ChatMessage.create({
          content: `<div><strong>${targetActor.name}</strong> — TR ${saveLabel} vs CD ${dc}: <strong>${outcome}</strong> (total ${total}).</div>`
        });
      });

      // Handler para decisão do Mestre (aplica 0 / 0.5 / 2 multiplicador)
      html.on('click', '.damage-decision', async (event) => {
        event.preventDefault();
        if (!game.user?.isGM) return ui.notifications.warn('Apenas o Mestre pode decidir o ajuste.');
        const btn = $(event.currentTarget);
        const multiplier = Number(btn.data('multiplier')) || 0;
        const baseValue = Number(btn.data('damage')) || 0;
        const damageType = String(btn.data('damage-type') || '');
        const isSoul = String(btn.data('soul')) === 'true';
        const ignoreRD = String(btn.data('ignore-rd')) === 'true';
        const targetIds = String(btn.data('targets') || '').split(',').filter(Boolean);
        const applied = [];
        for (const id of targetIds) {
          try {
            const token = canvas.tokens.get(id);
            if (!token) continue;
            const actor = token.actor;
            if (!actor || !actor.applyDamage) continue;
            const amount = Math.round(baseValue * multiplier);
            const res = await actor.applyDamage(amount, damageType || 'generic', isSoul, { ignoreRD });
            applied.push({ name: actor.name, applied: res.applied ?? amount, mitigated: res.mitigated ?? 0, resource: res.resource, newValue: res.newValue });
          } catch (e) { console.error('Erro ao aplicar dano na decisão', e); }
        }
        try {
          const li = btn.closest('li.chat-message');
          const msgId = li?.attr?.('data-message-id') || '';
          if (msgId) {
            const origMsg = game.messages.get(msgId) || (await ChatMessage.get(msgId));
            if (origMsg && typeof origMsg.update === 'function') await origMsg.update({ content: `<div>Decisão do Mestre aplicada: multiplicador ${multiplier}. Alvos afetados: ${applied.length}</div>` });
          }
        } catch(e){console.warn('Falha ao atualizar mensagem de decisão', e);} 
        const parts = ['<div class="jem-apply-damage-summary"><strong>Aplicação de Dano (Decisão do Mestre)</strong></div>'];
        for (const a of applied) parts.push(`<div>${a.name}: -${a.applied} (mitigado ${a.mitigated}) → ${a.resource}=${a.newValue}</div>`);
        await ChatMessage.create({ content: parts.join('') });
      });
    } catch (e) {
      console.error('Erro ao registrar listener de aplicar dano no chat:', e);
    }
  });
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
