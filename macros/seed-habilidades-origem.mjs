/**
 * Seed script to create a compendium of Origin Abilities (Habilidades de Origem).
 * Creates pack: world.habilidades-origem
 * Organizes folders per origin variant (ex: Colosso Carniçal) and adds items.
 */

export async function seedHabilidadesOrigem() {
  const PACK_NAME = 'habilidades-origem';
  const PACK_LABEL = 'Habilidades de Origem';

  let pack = game.packs.get(`world.${PACK_NAME}`);
  if (!pack) {
    pack = await CompendiumCollection.createCompendium({ type: 'Item', label: PACK_LABEL, name: PACK_NAME, package: 'world' });
  }

  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });

  // Remove existing contents (seed idempotent)
  const index = await pack.getIndex();
  for (let i of index) {
    await pack.getDocument(i._id).then(d => d.delete()).catch(() => {});
  }

  // Create folder for Colosso Carniçal
  const folderColosso = await Folder.create({ name: 'Colosso Carniçal', type: 'Item', folder: null }, { pack: pack.collection }).catch(() => null);
  const folderIdColosso = folderColosso?.id ?? null;
  const folderSoberano = await Folder.create({ name: 'Soberano Carmesim', type: 'Item', folder: null }, { pack: pack.collection }).catch(() => null);
  const folderIdSoberano = folderSoberano?.id ?? null;
  const folderZenite = await Folder.create({ name: 'Zênite da Soberba', type: 'Item', folder: null }, { pack: pack.collection }).catch(() => null);
  const folderIdZenite = folderZenite?.id ?? null;
  const folderParasita = await Folder.create({ name: 'Parasita do Vazio', type: 'Item', folder: null }, { pack: pack.collection }).catch(() => null);
  const folderIdParasita = folderParasita?.id ?? null;
  const folderVetor = await Folder.create({ name: 'Vetor da Calamidade', type: 'Item', folder: null }, { pack: pack.collection }).catch(() => null);
  const folderIdVetor = folderVetor?.id ?? null;

  const ITEMS = [
    {
      name: 'Mandíbula Ancestral',
      type: 'habilidade',
      img: 'icons/creatures/mouth/jaw-teeth-bone.webp',
      folder: folderIdColosso,
      system: {
        nivel: { value: 1 },
        descricao: { value: `Ganhas armas naturais (dentes/garras) que causam 1d8 de dano (pode ser usada como uma ação bônus). Ao reduzir uma criatura a 0 PV com elas, ganhas PV Temporários igual ao teu Nível + Constituição.` },
        acao: { value: 'Passiva' },
        requisito: { value: 'Nível 1' }
      }
    },
    {
      name: 'Predador Alfa',
      type: 'habilidade',
      img: 'icons/skills/hunting/paw-track-talon-brown.webp',
      folder: folderIdColosso,
      system: {
        nivel: { value: 5 },
        descricao: { value: `O teu deslocamento aumenta em +3m. Tens Vantagem em testes de Percepção ou Intuição para rastrear presas feridas (que não estejam com a vida cheia).` },
        acao: { value: 'Passiva' },
        requisito: { value: 'Nível 5' }
      }
    },
    {
      name: 'Rugido Primitivo',
      type: 'habilidade',
      img: 'icons/abilities/roar/roar-fanged-large-red.webp',
      folder: folderIdColosso,
      system: {
        nivel: { value: 10 },
        descricao: { value: `Ação. Inimigos a até 9m devem passar num teste de Vontade (CD Presença) ou ficam Abalados e Assustados por 1 minuto. (1 vez por cena).` },
        acao: { value: 'Ação' },
        requisito: { value: 'Nível 10' }
      }
    },
    {
      name: 'Pele de Escamas',
      type: 'habilidade',
      img: 'icons/skills/defensive/scales-plate-silver.webp',
      folder: folderIdColosso,
      system: {
        nivel: { value: 15 },
        descricao: { value: `A tua pele endurece. Recebes Resistência a danos Cortantes, Perfurantes e de Impacto não-mágicos permanentemente.` },
        acao: { value: 'Passiva' },
        requisito: { value: 'Nível 15' }
      }
    },
    {
      name: 'Ápice da Cadeia',
      type: 'habilidade',
      img: 'icons/creatures/mammals/wolf-howl-red.webp',
      folder: folderIdColosso,
      system: {
        nivel: { value: 20 },
        descricao: { value: `Podes gastar 10 PE para assumir a "Forma Verdadeira" por 1 minuto. Tornas-te tamanho Grande, os teus ataques corpo a corpo causam +1d8 de dano e recuperas 10 PV no início de cada turno teu.` },
        acao: { value: 'Ação' },
        requisito: { value: 'Nível 20' }
      }
    }
  ,
  // Soberano Carmesim
  {
    name: 'Postura da Estátua',
    type: 'habilidade',
    img: 'icons/skills/defensive/shield-stone-brown.webp',
    folder: folderIdZenite,
    system: {
      nivel: { value: 1 },
      descricao: { value: `Se não gastares movimento no teu turno, recebes Redução de Dano Físico igual ao teu Bónus de Treinamento até ao teu próximo turno.` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 1' }
    }
  },
  {
    name: 'Retaliação Solar',
    type: 'habilidade',
    img: 'icons/skills/fire/beam-flame-sun-yellow.webp',
    folder: folderIdZenite,
    system: {
      nivel: { value: 5 },
      descricao: { value: `Enquanto em Postura da Estátua, se um inimigo te acertar corpo a corpo, ele recebe dano de Fogo automático igual ao teu Modificador de Carisma.` },
      acao: { value: 'Reação' },
      requisito: { value: 'Nível 5' }
    }
  },
  {
    name: 'Levitação Divina',
    type: 'habilidade',
    img: 'icons/magic/air/blast-air-stream-blue.webp',
    folder: folderIdZenite,
    system: {
      nivel: { value: 10 },
      descricao: { value: `Ganhas deslocamento de Voo igual ao teu deslocamento terrestre. Podes pairar, ignorando terrenos difíceis.` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 10' }
    }
  },
  {
    name: 'Corpo de Ouro',
    type: 'habilidade',
    img: 'icons/skills/defensive/armor-plate-gold.webp',
    folder: folderIdZenite,
    system: {
      nivel: { value: 15 },
      descricao: { value: `Tornas-te Imune às condições Em Chamas e Abalado/Assustado. A tua mente não processa o medo.` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 15' }
    }
  },
  {
    name: 'Supernova',
    type: 'habilidade',
    img: 'icons/magic/fire/explosion-star-large-orange.webp',
    folder: folderIdZenite,
    system: {
      nivel: { value: 20 },
      descricao: { value: `1/Descanso Longo. Se fores reduzido a 0 PV, não cais. Explodes causando 8d8 de dano Fogo/Radiante em 9m e recuperas metade dos teus PV máximos.` },
      acao: { value: 'Reação' },
      requisito: { value: 'Nível 20' }
    }
  }
  ,
  // Versão alternativa/do domínio: Soberano Carmesim (O Domínio)
  {
    name: 'Aura do Imperador',
    type: 'habilidade',
    img: 'icons/magic/air/wind-tornado-ring-blue.webp',
    folder: folderIdSoberano,
    system: {
      nivel: { value: 1 },
      descricao: { value: `Raio de 3m ao redor é Terreno Difícil para inimigos. Inimigos que terminem o turno na aura recebem dano de Frio igual ao teu Bónus de Treinamento.` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 1' }
    }
  },
  {
    name: 'Armamento Régio',
    type: 'habilidade',
    img: 'icons/weapons/swords/sword-embroidered-gold.webp',
    folder: folderIdSoberano,
    system: {
      nivel: { value: 5 },
      descricao: { value: `Podes gastar 1 PE para criar uma arma de sangue (dano da arma + 1d6 Frio). Conta como mágica e usa Carisma para ataque e dano.` },
      acao: { value: 'Ação' },
      requisito: { value: 'Nível 5' }
    }
  },
  {
    name: 'Decreto Absoluto',
    type: 'habilidade',
    img: 'icons/skills/social/royal-crown-gold.webp',
    folder: folderIdSoberano,
    system: {
      nivel: { value: 10 },
      descricao: { value: `Ação de Bónus. Comanda um aliado para usar a Reação dele para atacar ou mover-se. OU comanda um inimigo (Teste de Vontade anula) para perder a Reação dele.` },
      acao: { value: 'Ação Bónus' },
      requisito: { value: 'Nível 10' }
    }
  },
  {
    name: 'Esquife de Sangue',
    type: 'habilidade',
    img: 'icons/skills/shields/shield-blood-red.webp',
    folder: folderIdSoberano,
    system: {
      nivel: { value: 15 },
      descricao: { value: `Reação ao ser atingido corpo a corpo. O atacante recebe dano de Frio igual ao teu Nível e fica Imóvel até o final do próximo turno dele (o sangue congela).` },
      acao: { value: 'Reação' },
      requisito: { value: 'Nível 15' }
    }
  },
  {
    name: 'Trono de Gelo',
    type: 'habilidade',
    img: 'icons/skills/defensive/ice-throne-blue.webp',
    folder: folderIdSoberano,
    system: {
      nivel: { value: 20 },
      descricao: { value: `A Aura aumenta para 9m. Inimigos dentro dela têm Desvantagem em ataques contra ti e aliados. Tornas-te Imune a dano de Frio.` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 20' }
    }
  }
  ,
  // Parasita do Vazio (A Loucura)
  {
    name: 'Toque da Irrealidade',
    type: 'habilidade',
    img: 'icons/magic/control/debuff-mental-blue.webp',
    folder: folderIdParasita,
    system: {
      nivel: { value: 1 },
      descricao: { value: `Podes alterar o dano de qualquer feitiço teu para Psíquico ou Necrótico. Ganhas proficiência em Ocultismo.` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 1' }
    }
  },
  {
    name: 'Dobra Espacial',
    type: 'habilidade',
    img: 'icons/magic/teleport/warp-portal-purple.webp',
    folder: folderIdParasita,
    system: {
      nivel: { value: 5 },
      descricao: { value: `Reação ao ser atacado. Teleportas-te para um espaço vazio a até 9m, fazendo o ataque falhar. (1 vez por cena grátis, depois custa 6 PE).` },
      acao: { value: 'Reação' },
      requisito: { value: 'Nível 5' }
    }
  },
  {
    name: 'Fratura Mental',
    type: 'habilidade',
    img: 'icons/skills/mental/brain-crack-purple.webp',
    folder: folderIdParasita,
    system: {
      nivel: { value: 10 },
      descricao: { value: `Ao causar dano Psíquico, podes forçar um teste de Inteligência. Falha: alvo fica Atordoado até o início do teu próximo turno. (Recarga 5-6 no d6).` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 10' }
    }
  },
  {
    name: 'Anatomia Não-Euclidiana',
    type: 'habilidade',
    img: 'icons/magic/space/void-portal-black-purple.webp',
    folder: folderIdParasita,
    system: {
      nivel: { value: 15 },
      descricao: { value: `O teu corpo não está onde parece estar. Tens Resistência a danos de todos os Ataques à Distância (físicos ou mágicos).` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 15' }
    }
  },
  {
    name: 'Horizonte de Eventos',
    type: 'habilidade',
    img: 'icons/magic/time/clock-stop-white-blue.webp',
    folder: folderIdParasita,
    system: {
      nivel: { value: 20 },
      descricao: { value: `Ação Completa + 10 PE. Cria um ponto de gravidade a até 18m. Criaturas a 6m são puxadas e sofrem 10d10 de dano de Força (Fortitude reduz metade).` },
      acao: { value: 'Ação Completa' },
      requisito: { value: 'Nível 20' }
    }
  }
  ,
  // Vetor da Calamidade (O Azar)
  {
    name: 'Campo de Entropia',
    type: 'habilidade',
    img: 'icons/magic/chaos/field-explosion-purple.webp',
    folder: folderIdVetor,
    system: {
      nivel: { value: 1 },
      descricao: { value: `Inimigos a até 3m de ti não podem realizar Acertos Críticos contra ti (20 natural conta como acerto normal).` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 1' }
    }
  },
  {
    name: 'Lei de Murphy',
    type: 'habilidade',
    img: 'icons/skills/trade/accident-warning-yellow.webp',
    folder: folderIdVetor,
    system: {
      nivel: { value: 5 },
      descricao: { value: `Se um inimigo falhar num ataque contra ti por uma margem de 5 ou mais, ele sofre um acidente: fica Caído ou Desarmado (tua escolha).` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 5' }
    }
  },
  {
    name: 'Gato Preto',
    type: 'habilidade',
    img: 'icons/creatures/abilities/animal-cat-black.webp',
    folder: folderIdVetor,
    system: {
      nivel: { value: 10 },
      descricao: { value: `Reação + 2 PE. Quando um inimigo a até 9m tiver sucesso num teste ou ataque, podes forçá-lo a rolar novamente e ficar com o pior resultado.` },
      acao: { value: 'Reação' },
      requisito: { value: 'Nível 10' }
    }
  },
  {
    name: 'Contágio do Infortúnio',
    type: 'habilidade',
    img: 'icons/magic/death/poison-smoke-green.webp',
    folder: folderIdVetor,
    system: {
      nivel: { value: 15 },
      descricao: { value: `A tua aura de "Anti-Crítico" expande-se para 9m e agora protege também os teus aliados dentro da área.` },
      acao: { value: 'Passiva' },
      requisito: { value: 'Nível 15' }
    }
  },
  {
    name: 'Colapso Probabilístico',
    type: 'habilidade',
    img: 'icons/magic/probability/probability-collapse-red.webp',
    folder: folderIdVetor,
    system: {
      nivel: { value: 20 },
      descricao: { value: `Ativa por 1 minuto (10 PE). Qualquer inimigo que te ataque deve rolar 1d4. Se sair "1", o ataque falha automaticamente e ele causa o dano do próprio ataque a si mesmo.` },
      acao: { value: 'Ação (Concentração)' },
      requisito: { value: 'Nível 20' }
    }
  }
  ];

  // Create items in the compendium
  await Item.createDocuments(ITEMS, { pack: pack.collection }).catch(e => console.error('Erro ao criar itens do compêndio de origem', e));

  if (wasLocked) await pack.configure({ locked: true });
  ui.notifications.info(`Compêndio "${PACK_LABEL}" criado/populado com ${ITEMS.length} habilidades de origem.`);
}

window.seedHabilidadesOrigem = seedHabilidadesOrigem;
