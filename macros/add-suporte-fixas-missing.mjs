/**
 * Garante que as Habilidades Base (fixas) do Suporte existam no compêndio
 * `world.habilidades-amaldicoadas` como `type: "habilidade"`.
 *
 * Também organiza em pastas:
 *   Suporte > Habilidades Base > Nível X
 */

const PACK_KEY = 'world.habilidades-amaldicoadas';
const ROOT_FOLDER = 'Suporte';
const BASE_FOLDER = 'Habilidades Base';

/**
 * Observação:
 * - "Teste de Resistência Mestre" pode ser compartilhada por outras classes.
 *   Aqui, a gente CRIA se estiver faltando, mas evita mover se já existir fora.
 */

const FIXAS = [
  { level: 1, name: 'Suporte em Combate' },
  { level: 3, name: 'Presença Inspiradora' },
  { level: 5, name: 'Versatilidade' },
  { level: 6, name: 'Energia Reversa' },
  { level: 8, name: 'Liberação de Energia Reversa' },
  { level: 9, name: 'Teste de Resistência Mestre', shared: true },
  { level: 10, name: 'Medicina Infalível' },
  { level: 20, name: 'Suporte Absoluto' }
];

function norm(text) {
  return (text ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

async function getOrCreateFolder({ name, parent = null, packCollection }) {
  const existing = game.folders?.find(
    (f) => f.type === 'Item' && f.name === name && f.pack === packCollection && (f.folder?.id ?? null) === (parent?.id ?? null)
  );
  if (existing) return existing;
  return Folder.create({
    name,
    type: 'Item',
    folder: parent?.id ?? null,
    pack: packCollection
  });
}

async function ensureFolderPath(packCollection, level) {
  const root = await getOrCreateFolder({ name: ROOT_FOLDER, packCollection });
  const base = await getOrCreateFolder({ name: BASE_FOLDER, parent: root, packCollection });
  const levelFolder = await getOrCreateFolder({ name: `Nível ${level}`,
    parent: base,
    packCollection
  });
  return { root, base, levelFolder };
}

const pack = game.packs.get(PACK_KEY);
if (!pack) {
  ui.notifications?.error(`Compêndio não encontrado: ${PACK_KEY}`);
  throw new Error(`Pack não encontrado: ${PACK_KEY}`);
}

// Garante que o índice esteja carregado para busca por nome.
await pack.getIndex();

const index = pack.index;
const byName = new Map(index.map((e) => [norm(e.name), e]));

const toCreate = [];
const toDelete = [];
const toUpdateFolder = [];

for (const entry of FIXAS) {
  const indexed = byName.get(norm(entry.name));
  if (!indexed) {
    toCreate.push(entry);
    continue;
  }

  const doc = await pack.getDocument(indexed._id);
  if (!doc) {
    toCreate.push(entry);
    continue;
  }

  if (doc.type !== 'habilidade') {
    // Foundry não permite trocar tipo de forma segura; recria.
    toDelete.push(doc);
    toCreate.push(entry);
    continue;
  }

  if (!entry.shared) {
    const { levelFolder } = await ensureFolderPath(pack.collection, entry.level);
    if ((doc.folder?.id ?? null) !== (levelFolder?.id ?? null)) {
      toUpdateFolder.push({ id: doc.id, folder: levelFolder.id });
    }
  }
}

if (toDelete.length) {
  await Item.deleteDocuments(toDelete.map((d) => d.id), { pack: pack.collection });
}

for (const entry of toCreate) {
  const folderTarget = await ensureFolderPath(pack.collection, entry.level);

  const data = {
    name: entry.name,
    type: 'habilidade',
    folder: entry.shared ? null : folderTarget.levelFolder.id,
    system: {
      tipo: { value: 'habilidade' },
      descricao: { value: '' }
    }
  };

  await Item.createDocuments([data], { pack: pack.collection });
}

if (toUpdateFolder.length) {
  const docs = [];
  for (const { id, folder } of toUpdateFolder) {
    const doc = await pack.getDocument(id);
    if (!doc) continue;
    docs.push(doc);
  }
  if (docs.length) {
    await Item.updateDocuments(
      toUpdateFolder.map((u) => ({ _id: u.id, folder: u.folder })),
      { pack: pack.collection }
    );
  }
}

const createdMsg = toCreate.length ? `${toCreate.length} criadas` : '0 criadas';
const deletedMsg = toDelete.length ? `${toDelete.length} recriadas (type errado)` : '0 recriadas';
const movedMsg = toUpdateFolder.length ? `${toUpdateFolder.length} movidas` : '0 movidas';

ui.notifications?.info(`Suporte (fixas): ${createdMsg}; ${deletedMsg}; ${movedMsg}.`);
