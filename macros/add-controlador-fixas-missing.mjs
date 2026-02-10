// Macro: add-controlador-fixas-missing
// Garante que as habilidades FIXAS do Controlador existam no compêndio world.habilidades-amaldicoadas.
// Cria: Treinamento em Controle, Controle Aprimorado, Apogeu, Reserva para Invocação, Ápice do Controle.

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

  if (!hasByName('Treinamento em Controle')) {
    toCreate.push(mk({
      name: 'Treinamento em Controle',
      requisito: 'Nível 1 de Controlador',
      desc: 'Você é treinado para controlar Invocações com maior eficiência. Ao obter esta habilidade, você:\n\n• Recebe duas Invocações iniciais, as quais podem ser tanto shikigamis quanto corpos amaldiçoados. Nos níveis 3, 6, 9, 10, 12, 15 e 18 você recebe uma Invocação adicional.\n\n• A quantidade de Invocações que você pode manter ativas em campo aumenta em 1.\n\n• Nos níveis 6, 12 e 18 a quantidade de comandos que você realiza com uma Ação Comum e Bônus aumenta em um (no nível 6, uma Ação Comum permitiria duas Invocações realizarem uma ação complexa ou uma Invocação realizar duas ações complexas).'
    }));
  }

  if (!hasByName('Controle Aprimorado')) {
    toCreate.push(mk({
      name: 'Controle Aprimorado',
      requisito: 'Nível 4 de Controlador',
      desc: 'Você é naturalmente mais capaz em comandar invocações, aprimorando o desempenho e aplicação delas. Suas invocações recebem um bônus em testes que realizarem igual a +2, aumentando em +1 para cada grau acima do quarto (+3 para terceiro, +4 para segundo etc.). Além disso, você pode utilizar Aptidões Amaldiçoadas das categorias Controle e Leitura a partir de suas Invocações, fazendo com que elas recebam os efeitos, como o aumento de dano de Canalizar em Golpe; entretanto, não é possível utilizar Punho Divergente e Emoção da Pétala Decadente a partir de Invocações.'
    }));
  }

  if (!hasByName('Apogeu')) {
    toCreate.push(mk({
      name: 'Apogeu',
      requisito: 'Nível 6 de Controlador',
      desc: 'Você começa a encontrar o caminho que deseja seguir como um controlador, especializando-o em um estilo específico de controle. Escolha entre:\n\n• Controle Concentrado. Você opta por concentrar suas forças e foco em uma única invocação, a qual sozinha se torna uma arma absoluta. Ao invés de invocar/ativar duas invocações como uma ação bônus, você pode invocar apenas uma como ação livre.\n\n• Controle Disperso. Você prefere controlar diversas invocações, mantendo a quantidade sempre em número superior. O número de invocações que você pode manter ativas em campo aumenta em 1, assim como a quantidade que você pode invocar/ativar com uma ação aumenta em 1. Além disso, você recebe acesso à ação Criar Horda. A partir do nível 12, o número de invocações que você pode manter ativas em campo e invocar/ativar com uma ação aumenta em 1, assim como você pode criar duas hordas como parte de uma mesma ação de Criar Horda.\n\n• Controle Sintonizado. Você prefere ficar em sintonia com suas invocações, não deixando que apenas elas lutem sozinhas. Uma vez por rodada, quando uma invocação em campo realizar um ataque contra um alvo dentro do seu alcance, você pode pagar 2 PE para, como uma Ação Livre, realizar um ataque contra o mesmo alvo. Além disso, para cada invocação que possua em campo, você recebe +1 em acerto e dano, com elas te auxiliando.'
    }));
  }

  if (!hasByName('Reserva para Invocação')) {
    toCreate.push(mk({
      name: 'Reserva para Invocação',
      requisito: 'Nível 10 de Controlador',
      desc: 'Você cria uma reserva dedicada para invocar ou ativar as suas invocações. Uma vez por descanso curto, você pode optar por usar a ação Invocar para trazer duas invocações com o custo reduzido pela metade ou uma invocação sem custo. Caso utilize esta habilidade para Criar Horda, o custo total dela é reduzido pela metade.'
    }));
  }

  if (!hasByName('Ápice do Controle')) {
    toCreate.push(mk({
      name: 'Ápice do Controle',
      requisito: 'Nível 20 de Controlador',
      desc: 'Você alcançou o ápice do controle, levando além do limite a arte de ter invocações e as controlar, sendo uma presença única no mundo. Suas invocações recebem duas ações/características adicionais, as quais não influenciam no custo delas; você passa a poder invocar ou ativar suas invocações como uma ação livre (caso ela já pudesse ser invocada como Ação Livre, ela tem seu custo reduzido em 2 PE). Além disso, conhecendo bem as táticas para utilizar invocações, você consegue prever parte dos movimentos delas: invocações de outras criaturas possuem desvantagem para realizar ações ofensivas contra você.'
    }));
  }

  if (!toCreate.length) {
    ui.notifications?.info?.('OK: nenhuma habilidade fixa do Controlador faltando no compêndio.');
    if (wasLocked) await pack.configure({ locked: true });
    return;
  }

  // (Opcional) organiza em pastas: Controlador > Habilidades Base > Nível X
  try {
    const root = await ensureFolder({ pack, name: 'Controlador', parentId: null });
    const base = await ensureFolder({ pack, name: 'Habilidades Base', parentId: root.id });
    const f1 = await ensureFolder({ pack, name: 'Nível 1', parentId: base.id });
    const f4 = await ensureFolder({ pack, name: 'Nível 4', parentId: base.id });
    const f6 = await ensureFolder({ pack, name: 'Nível 6', parentId: base.id });
    const f10 = await ensureFolder({ pack, name: 'Nível 10', parentId: base.id });
    const f20 = await ensureFolder({ pack, name: 'Nível 20', parentId: base.id });

    for (const it of toCreate) {
      if (it.name === 'Treinamento em Controle') it.folder = f1.id;
      if (it.name === 'Controle Aprimorado') it.folder = f4.id;
      if (it.name === 'Apogeu') it.folder = f6.id;
      if (it.name === 'Reserva para Invocação') it.folder = f10.id;
      if (it.name === 'Ápice do Controle') it.folder = f20.id;
    }
  } catch (e) {
    console.warn('[FEITICEIROS] add-controlador-fixas-missing | falha ao organizar pastas, criando sem folder', e);
  }

  const created = await Item.createDocuments(toCreate, { pack: pack.collection });
  ui.notifications?.info?.(`Criadas ${created.length} habilidade(s) no compêndio ${PACK}.`);
  console.log('[FEITICEIROS] add-controlador-fixas-missing | created', created.map(d => ({ id: d.id, name: d.name })));

  if (wasLocked) await pack.configure({ locked: true });
})();
