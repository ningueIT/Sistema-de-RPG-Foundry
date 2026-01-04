/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
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

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

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
      }
    } catch (err) {
      console.warn('Falha ao verificar/limpar flags de crítico/Kokusen', err);
    }

    const roll = new Roll(formula, rollData);
    await roll.evaluate();
    roll.toMessage({ speaker, rollMode, flavor: label });
    return roll;
  }
}
