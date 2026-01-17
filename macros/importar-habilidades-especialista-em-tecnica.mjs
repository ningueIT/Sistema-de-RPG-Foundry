/**
 * Macro: Importar Habilidades - Parte 3: ESPECIALISTA EM TÉCNICAS
 * * Funcionalidades:
 * - Cria/Atualiza o Compêndio "Habilidades Amaldiçoadas".
 * - Organiza em pastas: Especialista em Técnicas > Nível.
 * - Adiciona ícones temáticos (energia, livros, runas, explosões).
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

  // --- 1. DADOS: ESPECIALISTA EM TÉCNICAS ---
  const APTIDOES = [
    // Nível 2
    { name: "Abastecido Pelo Sangue", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Reação", duracao: "Instantâneo" }, description: `Quando um inimigo morre dentro de 12 metros de você, você pode usar sua reação para recuperar uma quantidade de energia amaldiçoada igual ao seu modificador de Inteligência ou Sabedoria. Você pode realizar essa ação uma vez por descanso longo. No nível 8 aumenta para duas vezes e no nível 16 para três vezes.` },
    { name: "Conhecimento Aplicado", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "PE Variável", ativacao: "Especial", duracao: "Instantâneo" }, description: `Sempre que for realizar um teste de resistência contra o efeito de um Feitiço, você pode gastar pontos de energia amaldiçoada igual a metade do seu bônus de treinamento para receber um bônus: para cada ponto gasto, você adiciona +2 no teste de resistência.` },
    { name: "Conjuração Defensiva", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "2 PE", ativacao: "Especial", duracao: "Até o próximo turno" }, description: `Ao usar um Feitiço, você pode gastar 2 PE para, até o começo do seu próximo turno, receber um bônus em Defesa e um valor em RD igual ao nível do Feitiço usado.` },
    { name: "Economia de Energia", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Ação Comum", duracao: "Instantâneo" }, description: `Enquanto descansando você armazena parte de sua energia. Após um descanso curto, sua reserva é igual a 1d4, após um longo é 1d6 (aumenta um dado a cada 5 níveis). Como uma ação comum, você pode adicionar a energia da reserva no seu valor atual.` },
    { name: "Explosão Encadeada", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Instantâneo" }, description: `Ao rolar o dano máximo em um dado de dano de um Feitiço, você rola mais um dado de mesmo valor, adicionando o resultado ao total. Funciona apenas uma vez por dado do Feitiço.` },
    { name: "Finta Amaldiçoada", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Instantâneo" }, description: `Você pode utilizar Fintar com seu atributo-chave ao invés de Presença e os efeitos de Desprevenido por fintar são aplicados na sua próxima conjuração de Feitiço.` },
    { name: "Mente Plácida", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "1 ou 2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Quando realizar um teste para manter concentração, você pode gastar 1 ponto de energia para receber um bônus de +3 ou 2 pontos de energia para receber +5, e a CD sempre será reduzida em um valor igual ao seu modificador de atributo-chave.` },
    { name: "Nova Habilidade", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Ao obter esta habilidade, você pode imediatamente criar dois novos Feitiços ou três variações de liberação. Você pode pegar essa habilidade repetidas vezes.` },
    { name: "Perturbação Amaldiçoada", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "2 PE", ativacao: "Ação Comum", duracao: "Variável" }, description: `Gaste 2 PE para perturbar uma criatura em 9m (TR Vontade). Se falhar, recebe um prejuízo em rolagens igual ao seu modificador de Inteligência ou Sabedoria; se suceder, metade. Dura por uma quantidade de rolagens igual ao seu bônus de treinamento.` },
    { name: "Reação Rápida", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você passa a adicionar seu modificador de Inteligência ou Sabedoria no seu bônus de iniciativa.` },
    { name: "Reforço Amaldiçoado", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Sua CD de Especialização e Amaldiçoada aumenta em +2. No nível 10, esse aumento se torna +3 e no nível 20, se torna +4.` },
    { name: "Sobrecarregar", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "PE Variável", ativacao: "Especial", duracao: "Instantâneo" }, description: `Quando usar um Feitiço que força um teste de resistência você pode gastar pontos de energia amaldiçoada igual ao seu bônus de treinamento para aumentar a dificuldade do teste. Para cada ponto gasto, a dificuldade aumenta em 1.` },
    { name: "Técnicas de Combate", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você pode escolher duas armas quaisquer para se tornar treinado e para poder utilizar Inteligência ou Sabedoria nas jogadas de ataque e dano enquanto as manejando.` },
    { name: "Zelo Recompensador", nivel: 2, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Instantâneo" }, description: `Sempre que você suceder em um teste de resistência para evitar o efeito de um Feitiço, você recebe 1 ponto de energia amaldiçoada temporário (2 a partir do nível 14).` },

    // Nível 4
    { name: "Até a Última Gota", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "1 Exaustão", ativacao: "Ação Comum", duracao: "Instantâneo" }, description: `Uma vez por descanso longo, se <50% PE, recupere 1d4 + Mod. Recebe um ponto de exaustão.` },
    { name: "Ciclagem Maldita", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Instantâneo" }, description: `Quando utilizar um Feitiço de dano diferente do último Feitiço que você utilizou anteriormente, ele causa uma quantidade de dados de dano adicionais igual a metade do seu bônus de treinamento.` },
    { name: "Determinação Energizada", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "1 PE (+1/teste)", ativacao: "Especial", duracao: "Instantâneo" }, description: `Quando fizer um teste de resistência de Astúcia ou de Vontade, você pode pagar 1 PE para receber vantagem no teste.` },
    { name: "Energia Focalizada", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você escolhe uma perícia de Teste de Resistência (Fortitude, Reflexos, Astúcia e Vontade) para ter metade do seu modificador de atributo-chave somado a rolagens dela.` },
    { name: "Energia Inacabável", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Seu máximo de energia amaldiçoada aumenta em um valor igual a metade do seu nível de Especialista em Técnicas.` },
    { name: "Epifania Amaldiçoada", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você aprende uma Aptidão Amaldiçoada. No nível 12 você recebe outra aptidão amaldiçoada.` },
    { name: "Explosão Defensiva", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "PE Variável", ativacao: "Reação", requisitos: "Cobrir-se", duracao: "Instantâneo" }, description: `Quando for atingido por um ataque corpo a corpo, você pode gastar até uma quantidade de PE igual ao seu bônus de treinamento: para cada PE gasto, você reduz o dano em 5 e empurra o atacante em 3 metros.` },
    { name: "Feitiço Favorito", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Escolha um Feitiço: ele recebe uma Melhoria de Ritual permanente.` },
    { name: "Feitiços Refinados", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você passa a somar metade do seu bônus de treinamento no cálculo de CD dos seus Feitiços e Aptidões Amaldiçoadas.` },
    { name: "Movimentos Imprevisíveis", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você pode adicionar seu modificador de Inteligência ou de Sabedoria na sua Defesa, limitado pelo seu nível.` },
    { name: "Naturalidade com Rituais", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Prestidigitação", duracao: "Permanente" }, description: `Você pode utilizar Inteligência no lugar de Destreza em testes de Prestidigitação para realizar rituais.` },
    { name: "Olhar Preciso", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você recebe um bônus de +2 em rolagens de ataque para Feitiços e aptidões amaldiçoadas. A cada 4 níveis, esse bônus aumenta em +1.` },
    { name: "Preparação de Técnicas", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Descanso Longo", duracao: "Até uso" }, description: `Você pode preparar dois Feitiços por descanso longo, para conjurar com custo reduzido pela metade na primeira vez. O nível do Feitiço aumenta conforme seu nível.` },
    { name: "Sacrifício pela Energia", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "PV", ativacao: "Especial", duracao: "Instantâneo" }, description: `Para cada 6 de dano que você causar a si mesmo, você recupera 2 pontos de energia amaldiçoada. Os pontos de vida perdidos não podem ser restaurados até o final do próximo descanso.` },
    { name: "Versatilidade em Fundamentos", nivel: 4, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Descanso", duracao: "Permanente" }, description: `Durante um descanso curto, você pode alterar quais Mudanças de Fundamentos você possui.` },

    // Nível 6
    { name: "Bastião Interior", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Treinado em Vontade", duracao: "Permanente" }, description: `Você recebe vantagem para resistir às condições amedrontado, desorientado e enfeitiçado.` },
    { name: "Combate Amaldiçoado", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "2 PE (Opcional)", ativacao: "Passiva/Especial", requisitos: "Técnicas de Combate", duracao: "Variável" }, description: `Ataque com arma treinada causa dano adicional igual bônus de treino. Pode gastar 2 PE para aumentar o nível de dano da arma durante o combate.` },
    { name: "Correção", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "PE = Nível Feitiço", ativacao: "Reação", duracao: "Instantâneo" }, description: `Quando você for perder a concentração em um Feitiço, você pode gastar pontos de energia amaldiçoada igual ao nível do Feitiço para evitar perder a concentração.` },
    { name: "Dominância em Feitiço", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `O custo de um Feitiço a sua escolha diminui em um valor igual a metade do nível dele.` },
    { name: "Elevar Aptidão", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você aumenta um dos seus Níveis de Aptidão em 1. Pode pegar esta habilidade várias vezes.` },
    { name: "Especialização", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você se torna mestre em 3 perícias nas quais você seja treinado.` },
    { name: "Incapaz de Falhar", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao realizar uma rolagem de aptidão amaldiçoada (exceto Domínio), você pode gastar 2 PE para adicionar seu modificador de Inteligência ou Sabedoria no resultado.` },
    { name: "Mente Repartida", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você pode se manter concentrando em duas fontes diferentes simultaneamente.` },
    { name: "Nível Perfeito", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Todos os seus Feitiços de um nível a sua escolha têm a CD de resistência aumentada em 2.` },
    { name: "Passo Rápido", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Reação", duracao: "Instantâneo" }, description: `Quando um inimigo se aproxima e entra no alcance corpo a corpo, você pode se afastar metade do movimento (sem ataque de oportunidade).` },
    { name: "Potência Concentrada", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "Ação de Movimento", ativacao: "Especial", duracao: "Próximo feitiço" }, description: `Gaste uma Ação de Movimento para fazer com que seu próximo Feitiço de dano com alvo único cause dano adicional igual a 5 multiplicado pelo nível do Feitiço.` },
    { name: "Ritualista", nivel: 6, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Bônus de +2 em Conjuração em Ritual. Pode colocar 1 melhoria adicional nela.` },

    // Nível 8
    { name: "Expansão dos Fundamentos", nivel: 8, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você aprende mais uma Mudança de Fundamento. No nível 12, você aprende outro adicional.` },
    { name: "Físico Amaldiçoado Defensivo", nivel: 8, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Cobrir-se", duracao: "Permanente" }, description: `A quantidade de PEs que você pode gastar com a aptidão Cobrir-se aumenta em 2.` },
    { name: "Imbuir com Técnica", nivel: 8, system: { categoria: "Especialista em Técnicas", custo: "2 PE", ativacao: "Ação Bônus", requisitos: "Combate Amaldiçoado", duracao: "Instantâneo" }, description: `Pode imbuir um Feitiço de dano (Ação Comum ou menos) em uma arma. Se acertar o ataque, causa dano e efeito do Feitiço.` },
    { name: "Liberações Expandidas", nivel: 8, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você recebe uma Liberação Máxima adicional. Nos níveis 12 e 16 você recebe mais uma.` },
    { name: "Mira Aperfeiçoada", nivel: 8, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Olhar Preciso", duracao: "Permanente" }, description: `Você pode utilizar Mirar para jogadas de ataque amaldiçoado e recebe/aprimora a Mudança de Fundamento Técnica Precisa.` },
    { name: "Primeiro Disparo", nivel: 8, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Especial", requisitos: "Treinado em Reflexos", duracao: "Iniciativa" }, description: `Durante a rolagem da iniciativa, você pode usar uma habilidade cujo custo de tempo seja Ação Bônus ou Ação Livre.` },
    { name: "Revestimento Constante", nivel: 8, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Cobrir-se", duracao: "Permanente" }, description: `Você recebe redução de dano contra todos os tipos, exceto na alma, igual ao seu bônus de treinamento.` },
    { name: "Sustentação Avançada", nivel: 8, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você pode manter um feitiço sustentado adicional e, no começo do combate, pode ativar um feitiço sustentado como Ação Livre.` },

    // Nível 10
    { name: "Destruição Ampla", nivel: 10, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Quando utilizar um Feitiço em área, ela causa 5 de dano adicional para cada criatura além da primeira que estiver sendo afetada por ela.` },
    { name: "Destruição Focada", nivel: 10, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Quando utilizar um Feitiço de dano de alvo único, ela ignora RD e tem seu dano aumentado em dados igual a metade do bônus de treinamento.` },
    { name: "Economia de Energia Avançada", nivel: 10, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Economia de Energia", duracao: "Permanente" }, description: `Reserva aumenta para d6 (curto) e d8 (longo). Usar reserva vira Ação Bônus.` },
    { name: "Sentidos Aguçados", nivel: 10, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Mestre em Percepção", duracao: "Permanente" }, description: `Atenção e Percepção aumentam. Pode gastar 2 PE para se manter no ar.` },

    // Nível 12
    { name: "Esgrimista Jujutsu", nivel: 12, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Especial", requisitos: "Combate Amaldiçoado", duracao: "Instantâneo" }, description: `Quando utilizar Combate Amaldiçoado, você pode também utilizar um Feitiço Auxiliar tendo você mesmo como alvo (custo Ação Bônus).` },
    { name: "Expansão Maestral", nivel: 12, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Expansão de Domínio Completa", duracao: "Permanente" }, description: `Pode utilizar expansões de domínio com apenas uma mão livre e não sofre ataques de oportunidade à distância ao expandir.` },
    { name: "Explosão Máxima", nivel: 12, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Explosão Encadeada", duracao: "Permanente" }, description: `Para cada resultado máximo que conseguir, além de rolar um dado adicional, você soma +4 ao total de dano.` },
    { name: "Mestre das Aptidões", nivel: 12, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `No começo de toda rodada, recebe PE temporários igual a metade do Bônus de Treinamento, exclusivos para Aptidões Amaldiçoadas.` },
    { name: "Versatilidade Ampliada", nivel: 12, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Todos seus Feitiços recebem 1 variação de liberação e você pode escolher um deles para ter uma variação de cada nível que você possua acesso.` },

    // Nível 16
    { name: "Manipulação Perfeita", nivel: 16, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Dominância em Habilidade", duracao: "Permanente" }, description: `Escolha uma quantidade de Feitiços igual ao seu bônus de treinamento para terem seu custo reduzido pela metade.` },
    { name: "Sustentação Mestre", nivel: 16, system: { categoria: "Especialista em Técnicas", custo: "", ativacao: "Passiva", requisitos: "Sustentação Avançada", duracao: "Permanente" }, description: `Você pode manter três feitiços sustentados. Custo para sustentar é diminuído em 1.` }
  ];

  // --- 2. CONFIGURAÇÃO E HELPERS ---

  // Ícones inteligentes para Especialista em Técnicas
  const ICON_MAP = [
    { key: "sangue", icon: "icons/consumables/potions/potion-tube-corked-red.webp" },
    { key: "conhecimento", icon: "icons/sundries/books/book-open-purple.webp" },
    { key: "conjuração", icon: "icons/magic/symbols/runes-star-blue.webp" },
    { key: "defensiva", icon: "icons/magic/defensive/shield-barrier-blue.webp" },
    { key: "energia", icon: "icons/magic/light/explosion-beam-blue.webp" },
    { key: "explosão", icon: "icons/magic/fire/explosion-fireball-large-red.webp" },
    { key: "finta", icon: "icons/skills/social/diplomacy-handshake-blue.webp" },
    { key: "mente", icon: "icons/magic/control/energy-stream-purple.webp" },
    { key: "habilidade", icon: "icons/magic/symbols/star-yellow.webp" },
    { key: "perturbação", icon: "icons/magic/control/fear-fright-white.webp" },
    { key: "reação", icon: "icons/skills/movement/feet-winged-boots-glowing-yellow.webp" },
    { key: "reforço", icon: "icons/magic/defensive/shield-barrier-blue.webp" },
    { key: "sobrecarregar", icon: "icons/magic/lightning/bolt-strike-blue.webp" },
    { key: "combate", icon: "icons/skills/melee/weapons-crossed-swords-yellow.webp" },
    { key: "zelo", icon: "icons/magic/life/heart-glowing-red.webp" },
    { key: "ciclagem", icon: "icons/magic/time/arrows-circling-green.webp" },
    { key: "determinação", icon: "icons/magic/life/heart-shield-gold.webp" },
    { key: "focalizada", icon: "icons/magic/symbols/runes-star-blue.webp" },
    { key: "inacabável", icon: "icons/magic/symbols/ring-circle-smoke-blue.webp" },
    { key: "epifania", icon: "icons/magic/light/beam-rays-yellow.webp" },
    { key: "feitiço", icon: "icons/magic/symbols/star-yellow.webp" },
    { key: "refinados", icon: "icons/magic/symbols/runes-etched-steel.webp" },
    { key: "movimentos", icon: "icons/skills/movement/feet-winged-boots-brown.webp" },
    { key: "rituais", icon: "icons/sundries/scrolls/scroll-runed-blue.webp" },
    { key: "olhar", icon: "icons/magic/perception/eye-ringed-green.webp" },
    { key: "sacrifício", icon: "icons/magic/death/skull-energy-purple.webp" },
    { key: "fundamentos", icon: "icons/sundries/books/book-open-brown.webp" },
    { key: "bastião", icon: "icons/magic/defensive/shield-barrier-glowing-blue.webp" },
    { key: "correção", icon: "icons/magic/time/arrows-circling-green.webp" },
    { key: "dominância", icon: "icons/magic/control/energy-stream-purple.webp" },
    { key: "aptidão", icon: "icons/magic/symbols/star-yellow.webp" },
    { key: "especialização", icon: "icons/sundries/books/book-open-purple.webp" },
    { key: "falhar", icon: "icons/magic/defensive/shield-barrier-blue.webp" },
    { key: "repartida", icon: "icons/magic/control/energy-stream-purple.webp" },
    { key: "perfeito", icon: "icons/magic/symbols/star-yellow.webp" },
    { key: "passo", icon: "icons/skills/movement/feet-winged-boots-brown.webp" },
    { key: "potência", icon: "icons/magic/light/explosion-beam-blue.webp" },
    { key: "ritualista", icon: "icons/sundries/scrolls/scroll-runed-blue.webp" },
    { key: "expansão", icon: "icons/magic/symbols/ring-circle-smoke-blue.webp" },
    { key: "físico", icon: "icons/magic/life/heart-glowing-red.webp" },
    { key: "imbuir", icon: "icons/magic/fire/dagger-rune-fire-purple.webp" },
    { key: "liberações", icon: "icons/magic/light/explosion-star-glow-yellow.webp" },
    { key: "mira", icon: "icons/skills/ranged/target-laser-red.webp" },
    { key: "disparo", icon: "icons/skills/movement/feet-winged-boots-glowing-yellow.webp" },
    { key: "revestimento", icon: "icons/magic/defensive/shield-barrier-blue.webp" },
    { key: "sustentação", icon: "icons/magic/time/hourglass-blue.webp" },
    { key: "destruição", icon: "icons/magic/fire/explosion-fireball-large-red.webp" },
    { key: "sentidos", icon: "icons/magic/perception/eye-ringed-green.webp" },
    { key: "esgrimista", icon: "icons/skills/melee/weapons-crossed-swords-yellow.webp" },
    { key: "maestral", icon: "icons/magic/symbols/ring-circle-smoke-blue.webp" },
    { key: "máxima", icon: "icons/magic/fire/explosion-fireball-large-red.webp" },
    { key: "mestre", icon: "icons/magic/symbols/star-yellow.webp" },
    { key: "versatilidade", icon: "icons/sundries/books/book-open-brown.webp" },
    { key: "manipulação", icon: "icons/magic/control/energy-stream-purple.webp" }
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
  const CLASSE_BASE = 'Especialista em Técnicas';
  const APTIDAO_PREFIX = 'especialista-em-tecnicas';

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
      name: String(label ?? '').trim() || 'Aptidão Passiva',
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
  
  // Agrupa níveis por categoria
  const levelsByCat = {};
  for (const item of APTIDOES) {
    const catName = item.system?.categoria || "Outros";
    const lvl = item.nivel || 0;
    
    if (!levelsByCat[catName]) levelsByCat[catName] = new Set();
    levelsByCat[catName].add(lvl);
  }

  const folderIdCache = {}; 
  for (const [catName, levels] of Object.entries(levelsByCat)) {
    const catFolder = await ensureFolder(catName, rootFolder.id);
    for (const lvl of Array.from(levels).sort((a, b) => a - b)) {
      const lvlName = lvl > 0 ? `Nível ${lvl}` : "Geral";
      const lvlFolder = await ensureFolder(lvlName, catFolder.id);
      folderIdCache[`${catName}-${lvl}`] = lvlFolder.id;
    }
  }

  // --- 5. PREPARAÇÃO DOS DADOS ---

  const toCreate = [];
  const toUpdate = [];

  for (const entry of APTIDOES) {
    const catName = entry.system?.categoria || "Outros";
    const lvl = entry.nivel || 0;
    const folderId = folderIdCache[`${catName}-${lvl}`];

    const descriptionHtml = formatDescription(entry.description);
    const icon = await resolveIcon(entry.img || guessIcon(entry.name));

    const acaoNorm = normalizeAcao(entry.system?.ativacao);
    const aptidaoKey = `${APTIDAO_PREFIX}.${slugifyKey(entry.name)}`;
    const existingDoc = existingDocByName.get(entry.name.trim().toLowerCase());
    const existingHasEffects = (existingDoc?.effects?.size ?? (existingDoc?.effects?.contents?.length ?? 0)) > 0;

    const itemData = {
      name: entry.name,
      type: "aptidao", 
      img: icon,
      folder: folderId,
      flags: foundry.utils.mergeObject(existingDoc?.toObject?.()?.flags ?? {}, {
        [SYSTEM_ID]: { aptidaoKey }
      }),
      system: {
        fonte: { value: PACK_LABEL },
        descricao: { value: descriptionHtml },
        custo: { value: parseInt(entry.system?.custo?.match(/\d+/)?.[0] || 0), label: "Custo (PE)" },
        custoTexto: { value: entry.system?.custo || "", label: "Custo (texto)" },
        acao: { value: acaoNorm, label: "Ação" },
        requisito: { value: entry.system?.requisitos || "", label: "Requisito" },

        classe: { value: CLASSE_BASE, label: "Classe" },
        nivelMin: { value: lvl, label: "Nível mínimo (classe)" },
        
        tipo: { value: "aptidao" }, 
        categoria: { value: catName },
        ativacao: { value: entry.system?.ativacao || "" },
        duracao: { value: entry.system?.duracao || "" }
      }
    };

    if (acaoNorm === 'Passiva' && !existingHasEffects) {
      itemData.effects = [buildPassivePlaceholderEffect(entry.name, icon)];
    }

    const existingId = existingIdByName.get(entry.name.trim().toLowerCase());
    if (existingId) {
      toUpdate.push({ _id: existingId, ...itemData });
    } else {
      toCreate.push(itemData);
    }
  }

  // --- 6. EXECUÇÃO EM BATCH ---
  
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
