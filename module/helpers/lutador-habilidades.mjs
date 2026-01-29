import { MAPA_ATRIBUTOS } from '../sheets/actor-sheet/atributos.mjs';
import { rollFormula } from './rolls.mjs';

function _systemId() {
  return game?.system?.id ?? 'feiticeiros-e-maldicoes';
}

function _norm(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function _getActorNivelTotal(actor) {
  const detalhes = actor?.system?.detalhes ?? {};
  const principal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
  const secundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;
  return (principal || secundario)
    ? (principal + secundario)
    : (Number(detalhes?.nivel?.value ?? 0) || 0);
}

function _getTreino(actor) {
  return Number(actor?.system?.detalhes?.treinamento?.value ?? 0) || 0;
}

function _getAttrMod(actor, attrKey) {
  return Number(actor?.system?.atributos?.[attrKey]?.mod ?? 0) || 0;
}

function _getHalfLevel(actor) {
  return Math.floor(_getActorNivelTotal(actor) / 2);
}

function _durationFromText(text = '') {
  const t = _norm(text);
  if (!t) return null;
  if (t.includes('instantaneo')) return { rounds: 0 };
  if (t.includes('permanente')) return null;
  if (t.includes('sustent')) return null;
  if (t.includes('ate proximo turno') || t.includes('ate o proximo turno') || t.includes('ate o prox turno') || t.includes('ate o proximo')) return { rounds: 1 };
  const mRod = t.match(/\b(\d+)\s*rodad/);
  if (mRod?.[1]) return { rounds: Number(mRod[1]) || 1 };
  if (t.includes('cena')) return { seconds: 60 * 60 };
  return null;
}

const CONDICOES_MAP = {
  // sensoriais
  desprevenido: 'system.condicoes.sensoriais.desprevenido',
  desorientado: 'system.condicoes.sensoriais.desorientado',
  enjoado: 'system.condicoes.fisicas.enjoado',
  exposto: 'system.condicoes.mentais.exposto',
  caido: 'system.condicoes.movimento.caido',
  atordoado: 'system.condicoes.movimento.atordoado',
  abalado: 'system.condicoes.mentais.abalado',
  amedrontado: 'system.condicoes.mentais.amedrontado',
  confuso: 'system.condicoes.mentais.confuso',
  agarrado: 'system.condicoes.movimento.agarrado',
  paralisado: 'system.condicoes.fisicas.paralisado',
};

function _extractConditions(desc = '') {
  const t = _norm(desc);
  const found = [];
  for (const [k] of Object.entries(CONDICOES_MAP)) {
    // word boundary-ish: evita casar "amedrontado" dentro de outra coisa improvável
    const re = new RegExp(`\\b${k}\\b`, 'i');
    if (re.test(t)) found.push(k);
  }
  return found;
}

function _extractSelfConditions(desc = '') {
  const t = _norm(desc);
  if (!t) return [];
  // Heurística: se vier perto de "voce fica"/"você fica"/"fica" e estiver com um dos nomes
  const conds = _extractConditions(t);
  const self = [];
  for (const c of conds) {
    const re = new RegExp(`(voce|você)[^\.\n]{0,80}\\b${c}\\b`, 'i');
    if (re.test(t)) self.push(c);
  }
  return self;
}

function _extractTargetConditions(desc = '') {
  const t = _norm(desc);
  if (!t) return [];
  const conds = _extractConditions(t);
  const target = [];
  for (const c of conds) {
    const re = new RegExp(`(alvo|criatura|inimigo)[^\.\n]{0,120}\\b${c}\\b`, 'i');
    if (re.test(t)) target.push(c);
  }
  return target;
}

function _extractNumericBonuses(desc = '') {
  const t = _norm(desc);
  const out = {
    defesa: null,
    ataqueCorpo: null,
    ataqueDistancia: null,
    dano: null,
    salvaguardas: {},
  };

  // Defesa +X
  let m = t.match(/defesa\s+(aumenta|aumentar|recebe|ganha)\s+em\s*\+?(\d+)/);
  if (!m) m = t.match(/\+?(\d+)\s+na\s+defesa/);
  if (m?.[2] || m?.[1]) out.defesa = Number(m?.[2] ?? m?.[1]) || null;

  // Ataque corpo a corpo +X
  m = t.match(/\+?(\d+)\s+em\s+ataque\s+corpo\s+a\s+corpo/);
  if (m?.[1]) out.ataqueCorpo = Number(m[1]) || null;

  // Ataque (genérico) +X
  m = t.match(/\+?(\d+)\s+em\s+ataque\b/);
  if (m?.[1] && out.ataqueCorpo == null) out.ataqueCorpo = Number(m[1]) || null;

  // Dano +X
  m = t.match(/\+?(\d+)\s+de\s+dano\b/);
  if (m?.[1]) out.dano = Number(m[1]) || null;

  // TRs Fortitude/Vontade +X
  const mFort = t.match(/\+?(\d+)\s+em\s+trs?\s+de\s+fortitude/);
  if (mFort?.[1]) out.salvaguardas.fortitude = Number(mFort[1]) || 0;
  const mVon = t.match(/\+?(\d+)\s+em\s+trs?\s+de\s+vontade/);
  if (mVon?.[1]) out.salvaguardas.vontade = Number(mVon[1]) || 0;

  return out;
}

async function _rollCheck(actor, { group, key, labelOverride } = {}) {
  if (!actor || !group || !key) return null;
  const system = actor.system;

  const pericia = system?.[group]?.[key];
  if (!pericia) {
    ui.notifications.warn('Teste inválido.');
    return null;
  }

  const grauTreino = Number(pericia.value ?? 0) || 0;
  const atributoKey = MAPA_ATRIBUTOS[key];
  const atributoMod = atributoKey ? (_getAttrMod(actor, atributoKey)) : 0;
  const atributoLabel = system?.atributos?.[atributoKey]?.label ?? atributoKey ?? 'Atributo';

  const baseTreino = _getTreino(actor);
  let treinoBonus = 0;
  if (grauTreino === 1) treinoBonus = baseTreino;
  else if (grauTreino === 2) treinoBonus = Math.floor(baseTreino * 1.5);

  const metadeNivel = _getHalfLevel(actor);

  // bônus persistente/temporário via flags
  let bonusExtra = 0;
  let dieTerm = '1d20';
  try {
    const sysId = _systemId();
    const bonuses = (await actor.getFlag(sysId, 'bonuses')) || {};
    const b = Number(bonuses?.tests?.[group]?.[key] ?? 0) || 0;
    bonusExtra += b;

    const temp = (await actor.getFlag(sysId, 'temp')) || {};
    const tempBonus = Number(temp?.tests?.[group]?.[key] ?? 0) || 0;
    if (tempBonus) {
      bonusExtra += tempBonus;
      // consome
      const next = foundry.utils.deepClone(temp);
      next.tests = next.tests || {};
      next.tests[group] = next.tests[group] || {};
      delete next.tests[group][key];
      await actor.setFlag(sysId, 'temp', next);
    }

    const rollMode = String(temp?.rollMode?.[group]?.[key] ?? '').toLowerCase();
    if (rollMode === 'adv') {
      dieTerm = '2d20kh';
      const next = foundry.utils.deepClone(temp);
      next.rollMode = next.rollMode || {};
      next.rollMode[group] = next.rollMode[group] || {};
      delete next.rollMode[group][key];
      await actor.setFlag(sysId, 'temp', next);
    } else if (rollMode === 'dis') {
      dieTerm = '2d20kl';
      const next = foundry.utils.deepClone(temp);
      next.rollMode = next.rollMode || {};
      next.rollMode[group] = next.rollMode[group] || {};
      delete next.rollMode[group][key];
      await actor.setFlag(sysId, 'temp', next);
    }
  } catch (_) {}

  const parts = [`${dieTerm} + ${atributoMod}[${atributoLabel}]`];
  if (metadeNivel > 0) parts.push(`+ ${metadeNivel}[MetadeNivel]`);
  if (treinoBonus > 0) parts.push(`+ ${treinoBonus}[Treino]`);
  if (bonusExtra) parts.push(`+ ${bonusExtra}[Bônus]`);

  const formula = parts.join(' ');
  let roll;
  try {
    roll = await rollFormula(formula, { actor }, { asyncEval: true, toMessage: false });
  } catch (err) {
    console.warn('Erro ao rolar teste via rollFormula em lutador-habilidades:', err);
    ui?.notifications?.error?.('Fórmula inválida para teste.');
    return null;
  }

  const title = labelOverride || pericia.label || key;
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `<b>${title}</b><br/><code>${formula}</code><br/>Total: <b>${roll.total}</b>`,
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
  });

  return roll;
}

