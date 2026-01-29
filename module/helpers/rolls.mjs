/**
 * Helper central para rolar fórmulas usando a API do Foundry
 * Exporta `rollFormula` e `rollDice` para uso pelo sistema.
 */
export async function rollFormula(formula, data = {}, { asyncEval = true, toMessage = true, flavor } = {}) {
  if (!formula) return null;
  try {
    const roll = new Roll(String(formula), data);
    if (asyncEval) {
      await roll.evaluate();
    } else {
      if (typeof roll.evaluateSync === 'function') roll.evaluateSync();
      else await roll.evaluate();
    }

    // Se o módulo Dice So Nice estiver ativo, tenta mostrar a animação
    try {
      const dsActive = !!(game?.modules?.get?.('dice-so-nice')?.active);
      const dice3d = dsActive ? (game.dice3d || window.dice3d || window.Dice3D) : null;
      if (dice3d) {
        try {
          // Preferir passar o objeto `game.user` (algumas versões esperam um User)
          if (typeof dice3d.showForRoll === 'function') {
            try { await dice3d.showForRoll(roll, game.user); }
            catch (e1) {
              try { await dice3d.showForRoll(roll); }
              catch (e2) { throw e2; }
            }
          } else if (typeof dice3d.show === 'function') {
            try { await dice3d.show(roll, { user: game.user }); }
            catch (e1) {
              try { await dice3d.show(roll); }
              catch (e2) { throw e2; }
            }
          }
        } catch (e) {
          console.warn('Dice So Nice: falha ao mostrar animação:', e);
        }
      }
    } catch (e) {
      console.warn('Dice So Nice: verificação falhou:', e);
    }

    if (toMessage) {
      const speaker = (data?.actor) ? ChatMessage.getSpeaker({ actor: data.actor }) : undefined;
      await roll.toMessage({ speaker, flavor });
    }
    return roll;
  } catch (err) {
    console.warn('Erro ao rolar fórmula:', formula, err);
    throw err;
  }
}

export async function rollDice(count = 1, faces = 6, data = {}, opts = {}) {
  const formula = `${Number(count) || 1}d${Number(faces) || 6}`;
  return rollFormula(formula, data, opts);
}
