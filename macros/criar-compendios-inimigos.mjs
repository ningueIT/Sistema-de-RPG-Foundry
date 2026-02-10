// Macro: cria Compendiums de Itens para Inimigos (Dotes/Caracteristicas/Acoes)
// Execucao: cole em uma Macro (tipo Script) e rode.

const PACKS = [
  { name: 'dotes-gerais', label: 'Dotes Gerais', type: 'Item' },
  { name: 'dotes-amaldicoados', label: 'Dotes Amaldicoados', type: 'Item' },
  { name: 'caracteristicas-gerais', label: 'Caracteristicas Gerais', type: 'Item' },
  { name: 'caracteristicas-especiais', label: 'Caracteristicas Especiais', type: 'Item' },
  { name: 'acoes-npc', label: 'Acoes de NPC', type: 'Item' }
];

const created = [];
const skipped = [];

for (const p of PACKS) {
  const key = `world.${p.name}`;
  let pack = game.packs.get(key);
  if (pack) {
    skipped.push(p.label);
    continue;
  }
  pack = await CompendiumCollection.createCompendium({
    name: p.name,
    label: p.label,
    type: p.type,
    package: 'world'
  });
  if (pack) created.push(p.label);
}

const msg = `Compendios criados: ${created.length ? created.join(', ') : 'nenhum'}\nJa existiam: ${skipped.length ? skipped.join(', ') : 'nenhum'}`;
console.log(msg);
ui.notifications.info(msg);
