// module/helpers/encantamentos.mjs
// Enchantment (Encantamento) definitions for Cursed Tools (Ferramentas Amaldiçoadas).

/**
 * Grade bonuses table for cursed weapons.
 * Each grade provides a flat damage bonus.
 */
export const GRAU_ARMA = {
  quarto:   { label: "Quarto Grau",   bonusDano: 1, encantamentos: 0 },
  terceiro: { label: "Terceiro Grau", bonusDano: 2, encantamentos: 1 },
  segundo:  { label: "Segundo Grau",  bonusDano: 3, encantamentos: 1 },
  primeiro: { label: "Primeiro Grau", bonusDano: 4, encantamentos: 2 },
  especial: { label: "Grau Especial", bonusDano: 5, encantamentos: 0 }
};

/**
 * Grade bonuses table for cursed shields.
 * Each grade provides physical damage reduction (RD).
 */
export const GRAU_ESCUDO = {
  quarto:   { label: "Quarto Grau",   rdFisico: 1, encantamentos: 0 },
  terceiro: { label: "Terceiro Grau", rdFisico: 2, encantamentos: 1 },
  segundo:  { label: "Segundo Grau",  rdFisico: 3, encantamentos: 1 },
  primeiro: { label: "Primeiro Grau", rdFisico: 4, encantamentos: 1 },
  especial: { label: "Grau Especial", rdFisico: 5, encantamentos: 0 }
};

/**
 * Grade bonuses table for cursed uniforms.
 * Each grade only provides enchantment slots.
 */
export const GRAU_UNIFORME = {
  quarto:   { label: "Quarto Grau",   encantamentos: 1 },
  terceiro: { label: "Terceiro Grau", encantamentos: 1 },
  segundo:  { label: "Segundo Grau",  encantamentos: 1 },
  primeiro: { label: "Primeiro Grau", encantamentos: 1 },
  especial: { label: "Grau Especial", encantamentos: 0 }
};

/**
 * Enchantments available for weapons.
 */
export const ENCANTAMENTOS_ARMA = [
  { key: "afiada", nome: "Afiada", descricao: "A arma recebe o traço Fatal d8. Caso já possua o traço, o dado dele aumenta em um nível.", preRequisito: "A arma causa dano cortante ou perfurante" },
  { key: "amplificadora", nome: "Amplificadora", descricao: "Após realizar um ataque com esta arma, o portador causa metade do bônus de treinamento em dados de dano a mais no próximo Feitiço de Dano ou Técnica Marcial de Ataque que cause dano até o final do próximo turno. O dano adicional é considerado Após Ataque.", preRequisito: "" },
  { key: "armazenadora", nome: "Armazenadora", descricao: "Durante um descanso longo você pode armazenar até 5 PE na arma. Você pode, desde que esteja empunhando a arma, recuperar os cinco pontos de energia armazenados nela.", preRequisito: "" },
  { key: "balanceada", nome: "Balanceada", descricao: "Enquanto empunhar a arma você recebe um bônus de +2 em testes de manobras.", preRequisito: "" },
  { key: "canalizadora", nome: "Canalizadora", descricao: "Enquanto empunhar a arma, a sua CD Amaldiçoada aumenta em 2.", preRequisito: "" },
  { key: "cano_alongado", nome: "Cano Alongado", descricao: "A arma tem o seu alcance aumentado em 1/4 do total em metros.", preRequisito: "Só pode ser aplicada em armas a distância" },
  { key: "certeira", nome: "Certeira", descricao: "Reduza a margem de crítico da arma em 1. Uma arma não pode ser certeira e destruidora ao mesmo tempo.", preRequisito: "" },
  { key: "compartimento", nome: "Compartimento", descricao: "Um compartimento pode armazenar um item de Mistura (óleo ou veneno). Durante combate, usar a mistura armazenada é uma ação livre.", preRequisito: "" },
  { key: "complementar", nome: "Complementar", descricao: "Enquanto empunhar esta arma o portador recebe +2 na sua CD de Especialização e de Estilo Marcial.", preRequisito: "" },
  { key: "cruel", nome: "Cruel", descricao: "A arma recebe +3 em rolagens de dano.", preRequisito: "" },
  { key: "defensora", nome: "Defensora", descricao: "A arma recebe o traço de arma: Aparar. Se já possuir o traço, o bônus em Defesa fornecido por Aparar aumenta em 1.", preRequisito: "Apenas armas corpo a corpo" },
  { key: "destruidora", nome: "Destruidora", descricao: "A arma causa um dado de dano adicional em um acerto crítico. Não pode ser destruidora e certeira ao mesmo tempo.", preRequisito: "" },
  { key: "discreta", nome: "Discreta", descricao: "Você recebe +5 em rolagens de Furtividade e Prestidigitação para esconder apenas a arma.", preRequisito: "" },
  { key: "drenadora", nome: "Drenadora", descricao: "Uma vez por turno, ao matar uma criatura que utiliza energia amaldiçoada com esta arma, o portador recebe 2 PE temporários para cada grau que a criatura possua.", preRequisito: "" },
  { key: "elemental", nome: "Elemental", descricao: "Você pode trocar o tipo de dano da arma para um dano elemental à sua escolha. Depois de feita essa escolha não pode ser mudada.", preRequisito: "Ferramenta de Segundo Grau" },
  { key: "harmonizada", nome: "Harmonizada", descricao: "Sempre que acertar um ataque crítico, você reduz em 1 o custo da próxima habilidade que gaste PE ou Pontos de Estamina até o fim do seu próximo turno.", preRequisito: "" },
  { key: "horrenda", nome: "Horrenda", descricao: "Enquanto empunhar esta arma, toda habilidade que exige um TR e cause Abalado ou Amedrontado tem sua CD aumentada em um valor igual ao bônus de ferramenta da arma.", preRequisito: "Já possuir outro encantamento" },
  { key: "longa", nome: "Longa", descricao: "O alcance da arma aumenta em 1,5 metros.", preRequisito: "Apenas armas corpo a corpo" },
  { key: "otimizada", nome: "Otimizada", descricao: "Sacar a arma é uma Ação Livre e, enquanto empunhá-la, o portador recebe +2 em testes de Iniciativa.", preRequisito: "" },
  { key: "penetrante", nome: "Penetrante", descricao: "Todo ataque com esta ferramenta ignora redução de dano em um valor igual ao bônus de treinamento do portador.", preRequisito: "" },
  { key: "poderosa", nome: "Poderosa", descricao: "Adiciona +2 às rolagens de dano da arma.", preRequisito: "Ter Cruel na arma" },
  { key: "potente", nome: "Potente", descricao: "Adiciona mais um dado de dano ao dano padrão da arma.", preRequisito: "Primeiro Grau" },
  { key: "precisa", nome: "Precisa", descricao: "Você recebe um bônus de +2 em jogadas de ataque manejando esta arma.", preRequisito: "" },
  { key: "reluzente", nome: "Reluzente", descricao: "Concede +2 em testes para fintar. Acerto crítico contra uma criatura força TR contra CD de especialização/estilo marcial; em falha, fica Desprevenida (ou Cega se já estiver). Causa -5 de penalidade em Furtividade.", preRequisito: "" },
  { key: "retorno", nome: "Retorno", descricao: "Ao arremessar a arma, desde que não esteja completamente presa, retorna para a mão do portador logo após completar o ataque.", preRequisito: "Arma de arremesso" },
  { key: "sintonizada", nome: "Sintonizada", descricao: "Escolha um tipo de dano (exceto físicos ou na alma); quando causar dano desse tipo com Feitiço ou Aptidão, até o final do próximo turno, ataques com esta arma causam 1d8 de dano adicional do mesmo tipo.", preRequisito: "Ferramenta de Segundo Grau" }
];

