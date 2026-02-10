// Macro: Importar Habilidades - Parte 1: LUTADOR
// - Cria/Atualiza o Compêndio "Habilidades Amaldiçoadas".
// - Organiza em pastas: Lutador > Nível.
// - Adiciona ícones temáticos baseados no nome da habilidade.
// - Formata a descrição com parágrafos HTML.

(async () => {
  const PACK_LABEL = "Habilidades Amaldiçoadas";
  const PACK_NAME = "habilidades-amaldicoadas";

  // Verificação de segurança
  if (!game.user?.isGM) {
    ui.notifications.error("Apenas o GM pode executar este macro.");
    return;
  }

  // --- 1. DADOS: LUTADOR ---
  const APTIDOES = [
    // Nível 2
    { name: "Aparar Ataque", nivel: 2, system: { categoria: "Lutador", custo: "1 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Você rebate um ataque com outro ataque, assim conseguindo aparar um golpe. Quando for alvo de um ataque corpo a corpo, você pode gastar 1 PE e sua reação para realizar uma jogada de ataque contra o atacante. Caso seu teste supere o do inimigo, você evita o ataque.` },
    { name: "Aparar Projéteis", nivel: 2, system: { categoria: "Lutador", custo: "1 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Utilizando de sua agilidade e reflexos, você consegue tentar aparar projéteis em sua direção. Quando receber um ataque à distância, você pode gastar 1 PE e sua reação para tentar aparar o projétil, reduzindo o dano recebido em 2d6 + modificador de atributo-chave + bônus de treinamento.` },
    { name: "Ataque Inconsequente", nivel: 2, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "1 rodada" }, description: `Você baixa a guarda para atacar de maneira inconsequente. Uma vez por rodada, ao realizar um ataque, você pode escolher receber vantagem na jogada de ataque e +5 na rolagem de dano dele. Porém, ao realizar um ataque inconsequente, você fica Desprevenido por 1 rodada.` },
    { name: "Caminho da Mão Vazia", nivel: 2, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Todo ataque desarmado que você realizar causa dano adicional igual ao seu bônus de treinamento e você soma metade do seu bônus de treinamento em jogadas de ataque desarmados.` },
    { name: "Complementação Marcial", nivel: 2, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Enquanto estiver desarmado ou empunhando uma arma marcial, você recebe um bônus de +2 em testes para Desarmar, Derrubar ou Empurrar, assim como para resistir a esses efeitos.` },
    { name: "Esquiva Rápida", nivel: 2, system: { categoria: "Lutador", custo: "", ativacao: "Ação Bônus", duracao: "Até próximo turno" }, description: `Como uma Ação Bônus, realize um teste de Acrobacia contra a Atenção de um inimigo. Caso suceda, o alvo recebe metade do seu modificador de Destreza como penalidade em jogadas de ataque feitas contra você.` },
    { name: "Finta Melhorada", nivel: 2, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você pode optar por utilizar Destreza ao invés de Presença em testes de Enganação para fintar. Além disso, acertar um inimigo desprevenido pela sua finta causa um dado de dano adicional.` },

    // Nível 4
    { name: "Ação Ágil", nivel: 4, system: { categoria: "Lutador", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Uma vez por rodada, você pode gastar 2 PE para receber uma Ação Ágil, que pode ser usada para Andar, Desengajar ou Esconder.` },
    { name: "Acrobata", nivel: 4, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você passa a utilizar Destreza como atributo para calcular sua distância de pulo, assim como pode utilizar Acrobacia no lugar de Atletismo em testes para aumentar a sua distância de salto.` },
    { name: "Atacar e Recuar", nivel: 4, system: { categoria: "Lutador", custo: "1 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Uma vez por turno, quando acertar uma criatura com um ataque, você pode gastar 1 PE para se mover até 4,5 metros para longe da criatura acertada. Este movimento não causa ataques de oportunidade.` },
    { name: "Brutalidade", nivel: 4, system: { categoria: "Lutador", custo: "2 PE", ativacao: "Ação Livre", duracao: "Sustentada" }, description: `Como uma Ação Livre, gaste 2 PE para entrar em Brutalidade: recebe +2 em ataque corpo a corpo e dano. Não pode manter concentração ou usar Feitiços. Encerra se não atacar ou como ação livre.` },
    { name: "Defesa Marcial", nivel: 4, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Enquanto estiver desarmado ou empunhando uma arma marcial, você soma 1 + metade do seu Bônus de Treinamento à sua Defesa.` },
    { name: "Devolver Projéteis", nivel: 4, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `O dado de Aparar Projéteis se torna 3d10 e soma seu Nível de Lutador. Se o dano reduzir a zero, você pode devolver o projétil como parte da reação.` },
    { name: "Fluxo", nivel: 4, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `A cada nível de empolgação, recebe +1 em dano. No começo de cada rodada, recebe 4 PV temporários para cada nível de empolgação acima do primeiro.` },
    { name: "Fúria da Vingança", nivel: 4, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "1 rodada" }, description: `Ao ver um aliado cair a 0 PV: seus ataques causam +4 de dano; sua Defesa aumenta em +2; recebe +2 em TRs de Fortitude e Vontade contra o causador.` },
    { name: "Imprudência Motivadora", nivel: 4, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "Cena" }, description: `Ao iniciar combate, imponha uma restrição autoimposta. Se vencer com ela, recupera PE igual ao nível, recebe +2 em ataque e margem de crítico reduz em 1 na missão.` },
    { name: "Músculos Desenvolvidos", nivel: 4, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Você pode somar seu Modificador de Força ao invés de Destreza na sua Defesa (limitado pelo nível).` },
    { name: "Redirecionar Força", nivel: 4, system: { categoria: "Lutador", custo: "2 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Quando um inimigo errar um ataque corpo a corpo contra você, gaste 2 PE e reação para redirecionar o ataque para outra criatura no alcance.` },
    { name: "Segura pra Mim", nivel: 4, system: { categoria: "Lutador", custo: "3 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Quando for alvo de ataque ou habilidade, gaste 3 PE para colocar uma criatura que esteja agarrando na frente para receber o efeito.` },
    { name: "Sobrevivente", nivel: 4, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Com menos da metade da vida, recupera 1d6 + Con no começo do turno. Aumenta em níveis superiores.` },
    { name: "Voadora", nivel: 4, system: { categoria: "Lutador", custo: "3 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao realizar Investida desarmado, gaste 3 PE para realizar uma Voadora: +1d8 de dano a cada 3m de deslocamento (limitado por For/Des).` },

    // Nível 6
    { name: "Aprimoramento Marcial", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Soma metade do Bônus de Treinamento na CD de Especialização.` },
    { name: "Ataque Extra (Lutador)", nivel: 6, system: { categoria: "Lutador", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao realizar a ação Atacar, gaste 2 PE para atacar duas vezes.` },
    { name: "Brutalidade Sanguinária", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Enquanto Brutalidade" }, description: `Em Brutalidade, acertos críticos ou reduzir criatura a 0 PV aumenta o nível de dano em 1 (acumula até Bônus de Treino).` },
    { name: "Corpo Calejado", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Adiciona metade do Mod. de Constituição na Defesa e recebe PV adicionais igual ao nível de Lutador.` },
    { name: "Eliminar e Continuar", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Instantâneo" }, description: `Quando um inimigo danificado por você cai, receba 2d6 + nível + mod. atributo em PV temporários.` },
    { name: "Foguete Sem Ré", nivel: 6, system: { categoria: "Lutador", custo: "6 PE", ativacao: "Ação Completa", duracao: "Instantâneo" }, description: `Gaste 6 PE para se mover o dobro do deslocamento. Atropela criaturas (TR Reflexos, dano Xd10) e ataca no final.` },
    { name: "Golpe da Mão Aberta", nivel: 6, system: { categoria: "Lutador", custo: "4 PE", ativacao: "Ação Comum", duracao: "Instantâneo" }, description: `Ataque desarmado potente. Se acertar, alvo faz TR Fortitude ou fica Desorientado, Enjoado e Exposto.` },
    { name: "Ignorar Dor", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Recebe RD igual ao nível de empolgação. Contra dano físico, a RD é dobrada.` },
    { name: "Manobras Finalizadoras", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Libera acesso a manobras finalizadoras (Ataque Circular, Golpe Certeiro, Quebra Crânio).` },
    { name: "Poder Corporal", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Dano desarmado aumenta em 2 níveis. Uma vez por rodada, pode aplicar uma Manobra junto com o dano.` },
    { name: "Potência Superior", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Derrubar causa 2d6+Força de dano. Empurrar joga 4,5m ao invés de 1,5m.` },
    { name: "Sequência Inconsequente", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `O bônus de Ataque Inconsequente se aplica a todos os ataques do turno.` },
    { name: "Um Com a Arma", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Armas dedicadas superam resistência. Pode usar reação para evitar ser desarmado.` },

    // Nível 8
    { name: "Aptidões de Luta", nivel: 8, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Aumenta nível de aptidão em Aura ou Controle e Leitura em 1.` },
    { name: "Ataques Ressoantes", nivel: 8, system: { categoria: "Lutador", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Gaste 2 PE ao atacar: inimigos adjacentes ao alvo (com defesa menor que seu ataque) recebem metade do dano.` },
    { name: "Brutalidade Aprimorada", nivel: 8, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Ao entrar em brutalidade, recebe PV temporários. Bônus de dano base vira +4.` },
    { name: "Feitiço e Punho", nivel: 8, system: { categoria: "Lutador", custo: "2 PE", ativacao: "Especial", duracao: "Instantâneo" }, description: `Ao usar Feitiço de dano alvo único, gaste 2 PE para realizar um ataque corpo a corpo contra o mesmo alvo.` },
    { name: "Golpear Brecha", nivel: 8, system: { categoria: "Lutador", custo: "2 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Se aparar um ataque com sucesso, gaste 2 PE para atacar o inimigo como parte da reação.` },
    { name: "Oportunista", nivel: 8, system: { categoria: "Lutador", custo: "2 PE", ativacao: "Reação", duracao: "Instantâneo" }, description: `Quando um inimigo no alcance é atingido por aliado flanqueando, gaste 2 PE para atacá-lo.` },
    { name: "Pancada Desnorteante", nivel: 8, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "Até próximo turno" }, description: `Em um crítico corpo a corpo, alvo recebe desvantagem em um TR à sua escolha.` },
    { name: "Punhos Letais", nivel: 8, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Desarmado: Margem de crítico -1 e ignora RD igual ao bônus de treino.` },

    // Nível 10
    { name: "Alma Quieta", nivel: 10, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Vantagem para resistir a Amedrontado, Atordoado e Confuso.` },
    { name: "Corpo Sincronizado", nivel: 10, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Vantagem para resistir a Caído e Exposto.` },
    { name: "Empolgar-se", nivel: 10, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Pode subir dois níveis de empolgação de uma vez (limite igual bônus de treino/descanso).` },
    { name: "Impacto Demolidor", nivel: 10, system: { categoria: "Lutador", custo: "", ativacao: "Ação Comum", duracao: "Instantâneo" }, description: `Ataque que também Empurra (dobro da distância) e quebra objetos no caminho (dano de colisão).` },
    { name: "Insistência", nivel: 10, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Se cair a 0 PV, pode voltar a nível de empolgação 1 e se curar (dano desarmado). Uma vez por cena.` },
    { name: "Mente em Paz", nivel: 10, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Vantagem contra Amedrontado, Atordoado e Confuso.` },

    // Nível 12+
    { name: "Armas Absolutas", nivel: 12, system: { categoria: "Lutador", custo: "2 PE (+2/rodada)", ativacao: "Especial", duracao: "Sustentada" }, description: `Com arma dedicada: +3 Defesa ou +3 Ataque. Pode rolar novamente erros uma vez por ataque.` },
    { name: "Corpo Arsenal", nivel: 12, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `Crítico desarmado pode aplicar efeito de Bastão, Haste ou Martelo.` },
    { name: "Seja Água", nivel: 16, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `+3m deslocamento, ignora terreno difícil físico, evita agarrão sem teste (1/rodada).` },
    { name: "Tempestade Sufocante", nivel: 12, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Até próximo turno" }, description: `Acertos acumulam penalidade de -1 na Defesa e TR do alvo.` },
    { name: "Corpo Supremo", nivel: 16, system: { categoria: "Lutador", custo: "", ativacao: "Passiva", duracao: "Permanente" }, description: `+3m movimento, +4 Defesa, RD massiva contra tipos físicos e +1 escolhido.` },

    // Extras / Manobras
    { name: "Duro na Queda (Portões da Morte)", nivel: 0, system: { categoria: "Lutador", custo: "1 falha morte", ativacao: "Especial", duracao: "Instantâneo" }, description: `Nas portas da morte, aceite uma falha para testar Vontade (CD 15+). Se passar, levanta com 1 PV e exaustão.` },
    { name: "Manobra: Ataque Circular", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Alcance +3m. Ataca todos os inimigos no alcance. +5 dano por inimigo.` },
    { name: "Manobra: Golpe Certeiro", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Trata resultado do dado do próximo ataque como 10 acima do rolado.` },
    { name: "Manobra: Quebra Crânio", nivel: 6, system: { categoria: "Lutador", custo: "", ativacao: "Especial", duracao: "Instantâneo" }, description: `Próximo ataque causa +2d10 dano. Alvo faz Fortitude (CD+5) ou fica Atordoado.` }
  ];

  // --- 2. CONFIGURAÇÃO E HELPERS ---

  const ICON_MAP = [
    { key: "aparar", icon: "icons/equipment/shield/heater-wooden-brown.webp" },
    { key: "defesa", icon: "icons/equipment/shield/heater-steel-grey.webp" },
    { key: "esquiva", icon: "icons/skills/movement/feet-winged-boots-glowing-yellow.webp" },
    { key: "finta", icon: "icons/skills/social/diplomacy-handshake-blue.webp" },
    { key: "mão", icon: "icons/skills/melee/unarmed-punch-fist.webp" },
    { key: "punho", icon: "icons/skills/melee/unarmed-punch-fist.webp" },
    { key: "desarmado", icon: "icons/skills/melee/unarmed-punch-fist.webp" },
    { key: "voadora", icon: "icons/skills/melee/strike-kick-flying-red.webp" },
    { key: "chute", icon: "icons/skills/melee/strike-kick-flying-red.webp" },
    { key: "ataque", icon: "icons/skills/melee/strike-sword-blood-red.webp" },
    { key: "golpe", icon: "icons/skills/melee/strike-sword-blood-red.webp" },
    { key: "pancada", icon: "icons/skills/melee/strike-hammer-destructive.webp" },
    { key: "impacto", icon: "icons/skills/melee/strike-hammer-destructive.webp" },
    { key: "brutalidade", icon: "icons/skills/wounds/blood-drip-droplet-red.webp" },
    { key: "sangue", icon: "icons/consumables/potions/potion-tube-corked-red.webp" },
    { key: "fúria", icon: "icons/skills/social/intimidation-impressing.webp" },
    { key: "empolga", icon: "icons/magic/fire/flame-burning-orange.webp" },
    { key: "fluxo", icon: "icons/magic/water/wave-water-blue.webp" },
    { key: "água", icon: "icons/magic/water/wave-water-blue.webp" },
    { key: "foguete", icon: "icons/skills/movement/trail-fire-orange.webp" },
    { key: "movimento", icon: "icons/skills/movement/feet-winged-boots-brown.webp" },
    { key: "ágil", icon: "icons/skills/movement/feet-winged-boots-brown.webp" },
    { key: "corpo", icon: "icons/magic/life/heart-glowing-red.webp" },
    { key: "músculos", icon: "icons/magic/life/heart-glowing-red.webp" },
    { key: "resist", icon: "icons/magic/defensive/shield-barrier-blue.webp" },
    { key: "mente", icon: "icons/sundries/books/book-open-purple.webp" },
    { key: "alma", icon: "icons/magic/life/heart-shadow-violet.webp" },
    { key: "arma", icon: "icons/weapons/swords/sword-guard-steel-green.webp" }
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
  const existingMap = new Map(existingItems.map(i => [i.name.trim().toLowerCase(), i.id]));

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
  
  // Agrupa níveis por categoria (apenas Lutador neste caso, mas preparado para expansão)
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

    // Adiciona bloco de pré-requisito na descrição para que a validação local o detecte
    const sourceDescription = (entry.description || '') + (entry.nivel && entry.nivel > 0 ? `\n\n[Pré: Nível ${entry.nivel}]` : '');
    const descriptionHtml = formatDescription(sourceDescription);
    const icon = await resolveIcon(entry.img || guessIcon(entry.name));

    const itemData = {
      name: entry.name,
      type: "habilidade", 
      img: icon,
      folder: folderId,
      system: {
        fonte: { value: PACK_LABEL },
        descricao: { value: descriptionHtml },
        custo: { value: parseInt(entry.system?.custo?.match(/\d+/)?.[0] || 0), label: "Custo (PE)" },
        custoTexto: { value: entry.system?.custo || "", label: "Custo (texto)" },
        acao: { value: entry.system?.ativacao || "Passiva", label: "Ação" },
        requisito: { value: (entry.nivel && entry.nivel > 0) ? `Nível ${entry.nivel}` : (entry.system?.requisitos || ""), label: "Requisito" },
        
        tipo: { value: "habilidade" }, 
        categoria: { value: catName },
        ativacao: { value: entry.system?.ativacao || "" },
        duracao: { value: entry.system?.duracao || "" }
      }
    };

    const existingId = existingMap.get(entry.name.trim().toLowerCase());
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
