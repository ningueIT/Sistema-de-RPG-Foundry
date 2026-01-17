/**
 * Macro: Importar Habilidades - Parte 2: ESPECIALISTA EM COMBATE
 * * Funcionalidades:
 * - Cria/Atualiza o Compêndio "Habilidades Amaldiçoadas".
 * - Organiza em pastas: Especialista em Combate > Nível.
 * - Adiciona ícones temáticos (armas, miras, escudos, posturas).
 * - Formata a descrição com parágrafos HTML.
 */

(async () => {
  const PACK_LABEL = "Habilidades Amaldiçoadas";
  const PACK_NAME = "habilidades-amaldicoadas";

  // Verificação de segurança
  if (!game.user?.isGM) {
    ui.notifications.error("Apenas o GM pode executar este macro.");
    return;
  }

  // --- 1. DADOS: ESPECIALISTA EM COMBATE ---
  const APTIDOES = [
    // Nível 2
    { name: "Arremessos Potentes", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Seus ataques com armas de arremesso contam como um nível de dano acima. No começo do seu turno, pode gastar 1 PE para ignorar RD igual ao bônus de treinamento.` },
    { name: "Arsenal Cíclico", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Uma vez por rodada, pode sacar/trocar item como ação livre. Ao trocar para arma de outro grupo, recebe +1d até o fim do próximo turno.` },
    { name: "Assumir Postura", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você recebe acesso às posturas de combate (Sol, Lua, Terra, Dragão, etc).` },
    { name: "Disparos Sincronizados", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Com duas armas a distância, use ações de ataque juntas. Se ambos acertarem, combina o dano em uma única instância (resistências aplicam 1 vez).` },
    { name: "Escudeiro Agressivo", nivel: 2, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao atacar com escudo, gaste 1 PE para fazer um ataque adicional com o escudo.` },
    { name: "Extensão do Corpo", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Alcance corpo a corpo aumenta em 1,5m. Recebe +2 em ataque e testes contra desarme.` },
    { name: "Flanqueador Superior", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Criatura flanqueada por você recebe -2 em testes de resistência.` },
    { name: "Golpe Falso", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Reação", duracao: "Instantâneo" }, description: `Quando aliado ataca inimigo no seu alcance, faça golpe falso. Inimigo faz TR Astúcia, se falhar, aliado tem vantagem.` },
    { name: "Golpes Potentes", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Com arma treinada, dano aumenta um nível e recebe +2 nas rolagens de dano.` },
    { name: "Indomável", nivel: 2, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste 1 PE para rolar novamente um teste de resistência falho (metade do nível vezes/descanso).` },
    { name: "Pistoleiro Iniciado", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Com arma de fogo, pode aumentar margem de Emperrar em 2 para causar +1 dado de dano.` },
    { name: "Posicionamento Ameaçador", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Concede flanco para aliados mesmo à distância (se alvo estiver no primeiro alcance).` },
    { name: "Precisão Definitiva", nivel: 2, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste 1 PE para +2 no acerto (aumenta com nível). Pode trocar por +4 no dano.` },
    { name: "Presença Suprimida", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `+2 em Furtividade. Penalidade por atacar reduzida para -5.` },
    { name: "Revigorar", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Ação Bônus", duracao: "Instantâneo" }, description: `Recupere 1d10 + 2xCon + Treino em PV. Usos recarregam em descanso.` },
    { name: "Tiro Falso", nivel: 2, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Reação", duracao: "Instantâneo" }, description: `Versão à distância do Golpe Falso. Inimigo faz TR Astúcia ou concede vantagem ao aliado.` },
    { name: "Zona de Risco", nivel: 2, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Com arma Estendida, se inimigo entrar no alcance, gaste 2 PE para atacá-lo.` },

    // Nível 4
    { name: "Aprender Postura", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende uma postura adicional. Outra no nível 10.` },
    { name: "Armas Escolhidas", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Escolha um grupo de armas: dano aumenta em 3 níveis.` },
    { name: "Arremesso Rápido", nivel: 4, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao atacar com arremesso, gaste 1 PE para fazer ataque adicional contra outro alvo.` },
    { name: "Técnicas de Avanço", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende artes de combate de avanço (Avanço Bumerangue, Sombra Descendente).` },
    { name: "Buscar Oportunidade", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Ação Livre", duracao: "Instantâneo" }, description: `Faça teste de Percepção (CD 16+2/inimigo). Sucesso permite Andar, Desengajar ou Esconder como ação livre.` },
    { name: "Compensar Erro", nivel: 4, system: { categoria: "Especialista em Combate", custo: "PE Variável", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao errar ataque corpo a corpo, gaste PE para causar dano automático (1d10 + mod por ponto).` },
    { name: "Especialista em Escudo", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Soma aumento base de RD do escudo em TR Reflexos e Fortitude.` },
    { name: "Espírito de Luta", nivel: 4, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Ação Livre", duracao: "Cena" }, description: `Gaste 1 PE: +2 em ataque até o fim da cena e ganha PV temporários igual ao nível.` },
    { name: "Grupo Favorito", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Escolha grupo de armas: recebe acesso ao efeito crítico do grupo.` },
    { name: "Guarda Estudada", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Soma metade do mod. Sabedoria na Defesa. +2 em um TR escolhido.` },
    { name: "Mente Oculta", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Adiciona bônus de Sabedoria em Furtividade.` },
    { name: "Preparo Imediato", nivel: 4, system: { categoria: "Especialista em Combate", custo: "3 Pontos Preparo", ativacao: "Iniciativa", duracao: "Instantâneo" }, description: `Na iniciativa, gaste 3 Pontos para Preparar ação bônus. (Nível 10: 7 pontos para ação comum).` },
    { name: "Recarga Rápida", nivel: 4, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Custo de recarga diminui um nível (Comum > Bônus > Livre).` },
    { name: "Uso Rápido", nivel: 4, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao usar item, pague 1 PE para usar item adicional.` },

    // Nível 6
    { name: "Acervo Amplo", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende mais um Estilo de Combate. Pode trocar em descanso curto.` },
    { name: "Aprimoramento Especializado", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Soma metade do mod. atributo chave na CD de Especialização.` },
    { name: "Ataque Extra (Especialista)", nivel: 6, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao realizar ação Atacar, gaste 2 PE para atacar duas vezes.` },
    { name: "Crítico Melhorado", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Margem de crítico reduz em 1.` },
    { name: "Crítico Potente", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Crítico causa 1 dado de dano adicional.` },
    { name: "Feitiçaria Implementada", nivel: 6, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao usar Feitiço de dano, gaste 2 PE para atacar alvo afetado como Ação Livre.` },
    { name: "Fluxo Perfeito", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Se acertar todos ataques no turno, ganha 1 PE temporário no próximo (2 no nível 12).` },
    { name: "Olhos de Águia", nivel: 6, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste 1 PE para usar Mirar como ação livre.` },
    { name: "Manejo Especial", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Escolha uma propriedade de ferramenta amaldiçoada para aplicar em toda arma manejada.` },
    { name: "Marcar Inimigo", nivel: 6, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Especial", duracao: "Até fim do turno" }, description: `Ao acertar corpo a corpo, marque inimigo: ele recebe -4 ataque contra outros. Se atacar outro, você pode gastar 1 PE para atacá-lo (Ação Bônus).` },
    { name: "Mira Destrutiva", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Especial", duracao: "Próximo ataque" }, description: `Ao Mirar, troque vantagem por mira em parte do corpo (-15 ataque). Acerto causa efeito de Ferimento Complexo.` },
    { name: "Preparação Rápida", nivel: 6, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Entrar em postura vira Ação Livre e não cancela ao ser empurrado.` },

    // Nível 8
    { name: "Aptidões de Combate", nivel: 8, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aumenta nível de aptidão em Aura ou Controle e Leitura em 1.` },
    { name: "Técnicas da Força", nivel: 8, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende artes de combate da força (Nuvens Espirais, Onda do Dragão).` },
    { name: "Destruição Dupla", nivel: 8, system: { categoria: "Especialista em Combate", custo: "1 PE", ativacao: "Passiva", duracao: "Permanente" }, description: `Com duas armas de grupos diferentes: ataque secundário +1 dado dano. Crítico: gaste 1 PE para aplicar efeito dos dois grupos.` },
    { name: "Espírito Incansável", nivel: 8, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Cena" }, description: `Ao usar Espírito de Luta, pode gastar 2 PE para bônus +5 e PV temp igual bônus de ataque.` },
    { name: "Pistoleiro Avançado", nivel: 8, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Pode aumentar Emperrar até 6 (dano extra). Reação para atacar inimigo que se move no alcance (tira movimento).` },
    { name: "Ricochete Constante", nivel: 8, system: { categoria: "Especialista em Combate", custo: "5 PE", ativacao: "Especial", duracao: "Turno" }, description: `Ao usar Arremessos Potentes, pague 5 PE: ataques ricocheteiam para alvo a 4,5m.` },
    { name: "Sombra Viva", nivel: 8, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Esgueirar usa movimento total. Reação para refazer teste de Furtividade se encontrado.` },
    { name: "Surto de Ação", nivel: 8, system: { categoria: "Especialista em Combate", custo: "5 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste 5 PE para realizar uma ação comum a mais no turno (Limite: metade bônus treino/descanso).` },

    // Nível 10
    { name: "Análise Acelerada", nivel: 10, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Análise vira Ação Bônus.` },
    { name: "Armas Perfeitas", nivel: 10, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Armas escolhidas ignoram 10 de RD.` },
    { name: "Assassinar", nivel: 10, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Primeira rodada" }, description: `Primeiro ataque contra desprevenido na primeira rodada é crítico garantido.` },
    { name: "Ataque Concentrado", nivel: 10, system: { categoria: "Especialista em Combate", custo: "PE Variável", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste usos de Ataque Extra/Surto de Ação para adicionar dados de dano ao próximo ataque.` },
    { name: "Chuva de Arremessos", nivel: 10, system: { categoria: "Especialista em Combate", custo: "1 PE/ataque", ativacao: "Ação Completa", duracao: "Instantâneo" }, description: `Realize ataques de arremesso igual ao bônus de treino. Pague 1 PE por ataque extra.` },
    { name: "Potência Antes de Cair", nivel: 10, system: { categoria: "Especialista em Combate", custo: "1 uso/descanso", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao cair a 0 PV, realize um turno impedindo o atual. Depois cai inconsciente com exaustão.` },

    // Nível 12+
    { name: "Técnicas de Saque", nivel: 12, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aprende artes de combate de saque (Saque Devastador, Saque Trovão).` },
    { name: "Ciclagem Absoluta", nivel: 12, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Pode trocar arma a cada ataque. Trocar para grupo diferente dá +2 no ataque.` },
    { name: "Manejo Único", nivel: 12, system: { categoria: "Especialista em Combate", custo: "2 PE", ativacao: "Especial", duracao: "Cena" }, description: `Gaste 2 PE para receber uma propriedade única (criada ou existente) na cena.` },
    { name: "Mestre Pistoleiro", nivel: 16, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Desemperrar vira ação movimento. Margem de crítico +1 com armas de fogo.` },
    { name: "Sincronia Perfeita", nivel: 16, system: { categoria: "Especialista em Combate", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Alcance extra +3m. Vantagem contra desarme.` },

    // Extras (Posturas e Artes)
    { name: "Assumir Postura (Posturas)", nivel: 6, system: { categoria: "Postura", custo: "", ativacao: "Ação Bônus", duracao: "1 minuto" }, description: `Lista de posturas: Sol (+Ataque/Dano, -Def), Lua (+Def/Mov, -Ataque), Terra (Imóvel, +Fort), Dragão (Dano em área), etc.` },
    { name: "Artes: Técnicas de Avanço", nivel: 6, system: { categoria: "Artes do Combate", custo: "Pontos Preparo", ativacao: "Variável", duracao: "Instantâneo" }, description: `Avanço Bumerangue (Vai e volta), Sombra Descendente (Ataque aéreo).` },
    { name: "Artes: Técnicas da Força", nivel: 6, system: { categoria: "Artes do Combate", custo: "Pontos Preparo", ativacao: "Variável", duracao: "Instantâneo" }, description: `Nuvens Espirais (Combo empurrão), Onda do Dragão (Empurrão massivo).` },
    { name: "Artes: Técnicas de Saque", nivel: 6, system: { categoria: "Artes do Combate", custo: "Pontos Preparo", ativacao: "Variável", duracao: "Instantâneo" }, description: `Saque Devastador (Contra-ataque reação), Saque Trovão (Movimento com ataques).` }
  ];

  // --- 2. CONFIGURAÇÃO E HELPERS ---

  // Ícones inteligentes para Especialista em Combate
  const ICON_MAP = [
    { key: "arremesso", icon: "icons/skills/ranged/dagger-thrown-poison-green.webp" },
    { key: "arma", icon: "icons/skills/melee/weapons-crossed-swords-yellow.webp" },
    { key: "arsenal", icon: "icons/equipment/back/backpack-leather-brown.webp" },
    { key: "postura", icon: "icons/svg/statue.svg" },
    { key: "disparo", icon: "icons/weapons/guns/gun-blunderbuss-bronze.webp" },
    { key: "tiro", icon: "icons/weapons/guns/gun-pistol-flintlock-metal.webp" },
    { key: "pistoleiro", icon: "icons/weapons/guns/gun-pistol-flintlock-metal.webp" },
    { key: "escudo", icon: "icons/equipment/shield/heater-steel-gold.webp" },
    { key: "corpo", icon: "icons/magic/life/heart-glowing-red.webp" },
    { key: "flanqueador", icon: "icons/skills/social/diplomacy-handshake-yellow.webp" },
    { key: "golpe", icon: "icons/skills/melee/strike-sword-blood-red.webp" },
    { key: "ataque", icon: "icons/skills/melee/strike-sword-blood-red.webp" },
    { key: "indomável", icon: "icons/magic/defensive/shield-barrier-glowing-blue.webp" },
    { key: "posicionamento", icon: "icons/tools/navigation/map-marked-green.webp" },
    { key: "precisão", icon: "icons/skills/ranged/target-laser-red.webp" },
    { key: "mira", icon: "icons/skills/ranged/target-laser-red.webp" },
    { key: "furtividade", icon: "icons/magic/nature/stealth-hide-eyes-green.webp" },
    { key: "sombra", icon: "icons/magic/nature/stealth-hide-eyes-green.webp" },
    { key: "revigorar", icon: "icons/magic/life/cross-beam-green.webp" },
    { key: "zona", icon: "icons/magic/control/energy-stream-red.webp" },
    { key: "avanço", icon: "icons/skills/movement/feet-winged-boots-brown.webp" },
    { key: "oportunidade", icon: "icons/sundries/gaming/dice-runes-brown.webp" },
    { key: "analise", icon: "icons/tools/navigation/magnifying-glass.webp" },
    { key: "preparo", icon: "icons/tools/smithing/anvil.webp" },
    { key: "recarga", icon: "icons/weapons/ammunition/bullets-lead.webp" },
    { key: "uso", icon: "icons/sundries/misc/key-steel.webp" },
    { key: "crítico", icon: "icons/skills/wounds/blood-drip-droplet-red.webp" },
    { key: "feitiçaria", icon: "icons/magic/symbols/runes-star-blue.webp" },
    { key: "fluxo", icon: "icons/magic/water/wave-water-blue.webp" },
    { key: "manejo", icon: "icons/skills/melee/hand-grip-sword-blue.webp" },
    { key: "marcar", icon: "icons/magic/control/debuff-energy-hold-red.webp" },
    { key: "saque", icon: "icons/skills/melee/maneuver-sword-katana-red.webp" },
    { key: "ciclagem", icon: "icons/magic/time/arrows-circling-green.webp" },
    { key: "assassinar", icon: "icons/skills/melee/strike-dagger-blood-red.webp" }
  ];

  function guessIcon(name) {
    const n = name.toLowerCase();
    const match = ICON_MAP.find(m => n.includes(m.key));
    return match ? match.icon : "icons/svg/book.svg";
  }

  const ICON_FALLBACK = "icons/svg/book.svg";
  const _iconExistCache = new Map();

  async function resolveIcon(iconPath, fallback = ICON_FALLBACK) {
    if (!iconPath) return fallback;
    if (String(iconPath).startsWith("icons/svg/")) return iconPath;
    if (_iconExistCache.has(iconPath)) return _iconExistCache.get(iconPath);

    let ok = false;
    try {
      const res = await fetch(iconPath, { method: "HEAD" });
      ok = res.ok;
      if (!ok && res.status === 405) {
        const res2 = await fetch(iconPath, { method: "GET" });
        ok = res2.ok;
      }
    } catch {
      ok = false;
    }

    const finalPath = ok ? iconPath : fallback;
    _iconExistCache.set(iconPath, finalPath);
    return finalPath;
  }

  const SYSTEM_ID = game?.system?.id ?? 'feiticeiros-e-maldicoes';
  const CLASSE_BASE = 'Especialista em Combate';
  const APTIDAO_PREFIX = 'especialista-em-combate';

  function slugifyKey(text) {
    return String(text ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function normalizeAcao(ativacao) {
    const a = String(ativacao ?? '').trim().toLowerCase();
    if (!a) return 'Passiva';
    if (a.startsWith('passiva')) return 'Passiva';
    return 'Ativa';
  }

  function buildPassivePlaceholderEffect(label, icon) {
    return {
      name: String(label ?? '').trim() || 'Aptidão Passiva',
      icon: icon || ICON_FALLBACK,
      disabled: false,
      changes: [],
      flags: {
        [SYSTEM_ID]: {
          passiveAptidaoPlaceholder: true,
        }
      }
    };
  }

  function formatDescription(text) {
    if (!text) return "";
    if (text.includes("<p>") || text.includes("<br>")) return text;
    return text.split(/\n\s*\n/).map(p => `<p>${p.trim().replace(/\n/g, "<br>")}</p>`).join("");
  }

  // --- 3. PREPARAÇÃO DO COMPÊNDIO ---
  
  let pack = game.packs.find(p => p.metadata?.label === PACK_LABEL && p.documentName === "Item");
  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      label: PACK_LABEL,
      name: PACK_NAME,
      type: "Item",
      package: "world"
    });
  }
  if (pack.locked) {
    ui.notifications.error(`Destrave o Compêndio "${PACK_LABEL}" e tente novamente.`);
    return;
  }

  const existingItems = await pack.getDocuments();
  const existingIdByName = new Map(existingItems.map(i => [i.name.trim().toLowerCase(), i.id]));
  const existingDocByName = new Map(existingItems.map(i => [i.name.trim().toLowerCase(), i]));

  // --- 4. GESTÃO DE PASTAS ---
  
  const existingFolders = pack.folders.contents;
  const folderMap = new Map(existingFolders.map(f => [`${f.name}#${f.folder?.id || 'root'}`, f]));

  async function ensureFolder(name, parentId = null) {
    const key = `${name}#${parentId || 'root'}`;
    if (folderMap.has(key)) return folderMap.get(key);

    const folder = await Folder.create({
      name: name,
      type: "Item",
      folder: parentId,
      sorting: "a"
    }, { pack: pack.collection });
    
    folderMap.set(key, folder);
    return folder;
  }

  const rootFolder = await ensureFolder(PACK_LABEL);
  
  const levelsByCat = {};
  for (const item of APTIDOES) {
    const catName = item.system?.categoria || "Outros";
    const lvl = item.nivel || 0;
    
    if (!levelsByCat[catName]) levelsByCat[catName] = new Set();
    levelsByCat[catName].add(lvl);
  }

  const folderIdCache = {}; 
  for (const [catName, levels] of Object.entries(levelsByCat)) {
    const catFolder = await ensureFolder(catName, rootFolder.id);
    for (const lvl of Array.from(levels).sort((a, b) => a - b)) {
      const lvlName = lvl > 0 ? `Nível ${lvl}` : "Geral";
      const lvlFolder = await ensureFolder(lvlName, catFolder.id);
      folderIdCache[`${catName}-${lvl}`] = lvlFolder.id;
    }
  }

  // --- 5. PREPARAÇÃO DOS DADOS ---

  const toCreate = [];
  const toUpdate = [];

  for (const entry of APTIDOES) {
    const catName = entry.system?.categoria || "Outros";
    const lvl = entry.nivel || 0;
    const folderId = folderIdCache[`${catName}-${lvl}`];

    const descriptionHtml = formatDescription(entry.description);
    const icon = await resolveIcon(entry.img || guessIcon(entry.name));

    const acaoNorm = normalizeAcao(entry.system?.ativacao);
    const aptidaoKey = `${APTIDAO_PREFIX}.${slugifyKey(entry.name)}`;
    const existingDoc = existingDocByName.get(entry.name.trim().toLowerCase());
    const existingHasEffects = (existingDoc?.effects?.size ?? (existingDoc?.effects?.contents?.length ?? 0)) > 0;

    const itemData = {
      name: entry.name,
      type: "aptidao", 
      img: icon,
      folder: folderId,
      flags: foundry.utils.mergeObject(existingDoc?.toObject?.()?.flags ?? {}, {
        [SYSTEM_ID]: { aptidaoKey }
      }),
      system: {
        fonte: { value: PACK_LABEL },
        descricao: { value: descriptionHtml },
        custo: { value: parseInt(entry.system?.custo?.match(/\d+/)?.[0] || 0), label: "Custo (PE)" },
        custoTexto: { value: entry.system?.custo || "", label: "Custo (texto)" },
        acao: { value: acaoNorm, label: "Ação" },
        requisito: { value: entry.system?.requisitos || "", label: "Requisito" },

        classe: { value: CLASSE_BASE, label: "Classe" },
        nivelMin: { value: lvl, label: "Nível mínimo (classe)" },
        
        tipo: { value: "aptidao" }, 
        categoria: { value: catName },
        ativacao: { value: entry.system?.ativacao || "" },
        duracao: { value: entry.system?.duracao || "" }
      }
    };

    if (acaoNorm === 'Passiva' && !existingHasEffects) {
      itemData.effects = [buildPassivePlaceholderEffect(entry.name, icon)];
    }

    const existingId = existingIdByName.get(entry.name.trim().toLowerCase());
    if (existingId) {
      toUpdate.push({ _id: existingId, ...itemData });
    } else {
      toCreate.push(itemData);
    }
  }

  // --- 6. EXECUÇÃO EM BATCH ---
  
  if (toCreate.length > 0) {
    console.log(`Criando ${toCreate.length} novos itens...`);
    await Item.createDocuments(toCreate, { pack: pack.collection });
  }
  
  if (toUpdate.length > 0) {
    console.log(`Atualizando ${toUpdate.length} itens existentes...`);
    await Item.updateDocuments(toUpdate, { pack: pack.collection });
  }

  ui.notifications.info(`Concluído! ${toCreate.length} criados, ${toUpdate.length} atualizados.`);
})();
