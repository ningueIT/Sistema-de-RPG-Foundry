// Constantes e tabelas para o sistema de inimigos (Grimório)
export const NPC_CONSTANTS = {
  ATTRIBUTE_LIMITS: {
    lacaio: 20,
    capanga: 24,
    comum: 26,
    desafio: 30,
    calamidade: 32
  },

  // Base de PV por ND para cada patamar (utilizada como base * ND)
  VITALS_BASE_PER_ND: {
    capanga: 40,
    comum: 60,
    desafio: 90,
    calamidade: 180
  },

  // Bônus de atenção por patamar (adicional ao cálculo)
  ATTENTION_BONUS: {
    lacaio: 0,
    capanga: 5,
    comum: 10,
    desafio: 15,
    calamidade: 20
  }
};

export default NPC_CONSTANTS;

// Tabela de regeneração: multiplicador do Mod CON por Patamar x BT
export const REGEN_TABLE = {
  lacaio: { 2: null, 3: null, 4: null, 5: null, 6: null },
  capanga: { 2: null, 3: null, 4: 4, 5: 5, 6: 6 },
  comum:  { 2: null, 3: 3,    4: 4, 5: 7,  6: 12 },
  desafio:{ 2: null, 3: 3,    4: 6, 5: 10, 6: 12 },
  calamidade:{ 2: null,3: 3,   4: 6, 5: 10, 6: 12 }
};

export { };

// Movimento padrão por tamanho (metros)
export const SIZE_MOVEMENT = {
  minusculo: 9,
  pequeno: 9,
  medio: 9,
  grande: 12,
  enorme: 13.5,
  colossal: 18
};

// Limites de imunidades / resistências / vulnerabilidades por patamar
export const DEFENSE_LIMITS = {
  lacaio: { imunidades: 0, resistencias: 0, vulnerabilidades: 0, condicoesImunidades: 0 },
  capanga: { imunidades: 0, resistencias: 0, vulnerabilidades: 0, condicoesImunidades: 0 },
  comum: { imunidades: 1, resistencias: 2, vulnerabilidades: 1, condicoesImunidades: 5 },
  desafio: { imunidades: 3, resistencias: 3, vulnerabilidades: 3, condicoesImunidades: 6 },
  calamidade: { imunidades: 6, resistencias: 4, vulnerabilidades: 6, condicoesImunidades: 7 }
};

// Configurações relacionadas a Ações e Condições (Guia de Ações do Grimório)
export const ACTION_CONSTANTS = {
  // Como calcular número de ações por Patamar/ND
  ACTIONS_BY_PATAMAR: {
    lacaio: { baseCommon: 1, perNd: 0, rapideBase: 1, rapidePerNd: 0, bonus: 1, move: 1, reaction: 1 },
    capanga: { baseCommon: 1, perNd: 0, rapideBase: 1, rapidePerNd: 0, bonus: 1, move: 1, reaction: 1 },
    comum:  { baseCommon: 1, perNd: 5, rapideBase: 1, rapidePerNd: 10, bonus: 1, move: 1, reaction: 1 },
    desafio:{ baseCommon: 2, perNd: 8, rapideBase: 1, rapidePerNd: 8,  bonus: 1, move: 1, reaction: 1 },
    calamidade:{ baseCommon: 3, perNd:10, rapideBase:1, rapidePerNd:10, bonus: 1, move: 1, reaction: 1 }
  },

  // Tabela de Treinamento → Alcance Máximo / Área Máxima / Redução ao converter para CaC
  TRAINING_TABLE: {
    2: { alcanceMaxM: 12, areaMaxM: 4.5, meleeDiceReduction: 1 },
    3: { alcanceMaxM: 18, areaMaxM: 6,   meleeDiceReduction: 1 },
    4: { alcanceMaxM: 24, areaMaxM: 9,   meleeDiceReduction: 2 },
    5: { alcanceMaxM: 30, areaMaxM: 12,  meleeDiceReduction: 2 },
    6: { alcanceMaxM: 48, areaMaxM: 18,  meleeDiceReduction: 3 }
  },

  // Conversão: 1 dado de dano = +2 Acerto = +1 CD
  DICE_TO_CONVERSION: {
    1: { ataqueBonus: 2, cdBonus: 1 },
    2: { ataqueBonus: 4, cdBonus: 2 },
    3: { ataqueBonus: 6, cdBonus: 3 }
  },

  // Aplicação de condições via BT (valor relativo do BT → nível de condição / custo PE / ND reduzido)
  CONDITION_BY_BT: {
    2: { level: 'fraca',   custoPe: 2, ndReduction: 1 },
    3: { level: 'media',   custoPe: 5, ndReduction: 2 },
    4: { level: 'forte',   custoPe: 8, ndReduction: 3 },
    5: { level: 'extrema', custoPe:10, ndReduction: 4 }
  }
};