async function _applyEffect({ actor, label, changes, duration }) {
  if (!actor || !changes?.length) return null;
  const data = {
    name: label,
    icon: 'icons/svg/aura.svg',
    changes,
    disabled: false,
    origin: null,
    duration: {},
  };

  if (duration?.rounds && game.combat) {
    data.duration.rounds = Number(duration.rounds) || 1;
    data.duration.startRound = Number(game.combat.round ?? 0) || 0;
    data.duration.startTurn = Number(game.combat.turn ?? 0) || 0;
  } else if (duration?.seconds) {
    data.duration.seconds = Number(duration.seconds) || (60 * 60);
    data.duration.startTime = game.time?.worldTime ?? null;
  }

  return actor.createEmbeddedDocuments('ActiveEffect', [data]);
}

function _changesForConditions(conds = []) {
  const changes = [];
  for (const c of conds) {
    const path = CONDICOES_MAP[c];
    if (!path) continue;
    changes.push({ key: path, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: true, priority: 20 });
  }
  return changes;
}

function _changesForBonuses({ defesa, ataqueCorpo, dano, salvaguardas } = {}) {
  const sysId = _systemId();
  const changes = [];

  if (typeof defesa === 'number' && Number.isFinite(defesa) && defesa !== 0) {
    changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: defesa, priority: 20 });
  }

  if (typeof ataqueCorpo === 'number' && Number.isFinite(ataqueCorpo) && ataqueCorpo !== 0) {
    changes.push({ key: `flags.${sysId}.bonuses.tests.ataques.corpo`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: ataqueCorpo, priority: 20 });
  }

  if (typeof dano === 'number' && Number.isFinite(dano) && dano !== 0) {
    changes.push({ key: `flags.${sysId}.bonuses.itemDamage`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: dano, priority: 20 });
  }

  if (salvaguardas && typeof salvaguardas === 'object') {
    for (const [k, v] of Object.entries(salvaguardas)) {
      const n = Number(v) || 0;
      if (!n) continue;
      changes.push({ key: `flags.${sysId}.bonuses.tests.salvaguardas.${k}`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: n, priority: 20 });
    }
  }

  return changes;
}

