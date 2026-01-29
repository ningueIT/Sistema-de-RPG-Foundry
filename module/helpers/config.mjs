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

// Configurações de origens (ex: Maldição) e progressão fixa por variante
FEITICEIROS.origins = {
  maldicao: {
    // Mapear nome da raça (valor salvo em `system.detalhes.racaMaldicao.value`) -> progressão
    "Aberração Etérea": {
      progression: {
        // nível: { fixed: [ { pack: 'world.habilidades-amaldicoadas', name: 'Nome da Habilidade' }, ... ] }
        1: { fixed: [ { pack: 'world.habilidades-amaldicoadas', name: 'Instinto de Predador Amaldiçoado' } ] },
        4: { fixed: [ { pack: 'world.habilidades-amaldicoadas', name: 'Transcendência Amaldiçoada' } ] },
        10: { fixed: [ { pack: 'world.habilidades-amaldicoadas', name: 'Fisiologia Amaldiçoada: Núcleo Móvel' } ] }
      }
    }
    ,
    "Colosso Carniçal": {
      progression: {
        1: { fixed: [ { pack: 'world.habilidades-origem', name: 'Mandíbula Ancestral' } ] },
        5: { fixed: [ { pack: 'world.habilidades-origem', name: 'Predador Alfa' } ] },
        10: { fixed: [ { pack: 'world.habilidades-origem', name: 'Rugido Primitivo' } ] },
        15: { fixed: [ { pack: 'world.habilidades-origem', name: 'Pele de Escamas' } ] },
        20: { fixed: [ { pack: 'world.habilidades-origem', name: 'Ápice da Cadeia' } ] }
      }
    }
    ,
    "Soberano Carmesim": {
      progression: {
        1: { fixed: [ { pack: 'world.habilidades-origem', name: 'Aura do Imperador' } ] },
        5: { fixed: [ { pack: 'world.habilidades-origem', name: 'Armamento Régio' } ] },
        10: { fixed: [ { pack: 'world.habilidades-origem', name: 'Decreto Absoluto' } ] },
        15: { fixed: [ { pack: 'world.habilidades-origem', name: 'Esquife de Sangue' } ] },
        20: { fixed: [ { pack: 'world.habilidades-origem', name: 'Trono de Gelo' } ] }
      }
    }
    ,
    "Parasita do Vazio": {
      progression: {
        1: { fixed: [ { pack: 'world.habilidades-origem', name: 'Toque da Irrealidade' } ] },
        5: { fixed: [ { pack: 'world.habilidades-origem', name: 'Dobra Espacial' } ] },
        10: { fixed: [ { pack: 'world.habilidades-origem', name: 'Fratura Mental' } ] },
        15: { fixed: [ { pack: 'world.habilidades-origem', name: 'Anatomia Não-Euclidiana' } ] },
        20: { fixed: [ { pack: 'world.habilidades-origem', name: 'Horizonte de Eventos' } ] }
      }
    }
    ,
    "Vetor da Calamidade": {
      progression: {
        1: { fixed: [ { pack: 'world.habilidades-origem', name: 'Campo de Entropia' } ] },
        5: { fixed: [ { pack: 'world.habilidades-origem', name: 'Lei de Murphy' } ] },
        10: { fixed: [ { pack: 'world.habilidades-origem', name: 'Gato Preto' } ] },
        15: { fixed: [ { pack: 'world.habilidades-origem', name: 'Contágio do Infortúnio' } ] },
        20: { fixed: [ { pack: 'world.habilidades-origem', name: 'Colapso Probabilístico' } ] }
      }
    }
  }
};

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
