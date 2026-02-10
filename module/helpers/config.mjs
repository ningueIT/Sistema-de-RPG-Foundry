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
    "Zênite da Soberba": {
      progression: {
        1: { fixed: [ { pack: 'world.habilidades-origem', name: 'Postura da Estátua' } ] },
        5: { fixed: [ { pack: 'world.habilidades-origem', name: 'Retaliação Solar' } ] },
        10: { fixed: [ { pack: 'world.habilidades-origem', name: 'Levitação Divina' } ] },
        15: { fixed: [ { pack: 'world.habilidades-origem', name: 'Corpo de Ouro' } ] },
        20: { fixed: [ { pack: 'world.habilidades-origem', name: 'Supernova' } ] }
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
    // Guia v2.5.2: PV inicial 16 + CON, PV por nível 1d12 (ou 7) + CON, PE por nível 4
    hp: { initial: 16, perLevelFixed: 12, die: '1d12' },
    ep: { perLevel: 4 },
    progression: {}
  },
  controlador: {
    label: 'Controlador',
    // Guia v2.5.2: PV inicial 10 + CON, PV por nível 1d8 (ou 5) + CON, PE por nível 5
    hp: { initial: 10, perLevelFixed: 11, die: '1d8' },
    ep: { perLevel: 5 },
    progression: {}
  },
  especialistaTecnica: {
    label: 'Especialista em Técnica',
    // Guia v2.5.2: PV inicial 8 + CON, PV por nível 1d6 (ou 4) + CON, PE por nível 6
    hp: { initial: 8, perLevelFixed: 10, die: '1d6' },
    ep: { perLevel: 6 },
    progression: {}
  },
  especialistaCombate: {
    label: 'Especialista em Combate',
    // Guia v2.5.2: PV inicial 12 + CON, PV por nível 1d10 (ou 6) + CON, PE por nível 4
    hp: { initial: 12, perLevelFixed: 12, die: '1d10' },
    ep: { perLevel: 4 },
    progression: {}
  },
  suporte: {
    label: 'Suporte',
    // Guia v2.5.2: PV inicial 10 + CON, PV por nível 1d8 (ou 5) + CON, PE por nível 5
    hp: { initial: 10, perLevelFixed: 11, die: '1d8' },
    ep: { perLevel: 5 },
    progression: {}
  },
  restringido: {
    label: 'Restringido',
    hp: { initial: 6, perLevel: 3 },
    ep: { initial: 4, perLevel: 2 },
    progression: {}
  }
};

// ------------------------------------------------------------
// Progressão por nível de CLASSE (1..20)
// Regras do guia: em níveis com "Habilidade de [Classe]" => 1 escolha (features).
// Aptidão Amaldiçoada: 1 por nível (aqui aplicamos a partir do nível 2, pois nível 1 costuma ser criação).
// Alguns níveis concedem escolhas adicionais (ex: novas manobras/estilos/apogeu/apoiar avançado).
// ------------------------------------------------------------
const _mkProg = (opts = {}) => {
  const prog = {};
  for (let lvl = 1; lvl <= 20; lvl++) {
    const isCreation = lvl === 1;
    const aptitudes = isCreation ? 0 : 1;
    const features = (lvl >= 2) ? 1 : 0;
    prog[String(lvl)] = { aptitudes, features };
  }
  // Extras por classe
  for (const lvl of (opts.extraFeatureLevels ?? [])) {
    const k = String(lvl);
    if (prog[k]) prog[k].features = (Number(prog[k].features ?? 0) || 0) + 1;
  }
  return prog;
};

FEITICEIROS.classes.lutador.progression = _mkProg({
  // Nova Manobra de Empolgação (além da habilidade normal): 6, 12, 18
  extraFeatureLevels: [6, 12, 18]
});

FEITICEIROS.classes.especialistaCombate.progression = _mkProg({
  // Novo Estilo de Combate (além da habilidade normal): 6, 12
  extraFeatureLevels: [6, 12]
});

