export const BOILERPLATE = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
BOILERPLATE.abilities = {
  str: 'BOILERPLATE.Ability.Str.long',
  dex: 'BOILERPLATE.Ability.Dex.long',
  con: 'BOILERPLATE.Ability.Con.long',
  int: 'BOILERPLATE.Ability.Int.long',
  wis: 'BOILERPLATE.Ability.Wis.long',
  cha: 'BOILERPLATE.Ability.Cha.long',
};

BOILERPLATE.abilityAbbreviations = {
  str: 'BOILERPLATE.Ability.Str.abbr',
  dex: 'BOILERPLATE.Ability.Dex.abbr',
  con: 'BOILERPLATE.Ability.Con.abbr',
  int: 'BOILERPLATE.Ability.Int.abbr',
  wis: 'BOILERPLATE.Ability.Wis.abbr',
  cha: 'BOILERPLATE.Ability.Cha.abbr',
};

export const FEITICEIROS = {};

// Escolas de feitiço / tipos
FEITICEIROS.spellSchools = {
  extensao: 'Extensão',
  aptidao: 'Aptidão',
  barreira: 'Barreira',
  dominio: 'Domínio',
  shikigami: 'Shikigami'
};

// Abilities usadas pelo sistema (rótulos em Português)
FEITICEIROS.abilities = {
  'for': 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  car: 'Carisma'
};

// Tipos / identificadores de classe usados pelo sistema
FEITICEIROS.classTypes = {
  lutador: 'Lutador',
  especialistaCombate: 'Especialista em Combate',
  especialistaTecnica: 'Especialista em Técnica',
  controlador: 'Controlador',
  suporte: 'Suporte',
  restringido: 'Restringido'
};

// Configuração completa de classes (fonte da verdade)
FEITICEIROS.classes = {
  lutador: {
    label: 'Lutador',
    hp: { initial: 10, perLevel: 6 },
    ep: { initial: 5, perLevel: 3 },
    progression: {
      2: { features: 1, aptitudes: 1 },
      3: { features: 1, aptitudes: 0 },
      4: { features: 1, aptitudes: 1 },
      5: { features: 2, aptitudes: 1 }
    }
  },
  controlador: {
    label: 'Controlador',
    hp: { initial: 8, perLevel: 5 },
    ep: { initial: 10, perLevel: 6 },
    progression: {
      2: { features: 1, aptitudes: 1 },
      3: { features: 1, aptitudes: 1 },
      4: { features: 1, aptitudes: 0 },
      5: { features: 2, aptitudes: 1 }
    }
  },
  especialistaTecnica: {
    label: 'Especialista em Técnica',
    hp: { initial: 8, perLevel: 5 },
    ep: { initial: 8, perLevel: 5 },
    progression: {}
  },
  especialistaCombate: {
    label: 'Especialista em Combate',
    hp: { initial: 9, perLevel: 5 },
    ep: { initial: 6, perLevel: 4 },
    progression: {}
  },
  suporte: {
    label: 'Suporte',
    hp: { initial: 7, perLevel: 4 },
    ep: { initial: 10, perLevel: 6 },
    progression: {}
  },
  restringido: {
    label: 'Restringido',
    hp: { initial: 6, perLevel: 3 },
    ep: { initial: 4, perLevel: 2 },
    progression: {}
  }
};
