import LevelUpDialog from "../apps/level-up-dialog.mjs";
import { FEITICEIROS } from "../helpers/config.mjs";
import { NPC_CONSTANTS } from "../helpers/constants.mjs";
import { SIZE_MOVEMENT, DEFENSE_LIMITS, REGEN_TABLE } from "../helpers/constants.mjs";

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
      const modelTreinamento = game?.system?.model?.Actor?.character?.treinamento ?? {};

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

      // ----------------------------------------------------
      // TREINAMENTO (INTERLÚDIO): GARANTE DEFAULTS PARA ATORES ANTIGOS
      // ----------------------------------------------------
      if (Object.keys(modelTreinamento).length > 0) {
        this.system.treinamento = foundry.utils.mergeObject(
          foundry.utils.deepClone(modelTreinamento),
          this.system.treinamento ?? {},
          { inplace: false, overwrite: true }
        );
      } else {
        this.system.treinamento = this.system.treinamento ?? {};
      }

      // Safety: garante as chaves mais usadas existirem.
      this.system.treinamento.pontos ??= { total: 0, gastos: 0, disponivel: 0, extra: 0 };
      this.system.treinamento.agilidade ??= { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.barreiras ??= { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.compreensao ??= { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.controleEnergia ??= { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.dominios ??= { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.energiaReversa ??= { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.luta ??= { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.manejoArma ??= { escolha: '', etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.pericia ??= { escolha: '', etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.potencialFisico ??= { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      this.system.treinamento.resistencia ??= { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
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

    // ----------------------------------------------------
    // TREINAMENTO (INTERLÚDIO): BÔNUS DERIVADOS
    // - Não persiste nada; só calcula efeitos a partir das checkboxes.
    // - Regra: marcou uma etapa mais alta => assume as anteriores.
    // ----------------------------------------------------
    const _normText = (s = '') => String(s ?? '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();

    // Segurança: só considera uma etapa válida se as anteriores também estiverem marcadas.
    // Isso evita “pular” etapas via edição manual/macro e protege o cálculo de pontos.
    const _chainProgress = (t = {}) => {
      const etapa1 = !!t?.etapa1;
      const etapa2 = etapa1 && !!t?.etapa2;
      const etapa3 = etapa2 && !!t?.etapa3;
      const etapa4 = etapa3 && !!t?.etapa4;
      const completo = etapa4 && !!t?.completo;
      return { etapa1, etapa2, etapa3, etapa4, completo };
    };

    const treinoRaw = system.treinamento ?? {};

    // ----------------------------------------------------
    // TREINAMENTO (INTERLÚDIO): PONTOS
    // - Total por nível: floor(nível/3) + floor(nível/5)
    // - Extra: editável pelo mestre (persistido)
    // - Gastos: soma das etapas válidas (respeita cadeia)
    // - Disponível: total - gastos (mínimo 0)
    // ----------------------------------------------------
    const TREE_KEYS = [
      'agilidade',
      'barreiras',
      'compreensao',
      'controleEnergia',
      'dominios',
      'energiaReversa',
      'luta',
      'manejoArma',
      'pericia',
      'potencialFisico',
      'resistencia',
    ];
    const STAGE_KEYS = ['etapa1', 'etapa2', 'etapa3', 'etapa4', 'completo'];

    const trValid = Object.fromEntries(
      TREE_KEYS.map((k) => [k, _chainProgress(treinoRaw?.[k] ?? {})])
    );

    const _countStages = (p = {}) => STAGE_KEYS.reduce((acc, k) => acc + (p?.[k] ? 1 : 0), 0);
    const pontosGastos = TREE_KEYS.reduce((acc, k) => acc + _countStages(trValid[k]), 0);

    const extraRaw = Number(treinoRaw?.pontos?.extra ?? 0) || 0;
    const pontosExtra = Math.max(0, Math.floor(extraRaw));
    const lvl = Math.max(0, Number(nivelTotal) || 0);
    const pontosPorNivel = Math.floor(lvl / 3) + Math.floor(lvl / 5);
    const pontosTotal = Math.max(0, pontosPorNivel + pontosExtra);
    const pontosDisponivel = Math.max(0, pontosTotal - pontosGastos);
    const pontosLocked = pontosDisponivel <= 0;

    // Mantém `extra` persistido e expõe os derivados para a ficha.
    system.treinamento = system.treinamento ?? {};
    system.treinamento.pontos = {
      ...(system.treinamento.pontos ?? {}),
      extra: pontosExtra,
      total: pontosTotal,
      gastos: pontosGastos,
      disponivel: pontosDisponivel,
    };

    // Aplica “orçamento” aos bônus (segurança extra contra overspend via macro).
    let budget = pontosTotal;
    const trAplicado = {};
    for (const tree of TREE_KEYS) {
      const src = trValid[tree] ?? {};
      const dst = { etapa1: false, etapa2: false, etapa3: false, etapa4: false, completo: false };
      for (const stage of STAGE_KEYS) {
        if (src?.[stage] && budget > 0) {
          dst[stage] = true;
          budget -= 1;
        }
      }
      trAplicado[tree] = dst;
    }

    const tr = trAplicado;

    const _resolveKeyByChoice = (choice, groupObj = {}) => {
      const tok = _normText(choice);
      if (!tok) return null;
      // 1) tenta por key direto
      if (groupObj?.[tok]) return tok;
      // 2) tenta por label
      for (const [k, v] of Object.entries(groupObj || {})) {
        const lbl = _normText(v?.label ?? '');
        if (lbl && lbl === tok) return k;
      }
      // 3) match por inclusão simples (tolerante)
      for (const [k, v] of Object.entries(groupObj || {})) {
        const lbl = _normText(v?.label ?? '');
        if (!lbl) continue;
        if (lbl.includes(tok) || tok.includes(lbl)) return k;
      }
      return null;
    };

    const periciaEscolhaRaw = String(treinoRaw?.pericia?.escolha ?? '').trim();
    const periciaEscolhaKey = _resolveKeyByChoice(periciaEscolhaRaw, system.pericias ?? {});
    const manejoArmaEscolhaNorm = _normText(String(treinoRaw?.manejoArma?.escolha ?? ''));

    const treinoDerivados = {
      linhas: tr,
      pontos: {
        total: pontosTotal,
        gastos: pontosGastos,
        disponivel: pontosDisponivel,
        extra: pontosExtra,
        locked: pontosLocked,
      },
      escolhas: {
        pericia: { raw: periciaEscolhaRaw, key: periciaEscolhaKey },
        manejoArma: { raw: String(treinoRaw?.manejoArma?.escolha ?? ''), norm: manejoArmaEscolhaNorm },
      },
      bonuses: {
        defesa: { value: 0 },
        movimento: { value: 0 },
        iniciativa: { value: 0 },
        recursos: { hpMax: 0, energiaMax: 0, dadosVidaMax: 0 },
        aptidaoDelta: { barreiras: 0, controleELeitura: 0, energiaReversa: 0 },
        barreiras: { pvBonus: 0, maxParedesBonus: 0 },
        luta: { unarmedLevelBoost: 0 },
        manejoArma: { ataque: 0, dano: 0 },
        pericia: { minGrau: 0, bonusSeJa: 0, completoRerollLt5: false },
        tests: { pericias: {}, salvaguardas: {} },
      },
    };

    // Agilidade
    treinoDerivados.bonuses.movimento.value += tr.agilidade.completo ? 4.5 : (tr.agilidade.etapa1 ? 1.5 : 0);
    if (tr.agilidade.etapa2) treinoDerivados.bonuses.tests.pericias.acrobacia = (treinoDerivados.bonuses.tests.pericias.acrobacia ?? 0) + 2;
    if (tr.agilidade.etapa3) treinoDerivados.bonuses.iniciativa.value += 2;
    if (tr.agilidade.etapa4) treinoDerivados.bonuses.tests.salvaguardas.reflexos = (treinoDerivados.bonuses.tests.salvaguardas.reflexos ?? 0) + 2;

    // Barreiras
    treinoDerivados.bonuses.barreiras.pvBonus += (tr.barreiras.etapa1 ? 10 : 0) + (tr.barreiras.etapa3 ? 10 : 0);
    if (tr.barreiras.etapa2) treinoDerivados.bonuses.aptidaoDelta.barreiras += 1;
    if (tr.barreiras.etapa4) treinoDerivados.bonuses.barreiras.maxParedesBonus += 2;

    // Compreensão
    treinoDerivados.bonuses.recursos.energiaMax += (tr.compreensao.etapa1 ? 2 : 0) + (tr.compreensao.etapa3 ? 3 : 0);
    {
      const b = tr.compreensao.etapa4 ? 2 : (tr.compreensao.etapa2 ? 1 : 0);
      if (b) {
        treinoDerivados.bonuses.tests.pericias.feiticaria = (treinoDerivados.bonuses.tests.pericias.feiticaria ?? 0) + b;
        treinoDerivados.bonuses.tests.pericias.ocultismo = (treinoDerivados.bonuses.tests.pericias.ocultismo ?? 0) + b;
      }
    }

    // Controle de Energia
    treinoDerivados.bonuses.recursos.energiaMax += (tr.controleEnergia.etapa1 ? 2 : 0) + (tr.controleEnergia.etapa3 ? 3 : 0);
    if (tr.controleEnergia.etapa4) treinoDerivados.bonuses.aptidaoDelta.controleELeitura += 1;

    // Energia Reversa
    if (tr.energiaReversa.etapa2) treinoDerivados.bonuses.aptidaoDelta.energiaReversa += 1;

    // Luta
    if (tr.luta.etapa2) treinoDerivados.bonuses.defesa.value += 2;
    treinoDerivados.bonuses.luta.unarmedLevelBoost += (tr.luta.etapa1 ? 1 : 0) + (tr.luta.etapa3 ? 1 : 0) + (tr.luta.etapa4 ? 2 : 0);

    // Resistência
    treinoDerivados.bonuses.recursos.hpMax += (tr.resistencia.etapa1 ? 4 : 0) + (tr.resistencia.etapa4 ? 6 : 0) + (tr.resistencia.completo ? 10 : 0);
    if (tr.resistencia.etapa2) treinoDerivados.bonuses.recursos.dadosVidaMax += 2;
    if (tr.resistencia.etapa3) treinoDerivados.bonuses.tests.salvaguardas.fortitude = (treinoDerivados.bonuses.tests.salvaguardas.fortitude ?? 0) + 2;

    // Manejo de Arma (bônus numéricos aplicados em Item.rollAttack/rollDamage)
    treinoDerivados.bonuses.manejoArma.ataque += (tr.manejoArma.etapa2 ? 1 : 0) + (tr.manejoArma.etapa4 ? 1 : 0);
    treinoDerivados.bonuses.manejoArma.dano += (tr.manejoArma.etapa4 ? 2 : 0);

    // Treino de Perícia (bônus aplicados no roll handler da ficha)
    if (periciaEscolhaKey) {
      const atual = Number(system?.pericias?.[periciaEscolhaKey]?.value ?? 0) || 0;
      if (tr.pericia.etapa3) {
        treinoDerivados.bonuses.pericia.minGrau = 2;
        treinoDerivados.bonuses.pericia.bonusSeJa = (atual >= 2) ? 2 : 0;
      } else if (tr.pericia.etapa1) {
        treinoDerivados.bonuses.pericia.minGrau = 1;
        treinoDerivados.bonuses.pericia.bonusSeJa = (atual >= 1) ? 1 : 0;
      }
      treinoDerivados.bonuses.pericia.completoRerollLt5 = !!tr.pericia.completo;
    }

    system.treinamentoDerivados = treinoDerivados;

    try {
      const calcDiceMax = (lvl) => {
        const L = Math.max(0, Number(lvl) || 0);
        return Math.max(1, 1 + Math.floor(L / 3));
      };
      const dvdeMaxBase = calcDiceMax(nivelTotal);
      const dvBonus = Number(system?.treinamentoDerivados?.bonuses?.recursos?.dadosVidaMax ?? 0) || 0;
      const dvMax = Math.max(1, dvdeMaxBase + dvBonus);
      const deMax = Math.max(1, dvdeMaxBase);

      system.combate = system.combate || {};
      system.combate.dadosVida = system.combate.dadosVida || { value: 1, max: 1, lado: '1d8', label: 'Dados de Vida' };
      system.combate.dadosEnergia = system.combate.dadosEnergia || { value: 1, max: 1, lado: '1d6', label: 'Dados de Energia' };

      system.combate.dadosVida.max = dvMax;
      system.combate.dadosEnergia.max = deMax;

      const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n)));

      if (system.combate.dadosVida.value == null) system.combate.dadosVida.value = dvMax;
      else system.combate.dadosVida.value = clamp(system.combate.dadosVida.value, 0, dvMax);

      if (system.combate.dadosEnergia.value == null) system.combate.dadosEnergia.value = deMax;
      else system.combate.dadosEnergia.value = clamp(system.combate.dadosEnergia.value, 0, deMax);
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
    // Guia v2.5.2 (resumo):
    // - PV nível 1: PV Inicial + Mod CON
    // - PV níveis subsequentes: PV fixo por nível + Mod CON (o dado é referência, usamos o fixo)
    // - PE: PE por nível (não soma atributo extra aqui)
    const CLASS_RULES = {
      "Lutador": { pvInitial: 16, pvFixed: 7, pePerLevel: 4 },
      "Especialista em Combate": { pvInitial: 12, pvFixed: 6, pePerLevel: 4 },
      "Especialista em Técnica": { pvInitial: 8, pvFixed: 4, pePerLevel: 6 },
      "Controlador": { pvInitial: 10, pvFixed: 5, pePerLevel: 5 },
      "Suporte": { pvInitial: 10, pvFixed: 5, pePerLevel: 5 },
      "Restringido": { pvInitial: 12, pvFixed: 7, pePerLevel: 0 }
    };

    const classePrincipal = system.detalhes?.classe?.value;
    const classeSecundaria = system.detalhes?.multiclasse?.value;

    const conMod = system.atributos?.constituicao?.mod ?? 0;
    const entradasClasse = [];
    if (nivelPrincipal > 0 && classePrincipal) entradasClasse.push({ nome: classePrincipal, niveis: nivelPrincipal });
    if (nivelSecundario > 0 && classeSecundaria && classeSecundaria !== "Nenhuma") {
      entradasClasse.push({ nome: classeSecundaria, niveis: nivelSecundario });
    }

    if (system.recursos && nivelTotal > 0 && entradasClasse.length > 0) {
      const startingClassName = (nivelPrincipal > 0 ? classePrincipal : (classeSecundaria !== "Nenhuma" ? classeSecundaria : classePrincipal));

      let pvMax = 0;
      let peMax = 0;

      for (const entry of entradasClasse) {
        const rules = CLASS_RULES[entry.nome] ?? { pvInitial: 10, pvFixed: 5, pePerLevel: 4 };

        // Energia por nível
        peMax += (entry.niveis ?? 0) * (rules.pePerLevel ?? 0);

        // Vida por nível
        if (entry.nome === startingClassName) {
          // nível 1 do personagem
          pvMax += (rules.pvInitial ?? 0) + conMod;
          const restante = Math.max(0, (entry.niveis ?? 0) - 1);
          pvMax += restante * ((rules.pvFixed ?? 0) + conMod);
        } else {
          // níveis obtidos depois (multiclasse)
          pvMax += (entry.niveis ?? 0) * ((rules.pvFixed ?? 0) + conMod);
        }
      }

      // Restringido: não ganha PE.
      if (classePrincipal === "Restringido" || classeSecundaria === "Restringido") {
        peMax = 0;
      }

      // Atualiza máximos (derivado, não persiste no banco)
      if (system.recursos.hp) system.recursos.hp.max = Math.max(0, pvMax);
      if (system.recursos.energia) system.recursos.energia.max = Math.max(0, peMax);

      // Aplicar bônus de Treinamento (derivado)
      try {
        const t = system?.treinamentoDerivados?.bonuses ?? {};
        const hpBonus = Number(t?.recursos?.hpMax ?? 0) || 0;
        const peBonus = Number(t?.recursos?.energiaMax ?? 0) || 0;

        if (hpBonus && system.recursos.hp) {
          system.recursos.hp.max = Math.max(0, Number(system.recursos.hp.max ?? 0) + hpBonus);
        }

        // Não “quebra” o Restringido: se o máximo já é 0, mantemos 0.
        if (peBonus && system.recursos.energia) {
          const curMax = Number(system.recursos.energia.max ?? 0) || 0;
          if (curMax > 0) {
            system.recursos.energia.max = Math.max(0, curMax + peBonus);
          }
        }
      } catch (e) {
        console.warn('Falha ao aplicar bônus de Treinamento em PV/PE:', e);
      }

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
      const fromTreinoDefesa = Number(system?.treinamentoDerivados?.bonuses?.defesa?.value ?? 0) || 0;
      const BONUS_AD_HOC = fromFlags + fromSystemLegacy + fromDefesaAdHoc + fromDefesaOutros + fromTreinoDefesa;

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
      if (fromTreinoDefesa) defesaLog.push(`Treinamento (Treino de Luta): +${fromTreinoDefesa}`);
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
          adHocOutros: Number(fromDefesaOutros),
          adHocTreino: Number(fromTreinoDefesa)
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
      const BONUS_TREINO = Number(system?.treinamentoDerivados?.bonuses?.movimento?.value ?? 0) || 0;
      const BONUS_TOTAL = Number(BONUS_ADHOC + BONUS_OUTROS + BONUS_TREINO) || 0;

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
      if (BONUS_TREINO) movLog.push(`Treinamento (Treino de Agilidade): +${round1(BONUS_TREINO)}m`);
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
          treinoBonus: round1(BONUS_TREINO),
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
      const treinoIni = Number(system?.treinamentoDerivados?.bonuses?.iniciativa?.value ?? 0) || 0;

      const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
      const flagBonuses = (actorData.flags ?? {})[sysId] ?? {};
      const flagsIni = Number(flagBonuses?.bonuses?.iniciativa ?? flagBonuses?.iniciativa ?? 0) || 0;

      const totalOutros = Number(extraMod + trainingBonus + bonusFixo + bonusAdHoc + outrosBonus + flagsIni + treinoIni) || 0;
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
      if (treinoIni) iniLog.push(`Treinamento (Treino de Agilidade): +${treinoIni}`);
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
          treino: treinoIni,
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
    if (actorData.type !== 'npc' && actorData.type !== 'inimigo') return;

    // Make modifications to data here.
    const system = actorData.system;

    // Garantias de estrutura
    system.nd = Number(system.nd ?? system.detallhes?.nd ?? 1) || 1;
    system.nd = Math.max(1, Math.min(20, system.nd));
    system.patamar = String(system.patamar ?? 'comum');
    system.origem = String(system.origem ?? 'humano');
    system.dificuldade_mesa = String(system.dificuldade_mesa ?? 'intermediario');

    // Regras de ND mínimo por patamar (Desafio/Calamidade: ND >= 3)
    // Também expomos no `system.limites` para a ficha usar como min no input.
    const pat0 = String(system.patamar || 'comum').toLowerCase();
    const ndMin = (pat0 === 'desafio' || pat0 === 'calamidade') ? 3 : 1;
    if (Number(system.nd || 1) < ndMin) system.nd = ndMin;

    // Bônus de Treinamento (BT) baseado em ND
    const nd = Number(system.nd) || 1;
    let bt = 2;
    if (nd <= 4) bt = 2;
    else if (nd <= 8) bt = 3;
    else if (nd <= 12) bt = 4;
    else if (nd <= 16) bt = 5;
    else bt = 6;
    system.bt = bt;

    // Atributos: aplica limites por patamar e calcula modificadores
    system.atributos = system.atributos || {};
    // Garante chaves mínimas (senão a ficha fica sem inputs e o cálculo não roda)
    for (const k of ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'presenca']) {
      system.atributos[k] = system.atributos[k] || { value: 10, label: k.toUpperCase() };
      if (typeof system.atributos[k].value === 'undefined' || system.atributos[k].value === null) system.atributos[k].value = 10;
    }
    const pat = (String(system.patamar || 'comum')).toLowerCase();
    const ndVal = Number(system.nd || 1) || 1;
    const btVal = Number(system.bt || 2) || 2;

    // calcula limite máximo por patamar
    let computeAttrMax = (patKey) => {
      if (patKey === 'lacaio') return 20; // 20 + ND com limite 20 -> sempre 20
      if (patKey === 'capanga') return Math.min(24, 20 + ndVal);
      if (patKey === 'comum') return Math.min(26, 20 + ndVal + btVal);
      if (patKey === 'desafio') return Math.min(30, 25 + (2 * ndVal) + (2 * btVal));
      if (patKey === 'calamidade') return Math.min(32, 25 + (2 * ndVal) + (2 * btVal));
      return 26;
    };

    const attrMax = computeAttrMax(pat);

    // Exporta limites (derivado) para a ficha aplicar min/max nos inputs.
    system.limites = system.limites || {};
    system.limites.atributoMin = 8;
    system.limites.atributoMax = attrMax;
    system.limites.ndMin = ndMin;

    for (const [key, atributo] of Object.entries(system.atributos)) {
      // garante estrutura mínima
      if (typeof atributo.value === 'undefined' || atributo.value === null) atributo.value = 10;
      // permite reduzir para mínimo 8
      const raw = Number(atributo.value) || 10;
      const clamped = Math.max(8, Math.min(raw, attrMax));
      atributo.value = clamped;
      // calculo do modificador: (valor - 10) / 2 arredondado para baixo
      atributo.mod = Math.floor((Number(atributo.value) - 10) / 2);
    }

    // Multiplicador de vida baseado em ND; escala 2..6 conforme ND
    const mult = Math.min(6, 2 + Math.floor((nd - 1) / 4));
    system.multiplicadores = system.multiplicadores || {};
    system.multiplicadores.vida = { multiplicador: mult };

    // Calcula PV/PE conforme patamar
    system.recursos = system.recursos || {};
    system.recursos.hp = system.recursos.hp || { value: 0, max: 0 };
    system.recursos.energia = system.recursos.energia || { value: 0, max: 0 };

    const con = Number(system.atributos?.constituicao?.value ?? 10) || 10;
    const conMod = Number(system.atributos?.constituicao?.mod ?? Math.floor((con - 10) / 2)) || 0;

    let hpMax = 0;
    const p = pat;
    if (p === 'lacaio' || p === 'lacaís' || p === 'lacaí') {
      hpMax = 10 + (con * 2);
    } else {
      const basePerNd = NPC_CONSTANTS.VITALS_BASE_PER_ND[p] ?? NPC_CONSTANTS.VITALS_BASE_PER_ND.comum;
      hpMax = (basePerNd * nd) + (con * mult);
    }

    // Ajusta e aplica
    system.recursos.hp.max = Math.max(0, Math.floor(hpMax));
    if (typeof system.recursos.hp.value === 'undefined' || system.recursos.hp.value === null) system.recursos.hp.value = system.recursos.hp.max;

    // Energia (PE): placeholder inicial: escala com ND (2 * ND) + conMod
    const peMax = Math.max(0, Math.floor((2 * nd) + conMod));
    system.recursos.energia.max = peMax;
    if (typeof system.recursos.energia.value === 'undefined' || system.recursos.energia.value === null) system.recursos.energia.value = peMax;

    // Barras: percentuais
    try {
      for (const resource of Object.values(system.recursos ?? {})) {
        if (!resource) continue;
        const max = Number(resource.max ?? 0) || 0;
        const val = Number(resource.value ?? 0) || 0;
        resource.percent = (max > 0)
          ? Math.max(0, Math.min(100, Math.round((val / max) * 100)))
          : 0;
      }
    } catch (e) { /* ignore */ }

    // Defesa (regras por patamar/dificuldade/ND)
    // - Lacaio/Capanga: 10 + Mod DEX
    // - Comum: base (iniciante 11 / intermediário 13 / experiente 15) + Mod DEX + ND (cada ND +1)
    // - Desafio/Calamidade (ND >= 3):
    //    * iniciante: ND3 = 10 + Mod DEX; cada ND +1
    //    * intermediário: ND3 = 18 + Mod DEX; cada ND +1
    //    * experiente: ND3 = 23 + Mod DEX; cada ND +1
    const desMod = Number(system.atributos?.destreza?.mod ?? 0) || 0;
    system.combate = system.combate || {};
    system.combate.defesa = system.combate.defesa || {};
    const dificuldadeKey = String(system.dificuldade_mesa || 'intermediario').toLowerCase();
    const ndNum = Number(system.nd || 1) || 1;

    const baseComumByDiff = {
      // chaves atuais da ficha
      facil: 11,
      fácil: 11,
      intermediario: 13,
      intermediário: 13,
      dificil: 15,
      difícil: 15,
      // compatibilidade com nomenclatura anterior
      iniciante: 11,
      experiente: 15,
    };

    const baseDesafioNd3ByDiff = {
      // chaves atuais da ficha
      facil: 10,
      fácil: 10,
      intermediario: 18,
      intermediário: 18,
      dificil: 23,
      difícil: 23,
      // compatibilidade com nomenclatura anterior
      iniciante: 10,
      experiente: 23,
    };

    let defesaBase = 10;
    let defesaNdBonus = 0;
    if (pat === 'lacaio' || pat === 'capanga') {
      defesaBase = 10;
      defesaNdBonus = 0;
    } else if (pat === 'comum') {
      defesaBase = Number(baseComumByDiff[dificuldadeKey] ?? 13);
      defesaNdBonus = ndNum;
    } else if (pat === 'desafio' || pat === 'calamidade') {
      defesaBase = Number(baseDesafioNd3ByDiff[dificuldadeKey] ?? 18);
      defesaNdBonus = Math.max(0, ndNum - 3);
    } else {
      // fallback conservador
      defesaBase = 10;
      defesaNdBonus = 0;
    }

    system.combate.defesa.value = defesaBase + desMod + defesaNdBonus;

    // Iniciativa: Lacaio: DES_Mod; Outros: ND + (DES_Mod / 2)
    if (p === 'lacaio') {
      system.combate.iniciativa = system.combate.iniciativa || {};
      system.combate.iniciativa.value = desMod;
    } else {
      system.combate.iniciativa = system.combate.iniciativa || {};
      system.combate.iniciativa.value = Number(nd) + Math.floor(desMod / 2);
    }

    // Atenção: base (padrão 10) + SAB_Mod + BT + Bônus de patamar
    const sabMod = Number(system.atributos?.sabedoria?.mod ?? 0) || 0;
    const bonusPatamar = NPC_CONSTANTS.ATTENTION_BONUS[pat] ?? 0;
    system.percepcao = system.percepcao || {};
    const atencaoBase = Number(system.percepcao?.atencaoBase ?? 10) || 10;
    const atencaoBonusExtra = Number(system.percepcao?.atencaoBonus ?? 0) || 0;
    system.percepcao.atencao = atencaoBase + sabMod + Number(system.bt || 0) + bonusPatamar + atencaoBonusExtra;

    // Movimento: aplica deslocamento base de acordo com tamanho, se não informado
    system.combate = system.combate || {};
    const sizeKey = String(system.tamanho || 'medio').toLowerCase();
    const movDefault = SIZE_MOVEMENT[sizeKey] ?? SIZE_MOVEMENT.medio;
    system.combate.movimento = system.combate.movimento || {};
    // `movimento.base` é o valor exibido/editável na ficha.
    // Para NPC/inimigo, o sistema aplica multiplicadores por ND em alguns patamares.
    // Se multiplicarmos e regravarmos em `base` toda preparação, o valor explode.
    // Mantemos uma fonte estável em `baseUnscaled` e derivamos `base` a partir dela.
    system.combate.movimento.base = Number(system.combate.movimento.base ?? movDefault);
    system.combate.movimento.baseUnscaled = Number(system.combate.movimento.baseUnscaled ?? system.combate.movimento.base ?? movDefault);
    try {
      const ndNum = Number(system.nd || 1) || 1;
      const patMov = String(system.patamar || 'comum').toLowerCase();
      const aplicaMult = (patMov === 'capanga' || patMov === 'comum' || patMov === 'desafio' || patMov === 'calamidade');
      let movMult = 1;
      if (aplicaMult) {
        if (ndNum >= 17) movMult = 3;
        else if (ndNum >= 9) movMult = 2;
        else if (ndNum >= 5) movMult = 1.5;
      }
      const baseMov = Number(system.combate.movimento.baseUnscaled ?? movDefault) || movDefault;
      system.combate.movimento.base = Math.round(baseMov * movMult * 10) / 10;
      system.combate.movimento.ndMult = movMult;
    } catch (e) { /* ignore */ }

    // Limites de imunidades/resistências/vulnerabilidades por patamar
    try {
      const limits = DEFENSE_LIMITS[pat] || DEFENSE_LIMITS.comum;
      system._limits = system._limits || {};
      system._limits.imunidadeMax = limits.imunidades;
      system._limits.resistenciaMax = limits.resistencias;
      system._limits.vulnerabilidadeMax = limits.vulnerabilidades;
      system._limits.condicoesImunidadeMax = limits.condicoesImunidades;
    } catch (e) { /* ignore */ }

    // Regras específicas por Patamar
    if (pat === 'lacaio') {
      // Limites rígidos
      for (const [k, a] of Object.entries(system.atributos)) {
        a.value = Math.min(20, Math.max(8, Number(a.value) || 10));
        a.mod = Math.floor((Number(a.value) - 10) / 2);
      }
      // Lacaios não recebem RD irredutível, vida temporária por ataque, vantagens, resistências ou imunidades
      system._limits.imunidadeMax = 0;
      system._limits.resistenciaMax = 0;
      system._limits.vulnerabilidadeMax = 0;
      system._limits.condicoesImunidadeMax = 0;
      // Atenção usa apenas bônus de percepção
      const perc = Number(system.pericias?.percepcao?.value ?? 0) || 0;
      const atencaoBase = Number(system.percepcao?.atencaoBase ?? 10) || 10;
      const atencaoBonusExtra = Number(system.percepcao?.atencaoBonus ?? 0) || 0;
      system.percepcao.atencao = atencaoBase + (Number(system.atributos?.sabedoria?.mod ?? 0) || 0) + atencaoBonusExtra;
      // Iniciativa: apenas mod Destreza
      system.combate.iniciativa = { value: Number(system.atributos?.destreza?.mod ?? 0) || 0 };
      // Vida: 10 + (CON * 2)
      const conv = Number(system.atributos?.constituicao?.value ?? 10) || 10;
      system.recursos.hp.max = Math.max(0, 10 + (conv * 2));
      if (typeof system.recursos.hp.value === 'undefined' || system.recursos.hp.value === null) system.recursos.hp.value = system.recursos.hp.max;
      // Lacaios não recebem vida temporária por ataque
      system._hasTemporaryPerAttack = false;
    }

    if (pat === 'capanga') {
      // Atributos máximos 24
      for (const [k, a] of Object.entries(system.atributos)) {
        a.value = Math.min(24, Math.max(8, Number(a.value) || 10));
        a.mod = Math.floor((Number(a.value) - 10) / 2);
      }
      // Atenção: já tem bonusPatamar de +5
      // Iniciativa: ND + floor(DES_Mod/2)
      const desMod = Number(system.atributos?.destreza?.mod ?? 0) || 0;
      system.combate.iniciativa = { value: Number(system.nd || 1) + Math.floor(desMod / 2) };

      // Capangas não recebem RD irredutível nem imunidades/resistências por padrão
      system._limits.imunidadeMax = 0;
      system._limits.resistenciaMax = 0;
      system._limits.vulnerabilidadeMax = 0;
    }

    if (pat === 'comum') {
      // Atributos máximos 26 (já aplicados globalmente), mas reforça limites
      for (const [k, a] of Object.entries(system.atributos)) {
        a.value = Math.min(26, Math.max(8, Number(a.value) || 10));
        a.mod = Math.floor((Number(a.value) - 10) / 2);
      }

      // Atenção: Percepção + 10 (já aplicado via bonusPatamar mas garante)
      const sabMod = Number(system.atributos?.sabedoria?.mod ?? 0) || 0;
      const atencaoBase = Number(system.percepcao?.atencaoBase ?? 10) || 10;
      const atencaoBonusExtra = Number(system.percepcao?.atencaoBonus ?? 0) || 0;
      system.percepcao.atencao = atencaoBase + sabMod + Number(system.bt || 0) + NPC_CONSTANTS.ATTENTION_BONUS.comum + atencaoBonusExtra;

      // Iniciativa: ND + floor(DES_Mod/2)
      const desMod = Number(system.atributos?.destreza?.mod ?? 0) || 0;
      system.combate.iniciativa = { value: Number(system.nd || 1) + Math.floor(desMod / 2) };

      // PV: usa a fórmula basePerNd * ND + CON * multiplicador (multiplicador 2..6 conforme ND)
      const conVal = Number(system.atributos?.constituicao?.value ?? 10) || 10;
      const ndNum = Number(system.nd || 1) || 1;
      const multLife = Math.min(6, 2 + Math.floor((ndNum - 1) / 4));
      const basePerNd = NPC_CONSTANTS.VITALS_BASE_PER_ND.comum || 60;
      const hpCalc = (basePerNd * ndNum) + (conVal * multLife);
      system.recursos.hp.max = Math.max(0, Math.floor(hpCalc));
      if (typeof system.recursos.hp.value === 'undefined' || system.recursos.hp.value === null) system.recursos.hp.value = system.recursos.hp.max;

      // PE: approximated (keep previous placeholder): 2 * ND + conMod
      const conMod = Math.floor((conVal - 10) / 2);
      const peGuess = Math.max(0, Math.floor((2 * ndNum) + conMod));
      system.recursos.energia.max = peGuess;
      if (typeof system.recursos.energia.value === 'undefined' || system.recursos.energia.value === null) system.recursos.energia.value = peGuess;

      // Valores por ND (com base nas tabelas do Grimório)
      const rdIrredByND = [0,0,0,0,0,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10];
      const tempHpByND = [0,0,0,0,0,0,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6];
      const condImmunByND = [0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,5,5,5,5];
      const advantageByND = [0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,5,5,5,5];
      const resistByND = [0,2,2,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3];
      const immByND = [0,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,2];

      const ndIndex = Math.max(1, Math.min(20, ndNum));
      system._specials = system._specials || {};
      system._specials.rdIrreducivel = Number(rdIrredByND[ndIndex] || 0) || 0;
      system._specials.vidaTempPorAtaque = Number(tempHpByND[ndIndex] || 0) || 0;
      system._limits.imunidadeMax = Number(immByND[ndIndex] || 0) || 0;
      system._limits.resistenciaMax = Number(resistByND[ndIndex] || 0) || 0;
      system._limits.vulnerabilidadeMax = Number(condImmunByND[ndIndex] || 0) || 0;
      system._specials.vantagemCondição = Number(advantageByND[ndIndex] || 0) || 0;
    }

    if (pat === 'desafio') {
      // Atributos máximos 30
      for (const [k, a] of Object.entries(system.atributos)) {
        a.value = Math.min(30, Math.max(8, Number(a.value) || 10));
        a.mod = Math.floor((Number(a.value) - 10) / 2);
      }

      // Atenção: Percepção + 15
      const sabMod = Number(system.atributos?.sabedoria?.mod ?? 0) || 0;
      const atencaoBase = Number(system.percepcao?.atencaoBase ?? 10) || 10;
      const atencaoBonusExtra = Number(system.percepcao?.atencaoBonus ?? 0) || 0;
      system.percepcao.atencao = atencaoBase + sabMod + Number(system.bt || 0) + NPC_CONSTANTS.ATTENTION_BONUS.desafio + atencaoBonusExtra;

      // Iniciativa: ND + floor(DES_Mod/2)
      const desMod = Number(system.atributos?.destreza?.mod ?? 0) || 0;
      const ndNum = Number(system.nd || 1) || 1;
      system.combate.iniciativa = { value: ndNum + Math.floor(desMod / 2) };

      // PV: usa a fórmula basePerNd * ND + CON * multiplicador (multiplicador 2..6 conforme ND)
      const conVal = Number(system.atributos?.constituicao?.value ?? 10) || 10;
      const multLife = Math.min(6, 2 + Math.floor((ndNum - 1) / 4));
      const basePerNd = NPC_CONSTANTS.VITALS_BASE_PER_ND.desafio || 90;
      const hpCalc = (basePerNd * ndNum) + (conVal * multLife);
      system.recursos.hp.max = Math.max(0, Math.floor(hpCalc));
      if (typeof system.recursos.hp.value === 'undefined' || system.recursos.hp.value === null) system.recursos.hp.value = system.recursos.hp.max;

      // PE: aproximação (usamos 3 * ND + conMod como palpite)
      const conMod = Math.floor((conVal - 10) / 2);
      const peGuess = Math.max(0, Math.floor((3 * ndNum) + conMod));
      system.recursos.energia.max = peGuess;
      if (typeof system.recursos.energia.value === 'undefined' || system.recursos.energia.value === null) system.recursos.energia.value = peGuess;

      // Tabelas específicas por ND (copiadas do Grimório — Desafio)
      const rdIrredByND = [0,0,0,0,0,0,0,0,5,6,7,8,9,10,11,12,15,15,16,18,18];
      const tempHpByND = [0,0,0,0,0,0,5,5,5,5,6,6,6,8,8,8,8,10,10,10,10];
      const condImmunByND = [0,0,0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,5,5];
      const advantageByND = [0,0,0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,5,5];
      const resistByND = [0,0,0,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3];
      const immByND = [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];

      const ndIndex = Math.max(1, Math.min(20, ndNum));
      system._specials = system._specials || {};
      system._specials.rdIrreducivel = Number(rdIrredByND[ndIndex] || 0) || 0;
      system._specials.vidaTempPorAtaque = Number(tempHpByND[ndIndex] || 0) || 0;
      system._limits.imunidadeMax = Number(immByND[ndIndex] || 0) || 0;
      system._limits.resistenciaMax = Number(resistByND[ndIndex] || 0) || 0;
      system._limits.vulnerabilidadeMax = Number(condImmunByND[ndIndex] || 0) || 0;
      system._specials.vantagemCondição = Number(advantageByND[ndIndex] || 0) || 0;
    }

    if (pat === 'calamidade') {
      // Atributos máximos 32
      for (const [k, a] of Object.entries(system.atributos)) {
        a.value = Math.min(32, Math.max(8, Number(a.value) || 10));
        a.mod = Math.floor((Number(a.value) - 10) / 2);
      }

      const ndNum = Number(system.nd || 1) || 1;
      // Atenção: +15 até ND19, +20 a partir de ND20
      const sabMod = Number(system.atributos?.sabedoria?.mod ?? 0) || 0;
      const atencaoBase = Number(system.percepcao?.atencaoBase ?? 10) || 10;
      const atencaoBonusExtra = Number(system.percepcao?.atencaoBonus ?? 0) || 0;
      const attentionBonus = (ndNum >= 20) ? 20 : 15;
      system.percepcao.atencao = atencaoBase + sabMod + Number(system.bt || 0) + attentionBonus + atencaoBonusExtra;

      // Iniciativa: ND + floor(DES.mod/2) com cap em 20 + floor(DES.mod/2)
      const desMod = Number(system.atributos?.destreza?.mod ?? 0) || 0;
      const iniRaw = ndNum + Math.floor(desMod / 2);
      const iniCap = 20 + Math.floor(desMod / 2);
      system.combate.iniciativa = { value: Math.min(iniRaw, iniCap) };

      // PV: basePerNd * ND + CON * 3 (conforme tabela de Calamidade)
      const conVal = Number(system.atributos?.constituicao?.value ?? 10) || 10;
      const basePerNd = NPC_CONSTANTS.VITALS_BASE_PER_ND.calamidade || 180;
      const hpCalc = (basePerNd * ndNum) + (conVal * 3);
      system.recursos.hp.max = Math.max(0, Math.floor(hpCalc));
      if (typeof system.recursos.hp.value === 'undefined' || system.recursos.hp.value === null) system.recursos.hp.value = system.recursos.hp.max;

      // PE: aproximação (4 * ND + ConMod)
      const conMod = Math.floor((conVal - 10) / 2);
      const peGuess = Math.max(0, Math.floor((4 * ndNum) + conMod));
      system.recursos.energia.max = peGuess;
      if (typeof system.recursos.energia.value === 'undefined' || system.recursos.energia.value === null) system.recursos.energia.value = peGuess;

      // Preencher tabelas específicas por ND (valores aproximados com base no Grimório)
      const rdIrredByND = [0,0,0,0,0,0,0,0,0,0,0,5,6,7,8,9,10,11,12,15,15,16,18,22,26,30,34,36,38,40,40];
      const tempHpByND = [0,0,0,0,0,0,0,0,5,5,5,5,6,6,6,8,8,8,8,10,10,10,10,10,15,15,15,15,15,15,15];
      const immByND = [0,0,0,0,0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5];
      const resistByND = [0,0,0,0,0,2,2,2,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3];
      const condImmunByND = immByND;
      const advantageByND = [0,0,0,0,0,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,6,6,6,6,6,6,6,6,6,6,6];

      const ndIndex = Math.max(1, Math.min(30, ndNum));
      system._specials = system._specials || {};
      system._specials.rdIrreducivel = Number(rdIrredByND[ndIndex] || 0) || 0;
      system._specials.vidaTempPorAtaque = Number(tempHpByND[ndIndex] || 0) || 0;
      system._limits.imunidadeMax = Number(immByND[ndIndex] || 0) || 0;
      system._limits.resistenciaMax = Number(resistByND[ndIndex] || 0) || 0;
      system._limits.vulnerabilidadeMax = Number(condImmunByND[ndIndex] || 0) || 0;
      system._specials.vantagemCondição = Number(advantageByND[ndIndex] || 0) || 0;
    }

    // Marca que o actor tem as multiplicadores calculadas
    system._npcCalculated = true;

    // -----------------------------
    // LÓGICA DE ORIGEM (imunidades / flags / skills automáticas)
    // -----------------------------
    const origemKey = String(system.origem || 'humano').toLowerCase();
    system.origemEffects = system.origemEffects || {};

    // helpers
    const getRegenMultiplier = (patamar, btVal) => {
      try {
        const t = REGEN_TABLE[patamar] ?? REGEN_TABLE.comum;
        return t[String(btVal)] ?? null;
      } catch (e) { return null; }
    };

    if (origemKey === 'espirito' || origemKey === 'espírito' || origemKey === 'espirito_amaldicoado') {
      // Espíritos Amaldiçoados
      system.origemEffects.imunidades = ['queda', 'doencas', 'venenos', 'nao_respira', 'objetos_sem_energia'];
      system.origemEffects.vulnerabilidades = ['energia_reversa'];
      // Regeneração: custos em PE e quantidade baseada em tabela
      system.origemEffects.regeneracao = {
        enabled: true,
        custos: { cura: 4, ferida_interna: 8, regenerar_membro: 10 }
      };
      const btVal = Number(system.bt || 2);
      const multRegen = getRegenMultiplier(p, btVal);
      system.origemEffects.regeneracao.multiplicadorModCon = multRegen; // null => não recebe
      system.origemEffects.restricoes = {
        semEnergiaReversa: true,
        naoPodeReceberBonusComida: true,
        equipamentosLimitados: true // apenas armas, armaduras e escudos
      };
      // opção: Aumento de Energia (não aplicado automaticamente); marca disponibilidade
      system.origemEffects.canAumentoEnergia = (p !== 'lacaio');
    }

    if (origemKey === 'corpo_amaldicoado' || origemKey === 'corpo_amaldiacado') {
      system.origemEffects.imunidades = ['venenos', 'nao_respira'];
      system.origemEffects.flags = { segundaFaseAvailable: true };
      // Regra: pode ter segunda fase; não respirar
    }

    if (origemKey === 'restrito_fisico' || origemKey === 'restrito (fisico)') {
      system.origemEffects.flags = { arsenalVivo: true };
      if ((Number(system.nd) || 0) >= 10) {
        system.origemEffects.imunidades = (system.origemEffects.imunidades || []).concat(['acerto_garantido_dominios']);
      }
    }

    if (origemKey === 'restrito_corpo' || origemKey === 'restrito (corpo)') {
      // Dobra PE máximo
      try {
        if (system.recursos && typeof system.recursos.energia?.max === 'number') {
          system.recursos.energia.max = Math.floor((system.recursos.energia.max || 0) * 2);
          // também mantém o value dentro do limite
          system.recursos.energia.value = Math.min(system.recursos.energia.value || 0, system.recursos.energia.max);
        }
      } catch (e) { /* ignore */ }
      system.origemEffects.flags = { alcanceIrrestrito: true };
    }

    // Feiticeiro/humano: sem efeitos especiais por padrão, mas mantemos a estrutura
    if (origemKey === 'feiticeiro' || origemKey === 'humano') {
      system.origemEffects.imunidades = system.origemEffects.imunidades || [];
      system.origemEffects.flags = system.origemEffects.flags || {};
    }
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
    if (this.type !== 'npc' && this.type !== 'inimigo') return;

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
      const classePrincipalRaw = (typeof detalhes?.classe === 'object') ? detalhes?.classe?.value : detalhes?.classe;
      const classeSecundariaRaw = (typeof detalhes?.multiclasse === 'object') ? detalhes?.multiclasse?.value : detalhes?.multiclasse;
      const hpMax = Number(this.system?.recursos?.hp?.max ?? 0) || 0;
      const epMax = Number(this.system?.recursos?.energia?.max ?? 0) || 0;
      const hpVal = Number(this.system?.recursos?.hp?.value ?? 0) || 0;
      const epVal = Number(this.system?.recursos?.energia?.value ?? 0) || 0;
      this._preUpdateLevelSnapshot = {
        principal: nivelPrincipal,
        secundario: nivelSecundario,
        total: nivelPrincipal + nivelSecundario,
        classePrincipal: classePrincipalRaw,
        classeSecundaria: classeSecundariaRaw,
        hpMax,
        epMax,
        hpVal,
        epVal
      };
    } catch (e) {
      this._preUpdateLevelSnapshot = { principal: 0, secundario: 0, total: 0, classePrincipal: null, classeSecundaria: null, hpMax: 0, epMax: 0, hpVal: 0, epVal: 0 };
    }
    return super._preUpdate?.(changed, options, userId);
  }

  /**
   * After update: if the actor gained level(s), apply HP/EP/training/fixed items and open LevelUpDialog when choices remain.
   */
  async _onUpdate(changed, options, userId) {
    await super._onUpdate?.(changed, options, userId);

    // Detect whether level fields were changed.
    const prev = this._preUpdateLevelSnapshot ?? { principal: 0, secundario: 0, total: 0 };
    const detalhes = this.system?.detalhes ?? {};
    const nivelPrincipal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
    const nivelSecundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;
    const totalNow = nivelPrincipal + nivelSecundario;

    const gained = Math.max(0, totalNow - prev.total);
    const deltaPrincipal = Math.max(0, nivelPrincipal - (Number(prev.principal ?? 0) || 0));
    const deltaSecundario = Math.max(0, nivelSecundario - (Number(prev.secundario ?? 0) || 0));

    const shouldOpenDialog = !(options?.skipLevelUpDialog);

    const normalizeKey = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    const classesCfg = FEITICEIROS?.classes ?? {};
    const resolveClassCfg = (raw) => {
      if (!raw) return null;
      if (classesCfg && classesCfg[raw]) return { id: raw, cfg: classesCfg[raw] };
      const target = normalizeKey(raw);
      for (const [k, v] of Object.entries(classesCfg)) {
        if (normalizeKey(k) === target) return { id: k, cfg: v };
        if (normalizeKey(v?.label) === target) return { id: k, cfg: v };
      }
      return null;
    };

    const systemId = game?.system?.id || 'feiticeiros-e-maldicoes';
    const progressionFlagKey = 'progression';
    const makeGrantKey = (track, classId, level, nameOrId) => {
      const n = String(nameOrId ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
      return `classFixed:${track}:${classId}:${Number(level) || 0}:${n}`;
    };

    const classePrincipalRaw = (typeof detalhes?.classe === 'object') ? detalhes?.classe?.value : detalhes?.classe;
    const classeSecundariaRaw = (typeof detalhes?.multiclasse === 'object') ? detalhes?.multiclasse?.value : detalhes?.multiclasse;
    const prevClassePrincipalRaw = (typeof prev?.classePrincipal === 'object') ? prev?.classePrincipal?.value : prev?.classePrincipal;
    const prevClasseSecundariaRaw = (typeof prev?.classeSecundaria === 'object') ? prev?.classeSecundaria?.value : prev?.classeSecundaria;

    const principalChanged = normalizeKey(prevClassePrincipalRaw) !== normalizeKey(classePrincipalRaw);
    const secundarioChanged = normalizeKey(prevClasseSecundariaRaw) !== normalizeKey(classeSecundariaRaw);

    // Se não houve ganho de nível e não houve troca de classe, não há nada a fazer aqui.
    if (gained <= 0 && !principalChanged && !secundarioChanged) return;

    const packIndexCache = new Map(); // packKey -> index[]
    const packDocCache = new Map(); // packKey|id -> doc

    const fixSystemIconPath = (img) => {
      const s = String(img || '').trim();
      if (!s) return s;
      if (s.startsWith('systems/') || s.startsWith('/systems/')) return s;
      if (s.startsWith('icons/equipment/') || s.startsWith('icons/weapons/') || s.startsWith('icons/axes/')) {
        const sysId = game?.system?.id || 'feiticeiros-e-maldicoes';
        return `/systems/${sysId}/${s}`;
      }
      return s;
    };

    const getPack = (packKey) => {
      if (!packKey) return null;
      return game.packs.get(packKey)
        || game.packs.get(`world.${packKey}`)
        || game.packs.get(String(packKey).replace(/^world\./, ''))
        || null;
    };

    const getPackIndex = async (packKey) => {
      const k = String(packKey);
      if (packIndexCache.has(k)) return packIndexCache.get(k);
      const pack = getPack(k);
      if (!pack) {
        packIndexCache.set(k, []);
        return [];
      }
      const idx = await pack.getIndex();
      packIndexCache.set(k, idx);
      return idx;
    };

    const getPackDocument = async (packKey, id) => {
      const cacheKey = `${packKey}|${id}`;
      if (packDocCache.has(cacheKey)) return packDocCache.get(cacheKey);
      const pack = getPack(packKey);
      if (!pack) return null;
      const doc = await pack.getDocument(id).catch(() => null);
      packDocCache.set(cacheKey, doc);
      return doc;
    };

    const resolveEntryToItemObject = async (entry) => {
      // string => UUID
      if (typeof entry === 'string') {
        const resolved = await fromUuid(entry).catch(() => null);
        const obj = resolved?.toObject ? resolved.toObject() : (resolved?.object?.toObject ? resolved.object.toObject() : null);
        if (obj && typeof obj === 'object') obj.img = fixSystemIconPath(obj.img);
        return obj || null;
      }

      if (!entry || typeof entry !== 'object') return null;

      // {pack,name}
      if (entry.pack && entry.name) {
        const packKey = String(entry.pack);
        const pack = getPack(packKey);
        if (!pack) {
          try {
            console.warn('[FEITICEIROS] Progressão | compêndio não encontrado', {
              actor: { id: this.id, name: this.name },
              pack: packKey,
              name: entry.name
            });
          } catch (_) { /* ignore */ }
          return null;
        }

        const idx = await getPackIndex(packKey);
        const targetName = normalizeKey(entry.name);
        const found = idx.find(i => normalizeKey(i?.name) === targetName);
        if (!found) {
          try {
            console.warn('[FEITICEIROS] Progressão | item não encontrado no compêndio', {
              actor: { id: this.id, name: this.name },
              pack: packKey,
              name: entry.name
            });
          } catch (_) { /* ignore */ }
          return null;
        }

        const doc = await getPackDocument(packKey, found._id);
        const obj = doc?.toObject ? doc.toObject() : (doc?.object?.toObject ? doc.object.toObject() : null);
        if (obj && typeof obj === 'object') obj.img = fixSystemIconPath(obj.img);
        return obj || null;
      }

      // raw item-like object
      if (entry.name && entry.type) {
        const obj = foundry.utils.duplicate(entry);
        if (obj && typeof obj === 'object') obj.img = fixSystemIconPath(obj.img);
        return obj;
      }
      return null;
    };

    const collectFixedForClassUpTo = (classCfg, maxLevel) => {
      const out = [];
      const M = Math.max(0, Number(maxLevel) || 0);
      for (let lvl = 1; lvl <= M; lvl++) {
        const p = classCfg?.progression?.[String(lvl)] ?? {};
        const fixed = Array.isArray(p?.fixed) ? p.fixed : [];
        for (const entry of fixed) out.push({ entry, level: lvl });
      }
      return out;
    };

    const getProgressionFlag = (item) => item?.getFlag?.(systemId, progressionFlagKey) ?? null;

    const reconcileFixedForTrack = async ({ track, prevClassRaw, newClassRaw, prevLevel, newLevel }) => {
      const prevResolved = resolveClassCfg(prevClassRaw);
      const newResolved = resolveClassCfg(newClassRaw);
      const prevClassId = prevResolved?.id;
      const prevClassCfg = prevResolved?.cfg;
      const newClassId = newResolved?.id;
      const newClassCfg = newResolved?.cfg;
      const classChanged = normalizeKey(prevClassRaw) !== normalizeKey(newClassRaw);

      if (!newClassCfg || !newClassId) return;

      const desired = collectFixedForClassUpTo(newClassCfg, newLevel);
      const desiredNames = new Set();
      const desiredNameType = new Set();
      const desiredResolvedObjs = [];

      for (const d of desired) {
        const obj = await resolveEntryToItemObject(d.entry);
        if (!obj?.name || !obj?.type) continue;
        desiredResolvedObjs.push({ obj, level: d.level, entry: d.entry });
        desiredNames.add(obj.name);
        desiredNameType.add(`${obj.name}|${obj.type}`);
      }

      // Remover itens fixos da classe anterior quando houver troca.
      if (classChanged && prevClassCfg && prevClassId) {
        const old = collectFixedForClassUpTo(prevClassCfg, prevLevel);
        const oldResolved = [];
        const oldNameType = new Set();

        for (const o of old) {
          const obj = await resolveEntryToItemObject(o.entry);
          if (!obj?.name || !obj?.type) continue;
          oldResolved.push({ obj, level: o.level });
          oldNameType.add(`${obj.name}|${obj.type}`);
        }

        const idsToDelete = [];
        const deleteSummary = [];
        for (const item of this.items) {
          if (item?.type !== 'habilidade') continue;
          const flag = getProgressionFlag(item);
          const nameType = `${item.name}|${item.type}`;

          // Se o item é um fixo antigo e NÃO faz parte dos fixos desejados da classe atual, remove.
          const isOldByName = oldNameType.has(nameType);
          const isDesiredNow = desiredNameType.has(nameType);

          const isOldByFlag = !!(flag && flag.kind === 'classFixed' && flag.track === track && flag.classId === prevClassId);
          if ((isOldByFlag || isOldByName) && !isDesiredNow) {
            idsToDelete.push(item.id);
            deleteSummary.push({ id: item.id, name: item.name, type: item.type });
          }
        }

        if (idsToDelete.length) {
          try {
            console.log('[FEITICEIROS] Progressão | removendo habilidades fixas (troca de classe)', {
              actor: { id: this.id, name: this.name },
              track,
              from: { classId: prevClassId, classRaw: prevClassRaw, level: prevLevel },
              to: { classId: newClassId, classRaw: newClassRaw, level: newLevel },
              count: idsToDelete.length,
              items: deleteSummary
            });
          } catch (_) { /* ignore */ }
          try { await this.deleteEmbeddedDocuments('Item', idsToDelete); } catch (e) { console.warn('Falha ao remover habilidades fixas da classe anterior', e); }
        }
      }

      // Conceder itens fixos desejados que estiverem faltando.
      const toCreate = [];
      const createSummary = [];
      const markedSummary = [];
      for (const d of desiredResolvedObjs) {
        const exists = this.items.find(i => i.name === d.obj.name && i.type === d.obj.type);
        if (exists) {
          // Se for um item que já existe, mas sem flag, tenta “migrar” marcando como fixo.
          const flag = getProgressionFlag(exists);
          if (!flag) {
            try {
              await exists.setFlag(systemId, progressionFlagKey, {
                kind: 'classFixed',
                track,
                classId: newClassId,
                level: d.level,
                key: makeGrantKey(track, newClassId, d.level, d.obj.name)
              });
              markedSummary.push({ id: exists.id, name: exists.name, type: exists.type, level: d.level });
            } catch (e) { /* non-fatal */ }
          }
          continue;
        }

        const copy = foundry.utils.duplicate(d.obj);
        delete copy._id; delete copy.id;
        copy.flags = copy.flags || {};
        copy.flags[systemId] = copy.flags[systemId] || {};
        copy.flags[systemId][progressionFlagKey] = {
          kind: 'classFixed',
          track,
          classId: newClassId,
          level: d.level,
          key: makeGrantKey(track, newClassId, d.level, d.obj.name)
        };
        toCreate.push(copy);
        createSummary.push({ name: copy.name, type: copy.type, level: d.level });
      }

      if (markedSummary.length) {
        try {
          console.log('[FEITICEIROS] Progressão | marcando habilidade existente como fixa', {
            actor: { id: this.id, name: this.name },
            track,
            classId: newClassId,
            count: markedSummary.length,
            items: markedSummary
          });
        } catch (_) { /* ignore */ }
      }

      if (toCreate.length) {
        try {
          console.log('[FEITICEIROS] Progressão | concedendo habilidades fixas (automático)', {
            actor: { id: this.id, name: this.name },
            track,
            classId: newClassId,
            classRaw: newClassRaw,
            newLevel,
            count: toCreate.length,
            items: createSummary
          });
        } catch (_) { /* ignore */ }
        try {
          const createdDocs = await this.createEmbeddedDocuments('Item', toCreate);
          try {
            const createdSummary = (createdDocs ?? []).map(d => ({ id: d.id, name: d.name, type: d.type }));
            console.log('[FEITICEIROS] Progressão | habilidades fixas criadas', {
              actor: { id: this.id, name: this.name },
              track,
              classId: newClassId,
              count: createdSummary.length,
              items: createdSummary
            });
          } catch (_) { /* ignore */ }
        } catch (e) {
          console.warn('Falha ao criar habilidades fixas', e);
        }
      }

      // Pós-checagem: garantir que todas as desejadas existem agora.
      try {
        const missingNow = [];
        for (const d of desiredResolvedObjs) {
          const has = this.items.some(i => i.name === d.obj.name && i.type === d.obj.type);
          if (!has) missingNow.push({ name: d.obj.name, type: d.obj.type, level: d.level });
        }
        if (missingNow.length) {
          console.warn('[FEITICEIROS] Progressão | ainda faltando habilidades fixas após reconciliar', {
            actor: { id: this.id, name: this.name },
            track,
            classId: newClassId,
            missing: missingNow
          });
        }
      } catch (_) { /* ignore */ }
    };

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
        await this.update(updates, { skipLevelUpDialog: true, skipProgressionReconcile: true });
      }
    } catch (e) {
      console.warn('Falha ao aplicar ganho de DV/DE por nível:', e);
    }

    // Reconciliação de habilidades fixas (classe) por trilha.
    // - Ao subir nível: garante que o ator tenha todas as fixas até o nível atual da classe.
    // - Ao trocar classe: remove as fixas antigas dessa trilha e concede as novas.
    if (!options?.skipProgressionReconcile) {
      try {
        if (deltaPrincipal > 0 || principalChanged) {
          await reconcileFixedForTrack({
            track: 'principal',
            prevClassRaw: prevClassePrincipalRaw,
            newClassRaw: classePrincipalRaw,
            prevLevel: Number(prev.principal) || 0,
            newLevel: nivelPrincipal
          });
        }
        if (deltaSecundario > 0 || secundarioChanged) {
          await reconcileFixedForTrack({
            track: 'secundario',
            prevClassRaw: prevClasseSecundariaRaw,
            newClassRaw: classeSecundariaRaw,
            prevLevel: Number(prev.secundario) || 0,
            newLevel: nivelSecundario
          });
        }
      } catch (e) {
        console.warn('Falha ao reconciliar habilidades fixas por classe', e);
      }
    }

    const fixedToCreate = []; // itens fixos não-relacionados a classe (ex.: origem)

    const openDialogs = []; // array of { track, classId, startTotal, startClass, gained }

    const processTrack = async (track, delta, classRaw, startClassLevel) => {
      if (!delta || delta <= 0) return;
      const resolved = resolveClassCfg(classRaw);
      if (!resolved?.cfg) return;
      const classCfg = resolved.cfg;
      const classId = resolved.id;

      let needsDialog = false;

      for (let i = 1; i <= delta; i++) {
        const classLevelReached = (Number(startClassLevel) || 0) + i;
        const progression = classCfg?.progression?.[String(classLevelReached)] ?? {};

        // Apply training bonus if provided in progression for this class level
        if (progression?.bTreinamento != null) {
          try {
            await this.update({ 'system.detalhes.treinamento.value': Number(progression.bTreinamento) });
          } catch (e) { /* non-fatal */ }
        }

        const featureCount = Number(progression?.features ?? 0);
        const aptitudeCount = Number(progression?.aptitudes ?? 0);
        if (featureCount > 0 || aptitudeCount > 0) needsDialog = true;
      }

      if (needsDialog && this.isOwner && shouldOpenDialog) {
        openDialogs.push({ track, classId, startTotal: Number(prev.total) || 0, startClass: Number(startClassLevel) || 0, gained: delta });
      }
    };

    await processTrack('principal', deltaPrincipal, classePrincipalRaw, prev.principal);
    await processTrack('secundario', deltaSecundario, classeSecundariaRaw, prev.secundario);

    // -- Origem: Maldição (variante) -- progride pelo nível TOTAL do personagem
    try {
      const origemVal = this.system?.detalhes?.origem?.value ?? this.system?.detalhes?.origem;
      const maldRace = this.system?.detalhes?.racaMaldicao?.value ?? this.system?.detalhes?.racaMaldicao;
      if (String(origemVal) === 'Maldição' && maldRace) {
        const originCfg = FEITICEIROS?.origins?.maldicao ?? {};
        const variantCfg = originCfg[String(maldRace)] || originCfg[maldRace] || originCfg[String(maldRace)?.toString?.()] || null;
        for (let i = 1; i <= gained; i++) {
          const levelTotalReached = (Number(prev.total) || 0) + i;
          const originProg = variantCfg?.progression?.[String(levelTotalReached)] ?? {};
          const originFixed = Array.isArray(originProg?.fixed) ? originProg.fixed : [];
          for (const entry of originFixed) {
            if (!entry) continue;
            fixedToCreate.push(entry);
          }
        }
      }
    } catch (e) { /* non-fatal */ }

    // Criar itens fixos de origem (e outras fontes não-classe), evitando duplicatas por nome+tipo.
    if (fixedToCreate.length) {
      const created = [];
      const createdSummary = [];
      for (const entry of fixedToCreate) {
        try {
          const itemObj = await resolveEntryToItemObject(entry);
          if (!itemObj?.name || !itemObj?.type) continue;
          const exists = this.items.find(i => i.name === itemObj.name && i.type === itemObj.type);
          if (exists) continue;
          const copy = foundry.utils.duplicate(itemObj);
          delete copy._id; delete copy.id;
          created.push(copy);
          createdSummary.push({ name: copy.name, type: copy.type });
        } catch (e) {
          console.warn('Skipping fixed (non-class) progression entry due to error', e);
        }
      }
      if (created.length) {
        try {
          console.log('[FEITICEIROS] Progressão | concedendo itens fixos (origem/outros, automático)', {
            actor: { id: this.id, name: this.name },
            count: created.length,
            items: createdSummary
          });
        } catch (_) { /* ignore */ }
        try { await this.createEmbeddedDocuments('Item', created); } catch (e) { console.warn('Failed to create fixed progression items (non-class)', e); }
      }
    }

    // Apply HP/EP increases to current values using delta of max (inclui CON/ajustes por classe).
    try {
      const sys = this.system ?? {};
      const prevHpMax = Number(prev.hpMax ?? 0) || 0;
      const prevEpMax = Number(prev.epMax ?? 0) || 0;
      const prevHpVal = Number(prev.hpVal ?? Number(sys.recursos?.hp?.value ?? 0)) || 0;
      const prevEpVal = Number(prev.epVal ?? Number(sys.recursos?.energia?.value ?? 0)) || 0;

      const newHpMax = Number(sys.recursos?.hp?.max ?? 0) || 0;
      const newEpMax = Number(sys.recursos?.energia?.max ?? 0) || 0;

      const deltaHp = Math.max(0, newHpMax - prevHpMax);
      const deltaEp = Math.max(0, newEpMax - prevEpMax);

      const updates = {};
      if (deltaHp > 0) updates['system.recursos.hp.value'] = Math.min(prevHpVal + deltaHp, newHpMax);
      if (deltaEp > 0) updates['system.recursos.energia.value'] = Math.min(prevEpVal + deltaEp, newEpMax);

      if (Object.keys(updates).length) await this.update(updates, { skipLevelUpDialog: true, skipProgressionReconcile: true });
    } catch (e) {
      console.warn('Failed to apply resource delta on level gain:', e);
    }

    // Open selection dialog(s) when there are selectable progression slots (features/aptitudes)
    if (openDialogs.length && this.isOwner && shouldOpenDialog) {
      try {
        // Abrir 1 diálogo por trilha que subiu (caso raro: ambos no mesmo update)
        for (const d of openDialogs) {
          const dlg = new LevelUpDialog(this, {
            startTotalLevel: d.startTotal,
            startClassLevel: d.startClass,
            gained: d.gained,
            classId: d.classId,
            track: d.track
          });
          dlg.render(true);
        }
      } catch (e) { /* non-fatal */ }
    }
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
  async applyDamage(amount, type = 'generic', isSoul = false, options = {}) {
    const system = this.system || {};
    const raw = Number(amount) || 0;

    const ignoreRD = Boolean(options?.ignoreRD ?? options?.ignoreRd ?? false);

    // Imunidades / vulnerabilidades (por tipo)
    const immuneByType = system.combate?.imunidades?.byType ?? {};
    const vulnByType = system.combate?.vulnerabilidades?.byType ?? {};

    const isImmune = !ignoreRD && !isSoul && type && Boolean(immuneByType?.[type]);

    // RD
    // - `rd.irreducivel`: sempre aplica (não pode ser ignorada por ignoreRD)
    // - `rd.value`: RD geral (pode ser ignorada)
    // - `rd.byType[type]`: RD por tipo (substitui a geral; pode ser ignorada)
    const rdIrreducivel = Number(system.combate?.rd?.irreducivel ?? 0) || 0;
    const rdGeneral = Number(system.combate?.rd?.value ?? 0) || 0;
    const rdByType = system.combate?.rd?.byType ?? {};
    const rdTypeVal = (type && rdByType && rdByType[type] != null) ? Number(rdByType[type]) : null;

    const rdReducivel = ignoreRD ? 0 : ((rdTypeVal != null) ? rdTypeVal : rdGeneral);
    const rdTotal = Math.max(0, rdIrreducivel) + Math.max(0, rdReducivel);

    if (isSoul) {
      // Dano na Alma geralmente ignora RD e afeta integridade
      const cur = Number(system.recursos?.integridade?.value ?? 0) || 0;
      const newVal = Math.max(0, cur - raw);
      const applied = Math.min(raw, cur);
      await this.update({ 'system.recursos.integridade.value': newVal });
      return { applied, mitigated: 0, resource: 'integridade', newValue: newVal };
    }

    // Dano normal: subtrai RD (ou zera por imunidade)
    if (isImmune) {
      const curHp = Number(system.recursos?.hp?.value ?? 0) || 0;
      // não altera HP; reporta como tudo mitigado por imunidade
      return { applied: 0, mitigated: raw, resource: 'hp', newValue: curHp, immune: true, type };
    }

    const mitigated = Math.min(rdTotal, raw);
    let finalDamage = Math.max(0, raw - mitigated);

    // Vulnerabilidade: aplica multiplicador após RD
    if (!isSoul && !ignoreRD && type && vulnByType && vulnByType[type] != null) {
      const mult = Number(vulnByType[type]) || 1;
      if (Number.isFinite(mult) && mult > 0) {
        finalDamage = Math.round(finalDamage * mult);
      }
    }

    const curHp = Number(system.recursos?.hp?.value ?? 0) || 0;
    const newHp = Math.max(0, curHp - finalDamage);
    const applied = Math.min(finalDamage, curHp);

    await this.update({ 'system.recursos.hp.value': newHp });
    return { applied, mitigated, resource: 'hp', newValue: newHp, rdApplied: rdTotal, rdIrreducivel, rdReducivel, ignoreRD };
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