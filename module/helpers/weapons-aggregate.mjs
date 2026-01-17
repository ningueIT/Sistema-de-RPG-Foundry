// Minimal, safe weapons aggregate to avoid parsing errors during import.
// Lista básica e ampliada de armas do sistema. Cada entrada inclui o `type` e um bloco mínimo
// `system.damage.base.value` para que o importador consiga popular o compêndio.
export const TODAS_AS_ARMAS = [
  { name: "Adaga", type: "arma", system: { damage: { base: { value: "1d4" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Adaga de Arremesso", type: "arma", system: { damage: { base: { value: "1d4" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Espada Curta", type: "arma", system: { damage: { base: { value: "1d6" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Espada Longa", type: "arma", system: { damage: { base: { value: "1d8" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Espada Bastarda", type: "arma", system: { damage: { base: { value: "1d10" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Espadão", type: "arma", system: { damage: { base: { value: "2d6" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Rapiera", type: "arma", system: { damage: { base: { value: "1d8" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Scimitarra", type: "arma", system: { damage: { base: { value: "1d6" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Machado de Mão", type: "arma", system: { damage: { base: { value: "1d6" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Machado de Batalha", type: "arma", system: { damage: { base: { value: "1d10" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Clava", type: "arma", system: { damage: { base: { value: "1d8" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Maça", type: "arma", system: { damage: { base: { value: "1d8" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Martelo de Guerra", type: "arma", system: { damage: { base: { value: "1d10" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Lança Curta", type: "arma", system: { damage: { base: { value: "1d6" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Lança Longa", type: "arma", system: { damage: { base: { value: "1d8" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Alabarda", type: "arma", system: { damage: { base: { value: "1d10" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Foice", type: "arma", system: { damage: { base: { value: "1d6" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Arco Curto", type: "arma", system: { damage: { base: { value: "1d6" } }, ataque: { acao: { value: "rwak" } } } },
  { name: "Arco Longo", type: "arma", system: { damage: { base: { value: "1d8" } }, ataque: { acao: { value: "rwak" } } } },
  { name: "Bestas Leve", type: "arma", system: { damage: { base: { value: "1d8" } }, ataque: { acao: { value: "rwak" } } } },
  { name: "Besta Pesada", type: "arma", system: { damage: { base: { value: "1d10" } }, ataque: { acao: { value: "rwak" } } } },
  { name: "Fundíbulo (Besta de Mão)", type: "arma", system: { damage: { base: { value: "1d6" } }, ataque: { acao: { value: "rwak" } } } },
  { name: "Javali (Arremesso)", type: "arma", system: { damage: { base: { value: "1d6" } }, ataque: { acao: { value: "mwak" } } } },
  { name: "Cerbatanas", type: "arma", system: { damage: { base: { value: "1d4" } }, ataque: { acao: { value: "rwak" } } } },
  { name: "Funda", type: "arma", system: { damage: { base: { value: "1d4" } }, ataque: { acao: { value: "rwak" } } } }
  ,
  // ==========================================
  // ARMAS SOLICITADAS (DETALHADAS)
  // ==========================================

  // --- SIMPLES CORPO-A-CORPO ---
  {
    name: "Bastão",
    type: "arma",
    img: "icons/weapons/staves/staff-simple.webp",
    system: {
      descricao: { value: "<p>Um bastão de madeira polida ou metal. <strong>Versátil (1d8).</strong></p>" },
      damage: { base: { value: "1d6" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        alcance: { valor: { value: 1.5 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "uma mão" } }
      }
    }
  },
  {
    name: "Faixas",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/equipment/hand/glove-leather-red.svg",
    system: {
      descricao: { value: "<p>Bandagens reforçadas com energia amaldiçoada. Conta como <strong>Dano Desarmado</strong>.</p>" },
      damage: { base: { value: "1d4" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        critico: { min: { value: 20 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Leque",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/thrown/shuriken-fan-steel.svg",
    system: {
      descricao: { value: "<p>Leque de combate com hastes de aço. <strong>Ágil.</strong></p>" },
      damage: { base: { value: "1d6" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        critico: { min: { value: 18 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Mangual",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/maces/flail-ball-chain.svg",
    system: {
      descricao: { value: "<p>Esfera de metal presa a um cabo por corrente. Ignora escudos.</p>" },
      damage: { base: { value: "1d8" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        critico: { min: { value: 20 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Soco Inglês",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/equipment/hand/gauntlet-simple-steel.svg",
    system: {
      descricao: { value: "<p>Peça de metal para os dedos. Aumenta o impacto do soco.</p>" },
      damage: { base: { value: "1d6" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        critico: { min: { value: 20 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Tridente",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/polearms/trident-gold.svg",
    system: {
      descricao: { value: "<p>Lança de três pontas. <strong>Versátil (1d8).</strong> Pode ser arremessado.</p>" },
      damage: { base: { value: "1d6" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        critico: { min: { value: 19 }, mult: { value: 2 } }
      }
    }
  },

  // --- SIMPLES DISTÂNCIA / ARREMESSO ---
  {
    name: "Pistola",
    type: "arma",
    img: "icons/weapons/guns/gun-pistol-flintlock-metal.webp",
    system: {
      descricao: { value: "<p>Arma de fogo leve. <strong>Recarga.</strong></p>" },
      damage: { base: { value: "1d10" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 18 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Azagaia",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/polearms/javelin-point-steel.svg",
    system: {
      descricao: { value: "<p>Lança leve balanceada para voo. <strong>Arremesso.</strong></p>" },
      damage: { base: { value: "1d6" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "forca" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 9 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Dardo",
    type: "arma",
    img: "icons/weapons/thrown/dart-feathered.webp",
    system: {
      descricao: { value: "<p>Pequeno e preciso. <strong>Ágil, Arremesso.</strong></p>" },
      damage: { base: { value: "1d4" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 6 }, unidade: { value: "m" } },
        critico: { min: { value: 18 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Faca de Arremesso",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/daggers/dagger-throwing.svg",
    system: {
      descricao: { value: "<p>Lâmina aerodinâmica. <strong>Ágil, Arremesso.</strong></p>" },
      damage: { base: { value: "1d6" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 6 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 2 } }
      }
    }
  },

  // --- COMPLEXAS CORPO-A-CORPO ---
  {
    name: "Adagas Duplas",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/daggers/daggers-set-black.svg",
    system: {
      descricao: { value: "<p>Par de lâminas rápidas. <strong>Ágil, Duas Mãos.</strong></p>" },
      damage: { base: { value: "2d4" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        critico: { min: { value: 18 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Adaga de Aparar",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/daggers/dagger-guard-gold.svg",
    system: {
      descricao: { value: "<p>Adaga defensiva. <strong>Ágil.</strong></p>" },
      damage: { base: { value: "1d4" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        critico: { min: { value: 18 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Chicote",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/whips/whip-leather-brown.svg",
    system: {
      descricao: { value: "<p>Tira de couro flexível. <strong>Ágil, Alcance, Derrubar.</strong></p>" },
      damage: { base: { value: "1d4" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        alcance: { valor: { value: 3 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Corrente de Aço",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/chains/chain-steel.svg",
    system: {
      descricao: { value: "<p>Corrente pesada. <strong>Ágil, Alcance, Versátil (2d6).</strong></p>" },
      damage: { base: { value: "2d4" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        alcance: { valor: { value: 3 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Katana",
    type: "arma",
    img: "icons/weapons/swords/sword-katana.webp",
    system: {
      descricao: { value: "<p>Espada oriental de corte preciso. <strong>Ágil, Versátil (1d8).</strong></p>" },
      damage: { base: { value: "1d6" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        critico: { min: { value: 19 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Espada Grande",
    type: "arma",
    img: "icons/weapons/swords/greatsword-crossguard-steel.webp",
    system: {
      descricao: { value: "<p>Montante pesado. <strong>Duas Mãos.</strong></p>" },
      damage: { base: { value: "1d12" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        critico: { min: { value: 20 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Espada Colossal",
    type: "arma",
    img: "icons/weapons/swords/greatsword-blue.webp",
    system: {
      descricao: { value: "<p>Lâmina gigantesca. <strong>Duas Mãos, Pesada.</strong></p>" },
      damage: { base: { value: "2d8" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        critico: { min: { value: 20 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Foice Grande",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/polearms/scythe-large.svg",
    system: {
      descricao: { value: "<p>Foice de combate longa. <strong>Duas Mãos, Versátil (1d10).</strong></p>" },
      damage: { base: { value: "1d8" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        critico: { min: { value: 20 }, mult: { value: 4 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Kusarigama",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/polearms/scythe-chain.svg",
    system: {
      descricao: { value: "<p>Foice curta com corrente. <strong>Ágil, Alcance, Duas Mãos.</strong></p>" },
      damage: { base: { value: "1d6" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        alcance: { valor: { value: 3 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Lança Grande",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/polearms/pike-head.svg",
    system: {
      descricao: { value: "<p>Pique de infantaria. <strong>Alcance, Duas Mãos.</strong></p>" },
      damage: { base: { value: "1d12" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        alcance: { valor: { value: 3 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 3 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Machado Grande",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/axes/axe-battle-red.svg",
    system: {
      descricao: { value: "<p>Machado de batalha. <strong>Duas Mãos.</strong></p>" },
      damage: { base: { value: "1d10" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        critico: { min: { value: 20 }, mult: { value: 3 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Martelo Grande",
    type: "arma",
    img: "icons/weapons/hammers/hammer-war-spiked.webp",
    system: {
      descricao: { value: "<p>Marreta de demolição. <strong>Duas Mãos.</strong></p>" },
      damage: { base: { value: "1d12" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        critico: { min: { value: 20 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Nunchaku",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/maces/flail-nunchuck.svg",
    system: {
      descricao: { value: "<p>Bastões articulados. <strong>Ágil.</strong></p>" },
      damage: { base: { value: "1d8" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        critico: { min: { value: 19 }, mult: { value: 2 } }
      }
    }
  },

  // --- COMPLEXAS DISTÂNCIA ---
  {
    name: "Bazuca",
    type: "arma",
    img: "icons/weapons/guns/gun-blunderbuss-bronze.webp",
    system: {
      descricao: { value: "<p>Lança-mísseis. <strong>Área, Recarga, Duas Mãos.</strong></p>" },
      damage: { base: { value: "3d12" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 30 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Escopeta",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/guns/gun-blunderbuss-worn.svg",
    system: {
      descricao: { value: "<p>Dispersão cônica. <strong>Cone, Duas Mãos.</strong></p>" },
      damage: { base: { value: "2d6" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 9 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 3 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Metralhadora",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/guns/gun-rifle.svg",
    system: {
      descricao: { value: "<p>Fogo automático. <strong>Rajada, Duas Mãos.</strong></p>" },
      damage: { base: { value: "1d12" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 24 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Rifle",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/guns/rifle-carbine.svg",
    system: {
      descricao: { value: "<p>Rifle de assalto. <strong>Duas Mãos.</strong></p>" },
      damage: { base: { value: "2d8" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 36 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Rifle de Precisão",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/guns/rifle-sniper.svg",
    system: {
      descricao: { value: "<p>Sniper. <strong>Duas Mãos, Recarga.</strong></p>" },
      damage: { base: { value: "2d10" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 90 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Chakram",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/thrown/chakram.svg",
    system: {
      descricao: { value: "<p>Disco afiado de retorno. <strong>Ágil, Arremesso.</strong></p>" },
      damage: { base: { value: "2d4" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 9 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Kunai",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/daggers/dagger-kunai.svg",
    system: {
      descricao: { value: "<p>Lâmina ninja multiuso. <strong>Ágil, Arremesso.</strong></p>" },
      damage: { base: { value: "1d6" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 9 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } }
      }
    }
  },
  {
    name: "Rede",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/tools/fishing/net-simple.svg",
    system: {
      descricao: { value: "<p>Prende inimigos. <strong>Arremesso, Controle.</strong></p>" },
      damage: { base: { value: "0" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 3 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 1 } }
      }
    }
  },
  {
    name: "Shuriken",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/thrown/shuriken-silver.svg",
    system: {
      descricao: { value: "<p>Estrela ninja. <strong>Ágil, Arremesso.</strong></p>" },
      damage: { base: { value: "1d4" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 9 }, unidade: { value: "m" } },
        critico: { min: { value: 18 }, mult: { value: 2 } }
      }
    }
  }
  ,
  // --- ARMAS ADICIONAIS (GENÉRICAS) ---
  {
    name: "Lança",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/polearms/spear-flared-silver.svg",
    system: {
      descricao: { value: "<p>Haste longa com ponta metálica. <strong>Versátil (1d8)</strong> e <strong>Alcance</strong>.</p>" },
      damage: { base: { value: "1d6" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        alcance: { valor: { value: 3 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "uma mão" } }
      }
    }
  },
  {
    name: "Machado",
    type: "arma",
    img: "icons/weapons/axes/axe-broad-black.webp",
    system: {
      descricao: { value: "<p>Uma lâmina pesada de corte. <strong>Versátil (1d10).</strong></p>" },
      damage: { base: { value: "1d8" }, type: { value: "corte" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        alcance: { valor: { value: 1.5 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "uma mão" } }
      }
    }
  },
  {
    name: "Martelo",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/hammers/hammer-war-black.svg",
    system: {
      descricao: { value: "<p>Um martelo de guerra. <strong>Versátil (1d10).</strong></p>" },
      damage: { base: { value: "1d8" }, type: { value: "impacto" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "forca" },
        pericia: { value: "luta" },
        alcance: { valor: { value: 1.5 }, unidade: { value: "m" } },
        critico: { min: { value: 20 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "uma mão" } }
      }
    }
  },
  {
    name: "Besta Leve",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/crossbows/crossbow-light.svg",
    system: {
      descricao: { value: "<p>Uma arma de disparo mecânica. <strong>Recarga (Ação de Movimento).</strong></p>" },
      damage: { base: { value: "1d8" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "rwak" },
        atributo: { value: "destreza" },
        pericia: { value: "pontaria" },
        alcance: { valor: { value: 24 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "duas mãos" } }
      }
    }
  },
  {
    name: "Rapieira",
    type: "arma",
    img: "/systems/feiticeiros-e-maldicoes/icons/weapons/swords/sword-rapier-basket.svg",
    system: {
      descricao: { value: "<p>Uma espada fina de perfuração elegante. <strong>Ágil.</strong></p>" },
      damage: { base: { value: "1d8" }, type: { value: "perfurante" } },
      ataque: {
        acao: { value: "mwak" },
        atributo: { value: "destreza" },
        pericia: { value: "luta" },
        alcance: { valor: { value: 1.5 }, unidade: { value: "m" } },
        critico: { min: { value: 19 }, mult: { value: 2 } },
        detalhes: { grau: { value: 4 }, empunhadura: { value: "uma mão" } }
      }
    }
  }
];

export default TODAS_AS_ARMAS;
