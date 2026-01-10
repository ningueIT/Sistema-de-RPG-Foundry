/**
 * Macro: criar/atualizar compêndio "Aptidões Amaldiçoadas" e inserir/atualizar itens.
 *
 * Observações do sistema (feiticeiros-e-maldicoes):
 * - Tipos de Item suportados pelo system.json: item/tecnica/arma/aptidao
 * - Então, apesar de você ter pedido type:"feature", aqui salvamos como type:"aptidao".
 * - Para distinguir as "Aptidões Amaldiçoadas" das aptidões antigas, marcamos system.tipo.value = "aptidao".
 */

(async () => {
  const PACK_LABEL = "Habilidades Amaldiçoadas";
  const PACK_NAME = "habilidades-amaldicoadas"; // nome interno (world)
  // Pacote alvo: use o ID do sistema para criar o compêndio dentro do sistema
  // (ex.: custom system builder define packs no system.json). Altere se
  // preferir criar no World (use "world").
  const PACK_PACKAGE = "feiticeiros-e-maldicoes";

  // Execução deve ser feita por um GM para criar pastas/itens no World
  if (!game.user?.isGM) {
    ui.notifications.error("Execute este macro como GM para permitir criação de pastas/itens no World.");
    console.warn("Macro importar-aptidoes-amaldicoadas: requere GM para criar pastas/itens.");
    return;
  }

  // 1) JSON base (sem descrições)
  // Este array foi montado a partir do texto que você enviou.
  const APTIDOES = [
    // --- Habilidades de 2º nível (limpas e bem-formadas) ---
    {
      name: "Aparar Ataque",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "1 PE",
        ativacao: "Reação",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Você rebate um ataque com outro ataque, assim conseguindo aparar um golpe. Quando for alvo de um ataque corpo a corpo, você pode gastar 1 PE e sua reação para realizar uma jogada de ataque contra o atacante. Caso seu teste supere o do inimigo, você evita o ataque.`
    },
    {
      name: "Aparar Projéteis",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "1 PE",
        ativacao: "Reação",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Utilizando de sua agilidade e reflexos, você consegue tentar aparar projéteis em sua direção, reduzindo o dano deles. Quando receber um ataque à distância, você pode gastar 1 PE e sua reação para tentar aparar o projétil, reduzindo o dano recebido em 2d6 + modificador de atributo-chave + bônus de treinamento.`
    },
    {
      name: "Ataque Inconsequente",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "",
        duracao: "1 rodada"
      },
      description: `Você baixa a guarda para atacar de maneira inconsequente, aumentando seu potencial de dano. Uma vez por rodada, ao realizar um ataque, você pode escolher receber vantagem na jogada de ataque e +5 na rolagem de dano dele. Porém, ao realizar um ataque inconsequente, você fica Desprevenido por 1 rodada.`
    },
    {
      name: "Caminho da Mão Vazia",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Mesmo diante a possibilidade de brandir armas marciais, você decide se ater as mãos vazias e se aperfeiçoar nesse caminho. Todo ataque desarmado que você realizar causa dano adicional igual ao seu bônus de treinamento e você soma metade do seu bônus de treinamento em jogadas de ataque desarmados.`
    },
    {
      name: "Complementação Marcial",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Suas habilidades marciais complementam certas manobras, deixando-as mais eficientes. Enquanto estiver desarmado ou empunhando uma arma marcial, você recebe um bônus de +2 em testes para Desarmar, Derrubar ou Empurrar, assim como para resistir a esses efeitos.`
    },
    {
      name: "Esquiva Rápida",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Ação Bônus",
        requisitos: "",
        duracao: "Até o começo do seu próximo turno"
      },
      description: `Com agilidade, você se prepara para esquivar de ataques. Como uma Ação Bônus, realize um teste de Acrobacia contra a Atenção de um inimigo dentro do seu alcance corpo a corpo. Caso suceda no teste, o alvo recebe metade do seu modificador de Destreza como penalidade em jogadas de ataque feitas contra você até o começo do seu próximo turno.`
    },
    {
      name: "Finta Melhorada",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você desenvolva sua finta para que se torne mais eficiente e se adaptar ao seu corpo. Você pode optar por utilizar Destreza ao invés de Presença em testes de Enganação para fintar. Além disso, acertar um inimigo desprevenido pela sua finta causa um dado de dano adicional.`
    },
    // (os demais níveis e entradas continuam abaixo...)

    // --- Habilidades de 4º nível ---
    {
      name: "Ação Ágil",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "2 PE",
        ativacao: "Especial",
        requisitos: "",
        duracao: "1 rodada"
      },
      description: `Uma vez por rodada, você pode gastar 2 PE para receber uma Ação Ágil, que pode ser usada para Andar, Desengajar ou Esconder.`
    },
    {
      name: "Acrobata",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Ao invés da força, você usa a agilidade para poder saltar. Você passa a utilizar Destreza como atributo para calcular sua distância de pulo, assim como pode utilizar Acrobacia no lugar de Atletismo em testes para aumentar a sua distância de salto.`
    },
    {
      name: "Atacar e Recuar",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "1 PE",
        ativacao: "Especial",
        requisitos: "Esquiva Rápida",
        duracao: "Instantâneo"
      },
      description: `Uma vez por turno, quando acertar uma criatura com um ataque, você pode gastar 1 PE para se mover até 4,5 metros para longe da criatura acertada. Este movimento não causa ataques de oportunidade.`
    },
    {
      name: "Brutalidade",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "2 PE (+2 PE em níveis 8/12/16/20 para aumentar bônus)",
        ativacao: "Ação Livre",
        requisitos: "",
        duracao: "Sustentada (condicional)"
      },
      description: `Como uma Ação Livre, você pode gastar 2 PE para entrar no estado de Brutalidade: enquanto nele, você recebe +2 em jogadas de ataque corpo a corpo e dano. Não pode manter concentração nem usar Feitiços ou Técnicas de Estilo enquanto estiver em Brutalidade. A Brutalidade termina no fim do seu turno se você não atacar ninguém ou se a encerrar como Ação Livre. Em níveis superiores você pode gastar PE adicionais para aumentar o bônus.`
    },
    {
      name: "Defesa Marcial",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Complementação Marcial",
        duracao: "Enquanto desarmado/arma marcial"
      },
      description: `Enquanto estiver desarmado ou empunhando uma arma marcial, você soma 1 + metade do seu Bônus de Treinamento à sua Defesa.`
    },
    {
      name: "Devolver Projéteis",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Aparar Projéteis",
        duracao: "Permanente"
      },
      description: `O dado de Aparar Projéteis se torna 3d10 e soma também o seu Nível de Lutador. Se o dano reduzir-se a zero ou negativo, você pode devolver o projétil como parte da reação, causando ao atacante o dano que ele teria causado.`
    },
    {
      name: "Fluxo",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `A cada nível de empolgação que você subir, você recebe +1 em rolagens de dano e, no começo de cada rodada, recebe 4 pontos de vida temporários para cada nível de empolgação acima do primeiro.`
    },
    {
      name: "Fúria da Vingança",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "",
        duracao: "1 rodada"
      },
      description: `Ao ver um aliado cair a 0 PV, você recebe benefícios por uma rodada: seus ataques causam +4 de dano; sua Defesa aumenta em +2; recebe +2 em TRs de Fortitude e Vontade. Benefícios aplicam-se apenas contra o inimigo alvo da vingança e criaturas que tentem impedi-lo.`
    },
    {
      name: "Imprudência Motivadora",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial (início de combate)",
        requisitos: "",
        duracao: "Cena/Missão (condicional)"
      },
      description: `Ao iniciar uma cena de combate, você pode escolher lutar com uma restrição autoimposta; se vencer o combate com a restrição, recupera uma quantidade de PE igual ao seu nível, recebe +2 em rolagens de ataque e tem sua margem de crítico reduzida em 1 até o fim da missão atual.`
    },
    {
      name: "Músculos Desenvolvidos",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Ao obter esta habilidade, você pode somar seu Modificador de Força ao invés de Destreza na sua Defesa.`
    },
    {
      name: "Redirecionar Força",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "2 PE",
        ativacao: "Reação",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Quando um inimigo errar um ataque corpo a corpo contra você, você pode gastar 2 PE e sua reação para tentar redirecionar o ataque para outra criatura dentro do alcance; se bem-sucedido, o ataque atinge o novo alvo.`
    },
    {
      name: "Segura pra Mim",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "3 PE",
        ativacao: "Reação",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Quando for alvo de um ataque corpo a corpo ou habilidade com alvo único, você pode gastar 3 PE para tentar colocar uma criatura que esteja agarrando na frente; se bem-sucedido, a criatura recebe o efeito no lugar e você para de agarrar a criatura.`
    },
    {
      name: "Sobrevivente",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Constituição 16",
        duracao: "Permanente"
      },
      description: `Enquanto estiver com menos da metade dos seus pontos de vida máximos, no começo do seu turno você recupera 1d6 + seu modificador de Constituição em PV. Nos níveis 8, 12, 16 e 20 essa cura aumenta em 1d6.`
    },
    {
      name: "Voadora",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "3 PE",
        ativacao: "Especial (Investida)",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Ao realizar uma Investida desarmado, você pode gastar 3 PE para realizar uma Voadora; causa 1d8 de dano adicional para cada 3 metros de deslocamento até o alvo, limitado pelo seu modificador de Força ou Destreza.`
    },

    // --- Habilidades de 6º nível ---
    {
      name: "Aprimoramento Marcial",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você aprimora suas habilidades marciais para deixar mais difícil resistir as suas técnicas de Lutador. Você passa a somar metade do seu Bônus de Treinamento em sua CD de Especialização.`
    },
    {
      name: "Ataque Extra",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "2 PE",
        ativacao: "Especial (Ação Atacar)",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Você consegue atacar mais rápido, otimizando seus golpes. Ao realizar a ação Atacar, você pode gastar 2 PE para atacar duas vezes ao invés de uma.`
    },
    {
      name: "Brutalidade Sanguinária",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Brutalidade",
        duracao: "Enquanto em Brutalidade"
      },
      description: `Em meio a brutalidade, o sangue pode o renovar. Enquanto no estado de Brutalidade, sempre que tiver um acerto crítico ou reduzir a vida de uma criatura a 0 ou menos, você aumenta o nível de dano dos seus ataques corpo a corpo em 1, acumulando até um limite igual ao seu bônus de treinamento. Esse aumento dura enquanto permanecer com o estado de Brutalidade ativo. [Pré-Requisito: Brutalidade]`
    },
    {
      name: "Corpo Calejado",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `De tanto combater e receber golpes, todo seu corpo já está calejado e mais resistente. Você passa a adicionar metade do seu Modificador de Constituição na sua Defesa e recebe pontos de vida adicionais igual ao seu nível de Lutador.`
    },
    {
      name: "Eliminar e Continuar",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Eliminar um inimigo e o ver cair serve apenas como um incentivo para continuar. Sempre que um inimigo ao qual você causou dano cair ou morrer dentro de 9 metros, você recebe 2d6 + nível de personagem + modificador de atributo-chave em PV temporários, os quais acumulam. No nível 8, o valor aumenta para 3d6, no nível 12 aumenta para 4d6, no nível 16 aumenta para 4d8 e no nível 20 aumenta para 4d12.`
    },
    {
      name: "Foguete Sem Ré",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "6 PE",
        ativacao: "Ação Completa",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Se dedicando a avançar sem olhar para trás, você consegue usar da sua energia para o impulsionar em uma investida direta. Como uma ação completa, você gasta 6 PE para se mover até uma distância igual ao dobro do seu deslocamento; sempre que passar por uma criatura durante essa investida, ela deve realizar um teste de resistência de Reflexos, sofrendo Xd10 + modificador de Força ou Destreza (onde X é o seu bônus de treinamento) de dano de Impacto e não podendo realizar Ataques de Oportunidade contra você em uma falha. Ao terminar seu movimento adjacente a uma criatura, você pode realizar um ataque contra ela.`
    },
    {
      name: "Golpe da Mão Aberta",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "4 PE",
        ativacao: "Ação Comum",
        requisitos: "",
        duracao: "Até o início do seu próximo turno"
      },
      description: `Você é capaz de realizar um ataque potente, utilizando a palma da mão. Como uma ação comum, você pode gastar 4 PE para realizar um golpe de mão aberta. Você realiza um ataque desarmado contra um alvo dentro do seu alcance corpo a corpo e, em um acerto, ele deve realizar um teste de resistência de Fortitude e, em um fracasso, ele fica Desorientado, Enjoado e Exposto até o início do seu próximo turno. O Golpe da Mão Aberta conta como um ataque desarmado para propósitos de habilidades que apenas funcionam com ataques e você não pode usar ataque extra com esse golpe.`
    },
    {
      name: "Ignorar Dor",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Seu desejo por uma boa luta é constante, permitindo-o até mesmo ignorar parte da dor que seja infligida em você. Você recebe redução de danos contra todos os tipos, menos alma, igual ao seu nível de empolgação atual. Contra danos físicos, a redução de dano é dobrada.`
    },
    {
      name: "Manobras Finalizadoras",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Após toda uma sequência empolgante, você sabe exatamente como finalizar o seu combo com uma manobra ainda mais impactante. Você libera acesso a novas manobras, listadas no final da especialização. Ao realizar um ataque, você pode realizar uma Manobra Finalizadora.`
    },
    {
      name: "Poder Corporal",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Caminho da Mão Vazia",
        duracao: "Permanente"
      },
      description: `Cultivando e priorizando seu próprio corpo, você expande o poder dele. O dano de seus ataques desarmados aumenta em 2 níveis e, uma vez por rodada, ao realizar um ataque desarmado, você pode escolher realizar uma Manobra como parte do ataque, aplicando seu efeito juntamente do dano. [Pré-Requisito: Caminho da Mão Vazia]`
    },
    {
      name: "Potência Superior",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Complementação Marcial",
        duracao: "Permanente"
      },
      description: `A potência que você consegue colocar em suas manobras se torna superior. Quando Derrubar um inimigo com sucesso, ele também recebe 2d6 + seu modificador de Força de dano de impacto; quando Empurrar um inimigo, a distância padrão se torna 4,5 metros ao invés de 1,5 metros. [PréRequisito: Complementação Marcial]`
    },
    {
      name: "Sequência Inconsequente",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Ataque Inconsequente",
        duracao: "Permanente"
      },
      description: `Não se limitando a apenas um ataque, você assume uma postura inconsequente durante todo seu período de atacar. Quando utilizar Ataque Inconsequente, você passa a receber o dano adicional em todos seus ataques realizados durante o turno. [Pré-Requisito: Ataque Inconsequente]`
    },
    {
      name: "Um Com a Arma",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "Dedicação em Arma",
        duracao: "Instantâneo"
      },
      description: `Você começa a se tornar apenas um com as armas para as quais se dedicou. Uma quantidade de vezes igual a metade do seu nível de Lutador, por descanso curto, suas armas dedicadas conseguem superar resistência ao tipo de dano delas em um ataque. Caso erre o ataque, o uso não é consumido. Uma vez por rodada, ao ser desarmado de uma das suas armas dedicadas, você pode utilizar sua reação para evitar, mantendo-se em posse da arma. [Pré-Requisito: Dedicação em Arma]`
    },

    // --- Habilidades de 8º nível ---
    {
      name: "Aptidões de Luta",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você aprimora suas aptidões de energia necessárias para a luta. Ao obter esta habilidade, você pode aumentar o seu nível de aptidão em Aura ou Controle e Leitura em 1. Você pode pegar esta habilidade duas vezes, uma para cada aptidão.`
    },
    {
      name: "Ataques Ressoantes",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "2 energia amaldiçoada",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `O impacto dos seus ataques ressoa e atinge outros inimigos próximos do seu alvo. Ao realizar um ataque contra um inimigo, você pode gastar 2 pontos de energia amaldiçoada para que todos os inimigos adjacentes ao alvo, com a Defesa inferior ao resultado do seu ataque, recebam dano igual a metade do dano causado no alvo.`
    },
    {
      name: "Brutalidade Aprimorada",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Brutalidade",
        duracao: "Permanente"
      },
      description: `Aprimorando no fluxo que você impõe no seu corpo, ele te deixa ainda mais resistente. Ao entrar no estado de brutalidade, você recebe uma quantidade de pontos de vida temporários igual ao seu nível + modificador do atributo para CD de Especialização. O bônus inicial em dano se torna +4 e o aumento no dano por ponto de energia adicional gasto se torna +2. [Pré-Requisito: Brutalidade]`
    },
    {
      name: "Feitiço e Punho",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "2 PE",
        ativacao: "Especial",
        requisitos: "Mãos Amaldiçoadas",
        duracao: "Instantâneo"
      },
      description: `Com precisão, você consegue agir rapidamente para utilizar do jujutsu e complementar com seu corpo. Uma vez por rodada, quando utilizar um Feitiço de dano com alvo único, você pode gastar 2PE para realizar um ataque corpo a corpo contra o mesmo alvo, desde que ele esteja dentro do seu alcance. [Pré-Requisito: Mãos Amaldiçoadas]`
    },
    {
      name: "Golpear Brecha",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "2 PE adicionais",
        ativacao: "Reação",
        requisitos: "Aparar Ataque",
        duracao: "Instantâneo"
      },
      description: `Você consegue aproveitar de um golpe aparado para atacar a brecha que se abre na defesa do inimigo. Quando utilizar Aparar Ataque e conseguir aparar com sucesso, você pode gastar 2PE adicionais para realizar um ataque contra o inimigo como parte da reação. [Pré-Requisito: Aparar Ataque]`
    },
    {
      name: "Oportunista",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "2 PE",
        ativacao: "Reação",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Você sabe aproveitar bem brechas na defesa dos inimigos. Uma vez por rodada, quando um inimigo dentro do seu alcance corpo a corpo é atingido por um ataque de uma criatura o flanqueando, você pode gastar 2 PE para fazer um ataque corpo a corpo contra a criatura.`
    },
    {
      name: "Pancada Desnorteante",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Até o início do seu próximo turno"
      },
      description: `Uma boa pancada deixa qualquer um despreparado para o que vem a seguir. Quando conseguir um acerto crítico em um ataque corpo a corpo, você pode fazer com que o alvo do ataque receba desvantagem contra um TR à sua escolha, até o início do seu próximo turno.`
    },
    {
      name: "Punhos Letais",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Poder Corporal",
        duracao: "Permanente"
      },
      description: `Não há necessidade de armas se o seu corpo já é a mais letal entre elas. Enquanto estiver desarmado, sua margem de crítico diminui em 1 e seus ataques ignoram RD igual ao seu bônus de treinamento. [PréRequisito: Poder Corporal]`
    },

    // --- Habilidades de 10º nível ---
    {
      name: "Alma Quieta",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Treinado em Vontade",
        duracao: "Permanente"
      },
      description: `Você recebe vantagem para resistir às condições Caído e Exposto (Pré-Requisito: Treinado em Fortitude).`
    },
    {
      name: "Corpo Sincronizado",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Treinado em Fortitude",
        duracao: "Permanente"
      },
      description: `Seu corpo está sempre em sincronia. Você recebe vantagem para resistir às seguintes condições: Caído e Exposto. [Pré-Requisito: Treinado em Fortitude]`
    },
    {
      name: "Empolgar-se",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Em certos momentos, a própria antecipação que você guarda para uma luta pode se transformar na empolgação necessária. Uma quantidade de vezes igual ao seu Bônus de treinamento, por descanso longo, você pode escolher subir dois níveis de empolgação, ao invés de um, no começo de um turno em que ele aumentaria.`
    },
    {
      name: "Impacto Demolidor",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Ação Comum",
        requisitos: "Potência Superior",
        duracao: "Instantâneo"
      },
      description: `Você consegue colocar tanta força em um golpe que o alvo se torna uma bola de demolição. Como uma Ação Comum, realize uma jogada de ataque corpo a corpo contra um alvo dentro do seu alcance corpo a corpo e, caso acerte, você causa o dano do ataque e realiza a ação Empurrar como parte dele: a distância total que o alvo será empurrado é dobrada e ele quebra todo objeto ou obstáculos em sua parede, como paredes ou contêiners, recebendo o Dano de Fontes Externas (p.327). Não é possível utilizar Ataque Extra nesta ação. [Pré-Requisito: Potência Superior]`
    },
    {
      name: "Insistência",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "Ignorar Dor",
        duracao: "Instantâneo"
      },
      description: `Deixando o seu desejo se ampliar ainda mais, você se torna um lutador insistente e difícil de derrubar. Uma vez por cena, caso você fosse ter os seus pontos de vida reduzidos a 0, você pode escolher retornar ao nível de empolgação 1 para continuar de pé, curando-se em um valor igual a uma rolagem de dano do seu ataque desarmado. Após usar essa habilidade, até que realize um descanso longo, o seu nível máximo de empolgação abaixa em 1. [Pré-Requisito: Ignorar Dor]`
    },
    {
      name: "Mente em Paz",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Treinado em Astúcia",
        duracao: "Permanente"
      },
      description: `Sua mente continua em paz mesmo durante o combate. Você recebe vantagem para resistir às seguintes condições Amedrontado, Atordoado e Confuso. [Pré-Requisito: Treinado em Astúcia]`
    },

    // --- Habilidades de 12º nível ---
    {
      name: "Armas Absolutas",
      nivel: 12,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "2 PE (+2 PE por rodada para manter)",
        ativacao: "Especial",
        requisitos: "Um Com a Arma",
        duracao: "Sustentada (rodadas)"
      },
      description: `Sua dominância com as Armas Dedicadas chega ao ápice, tornando-as uma parte íntegra de si mesmo. Enquanto estiver empunhando uma Arma Dedicada, você pode gastar 2PE para receber os seguintes bônus por uma rodada: você escolhe aumentar sua Defesa em 3 ou receber +3 em Jogadas de Ataque e, uma vez por ataque, ao errar com uma arma dedicada, você pode rolar novamente o ataque, ficando com o melhor resultado. Para cada rodada após a primeira, você deve gastar mais 2PE para manter, ou os bônus se encerram. [Pré-Requisito: Um Com a Arma]`
    },
    {
      name: "Corpo Arsenal",
      nivel: 12,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Punhos Letais",
        duracao: "Permanente"
      },
      description: `Você se torna plenamente consciente do complexo arsenal que o seu corpo é, podendo o utilizar ofensivamente de diferentes maneiras. Quando realizar um acerto crítico com um ataque desarmado, você pode optar por infligir o efeito de um grupo adicional entre Bastão, Haste ou Martelo. [Pré-Requisito: Punhos Letais]`
    },

    // --- Habilidades de 16º nível ---
    {
      name: "Seja Água",
      nivel: 16,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Não se colocando dentro de uma única forma, você aprende a se mover como a água, adaptando-se e não se prendendo. Seu Deslocamento aumenta em 3 metros, você ignora terreno difícil por fontes físicas (como detritos ou solo destruído) e, uma vez por rodada, pode evitar ser agarrado sem a necessidade de teste.`
    },
    {
      name: "Tempestade Sufocante",
      nivel: 16,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Até o começo do próximo turno do alvo"
      },
      description: `Seus golpes marciais são tão rápidos e potentes que se tornam uma tempestade que sufoca e destrói a guarda dos inimigos. Para cada ataque corpo a corpo desarmado ou com arma marcial que você acertar em um mesmo alvo, ele recebe -1 na Defesa e em Testes de Resistência realizados contra você, acumulando até um máximo igual ao seu bônus de treinamento. O prejuízo dura até o começo do próximo turno da criatura afetada.`
    },
    {
      name: "Corpo Supremo",
      nivel: 16,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você alcançou um alto nível como lutador e levou seu corpo ao limite. Você recebe mais 3 metros de movimento adicionais, +4 na sua Defesa e redução de dano igual a metade do seu nível de personagem contra dano cortante, perfurante e de impacto, além de mais um tipo à sua escolha, exceto alma. Contra os outros tipos de dano não escolhidos, a redução de dano é igual a 1/4 do seu nível.`
    },

    // --- Portões da morte (nome duplicado no texto: desambiguado) ---
    {
      name: "Duro na Queda (Portões da Morte)",
      nivel: 0,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "1 falha garantida",
        ativacao: "Especial",
        requisitos: "Treinado em Vontade",
        duracao: "Instantâneo"
      },
      description: `Quando estiver nas portas da morte, você pode escolher receber uma falha garantida para fazer um teste de Vontade contra a CD X, sendo X igual a 15 + 1 para cada 3 pontos de vida negativos. Se passar, você levanta com 1 de vida e recebe 1 ponto de exaustão. [Pré-Requisito: Treinado em Vontade]`
    },

    // --- Manobras Finalizadoras (entradas adicionais) ---
    {
      name: "Manobra Finalizadora: Ataque Circular",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "Manobras Finalizadoras; Empolgação 5",
        duracao: "Instantâneo"
      },
      description: `Você usa de agilidade para desferir um golpe circular, capaz de atingir vários alvos. Durante esta manobra, seu alcance corpo a corpo aumenta em 3 metros e você realiza um ataque contra todos os inimigos dentro do seu alcance corpo a corpo. Para cada inimigo que seja um alvo, esta manobra causa 5 de dano adicional.`
    },
    {
      name: "Manobra Finalizadora: Golpe Certeiro",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "Manobras Finalizadoras; Empolgação 5",
        duracao: "Instantâneo"
      },
      description: `Você deve declarar que está utilizando esta Manobra antes da jogada de ataque. Sua próxima jogada de ataque automaticamente tem o seu resultado tratado como 10 acima do resultado original (10 no dado vira 20, por exemplo).`
    },
    {
      name: "Manobra Finalizadora: Quebra Crânio",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Lutador",
        custo: "",
        ativacao: "Especial",
        requisitos: "Manobras Finalizadoras; Empolgação 5",
        duracao: "Até o começo do seu próximo turno"
      },
      description: `Você ataca com toda potência possível, canalizando a empolgação em um golpe avassalador. Seu próximo ataque causa 2d10 de dano adicional. O alvo desta manobra deve realizar um teste de resistência de Fortitude com CD aumentada em 5, ficando Atordoado até o começo do seu próximo turno em uma falha.`
    },
    {
      name: "Arremessos Potentes",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você se torna capaz de arremessar armas com mais potência. Seus ataques com armas de arremesso contam como um nível de dano acima. Além disso, no começo do seu turno, você pode gastar 1PE para fazer com que seus ataques com armas de arremesso ignorem RD igual ao seu bônus de treinamento.`
    },
    {
      name: "Arsenal Cíclico",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Ao invés de se limitar a uma única arma, você mantém uma ciclagem do seu arsenal para golpear com eficiência. Uma vez por rodada, você pode sacar ou trocar um item com uma ação livre. Ao realizar um golpe com um grupo de armas e trocar para outra arma de outro grupo na mesma rodada ou na próxima, você recebe +1d até o fim do seu próximo turno com a arma trocada.`
    },
    {
      name: "Assumir Postura",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `A postura que uma pessoa mantém em combate molda suas capacidades, fornecendo grandes benefícios. Ao obter esta habilidade, você recebe acesso às posturas, explicadas e listadas no final da especialização.`
    },
    {
      name: "Disparos Sincronizados",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Especial",
        requisitos: "Duplo Empunhamento a distância",
        duracao: "Instantâneo"
      },
      description: `Você consegue sincronizar seus disparos e tiros, fazendo-os parecer um só. Caso esteja manejando duas armas a distância ou de fogo, você pode usar suas ações de ataque juntas para tentar sincronizar os dois tiros. Realize os dois ataques e, caso ambos acertem, você combina o dano em uma única instância, depois adicionando efeitos aplicáveis para ambas as armas, além de aplicar resistências ou fraquezas apenas uma vez.`
    },
    {
      name: "Escudeiro Agressivo",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 energia amaldiçoada",
        ativacao: "Especial",
        requisitos: "Empunhando escudo",
        duracao: "Instantâneo"
      },
      description: `Seu uso do escudo é não só defensivo, mas também agressivo. Uma vez por rodada, ao realizar uma ação de ataque e estiver empunhando um escudo, você pode gastar 1 ponto de energia amaldiçoada para fazer um ataque adicional com o escudo.`
    },
    {
      name: "Extensão do Corpo",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Suas armas são praticamente extensões do seu próprio corpo. Seu alcance em ataques com armas corpo a corpo aumenta em 1,5 metros e você recebe um bônus de +2 em jogadas de ataque e em testes para evitar ser desarmado.`
    },
    {
      name: "Flanqueador Superior",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você sabe perfeitamente como manter um flanco perigoso. Enquanto estiver flanqueando uma criatura, a criatura flanqueada recebe -2 em testes de resistência.`
    },
    {
      name: "Golpe Falso",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Reação",
        requisitos: "Ally attack in range",
        duracao: "Instantâneo"
      },
      description: `Você é capaz de fingir desferir um golpe, distraindo seus inimigos para auxiliar aliados. Como reação a um aliado atacando um inimigo dentro do seu alcance de ataque, você realiza o golpe falso. O inimigo deve realizar um TR de Astúcia e, caso falhe, o seu aliado recebe vantagem no teste de ataque.`
    },
    {
      name: "Golpes Potentes",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Treinado em arma",
        duracao: "Permanente"
      },
      description: `Seus golpes se tornam inatamente mais potentes, sendo capaz de manejar armas extraindo seu máximo. Sempre que você estiver usando uma arma com a qual você seja treinado o dano dela aumenta em um nível e suas rolagens de dano recebem um bônus de +2.`
    },
    {
      name: "Indomável",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 energia amaldiçoada",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Em combate, você não se deixa render, resistindo ao que vier. Uma quantidade de vezes por descanso curto ou longo igual a metade do seu nível de personagem, você pode gastar 1 ponto de energia amaldiçoada para rolar novamente um teste de resistência em que você falhar, ficando com o melhor resultado.`
    },
    {
      name: "Pistoleiro Iniciado",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Atirando com volatilidade, você consegue impor mais poder nas suas armas em troca de um risco maior. Quando for realizar um ataque com uma arma de fogo, antes da jogada de ataque, você pode escolher aumentar a margem de Emperrar em 2 e, em troca, você causa 1 dado de dano adicional caso acerte.`
    },
    {
      name: "Posicionamento Ameaçador",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você sabe se posicionar de maneira estratégica, fazendo com que um inimigo que possa o ver te reconheça como uma constante ameaça, mesmo distante. A menos que esteja furtivo, você pode conceder os benefícios de Flanco para aliados, mesmo utilizando armas a distância ou de fogo, desde que o alvo do flanco esteja dentro do primeiro alcance da sua arma.`
    },
    {
      name: "Precisão Definitiva",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 energia amaldiçoada",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Você se torna capaz de canalizar a energia amaldiçoada na sua arma de maneira a alcançar uma precisão definitiva, seja para acertar ou para destruir. Quando faz um ataque, você pode gastar 1 ponto de energia amaldiçoada para receber +2 na rolagem para acertar. A cada quatro níveis, você pode gastar 1 ponto a mais para aumentar o bônus em +2. Você também pode optar por adicionar esse bônus na rolagem de dano ao invés da de acerto, com um bônus de +4 ao invés de +2.`
    },
    {
      name: "Presença Suprimida",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `A furtividade e discrição podem ser essenciais em um combate, para se mover de maneira apropriada. Você recebe um bônus de +2 em rolagens de Furtividade. Sua penalidade em furtividade por atacar e fazer outras ações chamativas é reduzida para -5.`
    },
    {
      name: "Revigorar",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Ação Bônus",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Diante o quão extenso e cansativo um combate pode ser, você é capaz de focar e recuperar seu vigor. Uma quantidade de vezes igual ao seu bônus de treinamento você pode usar sua ação bônus para se curar em um valor igual a 1d10 + o dobro do seu modificador de Constituição + bônus de treinamento, aumentando em um dado a cada 4 níveis. Você recupera todos os usos em um descanso longo ou metade em um descanso curto.`
    },
    {
      name: "Tiro Falso",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Reação",
        requisitos: "Arma à distância",
        duracao: "Instantâneo"
      },
      description: `Você consegue fingir falsos disparos, distraindo um inimigo. Como reação a um aliado atacando um inimigo dentro do seu alcance de ataque, caso esteja manejando uma arma a distância ou de fogo, você realiza um tiro falso, fingindo que dispararia. O inimigo deve realizar um TR de Astúcia e, caso falhe, o seu aliado recebe vantagem no teste de ataque.`
    },
    {
      name: "Zona de Risco",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "2 energia amaldiçoada",
        ativacao: "Especial",
        requisitos: "Arma corpo-a-corpo Estendida",
        duracao: "Instantâneo"
      },
      description: `Ter uma arma com o alcance maior o permite criar uma efetiva zona de risco. Uma vez por rodada, se estiver empunhando uma arma corpo-a-corpo com a propriedade Estendida e um inimigo entrar no seu alcance de ataque, você pode gastar 2 pontos de energia amaldiçoada para realizar um ataque contra ele.`
    },

    // --- Habilidades de 4º nível (Especialista em Combate) ---
    {
      name: "Aprender Postura",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Assumir Postura",
        duracao: "Permanente"
      },
      description: `Você continua seu estudo sobre as posturas utilizadas em combate, expandindo seu repertório. Você aprende uma postura adicional à sua escolha. No 10° nível você aprende outra postura. [Pré-Requisito: Assumir Postura]`
    },
    {
      name: "Armas Escolhidas",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Um tipo de arma ressoa de maneira única com você, e ela foi escolhida como seu caminho. Escolha um grupo de arma: seus ataques com armas dele têm o nível de dano aumentado em 3.`
    },
    {
      name: "Arremesso Rápido",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 PE",
        ativacao: "Especial",
        requisitos: "Arma de arremesso",
        duracao: "Instantâneo"
      },
      description: `Utilizando de armas leves e menores, você consegue as arremessar com velocidade. Uma vez por rodada, ao realizar um ataque com uma arma de arremesso, você pode gastar 1PE para realizar um ataque com arma de arremesso contra outro alvo. Você arremessa outra arma ou a mesma arma utilizada antes, desde que ela possua a propriedade Retorno.`
    },
    {
      name: "Técnicas de Avanço",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `As técnicas de avanço envolvem a mistura do deslocamento com os golpes. Ao obter esta habilidade, você aprende duas artes de combate de avanço, listadas no final da especialização.`
    },
    {
      name: "Buscar Oportunidade",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Ação Livre",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Você sabe como encontrar a oportunidade certa para fazer o que é necessário. Como uma Ação Livre, realize um teste de Percepção com CD 16 + 2 para cada inimigo em campo. Caso suceda no teste, você pode utilizar Andar, Desengajar ou Esconder como Ação Livre.`
    },
    {
      name: "Compensar Erro",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "PE (até Bônus de Treinamento)",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Você se torna habilidoso o suficiente para compensar erros com a liberação bruta de energia. Uma vez por rodada, quando errar um ataque com uma arma corpo a corpo, você pode gastar até uma quantidade de PE igual ao seu bônus de treinamento para causar dano no alvo do ataque. Para cada ponto gasto, o alvo recebe 1d10 de dano Energético com o seu modificador de Força, Destreza ou Sabedoria sendo somado ao total.`
    },
    {
      name: "Especialista em Escudo",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Empunhando escudo",
        duracao: "Permanente"
      },
      description: `Você se especializa completamente na defesa e no uso de escudos. Você passa a somar o aumento base em RD do seu escudo em testes de resistência de Reflexos e Fortitude.`
    },
    {
      name: "Espírito de Luta",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 PE",
        ativacao: "Ação Livre",
        requisitos: "",
        duracao: "Cena"
      },
      description: `O combate é um caminho, no qual você nutre um espírito intenso para lutar. Como uma Ação Livre, você pode gastar 1PE para receber um bônus de +2 em jogadas de ataque até o fim da cena. Além disso, ao utilizar esta habilidade, você ganha PV temporários igual ao seu nível de personagem.`
    },
    {
      name: "Grupo Favorito",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você descobre como utilizar melhor um certo tipo de armas. Escolha um grupo de armas: você recebe acesso ao efeito de crítico do grupo enquanto manejando uma arma que pertença a ele.`
    },
    {
      name: "Guarda Estudada",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Sua guarda surge a partir do estudo e da reflexão. Você passa a somar metade do seu modificador de Sabedoria na sua Defesa, limitado pelo seu nível. Além disso, você pode escolher um Teste de Resistência para receber um bônus de +2.`
    },
    {
      name: "Mente Oculta",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você treinou sua mente para se ocultar, aguçando-a para encontrar os lugares certos. Você passa a adicionar também o seu bônus de Sabedoria em rolagens de Furtividade.`
    },
    {
      name: "Preparo Imediato",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "Pontos de Preparo",
        ativacao: "Durante Iniciativa",
        requisitos: "",
        duracao: "Variável"
      },
      description: `Utilizando do seu preparo, você consegue rapidamente se colocar pronto para agir. Durante uma rolagem de iniciativa, você pode gastar 3 pontos de preparo para utilizar Preparar, mas apenas para uma ação bônus. A partir do 10° nível, você pode optar por gastar 7 pontos de preparo para preparar uma ação comum.`
    },
    {
      name: "Recarga Rápida",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você se treinou e preparou para conseguir recarregar rapidamente. O custo em ações para recarregar armas à distância que você empunhar diminui em um nível; custo de ação comum se torna ação bônus e ação bônus se torna ação livre.`
    },
    {
      name: "Uso Rápido",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 PE",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Para ter mais versatilidade e acessibilidade ao seu inventário de ferramentas, você agiliza o uso delas. Ao utilizar uma ação para usar um item, você pode pagar 1 ponto de energia para usar um item adicional.`
    },
    
    // --- Habilidades de 6º nível (Especialista em Combate) ---
    {
      name: "Acervo Amplo",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Seu acervo para o combate é amplo, conseguindo internalizar e manifestar qualquer estilo que desejar. Ao obter esta habilidade, você aprende mais um Estilo de Combate. Após meditar por 1 hora, você pode trocar quais estilos de combate você possui.`
    },
    {
      name: "Aprimoramento Especializado",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você aprimora suas habilidades de combate para deixar mais difícil resistir as suas técnicas de Especialista em Combate. Você passa a somar metade do modificador do seu atributo chave em sua CD de Especialização.`
    },
    {
      name: "Ataque Extra",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "2 PE",
        ativacao: "Especial (Ação Atacar)",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Você consegue atacar mais rápido, otimizando seus golpes. Ao realizar a ação Atacar, você pode gastar 2 PE para atacar duas vezes ao invés de uma.`
    },
    {
      name: "Crítico Melhorado",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você aguça o seu olhar para tornar mais fácil encaixar um golpe certeiro. A margem do seu acerto crítico reduz em um número.`
    },
    {
      name: "Crítico Potente",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Acertar um golpe certeiro é realmente devastador para você. Ao acertar um ataque crítico, ele causa 1 dado de dano adicional.`
    },
    {
      name: "Feitiçaria Implementada",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "2 PE",
        ativacao: "Especial",
        requisitos: "Treinado em Feitiçaria",
        duracao: "Instantâneo"
      },
      description: `O jujutsu é um recurso indispensável, o qual você implementa no seu combate. Uma vez por rodada, quando utilizar um Feitiço de dano, você pode gastar 2PE para realizar um ataque contra uma criatura que tenha sido afetada por ela, como Ação Livre. [Pré-Requisito: Treinado em Feitiçaria]`
    },
    {
      name: "Fluxo Perfeito",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Em certos momentos, o fluxo do combate é perfeito em sua mente. Caso você acerte todos os seus ataques no turno, no seu próximo turno você ganha 1 ponto de energia amaldiçoada temporária. No 12° nível, esse valor se torna 2.`
    },
    {
      name: "Olhos de Águia",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 PE",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Seu olhar é afiado e preciso como o de uma águia, permitindo-o mirar mais rapidamente. Você pode gastar 1 PE para usar Mirar como uma ação livre.`
    },
    {
      name: "Manejo Especial",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `A maneira a qual você maneja suas armas é única, feita com maestria inerente ao portador. Você pode escolher uma propriedade de ferramenta amaldiçoada para ser aplicada em toda arma que você estiver manejando, se possível.`
    },
    {
      name: "Marcar Inimigo",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 PE",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Até o fim do turno do usuário"
      },
      description: `Após um golpe, você marca um inimigo como seu no campo de batalha, impedindo-o de atacar e retaliando tentativas de o ignorar. Quando acertar uma criatura com um ataque corpo a corpo, você pode escolher marcá-la até o final do seu próximo turno: enquanto a criatura marcada estiver dentro de 4,5 metros de você, ela recebe -4 em jogadas de ataque e, adicionalmente, caso a criatura marcada cause dano em alguém além de você, você pode gastar 1PE para realizar um ataque como Ação Bônus contra ela no seu próximo turno. Você pode realizar este ataque uma quantidade de vezes igual ao seu modificador de Força, Destreza ou Sabedoria por descanso curto. Caso seja incapacitado, desmaiado ou morto, o efeito da habilidade é cancelado.`
    },
    {
      name: "Mira Destrutiva",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Especial (Mirar)",
        requisitos: "Treinado em Percepção",
        duracao: "Próximo ataque"
      },
      description: `Ao invés de apenas acertar, você é capaz de mirar para destruir completamente, em um disparo difícil, mas recompensador. Quando utilizar a ação Mirar, você pode optar por deixar de receber vantagem para mirar em uma parte específica do corpo: escolha entre Olho, Braço, Perna ou Ferida Interna e, no seu próximo ataque, você recebe -15 na jogada de ataque, mas, caso acerte, o alvo recebe a consequência do membro de acordo com a tabela de Ferimentos Complexos durante uma rodada. [Pré-Requisito: Treinado em Percepção]`
    },
    {
      name: "Preparação Rápida",
      nivel: 6,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Assumir Postura",
        duracao: "Permanente"
      },
      description: `A arte das posturas já está encravada em sua mente, tornando-se algo rápido e imediato. Entrar em uma postura se torna uma Ação Livre e elas não são canceladas caso você seja empurrado. [Pré-Requisito: Assumir Postura]`
    },
    
    // --- Habilidades de 8º nível (Especialista em Combate) ---
    {
      name: "Aptidões de Combate",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você aprimora suas aptidões de energia necessárias para dominar o combate. Ao obter esta habilidade, você pode aumentar o seu nível de aptidão em Aura ou Controle e Leitura em 1. Você pode pegar esta habilidade duas vezes, uma para cada aptidão.`
    },
    {
      name: "Técnicas da Força",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `As técnicas da força permitem uma concentração ainda maior da sua potência e poder. Ao obter esta habilidade, você aprende duas artes de combate da força, listadas no final da especialização.`
    },
    {
      name: "Destruição Dupla",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 PE",
        ativacao: "Passiva/Especial",
        requisitos: "Duplo Empunhamento",
        duracao: "Permanente/Instantâneo"
      },
      description: `Duas armas em mãos, o dobro de destruição para seus inimigos. Enquanto estiver lutando com duas armas de grupos diferentes, seu ataque com a segunda arma causa 1 dado de dano adicional e, caso consiga um acerto crítico, você pode gastar 1PE para aplicar o Efeito Crítico do grupo das duas armas que você maneja ao mesmo tempo, caso sejam de grupos diferentes.`
    },
    {
      name: "Espírito Incansável",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1-2 PE",
        ativacao: "Especial",
        requisitos: "Espírito de Luta",
        duracao: "Cena"
      },
      description: `Nada pode abalar o seu espírito para lutar, o qual se torna ainda mais persistente. Quando utilizar Espírito de Luta, você pode optar por gastar 2PE ao invés de 1, aumentando o bônus em ataques para +5 e fazendo com que os pontos de vida temporários ganhos se tornam o seu bônus de ataque, ao invés do Nível do Personagem, já considerando o bônus da habilidade. [Pré-Requisito: Espírito de Luta]`
    },
    {
      name: "Pistoleiro Avançado",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva/Especial",
        requisitos: "Pistoleiro Iniciado",
        duracao: "Permanente/Variante"
      },
      description: `Suas técnicas como pistoleiro se tornam ainda mais afiadas, conseguindo tomar riscos maiores e encontrar novas oportunidades com as armas. Você pode optar por aumentar o Emperrar em até 6, ao invés de 2, causando 1 dado de dano adicional para cada outros 2 que aumentar. Além disso, caso uma criatura dentro do primeiro alcance da sua arma de fogo tente se mover, você pode gastar sua Reação para realizar um ataque contra ela e, se acertar, ela recebe dano e perde 4,5 metros de movimento até o final do turno dela. [Pré-Requisito: Pistoleiro Iniciado]`
    },
    {
      name: "Ricochete Constante",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "5 PE",
        ativacao: "Especial",
        requisitos: "Arremessos Potentes",
        duracao: "Até o fim do turno"
      },
      description: `Imbuídas com energia, suas armas de arremesso colidem e explodem em energia, ricocheteando para um próximo alvo. Quando for ativar Arremessos Potentes, você pode pagar 5PE ao invés de 1 para que, até o final do turno, seus ataques com armas de arremesso possam acertar uma criatura à sua escolha dentro de 4,5 metros do alvo do ataque, caso sua jogada de ataque supere a Defesa da outra criatura.`
    },
    {
      name: "Sombra Viva",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva/Reação",
        requisitos: "Treinado em Furtividade",
        duracao: "Permanente/Instantâneo"
      },
      description: `Você é como uma sombra, movendo-se rapidamente e de maneira imperceptível. Uma vez por rodada, você pode utilizar Esgueirar e se mover todo o seu movimento, ao invés de apenas metade. Além disso, uma vez por rodada, caso fosse ser encontrado por uma criatura o procurando, você pode utilizar sua Reação para realizar outro teste de Furtividade e, caso o resultado do novo teste supere a Percepção do inimigo o procurando, você continua escondido. [Pré-Requisito: Treinado em Furtividade]`
    },
    {
      name: "Surto de Ação",
      nivel: 8,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "5 energia amaldiçoada",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Em momentos cruciais, você consegue se forçar a agir mais, excedendo suas capacidades normais. Uma quantidade de vezes igual a metade do seu bônus de treinamento, por descanso longo, você pode, uma vez por rodada, gastar 5 pontos de energia amaldiçoada para realizar uma ação comum a mais no seu turno.`
    },

    // --- Habilidades de 10º nível (Especialista em Combate) ---
    {
      name: "Análise Acelerada",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `Você já se acostumou a analisar o campo de batalha como um reflexo ou instinto. Utilizar a ação de Análise se torna uma ação bônus.`
    },
    {
      name: "Armas Perfeitas",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Armas Escolhidas",
        duracao: "Permanente"
      },
      description: `Suas armas escolhidas se tornaram perfeitas, sabendo como contornar fraquezas e defesas. Seus ataques com uma arma do grupo escolhido em Armas Escolhidas ignoram 10 de RD ao tipo de dano dela. [Pré-Requisito: Armas Escolhidas]`
    },
    {
      name: "Assassinar",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Mestre em Furtividade",
        duracao: "Instantâneo"
      },
      description: `Durante a primeira rodada de um combate, ao atacar uma criatura desprevenida a partir da furtividade ou surpresa, seu primeiro ataque é um crítico garantido. [Pré-Requisito: Mestre em Furtividade]`
    },
    {
      name: "Ataque Concentrado",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "PE (variável)",
        ativacao: "Especial",
        requisitos: "Ataque Extra",
        duracao: "Instantâneo"
      },
      description: `Ao utilizar a ação Atacar, você pode gastar PE equivalentes a metade do custo de Ataque Extra e/ou Surto de Ação, até um limite igual ao máximo de vezes que poderia usá-los dentro do seu turno. Para cada vez que o fizer, você adiciona metade dos dados de dano de um ataque (mínimo 1 dado) à rolagem de dano do seu próximo ataque. Ao utilizar esta habilidade, considera-se que Ataque Extra e/ou Surto de Ação foram utilizados, não podendo os realizar novamente no mesmo turno. [Pré-Requisito: Ataque Extra]`
    },
    {
      name: "Chuva de Arremessos",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "PE por ataque",
        ativacao: "Ação Completa",
        requisitos: "Arremessos Potentes, Arremesso Rápido",
        duracao: "Instantâneo"
      },
      description: `Como uma ação completa você pode escolher realizar uma quantidade de ataques com armas de arremesso igual ao seu bônus de treinamento. Para cada ataque após o primeiro, você gasta 1 ponto de energia amaldiçoada e você só pode continuar realizando ataques enquanto ainda tenha armas de arremesso em sua posse. [Pré-Requisito: Arremessos Potentes e Arremesso Rápido]`
    },
    {
      name: "Potência Antes de Cair",
      nivel: 10,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "1 uso (descanso longo)",
        ativacao: "Especial",
        requisitos: "",
        duracao: "Instantâneo"
      },
      description: `Se você for cair para 0 de vida, você pode realizar um turno impedindo o turno atual. Ao ter 0 de vida neste turno, tomar dano resulta em falhas no teste de morte. Quando o turno acaba, você fica inconsciente e recebe um nível de exaustão. Pode ser usada uma vez por descanso longo.`
    },

    // --- Habilidades de 12º nível (Especialista em Combate) ---
    {
      name: "Técnicas de Saque",
      nivel: 12,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "",
        duracao: "Permanente"
      },
      description: `As técnicas de saque permitem que o próprio ato de sacar uma arma se torna destrutivo. Ao obter esta habilidade, você aprende duas artes de combate de saque, listadas no final da especialização.`
    },
    {
      name: "Ciclagem Absoluta",
      nivel: 12,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Arsenal Cíclico",
        duracao: "Permanente"
      },
      description: `O ciclo mantido entre seu arsenal é absoluto, conectando armas diferentes com facilidade. Você passa a poder, durante o seu turno, trocar a arma que esteja manejando toda vez que atacar. Além disso, sempre que trocar para outra arma de outro grupo durante seu turno, você recebe um bônus de +2 na próxima jogada de ataque que realizar. [Pré-Requisito: Arsenal Cíclico]`
    },
    {
      name: "Manejo Único",
      nivel: 12,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "2 PE (por cena)",
        ativacao: "Especial",
        requisitos: "Manejo Especial",
        duracao: "Cena"
      },
      description: `Desenvolvendo ainda mais no seu próprio manejo de armas, você alcança um nível especial. Você escolhe mais uma propriedade para ser aplicada em toda arma que estiver manejando e, no começo de uma cena de combate, pode pagar 2 pontos de energia para receber uma propriedade única durante o resto da cena. Essa propriedade pode tanto ser criada pelo jogador, quanto ser uma das já existentes. [Pré-Requisito: Manejo Especial]`
    },

    // --- Habilidades de 16º nível (Especialista em Combate) ---
    {
      name: "Mestre Pistoleiro",
      nivel: 12,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Pistoleiro Avançado",
        duracao: "Permanente"
      },
      description: `Em suas mãos, as armas podem extrair todo o seu potencial, agora sendo as ferramentas de um mestre. Fazer uma arma emperrada funcionar novamente se torna uma ação de movimento e sua margem de crítico com armas de fogo aumenta em 1. [Pré-Requisito: Pistoleiro Avançado]`
    },
    {
      name: "Sincronia Perfeita",
      nivel: 12,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Extensão do Corpo",
        duracao: "Permanente"
      },
      description: `Você está em perfeita sincronia com suas armas, as quais se tornam uma parte do seu corpo, deixando-o ainda mais livre. O alcance adicional concedido por Extensão do Corpo aumenta para 3 metros e recebe vantagem em testes para evitar ser desarmado. [Pré-Requisito: Extensão do Corpo]`
    },

    // --- Aptidões adicionais ---
    {
      name: "Crítico Aperfeiçoado",
      nivel: 16,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Crítico Melhorado",
        duracao: "Permanente"
      },
      description: `Seu senso de combate se torna ainda mais afiado e letal, encaixando críticos com maior facilidade. A margem do seu acerto crítico reduz em dois números, ao invés de um. [Pré-Requisito: Crítico Melhorado]`
    },
    {
      name: "Mestre da Postura",
      nivel: 16,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Passiva",
        requisitos: "Assumir Postura",
        duracao: "Permanente"
      },
      description: `Você se torna um mestre completo das posturas, dominando-as de uma maneira que poucos são capazes, até mesmo as mesclando. Quando entrar em postura, você pode assumir duas posturas ao mesmo tempo, recebendo os benefícios de ambas. [Pré-Requisito: Assumir Postura]`
    },

    // --- Assumir Postura e Posturas de Combate ---
    {
      name: "Assumir Postura",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "",
        ativacao: "Ação Bônus",
        requisitos: "",
        duracao: "1 minuto / até ser derrubado"
      },
      description: `Ao obter esta habilidade, você aprende uma das oito posturas de combate, às quais influenciam grandemente em suas capacidades.

• Postura do Sol. Enquanto na postura do sol, todos seus ataques recebem +2 para acertar e causam um dado de dano a mais. Entretanto, sua Defesa diminui em 4.

• Postura da Lua. Enquanto na postura da lua, você recebe +3 de Defesa, pode usar Andar ou Desengajar como ação livre e pode, como reação, reduzir um dano que você receber em um valor igual ao seu nível de personagem. Entretanto, todos seus ataques recebem -4 para acertar e não recebem seu bônus de atributo no dano.

• Postura da Terra. Enquanto na postura da terra você não pode ser movido a força, soma seu bônus de treinamento em rolagens de Fortitude e, no começo do seu turno, recebe pontos de vida temporários iguais ao seu nível de personagem.

• Postura do Dragão. Enquanto na postura do dragão, sempre que realizar um ataque, todo inimigo dentro de 1,5 metros do alvo desse ataque deve realizar um TR de Fortitude ou recebe metade do dano que o alvo recebeu.

• Postura da Fortuna. Enquanto estiver na postura da fortuna, ao rodar um d20 e conseguir um resultado igual ou menor ao seu bônus de treinamento, você pode escolher rolar novamente, ficando com o maior resultado. Você pode utilizar este efeito uma quantidade de vezes igual a metade do seu bônus de treinamento por rodada e apenas uma vez no mesmo dado.

• Postura da Devastação. Enquanto na postura da devastação, para cada golpe acertado contra o mesmo alvo, você recebe +1 em acerto e ignora 2 de redução de dano, até um máximo igual ao seu bônus de treinamento para o acerto e o dobro dele para a redução de dano. Se você trocar de alvo uma vez, retorna ao zero. [Pré-Requisito: Nível 6]

• Postura da Tempestade. Enquanto na postura da tempestade, sempre que acertar um ataque o alvo realiza um TR de Fortitude, sendo derrubado em uma falha. Caso acerte um ataque em um alvo já caído, ele deve repetir o teste e, caso falhe, fica imóvel até o começo do seu turno. [Pré-Requisito: Nível 10]

• Postura do Céu. Uma postura balanceada, que apenas acentua suas capacidades essenciais. Enquanto na postura do céu, o alcance dos seus ataques é dobrado, você recebe 2 pontos de preparo temporários no começo de todo turno e +2 em todas as suas rolagens de perícia. [Pré-Requisito: Nível 12]

Entrar em uma postura é uma ação bônus, e ela dura 1 minuto ou até você ser derrubado, ficar incapacitado ou trocar de postura. Você pode ativar suas posturas uma quantidade de vezes igual ao seu bônus de treinamento. Nos níveis 8 e 16 você aprende outra postura à sua escolha.`
    },

    // --- Artes do Combate ---
    {
      name: "Artes do Combate – Técnicas de Avanço",
      nivel: 4,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "Pontos de Preparo",
        ativacao: "Ação / Ação Comum",
        requisitos: "",
        duracao: "Variável"
      },
      description: `Ao obter essa habilidade, você aprende as duas artes do combate abaixo:

• Avanço Bumerangue. Ao utilizar a ação Atacar, você pode gastar 3 Pontos de Preparo para saltar na direção de um inimigo dentro de 6 metros e, após encerrar a ação, você retorna para o ponto de partida. Nem o avanço nem o retorno causam ataques de oportunidade. Durante o retorno, você pode gastar 1 Ponto de Preparo para realizar um ataque com uma arma de arremesso ou a distância contra o mesmo alvo.

• Sombra Descendente. Como uma Ação Comum, você pode gastar 3 Pontos de Preparo para avançar rapidamente contra um inimigo dentro de 6 metros e realizar um ataque contra ele. Após realizar o ataque, você o utiliza como apoio e se ergue no ar, podendo escolher cair em outro inimigo dentro de 6 metros e realizar um ataque contra ele, caindo em um lugar desocupado dentro de 3 metros do alvo após isso.`
    },
    {
      name: "Artes do Combate – Técnicas da Força",
      nivel: 2,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "Pontos de Preparo",
        ativacao: "Ação Completa / Ação",
        requisitos: "",
        duracao: "Variável"
      },
      description: `Ao obter essa habilidade, você aprende as duas artes do combate abaixo:

• Nuvens Espirais. Como uma Ação Completa, você inicia uma sequência contra um inimigo dentro do alcance da sua arma: você pode realizar até três ataques, gastando 2 Pontos de Preparo para cada um. A cada ataque, o alvo é empurrado 3 metros para qualquer direção, com você o acompanhando, além de cada ataque causar 2d6 de dano Energético adicional.

• Onda do Dragão. Quando utilizar a ação Atacar, você pode gastar 5 Pontos de Preparo para receber vantagem neste ataque e, caso acerte, o alvo é empurrado 6 metros para trás, recebe 3d12 de dano Energético adicional e tem metade da sua Redução de Dano ignorada.`
    },
    {
      name: "Artes do Combate – Técnicas de Saque",
      nivel: 12,
      type: "feature",
      system: {
        tipo: "aptidao",
        categoria: "Especialista",
        custo: "Pontos de Preparo",
        ativacao: "Ação Completa / Reação",
        requisitos: "",
        duracao: "Variável"
      },
      description: `Ao obter essa habilidade, você aprende as duas artes do combate abaixo:

• Saque Devastador. No final do seu turno, você pode gastar 2 Pontos de Preparo para preparar um saque, o qual dura até o começo do seu próximo turno. Caso seja atacado enquanto estiver com o saque preparado, você pode gastar 4 Pontos de Preparo e sua Reação para realizar um ataque contra a criatura atacante. Caso o resultado da sua Jogada de Ataque seja maior do que a da criatura, você anula o ataque dela e acerta o seu, o qual causa 4d10 de dano adicional do mesmo tipo da arma e ignora Redução de Dano. Caso o seu resultado seja menor, você apenas causa o dano comum de um ataque.

• Saque Trovão. Como uma Ação Completa, você pode gastar 6 Pontos de Preparo para se mover uma distância igual ao seu Deslocamento e, enquanto se movendo desta maneira, você não recebe ataques de oportunidade e pode realizar um ataque contra todo inimigo que fique dentro de 3 metros de você durante a locomoção.`
    },
  ];

  // 2) Garante compêndio (world)
  let pack = game.packs.find(p =>
    p.metadata?.label === PACK_LABEL && p.documentName === "Item" &&
    // aceita compêndios do sistema alvo ou do World
    (p.metadata?.system === PACK_PACKAGE || p.metadata?.package === PACK_PACKAGE || p.metadata?.package === "world")
  );

  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      label: PACK_LABEL,
      name: PACK_NAME,
      type: "Item",
      package: PACK_PACKAGE
    });
  }

  if (pack.locked) {
    ui.notifications.error(`Destrave o Compêndio "${PACK_LABEL}" (cadeado) e tente novamente.`);
    return;
  }

  // 3) Carrega documentos existentes e cria índice por nome
  const docs = await pack.getDocuments();
  const byName = new Map(docs.map(d => [String(d.name ?? "").trim().toLowerCase(), d]));

  // 3.5) Pastas DENTRO do compêndio (igual seed de Aptidões)
  const folderByKey = new Map();
  for (const f of pack.folders?.contents ?? []) {
    if (!f?.name) continue;
    const parentId = String(f.folder?.id ?? f.folder ?? '');
    folderByKey.set(`${f.name}@@${parentId}`, f);
  }

  async function getOrCreatePackFolder(folderName, parentFolderId = null) {
    if (!folderName) return null;
    const parentIdKey = String(parentFolderId ?? '');
    const key = `${folderName}@@${parentIdKey}`;
    const existing = folderByKey.get(key);
    if (existing) return existing;

    // Tenta criar a pasta dentro do compêndio (pack). Se falhar, faz fallback
    // para criar pastas no World (fora do compêndio). Alguns sistemas/versões
    // podem não expor a criação de pastas em compêndios; esse fallback garante
    // que o macro ainda crie uma estrutura e salve itens funcionalmente.
    try {
      const [created] = await Folder.createDocuments(
        [
          {
            name: folderName,
            type: 'Item',
            sorting: 'a',
            folder: parentFolderId ?? null,
          }
        ],
        { pack: pack.collection }
      );
      if (created) {
        folderByKey.set(key, created);
        return created;
      }
    } catch (err) {
      console.warn(`Não foi possível criar pasta dentro do compêndio: ${err}`);
    }

    // Fallback: criar pasta no World (fora do compêndio)
    try {
      const [createdWorld] = await Folder.createDocuments([
        {
          name: folderName,
          type: 'Item',
          sorting: 'a',
          folder: parentFolderId ?? null,
        }
      ]);
      if (createdWorld) {
        folderByKey.set(key, createdWorld);
        return createdWorld;
      }
    } catch (err) {
      console.error(`Falha ao criar pasta no World: ${err}`);
    }

    return null;
  }

  const parentFolder = await getOrCreatePackFolder(PACK_LABEL, null);

  // Mapeamento de categorias que queremos separar em duas pastas distintas
  const CATEGORY_MAP = {
    "Lutador": "Lutador",
    "Especialista": "Especialista em Combate"
  };

  // Cria pastas-filhas para cada categoria mapeada
  const categoryParentId = new Map();
  for (const mapped of Object.values(CATEGORY_MAP)) {
    const f = await getOrCreatePackFolder(mapped, parentFolder?.id ?? null);
    if (f) categoryParentId.set(mapped, f.id);
  }

  // Agrupa níveis por categoria mapeada e níveis restantes para o root
  const levelsByCategory = new Map();
  const rootLevels = new Set();
  for (const a of APTIDOES) {
    const cat = String(a?.system?.categoria ?? "").trim();
    const mapped = CATEGORY_MAP[cat];
    const lvl = Number(a.nivel ?? 0);
    if (mapped) {
      const s = levelsByCategory.get(mapped) ?? new Set();
      s.add(lvl);
      levelsByCategory.set(mapped, s);
    } else {
      rootLevels.add(lvl);
    }
  }

  // Cria subpastas por nível dentro de cada categoria mapeada
  const folderByLevelCategory = new Map();
  for (const [mapped, lvlSet] of levelsByCategory.entries()) {
    const parentId = categoryParentId.get(mapped) ?? parentFolder?.id ?? null;
    for (const lvl of [...lvlSet].sort((a, b) => a - b)) {
      const folderName = (lvl && lvl > 0) ? `Nível ${lvl}` : 'Outros';
      const f = await getOrCreatePackFolder(folderName, parentId);
      if (f) folderByLevelCategory.set(`${mapped}@@${lvl}`, f.id);
    }
  }

  // Cria subpastas por nível no root (itens sem categoria mapeada)
  for (const lvl of [...rootLevels].sort((a, b) => a - b)) {
    const folderName = (lvl && lvl > 0) ? `Nível ${lvl}` : 'Outros';
    const f = await getOrCreatePackFolder(folderName, parentFolder?.id ?? null);
    if (f) folderByLevelCategory.set(`_root@@${lvl}`, f.id);
  }

  // Helpers
  const parseCustoPE = (custoStr) => {
    const s = String(custoStr ?? "").trim().toLowerCase();
    // aceita "X pe" ou "XPE"
    const m = s.match(/(\d+)\s*pe/);
    return m ? Number(m[1]) : 0;
  };

  const toItemData = (entry) => {
    const sys = entry?.system ?? {};
    const custoTexto = String(sys.custo ?? "").trim();
    const custoPE = parseCustoPE(custoTexto);

    const descricao = String(entry.description ?? '').trim();

    return {
      name: entry.name,
      type: "aptidao",
      img: entry.img || 'icons/svg/book.svg',
      // decide pasta baseada na categoria mapeada (Lutador / Especialista em Combate)
      folder: (() => {
        const cat = String(entry?.system?.categoria ?? "").trim();
        const mapped = CATEGORY_MAP[cat];
        const lvl = Number(entry.nivel ?? 0);
        if (mapped) return folderByLevelCategory.get(`${mapped}@@${lvl}`) ?? folderByLevelCategory.get(`${mapped}@@0`) ?? null;
        return folderByLevelCategory.get(`_root@@${lvl}`) ?? folderByLevelCategory.get(`_root@@0`) ?? null;
      })(),
      system: {
        // padrão do sistema (vide seed de Aptidões)
        fonte: { value: '' },
        descricao: { value: descricao },

        // campos nativos do tipo aptidao
        custo: { value: custoPE, label: "Custo (PE)" },
        custoTexto: { value: custoTexto, label: "Custo (texto)" },
        acao: { value: String(sys.ativacao ?? "").trim() || "Passiva", label: "Ação" },
        requisito: { value: String(sys.requisitos ?? "").trim(), label: "Requisito" },

        // campos extras (adicionados no template.json)
        tipo: { value: String(sys.tipo ?? "").trim(), label: "Tipo" },
        categoria: { value: String(sys.categoria ?? "").trim(), label: "Categoria" },
        ativacao: { value: String(sys.ativacao ?? "").trim(), label: "Ativação" },
        duracao: { value: String(sys.duracao ?? "").trim(), label: "Duração" }
      }
    };
  };

  let created = 0;
  let updated = 0;

  for (const entry of APTIDOES) {
    const key = String(entry.name ?? "").trim().toLowerCase();
    if (!key) continue;

    const data = toItemData(entry);

    const existing = byName.get(key);
    if (existing) {
      await existing.update(data);
      updated++;
    } else {
      try {
        const [newDoc] = await Item.createDocuments([data], { pack: pack.collection });
        if (newDoc) {
          byName.set(key, newDoc);
          created++;
        }
      } catch (err) {
        // Fallback: criar no World caso compêndio não permita
        console.warn(`Falha ao criar item no compêndio, criando no World: ${err}`);
        try {
          const [newDocWorld] = await Item.createDocuments([data]);
          if (newDocWorld) {
            byName.set(key, newDocWorld);
            created++;
          }
        } catch (err2) {
          console.error(`Falha ao criar item no World também: ${err2}`);
        }
      }
    }
  }

  ui.notifications.info(`Habilidades Amaldiçoadas: ${created} criadas, ${updated} atualizadas no compêndio (com pastas por nível).`);
})();