FEITICEIROS.classes.especialistaTecnica.progression = _mkProg();

FEITICEIROS.classes.controlador.progression = _mkProg({
  // Escolha de Apogeu (além da habilidade normal): 6
  extraFeatureLevels: [6]
});

FEITICEIROS.classes.suporte.progression = _mkProg({
  // Novo Apoio Avançado (além da habilidade normal): 12
  extraFeatureLevels: [12]
});

// ------------------------------------------------------------
// Habilidades FIXAS por nível de CLASSE
// Essas habilidades são concedidas automaticamente e devem ser removidas
// quando a classe do personagem mudar.
// ------------------------------------------------------------

// Lutador — nível 1
FEITICEIROS.classes.lutador.progression["1"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Corpo Treinado' },
  { pack: 'world.habilidades-amaldicoadas', name: 'Empolgação' }
];

// Lutador — nível 2 (fixas adicionais)
FEITICEIROS.classes.lutador.progression["2"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Reflexo Evasivo' }
];

// Lutador — nível 5
FEITICEIROS.classes.lutador.progression["5"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Gosto pela Luta' }
];

// Lutador — nível 20
FEITICEIROS.classes.lutador.progression["20"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Lutador Superior' }
];

// Especialista em Combate — nível 1
FEITICEIROS.classes.especialistaCombate.progression["1"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Repertório do Especialista' },
  { pack: 'world.habilidades-amaldicoadas', name: 'Artes do Combate' }
];

// Especialista em Combate — nível 4
FEITICEIROS.classes.especialistaCombate.progression["4"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Golpe Especial' },
  { pack: 'world.habilidades-amaldicoadas', name: 'Implemento Marcial' }
];

// Especialista em Combate — nível 6
FEITICEIROS.classes.especialistaCombate.progression["6"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Renovação pelo Sangue' }
];

// Especialista em Combate — nível 9
FEITICEIROS.classes.especialistaCombate.progression["9"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Teste de Resistência Mestre' }
];

// Especialista em Combate — nível 20
FEITICEIROS.classes.especialistaCombate.progression["20"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Autossuficiente' }
];

// Controlador — nível 1
FEITICEIROS.classes.controlador.progression["1"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Treinamento em Controle' }
];

// Controlador — nível 4
FEITICEIROS.classes.controlador.progression["4"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Controle Aprimorado' }
];

// Controlador — nível 6
FEITICEIROS.classes.controlador.progression["6"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Apogeu' }
];

// Controlador — nível 9
FEITICEIROS.classes.controlador.progression["9"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Teste de Resistência Mestre' }
];

// Controlador — nível 10
FEITICEIROS.classes.controlador.progression["10"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Reserva para Invocação' }
];

// Controlador — nível 20
FEITICEIROS.classes.controlador.progression["20"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Ápice do Controle' }
];

// Suporte — nível 1
FEITICEIROS.classes.suporte.progression["1"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Suporte em Combate' }
];

// Suporte — nível 3
FEITICEIROS.classes.suporte.progression["3"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Presença Inspiradora' }
];

// Suporte — nível 5
FEITICEIROS.classes.suporte.progression["5"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Versatilidade' }
];

// Suporte — nível 6
FEITICEIROS.classes.suporte.progression["6"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Energia Reversa' }
];

// Suporte — nível 8
FEITICEIROS.classes.suporte.progression["8"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Liberação de Energia Reversa' }
];

// Suporte — nível 9
FEITICEIROS.classes.suporte.progression["9"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Teste de Resistência Mestre' }
];

// Suporte — nível 10
FEITICEIROS.classes.suporte.progression["10"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Medicina Infalível' }
];

// Suporte — nível 20
FEITICEIROS.classes.suporte.progression["20"].fixed = [
  { pack: 'world.habilidades-amaldicoadas', name: 'Suporte Absoluto' }
];