/**
 * Enchantments available for shields.
 */
export const ENCANTAMENTOS_ESCUDO = [
  { key: "avassalador", nome: "Avassalador", descricao: "Caso seja usado para atacar, o dano dele conta como três níveis acima.", preRequisito: "Ter Destruidor no escudo" },
  { key: "bloqueador", nome: "Bloqueador", descricao: "Qualquer criatura atrás de você a 1,5 metros recebe os efeitos de Meia Cobertura.", preRequisito: "" },
  { key: "destruidor", nome: "Destruidor", descricao: "Caso seja usado para atacar, o dano dele conta como dois níveis acima.", preRequisito: "Ter Espinhoso no escudo" },
  { key: "disco", nome: "Disco", descricao: "Este escudo recebe o traço Arremesso (6/18).", preRequisito: "Apenas escudos leves e médios" },
  { key: "espinhoso", nome: "Espinhoso", descricao: "Caso seja usado para atacar, o dano dele conta como um nível acima.", preRequisito: "" },
  { key: "esponja", nome: "Esponja", descricao: "Ao cair ou sofrer dano de estrutura, gaste reação para reduzir o dano em 10 (15 no segundo grau, 20 no primeiro).", preRequisito: "" },
  { key: "expansao_de_escudo", nome: "Expansão de Escudo", descricao: "Como uma ação bônus, o escudo se fragmenta numa versão maior. Escolha uma segunda criatura dentro de 1,5m para receber os benefícios do escudo.", preRequisito: "" },
  { key: "intangivel", nome: "Intangível", descricao: "O escudo não ocupa a mão do portador para propósitos de habilidades, mas ainda não permite empunhar outros objetos.", preRequisito: "" },
  { key: "isolante_escudo", nome: "Isolante", descricao: "A RD do escudo passa a ser aplicada também contra um tipo de dano elemental à sua escolha. Pode ser pega diversas vezes para tipos diferentes.", preRequisito: "" },
  { key: "polido", nome: "Polido", descricao: "A penalidade do escudo é reduzida em 2.", preRequisito: "" },
  { key: "reforcado", nome: "Reforçado", descricao: "Recebe 2 de RD adicional contra dano físico.", preRequisito: "" }
];

/**
 * Enchantments available for uniforms.
 */
