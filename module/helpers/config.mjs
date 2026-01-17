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
