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

function _normalizarNomeItem(str = '') {
  return String(str).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function _fixSystemIconPath(img = '') {
  const s = String(img || '').trim();
  if (!s) return s;
  if (s.startsWith('systems/') || s.startsWith('/systems/')) return s;
  // Ícones do sistema estão em /systems/<systemId>/icons/...
  if (s.startsWith('icons/equipment/') || s.startsWith('icons/weapons/') || s.startsWith('icons/axes/')) {
    const sysId = game?.system?.id || 'feiticeiros-e-maldicoes';
    return `/systems/${sysId}/${s}`;
  }
  return s;
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

    // Options when opened from actor._onUpdate: { startTotalLevel, startClassLevel, gained, classId, track }
    this._luOptions = options || {};
    this.startTotalLevel = Number(this._luOptions.startTotalLevel ?? this._luOptions.startLevel ?? NaN);
    this.startClassLevel = Number(this._luOptions.startClassLevel ?? NaN);
    this.gained = Number(this._luOptions.gained ?? NaN);
    this.classIdFromOptions = this._luOptions.classId ?? null;
    this.trackFromOptions = this._luOptions.track ?? null;

    // If startLevel & gained are provided, the actor already had its levels updated
    this.updatesActorLevels = !(Number.isFinite(this.startTotalLevel) && Number.isFinite(this.gained));

    // Track selection (principal/secundario). In post-update mode, it should be provided.
    this.levelTrack = this.trackFromOptions ?? 'principal';

    // Prepare per-level staging arrays
    const total = Number.isFinite(this.gained) ? Math.max(1, this.gained) : 1;
    this.selectedFeatures = Array.from({ length: total }, () => []);
    this.selectedAptitudes = Array.from({ length: total }, () => []);

    // Common gains per total level
    this.attributeAllocations = Array.from({ length: total }, () => ({}));
    this.masterySelections = Array.from({ length: total }, () => null);

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
    const nextLevel = _getActorNivel(this.actor) + 1;
    const name = this.actor?.name ?? 'Personagem';
    return `Ascensão — ${name} → Nível ${nextLevel}`;
  }

  /**
    * Prepare data for the template using FEITICEIROS.classes
   */
  async getData(options = {}) {
    const data = await super.getData(options);

    const normalizeKey = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    const resolveClassCfg = (classesCfg, raw) => {
      if (!raw) return { id: null, cfg: null };
      if (classesCfg && classesCfg[raw]) return { id: raw, cfg: classesCfg[raw] };
      const target = normalizeKey(raw);
      for (const [k, v] of Object.entries(classesCfg ?? {})) {
        if (normalizeKey(k) === target) return { id: k, cfg: v };
        if (normalizeKey(v?.label) === target) return { id: k, cfg: v };
      }
      return { id: null, cfg: null };
    };

    // Track options
    const detalhes = this.actor?.system?.detalhes ?? {};
    const classePrincipalRaw = (typeof detalhes?.classe === 'object') ? detalhes?.classe?.value : detalhes?.classe;
    const classeSecundariaRaw = (typeof detalhes?.multiclasse === 'object') ? detalhes?.multiclasse?.value : detalhes?.multiclasse;

    const hasSec = Boolean(classeSecundariaRaw && String(classeSecundariaRaw).trim() && String(classeSecundariaRaw) !== 'Nenhuma');
    let trackOptions = [
      { id: 'principal', label: `Principal: ${classePrincipalRaw || '—'}` },
      ...(hasSec ? [{ id: 'secundario', label: `Secundário: ${classeSecundariaRaw}` }] : [])
    ];

    if (!hasSec) this.levelTrack = 'principal';
    if (this.levelTrack !== 'principal' && this.levelTrack !== 'secundario') this.levelTrack = 'principal';

    trackOptions = trackOptions.map(o => ({ ...o, checked: o.id === this.levelTrack }));

    // Read the class identifier from actor, based on selected track.
    const classIdRawFromTrack = (this.levelTrack === 'secundario') ? classeSecundariaRaw : classePrincipalRaw;
    const classIdRaw = this.classIdFromOptions ?? classIdRawFromTrack;
    const classesCfg = FEITICEIROS?.classes ?? {};
    const resolved = resolveClassCfg(classesCfg, classIdRaw);
    const classCfg = resolved.cfg;

    if (!classCfg) {
      return {
        ...data,
        actor: this.actor,
        error: `Configuração de classe não encontrada: "${classIdRaw}"`,
      };
    }

    const currentTotalLevel = _getActorNivel(this.actor);
    const currentClassLevel = (this.levelTrack === 'secundario')
      ? (Number(detalhes?.niveis?.secundario?.value ?? 0) || 0)
      : (Number(detalhes?.niveis?.principal?.value ?? 0) || 0);

    // Determine base levels for progression display
    const baseTotalLevel = Number.isFinite(this.startTotalLevel) ? this.startTotalLevel : currentTotalLevel;
    const baseClassLevel = Number.isFinite(this.startClassLevel) ? this.startClassLevel
      : (this.updatesActorLevels ? currentClassLevel : Math.max(0, currentClassLevel - (Number.isFinite(this.gained) ? this.gained : 0)));

    const index = Number(this.currentLevelIndex ?? 0);
    const classLevelToShow = baseClassLevel + index + 1;
    const totalLevelToShow = baseTotalLevel + index + 1;

    const attrPointLevels = new Set([4, 8, 12, 16, 20]);
    const getsAttributePoints = attrPointLevels.has(Number(totalLevelToShow));
    const attributePoints = getsAttributePoints ? 2 : 0;
    const getsMastery = Number(totalLevelToShow) === 10;

    // Gains preview (approx): PV fixo + CON; no nível 1 do personagem usa PV inicial.
    const conMod = Number(this.actor?.system?.atributos?.constituicao?.mod ?? 0) || 0;
    const totalBefore = totalLevelToShow - 1;
    const hpGain = (totalBefore <= 0)
      ? (Number(classCfg?.hp?.initial ?? 0) + conMod)
      : (Number(classCfg?.hp?.perLevelFixed ?? 0) + conMod);
    const epGain = Number(classCfg?.ep?.perLevel ?? 0);
    const nextLevel = totalLevelToShow;

    // Progression slots as defined in config for the specific level being shown
    const progression = classCfg?.progression?.[String(classLevelToShow)] ?? {};
    const featureCount = Number(progression?.features ?? 0);
    const aptitudeCount = Number(progression?.aptitudes ?? 0);

    const featureSlots = Array.from({ length: Math.max(0, featureCount) }, (_, i) => (this.selectedFeatures[index] ?? [])[i] ?? null);
    const aptitudeSlots = Array.from({ length: Math.max(0, aptitudeCount) }, (_, i) => (this.selectedAptitudes[index] ?? [])[i] ?? null);

    // --- Class fixed items up to THIS class level (if any)
    let classFixedItems = [];
    let hasClassFixed = false;
    try {
      const fixedRefs = [];
      for (let lvl = 1; lvl <= Number(classLevelToShow); lvl++) {
        const p = classCfg?.progression?.[String(lvl)] ?? {};
        const fixed = Array.isArray(p?.fixed) ? p.fixed : [];
        for (const ref of fixed) fixedRefs.push({ ref, level: lvl });
      }

      hasClassFixed = fixedRefs.length > 0;
      const unresolved = [];

      for (const { ref, level } of fixedRefs) {
        try {
          if (typeof ref === 'object' && ref.pack && ref.name) {
            const pack = game.packs.get(ref.pack) || game.packs.get(`world.${ref.pack}`) || game.packs.get(String(ref.pack).replace(/^world\./, ''));
            if (pack) {
              const idx = await pack.getIndex();
              const targetName = _normalizarNomeItem(ref.name);
              const entry = idx.find(e => _normalizarNomeItem(e.name) === targetName);
              if (entry) {
                const doc = await fromUuid(`Compendium.${pack.collection}.Item.${entry._id}`);
                const obj = doc?.toObject ? doc.toObject() : (doc?.object?.toObject ? doc.object.toObject() : null);
                if (obj) {
                  obj.fixedLevel = level;
                  classFixedItems.push(obj);
                } else {
                  unresolved.push({ ref, level, reason: 'doc-null' });
                }
              } else {
                unresolved.push({ ref, level, reason: 'not-found' });
              }
            } else {
              unresolved.push({ ref, level, reason: 'pack-missing' });
            }

            // Fallback placeholder so the player still sees what's expected.
            if (!classFixedItems.some(i => _normalizarNomeItem(i?.name) === _normalizarNomeItem(ref.name))) {
              classFixedItems.push({
                name: ref.name,
                type: 'habilidade',
                img: 'icons/svg/aura.svg',
                unresolved: true,
                pack: ref.pack,
                fixedLevel: level
              });
            }
          }
          else if (typeof ref === 'string') {
            const resolved = await fromUuid(ref).catch(() => null);
            const obj = resolved?.toObject ? resolved.toObject() : (resolved?.object?.toObject ? resolved.object.toObject() : null);
            if (obj) {
              obj.fixedLevel = level;
              classFixedItems.push(obj);
            } else {
              classFixedItems.push({ name: ref, type: 'habilidade', img: 'icons/svg/aura.svg', unresolved: true, fixedLevel: level });
              unresolved.push({ ref, level, reason: 'uuid-not-resolved' });
            }
          }
          else if (typeof ref === 'object') {
            classFixedItems.push({ ...ref, fixedLevel: level });
          }
        } catch (e) { /* ignore per-item resolution errors */ }
      }

      if (unresolved.length) {
        try {
          console.warn('[FEITICEIROS] LevelUpDialog | algumas habilidades fixas não foram resolvidas do compêndio', {
            actor: { id: this.actor?.id, name: this.actor?.name },
            classId,
            classLevelToShow,
            unresolved
          });
        } catch (_) { /* ignore */ }
      }
    } catch (e) { /* ignore */ }

    // --- Origin (Maldição) fixed items for this level (if any)
    let originItems = [];
    try {
      const origemVal = this.actor.system?.detalhes?.origem?.value ?? this.actor.system?.detalhes?.origem;
      const maldRace = this.actor.system?.detalhes?.racaMaldicao?.value ?? this.actor.system?.detalhes?.racaMaldicao;
      if (String(origemVal) === 'Maldição' && maldRace) {
        const originCfg = FEITICEIROS?.origins?.maldicao ?? {};
        const variantCfg = originCfg[String(maldRace)] || originCfg[maldRace] || originCfg[String(maldRace)?.toString?.()] || null;
        const originProg = variantCfg?.progression?.[String(totalLevelToShow)] ?? {};
        const originFixed = Array.isArray(originProg?.fixed) ? originProg.fixed : [];
        for (const ref of originFixed) {
          try {
            if (typeof ref === 'object' && ref.pack && ref.name) {
              const pack = game.packs.get(ref.pack);
              if (pack) {
                const idx = await pack.getIndex();
                const targetName = _normalizarNomeItem(ref.name);
                const entry = idx.find(e => _normalizarNomeItem(e.name) === targetName);
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

    // Build step order for THIS level.
    // Insert optional common steps after preview.
    const availableSteps = ['preview'];
    if (hasClassFixed) availableSteps.push('classFixed');
    if (getsAttributePoints) availableSteps.push('attributes');
    if (getsMastery) availableSteps.push('mastery');
    if ((originItems?.length ?? 0) > 0) availableSteps.push('origin');
    // Only show drop steps when there are slots.
    if (aptitudeCount > 0) availableSteps.push('aptitude');
    if (featureCount > 0) availableSteps.push('feature');
    const totalSteps = Math.max(1, availableSteps.length);
    // Ensure currentStep is within range
    if (!this.currentStep || this.currentStep < 1) this.currentStep = 1;
    if (this.currentStep > totalSteps) this.currentStep = totalSteps;

    const stepName = availableSteps[(this.currentStep - 1) || 0] || 'preview';

    // Expose step booleans for template
    const isStepPreview = stepName === 'preview';
    const isStepClassFixed = stepName === 'classFixed';
    const isStepAttributes = stepName === 'attributes';
    const isStepMastery = stepName === 'mastery';
    const isStepOrigin = stepName === 'origin';
    const isStepAptitude = stepName === 'aptitude';
    const isStepFeature = stepName === 'feature';

    // Store availableSteps so activateListeners/_updateObject can access navigation
    this._availableSteps = availableSteps;

    // Determine a usable classId string for templates (the key present in FEITICEIROS.classes)
    const classId = resolved?.id ?? (classIdRaw ?? '');

    // Attributes UI state
    const atributos = this.actor?.system?.atributos ?? {};
    const atributoList = Object.entries(atributos).map(([key, a]) => {
      const added = Number(this.attributeAllocations?.[index]?.[key] ?? 0) || 0;
      return { key, label: a?.label ?? key, base: Number(a?.value ?? 0) || 0, added };
    });
    const spentAttr = atributoList.reduce((acc, a) => acc + (Number(a.added) || 0), 0);
    const remainingAttr = Math.max(0, attributePoints - spentAttr);

    // Mastery UI state
    const pericias = this.actor?.system?.pericias ?? {};
    const selectedMastery = this.masterySelections?.[index] ?? null;
    const periciaOptions = Object.entries(pericias).map(([key, p]) => ({
      key,
      label: p?.label ?? key,
      value: Number(p?.value ?? 0) || 0,
      isMaster: (Number(p?.value ?? 0) || 0) >= 2,
      selected: selectedMastery === key
    }));

    const commonGains = [];
    if (getsAttributePoints) commonGains.push('+2 Pontos de Atributo');
    if (getsMastery) commonGains.push('Maestria em Perícia (escolha 1)');
    if ([5, 9, 13, 17].includes(Number(totalLevelToShow))) commonGains.push('+1 Bônus de Treinamento');

    return {
      ...data,
      actor: this.actor,
      canChooseTrack: this.updatesActorLevels && hasSec,
      trackOptions,
      levelTrack: this.levelTrack,
      step: this.currentStep,
      stepName,
      isStepPreview,
      isStepClassFixed,
      isStepAttributes,
      isStepMastery,
      isStepOrigin,
      isStepAptitude,
      isStepFeature,
      totalSteps,
      hasAptitudeSlots: aptitudeCount > 0,
      hasFeatureSlots: featureCount > 0,
      // Level sequencing info
      totalLevelToShow,
      classLevelToShow,
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
      currentTotalLevel,
      currentClassLevel,
      nextLevel,
      hpGain,
      epGain,
      progression,
      featureSlots,
      aptitudeSlots,
      classFixedItems,
      originItems,
      commonGains,
      attributePoints,
      atributoList,
      remainingAttr,
      periciaOptions,
      selectedMastery,
      isFinalLevelStep: (index + 1) === (Number.isFinite(this.gained) ? Math.max(1, this.gained) : 1)
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const $html = html instanceof jQuery ? html : $(html);

    // ---------- Attributes allocation (with global limit) ----------
    const _getAttributePointsForIndex = (idx) => {
      const baseTotalLevel = Number.isFinite(this.startTotalLevel) ? this.startTotalLevel : _getActorNivel(this.actor);
      const totalLevelToShow = baseTotalLevel + Number(idx ?? 0) + 1;
      return [4, 8, 12, 16, 20].includes(Number(totalLevelToShow)) ? 2 : 0;
    };

    const _clampAndSetAttr = (key, desired) => {
      const idx = Number(this.currentLevelIndex ?? 0);
      const attributePoints = _getAttributePointsForIndex(idx);
      this.attributeAllocations[idx] = this.attributeAllocations[idx] ?? {};
      const allocations = this.attributeAllocations[idx];

      const desiredInt = Math.max(0, Math.floor(Number(desired ?? 0) || 0));
      const otherSpent = Object.entries(allocations).reduce((sum, [k, v]) => {
        if (k === key) return sum;
        return sum + (Number(v) || 0);
      }, 0);
      const maxForKey = Math.max(0, attributePoints - otherSpent);
      const next = Math.min(desiredInt, maxForKey);

      allocations[key] = next;
      return next;
    };

    // Use event delegation so it always works after re-renders
    $html.on('change', '[data-action="attr-change"]', (ev) => {
      const el = ev?.currentTarget;
      const key = el?.dataset?.key;
      if (!key) return;
      const next = _clampAndSetAttr(key, el?.value);
      try { $(el).val(String(next)); } catch (_) { /* ignore */ }
      this.render();
    });

    $html.on('click', '[data-action="attr-inc"]', (ev) => {
      ev?.preventDefault();
      const btn = ev?.currentTarget;
      const key = btn?.dataset?.key;
      if (!key) return;
      const idx = Number(this.currentLevelIndex ?? 0);
      const current = Number(this.attributeAllocations?.[idx]?.[key] ?? 0) || 0;
      _clampAndSetAttr(key, current + 1);
      this.render();
    });

    $html.on('click', '[data-action="attr-dec"]', (ev) => {
      ev?.preventDefault();
      const btn = ev?.currentTarget;
      const key = btn?.dataset?.key;
      if (!key) return;
      const idx = Number(this.currentLevelIndex ?? 0);
      const current = Number(this.attributeAllocations?.[idx]?.[key] ?? 0) || 0;
      _clampAndSetAttr(key, current - 1);
      this.render();
    });

    // Mastery selection
    $html.find('select[name="masterySkill"]').on('change', (ev) => {
      const v = ev?.currentTarget?.value ?? null;
      const idx = Number(this.currentLevelIndex ?? 0);
      this.masterySelections[idx] = v || null;
    });

    $html.find('input[name="levelTrack"]').on('change', (ev) => {
      const v = ev?.currentTarget?.value;
      if (v === 'principal' || v === 'secundario') {
        this.levelTrack = v;
        this.render();
      }
    });

    $html.find('[data-action="next"]').on('click', (ev) => {
      ev?.preventDefault();

      // Step validation: don't allow skipping required slots
      try {
        const detalhes = this.actor?.system?.detalhes ?? {};
        const classesCfg = FEITICEIROS?.classes ?? {};
        const normalizeKey = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        const resolveClassCfg = (raw) => {
          if (!raw) return { id: null, cfg: null };
          if (classesCfg && classesCfg[raw]) return { id: raw, cfg: classesCfg[raw] };
          const target = normalizeKey(raw);
          for (const [k, v] of Object.entries(classesCfg ?? {})) {
            if (normalizeKey(k) === target) return { id: k, cfg: v };
            if (normalizeKey(v?.label) === target) return { id: k, cfg: v };
          }
          return { id: null, cfg: null };
        };

        const classRaw = (this.levelTrack === 'secundario')
          ? ((typeof detalhes?.multiclasse === 'object') ? detalhes?.multiclasse?.value : detalhes?.multiclasse)
          : ((typeof detalhes?.classe === 'object') ? detalhes?.classe?.value : detalhes?.classe);

        const resolved = resolveClassCfg(this.classIdFromOptions ?? classRaw);
        const classCfg = resolved?.cfg;

        const idx = Number(this.currentLevelIndex ?? 0);
        const baseClassLevel = Number.isFinite(this.startClassLevel) ? this.startClassLevel
          : ((this.levelTrack === 'secundario') ? (Number(detalhes?.niveis?.secundario?.value ?? 0) || 0) : (Number(detalhes?.niveis?.principal?.value ?? 0) || 0));
        const classLevelToShow = baseClassLevel + idx + 1;
        const prog = classCfg?.progression?.[String(classLevelToShow)] ?? {};
        const requiredFeatures = Number(prog?.features ?? 0) || 0;
        const requiredAptitudes = Number(prog?.aptitudes ?? 0) || 0;
        const filledFeatures = (this.selectedFeatures?.[idx] ?? []).filter(Boolean).length;
        const filledAptitudes = (this.selectedAptitudes?.[idx] ?? []).filter(Boolean).length;

        const stepName = (Array.isArray(this._availableSteps) ? this._availableSteps[this.currentStep - 1] : 'preview');

        // Common gains validation
        if (stepName === 'attributes') {
          const baseTotalLevel = Number.isFinite(this.startTotalLevel) ? this.startTotalLevel : _getActorNivel(this.actor);
          const totalLevelToShow = baseTotalLevel + idx + 1;
          const attributePoints = [4, 8, 12, 16, 20].includes(Number(totalLevelToShow)) ? 2 : 0;
          const allocations = this.attributeAllocations?.[idx] ?? {};
          const spent = Object.values(allocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
          const remaining = Math.max(0, attributePoints - spent);
          if (attributePoints > 0 && remaining !== 0) {
            ui.notifications?.warn?.(`Distribua todos os ${attributePoints} pontos de atributo antes de avançar.`);
            return;
          }
        }
        if (stepName === 'aptitude' && requiredAptitudes > 0 && filledAptitudes < requiredAptitudes) {
          ui.notifications?.warn?.('Preencha todos os slots de Aptidão antes de avançar.');
          return;
        }
        if (stepName === 'feature' && requiredFeatures > 0 && filledFeatures < requiredFeatures) {
          ui.notifications?.warn?.('Preencha todos os slots de Habilidade antes de avançar.');
          return;
        }
      } catch (e) { /* non-fatal */ }

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

    $html.find('[data-action="next-level"]').on('click', (ev) => {
      ev?.preventDefault();

      // Treat as finishing this level and moving to next, without submitting.
      const total = Number.isFinite(this.gained) ? Math.max(1, this.gained) : 1;
      if (this.currentLevelIndex < (total - 1)) {
        this.currentLevelIndex++;
        this.currentStep = 1;
        this.render();
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

    // Only allow drops on aptitude/feature steps
    const stepNow = (Array.isArray(this._availableSteps) ? this._availableSteps[this.currentStep - 1] : 'preview');
    if (stepNow !== 'aptitude' && stepNow !== 'feature') {
      return ui.notifications?.warn?.('Avance até os passos de Aptidão/Habilidade para adicionar itens.');
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
      const obj = item.toObject ? item.toObject() : foundry.utils.duplicate(item);
      if (obj && typeof obj === 'object') obj.img = _fixSystemIconPath(obj.img);
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
    const steps = Array.isArray(this._availableSteps) ? this._availableSteps : ['preview'];
    const maxStep = steps.length;
    if ((this.currentStep ?? 1) !== maxStep) {
      ui.notifications?.warn?.('Avance até o último passo e clique em Concluir para aplicar a subida de nível.');
      return;
    }

    const detalhes = this.actor?.system?.detalhes ?? {};
    const classData = (this.levelTrack === 'secundario') ? detalhes?.multiclasse : detalhes?.classe;
    const classIdRawFromTrack = (typeof classData === 'object') ? classData?.value : classData;
    const classIdRaw = this.classIdFromOptions ?? classIdRawFromTrack;
    console.log('DEBUG | _updateObject | classIdRaw', { classIdRaw });
    const classesCfg = FEITICEIROS?.classes ?? {};
    const normalizeKey2 = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    const resolveClassCfg2 = (raw) => {
      if (!raw) return { id: null, cfg: null };
      if (classesCfg && classesCfg[raw]) return { id: raw, cfg: classesCfg[raw] };
      const target2 = normalizeKey2(raw);
      for (const [k, v] of Object.entries(classesCfg ?? {})) {
        if (normalizeKey2(k) === target2) return { id: k, cfg: v };
        if (normalizeKey2(v?.label) === target2) return { id: k, cfg: v };
      }
      return { id: null, cfg: null };
    };
    const resolved2 = resolveClassCfg2(classIdRaw);
    const classCfg2 = resolved2.cfg;
    console.log('DEBUG | _updateObject | classCfg', classCfg2);

    if (!classCfg2) {
      ui.notifications?.error?.('Configuração de classe não encontrada. Abortando subida de nível.');
      return;
    }
    const classCfg = classCfg2;

    // Validate that all slots for the current batch are filled
    const idx = Number(this.currentLevelIndex ?? 0);
    const baseClassLevel = Number.isFinite(this.startClassLevel) ? this.startClassLevel
      : ((this.levelTrack === 'secundario') ? (Number(detalhes?.niveis?.secundario?.value ?? 0) || 0) : (Number(detalhes?.niveis?.principal?.value ?? 0) || 0));
    const classLevelToShow = baseClassLevel + idx + 1;
    const progressionNow = classCfg?.progression?.[String(classLevelToShow)] ?? {};
    const requiredFeatures = Number(progressionNow?.features ?? 0) || 0;
    const requiredAptitudes = Number(progressionNow?.aptitudes ?? 0) || 0;
    const filledFeatures = (this.selectedFeatures?.[idx] ?? []).filter(Boolean).length;
    const filledAptitudes = (this.selectedAptitudes?.[idx] ?? []).filter(Boolean).length;
    if (filledFeatures < requiredFeatures || filledAptitudes < requiredAptitudes) {
      ui.notifications?.warn?.('Preencha todos os slots obrigatórios antes de concluir a ascensão.');
      return;
    }

    // Validate mastery selection when required
    try {
      const detalhes = this.actor?.system?.detalhes ?? {};
      const totalLevelNow = _getActorNivel(this.actor);
      const baseTotal = Number.isFinite(this.startTotalLevel) ? this.startTotalLevel : totalLevelNow;
      const idxNow = Number(this.currentLevelIndex ?? 0);
      const totalLevelToShow = baseTotal + idxNow + 1;
      if (Number(totalLevelToShow) === 10) {
        const sel = this.masterySelections?.[idxNow] ?? null;
        if (!sel) {
          ui.notifications?.warn?.('Escolha uma perícia para receber Maestria.');
          return;
        }
      }
    } catch (_) {}

    // Determine whether to increment principal or secundary class level
    const detalhesNiveis = this.actor.system?.detalhes?.niveis ?? { principal: { value: 0 }, secundario: { value: 0 } };
    const levelPath = (this.levelTrack === 'secundario')
      ? 'system.detalhes.niveis.secundario.value'
      : 'system.detalhes.niveis.principal.value';

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
        const copy = foundry.utils.duplicate(sel);
        delete copy._id; delete copy.id;
        toCreate.push(copy);
      }
    }
    for (const arr of selectionsAptitudes) {
      for (const sel of (arr ?? [])) if (sel) {
        const copy = foundry.utils.duplicate(sel);
        delete copy._id; delete copy.id;
        toCreate.push(copy);
      }
    }

    try {
      console.log('DEBUG | _updateObject | levelUpdates, toCreate.length', { levelUpdates, toCreateLength: toCreate.length });
      // If this dialog should increment actor levels itself (manual mode), perform the single-level increment and resource updates.
      if (this.updatesActorLevels) {
        // Increment class level; Actor._onUpdate aplicará PV/PE, DV/DE e itens fixos.
        await this.actor.update(levelUpdates, { skipLevelUpDialog: true });
      }

      // Apply common gains (attributes + mastery) for the CURRENT shown total level
      const idx = Number(this.currentLevelIndex ?? 0);
      const sys = this.actor?.system ?? {};
      const totalNow = _getActorNivel(this.actor);
      const baseTotal = Number.isFinite(this.startTotalLevel) ? this.startTotalLevel : (this.updatesActorLevels ? (totalNow - 1) : totalNow);
      const totalLevelToApply = baseTotal + idx + 1;

      const updates = {};

      if ([4, 8, 12, 16, 20].includes(Number(totalLevelToApply))) {
        const alloc = this.attributeAllocations?.[idx] ?? {};
        // Enforce cap of 2 points
        const entries = Object.entries(alloc).map(([k, v]) => [k, Math.max(0, Math.floor(Number(v) || 0))]);
        const spent = entries.reduce((acc, [, v]) => acc + v, 0);
        if (spent !== 2) {
          ui.notifications?.warn?.('Distribua exatamente 2 pontos de atributo antes de concluir.');
          return;
        }
        for (const [k, v] of entries) {
          if (!v) continue;
          const base = Number(sys?.atributos?.[k]?.value ?? 0) || 0;
          updates[`system.atributos.${k}.value`] = base + v;
        }
      }

      if (Number(totalLevelToApply) === 10) {
        const skillKey = this.masterySelections?.[idx] ?? null;
        if (skillKey) {
          const current = Number(sys?.pericias?.[skillKey]?.value ?? 0) || 0;
          if (current < 2) updates[`system.pericias.${skillKey}.value`] = 2;
        }
      }

      if (Object.keys(updates).length) {
        await this.actor.update(updates, { skipLevelUpDialog: true });
      }

      // 3) Create embedded items (for both manual and post-update flows)
      if (toCreate.length) {
        try {
          const summary = toCreate.map(i => ({ name: i?.name, type: i?.type })).filter(s => s?.name);
          console.log('[FEITICEIROS] LevelUpDialog | criando itens selecionados', {
            actor: { id: this.actor?.id, name: this.actor?.name },
            track: this.levelTrack,
            count: summary.length,
            items: summary
          });
        } catch (_) { /* ignore */ }
        await this.actor.createEmbeddedDocuments('Item', toCreate);
      }

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