export const ENCANTAMENTOS_UNIFORME = [
  { key: "aeronauta", nome: "Aeronauta", descricao: "Enquanto estiver caindo, como reação pode puxar as roupas e planar no ar; no final dos turnos cai apenas 6 metros até chegar ao chão.", preRequisito: "" },
  { key: "ajustado", nome: "Ajustado", descricao: "A penalidade do uniforme é reduzida em 1. Se já possuir 0 de penalidade, concede +2 em Furtividade.", preRequisito: "" },
  { key: "blindado", nome: "Blindado", descricao: "A Defesa concedida pelo uniforme aumenta em 2.", preRequisito: "" },
  { key: "distorcivo", nome: "Distorcivo", descricao: "Possui cargas. Uma vez por turno, como Ação Livre, use uma carga para se mover 6 metros sem provocar ataque de oportunidade.", preRequisito: "" },
  { key: "escaldante", nome: "Escaldante", descricao: "Criatura agarrada ou que agarra o portador deve TR contra CD de Especialização; em falha, recebe Xd6 perda de vida (X = metade do bônus de treinamento), ou metade em sucesso.", preRequisito: "" },
  { key: "estimulante", nome: "Estimulante", descricao: "Possui cargas. Gaste reação e uma carga para conceder vantagem a uma rolagem de Fortitude, Reflexos ou Vontade.", preRequisito: "" },
  { key: "furtivo", nome: "Furtivo", descricao: "O portador recebe um bônus em Furtividade igual ao custo do uniforme.", preRequisito: "" },
  { key: "impulso", nome: "Impulso", descricao: "Possui cargas. Gaste uma carga e ação de movimento para percorrer linha do dobro do movimento. Estruturas/criaturas no caminho fazem TR de Reflexos ou sofrem 1d10 de impacto por cada 6m.", preRequisito: "Propulsor" },
  { key: "isolante_uniforme", nome: "Isolante", descricao: "Concede 5 de RD contra dano Queimante e Congelante.", preRequisito: "" },
  { key: "marcial", nome: "Marcial", descricao: "Concede +2 em testes para realizar manobras.", preRequisito: "" },
  { key: "material_pesado", nome: "Material Pesado", descricao: "Concede +2 em TRs de Fortitude.", preRequisito: "O uniforme precisa possuir revestimento médio ou robusto" },
  { key: "propulsor", nome: "Propulsor", descricao: "Enquanto vestir o uniforme o usuário recebe 3 metros de Deslocamento adicional.", preRequisito: "" },
  { key: "repulsor", nome: "Repulsor", descricao: "Possui cargas. Como Reação a ataque corpo-a-corpo, toda criatura a 1,5m faz TR de Fortitude; em falha, é empurrada 3m.", preRequisito: "Ferramenta de pelo menos segundo grau" },
  { key: "resiliente", nome: "Resiliente", descricao: "Concede RD 5 contra um tipo de dano (exceto físicos, alma e energética). RD aumenta para 10 no Grau Especial.", preRequisito: "" },
  { key: "revestido_com_espinhos", nome: "Revestido com Espinhos", descricao: "Ao ser alvo de ataque corpo a corpo por agressor adjacente, este faz TR de Fortitude; em falha, recebe Xd6 + mod. constituição de dano perfurante (X = bônus de treinamento).", preRequisito: "" },
  { key: "ricochete", nome: "Ricochete", descricao: "20% de chance de falha contra ataque a distância. Possui cargas: gaste uma carga como reação para aumentar para 50% até o próximo turno.", preRequisito: "" }
];

/**
 * Returns the enchantment catalog for a given item type.
 * @param {"arma"|"escudo"|"uniforme"} tipo
 * @returns {Array}
 */
export function getEncantamentosCatalog(tipo) {
  if (tipo === 'arma') return ENCANTAMENTOS_ARMA;
  if (tipo === 'escudo') return ENCANTAMENTOS_ESCUDO;
  if (tipo === 'uniforme') return ENCANTAMENTOS_UNIFORME;
  return [];
}

/**
 * Returns the grade table for a given item type.
 * @param {"arma"|"escudo"|"uniforme"} tipo
 * @returns {Object}
 */
export function getGrauTable(tipo) {
  if (tipo === 'arma') return GRAU_ARMA;
  if (tipo === 'escudo') return GRAU_ESCUDO;
  if (tipo === 'uniforme') return GRAU_UNIFORME;
  return {};
}

/**
 * Returns the total number of enchantment slots earned up to (and including) the given grade.
 * Enchantments accumulate across grades.
 * @param {"arma"|"escudo"|"uniforme"} tipo
 * @param {string} grau - Current grade key (e.g., "terceiro")
 * @returns {number}
 */
export function getTotalEncantamentoSlots(tipo, grau) {
  const table = getGrauTable(tipo);
  const order = ["quarto", "terceiro", "segundo", "primeiro", "especial"];
  let total = 0;
  for (const g of order) {
    total += table[g]?.encantamentos ?? 0;
    if (g === grau) break;
  }
  return total;
}
