import { TODAS_AS_ARMAS } from '../helpers/weapons-aggregate.mjs';

const PACK_NAME = "armas-do-sistema";
const PACK_LABEL = "Armas do Sistema";

export async function importarTudo() {
  // Usa a lista centralizada `TODAS_AS_ARMAS` do helper

  let pack = game.packs.get(`${game.system.id}.${PACK_NAME}`);
  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      type: "Item",
      label: PACK_LABEL,
      name: PACK_NAME,
      package: game.system.id
    });
  }

  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });

  ui.notifications.info(`Iniciando importação de ${TODAS_AS_ARMAS.length} armas...`);

  const index = await pack.getIndex();
  const existingNames = new Map(index.map(i => [i.name, i._id]));

  const toCreate = [];
  const created = [];
  const updated = [];
  for (const arma of TODAS_AS_ARMAS) {
    const itemData = JSON.parse(JSON.stringify(arma));
    itemData.type = itemData.type || "arma";

    if (existingNames.has(itemData.name)) {
      const _id = existingNames.get(itemData.name);
      console.log(`Atualizando ${itemData.name} (id: ${_id})...`);
      const doc = await pack.getDocument(_id);
      await doc.update(itemData);
      updated.push(itemData.name);
    } else {
      toCreate.push(itemData);
    }
  }

  if (toCreate.length) {
    console.log(`Criando ${toCreate.length} novos itens no compendium ${PACK_LABEL}...`);
    const docs = await Item.createDocuments(toCreate, { pack: pack.collection });
    for (const d of docs) created.push(d.name || d._id || '(unknown)');
  }

  // Relatório resumido
  console.log(`Importador: Criados ${created.length}, Atualizados ${updated.length}`);
  if (created.length) console.log('Criados:', created.join(', '));
  if (updated.length) console.log('Atualizados:', updated.join(', '));
  ui.notifications.info(`Importador: Criados ${created.length}, Atualizados ${updated.length}`);

  if (wasLocked) await pack.configure({ locked: true });

  ui.notifications.info("Importação de Armas Concluída!");
}

window.ImportWeapons = window.ImportWeapons || {};
window.ImportWeapons.importarTudo = importarTudo;