async function _showLutadorDialog({ actor, item }) {
  const desc = String(item?.system?.descricao?.value ?? item?.system?.descricao ?? '');
  const rawDuration = String(item?.system?.duracao?.value ?? item?.system?.duracao ?? '');
  const duration = _durationFromText(rawDuration);

  const selfConds = _extractSelfConditions(desc);
  const targetConds = _extractTargetConditions(desc);
  const bonuses = _extractNumericBonuses(desc);

  const hasAttackRoll = /jogada de ataque|teste de ataque|ao realizar um ataque|realizar um ataque|ataque corpo a corpo|ataque a distancia/.test(_norm(desc));
  const wantsAcrobacia = /teste de acrobacia/.test(_norm(desc));
  const wantsAtletismo = /teste de atletismo/.test(_norm(desc));

  const content = `
    <div class="lutador-hab-dialog">
      <p><b>${item.name}</b></p>
      ${rawDuration ? `<p><b>Duração:</b> ${rawDuration}</p>` : ''}
      ${selfConds.length ? `<p><b>Condições (você):</b> ${selfConds.join(', ')}</p>` : ''}
      ${targetConds.length ? `<p><b>Condições (alvo):</b> ${targetConds.join(', ')}</p>` : ''}
      ${(bonuses.defesa || bonuses.ataqueCorpo || bonuses.dano) ? `<p><b>Bônus:</b> ${[
        bonuses.defesa ? `Defesa +${bonuses.defesa}` : null,
        bonuses.ataqueCorpo ? `Ataque corpo +${bonuses.ataqueCorpo}` : null,
        bonuses.dano ? `Dano +${bonuses.dano}` : null,
      ].filter(Boolean).join(' | ')}</p>` : ''}
      <hr/>
      <div style="max-height:220px; overflow:auto; border:1px solid #333; padding:8px; border-radius:6px;">
        ${await TextEditor.enrichHTML(desc || '<i>Sem descrição.</i>', { async: true })}
      </div>
      <p style="margin-top:8px; opacity:.85">Dica: selecione um token alvo antes de aplicar em alvo.</p>
    </div>
  `;

  return new Promise((resolve) => {
    new Dialog({
      title: `Lutador: ${item.name}`,
      content,
      buttons: {
        rollAttack: {
          label: 'Rolar Ataque (Corpo)',
          callback: async () => {
            await _rollCheck(actor, { group: 'ataques', key: 'corpo', labelOverride: 'Ataque (Corpo a Corpo)' });
          }
        },
        rollAcro: {
          label: 'Rolar Acrobacia',
          callback: async () => {
            await _rollCheck(actor, { group: 'pericias', key: 'acrobacia' });
          }
        },
        rollAtle: {
          label: 'Rolar Atletismo',
          callback: async () => {
            await _rollCheck(actor, { group: 'pericias', key: 'atletismo' });
          }
        },
        applySelf: {
          label: 'Aplicar em mim',
          callback: async () => {
            const changes = [
              ..._changesForConditions(selfConds),
              ..._changesForBonuses(bonuses),
            ];
            if (!changes.length) {
              ui.notifications.warn('Nada automático para aplicar em você nesta habilidade.');
              return;
            }
            await _applyEffect({ actor, label: item.name, changes, duration });
          }
        },
        applyTarget: {
          label: 'Aplicar no alvo',
          callback: async () => {
            const target = game.user?.targets?.first?.() ?? null;
            const targetActor = target?.actor ?? null;
            if (!targetActor) {
              ui.notifications.warn('Selecione um alvo (target) primeiro.');
              return;
            }
            const changes = _changesForConditions(targetConds);
            if (!changes.length) {
              ui.notifications.warn('Nenhuma condição de alvo detectada automaticamente.');
              return;
            }
            await _applyEffect({ actor: targetActor, label: `${item.name} (Alvo)`, changes, duration });
          }
        },
        close: {
          label: 'Fechar',
          callback: () => resolve(true)
        }
      },
      default: 'close',
      render: (html) => {
        // Esconde botões irrelevantes
        if (!hasAttackRoll) html.find('button[data-button="rollAttack"]').hide();
        if (!wantsAcrobacia) html.find('button[data-button="rollAcro"]').hide();
        if (!wantsAtletismo) html.find('button[data-button="rollAtle"]').hide();
      }
    }, { width: 720, height: 'auto' }).render(true);
  });
}

