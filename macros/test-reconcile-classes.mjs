/**
 * Macro de validação rápida: reconciliação de habilidades fixas ao trocar de classe.
 *
 * Como usar:
 * 1) Rode em um ator de teste (Token selecionado ou game.user.character)
 * 2) Ele força nível 1 (principal) e alterna a classe:
 *    - Lutador -> deve ter "Corpo Treinado" e "Empolgação"
 *    - Especialista em Combate -> deve ter "Repertório do Especialista" e "Artes do Combate"
 *
 * Observação: isso ALTERA o ator (nível/classe). Use em um ator de teste.
 */

const getActor = () => canvas?.tokens?.controlled?.[0]?.actor ?? game?.user?.character ?? null;

const actor = getActor();
if (!actor) {
  ui.notifications.warn('Selecione um token ou defina um Personagem do usuário.');
  throw new Error('Sem ator para testar.');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const detalhes = actor.system?.detalhes ?? {};
const classPath = (typeof detalhes?.classe === 'object') ? 'system.detalhes.classe.value' : 'system.detalhes.classe';
const levelPath = 'system.detalhes.niveis.principal.value';

const getItemNames = () => actor.items.filter(i => i.type === 'habilidade').map(i => i.name);
const hasAll = (names) => names.every(n => getItemNames().includes(n));
const hasNone = (names) => names.every(n => !getItemNames().includes(n));

async function setPrincipalClassAndLevel(classValue, levelValue) {
  const updateData = {
    [classPath]: classValue,
    [levelPath]: levelValue
  };
  console.log('[Feiticeiros] Teste reconcile: update', updateData);
  await actor.update(updateData);
  // dá tempo do _onUpdate rodar e criar/remover itens embutidos
  await sleep(250);
}

const lutadorExpected = ['Corpo Treinado', 'Empolgação'];
const espCombateExpected = ['Repertório do Especialista', 'Artes do Combate'];

console.log('[Feiticeiros] Iniciando teste no ator:', actor.name);

// 1) Lutador lvl 1
await setPrincipalClassAndLevel('lutador', 1);
console.log('[Feiticeiros] Itens (habilidade):', getItemNames());
if (!hasAll(lutadorExpected)) {
  ui.notifications.error('Falhou: Lutador lvl 1 não recebeu todas as habilidades esperadas. Veja console.');
  console.warn('[Feiticeiros] Esperado (Lutador):', lutadorExpected);
  console.warn('[Feiticeiros] Atual:', getItemNames());
  throw new Error('Falha no passo Lutador.');
}

// 2) Troca para Especialista em Combate lvl 1
await setPrincipalClassAndLevel('especialistaCombate', 1);
console.log('[Feiticeiros] Itens (habilidade):', getItemNames());

if (!hasAll(espCombateExpected)) {
  ui.notifications.error('Falhou: Especialista em Combate lvl 1 não recebeu todas as habilidades esperadas. Veja console.');
  console.warn('[Feiticeiros] Esperado (Esp. Combate):', espCombateExpected);
  console.warn('[Feiticeiros] Atual:', getItemNames());
  throw new Error('Falha no passo Especialista em Combate.');
}

if (!hasNone(lutadorExpected)) {
  ui.notifications.error('Falhou: habilidades do Lutador ainda estão no ator após trocar a classe. Veja console.');
  console.warn('[Feiticeiros] Não deveria ter (Lutador):', lutadorExpected);
  console.warn('[Feiticeiros] Atual:', getItemNames());
  throw new Error('Falha no passo remoção Lutador -> Esp. Combate.');
}

ui.notifications.info('OK: reconciliação Lutador <-> Especialista em Combate validada (lvl 1).');
console.log('[Feiticeiros] Teste concluído com sucesso.');
