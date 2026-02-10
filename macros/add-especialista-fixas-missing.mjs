// Macro: add-especialista-fixas-missing
// Garante que as habilidades FIXAS do Especialista em Combate existam no compêndio world.habilidades-amaldicoadas.
// Cria pelo menos: Repertório do Especialista, Artes do Combate, Golpe Especial, Implemento Marcial,
// Renovação pelo Sangue, Teste de Resistência Mestre, Autossuficiente.

(async () => {
  const PACK = 'world.habilidades-amaldicoadas';
  const sysId = game?.system?.id || 'feiticeiros-e-maldicoes';

  if (!game.user?.isGM) {
    ui.notifications?.error?.('Apenas o GM pode executar este macro.');
    return;
  }

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

  const mk = ({ name, desc, requisito }) => ({
    name,
    type: 'habilidade',
    img: icon,
    system: {
      descricao: { value: desc },
      custo: { value: 0 },
      acao: { value: 'Passiva' },
      requisito: { value: requisito || '' },
      fonte: { value: 'Livro de Regras' }
    }
  });

  const toCreate = [];

  if (!hasByName('Repertório do Especialista')) {
    toCreate.push(mk({
      name: 'Repertório do Especialista',
      requisito: 'Nível 1 de Especialista em Combate',
      desc: 'No 1º nível, escolha um Estilo de Combate para seguir. Você recebe um novo estilo no nível 6 e outro no 12.'
    }));
  }

  if (!hasByName('Artes do Combate')) {
    toCreate.push(mk({
      name: 'Artes do Combate',
      requisito: 'Nível 1 de Especialista em Combate',
      desc: 'Você recebe Pontos de Preparo igual ao seu nível de Especialista em Combate + Modificador de Sabedoria. Esses pontos são usados para realizar artes de combate.'
    }));
  }

  if (!hasByName('Golpe Especial')) {
    toCreate.push(mk({
      name: 'Golpe Especial',
      requisito: 'Nível 4 de Especialista em Combate',
      desc: 'Quando realizar um ataque (ou arte do combate que envolva um ataque), você pode montá-lo como um Golpe Especial, escolhendo opções que modificam o ataque e custam (ou reduzem) PE. Um Golpe Especial custa no mínimo 1 PE.'
    }));
  }

  if (!hasByName('Implemento Marcial')) {
    toCreate.push(mk({
      name: 'Implemento Marcial',
      requisito: 'Nível 4 de Especialista em Combate',
      desc: 'Você recebe +2 na CD de suas Habilidades de Especialização, Feitiços e Aptidões Amaldiçoadas. Esse bônus aumenta em 1 nos níveis 8 e 16 de Especialista em Combate.'
    }));
  }

  if (!hasByName('Renovação pelo Sangue')) {
    toCreate.push(mk({
      name: 'Renovação pelo Sangue',
      requisito: 'Nível 6 de Especialista em Combate',
      desc: 'Ao acertar um ataque crítico em um inimigo ou reduzir seus pontos de vida a 0, você recupera 1 ponto de energia amaldiçoada (PE).'
    }));
  }

  if (!hasByName('Teste de Resistência Mestre')) {
    toCreate.push(mk({
      name: 'Teste de Resistência Mestre',
      requisito: 'Nível 9 de Especialista em Combate',
      desc: 'Você se torna treinado em um segundo teste de resistência e mestre no concedido pela sua especialização.'
    }));
  }

  if (!hasByName('Autossuficiente')) {
    toCreate.push(mk({
      name: 'Autossuficiente',
      requisito: 'Nível 20 de Especialista em Combate',
      desc: 'Sempre que realizar um Golpe Especial, você recebe 3 PE temporários para serem usados no ataque. Uma vez por cena, pode transformar esse valor em 6. Além disso, todos seus ataques causam um dado de dano adicional do mesmo tipo da arma manuseada.'
    }));
  }

  if (!toCreate.length) {
    ui.notifications?.info?.('OK: nenhuma habilidade fixa faltando no compêndio.');
    if (wasLocked) await pack.configure({ locked: true });
    return;
  }

  // (Opcional) organiza em pastas: Especialista em Combate > Habilidades Base > Nível X
  try {
    const root = await ensureFolder({ pack, name: 'Especialista em Combate', parentId: null });
    const base = await ensureFolder({ pack, name: 'Habilidades Base', parentId: root.id });
    const f1 = await ensureFolder({ pack, name: 'Nível 1', parentId: base.id });
    const f4 = await ensureFolder({ pack, name: 'Nível 4', parentId: base.id });
    const f6 = await ensureFolder({ pack, name: 'Nível 6', parentId: base.id });
    const f9 = await ensureFolder({ pack, name: 'Nível 9', parentId: base.id });
    const f20 = await ensureFolder({ pack, name: 'Nível 20', parentId: base.id });

    for (const it of toCreate) {
      if (it.name === 'Repertório do Especialista' || it.name === 'Artes do Combate') it.folder = f1.id;
      if (it.name === 'Golpe Especial' || it.name === 'Implemento Marcial') it.folder = f4.id;
      if (it.name === 'Renovação pelo Sangue') it.folder = f6.id;
      if (it.name === 'Teste de Resistência Mestre') it.folder = f9.id;
      if (it.name === 'Autossuficiente') it.folder = f20.id;
    }
  } catch (e) {
    console.warn('[FEITICEIROS] add-especialista-fixas-missing | falha ao organizar pastas, criando sem folder', e);
  }

  const created = await Item.createDocuments(toCreate, { pack: pack.collection });
  ui.notifications?.info?.(`Criadas ${created.length} habilidade(s) no compêndio ${PACK}.`);
  console.log('[FEITICEIROS] add-especialista-fixas-missing | created', created.map(d => ({ id: d.id, name: d.name })));

  if (wasLocked) await pack.configure({ locked: true });
})();