export async function handleLutadorUse({ actor, item } = {}) {
  if (!actor || !item) return { handled: false };

  const sysId = _systemId();
  const aptKey = item.getFlag(sysId, 'aptidaoKey');
  if (!aptKey || !String(aptKey).startsWith('lutador.')) return { handled: false };

  // Alguns poderes precisam de ajuste específico (derivado do texto)
  const nameNorm = _norm(item.name);

  // Ataque Inconsequente: dá vantagem no próximo ataque corpo e +5 no próximo dano, mas aplica Desprevenido 1 rodada
  if (nameNorm.includes('ataque inconsequente')) {
    try {
      const temp = (await actor.getFlag(sysId, 'temp')) || {};
      temp.rollMode = temp.rollMode || {};
      temp.rollMode.ataques = temp.rollMode.ataques || {};
      temp.rollMode.ataques.corpo = 'adv';
      temp.damageBonus = (Number(temp.damageBonus ?? 0) || 0) + 5;
      await actor.setFlag(sysId, 'temp', temp);

      const dur = { rounds: 1 };
      const changes = _changesForConditions(['desprevenido']);
      await _applyEffect({ actor, label: 'Ataque Inconsequente (penalidade)', changes, duration: dur });

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `<b>Ataque Inconsequente</b>: próximo ataque corpo-a-corpo com <b>vantagem</b> e <b>+5 dano</b> (próximo dano de arma/técnica). Você fica <b>Desprevenido</b> por 1 rodada.`
      });
    } catch (e) {
      console.warn('Falha ao aplicar Ataque Inconsequente:', e);
    }

    await _showLutadorDialog({ actor, item });
    return { handled: true };
  }

  // Brutalidade: +2 ataque corpo e +2 dano (sustentada)
  if (nameNorm.includes('brutalidade') && !nameNorm.includes('aprimorada') && !nameNorm.includes('sanguin')) {
    const changes = _changesForBonuses({ ataqueCorpo: 2, dano: 2 });
    await _applyEffect({ actor, label: 'Brutalidade', changes, duration: null });
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<b>Brutalidade</b>: bônus aplicado (+2 ataque corpo, +2 dano). Encerre removendo o efeito quando parar de atacar.` });
    await _showLutadorDialog({ actor, item });
    return { handled: true };
  }

  // Fúria da Vingança: 1 rodada: +4 dano, +2 defesa, +2 TR Fort/Vont
  if (nameNorm.includes('furia da vinganca')) {
    const changes = _changesForBonuses({ defesa: 2, dano: 4, salvaguardas: { fortitude: 2, vontade: 2 } });
    await _applyEffect({ actor, label: 'Fúria da Vingança', changes, duration: { rounds: 1 } });
    await _showLutadorDialog({ actor, item });
    return { handled: true };
  }

  // Demais: dialog genérico baseado no texto
  await _showLutadorDialog({ actor, item });
  return { handled: true };
}

export async function applyDamageBonusFromTempFlag({ actor } = {}) {
  if (!actor) return 0;
  const sysId = _systemId();
  const temp = (await actor.getFlag(sysId, 'temp')) || {};
  const n = Number(temp.damageBonus ?? 0) || 0;
  if (!n) return 0;
  temp.damageBonus = 0;
  await actor.setFlag(sysId, 'temp', temp);
  return n;
}
