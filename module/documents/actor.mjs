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

    if (system.detalhes.nivel) system.detalhes.nivel.value = nivelTotal;

    try {
      const calcDiceMax = (lvl) => {
        const L = Math.max(0, Number(lvl) || 0);
        return Math.max(1, 1 + Math.floor(L / 3));
      };
      const dvdeMax = calcDiceMax(nivelTotal);

      system.combate = system.combate || {};
      system.combate.dadosVida = system.combate.dadosVida || { value: 1, max: 1, lado: '1d8', label: 'Dados de Vida' };
      system.combate.dadosEnergia = system.combate.dadosEnergia || { value: 1, max: 1, lado: '1d6', label: 'Dados de Energia' };

      system.combate.dadosVida.max = dvdeMax;
      system.combate.dadosEnergia.max = dvdeMax;

      const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n)));

      if (system.combate.dadosVida.value == null) system.combate.dadosVida.value = dvdeMax;
      else system.combate.dadosVida.value = clamp(system.combate.dadosVida.value, 0, dvdeMax);

      if (system.combate.dadosEnergia.value == null) system.combate.dadosEnergia.value = dvdeMax;
      else system.combate.dadosEnergia.value = clamp(system.combate.dadosEnergia.value, 0, dvdeMax);
    } catch (e) {
      console.warn('Falha ao calcular limites de DV/DE:', e);
    }

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
      const equipContribs = [];
      try {
        for (const it of actorData.items ?? []) {
          const s = it?.system ?? {};
          // Considere apenas itens marcados como equipados
          const isEquipped = !!(s?.equipado || s?.equipped || s?.active);
          if (!isEquipped) continue;

          if (String(it.type) === 'uniforme') {
            const u = Number(s?.uniforme?.total ?? s?.uniforme?.bonusCa ?? 0) || 0;
            BONUS_UNIFORM += u;
            if (u) equipContribs.push({ name: it.name || '<Uniforme>', value: u, kind: 'uniforme' });
            continue;
          }

          const b1 = Number(s?.bonus?.ca ?? s?.bonusCa ?? s?.mitigacao ?? 0) || 0;
          const b2 = Number(s?.armor?.mitigacao ?? s?.armor?.value ?? 0) || 0;
          const b3 = Number(s?.shield?.mitigacao ?? s?.shield?.value ?? 0) || 0;
          const sum = b1 + b2 + b3;
          BONUS_EQUIPMENT_OTHERS += sum;
          if (sum) equipContribs.push({ name: it.name || '<Item>', value: sum, kind: 'equip' });
        }
      } catch (e) {
        BONUS_EQUIPMENT_OTHERS = BONUS_EQUIPMENT_OTHERS || 0;
        BONUS_UNIFORM = BONUS_UNIFORM || 0;
      }

      // Bônus manuais de equipamento (configurável via Itens)
      const defesaCfg = system.combate?.defesa ?? {};
      const BONUS_EQUIPMENT_MANUAL = Number(defesaCfg?.bonusEquipManual ?? 0) || 0;

      const BONUS_EQUIPMENT = Number(BONUS_EQUIPMENT_OTHERS + BONUS_UNIFORM + BONUS_EQUIPMENT_MANUAL) || 0;

      // BONUS_AD_HOC: campos ad-hoc no sistema ou flags do sistema
      const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
      const flagBonuses = (actorData.flags ?? {})[sysId] ?? {};
      const fromFlags = Number(flagBonuses?.bonuses?.ca ?? flagBonuses?.ca ?? 0) || 0;
      // Mantém compatibilidade com bônus antigos e adiciona bônus dedicados da Defesa
      const fromSystemLegacy = Number(system?.combate?.bonusAdHoc ?? system?.bonusAdHoc ?? system?.bonusCa ?? 0) || 0;
      const fromDefesaAdHoc = Number(defesaCfg?.bonusAdHoc ?? 0) || 0;
      const fromDefesaOutros = Number(defesaCfg?.outrosBonus ?? 0) || 0;
      const BONUS_AD_HOC = fromFlags + fromSystemLegacy + fromDefesaAdHoc + fromDefesaOutros;

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
      const defesaLog = [];
      defesaLog.push(`Base: ${Number(BASE_VALUE)} (system.combate.baseValue)`);
      defesaLog.push(`DEX: ${Number(MODIFIER_DEX)} (mod de Destreza)`);

      if (equipContribs.length > 0) {
        defesaLog.push('Contribuições de equipamento (itens equipados):');
        for (const c of equipContribs) defesaLog.push(` - ${c.name}: +${c.value}${c.kind === 'uniforme' ? ' [uniforme]' : ''}`);
      } else {
        defesaLog.push('Contribuições de equipamento (itens equipados): nenhuma');
      }
      if (BONUS_EQUIPMENT_MANUAL) defesaLog.push(`Bônus manual de equipamento (system.combate.defesa.bonusEquipManual): +${BONUS_EQUIPMENT_MANUAL}`);
      defesaLog.push(`Equipamento total: +${Number(BONUS_EQUIPMENT)} (inclui uniforme ${Number(BONUS_UNIFORM)})`);

      if (fromFlags) defesaLog.push(`Bônus via flags (${sysId}): +${fromFlags}`);
      if (fromSystemLegacy) defesaLog.push(`Bônus legacy (system.combate.bonusAdHoc / system.bonusCa): +${fromSystemLegacy}`);
      if (fromDefesaAdHoc) defesaLog.push(`Bônus ad-hoc (system.combate.defesa.bonusAdHoc): +${fromDefesaAdHoc}`);
      if (fromDefesaOutros) defesaLog.push(`Outros bônus (system.combate.defesa.outrosBonus): +${fromDefesaOutros}`);
      defesaLog.push(`Ad-hoc total: +${Number(BONUS_AD_HOC)}`);
      defesaLog.push(`DEFESA final: ${Number(caValue)} = ${Number(BASE_VALUE)} + ${Number(MODIFIER_DEX)} + ${Number(BONUS_EQUIPMENT)} + ${Number(BONUS_AD_HOC)}`);

      system.combate.defesa = {
        ...defesaCfg,
        value: Number(caValue),
        breakdown: {
          base: Number(BASE_VALUE),
          dex: Number(MODIFIER_DEX),
          equipment: Number(BONUS_EQUIPMENT),
          equipmentAuto: Number(BONUS_EQUIPMENT_OTHERS + BONUS_UNIFORM),
          equipmentManual: Number(BONUS_EQUIPMENT_MANUAL),
          uniform: Number(BONUS_UNIFORM),
          adHoc: Number(BONUS_AD_HOC),
          adHocFlags: Number(fromFlags),
          adHocLegacy: Number(fromSystemLegacy),
          adHocManual: Number(fromDefesaAdHoc),
          adHocOutros: Number(fromDefesaOutros)
        },
        log: defesaLog
      };

      // Debug: expõe o breakdown para inspecionar no console (ajuda a verificar renderização)
      try {
        console.debug("DEBUG: combate.defesa.breakdown", {
          actorId: actorData.id,
          defesa: system.combate.defesa && system.combate.defesa.breakdown ? system.combate.defesa.breakdown : null
        });
        console.debug("DEBUG: combate.defesa.log", { actorId: actorData.id, log: system.combate.defesa?.log });
      } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('Erro ao calcular CA:', e);
    }

    // ----------------------------------------------------
    // 7. CÁLCULO DO MOVIMENTO (Deslocamento) - v2.5.2
    // Referência (guia): deslocamento base 9m; pode dividir; em Domínio dobra.
    // Observação: terreno difícil e atravessar espaços dobram o CUSTO, não o valor.
    // ----------------------------------------------------
    try {
      system.combate = system.combate || {};
      const movCfg = system.combate.movimento ?? {};

      const round1 = (n) => Math.round(Number(n) * 10) / 10;

      const MOV_BASE_DEFAULT = 9;
      const movBase = Number(movCfg?.base ?? movCfg?.baseValue ?? movCfg?.value ?? MOV_BASE_DEFAULT);
      const BASE = Number.isFinite(movBase) ? movBase : MOV_BASE_DEFAULT;

      const BONUS_ADHOC = Number(movCfg?.bonusAdHoc ?? 0) || 0;
      const BONUS_OUTROS = Number(movCfg?.outrosBonus ?? 0) || 0;
      const BONUS_TOTAL = Number(BONUS_ADHOC + BONUS_OUTROS) || 0;

      const emDominio = !!movCfg?.emDominio;
      const MULT = emDominio ? 2 : 1;

      const SUBTOTAL = round1(BASE + BONUS_TOTAL);
      const FINAL = Math.max(0, round1(SUBTOTAL * MULT));

      // Pulo (linha reta) baseado no Mod. de Força (guia v2.5.2)
      const forAttr = system.atributos?.forca ?? {};
      const forMod = Number(forAttr.mod ?? Math.floor((Number(forAttr.value ?? 10) - 10) / 2)) || 0;
      const saltoLinhaReta = (() => {
        if (forMod <= -4) return 1.5;
        if (forMod <= 0) return 3;
        if (forMod <= 2) return 4.5;
        if (forMod <= 4) return 6;
        if (forMod === 5) return 7.5;
        if (forMod <= 7) return 9;
        if (forMod <= 9) return 10.5;
        return 12;
      })();

      const movLog = [];
      movLog.push(`Base de deslocamento: ${round1(BASE)}m (padrão do livro: 9m)`);
      if (BONUS_ADHOC) movLog.push(`Bônus ad-hoc (system.combate.movimento.bonusAdHoc): +${round1(BONUS_ADHOC)}m`);
      if (BONUS_OUTROS) movLog.push(`Outros bônus (system.combate.movimento.outrosBonus): +${round1(BONUS_OUTROS)}m`);
      movLog.push(`Bônus total: +${round1(BONUS_TOTAL)}m`);
      movLog.push(`Subtotal: ${round1(SUBTOTAL)}m`);
      movLog.push(`Em Domínio: ${emDominio ? 'sim' : 'não'} -> multiplicador x${MULT}`);
      movLog.push(`Movimento final: ${round1(FINAL)}m = ${round1(SUBTOTAL)} x ${MULT}`);
      movLog.push(`Pular (linha reta): Mod. Força ${forMod} -> ${round1(saltoLinhaReta)}m (tabela v2.5.2)`);
      movLog.push(`Obs.: Terreno difícil e atravessar espaço de criaturas dobram o custo do movimento (não alteram seu deslocamento).`);
      movLog.push(`Obs.: Voo — subir custa 2x (1,5m para cima conta como 3m) e descer custa 1/2 (3m para baixo conta como 1,5m).`);

      system.combate.movimento = {
        ...movCfg,
        value: FINAL,
        base: BASE,
        bonusAdHoc: BONUS_ADHOC,
        outrosBonus: BONUS_OUTROS,
        emDominio,
        breakdown: {
          base: round1(BASE),
          bonus: round1(BONUS_TOTAL),
          bonusAdHoc: round1(BONUS_ADHOC),
          outrosBonus: round1(BONUS_OUTROS),
          subtotal: round1(SUBTOTAL),
          multiplicador: MULT,
          total: round1(FINAL)
        },
        salto: {
          value: round1(saltoLinhaReta),
          forMod
        },
        log: movLog
      };

      try {
        console.debug('DEBUG: combate.movimento.breakdown', { actorId: actorData.id, breakdown: system.combate.movimento?.breakdown });
        console.debug('DEBUG: combate.movimento.log', { actorId: actorData.id, log: system.combate.movimento?.log });
      } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('Erro ao calcular Movimento:', e);
    }

    // ----------------------------------------------------
    // 7.5. CÁLCULO DO BÔNUS DE INICIATIVA - v2.5.2
    // Iniciativa (rolagem): 1d20 + Mod de Destreza + Outros Bônus
    // Aqui calculamos o BÔNUS fixo (@iniciativa) para ser usado na rolagem.
    // ----------------------------------------------------
    try {
      system.combate = system.combate || {};
      const iniCfg = system.combate.iniciativa ?? {};

      const dexMod = Number(system.atributos?.destreza?.mod ?? 0) || 0;

      const atributoExtra = String(iniCfg?.atributoExtra ?? 'nenhum');
      let extraLabel = 'nenhum';
      let extraMod = 0;
      if (atributoExtra === 'inteligencia') {
        extraLabel = 'inteligência';
        extraMod = Number(system.atributos?.inteligencia?.mod ?? 0) || 0;
      } else if (atributoExtra === 'sabedoria') {
        extraLabel = 'sabedoria';
        extraMod = Number(system.atributos?.sabedoria?.mod ?? 0) || 0;
      } else if (atributoExtra === 'presenca') {
        extraLabel = 'presença';
        extraMod = Number(system.atributos?.presenca?.mod ?? 0) || 0;
      } else if (atributoExtra === 'melhorIntSab') {
        const im = Number(system.atributos?.inteligencia?.mod ?? 0) || 0;
        const sm = Number(system.atributos?.sabedoria?.mod ?? 0) || 0;
        extraLabel = 'melhor entre INT/SAB';
        extraMod = Math.max(im, sm);
      }

      const usarTreinamento = !!iniCfg?.usarTreinamento;
      const trainingBonus = usarTreinamento ? (Number(system.detalhes?.treinamento?.value ?? 0) || 0) : 0;

      const bonusFixo = Number(iniCfg?.bonusFixo ?? 0) || 0;
      const bonusAdHoc = Number(iniCfg?.bonusAdHoc ?? 0) || 0;
      const outrosBonus = Number(iniCfg?.outrosBonus ?? 0) || 0;

      const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
      const flagBonuses = (actorData.flags ?? {})[sysId] ?? {};
      const flagsIni = Number(flagBonuses?.bonuses?.iniciativa ?? flagBonuses?.iniciativa ?? 0) || 0;

      const totalOutros = Number(extraMod + trainingBonus + bonusFixo + bonusAdHoc + outrosBonus + flagsIni) || 0;
      const iniTotal = Number(dexMod + totalOutros) || 0;

      const iniLog = [];
      iniLog.push(`Rolagem de iniciativa (guia): 1d20 + Mod. Destreza + Outros bônus`);
      iniLog.push(`DEX: ${dexMod} (mod de Destreza)`);
      if (extraMod) iniLog.push(`Atributo extra: ${extraLabel} -> +${extraMod}`);
      if (usarTreinamento) iniLog.push(`Treinamento: +${trainingBonus} (system.detalhes.treinamento)`);
      if (bonusFixo) iniLog.push(`Bônus fixo (system.combate.iniciativa.bonusFixo): +${bonusFixo}`);
      if (bonusAdHoc) iniLog.push(`Bônus ad-hoc (system.combate.iniciativa.bonusAdHoc): +${bonusAdHoc}`);
      if (outrosBonus) iniLog.push(`Outros bônus (system.combate.iniciativa.outrosBonus): +${outrosBonus}`);
      if (flagsIni) iniLog.push(`Bônus via flags (${sysId}): +${flagsIni}`);
      iniLog.push(`Outros bônus total: +${totalOutros}`);
      iniLog.push(`Bônus de iniciativa final (@iniciativa): ${iniTotal} = ${dexMod} + ${totalOutros}`);
      iniLog.push(`Obs.: Empates são desempatados por maior Mod. Destreza; persistindo, rola-se novamente entre os empatados.`);
      iniLog.push(`Obs.: Atrasar pode reduzir voluntariamente a iniciativa em até 10 durante o combate (não alteramos isso automaticamente).`);

      system.combate.iniciativa = {
        ...iniCfg,
        value: iniTotal,
        atributoExtra,
        usarTreinamento,
        bonusFixo,
        bonusAdHoc,
        outrosBonus,
        breakdown: {
          dex: dexMod,
          extra: extraMod,
          treinamento: trainingBonus,
          fixo: bonusFixo,
          adHoc: bonusAdHoc,
          outros: outrosBonus,
          flags: flagsIni,
          outrosTotal: totalOutros,
          total: iniTotal
        },
        log: iniLog
      };

      try {
        console.debug('DEBUG: combate.iniciativa.breakdown', { actorId: actorData.id, breakdown: system.combate.iniciativa?.breakdown });
        console.debug('DEBUG: combate.iniciativa.log', { actorId: actorData.id, log: system.combate.iniciativa?.log });
      } catch (e) { /* ignore */ }
    } catch (e) {
      console.warn('Erro ao calcular Iniciativa:', e);
    }

    // ----------------------------------------------------
    // 8. CÁLCULO DA CD (Resistência de Técnica) - v2.5.2
    // CD = 10 + metade do nível + mod do atributo principal + bônus de treinamento + outros bônus
    // ----------------------------------------------------
    try {
      const CD_BASE = 10;

      const nivelPersonagem = Number(system.detalhes?.nivel?.value ?? nivelTotal ?? 0) || 0;
      const CD_HALF_LEVEL = Math.floor(nivelPersonagem / 2);

      const trainingBonus = Number(system.detalhes?.treinamento?.value ?? bonusCalculado ?? 0) || 0;

      // Atributo principal (configurável). Fallback: mantém comportamento anterior (maior entre INT/SAB).
      const fallbackAttrKey = (Number(system.atributos?.inteligencia?.mod ?? 0) >= Number(system.atributos?.sabedoria?.mod ?? 0))
        ? 'inteligencia'
        : 'sabedoria';
      const attrKeyRaw = String(system.combate?.cd?.atributoPrincipal ?? system.combate?.cd?.atributoPrincipalKey ?? '').trim();
      const attrKey = (attrKeyRaw && system.atributos?.[attrKeyRaw]) ? attrKeyRaw : fallbackAttrKey;
      const CD_ATTR = Number(system.atributos?.[attrKey]?.mod ?? 0) || 0;

      // Outros bônus: itens equipados + campo ad-hoc + flags do sistema + campo manual (opcional)
      let CD_EQUIP = 0;
      const equipContribs = [];
      if (actorData.items) {
        for (const it of actorData.items) {
          try {
            const s = it?.system ?? {};
            if (!s?.equipado && !s?.equipped && !s?.active) continue;
            const val = Number(s?.bonus?.cd ?? s?.bonusCd ?? 0) || 0;
            if (val !== 0) {
              CD_EQUIP += val;
              equipContribs.push({ name: it.name || it?.system?.name || '<sem nome>', value: val });
            }
          } catch (ie) { /* ignore item parse */ }
        }
      }

      const CD_ADHOC = Number(system.combate?.cd?.bonusAdHoc ?? 0) || 0;
      const CD_MANUAL_OUTROS = Number(system.combate?.cd?.outrosBonus ?? 0) || 0;

      const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
      const flagBonuses = (actorData.flags ?? {})[sysId] ?? {};
      const CD_FLAGS = Number(flagBonuses?.bonuses?.cd ?? flagBonuses?.cd ?? 0) || 0;

      const CD_OUTROS = Number(CD_EQUIP + CD_ADHOC + CD_MANUAL_OUTROS + CD_FLAGS) || 0;
      const cdTotal = Number(CD_BASE + CD_HALF_LEVEL + CD_ATTR + trainingBonus + CD_OUTROS) || 0;

      // Build a human-readable log explaining each part
      const cdLog = [];
      cdLog.push(`Base: ${CD_BASE}`);
      cdLog.push(`Nível do personagem: ${nivelPersonagem} -> metade (arredondado para baixo): ${CD_HALF_LEVEL}`);
      cdLog.push(`Atributo principal usado: ${attrKey} (modificador: ${CD_ATTR})`);
      // training source
      if (system.detalhes && typeof system.detalhes.treinamento?.value !== 'undefined') {
        cdLog.push(`Bônus de Treinamento aplicado: ${trainingBonus} (campo system.detalhes.treinamento)`);
      } else {
        cdLog.push(`Bônus de Treinamento aplicado: ${trainingBonus}`);
      }

      if (equipContribs.length > 0) {
        cdLog.push(`Contribuições de itens equipados (bonus.cd):`);
        for (const c of equipContribs) cdLog.push(` - ${c.name}: +${c.value}`);
      } else if (CD_EQUIP !== 0) {
        cdLog.push(`Bônus de equipamento total: +${CD_EQUIP}`);
      } else {
        cdLog.push(`Bônus de equipamento: +0`);
      }

      if (CD_ADHOC) cdLog.push(`Bônus ad-hoc (system.combate.cd.bonusAdHoc): +${CD_ADHOC}`);
      if (CD_MANUAL_OUTROS) cdLog.push(`Bônus manuais (system.combate.cd.outrosBonus): +${CD_MANUAL_OUTROS}`);
      if (CD_FLAGS) cdLog.push(`Bônus via flags do sistema (${sysId}): +${CD_FLAGS}`);

      cdLog.push(`Total Outros bônus: +${CD_OUTROS}`);
      cdLog.push(`CD final: ${cdTotal} = ${CD_BASE} + ${CD_HALF_LEVEL} + ${CD_ATTR} + ${trainingBonus} + ${CD_OUTROS}`);

      system.combate = system.combate || {};
      system.combate.cd = {
        value: cdTotal,
        atributoPrincipal: attrKey,
        equipment: CD_EQUIP,
        bonusAdHoc: CD_ADHOC,
        outrosBonus: CD_MANUAL_OUTROS,
        breakdown: {
          base: CD_BASE,
          metadeNivel: CD_HALF_LEVEL,
          atributo: CD_ATTR,
          treinamento: trainingBonus,
          outros: CD_OUTROS,
          equipment: CD_EQUIP,
          adHoc: CD_ADHOC,
          flags: CD_FLAGS,
          manual: CD_MANUAL_OUTROS
        },
        log: cdLog
      };

      try {
        console.debug("DEBUG: combate.cd.breakdown", {
          actorId: actorData.id,
          cd: system.combate.cd && system.combate.cd.breakdown ? system.combate.cd.breakdown : null
        });
        console.debug("DEBUG: combate.cd.log", { actorId: actorData.id, log: cdLog });
      } catch (e) { /* ignore */ }
    } catch (e) {
      console.error("Erro ao calcular CD:", e);
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

    // Iniciativa: expõe o bônus total calculado em system.combate.iniciativa.value como @iniciativa
    data.iniciativa = Number(this.system.combate?.iniciativa?.value ?? 0) || 0;

    // Compatibilidade: algumas fórmulas antigas usam @abilities.dex.mod
    data.abilities = data.abilities || {};
    data.abilities.dex = data.abilities.dex || {};
    data.abilities.dex.mod = Number(this.system.atributos?.destreza?.mod ?? 0) || 0;
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

    // DV/DE: ao ganhar níveis, aumenta o limite e já ganha os novos dados (não gastos ainda).
    try {
      const calcDiceMax = (lvl) => {
        const L = Math.max(0, Number(lvl) || 0);
        return Math.max(1, 1 + Math.floor(L / 3));
      };
      const prevMax = calcDiceMax(prev.total);
      const newMax = calcDiceMax(totalNow);
      const delta = newMax - prevMax;
      if (delta > 0) {
        const curDV = Number(this.system?.combate?.dadosVida?.value ?? prevMax) || 0;
        const curDE = Number(this.system?.combate?.dadosEnergia?.value ?? prevMax) || 0;
        const updates = {
          'system.combate.dadosVida.value': Math.min(newMax, Math.max(0, curDV + delta)),
          'system.combate.dadosEnergia.value': Math.min(newMax, Math.max(0, curDE + delta)),
        };
        await this.update(updates);
      }
    } catch (e) {
      console.warn('Falha ao aplicar ganho de DV/DE por nível:', e);
    }

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

    // Recuperação de DV/DE é diária: só pode acontecer uma vez por “dia”.
    // Preferir tempo do mundo (game.time.worldTime); fallback para relógio real.
    const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
    const worldTime = Number(game?.time?.worldTime ?? 0) || 0;
    const dayKey = worldTime > 0
      ? Math.floor(worldTime / 86400)
      : Math.floor(Date.now() / 86400000);

    try {
      const lastDay = Number(await this.getFlag(sysId, 'lastLongRestDay') ?? -1);
      if (Number.isFinite(lastDay) && lastDay === dayKey) {
        try {
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this }),
            content: `<div class="long-rest"><strong>${this.name}</strong>: DV/DE já foram recuperados hoje. (Aguardando passar o dia)</div>`
          });
        } catch (_) {}
        return { recoveredDV: 0, recoveredDE: 0, alreadyRecoveredToday: true };
      }
    } catch (_) { /* ignore */ }

    // NOTE: Não restaurar HP/PE automaticamente — o descanso apenas reabastece os dados (DV/DE).

    // 3) Recuperar Dados de Vida (DV): reseta até o máximo diário
    const maxDV = Number(system.combate?.dadosVida?.max ?? 0) || 0;
    const currentDV = Number(system.combate?.dadosVida?.value ?? 0) || 0;
    let recoveredDV = 0;
    let newDV = currentDV;
    if (maxDV > 0) {
      newDV = Math.min(maxDV, maxDV);
      updateData['system.combate.dadosVida.value'] = newDV;
      recoveredDV = Math.max(0, newDV - currentDV);
    }

    // 4) Recuperar Dados de Energia (DE) se existirem
    const maxDE = Number(system.combate?.dadosEnergia?.max ?? 0) || 0;
    let recoveredDE = 0;
    let newDE = 0;
    if (maxDE > 0) {
      const currentDE = Number(system.combate?.dadosEnergia?.value ?? 0) || 0;
      newDE = Math.min(maxDE, maxDE);
      updateData['system.combate.dadosEnergia.value'] = newDE;
      recoveredDE = Math.max(0, newDE - currentDE);
    }

    // Marca o dia em que recuperou
    try {
      await this.setFlag(sysId, 'lastLongRestDay', dayKey);
    } catch (_) { /* ignore */ }

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
    // Regra: descanso curto NÃO recupera DV/DE. Eles só voltam quando “passa o dia” (descanso longo).
    const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
    try { await this.setFlag(sysId, 'lastShortRest', Date.now()); } catch (_) {}

    try {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<div class="short-rest"><strong>${this.name}</strong> fez um <b>Descanso Curto</b>. DV/DE recuperam apenas no Descanso Longo (quando passar o dia).</div>`
      });
    } catch (_) { /* ignore */ }

    return { recoveredDV: 0, recoveredDE: 0 };
  }

}