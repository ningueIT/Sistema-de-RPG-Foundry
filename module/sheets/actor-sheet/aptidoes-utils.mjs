// Helpers de aptidões: inferência de tipo de ação e parsing de pré-requisitos.

export function inferirTipoAcao(descr = '') {
  if (!descr) return 'Passiva';
  const d = descr.toLowerCase();

  // Ordem importa: reações e formas específicas primeiro.
  if (d.includes('como reação') || d.includes('como reac')) return 'Reação';
  if (d.includes('como ação bônus') || d.includes('como ação bonus') || d.includes('ação bônus')) return 'Ação Bônus';
  if (d.includes('como ação de movimento') || d.includes('ação de movimento')) return 'Ação de Movimento';
  if (d.includes('como ação comum') || (d.includes('como ação') && d.match(/como ação[,\s]/))) return 'Ação Comum';
  if (d.includes('como ação livre') || d.includes('ação livre')) return 'Ação Livre';

  // Gatilhos ao ocorrer algo normalmente são passivos/trigger
  if (d.startsWith('ao ') || d.includes('quando ') || d.includes('ao receber') || d.includes('ao acertar') || d.includes('ao matar')) return 'Passiva';

  // Padrão
  return 'Passiva';
}

export function inferirCustoPE(descr = '') {
  if (!descr) return undefined;
  const d = descr
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

  // Frases explícitas de custo zero
  if (d.includes('nao consome pe') || d.includes('nao consome p.e') || d.includes('sem custo de pe')) return 0;

  // Procura padrões comuns: "Custo: X PE" / "custa X PE" / "gastando X PE" / "gaste X PE"
  // (se houver múltiplos números no texto, prioriza o primeiro após a palavra custo/custa/gaste/gastando)
  const patterns = [
    /custo\s*:\s*(\d+)\s*pe\b/,
    /custa\s*(\d+)\s*pe\b/,
    /gaste\s*(\d+)\s*pe\b/,
    /gastando\s*(\d+)\s*pe\b/,
  ];
  for (const re of patterns) {
    const m = d.match(re);
    if (m?.[1]) return Number.parseInt(m[1], 10);
  }

  // Alguns textos usam "X PE por rodada" / "X PE/rodada" sem escrever "Custo:".
  const mRodada = d.match(/\b(\d+)\s*pe\s*(por\s*rodada|\/\s*rodada|\/\s*turno|por\s*turno)\b/);
  if (mRodada?.[1]) return Number.parseInt(mRodada[1], 10);

  // Custos variáveis: não inventamos um número.
  if (d.includes('custo: variavel') || d.includes('custo variavel') || d.includes('custo: vari') || d.includes('custo: vari')) return undefined;
  if (d.includes('custo: igual ao custo') || d.includes('custo igual ao custo')) return undefined;

  // Último fallback: "X PE" em algum lugar (pega o primeiro)
  const mAny = d.match(/\b(\d+)\s*pe\b/);
  if (mAny?.[1]) return Number.parseInt(mAny[1], 10);

  return undefined;
}

