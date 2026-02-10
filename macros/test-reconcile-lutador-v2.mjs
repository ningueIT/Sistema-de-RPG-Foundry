/**
 * Macro de validação: Lutador level 2/5/20 fixed grants
 * Use em um ator de teste (Token selecionado ou game.user.character).
 * O macro altera classe/nível do ator para checar concessões automáticas.
 */

const getActor = () => canvas?.tokens?.controlled?.[0]?.actor ?? game?.user?.character ?? null;
const actor = getActor();
if (!actor) {
  ui.notifications.warn('Selecione um token ou defina um Personagem do usuário.');
  throw new Error('Sem ator para testar.');
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const classPath = (typeof actor.system?.detalhes?.classe === 'object') ? 'system.detalhes.classe.value' : 'system.detalhes.classe';
const levelPath = 'system.detalhes.niveis.principal.value';

const getNames = () => actor.items.filter(i => i.type === 'habilidade').map(i => i.name);
const includesAll = (arr) => arr.every(n => getNames().includes(n));

async function setClassLevel(cls, lvl) {
  await actor.update({ [classPath]: cls, [levelPath]: lvl });
  await sleep(300);
}

const stepChecks = [
  { lvl: 2, expect: ['Reflexo Evasivo'] },
  { lvl: 5, expect: ['Gosto pela Luta'] },
  { lvl: 20, expect: ['Lutador Superior'] }
];

console.log('Iniciando teste de reconciliação Lutador (2/5/20) no ator:', actor.name);
for (const step of stepChecks) {
  console.log(`Definindo Lutador lvl ${step.lvl}`);
  await setClassLevel('lutador', step.lvl);
  console.log('Habilidades do ator:', getNames());
  if (!includesAll(step.expect)) {
    ui.notifications.error(`Falha: Lutador lvl ${step.lvl} não recebeu todas as habilidades esperadas.`);
    console.warn('Esperado:', step.expect);
    console.warn('Atual:', getNames());
    throw new Error(`Falha no passo lvl ${step.lvl}`);
  }
}

ui.notifications.info('OK: Concessões do Lutador (2/5/20) encontradas.');
console.log('Teste concluído com sucesso.');
