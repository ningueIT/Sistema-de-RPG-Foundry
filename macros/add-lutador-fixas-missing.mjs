// Macro: add-lutador-fixas-missing
// Garante que as habilidades fixas do Lutador existam no compêndio world.habilidades-amaldicoadas.
// Cria pelo menos: Corpo Treinado, Empolgação, Reflexo Evasivo.

(async () => {
  const PACK = 'world.habilidades-amaldicoadas';
  const sysId = game?.system?.id || 'feiticeiros-e-maldicoes';

  const normalize = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

  const ensureFolder = async ({ pack, name, parentId = null }) => {
    const existing = game.folders?.contents?.find(f => f.type === 'Item' && f.name === name && (f.folder?.id ?? null) === parentId && (f.pack ?? null) === pack.collection);
    if (existing) return existing;
    return Folder.create({ name, type: 'Item', folder: parentId }, { pack: pack.collection });
  };

  const pack = game.packs.get(PACK);
  if (!pack) {
    ui.notifications?.error?.(`Compêndio não encontrado: ${PACK}`);
    throw new Error(`Pack missing: ${PACK}`);
  }

  const wasLocked = !!pack.locked;
  if (wasLocked) await pack.configure({ locked: false });

  const idx = await pack.getIndex();
  const hasByName = (name) => idx.some(e => normalize(e.name) === normalize(name));

  const icon = `/systems/${sysId}/icons/equipment/hand/glove-leather-red.svg`;

  const toCreate = [];

  if (!hasByName('Corpo Treinado')) {
    toCreate.push({
      name: 'Corpo Treinado',
      type: 'habilidade',
      img: icon,
      system: {
        descricao: { value: 'Habilidade fixa do Lutador (nível 1).' },
        custo: { value: 0 },
        acao: { value: 'Passiva' },
        requisito: { value: 'Nível 1 de Lutador' },
        fonte: { value: 'Livro de Regras v2.5' }
      }
    });
  }

  if (!hasByName('Empolgação')) {
    toCreate.push({
      name: 'Empolgação',
      type: 'habilidade',
      img: icon,
      system: {
        descricao: { value: 'Habilidade fixa do Lutador (nível 1).' },
        custo: { value: 0 },
        acao: { value: 'Passiva' },
        requisito: { value: 'Nível 1 de Lutador' },
        fonte: { value: 'Livro de Regras v2.5' }
      }
    });
  }

  if (!hasByName('Reflexo Evasivo')) {
    toCreate.push({
      name: 'Reflexo Evasivo',
      type: 'habilidade',
      img: icon,
      system: {
        descricao: {
          value: 'Em busca de uma boa luta, e conseguir durar nela, você começa a desenvolver um reflexo para evitar danos. Você recebe redução de dano a todo tipo, exceto alma, igual a metade do seu nível de Lutador.'
        },
        custo: { value: 0 },
        acao: { value: 'Passiva' },
        requisito: { value: 'Nível 2 de Lutador' },
        fonte: { value: 'Livro de Regras v2.5' }
      }
    });
  }

  if (!toCreate.length) {
    ui.notifications?.info?.('OK: nenhuma habilidade fixa faltando no compêndio.');
    if (wasLocked) await pack.configure({ locked: true });
    return;
  }

  // (Opcional) tenta criar folders Lutador/Nível 1 e Nível 2, se quiser organizar
  try {
    const lutadorFolder = await ensureFolder({ pack, name: 'Lutador', parentId: null });
    const lvl1Folder = await ensureFolder({ pack, name: 'Nível 1', parentId: lutadorFolder.id });
    const lvl2Folder = await ensureFolder({ pack, name: 'Nível 2', parentId: lutadorFolder.id });

    for (const it of toCreate) {
      if (it.name === 'Reflexo Evasivo') it.folder = lvl2Folder.id;
      if (it.name === 'Corpo Treinado' || it.name === 'Empolgação') it.folder = lvl1Folder.id;
    }
  } catch (e) {
    console.warn('[FEITICEIROS] add-lutador-fixas-missing | falha ao organizar pastas, criando sem folder', e);
  }

  const created = await Item.createDocuments(toCreate, { pack: pack.collection });
  ui.notifications?.info?.(`Criadas ${created.length} habilidade(s) no compêndio ${PACK}.`);
  console.log('[FEITICEIROS] add-lutador-fixas-missing | created', created.map(d => ({ id: d.id, name: d.name })));

  if (wasLocked) await pack.configure({ locked: true });
})();
