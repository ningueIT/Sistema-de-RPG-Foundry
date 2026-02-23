/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
import { convertDamageLevel } from "../helpers/damage-scale.mjs";
import { rollFormula } from '../helpers/rolls.mjs';
import { getSureHitTargetsForAttack } from '../helpers/dominio.mjs';
import { requestStartDominioClash } from "../helpers/dominio-clash.mjs";
export class BoilerplateItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    super.prepareBaseData?.();
    try {
      // Compute derived total CA for uniform based on revestimento + optional numeric bonus
      if (String(this.type) === 'uniforme') {
        const revest = String(this.system?.uniforme?.revestimento ?? '').toLowerCase();
        const bonusCa = Number(this.system?.uniforme?.bonusCa ?? NaN);
        const MAP = {
          'leve': { bonus: 2, penalty: 0, caExtra: 1 },
          'medio': { bonus: 4, penalty: -2, caExtra: 2 },
          'robusto': { bonus: 6, penalty: -4, caExtra: 3 },
          'sob_medida': { bonus: 1, penalty: 0, caExtra: 2 }
        };
        const def = MAP[revest] || { bonus: 0, penalty: 0, caExtra: 0 };
        const baseBonus = def.bonus || 0;
        const numericBonus = Number.isFinite(bonusCa) ? Number(bonusCa) : 0;
        const total = baseBonus + numericBonus;
        this.system = this.system || {};
        this.system.uniforme = this.system.uniforme || {};
        this.system.uniforme.total = Number(total);
      }
    } catch (e) {
      // non-fatal
    }
  }

  /**
   * Snapshot before update to detect equip changes
   */
  _preUpdate(changed, options, userId) {
    try {
      const equipped = this.system?.equipado ?? null;
      this._preUpdateEquipSnapshot = { equipado: equipped };
    } catch (e) {
      this._preUpdateEquipSnapshot = { equipado: null };
    }
    return super._preUpdate?.(changed, options, userId);
  }

  /**
   * After update: if this is a `uniforme` and the `system.equipado` flag changed,
   * apply or remove an ActiveEffect on the owning actor.
   */
  async _onUpdate(changed, options, userId) {
    await super._onUpdate(changed, options, userId);

    try {
      if (String(this.type) !== 'uniforme') return;
      const actor = this.actor;
      if (!actor) return;

      const newEquip = (changed?.system && Object.prototype.hasOwnProperty.call(changed.system, 'equipado'))
        ? changed.system.equipado
        : undefined;

      const prev = this._preUpdateEquipSnapshot?.equipado;

      // If nothing relevant changed, skip
      if (typeof newEquip === 'undefined' && prev === (this.system?.equipado ?? null)) return;

      const nowEquipped = (typeof newEquip !== 'undefined') ? newEquip : (this.system?.equipado ?? null);

      if (nowEquipped) {
        // Create ActiveEffect on actor representing the uniform's mechanical effect (if parseable)
        const effectData = this._buildUniformEffectData();
        if (effectData) {
          // Avoid duplicates: remove any existing effects from this origin first
          const existing = actor.effects.filter(e => String(e.origin || '') === String(this.uuid));
          for (const e of existing) {
            try { await e.delete(); } catch (err) { /* non-fatal */ }
          }
          await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        }
      } else {
        // Remove effects created by this uniform (origin match)
        const toRemove = actor.effects.filter(e => String(e.origin || '') === String(this.uuid));
        for (const eff of toRemove) {
          try { await eff.delete(); } catch (err) { /* non-fatal */ }
        }
      }
    } catch (e) {
      console.warn('Erro ao aplicar/remover ActiveEffect de uniforme:', e);
    }
  }

  /**
   * Constrói um ActiveEffect a partir do campo livre `system.uniforme.efeito`.
   * Suporta sintaxe simples como "+1 Defesa" (case-insensitive). Retorna null
   * se não for possível interpretar a string como mudança mecânica.
   */
  _buildUniformEffectData() {
    try {
      // Prefer explicit numeric fields if provided
      const revest = String(this.system?.uniforme?.revestimento ?? '').toLowerCase();
      const explicitBonus = Number(this.system?.uniforme?.bonus ?? NaN);
      const explicitCAExtra = Number(this.system?.uniforme?.caExtra ?? NaN);

      // Defaults per revestimento
      const MAP = {
        'leve': { bonus: 2, penalty: 0, caExtra: 1 },
        'medio': { bonus: 4, penalty: -2, caExtra: 2 },
        'robusto': { bonus: 6, penalty: -4, caExtra: 3 },
        'sob_medida': { bonus: 1, penalty: 0, caExtra: 2 }
      };

      const def = MAP[revest] || { bonus: 0, penalty: 0, caExtra: 0 };
      const bonus = Number.isFinite(explicitBonus) ? explicitBonus : def.bonus;
      const caExtra = Number.isFinite(explicitCAExtra) ? explicitCAExtra : def.caExtra;
      const penalty = def.penalty || 0;

      // Also parse free-text +N Defesa for compatibility
      const txt = String(this.system?.uniforme?.efeito ?? '').trim();
      let parsedBonus = 0;
      if (txt) {
        const m = txt.match(/^([+-]?\d+)\s*(defesa)\b/i);
        if (m) parsedBonus = Number(m[1]) || 0;
      }

      const totalAdd = (bonus || 0) + (caExtra || 0) + (parsedBonus || 0);

      const changes = [];
      if (totalAdd) {
        changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(totalAdd), priority: 20 });
      }

      // Apply penalties/bonuses to Destreza-based skills (Acrobacia, Furtividade)
      const dexSkills = ['system.pericias.acrobacia.value', 'system.pericias.furtividade.value'];
      if (penalty) {
        for (const k of dexSkills) changes.push({ key: k, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(penalty), priority: 20 });
      }

      // Sob Medida grants +2 to Acrobacia and Furtividade in addition to the generic bonus
      if (revest === 'sob_medida') {
        for (const k of dexSkills) changes.push({ key: k, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: '2', priority: 20 });
      }

      if (!changes.length) return null;

      return {
        label: `${this.name} (Uniforme)`,
        icon: this.img || 'icons/svg/shield.svg',
        origin: this.uuid,
        disabled: false,
        changes
      };
    } catch (e) {
      console.warn('Falha ao construir ActiveEffect para uniforme:', e);
      return null;
    }
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

    // Intercepta itens de Expansão de Domínio: pergunta se o jogador quer Dados ou Skill Check.
    // Mantém o fluxo padrão para todos os outros itens.
    try {
      const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
      const nameNorm = norm(this.name);

      const tagsRaw = this.system?.tags;
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw.map(t => norm(t))
        : (typeof tagsRaw === 'string' ? tagsRaw.split(/[,;|]/g).map(t => norm(t)) : []);

      const isDominio = (
        nameNorm.includes('expansao de dominio') ||
        String(this.type) === 'dominio' ||
        tags.includes('dominio') ||
        tags.includes('expansao de dominio')
      );

      if (isDominio && this.actor) {
        const choice = await new Promise((resolve) => {
          new Dialog({
            title: 'Modo de Confronto',
            content: `
              <div style="margin-bottom: 10px;">
                <p>Como deseja realizar este confronto?</p>
                <ul>
                  <li><strong>Skill Check:</strong> minigame de reflexo.</li>
                  <li><strong>Dados:</strong> rolagem padrão do item (envia card no chat).</li>
                </ul>
              </div>
            `,
            buttons: {
              skill: {
                label: 'Skill Check',
                callback: () => resolve('skill'),
              },
              dados: {
                label: 'Rodar Dados',
                callback: () => resolve('dados'),
              },
            },
            default: 'skill',
            close: () => resolve('close'),
          }).render(true);
        });

        if (choice === 'skill') {
          const targets = Array.from(game.user?.targets ?? []);
          if (targets.length !== 1) {
            ui?.notifications?.warn?.('Para o Skill Check, selecione exatamente 1 alvo (token do oponente) na cena.');
            return null;
          }

          const challengerToken = targets[0];
          const challengerTokenDoc = challengerToken?.document ?? challengerToken;
          const challengerTokenId = challengerTokenDoc?.id ?? null;
          const challengerActorId = challengerTokenDoc?.actorId ?? challengerToken?.actor?.id ?? null;

          if (!challengerActorId) {
            ui?.notifications?.error?.('O alvo selecionado não possui um ator válido.');
            return null;
          }

          await requestStartDominioClash({
            ownerActorId: this.actor.id,
            challengerActorId,
            challengerTokenId,
            source: 'item.roll:dominio-modal',
          });

          return null;
        }

        if (choice === 'close') return null;
        // choice === 'dados' => cai no fluxo normal abaixo
      }
    } catch (e) {
      console.warn('Falha ao interceptar Expansão de Domínio no roll():', e);
      // Em caso de erro, deixa o fluxo padrão continuar.
    }

    // If this is a weapon, start the attack flow (attack roll then damage)
    if (String(item.type) === 'arma') {
      return item.rollAttack();
    }

    // Ação de NPC: cria pré-visualização e botão para executar (consome PE)
    if (String(item.type) === 'acao-npc') {
      const speaker = ChatMessage.getSpeaker({ actor: this.actor });
      const rollMode = game.settings.get('core', 'rollMode');

      const custoPe = Number(this.system?.custoPe?.value ?? this.system?.custoPe ?? 0) || 0;
      const tipo = String(this.system?.tipoAcerto?.value ?? this.system?.tipoAcerto ?? 'atributo_bt');
      const atributo = String(this.system?.atributo?.value ?? this.system?.atributo ?? 'forca');
      const danoMedio = Number(this.system?.danoMedio?.value ?? this.system?.danoMedio ?? 0) || 0;
      const segundaFase = !!(this.system?.segundaFase?.value ?? this.system?.segundaFase ?? false);
      const treinamento = Number(this.system?.treinamento?.value ?? this.system?.treinamento ?? 2) || 2;
      const alcanceMax = Number(this.system?.alcanceMax?.valor?.value ?? this.system?.alcanceMax ?? 0) || 0;
      const areaMax = Number(this.system?.areaMax?.valor?.value ?? this.system?.areaMax ?? 0) || 0;
      const formulaDano = String(this.system?.formulaDano?.value ?? this.system?.formulaDano ?? '');
      const aplicaCondicao = !!(this.system?.aplicaCondicao?.value ?? this.system?.aplicaCondicao ?? false);
      const condicao = String(this.system?.condicao?.value ?? this.system?.condicao ?? 'fraca');
      const condUsaPe = !!(this.system?.condicaoUsaPe?.value ?? this.system?.condicaoUsaPe ?? false);
      const condCustoPe = Number(this.system?.condicaoCustoPe?.value ?? this.system?.condicaoCustoPe ?? 0) || 0;

      // Compute a quick preview
      const actorData = this.actor?.system ?? {};
      const attrVal = Number(actorData.atributos?.[atributo]?.value ?? 10);
      const attrMod = Number(actorData.atributos?.[atributo]?.mod ?? Math.floor((attrVal - 10) / 2)) || 0;
      const bt = Number(actorData.detalhes?.treinamento?.value ?? actorData.treinamento ?? actorData.bt ?? 0) || 0;

      let preview = '';
      if (tipo === 'automatico') preview = 'Acerto automático';
      else if (tipo === 'cd') preview = 'Teste contra CD (o alvo rola contra sua CD)';
      else if (tipo === 'tr') preview = `Teste de Resistência (individual) — dano reduzido em 1 ND`; 
      else if (tipo === 'tr_area') preview = `Teste de Resistência (área) — dano reduzido pela metade`; 
      else preview = `1d20 + ${attrMod} (atributo) + ${bt} (BT)`;

      const condHtml = aplicaCondicao ? `<div>Aplica condição: <strong>${condicao}</strong> ${condUsaPe ? `(custa ${condCustoPe} PE)` : ''}</div>` : '';

      const content = `
        <div class="card chat-card skill-roll">
          <div style="font-weight:700;">${this.name} — Ação de NPC</div>
          <div style="margin-top:6px;">Tipo de acerto: <strong>${tipo}</strong></div>
          <div>Preview: <strong>${preview}</strong></div>
          <div style="margin-top:6px;">Treinamento (BT): <strong>${treinamento}</strong></div>
          <div>Alcance Máx: <strong>${alcanceMax} m</strong> — Área Máx: <strong>${areaMax} m</strong></div>
          ${formulaDano ? `<div>Fórmula de dano: <strong>${formulaDano}</strong></div>` : ''}
          ${condHtml}
          <div style="margin-top:6px;">Custo de PE: <strong>${custoPe}</strong></div>
          <div style="margin-top:8px; display:flex; gap:8px;">
            <button class="button npc-action-exec jem-btn jem-btn--confirm" data-item-uuid="${this.uuid}" data-actor-id="${this.actor?.id}" data-custo="${custoPe}">Executar Ação</button>
          </div>
          ${danoMedio ? `<div style="margin-top:8px;">Dano médio: <strong>${danoMedio}</strong></div>` : ''}
        </div>`;

      await ChatMessage.create({ speaker, rollMode, flavor: `[ação-npc] ${this.name}`, content, flags: { 'feiticeiros-e-maldicoes': { npcAction: true } } });
      return null;
    }

    // Dotes: "usar" ao clicar
    // - Passiva: alterna Ativo (equipado) para aplicar/remover efeitos passivos
    // - Sem fórmula: posta um card no chat usando descrição/efeito (em vez de system.description)
    if (String(item.type) === 'dote') {
      const acao = String(this.system?.acao?.value ?? this.system?.acao ?? '').toLowerCase();
      if (acao === 'passiva') {
        const isObj = (this.system?.equipado && typeof this.system.equipado === 'object' && Object.prototype.hasOwnProperty.call(this.system.equipado, 'value'));
        const equipped = Boolean(isObj ? this.system?.equipado?.value : this.system?.equipado);

        try {
          await this.update(isObj ? { 'system.equipado.value': !equipped } : { 'system.equipado': !equipped });
          const label = !equipped ? 'ativado' : 'desativado';
          ui?.notifications?.info?.(`Dote ${label}: ${this.name}`);
        } catch (e) {
          console.warn('Falha ao alternar dote passivo (equipado):', e);
        }
        return null;
      }

      // Se tiver fórmula, deixa cair no fluxo padrão para rolar.
      if (!this.system?.formula) {
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');
        const custoPe = Number(this.system?.custoPe?.value ?? this.system?.custoPe ?? 0) || 0;
        const acaoLabel = String(this.system?.acao?.value ?? this.system?.acao ?? '').trim();
        const categoria = String(this.system?.categoria?.value ?? this.system?.categoria ?? '').trim();
        const descricao = String(this.system?.descricao?.value ?? this.system?.descricao ?? this.system?.description ?? '').trim();
        const efeito = String(this.system?.efeito?.value ?? this.system?.efeito ?? '').trim();

        const meta = [
          categoria ? `<span><strong>Categoria:</strong> ${categoria}</span>` : '',
          acaoLabel ? `<span><strong>Ação:</strong> ${acaoLabel}</span>` : '',
          (custoPe || custoPe === 0) ? `<span><strong>PE:</strong> ${custoPe}</span>` : ''
        ].filter(Boolean).join(' — ');

        const content = `
          <div class="card chat-card skill-roll">
            <div style="font-weight:700;">${this.name} — Dote</div>
            ${meta ? `<div style="margin-top:6px; opacity:0.9;">${meta}</div>` : ''}
            ${descricao ? `<div style="margin-top:8px;">${descricao}</div>` : ''}
            ${efeito ? `<div style="margin-top:8px;"><strong>Efeito:</strong> ${efeito}</div>` : ''}
          </div>`;

        await ChatMessage.create({ speaker, rollMode, flavor: `[dote] ${this.name}`, content });
        return null;
      }
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
    let afterAttackBonus = 0;

    try {
      if (this.actor && this.actor.getFlag) {
        // Última Ação crítico garantido: substitui d20 por 20
        const ultimaCrit = await this.actor.getFlag(game.system.id, 'ultimaAcao.critico');
        if (ultimaCrit) {
          formula = String(formula).replace(/\b\d*d20(?:[a-z]{1,2}\d+|cs[<>=!]+\d+|cf[<>=!]+\d+|kh\d+|kl\d+)?\b/i, '20');
          try { await this.actor.unsetFlag(game.system.id, 'ultimaAcao.critico'); } catch(_){}
        }

        // Kokusen: marcado no ator e consumido no rollDamage (1.5x e ignora RD)

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
            // Dano Após Ataque: aplicado depois do Kokusen (não entra na rolagem)
            afterAttackBonus = Number(temp?.afterAttackDamage ?? temp?.damageAfterAttack ?? 0) || 0;

            const totalBonus = (bonusAlways + bonusTemp);
            if (totalBonus) {
              // Só adiciona se houver algum termo de dano (dado) na fórmula
              if (/\bd\d+\b/i.test(String(formula))) {
                formula = `${formula} + ${totalBonus}`;
              }
            }

            if (bonusTemp || afterAttackBonus) {
              const next = foundry.utils.deepClone(temp);
              next.damageBonus = 0;
              if (next.afterAttackDamage != null) next.afterAttackDamage = 0;
              if (next.damageAfterAttack != null) next.damageAfterAttack = 0;
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

    let roll;
    try {
      roll = await rollFormula(formula, rollData, { asyncEval: true, toMessage: false });
    } catch (err) {
      console.warn('Erro ao avaliar roll via rollFormula:', err);
      ui?.notifications?.error?.('Fórmula inválida para rolagem de dano.');
      return null;
    }
    // Construir cartão estilizado para o dano
    try {
      const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
      const baseTotal = Number(roll.total) || 0;
      const damageType = String(damageBlock?.type?.value ?? damageBlock?.type ?? '') || '';
      const formulaShort = Roll.cleanFormula(String(formula || ''), rollData);

      // Kokusen: 1.5x no dano rolado (antes de Dano Após Ataque) e ignora RD
      let isKokusen = false;
      let ignoreRD = false;
      let kokusenBonus = 0;
      let finalTotal = baseTotal;
      try {
        const pending = await this.actor?.getFlag?.(sysId, 'kokusen.pending');
        const legacy = await this.actor?.getFlag?.(sysId, 'kokusen.pendingDoubleDamage');
        if (pending || legacy) {
          isKokusen = true;
          ignoreRD = true;
          kokusenBonus = Math.floor(baseTotal / 2);
          finalTotal = baseTotal + kokusenBonus;
          try { await this.actor.unsetFlag(sysId, 'kokusen.pending'); } catch (_) {}
          try { await this.actor.unsetFlag(sysId, 'kokusen.pendingDoubleDamage'); } catch (_) {}
        }
      } catch (e) {
        console.warn('Erro ao verificar flag pendente de Kokusen:', e);
      }

      if (afterAttackBonus) finalTotal += Number(afterAttackBonus) || 0;

      const extraInfo = isKokusen
        ? `<div class="flavor-text" style="margin-top:6px;">Kokusen: ${baseTotal} + ${kokusenBonus} (metade)${afterAttackBonus ? ` + ${afterAttackBonus} (Após Ataque)` : ''} = <strong>${finalTotal}</strong> (ignora RD)</div>`
        : (afterAttackBonus ? `<div class="flavor-text" style="margin-top:6px;">Dano Após Ataque: +${afterAttackBonus} → <strong>${finalTotal}</strong></div>` : '');

      const dmgContent = `
        <div class="card chat-card skill-roll">
          <div class="die" style="width:56px;height:56px;border-radius:8px;background:#111;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;color:#fff">
            <i class="fas fa-bolt"></i><span>${finalTotal}</span>
          </div>
          <div class="skill-info">
            <div style="display:flex; align-items:center; gap:8px; justify-content:space-between;">
              <div style="font-weight:700; font-size:1rem">${item.name} — Dano</div>
              <div style="font-weight:700; color:#fff; background:#6f42c1; padding:4px 8px; border-radius:6px;">${finalTotal}</div>
            </div>
            <div style="margin-top:6px; font-size:0.9rem; color:#ddd;">
              <span style="background:#111; padding:3px 6px; border-radius:4px;">Fórmula: <code style="background:transparent; color:#fff;">${formulaShort}</code></span>
            </div>
            ${extraInfo || ''}
            <div style="margin-top:8px; display:flex; gap:8px;">
              <button class="button apply-damage" data-value="${finalTotal}" data-type="${damageType}" data-multiplier="1" data-soul="false" data-ignore-rd="${ignoreRD}" data-roller="${game.user?.id}">Causar Dano</button>
              <button class="button apply-damage double" data-value="${finalTotal}" data-type="${damageType}" data-multiplier="2" data-soul="false" data-ignore-rd="${ignoreRD}" data-roller="${game.user?.id}">Causar Dano ×2</button>
              <button class="button apply-damage" data-value="${finalTotal}" data-type="${damageType}" data-multiplier="0.5" data-soul="false" data-ignore-rd="${ignoreRD}" data-roller="${game.user?.id}">Causar Metade</button>
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

    const targets = Array.from(game.user?.targets ?? []);
    const targetTokenDocs = targets.map(t => t?.document).filter(Boolean);
    const sureHitTokenDocs = (() => {
      try { return getSureHitTargetsForAttack(this.actor, targetTokenDocs) || []; } catch (_) { return []; }
    })();
    const sureHitIds = new Set(sureHitTokenDocs.map(t => t.id));

    const primaryTarget = (targetTokenDocs.length === 1) ? targetTokenDocs[0] : null;
    const primaryTargetActor = primaryTarget?.actor ?? null;
    const primaryTargetDefense = Number(primaryTargetActor?.system?.combate?.defesa?.value ?? primaryTargetActor?.system?.combate?.defesa ?? NaN);
    const hasPrimaryDefense = Number.isFinite(primaryTargetDefense);

    const rollData = this.getRollData();

    const attackBlock = this.system?.ataque ?? {};
    const atributoKey = String(attackBlock?.atributo?.value ?? attackBlock?.atributo ?? 'forca');

    const actorAttrs = rollData.actor?.atributos ?? {};
    const attrVal = Number(actorAttrs?.[atributoKey]?.value ?? rollData.actor?.[atributoKey] ?? 10);
    const attrMod = Number(actorAttrs?.[atributoKey]?.mod ?? Math.floor((attrVal - 10) / 2));

    const training = Number(rollData.actor?.detalhes?.treinamento?.value ?? rollData.actor?.detalhes?.treinamento ?? 0);
    let itemBonus = Number(attackBlock?.bonus?.value ?? attackBlock?.bonus ?? 0);

    // Treinamento: Manejo de Arma (bônus só para a arma escolhida)
    try {
      const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
      const t = this.actor?.system?.treinamentoDerivados ?? {};
      const choice = String(t?.escolhas?.manejoArma?.norm ?? '').trim();
      if (choice && String(item.type) === 'arma') {
        const nameNorm = norm(item.name);
        if (nameNorm && (nameNorm === choice || nameNorm.includes(choice) || choice.includes(nameNorm))) {
          const atkBonus = Number(t?.bonuses?.manejoArma?.ataque ?? 0) || 0;
          if (atkBonus) itemBonus += atkBonus;
        }
      }
    } catch (_) {}

    const critThreshold = Number(attackBlock?.critico?.min?.value ?? attackBlock?.critico?.min ?? 20) || 20;
    const critMult = Number(attackBlock?.critico?.mult?.value ?? attackBlock?.critico?.mult ?? 2) || 2;

    const doRoll = async (mode) => {
      let formula = `1d20`;
      if (mode === 'adv') formula = '2d20kh1';
      if (mode === 'dis') formula = '2d20kl1';

      const roll = await rollFormula(formula, rollData, { asyncEval: true, toMessage: false });

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

      // Aplicar penalidades provenientes de condições ativas no ator
      let attackPenalty = 0;
      try {
        const effects = this.actor?.effects?.filter?.(e => !e.disabled) ?? [];
        for (const eff of effects) {
          try {
            const cond = eff?.flags?.['feiticeiros-e-maldicoes']?.condition;
            if (!cond) continue;
            if (cond === 'condicoes.fisicas.envenenado') attackPenalty += 2;
            if (cond === 'condicoes.movimento.enredado') attackPenalty += 2;
            if (cond === 'condicoes.mentais.abalado') attackPenalty += 1;
            if (cond === 'condicoes.mentais.amedrontado') attackPenalty += 3;
            if (cond === 'condicoes.fisicas.paralisado') attackPenalty += 9999; // effectively prevents
          } catch (e) { /* ignore effect parsing errors */ }
        }
      } catch (e) { /* ignore */ }

      const total = raw + attrMod + training + itemBonus - attackPenalty;

      // Regra da casa: 20 natural NÃO é crítico. Ele pode virar Kokusen.
      // Crítico ainda pode existir por outras fontes, mas não por um 20 natural.
      const isCritical = false;

      let kokusenTag = '';
      try {
        const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
        const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        const hasKokusenAbility = Boolean(
          foundry.utils.getProperty(this.actor?.system, 'aptidoes.especiais.raioNegro') ||
          this.actor?.items?.some(i => ['kokusen', 'raio negro'].includes(norm(i?.name)))
        );

        if (Number(usedD20) === 20) {
          let kokusenTriggered = false;
          let chanceD6 = null;

          if (hasKokusenAbility) {
            kokusenTriggered = true;
          } else {
            const rollD6 = await rollFormula('1d6', rollData, { asyncEval: true, toMessage: false });
            chanceD6 = Number(rollD6.total || 0);
            kokusenTriggered = (chanceD6 === 6);
          }

          if (kokusenTriggered) {
            await this.actor.setFlag(sysId, 'kokusen.pending', true);
            kokusenTag = '<span style="color:#111; background:#ffd700; padding:2px 6px; border-radius:6px; font-weight:800;">KOKUSEN</span>';
          } else {
            kokusenTag = `<span style="color:#bbb; font-weight:700;">20 natural${chanceD6 != null ? ` (d6: ${chanceD6})` : ''}</span>`;
          }
        }
      } catch (e) {
        console.warn('Erro ao processar chance de Kokusen no ataque:', e);
      }

      const flavor = `Ataque — ${item.name}`;
      // Construir cartão estilizado parecido com skill-roll
      const formulaShort = `1d20 + ${attrMod}${training ? ' + ' + training + '[Treino]' : ''}${itemBonus ? ' + ' + itemBonus + '[Item]' : ''}${attackPenalty ? ' - ' + attackPenalty + '[Cond]' : ''}`;

      const sureHitForPrimary = Boolean(primaryTarget && sureHitIds.has(primaryTarget.id));
      const hitComputed = (primaryTarget && hasPrimaryDefense)
        ? (sureHitForPrimary || (Number(total) >= Number(primaryTargetDefense)))
        : null;

      const hitBadge = (hitComputed === null)
        ? ''
        : (hitComputed ? '<span style="color:#111; background:#20c997; padding:2px 6px; border-radius:6px; font-weight:800;">ACERTOU</span>'
          : '<span style="color:#111; background:#dc3545; padding:2px 6px; border-radius:6px; font-weight:800;">ERROU</span>');

      const sureHitBadge = sureHitForPrimary
        ? '<span style="color:#111; background:#ffc107; padding:2px 6px; border-radius:6px; font-weight:800;">ACERTO GARANTIDO</span>'
        : '';

      const defenseLine = (primaryTarget && hasPrimaryDefense)
        ? `<div style="margin-top:6px; font-size:0.9rem; color:#ddd;">Alvo: <strong>${primaryTargetActor?.name ?? '—'}</strong> — Defesa: <strong>${primaryTargetDefense}</strong> ${hitBadge} ${sureHitBadge}</div>`
        : (primaryTarget && !hasPrimaryDefense)
          ? `<div style="margin-top:6px; font-size:0.9rem; color:#ddd;">Alvo: <strong>${primaryTargetActor?.name ?? '—'}</strong> — Defesa: <strong>—</strong></div>`
          : '';

      const multiSureHitLine = (!primaryTarget && sureHitTokenDocs.length)
        ? `<div style="margin-top:6px; font-size:0.9rem; color:#ddd;">Acerto Garantido (Domínio) em: <strong>${sureHitTokenDocs.map(t => t?.name ?? t?.actor?.name ?? '—').join(', ')}</strong></div>`
        : '';

      const canRollDamage = (hitComputed === null) ? true : Boolean(hitComputed);
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
              ${kokusenTag || ''}
            </div>
            ${defenseLine}
            ${multiSureHitLine}
            <div style="margin-top:8px;">
              ${canRollDamage ? `<button class="button roll-weapon-damage" data-actor-id="${this.actor?.id ?? ''}" data-item-id="${this.id}" data-item-uuid="${this.uuid ?? ''}" data-item-name="${this.name ?? ''}" data-critical="${isCritical}" data-crit-mult="${critMult}">Rolar Dano</button>` : `<div style="opacity:0.85; font-weight:700;">Sem dano (ataque errou).</div>`}
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
        let levelBoost = Number(damageBlock.levelBoost?.value ?? damageBlock.levelBoost ?? 0);

        // Treinamento: Treino de Luta (aumenta nível do dano desarmado)
        try {
          const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
          const n = norm(item?.name ?? '');
          const isUnarmed = (String(item.type) === 'arma') && (n === 'soco' || n === 'desarmado');
          if (isUnarmed) {
            const t = this.actor?.system?.treinamentoDerivados ?? {};
            const boost = Number(t?.bonuses?.luta?.unarmedLevelBoost ?? 0) || 0;
            if (boost) levelBoost += boost;
          }
        } catch (_) {}
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

    // 3) Kokusen é aplicado DEPOIS da rolagem (1.5x) e ignora RD.

    // Treinamento: Manejo de Arma (bônus plano em dano para a arma escolhida)
    try {
      const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
      const t = this.actor?.system?.treinamentoDerivados ?? {};
      const choice = String(t?.escolhas?.manejoArma?.norm ?? '').trim();
      if (choice && String(item.type) === 'arma') {
        const nameNorm = norm(item.name);
        if (nameNorm && (nameNorm === choice || nameNorm.includes(choice) || choice.includes(nameNorm))) {
          const dmgBonus = Number(t?.bonuses?.manejoArma?.dano ?? 0) || 0;
          if (dmgBonus) formula = `${formula} + ${dmgBonus}`;
        }
      }
    } catch (_) {}

    let afterAttackBonus = 0;
    try {
      if (this.actor && this.actor.getFlag) {
        const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
        if (this.actor && ['arma', 'tecnica'].includes(String(item.type))) {
          const bonuses = (await this.actor.getFlag(sysId, 'bonuses')) || {};
          const bonusAlways = Number(bonuses?.itemDamage ?? 0) || 0;
          // Domínio: Amplificação Técnica (bônus específico para técnicas)
          if (String(item.type) === 'tecnica') {
            const techDice = Number(bonuses?.dominio?.techDice ?? 0) || 0;
            const techFlat = Number(bonuses?.dominio?.techFlat ?? 0) || 0;
            if (techDice || techFlat) {
              const faces = Number(String(convertedDie || '').match(/d(\d+)/i)?.[1] ?? String(formula).match(/d(\d+)/i)?.[1] ?? 0) || 0;
              if (faces && techDice) formula = `${formula} + ${techDice}d${faces}`;
              if (techFlat) formula = `${formula} + ${techFlat}`;
            }
          }
          const temp = (await this.actor.getFlag(sysId, 'temp')) || {};
          const bonusTemp = Number(temp?.damageBonus ?? 0) || 0;
          // Dano Após Ataque: aplicado depois de Kokusen (não entra na rolagem)
          afterAttackBonus = Number(temp?.afterAttackDamage ?? temp?.damageAfterAttack ?? 0) || 0;
          const totalBonus = (bonusAlways + bonusTemp);
          if (totalBonus) {
            if (/\bd\d+\b/i.test(String(formula))) {
              formula = `${formula} + ${totalBonus}`;
            }
          }
          if (bonusTemp || afterAttackBonus) {
            const next = foundry.utils.deepClone(temp);
            next.damageBonus = 0;
            if (next.afterAttackDamage != null) next.afterAttackDamage = 0;
            if (next.damageAfterAttack != null) next.damageAfterAttack = 0;
            await this.actor.setFlag(sysId, 'temp', next);
          }
        }
      }
    } catch (e) { console.warn('Erro ao aplicar bônus de dano (flags):', e); }

    let roll;
    try {
      roll = await rollFormula(formula, rollData, { asyncEval: true, toMessage: false });
    } catch (err) {
      console.warn('Erro ao avaliar rollDamage via rollFormula:', err);
      ui?.notifications?.error?.('Fórmula inválida para dano.');
      return null;
    }
    const message = await roll.toMessage({ speaker, rollMode, flavor: `[${item.type}] ${item.name} — Dano` });

    try {
      const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
      const baseTotal = Number(roll.total) || 0;
      const damageType = String(damageBlock?.type?.value ?? damageBlock?.type ?? '') || '';
      const isSoul = Boolean(damageBlock?.isSoulDamage?.value ?? damageBlock?.isSoulDamage ?? false);

      // Kokusen: 1.5x no dano rolado (antes de Dano Após Ataque), ignora RD
      let isKokusen = false;
      let ignoreRD = false;
      let kokusenBonus = 0;
      let finalTotal = baseTotal;
      try {
        const pending = await this.actor?.getFlag?.(sysId, 'kokusen.pending');
        const legacy = await this.actor?.getFlag?.(sysId, 'kokusen.pendingDoubleDamage');
        if (pending || legacy) {
          isKokusen = true;
          ignoreRD = true;
          kokusenBonus = Math.floor(baseTotal / 2);
          finalTotal = baseTotal + kokusenBonus;
          try { await this.actor.unsetFlag(sysId, 'kokusen.pending'); } catch (_) {}
          try { await this.actor.unsetFlag(sysId, 'kokusen.pendingDoubleDamage'); } catch (_) {}
        }
      } catch (e) {
        console.warn('Erro ao verificar flag pendente de Kokusen:', e);
      }

      if (afterAttackBonus) finalTotal += Number(afterAttackBonus) || 0;

      const kokusenInfo = isKokusen
        ? `<div class="flavor-text" style="margin-top:6px;">Kokusen: ${baseTotal} + ${kokusenBonus} (metade)${afterAttackBonus ? ` + ${afterAttackBonus} (Após Ataque)` : ''} = <strong>${finalTotal}</strong> (ignora RD)</div>`
        : (afterAttackBonus ? `<div class="flavor-text" style="margin-top:6px;">Dano Após Ataque: +${afterAttackBonus} → <strong>${finalTotal}</strong></div>` : '');

      const buttonsHtml = `
        <div class="jem-chat-actions jem-chat-actions--damage" style="margin-top:6px; display:flex; gap:6px;">
          <button class="button apply-damage" data-value="${finalTotal}" data-type="${damageType}" data-multiplier="1" data-soul="false" data-ignore-rd="${ignoreRD}" data-roller="${game.user?.id}">Causar Dano</button>
          <button class="button apply-damage double" data-value="${finalTotal}" data-type="${damageType}" data-multiplier="2" data-soul="false" data-ignore-rd="${ignoreRD}" data-roller="${game.user?.id}">Causar Dano ×2</button>
          <button class="button apply-damage" data-value="${finalTotal}" data-type="${damageType}" data-multiplier="1" data-soul="true" data-ignore-rd="true" data-roller="${game.user?.id}">Causar Dano (Alma)</button>
          <button class="button apply-damage" data-value="${finalTotal}" data-type="${damageType}" data-multiplier="0.5" data-soul="false" data-ignore-rd="${ignoreRD}" data-roller="${game.user?.id}">Causar Metade</button>
        </div>`;

      const content = String(message.content || '') + (kokusenInfo || '') + buttonsHtml;
      if (message && typeof message.update === 'function') {
        await message.update({ content });
      } else {
        await ChatMessage.create({ speaker, rollMode, flavor: `[${item.type}] ${item.name} — Dano`, content });
      }
    } catch (e) { console.warn('Erro ao adicionar botões de aplicar dano na mensagem:', e); }

    return roll;
  }
}
