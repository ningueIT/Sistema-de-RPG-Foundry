// Catálogo e descrições de aptidões (dados usados pela UI da ficha).
// Separado do `actor-sheet.mjs` para reduzir o tamanho do arquivo principal.

export const APTIDOES_CATALOGO = {
  aura: {
    titulo: "Aura",
    entradas: [
      { key: "afinidadeAmpliada", label: "Afinidade Ampliada", description: "Ativa a aptidão Afinidade Ampliada." },
      { key: "auraAnuladora", label: "Aura Anuladora" },
      { key: "auraChamativa", label: "Aura Chamativa" },
      { key: "auraControlada", label: "Aura Controlada" },
      { key: "auraDeContencao", label: "Aura de Contenção" },
      { key: "auraDoBastiao", label: "Aura do Bastião" },
      { key: "auraDoComandante", label: "Aura do Comandante" },
      { key: "auraDoComandanteEvoluida", label: "Aura do Comandante Evoluída" },
      { key: "auraDrenadora", label: "Aura Drenadora" },
      { key: "auraElemental", label: "Aura Elemental" },
      { key: "auraReforcada", label: "Aura Reforçada" },
      { key: "auraImpenetravel", label: "Aura Impenetrável" },
      { key: "casuloDeEnergia", label: "Casulo de Energia" },
      { key: "auraElementalReforcada", label: "Aura Elemental Reforçada" },
      { key: "absorcaoElemental", label: "Absorção Elemental" },
      { key: "auraEmbacada", label: "Aura Embaçada" },
      { key: "auraInofensiva", label: "Aura Inofensiva" },
      { key: "auraExcessiva", label: "Aura Excessiva" },
      { key: "concentrarAura", label: "Concentrar Aura" },
      { key: "enganacaoProjetada", label: "Enganação Projetada" },
      { key: "golpeComAura", label: "Golpe com Aura" },
      { key: "transferenciaDeAura", label: "Transferência de Aura" },
      { key: "auraLacerante", label: "Aura Lacerante" },
      { key: "auraMacabra", label: "Aura Macabra" },
      { key: "auraMacica", label: "Aura Maciça" },
      { key: "auraMovedica", label: "Aura Movediça" },
      { key: "auraRedirecionada", label: "Aura Redirecionada" }
    ]
  },
  controleELeitura: {
    titulo: "Controle e Leitura",
    entradas: [
      { key: "canalizarEmGolpe", label: "Canalizar em Golpe" },
      { key: "canalizacaoAvancada", label: "Canalização Avançada" },
      { key: "canalizacaoMaxima", label: "Canalização Máxima" },
      { key: "cobrirSe", label: "Cobrir-se" },
      { key: "coberturaAvancada", label: "Cobertura Avançada" },
      { key: "estimuloMuscular", label: "Estímulo Muscular" },
      { key: "estimuloMuscularAvancado", label: "Estímulo Muscular Avançado" },
      { key: "expandirAura", label: "Expandir Aura" },
      { key: "leituraDeAura", label: "Leitura de Aura" },
      { key: "leituraRapidaDeEnergia", label: "Leitura Rápida de Energia" },
      { key: "projetarEnergia", label: "Projetar Energia" },
      { key: "projecaoAvancada", label: "Projeção Avançada" },
      { key: "projecaoMaxima", label: "Projeção Máxima" },
      { key: "projecaoDividida", label: "Projeção Dividida" },
      { key: "punhoDivergente", label: "Punho Divergente" },
      { key: "emocaoDaPetalaDecadente", label: "Emoção da Pétala Decadente" },
      { key: "rastreioAvancado", label: "Rastreio Avançado" }
    ]
  },
  energiaReversa: {
    titulo: "Energia Reversa",
    entradas: [
      { key: "energiaReversa", label: "Energia Reversa" },
      { key: "curaAmplificada", label: "Cura Amplificada" },
      { key: "fluxoConstante", label: "Fluxo Constante" },
      { key: "regeneracaoAprimorada", label: "Regeneração Aprimorada" },
      { key: "liberacaoDeEnergiaReversa", label: "Liberação de Energia Reversa" },
      { key: "canalizarEmEnergiaReversa", label: "Canalizar em Energia Reversa" },
      { key: "curaEmGrupo", label: "Cura em Grupo" }
    ]
  },
  dominio: {
    titulo: "Domínio",
    entradas: [
      { key: "revestimentoDeDominio", label: "Revestimento de Domínio" },
      { key: "anularTecnica", label: "Anular Técnica" },
      { key: "expansaoDeDominioIncompleta", label: "Expansão de Domínio Incompleta" },
      { key: "expansaoDeDominioCompleta", label: "Expansão de Domínio Completa" },
      { key: "acertoGarantido", label: "Acerto Garantido" },
      { key: "expansaoDeDominioSemBarreiras", label: "Expansão de Domínio sem Barreiras" }
    ]
  },
  barreiras: {
    titulo: "Barreiras",
    entradas: [
      { key: "tecnicasDeBarreiras", label: "Técnicas de Barreiras" },
      { key: "paredesResistentes", label: "Paredes Resistentes" },
      { key: "barreiraRapida", label: "Barreira Rápida" },
      { key: "cestaOcaDeVime", label: "Cesta Oca de Vime" },
      { key: "cortina", label: "Cortina" }
    ]
  },
  especiais: {
    titulo: "Especiais",
    entradas: [
      { key: "raioNegro", label: "Raio Negro" },
      { key: "abencoadoPelasFaiscasNegras", label: "Abençoado pelas Faíscas Negras" },
      { key: "dominioSimples", label: "Domínio Simples" },
      { key: "reversaoDeTecnica", label: "Reversão de Técnica" },
      { key: "tecnicaMaxima", label: "Técnica Máxima" }
    ]
  },
  maldicaoAnatomia: {
    titulo: "Maldição - Anatomia",
    entradas: [
      { key: "absorcaoElemental", label: "Absorção Elemental" },
      { key: "armasNaturais", label: "Armas Naturais" },
      { key: "armasNaturaisAprimoradas", label: "Armas Naturais Aprimoradas" },
      { key: "composicaoElemental", label: "Composição Elemental" },
      { key: "crescimentoCorporal", label: "Crescimento Corporal" },
      { key: "desenvolvimentoFisico", label: "Desenvolvimento Físico" },
      { key: "olhosAdicionais", label: "Olhos Adicionais" },
      { key: "revestimento", label: "Revestimento" },
      { key: "revestimentoEvoluido", label: "Revestimento Evoluído" },
      { key: "superioridadeFisica", label: "Superioridade Física" }
    ]
  },
  maldicaoControleELeitura: {
    titulo: "Maldição - Controle e Leitura",
    entradas: [
      { key: "absorcaoAmaldicoada", label: "Absorção Amaldiçoada" },
      { key: "estoqueAmpliado", label: "Estoque Ampliado" },
      { key: "extracaoDePotencial", label: "Extração de Potencial" },
      { key: "protecaoConstante", label: "Proteção Constante" }
    ]
  },
  maldicaoEspeciais: {
    titulo: "Maldição - Especiais",
    entradas: [
      { key: "regeneracaoCorporal", label: "Regeneração Corporal" },
      { key: "regeneracaoAmpliada", label: "Regeneração Ampliada" },
      { key: "regeneracaoMaxima", label: "Regeneração Máxima" },
      { key: "regeneracaoDeMembros", label: "Regeneração de Membros" },
      { key: "fluxoImparavel", label: "Fluxo Imparável" },
      { key: "areaDeDominio", label: "Área de Domínio" }
    ]
  }
};

