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

    // Options when opened from actor._onUpdate: { startLevel, gained, classId }
    this._luOptions = options || {};
    this.startLevel = Number(this._luOptions.startLevel ?? NaN);
    this.gained = Number(this._luOptions.gained ?? NaN);
    this.classIdFromOptions = this._luOptions.classId ?? null;

    // If startLevel & gained are provided, the actor already had its levels updated
    this.updatesActorLevels = !(Number.isFinite(this.startLevel) && Number.isFinite(this.gained));

    // Prepare per-level staging arrays
    const total = Number.isFinite(this.gained) ? Math.max(1, this.gained) : 1;
    this.selectedFeatures = Array.from({ length: total }, () => []);
    this.selectedAptitudes = Array.from({ length: total }, () => []);

    this.currentStep = 1; // 1: preview, 2: aptitudes, 3: features
    this.currentLevelIndex = 0; // index into the gained levels (0..total-1)
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['feiticeiros-e-maldicoes', 'level-up'],
      template: 'systems/feiticeiros-e-maldicoes/templates/apps/level-up.hbs',
      width: 680,
      height: 'auto',
      // Allow dragging from compendium/directory items into .drop-zone
      dragDrop: [{ dragSelector: '.directory-item, .compendium-item, .item, .entity-list .directory-item', dropSelector: '.drop-zone' }, { dragSelector: null, dropSelector: '.drop-zone' }],
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
    const classesCfg = FEITICEIROS?.classes ?? {};
    // Robust lookup: try raw key, then normalized match against existing keys
    const normalizeKey = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    let classCfg = null;
    if (classIdRaw && classesCfg && classesCfg[classIdRaw]) classCfg = classesCfg[classIdRaw];
    if (!classCfg && classIdRaw) {
      const target = normalizeKey(classIdRaw);
      for (const k of Object.keys(classesCfg)) {
        if (normalizeKey(k) === target) { classCfg = classesCfg[k]; break; }
      }
    }

    if (!classCfg) {
      return {
        ...data,
        actor: this.actor,
        error: `Configuração de classe não encontrada: "${classIdRaw}"`,
      };
    }

    const currentLevel = Number(detalhes?.nivel?.value ?? 0);
    // Determine base level for progression display: if startLevel provided, use it; else use currentLevel
    const baseLevel = Number.isFinite(this.startLevel) ? this.startLevel : currentLevel;
    const index = Number(this.currentLevelIndex ?? 0);
    const levelToShow = baseLevel + index + 1;

    // Gains come from the configuration (per-level)
    const hpGain = Number(classCfg?.hp?.perLevel ?? 0);
    const epGain = Number(classCfg?.ep?.perLevel ?? 0);
    const nextLevel = levelToShow;

    // Progression slots as defined in config for the specific level being shown
    const progression = classCfg?.progression?.[String(levelToShow)] ?? {};
    const featureCount = Number(progression?.features ?? 0);
    const aptitudeCount = Number(progression?.aptitudes ?? 0);

    const featureSlots = Array.from({ length: Math.max(0, featureCount) }, (_, i) => (this.selectedFeatures[index] ?? [])[i] ?? null);
    const aptitudeSlots = Array.from({ length: Math.max(0, aptitudeCount) }, (_, i) => (this.selectedAptitudes[index] ?? [])[i] ?? null);

    // --- Origin (Maldição) fixed items for this level (if any)
    let originItems = [];
    try {
      const origemVal = this.actor.system?.detalhes?.origem?.value ?? this.actor.system?.detalhes?.origem;
      const maldRace = this.actor.system?.detalhes?.racaMaldicao?.value ?? this.actor.system?.detalhes?.racaMaldicao;
      if (String(origemVal) === 'Maldição' && maldRace) {
        const originCfg = FEITICEIROS?.origins?.maldicao ?? {};
        const variantCfg = originCfg[String(maldRace)] || originCfg[maldRace] || originCfg[String(maldRace)?.toString?.()] || null;
        const originProg = variantCfg?.progression?.[String(levelToShow)] ?? {};
        const originFixed = Array.isArray(originProg?.fixed) ? originProg.fixed : [];
        for (const ref of originFixed) {
          try {
            if (typeof ref === 'object' && ref.pack && ref.name) {
              const pack = game.packs.get(ref.pack);
              if (pack) {
                const idx = await pack.getIndex();
                const entry = idx.find(e => e.name === ref.name);
                if (entry) {
                  const doc = await fromUuid(`Compendium.${ref.pack}.Item.${entry._id}`);
                  const obj = doc?.toObject ? doc.toObject() : (doc?.object?.toObject ? doc.object.toObject() : null);
                  if (obj) originItems.push(obj);
                }
              }
            }
            else if (typeof ref === 'string') {
              const resolved = await fromUuid(ref).catch(() => null);
              const obj = resolved?.toObject ? resolved.toObject() : (resolved?.object?.toObject ? resolved.object.toObject() : null);
              if (obj) originItems.push(obj);
            }
            else if (typeof ref === 'object') {
              originItems.push(ref);
            }
          } catch (e) { /* ignore per-item resolution errors */ }
        }
      }
    } catch (e) { /* ignore */ }

    // Build step order: always 3 base steps (preview, aptitude, feature).
    // If originItems exist for this level, insert an extra 'origin' step after preview.
    const availableSteps = ['preview', 'aptitude', 'feature'];
    if ((originItems?.length ?? 0) > 0) availableSteps.splice(1, 0, 'origin');
    const totalSteps = Math.max(3, availableSteps.length);
    // Ensure currentStep is within range
    if (!this.currentStep || this.currentStep < 1) this.currentStep = 1;
    if (this.currentStep > totalSteps) this.currentStep = totalSteps;

    const stepName = availableSteps[(this.currentStep - 1) || 0] || 'preview';

    // Expose step booleans for template
    const isStepPreview = stepName === 'preview';
    const isStepOrigin = stepName === 'origin';
    const isStepAptitude = stepName === 'aptitude';
    const isStepFeature = stepName === 'feature';

    // Store availableSteps so activateListeners/_updateObject can access navigation
    this._availableSteps = availableSteps;

    // Determine a usable classId string for templates (the key present in FEITICEIROS.classes)
    let classId = classIdRaw ?? '';
    if (classCfg) {
      const found = Object.entries(classesCfg).find(([k, v]) => v === classCfg);
      if (found) classId = found[0];
    }

    return {
      ...data,
      actor: this.actor,
      step: this.currentStep,
      stepName,
      isStepPreview,
      isStepOrigin,
      isStepAptitude,
      isStepFeature,
      totalSteps,
      hasAptitudeSlots: aptitudeCount > 0,
      hasFeatureSlots: featureCount > 0,
      // Level sequencing info
      levelToShow,
      levelStep: index + 1,
      totalLevelSteps: Number.isFinite(this.gained) ? Math.max(1, this.gained) : 1,
      updatesActorLevels: this.updatesActorLevels,
      // Expose counts for the template (Portuguese keys also supported)
      featureCount,
      aptitudeCount,
      progressionHabilidades: Number(progression?.features ?? 0),
      progressionAptidoes: Number(progression?.aptitudes ?? 0),
      classId,
      classCfg,
      currentLevel,
      nextLevel,
      hpGain,
      epGain,
      progression,
      featureSlots,
      aptitudeSlots,
      originItems
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const $html = html instanceof jQuery ? html : $(html);

    $html.find('[data-action="next"]').on('click', (ev) => {
      ev?.preventDefault();
      const maxStep = (Array.isArray(this._availableSteps) ? this._availableSteps.length : 3);
      if ((this.currentStep ?? 1) < maxStep) {
        this.currentStep = (this.currentStep ?? 1) + 1;
        this.render();
        return;
      }
      // If at last step and there are more levels to process (dialog opened after actor update), advance to next level
      const total = Number.isFinite(this.gained) ? Math.max(1, this.gained) : 1;
      if (!this.updatesActorLevels && (this.currentLevelIndex < (total - 1))) {
        this.currentLevelIndex++;
        this.currentStep = 1;
        this.render();
        return;
      }
    });

    $html.find('[data-action="back"]').on('click', (ev) => {
      ev?.preventDefault();
      if ((this.currentStep ?? 1) > 1) {
        this.currentStep = (this.currentStep ?? 1) - 1;
        this.render();
        return;
      }
      // If at the first step and not the first level, go back to previous level's last step
      if (this.currentStep === 1 && this.currentLevelIndex > 0) {
        this.currentLevelIndex = Math.max(0, this.currentLevelIndex - 1);
        const prevMax = (Array.isArray(this._availableSteps) ? this._availableSteps.length : 3);
        this.currentStep = prevMax;
        this.render();
      }
    });
  }

  /* -------------------------------------------- */
  /* Drag & Drop handling (staging area) */

  async _onDrop(event) {
    event.preventDefault();

    // If user is still at preview step, disallow drops
    const stepNow = (Array.isArray(this._availableSteps) ? this._availableSteps[this.currentStep - 1] : 'preview');
    if (stepNow === 'preview') {
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

    // Step-based type validation: use dynamic step name
    if (stepNow === 'aptitude') {
      if (resolvedType !== 'aptidao') {
        console.debug('LevelUpDialog | _onDrop | rejected aptitude by type', { resolvedType, item });
        return ui.notifications?.warn?.('Este slot aceita somente Aptidões (aptidao).');
      }
    }
    if (stepNow === 'feature') {
      const resolvedTypeNorm = _normalizarNomeClasse(resolvedType || '');
      const allowedFeatureTypes = ['feature', 'habilidade', 'habilidades', 'aptidao'];
      const allowedNorm = allowedFeatureTypes.map(t => _normalizarNomeClasse(t));
      if (!allowedNorm.includes(resolvedTypeNorm)) {
        console.debug('LevelUpDialog | _onDrop | rejected feature by type', { resolvedType, resolvedTypeNorm, allowedNorm, item });
        return ui.notifications?.warn?.('Este slot aceita somente Habilidades (habilidade / feature / aptidao).');
      }
    }

    try {
      const obj = item.toObject ? item.toObject() : duplicate(item);
      const lvlIdx = Number(this.currentLevelIndex ?? 0);
      if (slotType === 'feature') {
        this.selectedFeatures[lvlIdx] = this.selectedFeatures[lvlIdx] ?? [];
        this.selectedFeatures[lvlIdx][slotIndex] = obj;
      }
      else if (slotType === 'aptitude') {
        this.selectedAptitudes[lvlIdx] = this.selectedAptitudes[lvlIdx] ?? [];
        this.selectedAptitudes[lvlIdx][slotIndex] = obj;
      }
    } catch (e) {
      console.warn('Falha ao clonar item arrastado, armazenando fallback:', e);
      const fallback = { name: item.name ?? 'Item', type: item.type ?? 'item', img: item.img ?? '', system: item.system ?? {} };
      const lvlIdx = Number(this.currentLevelIndex ?? 0);
      if (slotType === 'feature') {
        this.selectedFeatures[lvlIdx] = this.selectedFeatures[lvlIdx] ?? [];
        this.selectedFeatures[lvlIdx][slotIndex] = fallback;
      }
      else if (slotType === 'aptitude') {
        this.selectedAptitudes[lvlIdx] = this.selectedAptitudes[lvlIdx] ?? [];
        this.selectedAptitudes[lvlIdx][slotIndex] = fallback;
      }
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
    const stepNow = (Array.isArray(this._availableSteps) ? this._availableSteps[this.currentStep - 1] : null) || null;
    if (stepNow !== 'feature') {
      console.log('DEBUG | _updateObject aborted: not final feature step', { stepNow, currentStep: this.currentStep, availableSteps: this._availableSteps });
      ui.notifications?.warn?.('Avance até o último passo e clique em Concluir para aplicar a subida de nível.');
      return;
    }

    const detalhes = this.actor?.system?.detalhes ?? {};
    const classData = detalhes?.classe;
    const classIdRaw = (typeof classData === 'object') ? classData?.value : classData;
    console.log('DEBUG | _updateObject | classIdRaw', { classIdRaw });
    const classesCfg = FEITICEIROS?.classes ?? {};
    const normalizeKey2 = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    let classCfg2 = null;
    if (classIdRaw && classesCfg && classesCfg[classIdRaw]) classCfg2 = classesCfg[classIdRaw];
    if (!classCfg2 && classIdRaw) {
      const target2 = normalizeKey2(classIdRaw);
      for (const k of Object.keys(classesCfg)) {
        if (normalizeKey2(k) === target2) { classCfg2 = classesCfg[k]; break; }
      }
    }
    console.log('DEBUG | _updateObject | classCfg', classCfg2);

    if (!classCfg2) {
      ui.notifications?.error?.('Configuração de classe não encontrada. Abortando subida de nível.');
      return;
    }
    const classCfg = classCfg2;

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

    // Prepare embedded items to create from staging area (flatten selections across all processed levels)
    const toCreate = [];
    const selectionsFeatures = Array.isArray(this.selectedFeatures) ? this.selectedFeatures : [this.selectedFeatures];
    const selectionsAptitudes = Array.isArray(this.selectedAptitudes) ? this.selectedAptitudes : [this.selectedAptitudes];
    for (const arr of selectionsFeatures) {
      for (const sel of (arr ?? [])) if (sel) {
        const copy = duplicate(sel);
        delete copy._id; delete copy.id;
        toCreate.push(copy);
      }
    }
    for (const arr of selectionsAptitudes) {
      for (const sel of (arr ?? [])) if (sel) {
        const copy = duplicate(sel);
        delete copy._id; delete copy.id;
        toCreate.push(copy);
      }
    }

    try {
      console.log('DEBUG | _updateObject | levelUpdates, toCreate.length', { levelUpdates, toCreateLength: toCreate.length });
      // If this dialog should increment actor levels itself (manual mode), perform the single-level increment and resource updates.
      if (this.updatesActorLevels) {
        // 1) increment class level (principal/secundario)
        await this.actor.update(levelUpdates);

        // 2) after derived recalculation, compute new current HP/EP to increase by per-level gain
        const sysAfter = this.actor.system ?? {};
        const curHpMax = Number(sysAfter.recursos?.hp?.max ?? 0);
        const curHpVal = Number(sysAfter.recursos?.hp?.value ?? 0);
        const curEpMax = Number(sysAfter.recursos?.energia?.max ?? 0);
        const curEpVal = Number(sysAfter.recursos?.energia?.value ?? 0);

        const resourceUpdates = {};
        // Increase current values by the per-level gain; cap at max when available
        if (hpGain) {
          if (curHpMax > 0) resourceUpdates['system.recursos.hp.value'] = Math.min(curHpVal + hpGain, curHpMax);
          else resourceUpdates['system.recursos.hp.value'] = curHpVal + hpGain;
        }
        if (epGain) {
          if (curEpMax > 0) resourceUpdates['system.recursos.energia.value'] = Math.min(curEpVal + epGain, curEpMax);
          else resourceUpdates['system.recursos.energia.value'] = curEpVal + epGain;
        }

        // Apply resource updates (current values). Max values are derived and will reflect the new level.
        if (Object.keys(resourceUpdates).length) await this.actor.update(resourceUpdates);
      }

      // 3) Create embedded items (for both manual and post-update flows)
      if (toCreate.length) await this.actor.createEmbeddedDocuments('Item', toCreate);

      console.log('DEBUG | _updateObject | done');
      ui.notifications?.info?.('Subida de nível aplicada com sucesso.');
    } catch (e) {
      console.error('Erro ao aplicar subida de nível:', e);
      ui.notifications?.error?.('Falha ao aplicar subida de nível. Veja o console para mais detalhes.');
      throw e;
    }

    // Reset staging and re-render
    const total = Array.isArray(this.selectedFeatures) ? this.selectedFeatures.length : 0;
    this.selectedFeatures = Array.from({ length: total }, () => []);
    this.selectedAptitudes = Array.from({ length: total }, () => []);
    this.render();
  }
}
