/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
import { convertDamageLevel } from "../helpers/damage-scale.mjs";
export class BoilerplateItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this;

    // If this is a weapon, start the attack flow (attack roll then damage)
    if (String(item.type) === 'arma') {
      return item.rollAttack();
    }

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    let label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
      return;
    }
    // Otherwise, create a roll and send a chat message from it.
    const rollData = this.getRollData();
    let formula = rollData.formula;

    try {
      if (this.actor && this.actor.getFlag) {
        // Última Ação crítico garantido: substitui d20 por 20
        const ultimaCrit = await this.actor.getFlag(game.system.id, 'ultimaAcao.critico');
        if (ultimaCrit) {
          formula = String(formula).replace(/\b\d*d20(?:[a-z]{1,2}\d+|cs[<>=!]+\d+|cf[<>=!]+\d+|kh\d+|kl\d+)?\b/i, '20');
          try { await this.actor.unsetFlag(game.system.id, 'ultimaAcao.critico'); } catch(_){}
        }

        // Kokusen: dobrar dados de dano (exceto d20)
        const kok = await this.actor.getFlag(game.system.id, 'kokusen.pendingDoubleDamage');
        if (kok) {
          try {
            formula = String(formula).replace(/(\b(\d*)d(?!20)(\d+)\b)/ig, (m, whole, count, faces) => {
              const n = Number(count) || 1;
              return `${n*2}d${faces}`;
            });
          } catch (e) { console.warn('Erro ao dobrar dados de dano (Kokusen):', e); }
          try { await this.actor.unsetFlag(game.system.id, 'kokusen.pendingDoubleDamage'); } catch(_){}
        }

        // Bônus de dano do sistema (persistente e temporário) para armas/técnicas
        // - flags.<systemId>.bonuses.itemDamage => sempre
        // - flags.<systemId>.temp.damageBonus => one-shot
        try {
          const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
          if (this.actor && ['arma', 'tecnica'].includes(String(item.type))) {
            const bonuses = (await this.actor.getFlag(sysId, 'bonuses')) || {};
            const bonusAlways = Number(bonuses?.itemDamage ?? 0) || 0;

            const temp = (await this.actor.getFlag(sysId, 'temp')) || {};
            const bonusTemp = Number(temp?.damageBonus ?? 0) || 0;

            const totalBonus = (bonusAlways + bonusTemp);
            if (totalBonus) {
              // Só adiciona se houver algum termo de dano (dado) na fórmula
              if (/\bd\d+\b/i.test(String(formula))) {
                formula = `${formula} + ${totalBonus}`;
              }
            }

            if (bonusTemp) {
              const next = foundry.utils.deepClone(temp);
              next.damageBonus = 0;
              await this.actor.setFlag(sysId, 'temp', next);
            }
          }
        } catch (e) {
          console.warn('Erro ao aplicar bônus de dano (flags):', e);
        }
      }
    } catch (err) {
      console.warn('Falha ao verificar/limpar flags de crítico/Kokusen', err);
    }

    // Se o item possui bloco de damage no sistema, converte o dado conforme níveis
    const damageBlock = this.system?.damage;
    try {
      if (damageBlock && ['arma', 'tecnica'].includes(String(item.type))) {
        const base = String(damageBlock.base?.value ?? damageBlock.base ?? '');
        const levelBoost = Number(damageBlock.levelBoost?.value ?? damageBlock.levelBoost ?? 0);
        if (base) {
          const finalDie = convertDamageLevel(base, levelBoost);
          // Substitui o primeiro dado na fórmula atual (se houver), senão prefixa
          if (/\d*d\d+|1/i.test(String(formula))) {
            formula = String(formula).replace(/(\d*d\d+|1)(?![a-z])/i, finalDie);
          } else {
            formula = `${finalDie}${formula ? ' + ' + formula : ''}`;
          }
          label = `${label} — Dano ${base} → ${finalDie}`;
        }
      }
    } catch (e) {
      console.warn('Erro ao converter níveis de dano:', e);
    }

    const roll = new Roll(formula, rollData);
    await roll.evaluate();
    // Construir cartão estilizado para o dano
    try {
      const damageTotal = Number(roll.total) || 0;
      const damageType = String(damageBlock?.type?.value ?? damageBlock?.type ?? '') || '';
      const formulaShort = Roll.cleanFormula(String(formula || ''), rollData);

      const dmgContent = `
        <div class="card chat-card skill-roll">
          <div class="die" style="width:56px;height:56px;border-radius:8px;background:#111;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:#fff">
            <i class="fas fa-bolt"></i><span>${damageTotal}</span>
          </div>
          <div class="skill-info">
            <div style="display:flex; align-items:center; gap:8px; justify-content:space-between;">
              <div style="font-weight:700; font-size:1rem">${item.name} — Dano</div>
              <div style="font-weight:700; color:#fff; background:#6f42c1; padding:4px 8px; border-radius:6px;">${damageTotal}</div>
            </div>
            <div style="margin-top:6px; font-size:0.9rem; color:#ddd;">
              <span style="background:#111; padding:3px 6px; border-radius:4px;">Fórmula: <code style="background:transparent; color:#fff;">${formulaShort}</code></span>
            </div>
            <div style="margin-top:8px; display:flex; gap:8px;">
              <button class="button apply-damage" data-value="${damageTotal}" data-type="${damageType}" data-multiplier="1" data-soul="false" data-roller="${game.user?.id}">Causar Dano</button>
              <button class="button apply-damage double" data-value="${damageTotal}" data-type="${damageType}" data-multiplier="2" data-soul="false" data-roller="${game.user?.id}">Causar Dano ×2</button>
              <button class="button apply-damage" data-value="${damageTotal}" data-type="${damageType}" data-multiplier="0.5" data-soul="false" data-roller="${game.user?.id}">Causar Metade</button>
            </div>
          </div>
        </div>`;

      await ChatMessage.create({ speaker, rollMode, flavor: `[${item.type}] ${item.name} — Dano`, content: dmgContent, type: CONST.CHAT_MESSAGE_TYPES.ROLL, flags: { 'feiticeiros-e-maldicoes': { skillRoll: true } } });
    } catch (e) {
      console.warn('Erro ao criar mensagem estilizada de dano:', e);
      const message = await roll.toMessage({ speaker, rollMode, flavor: label });
      return roll;
    }

    return roll;
  }

  /**
   * Rola o teste de ataque (d20 + modificadores) e cria uma mensagem com botão para rolar dano.
   */
  async rollAttack() {
    const item = this;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');

    const rollData = this.getRollData();

    const attackBlock = this.system?.ataque ?? {};
    const atributoKey = String(attackBlock?.atributo?.value ?? attackBlock?.atributo ?? 'forca');

    const actorAttrs = rollData.actor?.atributos ?? {};
    const attrVal = Number(actorAttrs?.[atributoKey]?.value ?? rollData.actor?.[atributoKey] ?? 10);
    const attrMod = Number(actorAttrs?.[atributoKey]?.mod ?? Math.floor((attrVal - 10) / 2));

    const training = Number(rollData.actor?.detalhes?.treinamento?.value ?? rollData.actor?.detalhes?.treinamento ?? 0);
    const itemBonus = Number(attackBlock?.bonus?.value ?? attackBlock?.bonus ?? 0);

    const critThreshold = Number(attackBlock?.critico?.min?.value ?? attackBlock?.critico?.min ?? 20) || 20;
    const critMult = Number(attackBlock?.critico?.mult?.value ?? attackBlock?.critico?.mult ?? 2) || 2;

    const doRoll = async (mode) => {
      let formula = `1d20cs>=${critThreshold}`;
      if (mode === 'adv') formula = '2d20kh1';
      if (mode === 'dis') formula = '2d20kl1';

      const roll = await (new Roll(formula, rollData)).evaluate();

      // Detect the d20 face that was actually used (supports normal/adv/dis)
      let usedD20 = null;
      try {
        for (const term of roll.terms || []) {
          if (!term || !term.results || !term.faces) continue;
          if (Number(term.faces) !== 20) continue;
          const active = (term.results || []).find(r => r.active === true) || (term.results || [])[0];
          if (active && typeof active.result === 'number') {
            usedD20 = Number(active.result);
            break;
          }
        }
      } catch (e) {
        console.warn('Erro ao detectar d20 usado para crítico:', e);
      }

      if (usedD20 == null) {
        try {
          const raw = Number(roll.total) || 0;
          const approx = raw - (attrMod + training + itemBonus);
          if (!isNaN(approx)) usedD20 = Math.max(1, Math.min(20, Math.round(approx)));
        } catch (e) { /* ignore */ }
      }

      const raw = Number(roll.total) || 0;
      const total = raw + attrMod + training + itemBonus;

      const isCritical = (usedD20 != null) ? (Number(usedD20) >= Number(critThreshold)) : false;

      const flavor = `Ataque — ${item.name}`;
      // Construir cartão estilizado parecido com skill-roll
      const formulaShort = `1d20 + ${attrMod}${training ? ' + ' + training + '[Treino]' : ''}${itemBonus ? ' + ' + itemBonus + '[Item]' : ''}`;
      const content = `
        <div class="card chat-card skill-roll">
          <div class="die"><i class="fas fa-dice-d20"></i><span>${usedD20 ?? '-'}</span></div>
          <div class="skill-info">
            <div style="display:flex; align-items:center; gap:8px; justify-content:space-between;">
              <div style="font-weight:700; font-size:1rem">${item.name}</div>
              <div style="font-weight:700; color:#fff; background:#6f42c1; padding:4px 8px; border-radius:6px;">${total}</div>
            </div>
            <div style="margin-top:6px; font-size:0.9rem; color:#ddd; display:flex; gap:12px; align-items:center;">
              <span style="background:#111; padding:3px 6px; border-radius:4px;">Fórmula: <code style="background:transparent; color:#fff;">${formulaShort}</code></span>
              ${isCritical ? '<span style="color:#ffd700; font-weight:700;">CRÍTICO</span>' : ''}
            </div>
            <div style="margin-top:8px;">
              <button class="button roll-weapon-damage" data-actor-id="${this.actor?.id ?? ''}" data-item-id="${this.id}" data-item-uuid="${this.uuid ?? ''}" data-item-name="${this.name ?? ''}" data-critical="${isCritical}" data-crit-mult="${critMult}">Rolar Dano</button>
            </div>
          </div>
        </div>`;

      await ChatMessage.create({ speaker, rollMode, flavor, content, type: CONST.CHAT_MESSAGE_TYPES.ROLL, flags: { 'feiticeiros-e-maldicoes': { skillRoll: true } } });
      return { roll, total, isCritical };
    };

    return new Promise((resolve) => {
      const dContent = `
        <div>Escolha o tipo de teste:</div>
        <div style="margin-top:8px; display:flex; gap:8px;">
          <button id="atk-normal" class="jem-btn jem-btn--primary">Normal</button>
          <button id="atk-adv" class="jem-btn jem-btn--primary">Vantagem</button>
          <button id="atk-dis" class="jem-btn jem-btn--primary">Desvantagem</button>
        </div>`;
      const d = new Dialog({
        title: `Ataque — ${this.name}`,
        content: dContent,
        buttons: {
          normal: { label: 'Normal', callback: async () => { resolve(await doRoll('normal')); } },
          adv: { label: 'Vantagem', callback: async () => { resolve(await doRoll('adv')); } },
          dis: { label: 'Desvantagem', callback: async () => { resolve(await doRoll('dis')); } }
        },
        default: 'normal'
      });
      d.render(true);
    });
  }

  /**
   * Rola o dano do item usando a lógica já existente (escala de nível, flags etc.)
   */
  async rollDamage(isCritical = false, critMult = 2) {
    const item = this;
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');

    // Se houver uma fórmula persistente no item, prioriza
    let formula = this.system?.formula ?? '';
    const rollData = this.getRollData();

    // Se o item possui bloco de damage no sistema, converte o dado conforme níveis
    const damageBlock = this.system?.damage;
    let convertedDie = null;
    try {
      if (damageBlock && ['arma', 'tecnica'].includes(String(item.type))) {
        const base = String(damageBlock.base?.value ?? damageBlock.base ?? '');
        const levelBoost = Number(damageBlock.levelBoost?.value ?? damageBlock.levelBoost ?? 0);
        if (base) {
          // 1) Primeiro converte pela escala de níveis
          const finalDie = convertDamageLevel(base, levelBoost);
          convertedDie = String(finalDie || base);
          if (/\d*d\d+|1/i.test(String(formula))) {
            formula = String(formula).replace(/(\d*d\d+|1)(?![a-z])/i, convertedDie);
          } else {
            formula = `${convertedDie}${formula ? ' + ' + formula : ''}`;
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao converter níveis de dano:', e);
    }

    if (!formula) {
      // fallback: tenta usar damage.base
      formula = String(damageBlock?.base?.value ?? '1d6');
    }

    // 2) Depois de aplicar a conversão, aplica crítico (duplica os dados convertidos)
    if (isCritical && convertedDie) {
      try {
        const m = String(convertedDie).match(/(\d*)d(\d+)/i);
        if (m) {
          const c = Number(m[1]) || 1;
          const f = Number(m[2]);
          const newCount = c * Number(critMult || 2);
          // substitui apenas a primeira ocorrência do dado convertido
          const re = new RegExp(`(\\b${c}d${f}\\b)|(\\bd${f}\\b)`, 'i');
          formula = String(formula).replace(re, `${newCount}d${f}`);
        } else {
          // fallback: duplica o primeiro termo dX encontrado
          formula = String(formula).replace(/(\d*)d(\d+)/i, (m, count, faces) => {
            const n = Number(count) || 1;
            return `${n * Number(critMult || 2)}d${faces}`;
          });
        }
      } catch (e) {
        console.warn('Erro ao aplicar crítico (duplicar dados):', e);
      }
    }

    try {
      if (this.actor && this.actor.getFlag) {
        const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
        if (this.actor && ['arma', 'tecnica'].includes(String(item.type))) {
          const bonuses = (await this.actor.getFlag(sysId, 'bonuses')) || {};
          const bonusAlways = Number(bonuses?.itemDamage ?? 0) || 0;
          const temp = (await this.actor.getFlag(sysId, 'temp')) || {};
          const bonusTemp = Number(temp?.damageBonus ?? 0) || 0;
          const totalBonus = (bonusAlways + bonusTemp);
          if (totalBonus) {
            if (/\bd\d+\b/i.test(String(formula))) {
              formula = `${formula} + ${totalBonus}`;
            }
          }
          if (bonusTemp) {
            const next = foundry.utils.deepClone(temp);
            next.damageBonus = 0;
            await this.actor.setFlag(sysId, 'temp', next);
          }
        }
      }
    } catch (e) { console.warn('Erro ao aplicar bônus de dano (flags):', e); }

    const roll = new Roll(formula, rollData);
    await roll.evaluate();
    const message = await roll.toMessage({ speaker, rollMode, flavor: `[${item.type}] ${item.name} — Dano` });

    try {
      const damageTotal = Number(roll.total) || 0;
      const damageType = String(damageBlock?.type?.value ?? damageBlock?.type ?? '') || '';
      const isSoul = Boolean(damageBlock?.isSoulDamage?.value ?? damageBlock?.isSoulDamage ?? false);

      const buttonsHtml = `
        <div class="jem-chat-actions jem-chat-actions--damage" style="margin-top:6px; display:flex; gap:6px;">
          <button class="button apply-damage" data-value="${damageTotal}" data-type="${damageType}" data-multiplier="1" data-soul="false" data-roller="${game.user?.id}">Causar Dano</button>
          <button class="button apply-damage double" data-value="${damageTotal}" data-type="${damageType}" data-multiplier="2" data-soul="false" data-roller="${game.user?.id}">Causar Dano ×2</button>
          <button class="button apply-damage" data-value="${damageTotal}" data-type="${damageType}" data-multiplier="1" data-soul="true" data-roller="${game.user?.id}">Causar Dano (Alma)</button>
          <button class="button apply-damage" data-value="${damageTotal}" data-type="${damageType}" data-multiplier="0.5" data-soul="false" data-roller="${game.user?.id}">Causar Metade</button>
        </div>`;

      const content = String(message.content || '') + buttonsHtml;
      if (message && typeof message.update === 'function') {
        await message.update({ content });
      } else {
        await ChatMessage.create({ speaker, rollMode, flavor: `[${item.type}] ${item.name} — Dano`, content });
      }
    } catch (e) { console.warn('Erro ao adicionar botões de aplicar dano na mensagem:', e); }

    return roll;
  }
}
