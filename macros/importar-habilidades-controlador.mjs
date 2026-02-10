/**
 * Macro: Importar Habilidades - Parte 4: CONTROLADOR
 * * Funcionalidades:
 * - Cria/Atualiza o Compêndio "Habilidades Amaldiçoadas".
  * - Organiza em pastas: Controlador > (Habilidades / Habilidades Base) > Nível.
 * - Adiciona ícones temáticos (invocação, pets, comando, furtividade).
 * - Formata a descrição com parágrafos HTML.
 */

(async () => {
  const PACK_LABEL = "Habilidades Amaldiçoadas";
  const PACK_NAME = "habilidades-amaldicoadas";

  // Verificação de segurança
  if (!game.user?.isGM) {
    ui.notifications.error("Apenas o GM pode executar este macro.");
    return;
  }

  // --- 1. DADOS: CONTROLADOR ---
  const APTIDOES = [
    // Nível 2
    { name: "Aceleração", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Estimulando-as com seus comandos, você é capaz de forçar uma aceleração maior em invocações. Uma vez por rodada, você pode fazer com que uma Invocação se mova duas vezes ao invés de uma.` },
    { name: "Camuflagem Aprimorada", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Ação Comum", duracao: "Sustentada" }, description: `Você pode se camuflar em meio as suas invocações adjacentes. Para cada Invocação adjacente, ataques contra você têm 10% de chance de errar (1 em 1d10).` },
    { name: "Chamado Destruidor", nivel: 2, system: { categoria: "Controlador", custo: "2 PE", ativacao: "Ação Livre", duracao: "Instantâneo" }, description: `Quando uma invocação consegue um crítico, gaste 2 PE para fazer outra invocação adjacente atacar o mesmo alvo.` },
    { name: "Companheiro Amaldiçoado", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Especial", duracao: "Permanente" }, description: `Escolha uma invocação como Companheiro. Ela pode usar a ação Apoiar como Ação Livre uma vez por rodada.` },
    { name: "Dor Partilhada", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Especial", duracao: "Permanente" }, description: `Ao invocar, forme um laço. Se você e a invocação receberem dano de área diferente, ambos recebem o menor valor.` },
    { name: "Frenesi da Invocação", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Especial", duracao: "1 rodada" }, description: `Uma vez por rodada, invocação ataca duas vezes (exceto ações com custo). Ela recebe -5 Defesa/TR e inimigos têm vantagem contra ela.` },
    { name: "Guarda Viva", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Sua Defesa aumenta em 1 para cada Invocação dentro de 3 metros.` },
    { name: "Invocações Móveis", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Deslocamento das invocações aumenta em 1,5m (aumenta nos níveis 6, 12, 18).` },
    { name: "Invocações Resistentes", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `PV Máximo das invocações aumenta em 5 x Bônus de Treinamento.` },
    { name: "Invocações Treinadas", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Invocações recebem treino em perícias adicionais igual a metade do seu bônus de treino.` },
    { name: "Melhoria de Controlador", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Ao obter Melhoria de Controlador, escolha uma das opções de melhoria abaixo:\n\n• Agressividade. Os ataques da Invocação causam 1d6 de dano adicional. No nível 4, recebem um bônus de +3 em rolagens de dano; no nível 8, o dado de dano adicional aumenta para 1d8; no nível 12, o bônus em rolagens de dano aumenta para +6; no nível 16, o dado aumenta para 1d10 e, no nível 18, aumenta para 1d12.\n\n• Resistência. A Defesa da sua Invocação aumenta em 2. No nível 4, recebe 2 de RD contra todos os tipos; no nível 8 recebe +1 de Defesa; no nível 12 recebe mais 3 de RD contra todos os tipos; no nível 16 recebe +1 de Defesa e, no nível 18, recebe +2 de Defesa.\n\n• Mobilidade. O Deslocamento da sua Invocação aumenta em 1,5 metros. Nos níveis 4, 8, 12, 16 e 18 aumenta em +1,5m.\n\n• Precisão. A Invocação recebe +2 em Jogadas de Ataque ou tem a CD de suas Ações aumentada em +2. No nível 4, ela recebe +2 em Jogadas de Ataque ou CD; no nível 8 recebe +1 em Jogada de Ataque ou CD e pode, uma vez por cena, rolar novamente um ataque ou forçar um inimigo a rolar novamente um TR; no nível 12, a capacidade de rolar novamente se torna uma vez por rodada; no nível 16, recebe +2 em Jogadas de Ataque ou CD e, no nível 18 recebe +2 em Jogadas de Ataque ou CD.\n\nA melhoria escolhida é aplicada em uma quantidade de Invocações à sua escolha igual ao seu Bônus de Treinamento. Uma vez feita a escolha, você só pode alterá-la caso uma Invocação que tenha uma melhoria seja morta, escolhendo uma nova Invocação para receber a melhoria durante o próximo descanso longo.` },
    { name: "Otimização de Energia", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Escolha uma habilidade com custo de cada invocação para reduzir o custo em 1 PE.` },
    { name: "Proteger Invocação", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Reação", duracao: "Instantâneo" }, description: `Se invocação for dissipada, use reação para receber o dano por ela. Se estiver perto, reduza o dano em Xd6.` },
    { name: "Rede de Detecção", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `+2 Percepção e +2 Atenção para cada invocação em 3m.` },
    { name: "Técnicas de Combate", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Torne-se treinado em duas armas e use Presença/Sabedoria para ataque e dano.` },
    { name: "Visionário", nivel: 2, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aumenta quantidade de ações/características que invocações podem receber na criação.` },

    // Nível 4
    { name: "Ação Corretiva", nivel: 4, system: { categoria: "Controlador", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Se invocação tirar <10 em perícia, gaste 2 PE para transformar em 10.` },
    { name: "Acompanhamento Amaldiçoado", nivel: 4, system: { categoria: "Controlador", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Quando você ataca, invocação escolhida pode usar reação para atacar ou apoiar.` },
    { name: "Ataque em Conjunto", nivel: 4, system: { categoria: "Controlador", custo: "2 PE/extra", ativacao: "Ação Comum", duracao: "Instantâneo" }, description: `Comande todas invocações para atacar o mesmo alvo. +1 no ataque para cada participante.` },
    { name: "Autonomia", nivel: 4, system: { categoria: "Controlador", custo: "PE Variável", ativacao: "Ao ativar", duracao: "Cena" }, description: `Pague custo extra para invocação ter turno próprio e agir sem comandos.` },
    { name: "Companheiro Avançado", nivel: 4, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", requisitos: "Companheiro Amaldiçoado", duracao: "Permanente" }, description: `Companheiro se torna um Aliado (Iniciante > Veterano > Mestre).` },
    { name: "Crítico Brutal", nivel: 4, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Instantâneo" }, description: `Críticos de invocações causam +1 dado de dano e reduzem Deslocamento ou Defesa do alvo.` },
    { name: "Domador de Maldições", nivel: 4, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Vantagem e anulação de primeira falha ao domar maldições.` },
    { name: "Invocação às", nivel: 4, system: { categoria: "Controlador", custo: "", ativacao: "Especial", requisitos: "Companheiro Amaldiçoado", duracao: "Instantâneo" }, description: `O seu companheiro amaldiçoado também recebe várias capacidades especiais, das quais você pode usar uma delas como ação livre:\n\n• Curar a você em 2d10 + seu modificador de Sabedoria ou Presença. Nos níveis 5, 9, 13 e 17, a cura aumenta em +1d10.\n\n• Infligir 2d8 + seu modificador de Sabedoria ou Presença de dano em um inimigo dentro de 6 metros. No nível 5, esse dano aumenta para 4d8; no nível 9, aumenta para 5d10; no nível 13, aumenta para 8d8 e, no nível 17, aumenta para 8d10. O dano é de um tipo a sua escolha.\n\n• Forçar todos os inimigos dentro de 9 metros a realizarem um teste de resistência de Fortitude ou serem cegados por 2 turnos. Nos níveis 5, 9, 13 e 17, a área afetada aumenta em +3 metros.\n\nVocê pode utilizar cada um dos efeitos uma vez por descanso curto ou longo.` },
    { name: "Invocação Parcial", nivel: 4, system: { categoria: "Controlador", custo: "", ativacao: "Ação Comum/Bônus", duracao: "Instantâneo" }, description: `Use suas ações para realizar ação de uma invocação inativa.` },
    { name: "Potencial Superior", nivel: 4, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Invocações recebem +2 atributos por grau.` },

    // Nível 6
    { name: "Combate em Alcateia", nivel: 6, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", requisitos: "Técnicas de Combate", duracao: "Permanente" }, description: `Aumenta dano da arma se alvo estiver no alcance de uma invocação.` },
    { name: "Concentrar Poder", nivel: 6, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Enquanto 1 invocação" }, description: `Caso possua a habilidade Concentrar Poder, enquanto estiver com apenas uma invocação marcada ativa em campo, ela recebe benefícios, os quais são baseados no seu nível de Controlador, sendo eles:\n\n• Inicial. Toda rolagem de dano ou cura da invocação é aumentada em 1 nível, recebe +5 pontos de vida e +1 de Defesa.\n\n• Nível 6. Toda rolagem de dano ou cura da invocação é aumentada em 2 níveis e soma +3 ao total, recebe +10 pontos de vida e +2 em Defesa e TRs.\n\n• Nível 12. Toda rolagem de dano ou cura da invocação é aumentada em 3 níveis e soma +5 ao total, recebe +20 pontos de vida e +3 em Defesa e TRs.\n\n• Nível 18. Toda rolagem de dano ou cura da invocação é aumentada em 5 níveis e soma +10 ao total, recebe +30 pontos de vida e +5 em Defesa e TRs.\n\nEsta habilidade afeta apenas invocações marcadas: durante um descanso, você pode escolher uma quantidade de invocações igual a metade do seu bônus de treinamento para serem invocações marcadas. Esta escolha só pode ser mudada após outro descanso.` },
    { name: "Hoste Amaldiçoada", nivel: 6, system: { categoria: "Controlador", custo: "", ativacao: "Especial", duracao: "Permanente" }, description: `Pode criar duas hordas ao invés de uma reduzindo grau do líder.` },
    { name: "Invocações Econômicas", nivel: 6, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Reduz custo de invocação/ativação de duas invocações em 2.` },
    { name: "Proteção Avançada de Invocação", nivel: 6, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", requisitos: "Proteger Invocação", duracao: "Permanente" }, description: `Recebe metade do dano ao proteger. Redução aumenta para Xd8. Pode usar como Ação Livre (2 PE).` },
    { name: "Táticas de Alcateia", nivel: 6, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Inimigo flanqueado por invocação perde Defesa e TR.` },

    // Nível 8
    { name: "Aptidões de Controle", nivel: 8, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aumenta Aura, Controle e Leitura ou Barreira em 1.` },
    { name: "Atacar e Invocar", nivel: 8, system: { categoria: "Controlador", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao atacar, gaste 2 PE para invocar criatura instantaneamente.` },
    { name: "Golpes Ágeis", nivel: 8, system: { categoria: "Controlador", custo: "2 PE", ativacao: "Especial", requisitos: "Acompanhamento Amaldiçoado", duracao: "Instantâneo" }, description: `Se invocação usar Acompanhamento, gaste 2 PE para fazer ataque adicional.` },
    { name: "Técnicas de Oportunidade", nivel: 8, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Invocações podem fazer Ataque de Oportunidade.` },

    // Nível 10
    { name: "Buchas de Canhão", nivel: 10, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Invocações de 4º grau não custam extra em hordas.` },
    { name: "Crítico Aprimorado (Controlador)", nivel: 10, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", requisitos: "Crítico Brutal", duracao: "Permanente" }, description: `Invocações critam com 19. Aplica 2 debuffs no crítico.` },
    { name: "Flanco Avançado", nivel: 10, system: { categoria: "Controlador", custo: "", ativacao: "Passiva", requisitos: "Táticas de Alcateia", duracao: "Permanente" }, description: `+1d8 dano em inimigo no alcance de 2+ invocações.` },
    { name: "Resistência Sobrecarregada", nivel: 10, system: { categoria: "Controlador", custo: "PE Variável", ativacao: "Ao invocar", duracao: "Cena" }, description: `Gaste PE para aumentar PV da invocação (+10 por ponto).` },

    // Nível 16
    { name: "Fantoche Supremo", nivel: 16, system: { categoria: "Controlador", custo: "", ativacao: "Especial", duracao: "Cena" }, description: `Uma vez por dia, torne uma invocação suprema (PV x5, Defesa x2, Ação Extra).` },
    { name: "Mestre do Controle", nivel: 16, system: { categoria: "Controlador", custo: "2 PE", ativacao: "Ação Livre", duracao: "Instantâneo" }, description: `Uma vez por rodada, dê ação extra para invocação.` }
  ];

  // --- 1b. HABILIDADES BASE (concedidas automaticamente por nível) ---
  // Observação: "Teste de Resistência Mestre" pode ser compartilhada com outras classes.
  // Se já existir no compêndio, evitamos sobrescrever/mover por organização.
  const HABILIDADES_BASE = [
    {
      name: "Treinamento em Controle",
      nivel: 1,
      system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 1 de Controlador" },
      description: `Você é treinado para controlar Invocações com maior eficiência. Ao obter esta habilidade, você:\n\n• Recebe duas Invocações iniciais, as quais podem ser tanto shikigamis quanto corpos amaldiçoados. Nos níveis 3, 6, 9, 10, 12, 15 e 18 você recebe uma Invocação adicional.\n\n• A quantidade de Invocações que você pode manter ativas em campo aumenta em 1.\n\n• Nos níveis 6, 12 e 18 a quantidade de comandos que você realiza com uma Ação Comum e Bônus aumenta em um (no nível 6, uma Ação Comum permitiria duas Invocações realizarem uma ação complexa ou uma Invocação realizar duas ações complexas).`
    },
    {
      name: "Controle Aprimorado",
      nivel: 4,
      system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 4 de Controlador" },
      description: `Você é naturalmente mais capaz em comandar invocações, aprimorando o desempenho e aplicação delas. Suas invocações recebem um bônus em testes que realizarem igual a +2, aumentando em +1 para cada grau acima do quarto (+3 para terceiro, +4 para segundo etc.). Além disso, você pode utilizar Aptidões Amaldiçoadas das categorias Controle e Leitura a partir de suas Invocações, fazendo com que elas recebam os efeitos, como o aumento de dano de Canalizar em Golpe; entretanto, não é possível utilizar Punho Divergente e Emoção da Pétala Decadente a partir de Invocações.`
    },
    {
      name: "Apogeu",
      nivel: 6,
      system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 6 de Controlador" },
      description: `Você começa a encontrar o caminho que deseja seguir como um controlador, especializando-o em um estilo específico de controle. Escolha entre:\n\n• Controle Concentrado. Você opta por concentrar suas forças e foco em uma única invocação, a qual sozinha se torna uma arma absoluta. Ao invés de invocar/ativar duas invocações como uma ação bônus, você pode invocar apenas uma como ação livre.\n\n• Controle Disperso. Você prefere controlar diversas invocações, mantendo a quantidade sempre em número superior. O número de invocações que você pode manter ativas em campo aumenta em 1, assim como a quantidade que você pode invocar/ativar com uma ação aumenta em 1. Além disso, você recebe acesso à ação Criar Horda. A partir do nível 12, o número de invocações que você pode manter ativas em campo e invocar/ativar com uma ação aumenta em 1, assim como você pode criar duas hordas como parte de uma mesma ação de Criar Horda.\n\n• Controle Sintonizado. Você prefere ficar em sintonia com suas invocações, não deixando que apenas elas lutem sozinhas. Uma vez por rodada, quando uma invocação em campo realizar um ataque contra um alvo dentro do seu alcance, você pode pagar 2 PE para, como uma Ação Livre, realizar um ataque contra o mesmo alvo. Além disso, para cada invocação que possua em campo, você recebe +1 em acerto e dano, com elas te auxiliando.`
    },
    {
      name: "Teste de Resistência Mestre",
      nivel: 9,
      shared: true,
      system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 9 de Controlador" },
      description: `Você se torna treinado em um segundo teste de resistência e mestre no concedido pela sua especialização.`
    },
    {
      name: "Reserva para Invocação",
      nivel: 10,
      system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 10 de Controlador" },
      description: `Você cria uma reserva dedicada para invocar ou ativar as suas invocações. Uma vez por descanso curto, você pode optar por usar a ação Invocar para trazer duas invocações com o custo reduzido pela metade ou uma invocação sem custo. Caso utilize esta habilidade para Criar Horda, o custo total dela é reduzido pela metade.`
    },
    {
      name: "Ápice do Controle",
      nivel: 20,
      system: { categoria: "Controlador", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 20 de Controlador" },
      description: `Você alcançou o ápice do controle, levando além do limite a arte de ter invocações e as controlar, sendo uma presença única no mundo. Suas invocações recebem duas ações/características adicionais, as quais não influenciam no custo delas; você passa a poder invocar ou ativar suas invocações como uma ação livre (caso ela já pudesse ser invocada como Ação Livre, ela tem seu custo reduzido em 2 PE). Além disso, conhecendo bem as táticas para utilizar invocações, você consegue prever parte dos movimentos delas: invocações de outras criaturas possuem desvantagem para realizar ações ofensivas contra você.`
    }
  ];

  const ENTRIES = [
    ...HABILIDADES_BASE.map(e => ({ ...e, _section: 'base' })),
    ...APTIDOES.map(e => ({ ...e, _section: 'habilidades' }))
  ];

  // --- 2. CONFIGURAÇÃO E HELPERS ---

  // Ícones inteligentes para Controlador
  const ICON_MAP = [
    { key: "invocação", icon: "icons/magic/control/silhouette-hold-beam-blue.webp" },
    { key: "invocações", icon: "icons/magic/control/silhouette-hold-beam-blue.webp" },
    { key: "companheiro", icon: "icons/creatures/mammals/wolf-blue.webp" },
    { key: "fantoche", icon: "icons/creatures/magical/construct-golem-stone-grey.webp" },
    { key: "aceleração", icon: "icons/skills/movement/feet-winged-boots-glowing-yellow.webp" },
    { key: "movimento", icon: "icons/skills/movement/feet-winged-boots-glowing-yellow.webp" },
    { key: "camuflagem", icon: "icons/magic/nature/stealth-hide-eyes-green.webp" },
    { key: "destruidor", icon: "icons/skills/melee/strike-hammer-destructive.webp" },
    { key: "dor", icon: "icons/magic/unholy/strike-body-life-soul-purple.webp" },
    { key: "frenesi", icon: "icons/skills/social/intimidation-impressing.webp" },
    { key: "guarda", icon: "icons/equipment/shield/heater-steel-gold.webp" },
    { key: "resistentes", icon: "icons/magic/defensive/shield-barrier-blue.webp" },
    { key: "proteção", icon: "icons/magic/defensive/shield-barrier-blue.webp" },
    { key: "melhoria", icon: "icons/sundries/books/book-open-purple.webp" },
    { key: "otimização", icon: "icons/magic/symbols/star-yellow.webp" },
    { key: "detecção", icon: "icons/magic/perception/eye-ringed-green.webp" },
    { key: "combate", icon: "icons/skills/melee/weapons-crossed-swords-yellow.webp" },
    { key: "visionário", icon: "icons/magic/perception/orb-crystal-purple.webp" },
    { key: "corretiva", icon: "icons/magic/time/arrows-circling-green.webp" },
    { key: "acompanhamento", icon: "icons/skills/social/diplomacy-handshake-blue.webp" },
    { key: "conjunto", icon: "icons/skills/social/diplomacy-handshake-yellow.webp" },
    { key: "autonomia", icon: "icons/magic/control/energy-stream-blue.webp" },
    { key: "crítico", icon: "icons/skills/wounds/blood-drip-droplet-red.webp" },
    { key: "domador", icon: "icons/equipment/hand/glove-leather-red.webp" },
    { key: "parcial", icon: "icons/magic/symbols/ring-circle-smoke-blue.webp" },
    { key: "potencial", icon: "icons/magic/light/explosion-star-glow-yellow.webp" },
    { key: "alcateia", icon: "icons/creatures/mammals/wolf-pack-grey.webp" },
    { key: "concentrar", icon: "icons/magic/light/beam-rays-yellow.webp" },
    { key: "hoste", icon: "icons/creatures/slimes/slime-movement-swirling-green.webp" },
    { key: "econômicas", icon: "icons/commodities/currency/coins-plain-stack-gold.webp" },
    { key: "atacar", icon: "icons/skills/melee/strike-sword-blood-red.webp" },
    { key: "ágeis", icon: "icons/skills/movement/feet-winged-boots-brown.webp" },
    { key: "oportunidade", icon: "icons/sundries/gaming/dice-runes-brown.webp" },
    { key: "buchas", icon: "icons/creatures/slimes/slime-movement-swirling-green.webp" },
    { key: "flanco", icon: "icons/skills/social/diplomacy-handshake-yellow.webp" },
    { key: "sobrecarregada", icon: "icons/magic/lightning/bolt-strike-blue.webp" },
    { key: "mestre", icon: "icons/magic/symbols/star-yellow.webp" }
  ];

  function guessIcon(name) {
    const n = name.toLowerCase();
    const match = ICON_MAP.find(m => n.includes(m.key));
    return match ? match.icon : "icons/svg/book.svg";
  }

  const ICON_FALLBACK = "icons/svg/book.svg";
  const _iconExistCache = new Map();

  async function resolveIcon(iconPath, fallback = ICON_FALLBACK) {
    if (!iconPath) return fallback;
    if (String(iconPath).startsWith("icons/svg/")) return iconPath;
    if (_iconExistCache.has(iconPath)) return _iconExistCache.get(iconPath);

    let ok = false;
    try {
      const res = await fetch(iconPath, { method: "HEAD" });
      ok = res.ok;
      if (!ok && res.status === 405) {
        const res2 = await fetch(iconPath, { method: "GET" });
        ok = res2.ok;
      }
    } catch {
      ok = false;
    }

    const finalPath = ok ? iconPath : fallback;
    _iconExistCache.set(iconPath, finalPath);
    return finalPath;
  }

  const SYSTEM_ID = game?.system?.id ?? 'feiticeiros-e-maldicoes';
  const CLASSE_BASE = 'Controlador';
  const APTIDAO_PREFIX = 'controlador';

  function slugifyKey(text) {
    return String(text ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function normalizeAcao(ativacao) {
    const a = String(ativacao ?? '').trim().toLowerCase();
    if (!a) return 'Passiva';
    if (a.startsWith('passiva')) return 'Passiva';
    return 'Ativa';
  }

  function buildPassivePlaceholderEffect(label, icon) {
    return {
      name: String(label ?? '').trim() || 'Habilidade Passiva',
      icon: icon || ICON_FALLBACK,
      disabled: false,
      changes: [],
      flags: {
        [SYSTEM_ID]: {
          passiveAptidaoPlaceholder: true,
        }
      }
    };
  }

  function formatDescription(text) {
    if (!text) return "";
    if (text.includes("<p>") || text.includes("<br>")) return text;
    return text.split(/\n\s*\n/).map(p => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`).join("");
  }

  // --- 3. PREPARAÇÃO DO COMPÊNDIO ---
  
  let pack = game.packs.find(p => p.metadata?.label === PACK_LABEL && p.documentName === "Item");
  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      label: PACK_LABEL,
      name: PACK_NAME,
      type: "Item",
      package: "world"
    });
  }
  if (pack.locked) {
    ui.notifications.error(`Destrave o Compêndio "${PACK_LABEL}" e tente novamente.`);
    return;
  }

  const existingItems = await pack.getDocuments();
  const existingIdByName = new Map(existingItems.map(i => [i.name.trim().toLowerCase(), i.id]));
  const existingDocByName = new Map(existingItems.map(i => [i.name.trim().toLowerCase(), i]));

  // --- 4. GESTÃO DE PASTAS ---
  
  const existingFolders = pack.folders.contents;
  const folderMap = new Map(existingFolders.map(f => [`${f.name}#${f.folder?.id || 'root'}`, f]));

  async function ensureFolder(name, parentId = null) {
    const key = `${name}#${parentId || 'root'}`;
    if (folderMap.has(key)) return folderMap.get(key);

    const folder = await Folder.create({
      name: name,
      type: "Item",
      folder: parentId,
      sorting: "a"
    }, { pack: pack.collection });
    
    folderMap.set(key, folder);
    return folder;
  }

  const rootFolder = await ensureFolder(PACK_LABEL);

  // Estrutura: Habilidades Amaldiçoadas > Controlador > (Habilidades / Habilidades Base) > Nível X
  const classFolder = await ensureFolder(CLASSE_BASE, rootFolder.id);
  const habilidadesFolder = await ensureFolder('Habilidades', classFolder.id);
  const baseFolder = await ensureFolder('Habilidades Base', classFolder.id);

  const habilidadesLevels = Array.from(new Set(APTIDOES.map(e => e.nivel || 0))).sort((a, b) => a - b);
  const baseLevels = Array.from(new Set(HABILIDADES_BASE.map(e => e.nivel || 0))).sort((a, b) => a - b);

  const folderIdCache = {
    habilidades: {},
    base: {}
  };

  for (const lvl of habilidadesLevels) {
    const lvlName = lvl > 0 ? `Nível ${lvl}` : 'Geral';
    const lvlFolder = await ensureFolder(lvlName, habilidadesFolder.id);
    folderIdCache.habilidades[lvl] = lvlFolder.id;
  }

  for (const lvl of baseLevels) {
    const lvlName = lvl > 0 ? `Nível ${lvl}` : 'Geral';
    const lvlFolder = await ensureFolder(lvlName, baseFolder.id);
    folderIdCache.base[lvl] = lvlFolder.id;
  }

  // --- 5. PREPARAÇÃO DOS DADOS ---

  const toCreate = [];
  const toUpdate = [];
  const toDelete = [];

  for (const entry of ENTRIES) {
    const isBase = entry._section === 'base';
    const catName = entry.system?.categoria || "Outros";
    const lvl = entry.nivel || 0;
    const folderId = isBase ? folderIdCache.base[lvl] : folderIdCache.habilidades[lvl];

    const descriptionHtml = formatDescription(entry.description);
    const icon = await resolveIcon(entry.img || guessIcon(entry.name));

    const acaoNorm = normalizeAcao(entry.system?.ativacao);
    const habilidadeKey = `${APTIDAO_PREFIX}.${slugifyKey(entry.name)}`;
    const existingDoc = existingDocByName.get(entry.name.trim().toLowerCase());
    const existingHasEffects = (existingDoc?.effects?.size ?? (existingDoc?.effects?.contents?.length ?? 0)) > 0;

    const itemData = {
      name: entry.name,
      type: "habilidade",
      img: icon,
      folder: folderId,
      flags: {
        [SYSTEM_ID]: {
          habilidadeKey,
        }
      },
      system: {
        fonte: { value: PACK_LABEL },
        descricao: { value: descriptionHtml },
        custo: { value: parseInt(entry.system?.custo?.match(/\d+/)?.[0] || 0), label: "Custo (PE)" },
        custoTexto: { value: entry.system?.custo || "", label: "Custo (texto)" },
        acao: { value: acaoNorm, label: "Ação" },
        requisito: { value: entry.system?.requisitos || "", label: "Requisito" },

        classe: { value: CLASSE_BASE, label: "Classe" },
        nivelMin: { value: lvl, label: "Nível mínimo (classe)" },
        
        tipo: { value: "habilidade" },
        categoria: { value: catName },
        ativacao: { value: entry.system?.ativacao || "" },
        duracao: { value: entry.system?.duracao || "" }
      }
    };

    // Passivas 100% do tempo: se o item não tem efeito mecânico, ao menos cria um placeholder
    // para aparecer na lista de efeitos do ator (sincronizado por aptidoes-passivas.mjs).
    if (acaoNorm === 'Passiva' && !existingHasEffects) {
      itemData.effects = [buildPassivePlaceholderEffect(entry.name, icon)];
    }

    const existingId = existingIdByName.get(entry.name.trim().toLowerCase());

    if (existingId) {
      // Se o item já existe como outro tipo, deletar e recriar (trocar type não é seguro no Foundry).
      if (existingDoc?.type && existingDoc.type !== 'habilidade') {
        toDelete.push(existingId);
        toCreate.push(itemData);
        continue;
      }

      // Itens compartilhados (ex: mesma habilidade em várias classes): se já existe, não sobrescreve/move.
      if (entry.shared) continue;

      toUpdate.push({ _id: existingId, ...itemData });
    } else {
      toCreate.push(itemData);
    }
  }

  // --- 6. EXECUÇÃO EM BATCH ---

  if (toDelete.length > 0) {
    console.log(`Removendo ${toDelete.length} itens com tipo incorreto...`);
    await Item.deleteDocuments(toDelete, { pack: pack.collection });
  }
  
  if (toCreate.length > 0) {
    console.log(`Criando ${toCreate.length} novos itens...`);
    await Item.createDocuments(toCreate, { pack: pack.collection });
  }
  
  if (toUpdate.length > 0) {
    console.log(`Atualizando ${toUpdate.length} itens existentes...`);
    await Item.updateDocuments(toUpdate, { pack: pack.collection });
  }

  ui.notifications.info(`Concluído! ${toCreate.length} criados, ${toUpdate.length} atualizados.`);
})();
