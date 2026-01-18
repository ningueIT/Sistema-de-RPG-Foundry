import { FEITICEIROS } from '../helpers/config.mjs';
import { extrairPrereqsDaDescricao } from '../sheets/actor-sheet/aptidoes-utils.mjs';

function _getActorNivel(actor) {
  try {
    const detalhes = actor.system?.detalhes || {};
    const nivelPrincipal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
    const nivelSecundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;
    if (nivelPrincipal || nivelSecundario) return nivelPrincipal + nivelSecundario;
    return Number(detalhes?.nivel?.value ?? 0) || 0;
  } catch (e) { return 0; }
}

function _normalizarNomeClasse(str = '') {
  return String(str).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function _getNivelDaClasse(actor, classeNome) {
  if (!actor) return 0;
  const alvo = _normalizarNomeClasse(classeNome);
  if (!alvo) return 0;
  const detalhes = actor.system?.detalhes ?? {};
  const classePrincipal = _normalizarNomeClasse(detalhes?.classe?.value ?? detalhes?.classe ?? '');
  const classeSecundaria = _normalizarNomeClasse(detalhes?.multiclasse?.value ?? detalhes?.multiclasse ?? '');
  const nivelPrincipal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
  const nivelSecundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;
  let total = 0;
  if (classePrincipal && classePrincipal === alvo) total += nivelPrincipal;
  if (classeSecundaria && classeSecundaria === alvo) total += nivelSecundario;
  return total;
}

export default class LevelUpDialog extends FormApplication {

  /**
   * Construtor: aceita apenas o `actor`.
   * @param {Actor} actor
   */
  constructor(actor, options = {}) {
    super(actor, options);
    this.actor = actor;

    // Staging area for dragged items (features / aptitudes)
    this.selectedFeatures = [];
    this.selectedAptitudes = [];
    this.currentStep = 1;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['feiticeiros-e-maldicoes', 'level-up'],
      template: 'systems/feiticeiros-e-maldicoes/templates/apps/level-up.hbs',
      width: 680,
      height: 'auto',
      dragDrop: [{ dragSelector: null, dropSelector: '.drop-zone' }],
      closeOnSubmit: true
    });
  }

  get title() {
    const nextLevel = Number(this.actor?.system?.detalhes?.nivel?.value ?? 0) + 1;
    const name = this.actor?.name ?? 'Personagem';
    return `Ascensão — ${name} → Nível ${nextLevel}`;
  }

  /**
    * Prepare data for the template using FEITICEIROS.classes
   */
  async getData(options = {}) {
    const data = await super.getData(options);

    // Read the class identifier from actor. Support both direct string and legacy {value}.
    const detalhes = this.actor?.system?.detalhes ?? {};
    const classData = detalhes?.classe;
    const classIdRaw = (typeof classData === 'object') ? classData?.value : classData;

    const classId = _normalizarNomeClasse(classIdRaw || '');

    const classesCfg = FEITICEIROS?.classes ?? {};
    const classCfg = classesCfg[classId];

    if (!classCfg) {
      return {
        ...data,
        actor: this.actor,
        error: `Configuração de classe não encontrada: "${classId}"`,
      };
    }

    const currentLevel = Number(detalhes?.nivel?.value ?? 0);
    const nextLevel = currentLevel + 1;

    // Gains come from the configuration (per-level)
    const hpGain = Number(classCfg?.hp?.perLevel ?? 0);
    const epGain = Number(classCfg?.ep?.perLevel ?? 0);

    // Progression slots as defined in config for the next level
    const progression = classCfg?.progression?.[String(nextLevel)] ?? {};
    const featureCount = Number(progression?.features ?? 0);
    const aptitudeCount = Number(progression?.aptitudes ?? 0);

    const featureSlots = Array.from({ length: Math.max(0, featureCount) }, (_, i) => this.selectedFeatures[i] ?? null);
    const aptitudeSlots = Array.from({ length: Math.max(0, aptitudeCount) }, (_, i) => this.selectedAptitudes[i] ?? null);

    return {
      ...data,
      actor: this.actor,
      step: this.currentStep,
      isStep1: this.currentStep === 1,
      isStep2: this.currentStep === 2,
      isStep3: this.currentStep === 3,
      hasAptitudeSlots: aptitudeCount > 0,
      hasFeatureSlots: featureCount > 0,
      classId,
      classCfg,
      currentLevel,
      nextLevel,
      hpGain,
      epGain,
      progression,
      featureSlots,
      aptitudeSlots
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const $html = html instanceof jQuery ? html : $(html);

    $html.find('[data-action="next"]').on('click', (ev) => {
      ev?.preventDefault();
      if ((this.currentStep ?? 1) < 3) {
        this.currentStep = (this.currentStep ?? 1) + 1;
        this.render();
      }
    });

    $html.find('[data-action="back"]').on('click', (ev) => {
      ev?.preventDefault();
      if ((this.currentStep ?? 1) > 1) {
        this.currentStep = (this.currentStep ?? 1) - 1;
        this.render();
      }
    });
  }

  /* -------------------------------------------- */
  /* Drag & Drop handling (staging area) */

  async _onDrop(event) {
    event.preventDefault();

    // If user is still at step 1, disallow drops
    if (this.currentStep === 1) {
      return ui.notifications?.warn?.('Avance para os próximos passos para adicionar habilidades.');
    }

    let dragData = {};
    try {
      dragData = TextEditor.getDragEventData(event);
    } catch (e) {
      const raw = event.dataTransfer?.getData('text/plain') || event.dataTransfer?.getData('text');
      try { dragData = JSON.parse(raw); } catch (_) { dragData = { uuid: raw }; }
    }

    const uuid = dragData?.uuid || dragData?.id || dragData;
    if (!uuid) return ui.notifications?.warn?.('Dados inválidos no arraste.');

    let item = null;
    try {
      console.log('LevelUpDialog | _onDrop | dragData/uuid', { dragData, uuid });
      item = await fromUuid(uuid);
      console.log('LevelUpDialog | _onDrop | fromUuid result', item);
    } catch (err) {
      console.error('Erro ao carregar UUID arrastado:', err);
      return ui.notifications?.warn?.('Não foi possível carregar o item arrastado.');
    }

    // fromUuid may return an object wrapper with an `object` property; prefer the document itself
    if (item?.object) {
      console.log('LevelUpDialog | _onDrop | unwrap object wrapper', { object: item.object });
      item = item.object;
    }
    if (!item) {
      console.log('LevelUpDialog | _onDrop | resolved item is falsy', item);
      return ui.notifications?.warn?.('O item arrastado não é um Item.');
    }
    try {
      console.log('LevelUpDialog | _onDrop | resolved item summary', { name: item.name, type: item.type, img: item.img, systemKeys: Object.keys(item.system || {}) });
    } catch (e) {
      console.debug('LevelUpDialog | _onDrop | failed to log item summary', e);
    }

    const dropEl = event.target.closest('[data-type][data-index]') || event.target.closest('.drop-zone');
    if (!dropEl) return ui.notifications?.warn?.('Drop fora de uma área válida.');

    const slotType = dropEl.dataset.type; // expected 'feature' | 'aptitude'
    const slotIndex = Number(dropEl.dataset.index ?? -1);
    if (!slotType || slotIndex < 0) return ui.notifications?.warn?.('Slot alvo inválido.');

    // Resolve item type with fallbacks (compendium items/documents may differ)
    const resolvedType = item.type || item.system?.type || item.data?.type || (item.toObject ? (item.toObject().type) : undefined) || 'item';

    // Step 2: only aptitudes (system uses 'aptidao')
    if (this.currentStep === 2) {
      if (resolvedType !== 'aptidao') {
        console.debug('LevelUpDialog | _onDrop | rejected aptitude by type', { resolvedType, item });
        return ui.notifications?.warn?.('Este slot aceita somente Aptidões (aptidao).');
      }
    }

    // Step 3: only features (accepta sinônimos como 'habilidade' usado no sistema)
    if (this.currentStep === 3) {
      const resolvedTypeNorm = _normalizarNomeClasse(resolvedType || '');
      const allowedFeatureTypes = ['feature', 'habilidade', 'habilidades', 'aptidao'];
      const allowedNorm = allowedFeatureTypes.map(t => _normalizarNomeClasse(t));
      if (!allowedNorm.includes(resolvedTypeNorm)) {
        console.debug('LevelUpDialog | _onDrop | rejected feature by type', { resolvedType, resolvedTypeNorm, allowedNorm, item });
        return ui.notifications?.warn?.('Este slot aceita somente Habilidades (feature / habilidade / aptidao).');
      }
    }

    try {
      const obj = item.toObject ? item.toObject() : duplicate(item);
      if (slotType === 'feature') this.selectedFeatures[slotIndex] = obj;
      else if (slotType === 'aptitude') this.selectedAptitudes[slotIndex] = obj;
    } catch (e) {
      console.warn('Falha ao clonar item arrastado, armazenando fallback:', e);
      const fallback = { name: item.name ?? 'Item', type: item.type ?? 'item', img: item.img ?? '', system: item.system ?? {} };
      if (slotType === 'feature') this.selectedFeatures[slotIndex] = fallback;
      else if (slotType === 'aptitude') this.selectedAptitudes[slotIndex] = fallback;
    }

    this.render();
  }

  /* -------------------------------------------- */

  /**
   * Ao confirmar o formulário: aplicar alterações no Ator e criar itens selecionados
   * Apenas executa no passo 3.
   */
  async _updateObject(event, formData) {
    console.log('DEBUG | LevelUpDialog | _updateObject called', { currentStep: this.currentStep, actorId: this.actor?.id });
    if (this.currentStep !== 3) {
      console.log('DEBUG | _updateObject aborted: not step 3');
      ui.notifications?.warn?.('Avance até o Passo 3 e clique em Concluir para aplicar a subida de nível.');
      return;
    }

    const detalhes = this.actor?.system?.detalhes ?? {};
    const classData = detalhes?.classe;
    const classIdRaw = (typeof classData === 'object') ? classData?.value : classData;
    const classId = _normalizarNomeClasse(classIdRaw || '');
    console.log('DEBUG | _updateObject | classIdRaw/classId', { classIdRaw, classId });
    const classesCfg = FEITICEIROS?.classes ?? {};
    const classCfg = classesCfg[classId];
    console.log('DEBUG | _updateObject | classCfg', classCfg);

    if (!classCfg) {
      ui.notifications?.error?.('Configuração de classe não encontrada. Abortando subida de nível.');
      return;
    }

    const currentLevel = Number(detalhes?.nivel?.value ?? 0);
    const nextLevel = currentLevel + 1;

    const hpGain = Number(classCfg?.hp?.perLevel ?? 0);
    const epGain = Number(classCfg?.ep?.perLevel ?? 0);

    // Determine whether to increment principal or secundary class level
    const detalhesNiveis = this.actor.system?.detalhes?.niveis ?? { principal: { value: 0 }, secundario: { value: 0 } };
    const nomeClassePrincipal = this.actor.system?.detalhes?.classe?.value ?? '';
    const nomeClasseSecundaria = this.actor.system?.detalhes?.multiclasse?.value ?? '';
    const alvoClasseNormalizada = _normalizarNomeClasse(classIdRaw || classId);

    let levelPath = 'system.detalhes.niveis.principal.value';
    if (_normalizarNomeClasse(nomeClassePrincipal) === alvoClasseNormalizada) levelPath = 'system.detalhes.niveis.principal.value';
    else if (_normalizarNomeClasse(nomeClasseSecundaria) === alvoClasseNormalizada) levelPath = 'system.detalhes.niveis.secundario.value';
    else levelPath = 'system.detalhes.niveis.principal.value';

    // First update the appropriate class-level counter so derived data recalculates maxima
    const levelUpdates = {};
    const curLevelVal = (levelPath.includes('principal')) ? (detalhesNiveis.principal?.value || 0) : (detalhesNiveis.secundario?.value || 0);
    levelUpdates[levelPath] = curLevelVal + 1;

    // Prepare embedded items to create from staging area
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

    try {
      console.log('DEBUG | _updateObject | levelUpdates, toCreate.length', { levelUpdates, toCreateLength: toCreate.length });
      // 1) increment class level (principal/secundario)
      await this.actor.update(levelUpdates);

      // 2) after derived recalculation, compute new current HP/EP to increase by per-level gain
      const sysAfter = this.actor.system ?? {};
      const curHpMax = Number(sysAfter.recursos?.hp?.max ?? 0);
      const curHpVal = Number(sysAfter.recursos?.hp?.value ?? 0);
      const curEpMax = Number(sysAfter.recursos?.energia?.max ?? 0);
      const curEpVal = Number(sysAfter.recursos?.energia?.value ?? 0);

      const resourceUpdates = {};
      // Increase current values by the per-level gain, not exceeding max
      if (hpGain) resourceUpdates['system.recursos.hp.value'] = Math.min(curHpVal + hpGain, curHpMax + hpGain);
      if (epGain) resourceUpdates['system.recursos.energia.value'] = Math.min(curEpVal + epGain, curEpMax + epGain);

      // Apply resource updates (current values). Max values are derived and will reflect the new level.
      if (Object.keys(resourceUpdates).length) await this.actor.update(resourceUpdates);

      // 3) Create embedded items
      if (toCreate.length) await this.actor.createEmbeddedDocuments('Item', toCreate);

      console.log('DEBUG | _updateObject | done');
      ui.notifications?.info?.('Subida de nível aplicada com sucesso.');
    } catch (e) {
      console.error('Erro ao aplicar subida de nível:', e);
      ui.notifications?.error?.('Falha ao aplicar subida de nível. Veja o console para mais detalhes.');
      throw e;
    }

    // Reset staging and re-render
    this.selectedFeatures = [];
    this.selectedAptitudes = [];
    this.render();
  }
}
