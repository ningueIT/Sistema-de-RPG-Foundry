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

  /**
   * Executa um Descanso Longo: recupera HP/PE e recarrega metade dos DV/DE (mínimo 1).
   * Retorna objeto com quantias recuperadas.
   */
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