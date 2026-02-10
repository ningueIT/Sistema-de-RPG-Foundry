/**
 * Macro: Importar Habilidades - Parte 2: ESPECIALISTA EM COMBATE
 * * Funcionalidades:
 * - Cria/Atualiza o Compêndio "Habilidades Amaldiçoadas".
 * - Organiza em pastas: Especialista em Combate > (Habilidades / Habilidades Base / Assumir Postura / Artes do Combate).
 * - Adiciona ícones temáticos (armas, miras, escudos, posturas).
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

  // --- 1. DADOS: ESPECIALISTA EM COMBATE ---
  const APTIDOES = [
    // Nível 2
    { name: "Arremessos Potentes", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Seus ataques com armas de arremesso contam como um nível de dano acima. No começo do seu turno, pode gastar 1 PE para ignorar RD igual ao bônus de treinamento.` },
    { name: "Arsenal Cíclico", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Uma vez por rodada, pode sacar/trocar item como ação livre. Ao trocar para arma de outro grupo, recebe +1d até o fim do próximo turno.` },
    { name: "Assumir Postura", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você recebe acesso às posturas de combate (Sol, Lua, Terra, Dragão, etc).` },
    { name: "Disparos Sincronizados", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Com duas armas a distância, use ações de ataque juntas. Se ambos acertarem, combina o dano em uma única instância (resistências aplicam 1 vez).` },
    { name: "Escudeiro Agressivo", nivel: 2, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao atacar com escudo, gaste 1 PE para fazer um ataque adicional com o escudo.` },
    { name: "Extensão do Corpo", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Alcance corpo a corpo aumenta em 1,5m. Recebe +2 em ataque e testes contra desarme.` },
    { name: "Flanqueador Superior", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Criatura flanqueada por você recebe -2 em testes de resistência.` },
    { name: "Golpe Falso", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Reação", duracao: "Instantâneo" }, description: `Quando aliado ataca inimigo no seu alcance, faça golpe falso. Inimigo faz TR Astúcia, se falhar, aliado tem vantagem.` },
    { name: "Golpes Potentes", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Com arma treinada, dano aumenta um nível e recebe +2 nas rolagens de dano.` },
    { name: "Indomável", nivel: 2, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste 1 PE para rolar novamente um teste de resistência falho (metade do nível vezes/descanso).` },
    { name: "Pistoleiro Iniciado", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Com arma de fogo, pode aumentar margem de Emperrar em 2 para causar +1 dado de dano.` },
    { name: "Posicionamento Ameaçador", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Concede flanco para aliados mesmo à distância (se alvo estiver no primeiro alcance).` },
    { name: "Precisão Definitiva", nivel: 2, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste 1 PE para +2 no acerto (aumenta com nível). Pode trocar por +4 no dano.` },
    { name: "Presença Suprimida", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `+2 em Furtividade. Penalidade por atacar reduzida para -5.` },
    { name: "Revigorar", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Ação Bônus", duracao: "Instantâneo" }, description: `Recupere 1d10 + 2xCon + Treino em PV. Usos recarregam em descanso.` },
    { name: "Tiro Falso", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Reação", duracao: "Instantâneo" }, description: `Versão à distância do Golpe Falso. Inimigo faz TR Astúcia ou concede vantagem ao aliado.` },
    { name: "Zona de Risco", nivel: 2, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Com arma Estendida, se inimigo entrar no alcance, gaste 2 PE para atacá-lo.` },

    // Nível 4
    { name: "Aprender Postura", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende uma postura adicional. Outra no nível 10.` },
    { name: "Armas Escolhidas", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Escolha um grupo de armas: dano aumenta em 3 níveis.` },
    { name: "Arremesso Rápido", nivel: 4, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao atacar com arremesso, gaste 1 PE para fazer ataque adicional contra outro alvo.` },
    { name: "Técnicas de Avanço", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende artes de combate de avanço (Avanço Bumerangue, Sombra Descendente).` },
    { name: "Buscar Oportunidade", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Ação Livre", duracao: "Instantâneo" }, description: `Faça teste de Percepção (CD 16+2/inimigo). Sucesso permite Andar, Desengajar ou Esconder como ação livre.` },
    { name: "Compensar Erro", nivel: 4, system: { categoria: "Especialista em Combate", custo: "PE Variável", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao errar ataque corpo a corpo, gaste PE para causar dano automático (1d10 + mod por ponto).` },
    { name: "Especialista em Escudo", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Soma aumento base de RD do escudo em TR Reflexos e Fortitude.` },
    { name: "Espírito de Luta", nivel: 4, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Ação Livre", duracao: "Cena" }, description: `Gaste 1 PE: +2 em ataque até o fim da cena e ganha PV temporários igual ao nível.` },
    { name: "Grupo Favorito", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Escolha grupo de armas: recebe acesso ao efeito crítico do grupo.` },
    { name: "Guarda Estudada", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Soma metade do mod. Sabedoria na Defesa. +2 em um TR escolhido.` },
    { name: "Mente Oculta", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Adiciona bônus de Sabedoria em Furtividade.` },
    { name: "Preparo Imediato", nivel: 4, system: { categoria: "Especialista em Combate", custo: "3 Pontos Preparo", ativacao: "Iniciativa", duracao: "Instantâneo" }, description: `Na iniciativa, gaste 3 Pontos para Preparar ação bônus. (Nível 10: 7 pontos para ação comum).` },
    { name: "Recarga Rápida", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Custo de recarga diminui um nível (Comum > Bônus > Livre).` },
    { name: "Uso Rápido", nivel: 4, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao usar item, pague 1 PE para usar item adicional.` },

    // Nível 6
    { name: "Acervo Amplo", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende mais um Estilo de Combate. Pode trocar em descanso curto.` },
    { name: "Aprimoramento Especializado", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Soma metade do mod. atributo chave na CD de Especialização.` },
    { name: "Ataque Extra (Especialista)", nivel: 6, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao realizar ação Atacar, gaste 2 PE para atacar duas vezes.` },
    { name: "Crítico Melhorado", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Margem de crítico reduz em 1.` },
    { name: "Crítico Potente", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Crítico causa 1 dado de dano adicional.` },
    { name: "Feitiçaria Implementada", nivel: 6, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao usar Feitiço de dano, gaste 2 PE para atacar alvo afetado como Ação Livre.` },
    { name: "Fluxo Perfeito", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Se acertar todos ataques no turno, ganha 1 PE temporário no próximo (2 no nível 12).` },
    { name: "Olhos de Águia", nivel: 6, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste 1 PE para usar Mirar como ação livre.` },
    { name: "Manejo Especial", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Escolha uma propriedade de ferramenta amaldiçoada para aplicar em toda arma manejada.` },
    { name: "Marcar Inimigo", nivel: 6, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Até fim do turno" }, description: `Ao acertar corpo a corpo, marque inimigo: ele recebe -4 ataque contra outros. Se atacar outro, você pode gastar 1 PE para atacá-lo (Ação Bônus).` },
    { name: "Mira Destrutiva", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Especial", duracao: "Próximo ataque" }, description: `Ao Mirar, troque vantagem por mira em parte do corpo (-15 ataque). Acerto causa efeito de Ferimento Complexo.` },
    { name: "Preparação Rápida", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Entrar em postura vira Ação Livre e não cancela ao ser empurrado.` },

    // Nível 8
    { name: "Aptidões de Combate", nivel: 8, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aumenta nível de aptidão em Aura ou Controle e Leitura em 1.` },
    { name: "Técnicas da Força", nivel: 8, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende artes de combate da força (Nuvens Espirais, Onda do Dragão).` },
    { name: "Destruição Dupla", nivel: 8, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Passiva", duracao: "Permanente" }, description: `Com duas armas de grupos diferentes: ataque secundário +1 dado dano. Crítico: gaste 1 PE para aplicar efeito dos dois grupos.` },
    { name: "Espírito Incansável", nivel: 8, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Cena" }, description: `Ao usar Espírito de Luta, pode gastar 2 PE para bônus +5 e PV temp igual bônus de ataque.` },
    { name: "Pistoleiro Avançado", nivel: 8, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Pode aumentar Emperrar até 6 (dano extra). Reação para atacar inimigo que se move no alcance (tira movimento).` },
    { name: "Ricochete Constante", nivel: 8, system: { categoria: "Especialista em Combate", custo: "5 PE", ativacao: "Especial", duracao: "Turno" }, description: `Ao usar Arremessos Potentes, pague 5 PE: ataques ricocheteiam para alvo a 4,5m.` },
    { name: "Sombra Viva", nivel: 8, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Esgueirar usa movimento total. Reação para refazer teste de Furtividade se encontrado.` },
    { name: "Surto de Ação", nivel: 8, system: { categoria: "Especialista em Combate", custo: "5 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste 5 PE para realizar uma ação comum a mais no turno (Limite: metade bônus treino/descanso).` },

    // Nível 10
    { name: "Análise Acelerada", nivel: 10, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Análise vira Ação Bônus.` },
    { name: "Armas Perfeitas", nivel: 10, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Armas escolhidas ignoram 10 de RD.` },
    { name: "Assassinar", nivel: 10, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Primeira rodada" }, description: `Primeiro ataque contra desprevenido na primeira rodada é crítico garantido.` },
    { name: "Ataque Concentrado", nivel: 10, system: { categoria: "Especialista em Combate", custo: "PE Variável", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste usos de Ataque Extra/Surto de Ação para adicionar dados de dano ao próximo ataque.` },
    { name: "Chuva de Arremessos", nivel: 10, system: { categoria: "Especialista em Combate", custo: "1 PE/ataque", ativacao: "Ação Completa", duracao: "Instantâneo" }, description: `Realize ataques de arremesso igual ao bônus de treino. Pague 1 PE por ataque extra.` },
    { name: "Potência Antes de Cair", nivel: 10, system: { categoria: "Especialista em Combate", custo: "1 uso/descanso", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao cair a 0 PV, realize um turno impedindo o atual. Depois cai inconsciente com exaustão.` },

    // Nível 12+
    { name: "Técnicas de Saque", nivel: 12, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende artes de combate de saque (Saque Devastador, Saque Trovão).` },
    { name: "Ciclagem Absoluta", nivel: 12, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Pode trocar arma a cada ataque. Trocar para grupo diferente dá +2 no ataque.` },
    { name: "Manejo Único", nivel: 12, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Cena" }, description: `Gaste 2 PE para receber uma propriedade única (criada ou existente) na cena.` },
    { name: "Mestre Pistoleiro", nivel: 12, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Desemperrar vira ação movimento. Margem de crítico +1 com armas de fogo.` },
    { name: "Sincronia Perfeita", nivel: 12, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Alcance extra +3m. Vantagem contra desarme.` }
  ];

  // --- 1b. HABILIDADES BASE (concedidas automaticamente por nível) ---
  const HABILIDADES_BASE = [
    {
      name: "Repertório do Especialista",
      nivel: 1,
      system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 1 de Especialista em Combate" },
      description: `Como um Especialista em Combate, você pode escolher um estilo principal para seguir em sua especialização. No 1º nível, você recebe um dos estilos de combate abaixo:\n\n• Estilo Defensivo. Você foca em aprimorar a sua defesa. Sua Defesa aumenta em 2 e, nos níveis 4, 8, 12 e 16 aumenta em +1.\n\n• Estilo do Arremessador. Você se versa em armas de arremesso. Você pode sacar uma arma de arremesso como parte do ataque, além de receber +2 em rolagens de dano com elas, o qual aumenta em +1 nos níveis 4, 8, 12 e 16.\n\n• Estilo do Duelista. Você foca em duelar com uma única arma em mãos. Ao usar uma arma em uma mão e ter a outra livre, você recebe +1 em rolagens de acerto e +2 em rolagens de dano. Nos níveis 4, 8, 12 e 16, o bônus em dano aumenta em +1; nos níveis 8 e 16, o bônus em acerto aumenta em +1.\n\n• Estilo do Interceptador. Você se dedica a utilizar de suas armas para interceptar ataques em seus aliados. Quando um aliado dentro do seu alcance receber um ataque, você pode usar sua reação para reduzir o dano causado em 1d10 + seu modificador de força, destreza ou sabedoria, aumentando em um dado nos níveis 4, 8, 12 e 16.\n\n• Estilo do Protetor. Você se dedica a proteger seus aliados, buscando evitar um acerto. Quando uma criatura ataca um alvo além de você, que esteja dentro de 1,5 metros, você pode usar sua reação para impor desvantagem. Além disso, você pode também conceder vantagem no Teste de Resistência de um aliado dentro de 1,5 metros.\n\n• Estilo Distante. Você sabe como usar armas que focam em atingir de maneira distante. Você recebe +1 em rolagens de acerto e +2 em rolagens de dano com armas a distância. Nos níveis 4, 8, 12 e 16, o bônus em dano aumenta em +1; nos níveis 8 e 16, o bônus em acerto aumenta em +1.\n\n• Estilo Duplo. Você sabe a maneira perfeita de manejar duas armas. Enquanto estiver lutando com duas armas, você pode adicionar o seu bônus de atributo no dano do ataque com a segunda arma, além de receber um bônus de +1 em rolagens de dano, o qual aumenta em +1 nos níveis 4, 8, 12 e 16.\n\n• Estilo Massivo. Você domina armas pesadas e massivas. Quando rolar um 1 ou 2 em um dado na rolagem de dano com uma arma que esteja usando em duas mãos ou que possua a propriedade pesada, você pode rolar novamente esse dado, ficando com o novo resultado. Além disso, você recebe +1 em rolagens de dano com a arma, aumentando em +1 nos níveis 4, 8, 12 e 16.\n\nVocê recebe um novo estilo de combate no nível 6 e outro no 12, complementando suas capacidades dentro de combate.`
    },
    {
      name: "Artes do Combate",
      nivel: 1,
      system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 1 de Especialista em Combate" },
      description: `Levando o combate como uma arte a se estudar e aperfeiçoar, você sabe como se preparar e usar desse preparo para possibilitar realizar ações especiais dentro de um combate.\n\nVocê recebe uma quantidade de Pontos de Preparo igual ao seu nível de Especialista em Combate + Modificador de Sabedoria, os quais são usados para realizar artes de combate.\n\nVocê sabe as seguintes artes de combate:\n\n• Arremesso Ágil. Ao realizar um ataque corpo-a-corpo, você pode gastar 1 ponto de preparo para, como uma ação livre, realizar um outro ataque, com uma arma de arremesso, contra um segundo alvo.\n\n• Distração Letal. Ao realizar um ataque, você pode gastar 1 ponto de preparo para fazer com que ele foque em distrair o alvo. Caso o ataque acerte, a criatura atingida tem a sua Defesa reduzida em um valor igual a metade do seu Modificador de Sabedoria por uma rodada.\n\n• Execução Silenciosa. Ao realizar um ataque em uma criatura desprevenida, você pode gastar 1 ponto de preparo para aumentar a letalidade do ataque, adicionando 1d6 de dano. A cada +2 no Modificador de Sabedoria, o dano aumenta em +1d6.\n\n• Golpe Descendente. Ao realizar um ataque corpo-a-corpo, você pode gastar 1 ponto de preparo para fazer com que ele venha por cima. Ao acertar um golpe descendente, sua Defesa aumenta em um valor igual a metade do seu Modificador de Sabedoria até o começo do seu próximo turno.\n\n• Investida Imediata. Ao realizar a ação de ataque, você pode gastar 2 pontos de preparo para tornar esse ataque em uma investida imediata, aproximando-se uma quantidade de metros igual ao seu Modificador de Sabedoria x 1,5m de um alvo e realizando o ataque logo após. Esse movimento não causa ataques de oportunidade.\n\nSempre que eliminar um inimigo, você recupera um Ponto de Preparo; você pode usar sua ação comum para analisar o campo de batalha, recuperando dois Pontos de Preparo. Em um descanso curto, você recupera metade do seu máximo, enquanto em um descanso longo os recupera por completo.`
    },
    {
      name: "Golpe Especial",
      nivel: 4,
      system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 4 de Especialista em Combate" },
      description: `Quando realizar um ataque, ou arte do combate que envolva um ataque, você pode o montar como um ataque especial, escolhendo entre as opções abaixo:\n\n• Amplo. O ataque atinge uma criatura a mais. +2PE\n• Atroz. Em um acerto, o ataque causa 1 dado de dano adicional. +1PE\n• Impactante. Empurra o alvo em 1,5 metros para cada 15 pontos de dano causados. Fortitude reduz à metade. +1PE\n• Letal. Diminui em 1 a margem de crítico do ataque. +2PE\n• Longo. Aumenta o alcance da arma em 1,5 metros para corpo-a-corpo ou 9 metros para ataques a distância. +1PE\n• Penetrante. Ignora redução a dano em um valor igual a metade do seu nível de personagem. +2PE\n• Preciso. Recebe vantagem no ataque. Após o primeiro uso na rodada, o custo aumenta para 2PE. +1PE/+2PE\n• Sanguinário. Uma criatura atingida sofre sangramento leve (CD de Especialização). Pode ser pego uma segunda vez para causar sangramento médio ao invés de leve. +2PE\n• Lento. O ataque deve ser usado como ação completa. -2PE\n• Sacrifício. Recebe 15 de dano ao efetuar o ataque. -1PE\n• Desfocado. O ataque recebe uma penalidade de 4 no acerto (cumulativo até três vezes). -1PE\n\nCertas propriedades aumentam ou diminuem o custo e, ao terminar de montar o ataque especial, você paga o seu custo total; um ataque especial deve custar no mínimo 1 ponto de energia amaldiçoada (PE).`
    },
    {
      name: "Implemento Marcial",
      nivel: 4,
      system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 4 de Especialista em Combate" },
      description: `Você recebe +2 na CD de suas Habilidades de Especialização, Feitiços e Aptidões Amaldiçoadas. Esse bônus aumenta em 1 nos níveis 8° e 16° de Especialista em Combate.`
    },
    {
      name: "Renovação pelo Sangue",
      nivel: 6,
      system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 6 de Especialista em Combate" },
      description: `Com tamanha precisão e letalidade, você passa a ser capaz de renovar seu próprio estoque de energia a partir do sangue. Ao acertar um ataque crítico em um inimigo ou reduzir seus pontos de vida a 0, você recupera um ponto de energia amaldiçoada.`
    },
    {
      name: "Teste de Resistência Mestre",
      nivel: 9,
      system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 9 de Especialista em Combate" },
      description: `Você se torna treinado em um segundo teste de resistência e mestre no concedido pela sua especialização.`
    },
    {
      name: "Autossuficiente",
      nivel: 20,
      system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente", requisitos: "Nível 20 de Especialista em Combate" },
      description: `Tornando-se um mestre das técnicas armadas, você consegue ser autossuficiente na energia para usar seu golpe especial. Sempre que realizar um Golpe Especial, recebe 3 PE temporários para serem usados no ataque. Uma vez por cena, você pode escolher transformar esse valor em 6. Além disso, todos seus ataques causam um dado de dano adicional, do mesmo tipo da arma manuseada.`
    }
  ];

  // --- 1c. POSTURAS (itens separados) ---
  const POSTURAS = [
    {
      name: "Postura do Sol",
      nivel: 0,
      system: { categoria: "Postura", custo: "", ativacao: "Passiva", duracao: "Enquanto em postura", requisitos: "Assumir Postura" },
      description: `Enquanto na postura do sol, todos seus ataques recebem +2 para acertar e causam um dado de dano a mais. Entretanto, sua Defesa diminui em 4.`
    },
    {
      name: "Postura da Lua",
      nivel: 0,
      system: { categoria: "Postura", custo: "", ativacao: "Passiva", duracao: "Enquanto em postura", requisitos: "Assumir Postura" },
      description: `Enquanto na postura da lua, você recebe +3 de Defesa, você pode usar Andar ou Desengajar como ação livre e pode, como uma reação, reduzir um dano que você receber em um valor igual ao seu nível de personagem. Entretanto, todos seus ataques recebem -4 para acertar e não recebem seu bônus de atributo no dano.`
    },
    {
      name: "Postura da Terra",
      nivel: 0,
      system: { categoria: "Postura", custo: "", ativacao: "Passiva", duracao: "Enquanto em postura", requisitos: "Assumir Postura" },
      description: `Enquanto na postura da terra você não pode ser movido a força, soma seu bônus de treinamento em rolagens de Fortitude e, no começo do seu turno, você recebe pontos de vida temporários igual ao seu nível de personagem.`
    },
    {
      name: "Postura do Dragão",
      nivel: 0,
      system: { categoria: "Postura", custo: "", ativacao: "Passiva", duracao: "Enquanto em postura", requisitos: "Assumir Postura" },
      description: `Enquanto na postura do dragão, sempre que realizar um ataque, todo inimigo dentro de 1,5 metros do alvo desse ataque deve realizar um TR de Fortitude ou recebe metade do dano que o alvo recebeu.`
    },
    {
      name: "Postura da Fortuna",
      nivel: 0,
      system: { categoria: "Postura", custo: "", ativacao: "Passiva", duracao: "Enquanto em postura", requisitos: "Assumir Postura" },
      description: `Enquanto estiver na postura da fortuna, ao rodar um d20 e conseguir um resultado igual ou menor ao seu bônus de treinamento, você pode escolher o rolar novamente, ficando com o maior resultado. Você pode utilizar este efeito uma quantidade de vezes igual a metade do seu bônus de treinamento por rodada e apenas uma vez no mesmo dado.`
    },
    {
      name: "Postura da Devastação",
      nivel: 0,
      system: { categoria: "Postura", custo: "", ativacao: "Passiva", duracao: "Enquanto em postura", requisitos: "Assumir Postura; Pré-requisito: Nível 6" },
      description: `Enquanto na postura da devastação, para cada golpe acertado contra o mesmo alvo, você recebe +1 em acerto e ignora 2 de redução de dano, até um máximo igual ao seu bônus de treinamento para o acerto e o dobro dele para a redução de dano. Se você trocar de alvo uma vez, retorna ao zero.`
    },
    {
      name: "Postura da Tempestade",
      nivel: 0,
      system: { categoria: "Postura", custo: "", ativacao: "Passiva", duracao: "Enquanto em postura", requisitos: "Assumir Postura; Pré-requisito: Nível 10" },
      description: `Enquanto na postura da tempestade, sempre que acertar um ataque o alvo realiza um TR de Fortitude, sendo derrubado em uma falha. Caso acerte um ataque em um alvo já caído, ele deve repetir o teste e, caso falhe, fica imóvel até o começo do seu turno.`
    },
    {
      name: "Postura do Céu",
      nivel: 0,
      system: { categoria: "Postura", custo: "", ativacao: "Passiva", duracao: "Enquanto em postura", requisitos: "Assumir Postura; Pré-requisito: Nível 12" },
      description: `Enquanto na postura do céu, o alcance dos seus ataques é dobrado, você recebe 2 pontos de preparo temporários no começo de todo turno e +2 em todas as suas rolagens de perícia.`
    }
  ];

  // --- 1d. ARTES DO COMBATE (itens separados) ---
  const ARTES = [
    {
      name: "Avanço Bumerangue",
      nivel: 0,
      system: { categoria: "Artes do Combate", custo: "Pontos de Preparo", ativacao: "Variável", duracao: "Instantâneo", requisitos: "Técnicas de Avanço" },
      description: `Ao utilizar a ação Atacar, você pode gastar 3 Pontos de Preparo para saltar na direção de um inimigo dentro de 6 metros e, após encerrar a ação, você retorna para o ponto de partida. Nem o avanço nem o retorno causam ataques de oportunidade. Durante o retorno, você pode gastar 1 Ponto de Preparo para realizar um ataque com uma arma de arremesso ou a distância contra o mesmo alvo.`
    },
    {
      name: "Sombra Descendente",
      nivel: 0,
      system: { categoria: "Artes do Combate", custo: "Pontos de Preparo", ativacao: "Ação Comum", duracao: "Instantâneo", requisitos: "Técnicas de Avanço" },
      description: `Como uma Ação Comum, você pode gastar 3 Pontos de Preparo para avançar rapidamente contra um inimigo dentro de 6 metros e realizar um ataque contra ele. Após realizar o ataque, você o utiliza como apoio e se ergue no ar, podendo escolher cair em outro inimigo dentro de 6 metros e realizar um ataque contra ele, caindo em um lugar desocupado dentro de 3 metros do alvo após isso.`
    },
    {
      name: "Nuvens Espirais",
      nivel: 0,
      system: { categoria: "Artes do Combate", custo: "Pontos de Preparo", ativacao: "Ação Completa", duracao: "Instantâneo", requisitos: "Técnicas da Força" },
      description: `Como uma Ação Completa, você inicia uma sequência contra um inimigo dentro do alcance da sua arma: você pode realizar até três ataques, gastando 2 Pontos de Preparo para cada um. A cada ataque, o alvo é empurrado 3 metros para qualquer direção, com você o acompanhando, além de cada ataque causar 2d6 de dano Energético adicional.`
    },
    {
      name: "Onda do Dragão",
      nivel: 0,
      system: { categoria: "Artes do Combate", custo: "Pontos de Preparo", ativacao: "Ação Atacar", duracao: "Instantâneo", requisitos: "Técnicas da Força" },
      description: `Quando utilizar a ação Atacar, você pode gastar 5 Pontos de Preparo para receber vantagem neste ataque e, caso acerte, o alvo é empurrado 6 metros para trás, recebe 3d12 de dano Energético adicional e tem metade da sua Redução de Dano ignorada.`
    },
    {
      name: "Saque Devastador",
      nivel: 0,
      system: { categoria: "Artes do Combate", custo: "Pontos de Preparo", ativacao: "Reação", duracao: "Instantâneo", requisitos: "Técnicas de Saque" },
      description: `No final do seu turno, você pode gastar 2 Pontos de Preparo para preparar um saque, o qual dura até o começo do seu próximo turno. Caso seja atacado enquanto estiver com o saque preparado, você pode gastar 4 Pontos de Preparo e sua Reação para realizar um ataque contra a criatura atacante. Caso o resultado da sua Jogada de Ataque seja maior do que a da criatura, você anula o ataque dela e acerta o seu, o qual causa 4d10 de dano adicional do mesmo tipo da arma e ignora Redução de Dano. Caso o seu resultado seja menor, você apenas causa o dano comum de um ataque.`
    },
    {
      name: "Saque Trovão",
      nivel: 0,
      system: { categoria: "Artes do Combate", custo: "Pontos de Preparo", ativacao: "Ação Completa", duracao: "Instantâneo", requisitos: "Técnicas de Saque" },
      description: `Como uma Ação Completa, você pode gastar 6 Pontos de Preparo para se mover uma distância igual ao seu Deslocamento e, enquanto se movendo desta maneira, você não recebe ataques de oportunidade e pode realizar um ataque contra todo inimigo que fique dentro de 3 metros de você durante a locomoção.`
    }
  ];

  const ENTRIES = [
    ...HABILIDADES_BASE.map(e => ({ ...e, _section: 'base' })),
    ...APTIDOES.map(e => ({ ...e, _section: 'habilidades' })),
    ...POSTURAS.map(e => ({ ...e, _section: 'posturas' })),
    ...ARTES.map(e => ({ ...e, _section: 'artes' }))
  ];

  // --- 2. CONFIGURAÇÃO E HELPERS ---

  // Ícones inteligentes para Especialista em Combate
  const ICON_MAP = [
    { key: "arremesso", icon: "icons/skills/ranged/dagger-thrown-poison-green.webp" },
    { key: "arma", icon: "icons/skills/melee/weapons-crossed-swords-yellow.webp" },
    { key: "arsenal", icon: "icons/equipment/back/backpack-leather-brown.webp" },
    { key: "postura", icon: "icons/svg/statue.svg" },
    { key: "disparo", icon: "icons/weapons/guns/gun-blunderbuss-bronze.webp" },
    { key: "tiro", icon: "icons/weapons/guns/gun-pistol-flintlock-metal.webp" },
    { key: "pistoleiro", icon: "icons/weapons/guns/gun-pistol-flintlock-metal.webp" },
    { key: "escudo", icon: "icons/equipment/shield/heater-steel-gold.webp" },
    { key: "corpo", icon: "icons/magic/life/heart-glowing-red.webp" },
    { key: "flanqueador", icon: "icons/skills/social/diplomacy-handshake-yellow.webp" },
    { key: "golpe", icon: "icons/skills/melee/strike-sword-blood-red.webp" },
    { key: "ataque", icon: "icons/skills/melee/strike-sword-blood-red.webp" },
    { key: "indomável", icon: "icons/magic/defensive/shield-barrier-glowing-blue.webp" },
    { key: "posicionamento", icon: "icons/tools/navigation/map-marked-green.webp" },
    { key: "precisão", icon: "icons/skills/ranged/target-laser-red.webp" },
    { key: "mira", icon: "icons/skills/ranged/target-laser-red.webp" },
    { key: "furtividade", icon: "icons/magic/nature/stealth-hide-eyes-green.webp" },
    { key: "sombra", icon: "icons/magic/nature/stealth-hide-eyes-green.webp" },
    { key: "revigorar", icon: "icons/magic/life/cross-beam-green.webp" },
    { key: "zona", icon: "icons/magic/control/energy-stream-red.webp" },
    { key: "avanço", icon: "icons/skills/movement/feet-winged-boots-brown.webp" },
    { key: "oportunidade", icon: "icons/sundries/gaming/dice-runes-brown.webp" },
    { key: "analise", icon: "icons/tools/navigation/magnifying-glass.webp" },
    { key: "preparo", icon: "icons/tools/smithing/anvil.webp" },
    { key: "recarga", icon: "icons/weapons/ammunition/bullets-lead.webp" },
    { key: "uso", icon: "icons/sundries/misc/key-steel.webp" },
    { key: "crítico", icon: "icons/skills/wounds/blood-drip-droplet-red.webp" },
    { key: "feitiçaria", icon: "icons/magic/symbols/runes-star-blue.webp" },
    { key: "fluxo", icon: "icons/magic/water/wave-water-blue.webp" },
    { key: "manejo", icon: "icons/skills/melee/hand-grip-sword-blue.webp" },
    { key: "marcar", icon: "icons/magic/control/debuff-energy-hold-red.webp" },
    { key: "saque", icon: "icons/skills/melee/maneuver-sword-katana-red.webp" },
    { key: "ciclagem", icon: "icons/magic/time/arrows-circling-green.webp" },
    { key: "assassinar", icon: "icons/skills/melee/strike-dagger-blood-red.webp" }
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
  const CLASSE_BASE = 'Especialista em Combate';
  const HABILIDADE_PREFIX = 'especialista-em-combate';

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
  const especialistaFolder = await ensureFolder('Especialista em Combate', rootFolder.id);
  const habilidadesFolder = await ensureFolder('Habilidades', especialistaFolder.id);
  const baseFolder = await ensureFolder('Habilidades Base', especialistaFolder.id);
  const posturasFolder = await ensureFolder('Assumir Postura', especialistaFolder.id);
  const artesFolder = await ensureFolder('Artes do Combate', especialistaFolder.id);

  // --- 5. PREPARAÇÃO DOS DADOS ---

  const toCreate = [];
  const toUpdate = [];
  const toDelete = [];

  for (const entry of ENTRIES) {
    const catName = entry.system?.categoria || "Outros";
    const lvl = entry.nivel || 0;

    let folderId;
    if (entry._section === 'base') {
      const lvlFolder = await ensureFolder(`Nível ${lvl}`, baseFolder.id);
      folderId = lvlFolder.id;
    }
    else if (entry._section === 'posturas') {
      folderId = posturasFolder.id;
    }
    else if (entry._section === 'artes') {
      folderId = artesFolder.id;
    }
    else {
      // habilidades escolhidas por nível
      const lvlFolder = await ensureFolder(`Nível ${lvl}`, habilidadesFolder.id);
      folderId = lvlFolder.id;
    }

    const descriptionHtml = formatDescription(entry.description);
    const icon = await resolveIcon(entry.img || guessIcon(entry.name));

    const acaoNorm = normalizeAcao(entry.system?.ativacao);
    const habilidadeKey = `${HABILIDADE_PREFIX}.${slugifyKey(entry.name)}`;
    const existingDoc = existingDocByName.get(entry.name.trim().toLowerCase());
    const existingHasEffects = (existingDoc?.effects?.size ?? (existingDoc?.effects?.contents?.length ?? 0)) > 0;

    const itemData = {
      name: entry.name,
      type: "habilidade", 
      img: icon,
      folder: folderId,
      flags: foundry.utils.mergeObject(existingDoc?.toObject?.()?.flags ?? {}, {
        [SYSTEM_ID]: { habilidadeKey }
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
        
        tipo: { value: "habilidade" }, 
        categoria: { value: catName },
        ativacao: { value: entry.system?.ativacao || "" },
        duracao: { value: entry.system?.duracao || "" }
      }
    };

    if (acaoNorm === 'Passiva' && !existingHasEffects) {
      itemData.effects = [buildPassivePlaceholderEffect(entry.name, icon)];
    }

    const existingId = existingIdByName.get(entry.name.trim().toLowerCase());
    const shouldRecreate = Boolean(existingDoc && existingDoc.type !== itemData.type);
    if (existingId && shouldRecreate) {
      toDelete.push(existingId);
      toCreate.push(itemData);
    }
    else if (existingId) {
      toUpdate.push({ _id: existingId, ...itemData });
    }
    else {
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
