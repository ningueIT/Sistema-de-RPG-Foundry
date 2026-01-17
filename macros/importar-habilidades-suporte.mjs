/**
 * Macro: Importar Habilidades - Parte 5: SUPORTE
 * * Funcionalidades:
 * - Cria/Atualiza o Compêndio "Habilidades Amaldiçoadas".
 * - Organiza em pastas: Suporte > Nível.
 * - Adiciona ícones temáticos (cura, buff, análise, proteção).
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

  // --- 1. DADOS: SUPORTE ---
  const APTIDOES = [
    // Nível 2
    { name: "Amizade Inquebrável", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Escolha um Aliado Jogador. Este aliado é considerado permanentemente seu "Amigo". Ao terminar seu turno ao lado de seu Amigo, você pode como ação livre realizar a Ação "Apoiar" no mesmo. Caso o Amigo morra, você só pode escolher outro amigo no próximo interlúdio.` },
    { name: "Análise Profunda", nivel: 2, system: { categoria: "Suporte", custo: "1 PE", ativacao: "Ação Comum", duracao: "Instantâneo" }, description: `Você pode gastar 1 ponto de energia amaldiçoada para, como uma ação comum, analisar uma criatura, realizando uma rolagem de Percepção com CD igual a 15 + ND da criatura. Caso você suceda, você descobre uma característica dela. Para cada 5 pontos excedentes, descobre mais uma.` },
    { name: "Apoio Avançado", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao utilizar a ação de Apoiar, você pode fortalecer seu apoio com um efeito à sua escolha (Curativo, Defensivo, Focado, Ofensivo ou Estratégico).` },
    { name: "Conceder Outra Chance", nivel: 2, system: { categoria: "Suporte", custo: "3 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao ver um aliado dentro de 6 metros falhar em um teste, você pode gastar 3 pontos de energia amaldiçoada para fazer com que ele role novamente, ficando com o melhor resultado.` },
    { name: "Comando Motivador", nivel: 2, system: { categoria: "Suporte", custo: "2 PE", ativacao: "Ação Livre", duracao: "Instantâneo" }, description: `Como uma ação livre, você pode falar um comando para um aliado e gastar 2 PE para que, quando o aliado realize a ação comandada, ele receba um bônus igual ao seu bônus de treinamento na rolagem.` },
    { name: "Desvendar Terreno", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Ação de Movimento", duracao: "Cena" }, description: `Realize um teste de Percepção. Caso suceda, você percebe pontos estratégicos e recebe bônus igual ao seu bônus de treinamento em testes de Percepção no terreno analisado até o fim da cena.` },
    { name: "Expandir Repertório", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você se torna treinado em uma quantidade de perícias igual a metade do seu bônus de treinamento. Você recebe também um bônus de +2 em uma perícia qualquer.` },
    { name: "Mobilidade Avançada", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Passiva/Reação", duracao: "Permanente" }, description: `Você recebe um bônus de +3 metros em seu movimento. Além disso, caso um aliado caia nas portas da morte, você pode, como uma reação, mover-se metade do seu movimento na direção dele.` },
    { name: "Otimização de Espaço", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você recebe espaços de item adicionais no seu inventário, em um valor igual ao seu bônus de treinamento.` },
    { name: "Pronto para Agir", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você adiciona seu modificador de Presença a Iniciativa. Além disso, seus aliados recebem um bônus igual a metade do modificador.` },
    { name: "Protetor", nivel: 2, system: { categoria: "Suporte", custo: "1 PE", ativacao: "Ação Livre", requisitos: "Escudo equipado", duracao: "Instantâneo" }, description: `Quando um aliado dentro de 1,5m de você é atacado, você pode gastar 1 PE para diminuir o dano em Xd10 + modificador (X = bônus de treinamento).` },
    { name: "Técnicas de Combate", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você pode escolher duas armas quaisquer para se tornar treinado e para poder utilizar Presença ou Sabedoria nas jogadas de ataque e dano enquanto as manejando.` },
    { name: "Transmitir Conhecimento", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Descanso", duracao: "Até próximo descanso" }, description: `Durante um descanso, você pode conceder treinamento temporário em perícias com as quais você seja treinado para seus aliados.` },

    // Nível 4
    { name: "Apoios Versáteis", nivel: 4, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você aprende um apoio avançado adicional. No 10° nível você recebe outro apoio avançado.` },
    { name: "Guarda Sincronizada", nivel: 4, system: { categoria: "Suporte", custo: "", ativacao: "Ação Bônus", duracao: "Instantâneo" }, description: `Utilize uma Ação Bônus para sintonizar a guarda de aliados em 7,5m: para cada aliado no alcance, todos recebem +1 na Defesa.` },
    { name: "Inspirar Aliados", nivel: 4, system: { categoria: "Suporte", custo: "1 PE", ativacao: "Ação Bônus", duracao: "10 minutos" }, description: `Gaste 1 PE e ação bônus para inspirar aliados. Eles podem adicionar 2d3 em uma jogada de ataque, teste de habilidade ou TR.` },
    { name: "Intervenção", nivel: 4, system: { categoria: "Suporte", custo: "3 PE (+variável)", ativacao: "Ação Comum", duracao: "Instantâneo" }, description: `Gaste 3 PE para encerrar uma condição fraca afetando um aliado (toque). Níveis superiores permitem remover condições piores com custo maior.` },
    { name: "Negação Crítica", nivel: 4, system: { categoria: "Suporte", custo: "3 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Você pode pagar 3 PE para negar uma falha crítica que você possa ver dentro de 12 metros.` },
    { name: "No Último Segundo", nivel: 4, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Rodada" }, description: `Se iniciar rodada com um aliado com 2 fracassos na morte, receba +5 Iniciativa. Se agir antes dele, recebe bônus de movimento e defesa.` },
    { name: "Pré-Análise", nivel: 4, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", requisitos: "Treinado em Percepção", duracao: "Permanente" }, description: `Você não pode ser surpreendido e seu valor de atenção recebe +5. Pode escolher um aliado para não ser surpreendido.` },
    { name: "Recompensa pelo Sucesso", nivel: 4, system: { categoria: "Suporte", custo: "", ativacao: "Especial", requisitos: "Comando Motivador", duracao: "Instantâneo" }, description: `Pode reduzir o bônus de Comando Motivador pela metade. Se o aliado suceder, ele ganha 2 PE.` },
    { name: "Sintonização Vital", nivel: 4, system: { categoria: "Suporte", custo: "3 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Quando curar um aliado, pode gastar 3 PE para que outra criatura dentro de 3 metros recupere metade da cura original.` },

    // Nível 6
    { name: "Contra-Ataque", nivel: 6, system: { categoria: "Suporte", custo: "1 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Gaste 1 PE e reação para aumentar a Defesa de um aliado. Se o ataque errar, você ou o aliado podem pagar 1 PE para atacar o inimigo.` },
    { name: "Cura Avançada em Grupo", nivel: 6, system: { categoria: "Suporte", custo: "2 PE", ativacao: "Especial", requisitos: "Cura em Grupo", duracao: "Instantâneo" }, description: `Ao usar cura em grupo, pode pagar 2 PE para curar mais um alvo (até limite do bônus de treino).` },
    { name: "Devolver na Mesma Moeda", nivel: 6, system: { categoria: "Suporte", custo: "2 PE", ativacao: "Ação Livre", duracao: "Instantâneo" }, description: `Quando um aliado é afetado por uma condição, gaste 2 PE para impor desvantagem no próximo TR do inimigo para evitar uma condição.` },
    { name: "Disseminar Cura", nivel: 6, system: { categoria: "Suporte", custo: "PE Variável", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao utilizar um Feitiço de cura, pode escolher um alvo adicional, gastando PE igual ao nível da técnica.` },
    { name: "Incitar Vigor", nivel: 6, system: { categoria: "Suporte", custo: "3 PE", ativacao: "Ação Bônus", duracao: "Instantâneo" }, description: `Gaste 3 PE para fazer com que uma criatura a alcance de toque possa gastar seus dados de vida para se curar.` },
    { name: "Inimigo Comum", nivel: 6, system: { categoria: "Suporte", custo: "2 PE", ativacao: "Ação Bônus", duracao: "Cena" }, description: `Marque um inimigo. Aliados escolhidos recebem bônus de acerto e dano contra esse inimigo.` },
    { name: "Posicionamento Estratégico", nivel: 6, system: { categoria: "Suporte", custo: "", ativacao: "Ação Livre", duracao: "Instantâneo" }, description: `Você pode deixar de se mover (reduzir seu movimento a 0), para permitir que um dos seus aliados se mova como Ação Livre.` },

    // Nível 8
    { name: "Aptidões de Suporte", nivel: 8, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você pode aumentar o seu nível de aptidão em Aura, Controle e Leitura ou Energia Reversa em 1.` },
    { name: "Contaminar com Determinação", nivel: 8, system: { categoria: "Suporte", custo: "4 PE (+2/extra)", ativacao: "Ação Comum", duracao: "2 rodadas" }, description: `Gaste 4 PE para dar vantagem em testes de resistência para você e dois aliados.` },
    { name: "Criar Medicina", nivel: 8, system: { categoria: "Suporte", custo: "", ativacao: "Descanso", requisitos: "Ferramentas de Médico", duracao: "1 dia" }, description: `Durante descanso, cria remédios portáteis que curam como Suporte em Combate (recupera menos PE no descanso).` },
    { name: "Cura Aperfeiçoada", nivel: 8, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Caso tire 1 ou 2 em um dado de cura, você pode escolher rolar novamente o dado.` },
    { name: "Elevar Sucesso", nivel: 8, system: { categoria: "Suporte", custo: "2 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Quando um aliado suceder em um TR, gaste 2 PE para somar +5 ao resultado (possibilitando crítico).` },
    { name: "Físico Controlado", nivel: 8, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", requisitos: "Treinado em Fortitude", duracao: "Permanente" }, description: `Você passa a somar seu modificador de presença ou de sabedoria, ao invés de constituição, nos pontos de vida (limite +4).` },
    { name: "Motivação pelo Triunfo", nivel: 8, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Instantâneo" }, description: `Quando um inimigo cai, você concede PV temporários aos aliados que causaram dano nele.` },
    { name: "Pressão do Médico", nivel: 8, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", requisitos: "Mestre em Medicina", duracao: "Permanente" }, description: `Ao entrar nas portas da morte, pode tentar se estabilizar sozinho (CD +10), mas recebe uma falha nos testes.` },
    { name: "Sustentação Avançada", nivel: 8, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Pode manter um feitiço sustentado adicional. Pode ativar um sustentado como Ação Livre no início do combate.` },

    // Nível 10
    { name: "Descarga Reanimadora", nivel: 10, system: { categoria: "Suporte", custo: "10 PE", ativacao: "Ação Completa", requisitos: "Cura Amplificada", duracao: "Instantâneo" }, description: `Estabiliza imediatamente um aliado nas portas da morte e o cura. Se ele perdeu o turno, pode agir após você.` },
    { name: "Necessidade de Continuar", nivel: 10, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", requisitos: "Treinado em Vontade", duracao: "Instantâneo" }, description: `Se estiver com menos da metade da vida, recebe PV temporários no começo do turno.` },
    { name: "Olhar Aguçado", nivel: 10, system: { categoria: "Suporte", custo: "2 PE", ativacao: "Ação Bônus", requisitos: "Treinado em Percepção", duracao: "Instantâneo" }, description: `Analisa inimigo. Primeiro ataque de todo aliado causa dano adicional massivo (5 x bônus treino).` },
    { name: "Táticas Defensivas", nivel: 10, system: { categoria: "Suporte", custo: "", ativacao: "Descanso Longo", duracao: "Permanente" }, description: `Escolha um tipo de dano Elemental para que você e dois aliados sejam resistentes.` },

    // Nível 12
    { name: "Ajustes em Equipamento", nivel: 12, system: { categoria: "Suporte", custo: "", ativacao: "Descanso", requisitos: "Ferramentas de Ferreiro", duracao: "Até próximo descanso" }, description: `Concede efeito de Encantamento a equipamentos de aliados durante descansos.` },
    { name: "Interferência", nivel: 12, system: { categoria: "Suporte", custo: "2 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Force inimigo a rolar novamente um teste (pior resultado). Concede vantagem a um aliado próximo.` },
    { name: "Não Desista!", nivel: 12, system: { categoria: "Suporte", custo: "3 PE", ativacao: "Especial", duracao: "1 rodada" }, description: `Impede aliado de cair nas portas da morte por uma rodada (fica com 0 de vida). Anula efeitos de morte imediata.` },
    { name: "Sobrecura", nivel: 12, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", duracao: "Instantâneo" }, description: `Cura excedente vira PV temporário (dobro do excedente).` },
    { name: "Reação Necessária", nivel: 12, system: { categoria: "Suporte", custo: "3 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Uma vez por rodada, caso não possua uma reação, você pode gastar 3 PE para realizar uma reação adicional.` },

    // Nível 14 e 16
    { name: "Apoio Abrangente", nivel: 14, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", requisitos: "Apoio Avançado", duracao: "Permanente" }, description: `Quando utilizar Apoio Avançado, você pode colocar dois efeitos ao invés de um só.` },
    { name: "Purificação da Alma", nivel: 16, system: { categoria: "Suporte", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Restaura a integridade de alguém em 50%. Aumenta o número de usos da sua cura.` },
    { name: "Sustentação Mestre", nivel: 16, system: { categoria: "Suporte", custo: "", ativacao: "Passiva", requisitos: "Sustentação Avançada", duracao: "Permanente" }, description: `Pode manter três feitiços sustentados. Custo para sustentar é diminuído em 1.` },

    // Extra
    { name: "Apoios Avançados (Lista)", nivel: 2, system: { categoria: "Suporte", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Lista de efeitos: Curativo (Cura junto), Defensivo (+Defesa), Focado (Vantagem + Bônus), Ofensivo (Ataque extra), Estratégico (Aumenta CD).` }
  ];

  // --- 2. CONFIGURAÇÃO E HELPERS ---

  // Ícones inteligentes para Suporte
  const ICON_MAP = [
    { key: "cura", icon: "icons/magic/life/cross-beam-green.webp" },
    { key: "medicina", icon: "icons/tools/surgical/medical-bag-leather-red.webp" },
    { key: "médico", icon: "icons/tools/surgical/scalpel-blood-red.webp" },
    { key: "apoio", icon: "icons/skills/social/diplomacy-handshake-blue.webp" },
    { key: "amizade", icon: "icons/magic/life/heart-glowing-red.webp" },
    { key: "análise", icon: "icons/tools/navigation/magnifying-glass.webp" },
    { key: "comando", icon: "icons/skills/social/diplomacy-handshake-yellow.webp" },
    { key: "terreno", icon: "icons/tools/navigation/map-marked-green.webp" },
    { key: "repertório", icon: "icons/sundries/books/book-open-purple.webp" },
    { key: "mobilidade", icon: "icons/skills/movement/feet-winged-boots-brown.webp" },
    { key: "espaço", icon: "icons/equipment/back/backpack-leather-brown.webp" },
    { key: "pronto", icon: "icons/skills/movement/feet-winged-boots-glowing-yellow.webp" },
    { key: "protetor", icon: "icons/equipment/shield/heater-steel-gold.webp" },
    { key: "combate", icon: "icons/skills/melee/weapons-crossed-swords-yellow.webp" },
    { key: "conhecimento", icon: "icons/sundries/scrolls/scroll-runed-blue.webp" },
    { key: "guarda", icon: "icons/equipment/shield/heater-steel-grey.webp" },
    { key: "inspirar", icon: "icons/magic/light/explosion-star-glow-yellow.webp" },
    { key: "intervenção", icon: "icons/magic/life/cross-shield-green.webp" },
    { key: "negação", icon: "icons/magic/defensive/shield-barrier-blue.webp" },
    { key: "sucesso", icon: "icons/commodities/currency/coins-plain-stack-gold.webp" },
    { key: "vital", icon: "icons/magic/life/heart-glowing-red.webp" },
    { key: "contra-ataque", icon: "icons/skills/melee/strike-sword-blood-red.webp" },
    { key: "moeda", icon: "icons/magic/control/energy-stream-blue.webp" },
    { key: "vigor", icon: "icons/magic/life/heart-shield-gold.webp" },
    { key: "inimigo", icon: "icons/magic/control/debuff-energy-hold-red.webp" },
    { key: "estratégico", icon: "icons/tools/navigation/map-marked-green.webp" },
    { key: "aptidões", icon: "icons/magic/symbols/star-yellow.webp" },
    { key: "determinação", icon: "icons/magic/life/heart-shield-gold.webp" },
    { key: "físico", icon: "icons/magic/life/heart-glowing-red.webp" },
    { key: "triunfo", icon: "icons/skills/social/diplomacy-handshake-yellow.webp" },
    { key: "sustentação", icon: "icons/magic/time/hourglass-blue.webp" },
    { key: "reanimadora", icon: "icons/magic/life/cross-beam-green.webp" },
    { key: "olhar", icon: "icons/magic/perception/eye-ringed-green.webp" },
    { key: "defensivas", icon: "icons/magic/defensive/shield-barrier-blue.webp" },
    { key: "equipamento", icon: "icons/tools/smithing/anvil.webp" },
    { key: "interferência", icon: "icons/magic/control/energy-stream-blue.webp" },
    { key: "desista", icon: "icons/magic/life/heart-shield-gold.webp" },
    { key: "reação", icon: "icons/skills/movement/feet-winged-boots-glowing-yellow.webp" },
    { key: "abrangente", icon: "icons/magic/symbols/ring-circle-smoke-blue.webp" },
    { key: "alma", icon: "icons/magic/life/heart-shadow-violet.webp" },
    { key: "mestre", icon: "icons/magic/symbols/star-yellow.webp" }
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
  const CLASSE_BASE = 'Suporte';
  const APTIDAO_PREFIX = 'suporte';

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