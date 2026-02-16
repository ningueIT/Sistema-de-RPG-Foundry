// Descrições exibidas na aba Treinamento (ficha do personagem).
// Mantém o texto separado do HBS para facilitar revisão/edição.
// Preencha conforme as regras do seu livro.

export const TREINAMENTO_DESCRICOES = {
  agilidade: {
    etapa1: `Seu Deslocamento aumenta em 1,5 metros.`,
    etapa2: `Você recebe um bônus de +2 em rolagens de Acrobacia.`,
    etapa3: `Requisito: Destreza 14.\nVocê recebe um bônus de +2 em rolagens de Iniciativa.`,
    etapa4: `Requisito: Destreza 16.\nVocê recebe um bônus de +2 em rolagens de Reflexos.`,
    completo: `Com grande velocidade e agilidade, você se torna rápido e capaz de um nível superior de mobilidade e esquivas.\nSua margem necessária para conseguir um sucesso crítico em um TR de Reflexos reduz em 2.\nSeu Deslocamento aumenta em 4,5 metros.`,
  },
  barreiras: {
    etapa1: `Foco: Técnicas de Barreira.\nOs pontos de vida das paredes da sua Técnica de Barreira aumentam em 10.`,
    etapa2: `Seu Nível de Aptidão em Barreiras aumenta em 1.`,
    etapa3: `Requisito: Nível de Aptidão em Barreiras 2.\nOs pontos de vida das paredes da sua Técnica de Barreira aumentam em 10.`,
    etapa4: `Requisito: Nível de Aptidão em Barreiras 3.\nAo utilizar Técnicas de Barreira, o máximo de paredes que você pode criar aumenta em 2.`,
    completo: `Você domina a técnica de barreiras, conseguindo as conferir uma resistência elevada.\nToda parede que você criar com Técnicas de Barreira recebe RD igual ao seu Nível de Aptidão em Barreiras.`,
  },
  compreensao: {
    etapa1: `Seu máximo de energia amaldiçoada aumenta em 2.`,
    etapa2: `Você recebe um bônus de +1 em rolagens de Feitiçaria e Ocultismo.`,
    etapa3: `Requisito: Nível de Aptidão em Aura 2.\nSeu máximo de energia amaldiçoada aumenta em 3.`,
    etapa4: `Requisito: Nível de Aptidão em Aura 3.\nVocê recebe um bônus de +2 em rolagens de Feitiçaria e Ocultismo.`,
    completo: `Você chega muito perto de compreender profundamente a energia amaldiçoada, tornando-se familiar com ela e entendendo melhor uma parte dela.\nVocê aumenta um nível de aptidão a sua escolha em 1.`,
  },
  controleEnergia: {
    etapa1: `Seu máximo de energia amaldiçoada aumenta em 2.`,
    etapa2: `Quando uma cena de combate iniciar, você recebe 4 pontos de energia amaldiçoada temporários.`,
    etapa3: `Requisito: Nível de Aptidão em Controle e Leitura 2.\nSeu máximo de energia amaldiçoada aumenta em 3.`,
    etapa4: `Requisito: Nível de Aptidão em Controle e Leitura 3.\nSeu Nível de Aptidão em Controle e Leitura aumenta em 1.`,
    completo: `Você já estabeleceu uma profunda conexão com a energia amaldiçoada, assim como a conhece cada vez mais completamente.\nDurante uma cena de combate, no começo de toda rodada, você ganha PE temporário igual a metade do seu bônus de treinamento.`,
  },
  dominios: {
    etapa1: `Requisito: Expansão de Domínio Incompleta.\nVocê recebe um bônus de +1 em rolagens para confrontos e contestações de expansões.`,
    etapa2: `A área da sua Expansão de Domínio aumenta em 3 metros.`,
    etapa3: `Requisito: Expansão de Domínio Completa.\nVocê recebe um bônus de +1 em rolagens para confrontos e contestações de expansões.`,
    etapa4: `Requisito: Nível de Aptidão em Domínio 5.\nVocê pode colocar um efeito adicional em sua expansão de domínio.`,
    completo: `Você se torna um mestre das expansões, entendo o como conseguir a moldar perfeitamente diante a sua vontade e necessidade do momento.\nVocê recebe a aptidão amaldiçoada Modificação Completa.\n\nMODIFICAÇÃO COMPLETA\nSeu controle sobre os domínios é tão refinado que, mesmo no imediato momento de expandir seu domínio, você consegue o modificar. Ao utilizar uma expansão de domínio, você pode aplicar as seguintes modificações:\n• Inversão de Resistência: você inverte a resistência interna e externa da sua expansão de domínio. Ao utilizar essa modificação, troque os pontos de vida do lado interno pelos do lado externo.\n• Mudança de Tamanho: você muda e controla o tamanho da expansão. Para cada 1,5m que encolher a expansão, ela recebe 20 pontos de vida adicionais em sua resistência interna e externa; para cada 1,5m que expandir, a resistência interna e externa diminui em 20 pontos de vida. Uma expansão não pode ser encolhida para menos de 3 metros e nem expandida para mais que o triplo do tamanho comum. Ambas as mudanças de tamanho são consideradas na área da expansão, a qual por padrão é de 9 metros.`,
  },
  energiaReversa: {
    etapa1: `Foco: Energia Reversa.\nA quantidade de pontos de energia reversa que você pode gastar em Aptidões de Energia Reversa aumenta em 1.`,
    etapa2: `Seu Nível de Aptidão em Energia Reversa aumenta em 1.`,
    etapa3: `Requisito: Nível de Aptidão em Energia Reversa 4.\nO custo para regenerar um membro ou ferida interna com Regeneração Aprimorada é reduzido em 2 pontos de energia reversa.`,
    etapa4: `Requisito: Nível de Aptidão em Energia Reversa 5.\nVocê também pode usar Fluxo Constante para regenerar membros, ao invés de apenas se curar.`,
    completo: `Sua maestria sobre a energia reversa te permite recuperar até mesmo aquilo que parece impossível.\nVocê pode usar a aptidão amaldiçoada Regeneração Aprimorada para curar sua exaustão de técnica após usar expansão de domínio, reduzindo em um turno para 2 pontos de energia reversa gastos.`,
  },
  luta: {
    etapa1: `O dano de seus ataques desarmados aumenta em 1 nível.`,
    etapa2: `Você recebe +2 em sua Defesa e em rolagens para as ações Agarrar, Derrubar e Empurrar.`,
    etapa3: `Requisito: Força ou Destreza 14.\nO dano de seus ataques desarmados aumenta em 1 nível.`,
    etapa4: `Requisito: Força ou Destreza 16.\nO dano de seus ataques desarmados aumenta em 2 níveis.`,
    completo: `Você se torna altamente proficiente em luta, conseguindo extrair ao máximo de seu corpo e manobras.\nVocê recebe acesso ao efeito de crítico de ataques desarmados (pugilato).\nAlém disso, uma vez por rodada, você pode escolher realizar uma rolagem de Acrobacia ou Atletismo com vantagem.`,
  },
  manejoArma: {
    etapa1: `Escolha uma arma específica: você se torna treinado com ela.\nCaso já seja, adicione +2 em rolagens de dano com ela.`,
    etapa2: `Você recebe um bônus de +1 em jogadas de ataque com a arma escolhida.`,
    etapa3: `Enquanto estiver manejando a arma escolhida, você recebe acesso ao efeito crítico dela.`,
    etapa4: `Você recebe +1 em jogadas de ataque e +2 em rolagens de dano com a arma escolhida.`,
    completo: `Você se torna um mestre no manejo da arma para qual se dedicou a treinar e dominar.\nEnquanto estiver manejando a arma escolhida, ela recebe um Encantamento de ferramenta amaldiçoada adicional.`,
  },
  pericia: {
    etapa1: `Escolha uma perícia: você se torna treinado nela.\nCaso já seja, adicione +1 em testes de perícia usando-a.`,
    etapa2: `Duas vezes por descanso, você pode escolher realizar um teste da perícia escolhida para o treinamento com vantagem.`,
    etapa3: `Você se torna mestre na perícia escolhida.\nCaso já seja, adicione +2 em testes de perícia usando-a.`,
    etapa4: `Uma vez por cena, você pode escolher obter um sucesso garantido em um teste da perícia escolhida, desde que não seja um teste oposto.`,
    completo: `Você treinou e se dedicou tanto a uma perícia específica, que ela se tornou algo no qual você é quase incapaz de falhar.\nCaso realize um teste da perícia escolhida e obtenha um resultado menor do que 5 no d20, você pode o rolar novamente e manter o melhor resultado.`,
  },
  potencialFisico: {
    etapa1: `Seu máximo de pontos de estamina aumenta em 2.`,
    etapa2: `Requisito: Nível 4 de Personagem.\nVocê recebe 2 pontos de atributo para distribuir entre seus atributos físicos.`,
    etapa3: `Seu máximo de pontos de estamina aumenta em 4.`,
    etapa4: `Você recebe uma Dádiva do Céu adicional.`,
    completo: `Você conseguiu chegar em um ponto onde seu corpo constantemente se renova e sua energia parece nunca ter fim.\nDurante uma cena de combate, no começo de toda rodada, você recebe uma quantidade de pontos de estamina temporários igual a metade do seu bônus de treinamento.`,
  },
  resistencia: {
    etapa1: `Seus pontos de vida máximos aumentam em 4.`,
    etapa2: `Sua quantidade de dados de vida disponíveis por descanso aumenta em 2.`,
    etapa3: `Requisito: Constituição 14.\nVocê recebe um bônus de +2 em rolagens de Fortitude.`,
    etapa4: `Requisito: Constituição 16.\nSeus pontos de vida máximos aumentam em 6.`,
    completo: `Seu físico atinge um nível superior, concedendo-o uma grande resistência e vigor.\nSua margem necessária para conseguir um sucesso crítico em um TR de Fortitude reduz em 2.\nUma vez por cena, você ignora a primeira falha em testes de morte.\nSeus pontos de vida máximos aumentam em mais 10 pontos.`,
  },
};