// Descrições específicas por categoria.chave — usadas para mostrar apenas a descrição
export const APTIDOES_DESCRICOES = {
  /* AURA */
  'aura.afinidadeAmpliada': 'Ao escolher um elemento, seus ataques do tipo escolhido causam dano adicional igual a 1 + seu Nível de Aptidão em Aura.',
  'aura.auraAnuladora': 'Permite gastar PE para anular condições. Anular condição fraca 2PE, média 4PE, forte 6PE, extrema 10PE. Usa igual ao bônus de treinamento; recupera em descanso longo.',
  'aura.auraChamativa': 'Criar uma aura que força criaturas hostis em 4,5m a fazer TR de Vontade; falha causa enfeitiçamento até sucesso (acumula resistência). [Pré: Presença 18, Nível 6]',
  'aura.auraControlada': 'Soma metade do seu Nível de Aptidão em Aura a testes de Furtividade; pode gastar 1 PE para somar o nível inteiro. [Pré: Treinado em Furtividade, Destreza 16]',
  'aura.auraDeContencao': 'Ao agarrar ou impedir fuga, soma metade do Nível de Aptidão em Aura; metade do nível vezes por cena pode pagar 1 PE para vantagem/forçar desvantagem. [Pré: Força/Constituição 16]',
  'aura.auraDoBastiao': 'Aliados em 4,5m recebem bônus de Defesa igual ao seu Nível de Aptidão em Aura enquanto a aura estiver ativa.',
  'aura.auraDoComandante': 'Como Ação Bônus, expande a aura para aliados em 4,5m, concedendo 1 + metade do seu Nível de Aptidão em Aura em dano e perícias; custa 2 PE/turno. [Pré: Presença 16, Nível 8]',
  'aura.auraDoComandanteEvoluida': 'Ao usar Aura do Comandante, pode somar seu Nível de Aptidão em Aura inteiro e conceder +2 em ataques/TRs; custo passa para 4 PE/turno. [Pré: Nível 12]',
  'aura.auraDrenadora': 'Ao matar um inimigo, ganha PV temporários igual a Xd8 + modificador de Constituição, onde X = seu Nível de Aptidão em Aura. [Pré: Nível de Aptidão 2, Nível 6]',
  'aura.auraElemental': 'Como Ação Bônus, imbuir sua aura com um elemento; ataques causam dano adicional (1d4 → 1d6/1d8/1d10 conforme nível de aptidão). Pode desligar como ação livre. [Pré: Nível 6]',
  'aura.auraElementalReforcada': 'Aumenta dano e concede resistência ao elemento da sua aura; escala com Nível de Aptidão e Aura Reforçada. [Pré: Aura Elemental + Aura Reforçada]',
  'aura.absorcaoElemental': 'Reage a dano elemental: pode absorver e armazenar parte para adicionar Xd6 (escala por nível) ao próximo ataque. Não cumulativa. [Pré: Aura Elemental]',
  'aura.auraEmbacada': 'Como ação bônus, gasta 2 PE/rodada para ativar; ataques inimigos têm 20% de chance de falhar enquanto ativa. [Pré: Nível 6]',
  'aura.auraInofensiva': 'Ao iniciar combate, realiza teste de Feitiçaria contra Atenção inimiga; se vencer, fica automaticamente escondido contra criaturas cujo valor seja superado. [Pré: Presença 16]',
  'aura.auraExcessiva': 'Pode pagar 2 PE/rodada para receber resistência parcial a todos os danos (exceto alma) igual ao valor de redução de Aura Reforçada. [Pré: Aura Reforçada, Constituição 16, Nível 8]',
  'aura.enganacaoProjetada': 'Como Ação Comum, projeta uma ilusão da sua aura para enganar rastreadores; concede vantagem em ataque se for bem-sucedido e consome 1 PE adicional por ataque extra. [Pré: Enganação treinada, Destreza 18, Nível 4]',
  'aura.golpeComAura': 'Gasta 1 PE para imbuir o próximo golpe com propriedades de uma aptidão de aura; pode forçar TR com CD aumentada pelo seu Nível de Aptidão em Aura. Não vale para Feitiços.',
  'aura.transferenciaDeAura': 'Como Ação Bônus, paga 2 PE para transferir uma aptidão de aura a um aliado dentro de 9m por 1 rodada; pode manter pagando 1 PE/rodada adicional.',
  'aura.auraLacerante': 'Ativa por 1 rodada; criaturas dentro de 3m fazem TR de Fortitude ou recebem Xd6 + seu modificador (X = Nível de Aptidão). Dados escalam com níveis. [Pré: escalas]',
  'aura.auraMacabra': 'Criaturas agressivas em 1,5m fazem TR de Vontade; falha ficam Abaladas; pode pagar 1 PE para expandir alcance a 4,5m 1 rodada; a partir do Nível 3 causa Amedrontado.',
  'aura.auraMacica': 'Aumenta sua Defesa em um valor igual ao seu Nível de Aptidão em Aura; torna mais difícil ser empurrado ou derrubado. [Pré: Constituição 16]',
  'aura.auraMovedica': 'Converte quadrados adjacentes em terreno difícil; área aumenta com o nível de aptidão (3m→4,5m→6m). Não é ampliada por Expandir Aura.',
  'aura.auraRedirecionada': 'Imbuir projétil/arma: ao errar, pode rolar de novo mirando outro alvo dentro de 6m; segunda rolagem recebe bônus igual a 1 + metade do Nível de Aptidão. [Pré: Destreza 16]',
  'aura.auraReforcada': 'Concede redução de dano contra ataques físicos igual ao dobro do seu Nível de Aptidão em Aura.',
  'aura.casuloDeEnergia': `Evoluindo o fluxo da aura, você pode formar um casulo de energia protetivo. Como Ação Comum, gaste 6 PE para criar o casulo por 1 rodada. Enquanto ativo, você fica imune a dano cortante, perfurante e de impacto provenientes de fontes mundanas (armas, quedas). Se a origem do dano for uma técnica, em vez de imunidade recebe RD adicional igual ao dobro do seu Nível de Aptidão em Aura. [Pré-Requisito: Aura Impenetrável, Aura Nível 5 e Nível 16]`,
  'aura.auraImpenetravel': 'Como Ação Bônus, por 1 rodada (3 PE) sua aura torna-se impenetrável, conferindo resistência a cortante/perfurante/impacto. [Pré: Aura Reforçada, Nível 3, Nível 10]',

  /* CONTROLE E LEITURA */
  'controleELeitura.canalizarEmGolpe': 'Gasta PE para aumentar dano do próximo ataque: cada PE gasto adiciona 1d6 de dano (apenas armas; não consome se o ataque errar).',
  'controleELeitura.canalizacaoAvancada': 'Melhora Canalizar em Golpe: pode ser feita como reação e cada PE passa a dar 1d8 por ponto.',
  'controleELeitura.canalizacaoMaxima': 'Aprimora canalização ao máximo: cada PE dá 1d10 e soma seu Nível de Aptidão em Aura ao dano total. [Pré: níveis altos]',
  'controleELeitura.cobrirSe': 'Como Reação, gasta PE para receber PV temporários (2 + 2×CL?) por ponto: padrão 4 PV por ponto gasto; dura até fim do turno do atacante.',
  'controleELeitura.coberturaAvancada': 'Ao cobrir-se, cada ponto gasto concede 8 PV temporários em vez de 4. [Pré: Cobrir-se, Nível 2 e 10]',
  'controleELeitura.estimuloMuscular': 'Gasta PE para aumentar deslocamento, bônus em testes de Acrobacia/Atletismo ou distância de arremesso/pular; efeitos e custos variam conforme uso.',
  'controleELeitura.estimuloMuscularAvancado': 'Melhora os estímulos: permite usar estímulos adicionais por rodada e aumenta os ganhos por PE. [Pré: Nível 3 e 4]',
  'controleELeitura.expandirAura': 'Como ação livre, gasta 2 PE para dobrar alcance de aptidões de aura por 1 rodada; custa +1 PE por rodada adicional. [Pré: Nível 6]',
  'controleELeitura.leituraDeAura': 'Realize teste de Feitiçaria para identificar propriedades de uma aura; sucesso revela propriedades passivas e ativas.',
  'controleELeitura.leituraRapidaDeEnergia': 'Como Ação de Movimento, faz teste de Percepção contra CD Amaldiçoada; sucesso concede bônus igual ao CL e ignora penalidades de aura naquele encontro.',
  'controleELeitura.projetarEnergia': 'Dispara projétil de energia: gasta pontos para causar 1d10 por ponto; alcance e método (ataque ou TR) variam; pode forçar TR em vez de ataque.',
  'controleELeitura.projecaoAvancada': 'Aumenta dano por ponto para 2d8 e concede bônus de precisão ou TR. [Pré: Nível 2 e 8]',
  'controleELeitura.projecaoMaxima': 'Dano por ponto aumenta para 3d8, enorme bônus de acerto/penalidade de TR, e mudanças em como o dano é reduzido. [Pré: níveis altos]',
  'controleELeitura.projecaoDividida': 'Permite dividir o projétil em dois, pagando parte do custo para duplicar o disparo para um alvo secundário dentro de 4,5m. [Pré: Projeção Avançada]',
  'controleELeitura.punhoDivergente': 'Ao acertar com ataque desarmado, causa metade do dano imediatamente e guarda a outra metade para o turno seguinte; o segundo dano pode causar efeitos adicionais. [Pré: regras especiais]',
  'controleELeitura.rastreioAvancado': 'Detecta e segue vestígios de energia amaldiçoada deixados horas atrás; pode usar perícia para rastrear com maior precisão.',
  'controleELeitura.emocaoDaPetalaDecadente': `Arte secreta transmitida entre os Três Grandes Clãs como contra‑medida a expansões de domínio. Como Reação a uma expansão de domínio ativada ou como Ação Bônus, ative Emoção da Pétala Decadente. Enquanto ativa (Concentração), quando receber um Acerto Garantido de uma expansão de domínio você pode gastar uma quantidade de PE igual ao Nível de DOM do usuário que fez o Acerto Garantido; se o fizer, o Acerto Garantido é anulado. Se uma criatura estiver em seu alcance corpo a corpo ou você começar seu turno com uma criatura nesse alcance, você pode gastar 5 PE como Ação Livre para realizar um ataque corpo a corpo com Acerto Garantido automaticamente (sem teste). Se usar ofensivamente, você não pode se proteger contra Acertos Garantidos até o início do seu próximo turno. [Pré-Requisito: Nível 5, ensino por um dos Três Grandes Clãs, Cobrir‑se, Controle e Leitura Nível 3]`,
  'controleELeitura.concentrarAura': `Você concentra sua aura em sua arma, sacrificando aptidões passivas em troca de um segundo impacto. Como Ação Livre, você pode desabilitar um número de aptidões passivas por 1 rodada; para cada aptidão desabilitada, ao acertar um ataque corpo a corpo (desarmado ou com arma) aplica 1d8 de dano energético adicional ao alvo. Você pode desabilitar até 1 + seu Nível de Aptidão em Aura aptidões passivas. O dano desta aptidão não se aplica a Feitiços.`,
  'controleELeitura.fluxoConstante': 'Recupera uma pequena quantidade de PE automaticamente a cada turno (escala com aptidão).',
  'controleELeitura.fluxoImparavel': 'Reduz a eficácia de tentativas de anular ou dispersar sua energia, tornando suas aptidões mais estáveis em combate.',

  /* BARREIRAS */
  'barreiras.tecnicasDeBarreiras': `Você se torna capaz de erguer e manipular barreiras, criando até 6 paredes ao seu redor como Ação Comum. Cada parede custa 1 PE, tem 1,5 m de tamanho e PV igual a 5 + Nível de Aptidão em Barreiras × (metade do seu nível de personagem). Paredes servem como obstáculos ou para prender inimigos e podem ser movidas com outra Ação Comum.`,
  'barreiras.paredesResistentes': `As paredes que você cria tornam-se mais resistentes: cada parede passa a ter PV iguais a 10 + Nível de Aptidão em Barreiras × Nível de Personagem. [Pré-Requisito: Técnicas de Barreira, Nível de Aptidão em Barreira 2 e Nível 4]`,
  'barreiras.barreiraRapida': `Erguer ou manipular barreiras passa a ser uma Ação Bônus, refletindo agilidade no manejo das estruturas. [Pré-Requisito: Técnicas de Barreira, Nível de Aptidão em Barreira 3 e Nível 6]`,
  'barreiras.cestaOcaDeVime': `Técnica esotérica usada contra domínios. Como Ação Bônus ou Reação a uma expansão de domínio, gaste 3 PE para criar um trançado de vime ao seu redor. Enquanto ativa, você fica imune ao efeito de Acerto Garantido de uma expansão de domínio. Usa Concentração e possui Durabilidade = Nível de BAR + 1; falhas de concentração reduzem 1 de Durabilidade. No início do seu turno, se você deveria ter sido atingido por Acerto Garantido, a Cesta perde 1 de Durabilidade. Mantendo o selo (ocupando ambas as mãos) no início do turno, a Cesta não perde durabilidade por efeitos que não sejam falha de concentração. Se a Cesta quebrar, você sofre o Acerto Garantido instantaneamente. [Pré-Requisito: Mestre em História ou época adequada, Nível de Aptidão em Barreira 1 e Nível 5]`,
  'barreiras.cortina': `A Cortina é um grande campo de força negro que oculta uma área específica, impedindo pessoas de fora de ver seu interior. Ao criar, custa 1 PE a cada 9 m de área coberta; não há custo para mantê‑la. Você pode adicionar condições à cortina seguindo regras específicas de criação de cortinas. [Pré-Requisito: Técnicas de Barreira]`,

  /* ENERGIA REVERSA */
  'energiaReversa.energiaReversa': `Você aprende a produzir Energia Reversa (PER), onde 1 PER = 2 PE. A habilidade básica permite curar-se: cada PER gasto cura 2d6 + seu modificador de Presença ou Sabedoria. Aos níveis 10/15/20, o dado de cura aumenta em 1d6. Pode gastar até 1 + metade do seu Nível de Aptidão em Energia Reversa por uso. Cura em combate é Ação Comum e só para si. [Pré: Treinado em Feitiçaria, Controle e Leitura Nível 3, Nível 8]`,
  'energiaReversa.curaAmplificada': `A cura com Energia Reversa é amplificada: o dado passa a ser d8 e você soma o dobro do seu modificador de Presença ou Sabedoria. O máximo de PER gastos por vez aumenta para 1 + seu Nível de Aptidão. [Pré: Energia Reversa, Nível 3 e Nível 12]`,
  'energiaReversa.fluxoConstante': `Estabelece um fluxo contínuo de Energia Reversa no seu corpo. No início do seu turno você pode curar-se seguindo as regras de cura básica como Ação Livre; alternativamente, pode curar-se como Reação ao sofrer dano. [Pré: Energia Reversa, Nível 3 e Nível 12]`,
  'energiaReversa.regeneracaoAprimorada': `Como Ação Comum, você pode regenerar Ferimentos Complexos gastando 8 PER por ferimento. Desmembramentos só podem ser regenerados se perdidos há menos de um dia ou não cicatrizados. Gastando 3 PER e possuindo o membro em mãos, a ação vira Bônus e custa 3 PER para recolocar o membro. Também pode remover venenos como Ação Bônus por 4 PER. Aos Nível de Aptidão 5, a aptidão pode ser usada como Ação Livre gastando 10 PER. A cura recebida equivale à metade dos PER gastos. [Pré: Cura Amplificada, Nível 4 e Nível 15]`,
  'energiaReversa.liberacaoDeEnergiaReversa': `Permite curar outros com Energia Reversa, transferindo cura por toque a criaturas aliadas dentro do seu alcance. [Pré: Energia Reversa e Nível 10]`,
  'energiaReversa.canalizarEmEnergiaReversa': `Gasta PER para adicionar dano de Energia Reversa a um ataque: como Ação de Movimento, gaste até seu bônus de treinamento em PER; cada PER gasto causa 2d6 de dano de Energia Reversa adicional. Só funciona contra maldições e não em Feitiços. Não consome se o ataque errar. Não pode ser combinado com Canalizar em Golpe no mesmo ataque. [Pré: Liberação de Energia Reversa e Canalizar em Golpe]`,
  'energiaReversa.curaEmGrupo': `Permite dividir a cura entre várias criaturas num alcance de 4,5 m + 1,5 m por Nível de Aptidão em Energia Reversa. A quantidade máxima de PER gastos aumenta em 2 quando usada em grupo. [Pré: Liberação de Energia Reversa]`,

  /* ESPECIAIS */
  'especiais.raioNegro': `O Raio Negro (kokusen) é um fenômeno onde, ao aplicar Energia Amaldiçoada num instante preciso antes do impacto, o golpe é amplificado: o dano adicional é igual a metade do total de dano rolado (1.5×). Efeitos: (1) Compreensão Avançada: usar kokusen pela primeira vez aumenta seu máximo de PE em +1 por nível de personagem e eleva Nível de Aptidão em Aura em +1; esse aumento é atualizado ao subir de nível. (2) Raio Negro: ocorre em 20 natural (ou condições definidas); ignora resistências/reduções. (3) Estado de Consciência Absoluta: após um kokusen, por 1 rodada o requisito para kokusen reduz em 1; pode reduzir várias vezes até metade do seu Nível de Aptidão em Controle e Leitura. [Pré: Controle e Leitura Nível 3, Força ou Destreza 16, Nível 10]`,
  'especiais.abencoadoPelasFaiscasNegras': `Você canaliza as faíscas negras e passa a obter kokusen em 19‑20 por padrão. Em Estado de Consciência Absoluta, pode reduzir o requisito para kokusen uma vez adicional. Após um kokusen, recebe bônus igual a metade do seu Nível de Aptidão em Controle e Leitura em ataques e no dano por toda a cena. [Pré: Raio Negro, Controle e Leitura Nível 4, Aura Nível 3, Nível 15]`,
  'especiais.dominioSimples': `Cria, como Reação a uma expansão de domínio ou como Ação Bônus, uma esfera de raio X (X = 1,5 m + Nível de DOM × 1,5 m) gastando 5 PE. Dentro do Domínio Simples você e aliados não são afetados por Acerto Garantido nem por efeitos ambientais de domínio. Usa Concentração e possui Durabilidade Y = Nível de BAR + 1; falhas de concentração reduzem Durabilidade e a área em 1,5 m quando perde durabilidade. Se Durabilidade ou Área chegarem a 0, o Domínio quebra e todos recebem o Acerto Garantido. [Pré: Nível de Aptidão em Barreira 1 e Nível 5]`,
  'especiais.reversaoDeTecnica': `Permite criar uma Reversão de Técnica que usa Energia Reversa: um Feitiço criado como Reversão tem custo aumentado pelo nível do Feitiço e reverte o conceito da técnica original. Ao aprender, você recebe um Feitiço adicional que deve ser uma Reversão. [Pré: Energia Reversa e Nível 12]`,
  'especiais.tecnicaMaxima': `Habilidade suprema que permite criar uma Técnica Máxima: você recebe um Feitiço especial que, dependendo do acesso a níveis de Feitiço, segue regras específicas de criação (usa valores de Nível 5 quando aplicável). Custa 25 PE e, após uso, tem tempo de recarga em rodadas igual a 6 – metade do seu Bônus de Treinamento. [Pré: Mestre em Feitiçaria, Capacidade de Conjurar Feitiços Nível 4]`,

  /* DOMÍNIO */
  'dominio.revestimentoDeDominio': `Você se cobre com um revestimento de domínio fino, sem Feitiços imbuídos, que neutraliza técnicas dentro de seu espaço. Para ativar, gaste 5 PE e uma Ação Bônus (ou use como Reação ao ser alvo de um Feitiço). Você pode sustentar o efeito no início do seu turno gastando 5 PE. Enquanto ativo, reduz o dano de técnicas ofensivas que o atinjam em um valor igual ao seu Nível de Personagem; essa redução não pode ser ignorada. Técnicas cujo nível seja menor ou igual à metade do seu Nível de DOM (arredondado para cima) são anuladas. Este efeito não se aplica a Feitiços que afetem diretamente sua energia amaldiçoada. Seus golpes também anulam completamente efeitos passivos/ativos/sustentados de Feitiços que sejam de um nível que você possa anular (considera‑se o funcionamento básico equivalente a um Feitiço de 1º nível). Enquanto o Revestimento estiver ativo você não pode utilizar nem estar sob o efeito de qualquer Feitiço. [Pré-Requisito: Controle e Leitura Nível 3, Domínio Nível 1, Nível 10]`,
  'dominio.anularTecnica': `Aprimora o Domínio Simples para anular técnicas amaldiçoadas. Como Reação ao ser alvo de um Feitiço, você pode tentar anulá‑lo (apenas feitiços de nível que você tem ou teria acesso). Gasta-se PE igual ao custo do Feitiço e realiza um teste de Feitiçaria contra o lançador; se bem‑sucedido, o Feitiço é anulado (para efeitos em área, nenhuma das criaturas submetidas sofre o efeito). Uso limitado: vezes igual ao seu Nível de Aptidão em Domínio por descanso longo. [Pré-Requisito: Domínio Simples, Domínio Nível 3, Nível 8]`,
  'dominio.expansaoDeDominioIncompleta': `Como Ação Comum, com ambas as mãos livres, você pode pagar 15 PE para expandir um Domínio Incompleto numa área igual a 4,5 m × seu bônus de treinamento. A expansão aplica efeitos definidos conforme o Guia de Criação de Expansões de Domínio e dura por padrão 1 + seu Nível de Aptidão em Domínio rodadas. [Pré-Requisito: Domínio Nível 1, Nível 8]`,
  'dominio.expansaoDeDominioCompleta': `Como Ação Comum, com ambas as mãos livres, você pode pagar 20 PE para criar uma Expansão de Domínio Completa que gera uma área esférica de 9 m. A expansão aplica efeitos conforme o Guia de Criação de Expansões de Domínio e dura por padrão 3 + seu Nível de Aptidão em Domínio rodadas; pode prender alvos dentro da área. [Pré-Requisito: Técnicas de Barreira, Expansão Incompleta, Aptidão em Barreira e Domínio Nível 3, Nível 10]`,
  'dominio.acertoGarantido': `Você alcança o Acerto Garantido, capaz de imbuir uma expansão de domínio com efeito letal. Adicionar Acerto Garantido em uma expansão não conta para o máximo e aumenta o custo da expansão completa em 5 PE. O funcionamento detalhado do Acerto Garantido segue o Guia de Criação de Domínios. [Pré-Requisito: Expansão de Domínio Completa, Treinamento em Feitiçaria, Barreira e Domínio Nível 4, Nível 14]`,
  'dominio.expansaoDeDominioSemBarreiras': `Forma avançada de expansão que não ergue barreiras: possui os mesmos efeitos e custo de uma expansão completa com Acerto Garantido, mas não levanta barreiras e tem alcance superior para o Acerto Garantido, podendo até superar barreiras de outras expansões. [Pré-Requisito: Acerto Garantido, Mestre em Feitiçaria, Barreira e Domínio Nível 5, Nível 20]`,
};

// Texto completo de fallback (usado se não houver descrição específica)
export const APTIDOES_DESC_COMPLETA = `Descrição completa das Aptidões disponível no manual do sistema.`;
