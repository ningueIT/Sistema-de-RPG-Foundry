import LevelUpDialog from "../apps/level-up-dialog.mjs";
import { FEITICEIROS } from "../helpers/config.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class BoilerplateActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to defaults),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.

    // ----------------------------------------------------
    // APTIDÕES: GARANTE DEFAULTS PARA ATORES ANTIGOS
    // ----------------------------------------------------
    // Atores criados antes de existir `system.aptidoes` no template.json
    // não terão as chaves salvas; isso faz o {{#each}} do HBS ficar vazio.
    // Aqui mesclamos os defaults do model do sistema com os dados atuais.
    if (this.type === 'character') {
      const modelAptidoes = game?.system?.model?.Actor?.character?.aptidoes ?? {};

      if (Object.keys(modelAptidoes).length > 0) {
        this.system.aptidoes = foundry.utils.mergeObject(
          foundry.utils.deepClone(modelAptidoes),
          this.system.aptidoes ?? {},
          { inplace: false, overwrite: true }
        );
      } else {
        this.system.aptidoes = this.system.aptidoes ?? {};
      }

      // Safety: garante os grupos usados no template existirem.
      this.system.aptidoes.aura ??= {};
      this.system.aptidoes.controleELeitura ??= {};
      this.system.aptidoes.energiaReversa ??= {};
      this.system.aptidoes.dominio ??= {};
      this.system.aptidoes.barreiras ??= {};
      this.system.aptidoes.especiais ??= {};
      this.system.aptidoes.maldicaoAnatomia ??= {};
      this.system.aptidoes.maldicaoControleELeitura ??= {};
      this.system.aptidoes.maldicaoEspeciais ??= {};
    }
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const system = actorData.system;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
/**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Atalho para facilitar a escrita
    const system = actorData.system;

    // ----------------------------------------------------
    // 1. CÁLCULO DE NÍVEL (Soma das Classes)
    // ----------------------------------------------------
    // Usa '|| 0' para garantir que não quebre se o valor for nulo
    const nivelPrincipal = system.detalhes.niveis?.principal?.value || 0;
    const nivelSecundario = system.detalhes.niveis?.secundario?.value || 0;
    
    const nivelTotal = nivelPrincipal + nivelSecundario;

    // Atualiza o nível total na ficha (apenas visual/derivado)
    if (system.detalhes.nivel) system.detalhes.nivel.value = nivelTotal;

    // ----------------------------------------------------
    // 2. BÔNUS DE TREINAMENTO
    // ----------------------------------------------------
    // Fórmula: Começa em 2 e aumenta a cada 4 níveis (Ex: nv1=+2, nv5=+3)
    const bonusCalculado = 2 + Math.floor((nivelTotal - 1) / 4);
    
    if (system.detalhes.treinamento) system.detalhes.treinamento.value = bonusCalculado;

    // ----------------------------------------------------
    // 3. MODIFICADORES DE ATRIBUTO
    // ----------------------------------------------------
    // Fórmula: (Valor - 10) / 2 (Arredondado para baixo)
    for (let [key, atributo] of Object.entries(system.atributos)) {
        atributo.mod = Math.floor((atributo.value - 10) / 2);
    }

    // ----------------------------------------------------
    // 4. PV/PE MÁXIMOS (CÁLCULO AUTOMÁTICO POR CLASSE)
    // ----------------------------------------------------
    // PV: nível 1 = dado cheio + Mod CON; níveis seguintes = fixo médio + Mod CON.
    // PE: fixo por nível; classes conjuradoras somam atributo-chave apenas 1 vez.
    const CLASS_RULES = {
      "Lutador": { pvDieMax: 10, pvFixed: 6, pePerLevel: 4, caster: false },
      "Especialista em Combate": { pvDieMax: 10, pvFixed: 6, pePerLevel: 4, caster: false },
      "Especialista em Técnica": { pvDieMax: 8, pvFixed: 5, pePerLevel: 6, caster: true },
      "Controlador": { pvDieMax: 8, pvFixed: 5, pePerLevel: 5, caster: true },
      "Suporte": { pvDieMax: 8, pvFixed: 5, pePerLevel: 5, caster: true },
      "Restringido": { pvDieMax: 12, pvFixed: 7, pePerLevel: 0, caster: false }
    };

    const classePrincipal = system.detalhes?.classe?.value;
    const classeSecundaria = system.detalhes?.multiclasse?.value;

    const conMod = system.atributos?.constituicao?.mod ?? 0;
    const intMod = system.atributos?.inteligencia?.mod ?? 0;
    const sabMod = system.atributos?.sabedoria?.mod ?? 0;
    const atributoChaveMod = Math.max(intMod, sabMod);

    const entradasClasse = [];
    if (nivelPrincipal > 0 && classePrincipal) entradasClasse.push({ nome: classePrincipal, niveis: nivelPrincipal });
    if (nivelSecundario > 0 && classeSecundaria && classeSecundaria !== "Nenhuma") {
      entradasClasse.push({ nome: classeSecundaria, niveis: nivelSecundario });
    }

    if (system.recursos && nivelTotal > 0 && entradasClasse.length > 0) {
      const startingClassName = (nivelPrincipal > 0 ? classePrincipal : (classeSecundaria !== "Nenhuma" ? classeSecundaria : classePrincipal));

      let pvMax = 0;
      let peMax = 0;
      let temConjurador = false;

      for (const entry of entradasClasse) {
        const rules = CLASS_RULES[entry.nome] ?? { pvDieMax: 8, pvFixed: 5, pePerLevel: 4, caster: false };

        // Energia por nível
        peMax += (entry.niveis ?? 0) * (rules.pePerLevel ?? 0);
        if (rules.caster && (entry.niveis ?? 0) > 0) temConjurador = true;

        // Vida por nível
        if (entry.nome === startingClassName) {
          // nível 1 do personagem
          pvMax += (rules.pvDieMax ?? 0) + conMod;
          const restante = Math.max(0, (entry.niveis ?? 0) - 1);
          pvMax += restante * ((rules.pvFixed ?? 0) + conMod);
        } else {
          // níveis obtidos depois (multiclasse)
          pvMax += (entry.niveis ?? 0) * ((rules.pvFixed ?? 0) + conMod);
        }
      }

      // Conjuradores: soma atributo-chave uma única vez no total de PE.
      if (temConjurador && peMax > 0) {
        peMax += atributoChaveMod;
      }

      // Restringido: não ganha PE.
      if (classePrincipal === "Restringido" || classeSecundaria === "Restringido") {
        peMax = 0;
      }

      // Atualiza máximos (derivado, não persiste no banco)
      if (system.recursos.hp) system.recursos.hp.max = Math.max(0, pvMax);
      if (system.recursos.energia) system.recursos.energia.max = Math.max(0, peMax);

      // Garante que o atual não passe do máximo
      if (system.recursos.hp) system.recursos.hp.value = Math.min(system.recursos.hp.value ?? 0, system.recursos.hp.max ?? 0);
      if (system.recursos.energia) system.recursos.energia.value = Math.min(system.recursos.energia.value ?? 0, system.recursos.energia.max ?? 0);
    }

    // ----------------------------------------------------
    // 5. BARRAS DE PROGRESSO (Vida, Energia, etc.)
    // ----------------------------------------------------
    if (system.recursos) {
        for (let [key, resource] of Object.entries(system.recursos)) {
            // Evita divisão por zero
            if (resource.max > 0) {
                // Calcula a porcentagem e limita entre 0 e 100
                resource.percent = Math.max(0, Math.min(100, Math.round((resource.value / resource.max) * 100)));
            } else {
                resource.percent = 0;
            }
        }
    }

    // ----------------------------------------------------
    // 6. CÁLCULO DA CA (Classe de Armadura)
    // Fórmula: CA = BASE_VALUE + MODIFIER_DEX + BONUS_EQUIPMENT + BONUS_AD_HOC
    // ----------------------------------------------------
    try {
      const BASE_VALUE = Number(system.combate?.baseValue ?? 10) || 10;

      // MODIFIER_DEX: usa mod calculado ou tenta derivar do valor
      const dexAttr = system.atributos?.destreza ?? {};
      const MODIFIER_DEX = Number(dexAttr.mod ?? Math.floor((Number(dexAttr.value ?? 10) - 10) / 2)) || 0;

      // BONUS_EQUIPMENT: soma mitigação de armaduras/escudos entre os ITENS EQUIPADOS do ator
      // Além disso, computa separadamente o bônus de `uniforme` para mostrar no breakdown.
      let BONUS_EQUIPMENT_OTHERS = 0;
      let BONUS_UNIFORM = 0;
      try {
        for (const it of actorData.items ?? []) {
          const s = it?.system ?? {};
          // Considere apenas itens marcados como equipados
          const isEquipped = !!(s?.equipado || s?.equipped || s?.active);
          if (!isEquipped) continue;

          if (String(it.type) === 'uniforme') {
            BONUS_UNIFORM += Number(s?.uniforme?.total ?? s?.uniforme?.bonusCa ?? 0) || 0;
            continue;
          }

          BONUS_EQUIPMENT_OTHERS += Number(s?.bonus?.ca ?? s?.bonusCa ?? s?.mitigacao ?? 0) || 0;
          BONUS_EQUIPMENT_OTHERS += Number(s?.armor?.mitigacao ?? s?.armor?.value ?? 0) || 0;
          BONUS_EQUIPMENT_OTHERS += Number(s?.shield?.mitigacao ?? s?.shield?.value ?? 0) || 0;
        }
      } catch (e) {
        BONUS_EQUIPMENT_OTHERS = BONUS_EQUIPMENT_OTHERS || 0;
        BONUS_UNIFORM = BONUS_UNIFORM || 0;
      }

      const BONUS_EQUIPMENT = Number(BONUS_EQUIPMENT_OTHERS + BONUS_UNIFORM) || 0;

      // BONUS_AD_HOC: campos ad-hoc no sistema ou flags do sistema
      const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
      const flagBonuses = (actorData.flags ?? {})[sysId] ?? {};
      const fromFlags = Number(flagBonuses?.bonuses?.ca ?? flagBonuses?.ca ?? 0) || 0;
      const fromSystem = Number(system?.combate?.bonusAdHoc ?? system?.bonusAdHoc ?? system?.bonusCa ?? 0) || 0;
      const BONUS_AD_HOC = fromFlags + fromSystem;

      const caValue = BASE_VALUE + MODIFIER_DEX + BONUS_EQUIPMENT + BONUS_AD_HOC;

      system.combate = system.combate || {};
      system.combate.ca = {
        value: Number(caValue),
        breakdown: {
          base: Number(BASE_VALUE),
          dex: Number(MODIFIER_DEX),
          equipment: Number(BONUS_EQUIPMENT),
          uniform: Number(BONUS_UNIFORM),
          adHoc: Number(BONUS_AD_HOC)
        }
      };

      // Também aplica o valor calculado no campo de defesa existente na ficha
      system.combate.defesa = {
        value: Number(caValue),
        breakdown: {
          base: Number(BASE_VALUE),
          dex: Number(MODIFIER_DEX),
          equipment: Number(BONUS_EQUIPMENT),
          uniform: Number(BONUS_UNIFORM),
          adHoc: Number(BONUS_AD_HOC)
        }
      };

      // (debug log removed to avoid noisy output during UI interactions)
    } catch (e) {
      console.warn('Erro ao calcular CA:', e);
    }

    // ----------------------------------------------------
    // 7. ARMAS EQUIPADAS (expor até 2 armas para a UI)
    // ----------------------------------------------------
    try {
      const equippedWeapons = [];
      for (const it of actorData.items ?? []) {
        try {
          const s = it?.system ?? {};
          const isEquipped = !!(s?.equipado || s?.equipped || s?.active);
          if (!isEquipped) continue;
          if (String(it.type) !== 'arma') continue;
          equippedWeapons.push({ _id: it.id ?? it._id, name: it.name, img: it.img, system: s });
          if (equippedWeapons.length >= 2) break;
        } catch (e) { /* ignore single item parse errors */ }
      }
      system.combate = system.combate || {};
      system.combate.equippedWeapons = equippedWeapons;
    } catch (e) {
      console.warn('Erro ao compilar lista de armas equipadas:', e);
    }
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here.
    const system = actorData.system;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copia os valores dos atributos para o topo, para facilitar macros.
    // Ex: permite usar @forca em vez de @atributos.forca.value
    if (this.system.atributos) {
      for (let [key, atributo] of Object.entries(this.system.atributos)) {
        data[key] = atributo.value ?? 0;
      }
    }

    // Adiciona o Nível para rolagens (@nivel)
    if (this.system.detalhes?.nivel) {
      data.nivel = this.system.detalhes.nivel.value ?? 1;
    }
  }

  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  /* -------------------------------------------- */
  /* Level change automation                         */

  /**
   * Capture previous level values before an update so we can detect gains.
   */
  _preUpdate(changed, options, userId) {
    try {
      const detalhes = this.system?.detalhes ?? {};
      const nivelPrincipal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
      const nivelSecundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;
      this._preUpdateLevelSnapshot = { principal: nivelPrincipal, secundario: nivelSecundario, total: nivelPrincipal + nivelSecundario };
    } catch (e) {
      this._preUpdateLevelSnapshot = { principal: 0, secundario: 0, total: 0 };
    }
    return super._preUpdate?.(changed, options, userId);
  }

  /**
   * After update: if the actor gained level(s), apply HP/EP/training/fixed items and open LevelUpDialog when choices remain.
   */
  async _onUpdate(changed, options, userId) {
    await super._onUpdate?.(changed, options, userId);

    // Detect whether level fields were changed.
    const prev = this._preUpdateLevelSnapshot ?? { total: 0 };
    const detalhes = this.system?.detalhes ?? {};
    const nivelPrincipal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
    const nivelSecundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;
    const totalNow = nivelPrincipal + nivelSecundario;

    if (totalNow <= prev.total) return; // no level gain

    const gained = totalNow - prev.total;

    // Resolve class configuration (robust lookup: try raw key, then normalized matching)
    const classData = detalhes?.classe;
    const classIdRaw = (typeof classData === 'object') ? classData?.value : classData;
    const normalizeKey = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    const classesCfg = FEITICEIROS?.classes ?? {};
    let classCfg = null;
    if (classIdRaw && classesCfg && classesCfg[classIdRaw]) classCfg = classesCfg[classIdRaw];
    if (!classCfg && classIdRaw) {
      const target = normalizeKey(classIdRaw);
      for (const k of Object.keys(classesCfg)) {
        if (normalizeKey(k) === target) { classCfg = classesCfg[k]; break; }
      }
    }
    if (!classCfg) return;

    // Aggregate resource gains
    let totalHpGain = 0;
    let totalEpGain = 0;
    const toCreate = [];
    for (let i = 1; i <= gained; i++) {
      const levelReached = prev.total + i;
      totalHpGain += Number(classCfg?.hp?.perLevel ?? 0);
      totalEpGain += Number(classCfg?.ep?.perLevel ?? 0);

      const progression = classCfg?.progression?.[String(levelReached)] ?? {};
      // Apply training bonus if provided in progression for this level
      if (progression?.bTreinamento != null) {
        try {
          await this.update({ 'system.detalhes.treinamento.value': Number(progression.bTreinamento) });
        } catch (e) { /* non-fatal */ }
      }

      // Collect fixed items (if present) to create after resource updates
      const fixed = Array.isArray(progression?.fixed) ? progression.fixed : [];
      for (const entry of fixed) {
        // entry may be a UUID string (compendium) or an item-like object
        if (!entry) continue;
        toCreate.push(entry);
      }

      // -- Origem: Maldição (variante) --
      try {
        const origemVal = this.system?.detalhes?.origem?.value ?? this.system?.detalhes?.origem;
        const maldRace = this.system?.detalhes?.racaMaldicao?.value ?? this.system?.detalhes?.racaMaldicao;
        if (String(origemVal) === 'Maldição' && maldRace) {
          const originCfg = FEITICEIROS?.origins?.maldicao ?? {};
          const variantCfg = originCfg[String(maldRace)] || originCfg[maldRace] || originCfg[String(maldRace)?.toString?.()] || null;
          const originProg = variantCfg?.progression?.[String(levelReached)] ?? {};
          const originFixed = Array.isArray(originProg?.fixed) ? originProg.fixed : [];
          for (const entry of originFixed) {
            if (!entry) continue;
            toCreate.push(entry);
          }
        }
      } catch (e) { /* non-fatal */ }
    }

    // Apply HP/EP increases to current values (not to max; max is derived elsewhere)
    try {
      const sys = this.system ?? {};
      const curHpVal = Number(sys.recursos?.hp?.value ?? 0) || 0;
      const curHpMax = Number(sys.recursos?.hp?.max ?? 0) || 0;
      const curEpVal = Number(sys.recursos?.energia?.value ?? 0) || 0;
      const curEpMax = Number(sys.recursos?.energia?.max ?? 0) || 0;

      const updates = {};
      if (totalHpGain) {
        // If a max exists (>0) cap to it, otherwise apply raw gain
        let newHp;
        if (curHpMax > 0) newHp = Math.min(curHpVal + totalHpGain, curHpMax);
        else newHp = curHpVal + totalHpGain;
        updates['system.recursos.hp.value'] = newHp;
      }
      if (totalEpGain) {
        let newEp;
        if (curEpMax > 0) newEp = Math.min(curEpVal + totalEpGain, curEpMax);
        else newEp = curEpVal + totalEpGain;
        updates['system.recursos.energia.value'] = newEp;
      }

      if (Object.keys(updates).length) await this.update(updates);
    } catch (e) {
      console.warn('Failed to apply per-level resource increases:', e);
    }

    // Create fixed progression items, avoiding duplicates by name+type
    if (toCreate.length) {
      const created = [];
      for (const entry of toCreate) {
        try {
          // If entry is a string, attempt to resolve UUID (compendium)
          if (typeof entry === 'string') {
            // Try to resolve a UUID to an Item
            const resolved = await fromUuid(entry).catch(() => null);
            const itemObj = resolved?.toObject ? resolved.toObject() : (resolved?.object?.toObject ? resolved.object.toObject() : null);
            if (itemObj) {
              // Skip if already has same name+type
              const exists = this.items.find(i => i.name === itemObj.name && i.type === itemObj.type);
              if (!exists) {
                const copy = duplicate(itemObj);
                delete copy._id; delete copy.id;
                created.push(copy);
              }
            }
          }
          // If entry is an object that references a compendium pack by name, try to resolve it
          else if (typeof entry === 'object') {
            // If the entry points to a pack, try to fetch the item from the compendium by name
            if (entry.pack && entry.name) {
              try {
                const pack = game.packs.get(entry.pack) || game.packs.get(`world.${entry.pack}`) || game.packs.get(entry.pack.replace(/^world\./, ''));
                if (pack) {
                  const idx = await pack.getIndex();
                  const found = idx.find(i => i.name === entry.name);
                  if (found) {
                    const doc = await pack.getDocument(found._id).catch(() => null);
                    const itemObj = doc?.toObject ? doc.toObject() : (doc?.object?.toObject ? doc.object.toObject() : null);
                    if (itemObj) {
                      const exists = this.items.find(i => i.name === itemObj.name && i.type === itemObj.type);
                      if (!exists) {
                        const copy = duplicate(itemObj);
                        delete copy._id; delete copy.id;
                        created.push(copy);
                        continue;
                      }
                    }
                  }
                }
              } catch (e) { /* ignore and fall back to raw object */ }
            }

            // Fallback: treat entry as an item-like object
            const name = entry.name ?? entry?.system?.name ?? '';
            const type = entry.type ?? entry?.system?.type ?? '';
            const exists = this.items.find(i => i.name === name && i.type === type);
            if (!exists) {
              const copy = duplicate(entry);
              delete copy._id; delete copy.id;
              created.push(copy);
            }
          }
        } catch (e) {
          console.warn('Skipping fixed progression entry due to error', e);
        }
      }
      if (created.length) {
        try { await this.createEmbeddedDocuments('Item', created); } catch (e) { console.warn('Failed to create fixed progression items', e); }
      }
    }

    // If there are selectable progression slots (features/aptitudes) for the next level, open the LevelUpDialog for the owner
    try {
      const nextLevel = prev.total + 1;
      const progressionNext = classCfg?.progression?.[String(nextLevel)] ?? {};
      const featureCount = Number(progressionNext?.features ?? 0);
      const aptitudeCount = Number(progressionNext?.aptitudes ?? 0);
      if ((featureCount > 0 || aptitudeCount > 0) && this.isOwner) {
        // Open dialog so the player can choose remaining options.
        // Pass start level and number of levels gained so dialog can handle multiple levels sequentially.
        const dlg = new LevelUpDialog(this, { startLevel: prev.total, gained, classId });
        dlg.render(true);
      }
    } catch (e) { /* non-fatal */ }
  }

  /**
   * Executa um Descanso Longo: recupera HP/PE e recarrega metade dos DV/DE (mínimo 1).
   * Retorna objeto com quantias recuperadas.
   */
  
  /**
   * Aplica dano ao ator, considerando RD geral e RD por tipo.
   * @param {number} amount - Valor bruto do dano aplicado
   * @param {string} [type] - Tipo de dano (ex: 'corte', 'fogo')
   * @param {boolean} [isSoul=false] - Se true, aplica na integridade (ignora RD por padrão)
   * @returns {Promise<object>} - Informação do que foi aplicado: { applied, mitigated, resource, newValue }
   */
  async applyDamage(amount, type = 'generic', isSoul = false) {
    const system = this.system || {};
    const raw = Number(amount) || 0;

    // Busca RD geral
    const rdGeneral = Number(system.combate?.rd?.value ?? 0) || 0;
    // Busca RD por tipo se existir (substitui a geral)
    const rdByType = system.combate?.rd?.byType ?? {};
    const rdTypeVal = (type && rdByType && rdByType[type] != null) ? Number(rdByType[type]) : null;
    const rd = (rdTypeVal != null) ? rdTypeVal : rdGeneral;

    if (isSoul) {
      // Dano na Alma geralmente ignora RD e afeta integridade
      const cur = Number(system.recursos?.integridade?.value ?? 0) || 0;
      const newVal = Math.max(0, cur - raw);
      const applied = Math.min(raw, cur);
      await this.update({ 'system.recursos.integridade.value': newVal });
      return { applied, mitigated: 0, resource: 'integridade', newValue: newVal };
    }

    // Dano normal: subtrai RD
    const mitigated = Math.min(rd, raw);
    const finalDamage = Math.max(0, raw - rd);

    const curHp = Number(system.recursos?.hp?.value ?? 0) || 0;
    const newHp = Math.max(0, curHp - finalDamage);
    const applied = Math.min(finalDamage, curHp);

    await this.update({ 'system.recursos.hp.value': newHp });
    return { applied, mitigated, resource: 'hp', newValue: newHp, rdApplied: rd };
  }

  async longRest() {
    const updateData = {};
    const system = this.system || {};

    // NOTE: Não restaurar HP/PE automaticamente — o descanso apenas reabastece os dados (DV/DE).

    // 3) Recuperar Dados de Vida (DV): metade do total máximo, mínimo 1
    const maxDV = Number(system.combate?.dadosVida?.max ?? 0) || 0;
    const currentDV = Number(system.combate?.dadosVida?.value ?? 0) || 0;
    let recoveredDV = 0;
    let newDV = currentDV;
    if (maxDV > 0) {
      recoveredDV = Math.max(1, Math.floor(maxDV / 2));
      newDV = Math.min(maxDV, currentDV + recoveredDV);
      updateData['system.combate.dadosVida.value'] = newDV;
      recoveredDV = newDV - currentDV;
    }

    // 4) Recuperar Dados de Energia (DE) se existirem
    const maxDE = Number(system.combate?.dadosEnergia?.max ?? 0) || 0;
    let recoveredDE = 0;
    let newDE = 0;
    if (maxDE > 0) {
      const currentDE = Number(system.combate?.dadosEnergia?.value ?? 0) || 0;
      recoveredDE = Math.max(1, Math.floor(maxDE / 2));
      newDE = Math.min(maxDE, currentDE + recoveredDE);
      updateData['system.combate.dadosEnergia.value'] = newDE;
      recoveredDE = newDE - currentDE;
    }

    // 5) Opcional: criar mensagem no chat explicando as recuperações
    const parts = [];
    parts.push(`<div class="long-rest-chat"><strong>${this.name}</strong> fez um <b>Descanso Longo</b>:`);
    if (recoveredDV > 0) parts.push(`<div>Recuperou <b>${recoveredDV}</b> DV.</div>`);
    if (recoveredDE > 0) parts.push(`<div>Recuperou <b>${recoveredDE}</b> DE.</div>`);
    const chatContent = `<div class="long-rest">${parts.join('')}</div>`;

    // 6) Executa atualização no ator
    if (Object.keys(updateData).length) {
      await this.update(updateData);
    }

    try {
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: chatContent });
    } catch (e) { /* ignore chat failure */ }

    return { recoveredDV, recoveredDE };
  }

  /**
   * Executa um Descanso Curto: recarrega 1/4 dos DV/DE (mínimo 1).
   * Não altera HP/PE por padrão (essas regras podem ser aplicadas externamente).
   * Retorna objeto com quantias recuperadas.
   */
  async shortRest() {
    const updateData = {};
    const system = this.system || {};

    const maxDV = Number(system.combate?.dadosVida?.max ?? 0) || 0;
    const currentDV = Number(system.combate?.dadosVida?.value ?? 0) || 0;
    let recoveredDV = 0;
    if (maxDV > 0) {
      recoveredDV = Math.max(1, Math.floor(maxDV / 4));
      const newDV = Math.min(maxDV, currentDV + recoveredDV);
      updateData['system.combate.dadosVida.value'] = newDV;
      recoveredDV = newDV - currentDV;
    }

    const maxDE = Number(system.combate?.dadosEnergia?.max ?? 0) || 0;
    const currentDE = Number(system.combate?.dadosEnergia?.value ?? 0) || 0;
    let recoveredDE = 0;
    if (maxDE > 0) {
      recoveredDE = Math.max(1, Math.floor(maxDE / 4));
      const newDE = Math.min(maxDE, currentDE + recoveredDE);
      updateData['system.combate.dadosEnergia.value'] = newDE;
      recoveredDE = newDE - currentDE;
    }

    if (Object.keys(updateData).length) await this.update(updateData);

    try {
      const parts = [];
      parts.push(`<div class="short-rest"><strong>${this.name}</strong> fez um <b>Descanso Curto</b>:`);
      if (recoveredDV > 0) parts.push(`<div>Recuperou <b>${recoveredDV}</b> DV.</div>`);
      if (recoveredDE > 0) parts.push(`<div>Recuperou <b>${recoveredDE}</b> DE.</div>`);
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: `<div class="short-rest">${parts.join('')}</div>` });
    } catch (e) { /* ignore chat failure */ }

    return { recoveredDV, recoveredDE };
  }

}