function _normalizarTextoAptidao(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function _mapearCampoAptidaoDeTexto(textoNormalizado) {
  if (!textoNormalizado) return null;
  if (textoNormalizado.includes('aura')) return 'aura';
  if (textoNormalizado.includes('controle') || textoNormalizado.includes('leitura')) return 'controleELeitura';
  if (textoNormalizado.includes('barreira') || textoNormalizado.includes('barreiras')) return 'barreiras';
  if (textoNormalizado.includes('dominio')) return 'dominio';
  if (textoNormalizado.includes('energia reversa')) return 'energiaReversa';
  return null;
}

function _mapearAtributoDeTexto(textoNormalizado) {
  if (!textoNormalizado) return null;
  if (textoNormalizado.includes('forca')) return 'forca';
  if (textoNormalizado.includes('destreza')) return 'destreza';
  if (textoNormalizado.includes('constituicao')) return 'constituicao';
  if (textoNormalizado.includes('inteligencia')) return 'inteligencia';
  if (textoNormalizado.includes('sabedoria')) return 'sabedoria';
  if (textoNormalizado.includes('presenca')) return 'presenca';
  return null;
}

export function extrairPrereqsDaDescricao(desc = '', catFallback = null) {
  const texto = _normalizarTextoAptidao(desc);

  // Atributos mínimos: "Presença 16", "Força 14", etc.
  const atributosMin = {};
  const reAttr = /\b(forca|destreza|constituicao|inteligencia|sabedoria|presenca)\s*(\d+)\b/g;
  for (const m of texto.matchAll(reAttr)) {
    const atributo = _mapearAtributoDeTexto(m?.[1]);
    const n = m?.[2] ? Number.parseInt(m[2], 10) : null;
    if (atributo && Number.isFinite(n)) atributosMin[atributo] = Math.max(atributosMin[atributo] || 0, n);
  }

  // Pré-requisitos textuais (nomes de outras aptidões), geralmente em [Pré: ...]
  // Retorna tokens normalizados para o caller resolver contra o catálogo.
  let prereqTokens = [];
  // IMPORTANTE: ordem importa. Se "pre" vier antes, ele casa em "pre-requisito" e sobra "-requisito".
  const mPre = texto.match(/\[(pre-requisito|pre requisito|prerequisito|pre)[^\]]*\]/i);
  if (mPre?.[0]) {
    let inner = mPre[0]
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .replace(/^(pre-requisito|pre requisito|prerequisito|pre)\s*: ?\s*/i, '');

    // normaliza separadores (",", ";" e " e ")
    inner = inner.replace(/\s+e\s+/g, ',');
    prereqTokens = inner
      .split(/[,;]+/g)
      .map(s => s.trim())
      .filter(Boolean)
      .map(_normalizarTextoAptidao)
      // remove tokens que claramente não são aptidões (nível/aptidão/numéricos)
      .filter(t => !t.includes('nivel') && !t.includes('aptidao') && !/\d/.test(t))
      // remove trechos que são requisitos de treinamento/perícia, não aptidões
      .filter(t => !t.startsWith('treinamento em ') && !t.startsWith('treinado em '))
      // remove categorias soltas (isso já é tratado por aptidaoCampo/aptidaoMin)
      .filter(t => !['aura', 'dominio', 'barreira', 'barreiras', 'controle', 'leitura', 'controle e leitura', 'energia reversa'].includes(t))
      // remove sobra de parsing tipo "-requisito:" caso venha texto legacy
      .map(t => t.replace(/^[-\s]*requisito\s*:\s*/i, '').trim())
      .filter(Boolean);
  }

  // Nível do personagem: "Nível 8" (prioriza trechos dentro de [Pré: ...] quando presente)
  let nivelPersonagemMin = null;
  // Helper: retorna o último número encontrado para 'nivel' numa string
  function _ultimoNivelEmTexto(t) {
    const re = /\bnivel\s*[:]*\s*(\d+)\b/g;
    let match = null;
    for (const m of t.matchAll(re)) match = m;
    return match?.[1] ? Number.parseInt(match[1], 10) : null;
  }

  // Se houve um bloco [Pré: ...], tenta extrair o nível dali primeiro (usa o ÚLTIMO 'nivel' dentro do bloco)
  if (mPre?.[0]) {
    let inner = mPre[0].replace(/^\[/, '').replace(/\]$/, '').replace(/^(pre|pre-requisito|pre requisito|prerequisito)\s*:?\s*/i, '');
    const innerNorm = _normalizarTextoAptidao(inner);
    const nivelInner = _ultimoNivelEmTexto(innerNorm);
    if (nivelInner) nivelPersonagemMin = nivelInner;
  }
  // fallback: busca no texto completo (usa último 'nivel' do texto)
  if (nivelPersonagemMin == null) {
    const nivelFull = _ultimoNivelEmTexto(texto);
    if (nivelFull) nivelPersonagemMin = nivelFull;
  }

  // Nível de aptidão: "Aptidão em Barreira ... Nível 3" / "Controle e Leitura Nível 3" / "Aura Nível 3"
  // Pega o último match mais específico.
  let aptidaoCampo = null;
  let aptidaoMin = null;

  const re1 = /(aptidao\s+em\s+([a-z\s]+?)\s+nivel\s*(\d+))/g;
  for (const m of texto.matchAll(re1)) {
    const campo = _mapearCampoAptidaoDeTexto(m?.[2]);
    const n = m?.[3] ? Number.parseInt(m[3], 10) : null;
    if (campo && Number.isFinite(n)) {
      aptidaoCampo = campo;
      aptidaoMin = n;
    }
  }

  // Formato: "Controle e Leitura Nível 3", "Barreira e Domínio Nível 4" (pega primeiro campo reconhecido)
  if (aptidaoCampo == null) {
    const re2 = /\b(aura|controle\s+e\s+leitura|controle|leitura|barreira|barreiras|dominio|energia\s+reversa)\b[^\[]*?\bnivel\s*(\d+)\b/i;
    const m2 = texto.match(re2);
    if (m2?.[1] && m2?.[2]) {
      const campo = _mapearCampoAptidaoDeTexto(_normalizarTextoAptidao(m2[1]));
      const n = Number.parseInt(m2[2], 10);
      if (campo && Number.isFinite(n)) {
        aptidaoCampo = campo;
        aptidaoMin = n;
      }
    }
  }

  // Se a descrição falar "Nível de Aptidão 2" sem dizer qual, usa a categoria (quando for uma das 5)
  if (aptidaoCampo == null) {
    const m3 = texto.match(/\bnivel\s+de\s+aptidao\s*(\d+)\b/);
    if (m3?.[1]) {
      const n = Number.parseInt(m3[1], 10);
      if (Number.isFinite(n) && ['aura', 'controleELeitura', 'barreiras', 'dominio', 'energiaReversa'].includes(catFallback)) {
        aptidaoCampo = catFallback;
        aptidaoMin = n;
      }
    }
  }

  // Casos escritos como: "Nível de Aptidão em Barreira 2" ou "Nível de Aptidao em Barreira 2"
  if (aptidaoCampo == null) {
    const m4 = texto.match(/\bnivel\s+de\s+aptidao\s+em\s+(aura|controle|leitura|barreira|barreiras|dominio|energia\s+reversa)\s*(\d+)\b/);
    if (m4?.[1] && m4?.[2]) {
      const campo = _mapearCampoAptidaoDeTexto(_normalizarTextoAptidao(m4[1]));
      const n = Number.parseInt(m4[2], 10);
      if (campo && Number.isFinite(n)) {
        aptidaoCampo = campo;
        aptidaoMin = n;
      }
    }
  }

  // Atalho sem número explícito: se o texto mencionar 'paredes resistentes', aplica o requisito conhecido
  if ((aptidaoCampo == null || aptidaoMin == null) && texto.includes('paredes resistentes')) {
    aptidaoCampo = 'barreiras';
    aptidaoMin = Math.max(aptidaoMin || 2, 2);
    nivelPersonagemMin = Math.max(nivelPersonagemMin || 4, 4);
  }

  return {
    nivelPersonagemMin,
    aptidaoCampo,
    aptidaoMin,
    atributosMin,
    prereqTokens,
  };
}

export function extrairMacrosDaDescricao(desc = '') {
  if (!desc) return [];
  const texto = String(desc);
  const re = /\[\s*macro\s*:\s*([^\]\n]+)\]/ig;
  const macros = [];
  for (const m of texto.matchAll(re)) {
    const name = (m?.[1] || '').trim();
    if (name) macros.push(name);
  }
  return macros;
}
