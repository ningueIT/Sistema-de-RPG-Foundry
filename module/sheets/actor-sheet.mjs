import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

import { MAPA_ATRIBUTOS } from './actor-sheet/atributos.mjs';
// Mapeamento configurável para escolher qual atributo usar ao recuperar Dados de Energia (DE)
const MAPA_DE_ATRIBUTOS = {
  'lutador': 'sabedoria',
  'especialista em combate': 'sabedoria',
  'especialista em técnica': 'inteligencia',
  'especialista em tecnica': 'inteligencia',
  'controlador': 'inteligencia',
  'suporte': 'sabedoria',
  'restringido': null // explícito: nenhum DE
};
import {
  APTIDOES_CATALOGO,
  APTIDOES_DESCRICOES,
  APTIDOES_DESC_COMPLETA,
} from './actor-sheet/aptidoes-data.mjs';
import { extrairPrereqsDaDescricao, inferirTipoAcao, inferirCustoPE } from './actor-sheet/aptidoes-utils.mjs';
import { handleLutadorUse } from '../helpers/lutador-habilidades.mjs';
import LevelUpDialog from '../apps/level-up-dialog.mjs';

function _normalizarTextoAptidaoLocal(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function _resolverAptidaoPorLabel(tokenNormalizado) {
  if (!tokenNormalizado) return null;

  // Aliases explícitos para pré-requisitos comuns (texto → chave do catálogo)
  // Mantém previsível e evita depender de heurísticas.
  const alias = {
    'tecnicas de barreira': { cat: 'barreiras', key: 'tecnicasDeBarreiras', label: 'Técnicas de Barreiras' },
    'tecnicas de barreiras': { cat: 'barreiras', key: 'tecnicasDeBarreiras', label: 'Técnicas de Barreiras' },
    'expansao incompleta': { cat: 'dominio', key: 'expansaoDeDominioIncompleta', label: 'Expansão de Domínio Incompleta' },
    'expansao de dominio incompleta': { cat: 'dominio', key: 'expansaoDeDominioIncompleta', label: 'Expansão de Domínio Incompleta' },
    'expansao completa': { cat: 'dominio', key: 'expansaoDeDominioCompleta', label: 'Expansão de Domínio Completa' },
    'expansao de dominio completa': { cat: 'dominio', key: 'expansaoDeDominioCompleta', label: 'Expansão de Domínio Completa' },
    'acerto garantido': { cat: 'dominio', key: 'acertoGarantido', label: 'Acerto Garantido' },
  };
  const aliased = alias[tokenNormalizado];
  if (aliased) return aliased;

  // 1) tentativa exata
  for (const [cat, bloco] of Object.entries(APTIDOES_CATALOGO ?? {})) {
    const entradas = bloco?.entradas;
    if (!Array.isArray(entradas)) continue;
    for (const entry of entradas) {
      const lbl = _normalizarTextoAptidaoLocal(entry?.label ?? '');
      if (lbl && lbl === tokenNormalizado) return { cat, key: entry.key, label: entry.label };
    }
  }

  // 2) tentativa por inclusão/substring (token dentro do label ou vice-versa)
  for (const [cat, bloco] of Object.entries(APTIDOES_CATALOGO ?? {})) {
    const entradas = bloco?.entradas;
    if (!Array.isArray(entradas)) continue;
    for (const entry of entradas) {
      const lbl = _normalizarTextoAptidaoLocal(entry?.label ?? '');
      if (!lbl) continue;
      if (lbl.includes(tokenNormalizado) || tokenNormalizado.includes(lbl)) {
        return { cat, key: entry.key, label: entry.label };
      }
      // comparar sem plural simples (s)
      const lblSing = lbl.replace(/s\b/, '');
      const tokSing = tokenNormalizado.replace(/s\b/, '');
      if (lblSing === tokSing || lblSing.includes(tokSing) || tokSing.includes(lblSing)) {
        return { cat, key: entry.key, label: entry.label };
      }
    }
  }

  // 3) tentativa por palavras-chave compostas (todas as palavras do token presentes no label)
  const tokenWords = tokenNormalizado.split(/\s+/).filter(Boolean);
  if (tokenWords.length > 0) {
    for (const [cat, bloco] of Object.entries(APTIDOES_CATALOGO ?? {})) {
      const entradas = bloco?.entradas;
      if (!Array.isArray(entradas)) continue;
      for (const entry of entradas) {
        const lbl = _normalizarTextoAptidaoLocal(entry?.label ?? '');
        if (!lbl) continue;
        const matchesAll = tokenWords.every(w => lbl.includes(w) || w.length <= 2);
        if (matchesAll) return { cat, key: entry.key, label: entry.label };
      }
    }
  }

  return null;
}

function _resolverTecnicaPorLabel(tokenNormalizado, actor) {
  if (!tokenNormalizado || !actor) return null;
  // Procura nas técnicas embutidas no ator (Item.type === 'tecnica')
  const tecnicas = actor.items?.filter?.(i => i?.type === 'tecnica') ?? [];
  if (!Array.isArray(tecnicas) || tecnicas.length === 0) return null;

  // 1) tentativa exata por nome normalizado
  for (const t of tecnicas) {
    const nameNorm = _normalizarTextoAptidaoLocal(t?.name ?? '');
    if (nameNorm && nameNorm === tokenNormalizado) return { type: 'tecnica', itemId: t.id, label: t.name };
  }

  // 2) substring / palavras-chave
  for (const t of tecnicas) {
    const nameNorm = _normalizarTextoAptidaoLocal(t?.name ?? '');
    if (!nameNorm) continue;
    if (nameNorm.includes(tokenNormalizado) || tokenNormalizado.includes(nameNorm)) return { type: 'tecnica', itemId: t.id, label: t.name };
    const nameSing = nameNorm.replace(/s\b/, '');
    const tokSing = tokenNormalizado.replace(/s\b/, '');
    if (nameSing === tokSing || nameSing.includes(tokSing) || tokSing.includes(nameSing)) return { type: 'tecnica', itemId: t.id, label: t.name };
  }

  // 3) palavras todas presentes
  const tokenWords = tokenNormalizado.split(/\s+/).filter(Boolean);
  if (tokenWords.length > 0) {
    for (const t of tecnicas) {
      const nameNorm = _normalizarTextoAptidaoLocal(t?.name ?? '');
      if (!nameNorm) continue;
      const matchesAll = tokenWords.every(w => nameNorm.includes(w) || w.length <= 2);
      if (matchesAll) return { type: 'tecnica', itemId: t.id, label: t.name };
    }
  }

  return null;
}

function _getActorNivel(actor) {
  try {
    const detalhes = actor.system?.detalhes || {};
    const nivelPrincipal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
    const nivelSecundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;
    if (nivelPrincipal || nivelSecundario) return nivelPrincipal + nivelSecundario;
    return Number(detalhes?.nivel?.value ?? 0) || 0;
  } catch (e) { return 0; }
}

function _normalizarNomeClasse(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function _getNivelDaClasse(actor, classeNome) {
  if (!actor) return 0;
  const alvo = _normalizarNomeClasse(classeNome);
  if (!alvo) return 0;

  const detalhes = actor.system?.detalhes ?? {};
  const classePrincipal = _normalizarNomeClasse(detalhes?.classe?.value ?? '');
  const classeSecundaria = _normalizarNomeClasse(detalhes?.multiclasse?.value ?? '');
  const nivelPrincipal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
  const nivelSecundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;

  let total = 0;
  if (classePrincipal && classePrincipal === alvo) total += nivelPrincipal;
  if (classeSecundaria && classeSecundaria === alvo) total += nivelSecundario;
  return total;
}

async function _verificarPrereqsTecnica(item, actor, visited = new Set()) {
  if (!item) return true;
  if (!actor) return true;
  // Evita loops
  if (visited.has(item.id)) return true;
  visited.add(item.id);

  // Requisitos podem estar em system.requisito.value e/ou na descrição
  const requisitoText = String(item.system?.requisito?.value ?? '').trim();
  const descText = String(item.system?.descricao?.value ?? '').trim();
  const combined = `${requisitoText} ${descText}`.trim();

  const prereq = extrairPrereqsDaDescricao(combined, null);

  // Nível do personagem
  const actorNivel = _getActorNivel(actor);
  if (prereq?.nivelPersonagemMin && actorNivel < prereq.nivelPersonagemMin) return false;

  // Aptidão mínima
  if (prereq?.aptidaoCampo && prereq?.aptidaoMin) {
    const atual = Number(actor.system?.aptidaoNiveis?.[prereq.aptidaoCampo]?.value ?? 0) || 0;
    if (atual < prereq.aptidaoMin) return false;
  }

  // Atributos mínimos
  if (prereq?.atributosMin && Object.keys(prereq.atributosMin).length > 0) {
    for (const [attrKey, minVal] of Object.entries(prereq.atributosMin)) {
      const atual = Number(actor.system?.atributos?.[attrKey]?.value ?? 0) || 0;
      if (atual < Number(minVal)) return false;
    }
  }

  // Tokens de pré-requisito: podem ser aptidões ou técnicas
  if (Array.isArray(prereq?.prereqTokens) && prereq.prereqTokens.length > 0) {
    for (const token of prereq.prereqTokens) {
      const resolvedA = _resolverAptidaoPorLabel(token);
      if (resolvedA) {
        const hasIt = Boolean(actor.system?.aptidoes?.[resolvedA.cat]?.[resolvedA.key]);
        if (!hasIt) return false;
        continue;
      }
      const resolvedT = _resolverTecnicaPorLabel(token, actor);
      if (resolvedT) {
        const tItem = actor.items.find(i => i.id === resolvedT.itemId);
        if (!tItem) return false;
        const ok = await _verificarPrereqsTecnica(tItem, actor, visited);
        if (!ok) return false;
        continue;
      }
      // Token não mapeado: assume verificado para evitar falso negativo
      continue;
    }
  }

  return true;
}
export class BoilerplateActorSheet extends ActorSheet {
  // Guarda valor anterior do select de Origem para reverter se o usuário cancelar
  _prevOrigemValue = null;

  // Tipo alvo ao soltar Aptidões na ficha ("passiva" | "ativa")
  _dropAptidaoTipo = null;
  
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['feiticeiros-e-maldicoes', 'sheet', 'actor'],
      template: 'systems/feiticeiros-e-maldicoes/templates/actor/actor-character-sheet.hbs',
      width: 1050,
      height: 900,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'atributos' }],
    });
  }

  get template() {
    return 'systems/feiticeiros-e-maldicoes/templates/actor/actor-character-sheet.hbs';
  }

/** @override */
  async getData() {
    const context = super.getData();
    const actorData = this.document.toObject(false);
    context.system = actorData.system;
    context.flags = actorData.flags;
    context.config = CONFIG.FEITICEIROS ?? CONFIG.BOILERPLATE;

    // Disponibiliza catálogo de aptidões para o template.
    // Clonamos o catálogo para poder ocultar entradas dependentes (ex.: paredesResistentes)
    const aptCatalogClone = foundry.utils.deepClone(APTIDOES_CATALOGO);
    context.aptidoesCatalogo = aptCatalogClone;

    if (actorData.type == 'character') {
            // Se o ator não tem a técnica de Barreiras, removemos a entrada de Paredes Resistentes
            const hasTecnicasBarreiras = Boolean(context.system?.aptidoes?.barreiras?.tecnicasDeBarreiras);
            if (!hasTecnicasBarreiras && context.aptidoesCatalogo?.barreiras?.entradas) {
              context.aptidoesCatalogo.barreiras.entradas = context.aptidoesCatalogo.barreiras.entradas.filter(e => e.key !== 'paredesResistentes');
            }
            const detalhes = context.system.detalhes || {};

            // derivados: limite PE, RD barreira, refinamento
            context.system.aptidaoDerivados = context.system.aptidaoDerivados || {};
            const clNivel = Number(context.system?.aptidaoNiveis?.controleELeitura?.value ?? 0) || 0;
            const barNivel = Number(context.system?.aptidaoNiveis?.barreiras?.value ?? 0) || 0;
            const domNivel = Number(context.system?.aptidaoNiveis?.dominio?.value ?? 0) || 0;
            const nivelPrincipal = Number(detalhes?.niveis?.principal?.value ?? 0) || 0;
            const nivelSecundario = Number(detalhes?.niveis?.secundario?.value ?? 0) || 0;
            const charNivel = (nivelPrincipal || nivelSecundario)
              ? (nivelPrincipal + nivelSecundario)
              : (Number(detalhes?.nivel?.value ?? 0) || 0);

            context.system.aptidaoDerivados.limiteGastoPE = { label: 'Limite PE (CL)', value: clNivel };
            context.system.aptidaoDerivados.rdBarreira = { label: 'RD Barreira', value: barNivel };
            context.system.aptidaoDerivados.refinamento = { label: 'Refinamento', value: charNivel + domNivel };

            // BARREIRA: cálculos específicos
            const tamanhoSegmentoM = 1.5;
            const custoPEporParede = 1;
            // PV padrão por parede: 5 + (Nível de Aptidão em Barreira × Metade do Nível do Personagem)
            const pvPadrao = 5 + (barNivel * Math.floor(charNivel / 2));
            // PV com Paredes Resistentes: 10 + (Nível de Aptidão em Barreira × Nível do Personagem)
            const pvParedesResistentes = 10 + (barNivel * charNivel);
            // Casca do Domínio: PV igual ao dobro do total que suas Técnicas de Barreira teriam (usamos dobro do PV padrão aqui)
            const pvCascaDominio = pvPadrao * 2;

            context.system.aptidaoDerivados.barreira = {
              tamanhoSegmentoM,
              custoPEporParede,
              pvPadrao,
              pvParedesResistentes,
              pvCascaDominio,
              maxSegmentos: 6,
              // para compatibilidade com templates que esperam label/value
              pvPadraoObj: { label: 'PV por Parede (Padrão)', value: pvPadrao },
              pvParedesResistentesObj: { label: 'PV Paredes Resistentes', value: pvParedesResistentes },
              pvCascaDominioObj: { label: 'PV Casca do Domínio', value: pvCascaDominio }
            };

        const maldLabel = context.system?.detalhes?.racaMaldicao?.value
          ? `Maldição - ${context.system.detalhes.racaMaldicao.value}`
          : 'Maldição';

        // `selectOptions` espera um objeto {value: label}
        context.listas = {
          origens: {
            'Inato': 'Inato',
            'Herdado': 'Herdado',
            'Derivado': 'Derivado',
            'Restringido': 'Restringido',
            'Feto Amaldiçoado Híbrido': 'Feto Amaldiçoado Híbrido',
            'Sem Técnica': 'Sem Técnica',
            'Corpo Amaldiçoado Mutante': 'Corpo Amaldiçoado Mutante',
            'Maldição': maldLabel,
          },
          classes: {
            'Lutador': 'Lutador',
            'Especialista em Combate': 'Especialista em Combate',
            'Especialista em Técnica': 'Especialista em Técnica',
            'Controlador': 'Controlador',
            'Suporte': 'Suporte',
            'Restringido': 'Restringido',
          },
          multiclasse: {
            'Nenhuma': 'Nenhuma',
            'Lutador': 'Lutador',
            'Especialista em Combate': 'Especialista em Combate',
            'Especialista em Técnica': 'Especialista em Técnica',
            'Controlador': 'Controlador',
            'Suporte': 'Suporte',
            'Restringido': 'Restringido',
          },
        };

        // --- CÁLCULO DAS BARRAS DE PORCENTAGEM ---
        if (context.system.recursos) {
            for (let [key, resource] of Object.entries(context.system.recursos)) {
                if (resource.max > 0) {
                    resource.percent = Math.max(0, Math.min(100, Math.round((resource.value / resource.max) * 100)));
                } else {
                    resource.percent = 0;
                }
            }
        }

        // Sincroniza `integridade` inicialmente apenas se o ator NÃO tiver o campo configurado
        try {
          const hp = context.system?.recursos?.hp;
          const actorHasIntegridade = typeof actorData.system?.recursos?.integridade?.value !== 'undefined' || typeof actorData.system?.recursos?.integridade?.max !== 'undefined';
          if (hp && !actorHasIntegridade) {
            context.system.recursos.integridade = context.system.recursos.integridade || {};
            context.system.recursos.integridade.value = Number(hp.value ?? 0) || 0;
            context.system.recursos.integridade.max = Number(hp.max ?? hp.value ?? 0) || 0;
            context.system.recursos.integridade.percent = (context.system.recursos.integridade.max > 0)
              ? Math.max(0, Math.min(100, Math.round((context.system.recursos.integridade.value / context.system.recursos.integridade.max) * 100)))
              : 0;
          }
        } catch (e) { /* ignore */ }

        // --- APTIDÕES: GARANTE DEFAULTS PARA ATORES ANTIGOS ---
        // Atores criados antes da adição de `system.aptidoes` podem não ter o bloco salvo.
        // Mescla o model do sistema (template.json) com os dados atuais do ator para o template renderizar.
        // Observação: em Foundry, o model costuma ficar em `game.system.model.Actor[actorType]`.
        const modelAptidoes = game?.system?.model?.Actor?.[actorData.type]?.aptidoes ?? {};

        if (Object.keys(modelAptidoes).length > 0) {
          context.system.aptidoes = foundry.utils.mergeObject(
            foundry.utils.deepClone(modelAptidoes),
            context.system.aptidoes ?? {},
            { inplace: false, overwrite: true }
          );
        } else {
          // Fallback mínimo pra não quebrar o template.
          context.system.aptidoes = context.system.aptidoes ?? {};
        }

        // --- NÍVEIS DE APTIDÃO (AU/CL/BAR/DOM/ER) ---
        // Mesma lógica: atores antigos podem não ter `system.aptidaoNiveis`.
        const modelAptidaoNiveis = game?.system?.model?.Actor?.[actorData.type]?.aptidaoNiveis ?? {
          aura: { value: 0, label: 'Aura (AU)' },
          controleELeitura: { value: 0, label: 'Controle e Leitura (CL)' },
          barreiras: { value: 0, label: 'Barreira (BAR)' },
          dominio: { value: 0, label: 'Domínio (DOM)' },
          energiaReversa: { value: 0, label: 'Energia Reversa (ER)' },
        };

        context.system.aptidaoNiveis = foundry.utils.mergeObject(
          foundry.utils.deepClone(modelAptidaoNiveis),
          context.system.aptidaoNiveis ?? {},
          { inplace: false, overwrite: true }
        );

        const clamp05 = (n) => Math.max(0, Math.min(5, Number(n ?? 0) || 0));
        for (const k of ['aura', 'controleELeitura', 'barreiras', 'dominio', 'energiaReversa']) {
          if (!context.system.aptidaoNiveis[k]) continue;
          context.system.aptidaoNiveis[k].value = clamp05(context.system.aptidaoNiveis[k].value);
        }

        // Pontos ganhos por nível:
        // - níveis pares: +1
        // - nível 10 e 20: +1 extra adicional (totalizando 2 ganhos nesses níveis)
        const nivelTotalDerivado = context.system.detalhes?.nivel?.value ??
          ((context.system.detalhes?.niveis?.principal?.value || 0) + (context.system.detalhes?.niveis?.secundario?.value || 0));

        // Defaults para Dados de Vida / Dados de Energia: quantidade igual ao nível
        try {
          const lvl = Number(nivelTotalDerivado) || 0;
          context.system.combate = context.system.combate || {};
          // Dados de Vida
          context.system.combate.dadosVida = context.system.combate.dadosVida || {};
          context.system.combate.dadosVida.max = Number(context.system.combate.dadosVida.max ?? lvl) || lvl;
          context.system.combate.dadosVida.value = Number(context.system.combate.dadosVida.value ?? context.system.combate.dadosVida.max) || context.system.combate.dadosVida.max;
          // Se não tiver lado configurado, define por classe (defaults)
          if (!context.system.combate.dadosVida.lado) {
            const cls = String(context.system.detalhes?.classe?.value ?? '').toLowerCase();
            if (cls.includes('lutador') || cls.includes('especialista em combate')) context.system.combate.dadosVida.lado = '1d10';
            else if (cls.includes('restringido')) context.system.combate.dadosVida.lado = '1d12';
            else context.system.combate.dadosVida.lado = '1d8';
          }

          // Dados de Energia
          context.system.combate.dadosEnergia = context.system.combate.dadosEnergia || {};
          // Normaliza nome da classe para lookup seguro
          const clsRaw = String(context.system.detalhes?.classe?.value ?? '');
          const clsNorm = clsRaw.toLowerCase().trim();

          // Se for 'restringido', garante que não tenham DE
          if (clsNorm === 'restringido') {
            context.system.combate.dadosEnergia.max = 0;
            context.system.combate.dadosEnergia.value = 0;
            context.system.combate.dadosEnergia.lado = '';
          } else {
            context.system.combate.dadosEnergia.max = Number(context.system.combate.dadosEnergia.max ?? lvl) || lvl;
            context.system.combate.dadosEnergia.value = Number(context.system.combate.dadosEnergia.value ?? context.system.combate.dadosEnergia.max) || context.system.combate.dadosEnergia.max;
            // Define lado de DE por classe (padrões propostos)
            if (!context.system.combate.dadosEnergia.lado) {
              // escolha de lado baseada em classe normalizada via mapa (fallback manual)
              if (clsNorm === 'especialista em tecnica' || clsNorm === 'especialista em técnica' || clsNorm === 'controlador') context.system.combate.dadosEnergia.lado = '1d10';
              else if (clsNorm === 'suporte') context.system.combate.dadosEnergia.lado = '1d8';
              else if (clsNorm === 'lutador' || clsNorm === 'especialista em combate') context.system.combate.dadosEnergia.lado = '1d6';
              else context.system.combate.dadosEnergia.lado = context.system.combate.dadosEnergia.lado || '';
            }
          }
        } catch (e) { /* ignore */ }

        const pontosAdicionais = Number(context.system.aptidaoTreino?.pontosAdicionais?.value ?? 0) || 0;

        const pontosGanhos = Math.floor((Number(nivelTotalDerivado) || 0) / 2)
          + ((Number(nivelTotalDerivado) || 0) >= 10 ? 1 : 0)
          + ((Number(nivelTotalDerivado) || 0) >= 20 ? 1 : 0)
          + pontosAdicionais;

        const pontosGastos = ['aura', 'controleELeitura', 'barreiras', 'dominio', 'energiaReversa']
          .reduce((acc, k) => acc + clamp05(context.system.aptidaoNiveis?.[k]?.value), 0);

        const pontosRestantes = Math.max(0, pontosGanhos - pontosGastos);
        context.system.aptidaoPontos = {
          ganhos: { value: pontosGanhos, label: 'Pontos Ganhos' },
          gastos: { value: pontosGastos, label: 'Pontos Gastos' },
          restantes: { value: pontosRestantes, label: 'Pontos Restantes' },
        };

        // --- DERIVADOS (automação) ---
        // 1) Limitador de gasto de PE extra (igual ao nível de Controle e Leitura)
        const nivelCL = clamp05(context.system.aptidaoNiveis?.controleELeitura?.value);
        // 2) RD de estruturas/barreiras (igual ao nível de Barreira)
        const nivelBAR = clamp05(context.system.aptidaoNiveis?.barreiras?.value);
        // 3) Refinamento (nível do personagem + aptidão em Domínio)
        const nivelDOM = clamp05(context.system.aptidaoNiveis?.dominio?.value);
        const refinamento = (Number(nivelTotalDerivado) || 0) + nivelDOM;

        // Não sobrescreve o objeto inteiro para preservar `aptidaoDerivados.barreira`
        // (PV por parede, max segmentos, etc.) calculado acima.
        context.system.aptidaoDerivados = context.system.aptidaoDerivados ?? {};
        context.system.aptidaoDerivados.limiteGastoPE = { value: nivelCL, label: 'Limite de Gasto (PE)' };
        context.system.aptidaoDerivados.rdBarreira = { value: nivelBAR, label: 'RD Barreira' };
        context.system.aptidaoDerivados.refinamento = { value: refinamento, label: 'Refinamento' };

        // --- TREINO / INTERLÚDIO (anotações) ---
        const modelAptidaoTreino = game?.system?.model?.Actor?.[actorData.type]?.aptidaoTreino ?? {
          notas: { value: '', label: 'Treino (Interlúdio)' },
        };
        context.system.aptidaoTreino = foundry.utils.mergeObject(
          foundry.utils.deepClone(modelAptidaoTreino),
          context.system.aptidaoTreino ?? {},
          { inplace: false, overwrite: true }
        );

        // --- VINCULAR SIGLA DO ATRIBUTO À PERÍCIA ---
        // Preenche `pericia.atributoLabel` e `pericia.atributoMod` buscando em
        // ordem: atributos -> recursos -> combate, e definindo um default.
        if (context.system.pericias) {
          for (let [key, pericia] of Object.entries(context.system.pericias)) {
            const atributoKey = MAPA_ATRIBUTOS[key];

            if (!atributoKey) {
              pericia.atributoLabel = "";
              pericia.atributoMod = 0;
              continue;
            }

            // 1) Procura em atributos (padrão)
            if (context.system.atributos && context.system.atributos[atributoKey]) {
              const atributoObj = context.system.atributos[atributoKey];
              pericia.atributoLabel = (atributoObj.label || atributoKey).substring(0, 3).toUpperCase();
              pericia.atributoMod = atributoObj.mod ?? 0;
              continue;
            }

            // 2) Fallback para recursos (ex: hp, energia)
            if (context.system.recursos && context.system.recursos[atributoKey]) {
              const recursoObj = context.system.recursos[atributoKey];
              pericia.atributoLabel = (recursoObj.label || atributoKey).substring(0, 3).toUpperCase();
              pericia.atributoMod = recursoObj.value ?? recursoObj.percent ?? 0;
              continue;
            }

            // 3) Fallback para combate (ex: defesa, cd, movimento)
            if (context.system.combate && context.system.combate[atributoKey]) {
              const combateObj = context.system.combate[atributoKey];
              pericia.atributoLabel = (combateObj.label || atributoKey).substring(0, 3).toUpperCase();
              pericia.atributoMod = combateObj.value ?? 0;
              continue;
            }

            // Default
            pericia.atributoLabel = atributoKey.substring(0, 3).toUpperCase();
            pericia.atributoMod = 0;
          }
        }

        context.niveisPericia = { 0: "—", 1: "Treinado", 2: "Mestre" };
    }

      // Garante que exista um ataque padrão (Soco) como Item real para permitir drag&drop.
      await this._ensureUnarmedAttackItem();

      // Prepara listas de itens para QUALQUER tipo de ator.
      // (Sem isso, atores de tipos adicionais como "maldicao" criam o Item embutido,
      // mas a aba Itens não recebe `context.aptidoes` e parece vazia.)
      this._prepareItems(context);

      // Lista de ataques (itens) para a aba Status
      try {
        const attacks = (this.actor?.items?.contents ?? [])
          .filter(i => ['arma', 'tecnica'].includes(String(i.type)))
          .map(i => i.toObject(false));

        // Ordena deixando "Soco" (desarmado) no topo
        const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
        attacks.sort((a, b) => {
          const an = norm(a?.name);
          const bn = norm(b?.name);
          const aIsUnarmed = (an === 'soco' || an === 'desarmado');
          const bIsUnarmed = (bn === 'soco' || bn === 'desarmado');
          if (aIsUnarmed && !bIsUnarmed) return -1;
          if (!aIsUnarmed && bIsUnarmed) return 1;
          return an.localeCompare(bn);
        });

        context.ataquesItems = attacks;
      } catch (e) {
        context.ataquesItems = [];
        console.warn('Falha ao preparar lista de ataques (itens):', e);
      }

    context.rollData = context.actor.getRollData();
    context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography,
      { secrets: this.document.isOwner, async: true, rollData: context.rollData, relativeTo: this.actor }
    );

    // Persistir automaticamente os valores calculados de Dados de Vida / Dados de Energia
    try {
      const updateData = {};
      const sys = this.actor.system || {};
      const desiredDVMax = Number(context.system?.combate?.dadosVida?.max ?? 0) || 0;
      const desiredDVValue = Number(context.system?.combate?.dadosVida?.value ?? desiredDVMax) || desiredDVMax;
      const desiredDEMax = Number(context.system?.combate?.dadosEnergia?.max ?? 0) || 0;
      const desiredDEValue = Number(context.system?.combate?.dadosEnergia?.value ?? desiredDEMax) || desiredDEMax;

      if ((sys.combate?.dadosVida?.max ?? 0) !== desiredDVMax) updateData['system.combate.dadosVida.max'] = desiredDVMax;
      if ((sys.combate?.dadosVida?.value ?? 0) !== desiredDVValue) updateData['system.combate.dadosVida.value'] = desiredDVValue;
      if ((sys.combate?.dadosEnergia?.max ?? 0) !== desiredDEMax) updateData['system.combate.dadosEnergia.max'] = desiredDEMax;
      if ((sys.combate?.dadosEnergia?.value ?? 0) !== desiredDEValue) updateData['system.combate.dadosEnergia.value'] = desiredDEValue;

      if (Object.keys(updateData).length) {
        // Atualiza sem forçar re-render excessivo; é seguro aguardar para garantir persistência
        await this.actor.update(updateData);
      }
    } catch (e) {
      console.warn('Falha ao persistir Dados de Vida/Energia calculados:', e);
    }

    return context;
  }

  /**
   * Garante que o ator tenha um item "Soco" (arma desarmada) para rolar e arrastar para a hotbar.
   * Faz a criação apenas para atores editáveis e apenas uma vez por ator.
   */
  async _ensureUnarmedAttackItem() {
    try {
      if (!this.actor) return;
      if (!this.isEditable) return;

      const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
      const seeded = await this.actor.getFlag(sysId, 'seed.unarmedAttackItem');
      if (seeded) return;

      const norm = (s) => String(s ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
      const hasUnarmed = (this.actor.items?.contents ?? []).some(i => i?.type === 'arma' && ['soco', 'desarmado'].includes(norm(i?.name)));
      if (hasUnarmed) {
        await this.actor.setFlag(sysId, 'seed.unarmedAttackItem', true);
        return;
      }

      const itemData = {
        name: 'Soco',
        type: 'arma',
        img: 'icons/svg/dice.svg',
        system: {
          // Fórmula base: o roll() do Item vai aplicar conversão de níveis em cima do primeiro dado.
          formula: '1d4 + @forca',
          damage: {
            base: { value: '1d4', label: 'Dano Base' },
            bonus: { value: '@forca', label: 'Bônus' },
            levelBoost: { value: 0, label: 'Aumento de Nível' },
            type: { value: 'impacto', label: 'Tipo de Dano' },
            isSoulDamage: { value: false, label: 'Dano na Alma' },
          },
        },
      };

      await this.actor.createEmbeddedDocuments('Item', [itemData]);
      await this.actor.setFlag(sysId, 'seed.unarmedAttackItem', true);
    } catch (e) {
      console.warn('Falha ao garantir item de ataque desarmado (Soco):', e);
    }
  }

  _prepareItems(context) {
    const equipamentos = [];
    const tecnicas = [];
    const aptidoes = [];
    const habilidades = [];
    const aptidoesAtivas = [];
    const aptidoesPassivas = [];

    // Garante defaults pro template não quebrar
    context.equipamentos = equipamentos;
    context.tecnicas = tecnicas;
    context.aptidoes = aptidoes;
    context.aptidoesAtivas = aptidoesAtivas;
    context.aptidoesPassivas = aptidoesPassivas;

    if (!Array.isArray(context.items)) {
      return;
    }

    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;

      // Equipamentos
      if (['item', 'arma', 'armadura'].includes(i.type)) {
          equipamentos.push(i);
      }
      // Técnicas
      else if (i.type === 'tecnica') {
          tecnicas.push(i);
      }
      // Habilidades (novo tipo para habilidades de classe)
      else if (i.type === 'habilidade') {
        habilidades.push(i);
      }
      // Aptidões (Aqui entra a Aura Anuladora)
      else if (i.type === 'aptidao') {
        aptidoes.push(i);
      }
    }

    context.equipamentos = equipamentos;
    context.tecnicas = tecnicas;
    context.aptidoes = aptidoes;
    context.habilidades = habilidades;

    // Separa aptidões em ativas vs passivas para UI
    for (const it of aptidoes) {
      const acao = String(it.system?.acao?.value ?? 'Passiva').trim().toLowerCase();
      if (!acao || acao === 'passiva') aptidoesPassivas.push(it);
      else aptidoesAtivas.push(it);
    }

    context.aptidoesAtivas = aptidoesAtivas;
    context.aptidoesPassivas = aptidoesPassivas;
  }

  /* -------------------------------------------- */

  /** @override */
  async _onDrop(event) {
    const dropZone = event?.target?.closest?.('[data-aptidao-tipo]');
    this._dropAptidaoTipo = dropZone?.dataset?.aptidaoTipo ?? null;
    return super._onDrop(event);
  }

  /** @override */
  async _onDropItemCreate(itemData, event) {
    try {
      // Se for aptidão e o usuário soltou em uma coluna específica, já marca ativa/passiva
      if (itemData?.type === 'aptidao' && this._dropAptidaoTipo) {
        itemData.system ??= {};
        itemData.system.acao ??= {};
        itemData.system.acao.value = (this._dropAptidaoTipo === 'passiva') ? 'Passiva' : 'Ativa';
      }

      // Validação: (desativada) - pré-requisitos IGNORADOS para permitir adição livre
      if (false) {
        const descricao = String(itemData?.system?.descricao?.value ?? itemData?.system?.requisito?.value ?? '');
        const prereq = extrairPrereqsDaDescricao(descricao, null);
        // nível do ator
        const actorNivel = _getActorNivel(this.actor);
        if (prereq?.nivelPersonagemMin && actorNivel < prereq.nivelPersonagemMin) {
          ui.notifications.warn(`Não é possível adicionar: pré-requisito não atendido (Nível ${prereq.nivelPersonagemMin}).`);
          return null;
        }
        if (prereq?.aptidaoCampo && prereq?.aptidaoMin) {
          const atual = Number(this.actor.system?.aptidaoNiveis?.[prereq.aptidaoCampo]?.value ?? 0) || 0;
          if (atual < prereq.aptidaoMin) {
            const labelCampo = this.actor.system?.aptidaoNiveis?.[prereq.aptidaoCampo]?.label ?? prereq.aptidaoCampo;
            ui.notifications.warn(`Não é possível adicionar: pré-requisito não atendido (${labelCampo} Nível ${prereq.aptidaoMin}).`);
            return null;
          }
        }
        if (prereq?.atributosMin && Object.keys(prereq.atributosMin).length > 0) {
          for (const [attrKey, minVal] of Object.entries(prereq.atributosMin)) {
            const atual = Number(this.actor.system?.atributos?.[attrKey]?.value ?? 0) || 0;
            if (atual < Number(minVal)) {
              const label = this.actor.system?.atributos?.[attrKey]?.label ?? attrKey;
              ui.notifications.warn(`Não é possível adicionar: pré-requisito não atendido (${label} ${minVal}).`);
              return null;
            }
          }
        }

        if (Array.isArray(prereq?.prereqTokens) && prereq.prereqTokens.length > 0) {
          for (const token of prereq.prereqTokens) {
            const resolved = _resolverAptidaoPorLabel(token);
            if (resolved) {
              const hasIt = Boolean(this.actor.system?.aptidoes?.[resolved.cat]?.[resolved.key]);
              if (!hasIt) {
                ui.notifications.warn(`Não é possível adicionar: pré-requisito não atendido: ${resolved.label}.`);
                return null;
              }
              continue;
            }
            const resolvedTec = _resolverTecnicaPorLabel(token, this.actor);
            if (resolvedTec) {
              const exists = Boolean(this.actor.items.find(i => i.id === resolvedTec.itemId));
              if (!exists) {
                ui.notifications.warn(`Não é possível adicionar: pré-requisito não atendido: Técnica ${resolvedTec.label}.`);
                return null;
              }
              continue;
            }
            // token não mapeado: não bloqueamos para evitar falsos positivos
            console.warn('Token de pré-requisito não mapeado durante drop:', token);
          }
        }

        // Validação extra: nível mínimo por CLASSE (ex.: aptidões do Lutador nível 6)
        // Espera `system.nivelMin.value` e `system.classe.value` (preenchidos por macros de seed/compêndio).
        if (itemData?.type === 'aptidao') {
          const nivelMin = Number(itemData?.system?.nivelMin?.value ?? itemData?.system?.nivelMin ?? 0) || 0;
          const classeReq = String(itemData?.system?.classe?.value ?? itemData?.system?.classe ?? itemData?.system?.categoria?.value ?? '').trim();
          if (nivelMin > 0) {
            const nivelClasse = _getNivelDaClasse(this.actor, classeReq);
            if (!nivelClasse) {
              ui.notifications.warn(`Não é possível adicionar: requer ${classeReq || 'uma classe específica'} nível ${nivelMin}.`);
              return null;
            }
            if (nivelClasse < nivelMin) {
              ui.notifications.warn(`Não é possível adicionar: requer ${classeReq} nível ${nivelMin} (você tem ${nivelClasse}).`);
              return null;
            }
          }
        }
      }

      const created = await super._onDropItemCreate(itemData, event);

      // Passivas 100% do tempo: se a aptidão tiver ActiveEffects no Item, aplicamos automaticamente ao ator.
      // (Para passivas sem efeitos, não há o que aplicar — isso é resolvido ao adicionar efeitos/macros depois.)
      try {
        const createdItems = Array.isArray(created) ? created : (created ? [created] : []);
        for (const it of createdItems) {
          if (!it || it.type !== 'aptidao') continue;
          const acao = String(it.system?.acao?.value ?? '').toLowerCase().trim();
          if (acao !== 'passiva') continue;
          const itemEffects = it.effects?.contents ?? [];
          if (!itemEffects.length) continue;

          const systemId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
          const already = new Set((this.actor.effects?.contents ?? []).map(e => e.origin).filter(Boolean));
          if (already.has(it.uuid)) continue;

          const toCreate = itemEffects.map((e) => {
            const data = e.toObject();
            delete data._id;
            data.origin = it.uuid;
            data.disabled = false;
            data.flags = foundry.utils.mergeObject(data.flags ?? {}, { [systemId]: { passiveAptidaoEffect: true, sourceAptidaoItemId: it.id } });
            return data;
          });

          if (toCreate.length) await this.actor.createEmbeddedDocuments('ActiveEffect', toCreate);
        }
      } catch (e) {
        console.warn('Falha ao aplicar efeitos automáticos de aptidão passiva no drop:', e);
      }

      return created;
    } finally {
      this._dropAptidaoTipo = null;
    }
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('.level-up-btn').click(this._onLevelUp.bind(this));

    // --- NOVO: Listener para Dados de Vida e Energia ---
    html.find('.roll-dice').click(async (event) => {
        event.preventDefault();
        const element = event.currentTarget;
        const formula = String(element.dataset.formula ?? '').trim();
        const flavor = String(element.dataset.flavor ?? '').trim();

        if (!formula) return;

        const flavorText = flavor.toLowerCase();
        const isVida = flavorText.includes('vida');
        const isEnergia = flavorText.includes('energia');

        // Para Dados de Vida/Energia: perguntar quantos dados gastar
        if (isVida || isEnergia) {
          if (!this.isEditable) return ui.notifications.warn('Sem permissão para modificar este ator.');

          const combate = this.actor.system?.combate ?? {};
          const dadosKey = isVida ? 'dadosVida' : 'dadosEnergia';
          const recursosKey = isVida ? 'hp' : 'energia';
          const available = Number(combate?.[dadosKey]?.value ?? 0) || 0;
          const lado = String(combate?.[dadosKey]?.lado ?? formula).trim() || formula;
          if (available <= 0) return ui.notifications.warn('Nenhum Dado disponível para gastar.');

          // diálogo simples para escolher quantidade
          const dlgContent = `
            <form class="dice-spend-dialog">
              <div class="form-group">
                <label class="title">Quantos dados gastar? (máx ${available})</label>
                <div class="fields">
                  <input type="number" name="qtd" min="1" max="${available}" value="1" />
                </div>
              </div>
            </form>
          `;

          new Dialog({
            title: `Gastar ${isVida ? 'Dados de Vida' : 'Dados de Energia'}`,
            content: dlgContent,
            buttons: {
              ok: { label: 'Rolar', callback: async (htmlDlg) => {
                const n = Math.max(0, Number(htmlDlg.find('input[name="qtd"]').val() ?? 0));
                if (!n || n <= 0) return ui.notifications.warn('Quantidade inválida.');
                if (n > available) return ui.notifications.warn('Quantidade maior que disponível.');

                // monta fórmula substituindo o fator de quantidade (ex: '1d8' -> '3d8')
                const dIndex = lado.indexOf('d');
                const diePart = (dIndex >= 0) ? lado.slice(dIndex) : lado;
                const rollFormula = `${n}${diePart}`;

                let roll;
                try {
                  roll = new Roll(rollFormula);
                  await roll.evaluate({async: false});
                } catch (err) {
                  console.warn('Erro ao rolar dados:', err);
                  return ui.notifications.error('Fórmula inválida.');
                }

                // determina modificador por dado
                let attrKey = 'constituicao';
                if (isEnergia) {
                  const clsRaw = String(this.actor.system?.detalhes?.classe?.value ?? '');
                  const clsNorm = clsRaw.toLowerCase().trim();
                  // usa mapa configurável; se mapeamento for explicitamente null (ex: restringido), trata como nenhum DE
                  const mapped = MAPA_DE_ATRIBUTOS[clsNorm];
                  if (typeof mapped === 'string' && mapped) attrKey = mapped;
                  else attrKey = 'inteligencia';
                }

                const attrMod = Number(this.actor.system?.atributos?.[attrKey]?.mod ?? 0) || 0;
                const diceTotal = Number(roll.total ?? 0) || 0;
                const recovered = diceTotal + (n * attrMod);

                // Mensagem no chat com detalhe
                const chatContent = `<div class="dice-recovery"><strong>${this.actor.name}</strong> gastou <b>${n}</b> ${isVida ? 'DV' : 'DE'} (${rollFormula}) → ` +
                  `<b>${diceTotal}</b> + ${n}×${attrMod} = <b>${recovered}</b> ${isVida ? 'PV' : 'PE'} recuperados.</div>`;
                await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: chatContent });

                // atualiza ator: decrementa dados disponíveis e aplica recuperação (cap em max)
                const updates = {};
                // decrementa contador de dados
                const newAvailable = Math.max(0, available - n);
                updates[`system.combate.${dadosKey}.value`] = newAvailable;

                // aplica recuperação no recurso correspondente
                const atual = Number(this.actor.system?.recursos?.[recursosKey]?.value ?? 0) || 0;
                const max = Number(this.actor.system?.recursos?.[recursosKey]?.max ?? atual) || atual;
                updates[`system.recursos.${recursosKey}.value`] = Math.min(max, atual + recovered);

                await this.actor.update(updates);
              }},
              cancel: { label: 'Cancelar' }
            },
            default: 'ok'
          }, { id: 'dice-spend-dialog' }).render(true);
        }
        else {
          // Rolagem padrão (não DV/DE)
          let roll;
          try {
            roll = new Roll(formula);
            await roll.evaluate();
          } catch (err) {
            console.warn('Erro ao rolar dado:', { formula, err });
            ui?.notifications?.error?.('Fórmula inválida para rolagem.');
            return;
          }
          await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: `Rolou <b>${flavor}</b>` });
        }
    });

    // ESCUTA O CLIQUE NA PERÍCIA
    html.find('.pericia-label').click(this._onRollPericia.bind(this));

    // Níveis de Aptidão: +/- dentro da aba Aptidões
    html.on('click', '[data-action="aptidao-nivel-inc"]', this._onAptidaoNivelInc.bind(this));
    html.on('click', '[data-action="aptidao-nivel-dec"]', this._onAptidaoNivelDec.bind(this));
    // Criar paredes no mapa a partir da ficha
    html.on('click', '[data-action="create-walls"]', this._onCreateWallsClick.bind(this));
    // Adicionar ponto de Aptidão via Treino (Interlúdio)
    html.on('click', '.aptidao-treino-add', this._onAptidaoTreinoAdd.bind(this));

    // Criar Expansão de Domínio
    // (Removido do template) A criação de Domínio é feita ao usar o Item de aptidão na aba Itens.

    // Usar aptidão (Item) como botão
    html.on('click', '[data-action="use-aptidao"]', this._onUseAptidaoItem.bind(this));
    // Mostrar descrição da aptidão em modal (listener mantido por compatibilidade, mas o botão foi removido)
    html.on('click', '[data-action="show-aptidao-desc"]', this._onShowAptidaoDescription.bind(this));


    // --- ORIGEM: abrir modal ao selecionar "Maldição" ---
    const $origemSelect = html.find('select[name="system.detalhes.origem.value"]');
    if ($origemSelect.length) {
      $origemSelect.on('focus', (ev) => {
        this._prevOrigemValue = ev.currentTarget.value;
      });
      $origemSelect.on('change', async (ev) => {
        const val = ev.currentTarget.value;
        if (val === 'Maldição') await this._openOrigemMaldicaoDialog();
      });
    }

    // Botões de Descanso Curto/Longo removidos da ficha — usar macros de Descanso em massa

    // Rolagem de item (ex.: ataques) a partir da ficha
    html.on('click', '.item-roll', async (ev) => {
      ev.preventDefault();
      const row = $(ev.currentTarget).closest('[data-item-id]');
      const item = this.actor?.items?.get?.(row.data('itemId'));
      if (!item) return;
      try {
        await item.roll();
      } catch (e) {
        console.warn('Falha ao rolar item:', e);
      }
    });

    // Drag&Drop para hotbar: garante que os itens sejam arrastáveis
    try {
      const handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    } catch (e) {
      console.warn('Falha ao registrar dragstart para itens:', e);
    }

    // Listeners Padrões
    if (!this.isEditable) return;
    html.on('click', '.item-edit', (ev) => {
      ev.stopPropagation();
      const row = $(ev.currentTarget).closest('[data-item-id]');
      const item = this.actor.items.get(row.data('itemId'));
      if (item) item.sheet.render(true);
    });
    html.on('click', '.item-delete', (ev) => {
      ev.stopPropagation();
      const row = $(ev.currentTarget).closest('[data-item-id]');
      const item = this.actor.items.get(row.data('itemId'));
      if (item) {
        item.delete();
        row.slideUp(200, () => this.render(false));
      }
    });
    html.on('click', '.item-create', this._onItemCreate.bind(this));
    // Death-saves visual UI handlers
    html.on('click', '.death-test-btn', this._onDeathTest.bind(this));
    html.on('click', '.death-reset-btn', this._onDeathReset.bind(this));
    html.on('click', '.death-pill', this._onToggleDeathMark.bind(this));

    // Atualiza classes visuais de HP (hp-full, hp-high, hp-medium, hp-low, hp-zero)
    try {
      this._updateHpVisualState(html);
    } catch (err) {
      console.warn('Falha ao aplicar estado visual de HP:', err);
    }

    // Nota: não espelhamos automaticamente HP→Integridade após inicialização
  }

  /** Atualiza classes CSS no root do sheet conforme percentual de HP */
  _updateHpVisualState(html) {
    const hpVal = Number(this.actor.system?.recursos?.hp?.value ?? 0) || 0;
    const hpMax = Number(this.actor.system?.recursos?.hp?.max ?? 0) || 0;
    const percent = hpMax > 0 ? Math.round((hpVal / hpMax) * 100) : (hpVal > 0 ? 100 : 0);
    const $root = this.element; // jQuery root of the sheet
    $root.removeClass('hp-full hp-high hp-medium hp-low hp-zero hp-dead');
    if (hpVal <= 0) {
      $root.addClass('hp-zero hp-dead');
    } else if (percent <= 15) {
      $root.addClass('hp-low');
    } else if (percent <= 40) {
      $root.addClass('hp-medium');
    } else if (percent <= 75) {
      $root.addClass('hp-high');
    } else {
      $root.addClass('hp-full');
    }
  }

  async _onUseAptidaoItem(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const row = $(event.currentTarget).closest('[data-item-id]');
    const item = this.actor.items.get(row.data('itemId'));
    if (!item) return;

    const systemId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
    const aptidaoKey = item.getFlag(systemId, 'aptidaoKey');

    // Validação: nível mínimo por CLASSE (caso o item tenha sido adicionado manualmente/por compêndio)
    try {
      const nivelMin = Number(item.system?.nivelMin?.value ?? item.system?.nivelMin ?? 0) || 0;
      const classeReq = String(item.system?.classe?.value ?? item.system?.classe ?? item.system?.categoria?.value ?? '').trim();
      if (nivelMin > 0) {
        const nivelClasse = _getNivelDaClasse(this.actor, classeReq);
        if (!nivelClasse || nivelClasse < nivelMin) {
          ui.notifications.warn(`Você não atende o requisito: ${classeReq} nível ${nivelMin}.`);
          return;
        }
      }
    } catch (e) {
      console.warn('Erro ao validar nível mínimo por classe ao usar aptidão:', e);
    }

    // Caso especial: aptidões de Domínio criam walls no mapa ao serem usadas
    if (aptidaoKey === 'dominio.expansaoDeDominioIncompleta'
      || aptidaoKey === 'dominio.expansaoDeDominioCompleta'
      || aptidaoKey === 'dominio.acertoGarantido') {

      const custo = (aptidaoKey === 'dominio.expansaoDeDominioIncompleta')
        ? 15
        : (aptidaoKey === 'dominio.expansaoDeDominioCompleta')
          ? 20
          : 25; // acertoGarantido = completa +5

      const atualPE = Number(this.actor.system?.recursos?.energia?.value ?? 0) || 0;
      if (atualPE < custo) {
        ui.notifications.warn(`PE insuficiente para usar ${item.name}. (Precisa ${custo} PE)`);
        return;
      }

      const dominioArgs = (aptidaoKey === 'dominio.expansaoDeDominioIncompleta')
        ? { tipo: 'incompleta', acertoGarantido: false }
        : (aptidaoKey === 'dominio.expansaoDeDominioCompleta')
          ? { tipo: 'completa', acertoGarantido: false }
          : { tipo: 'completa', acertoGarantido: true };

      try {
        const { radiusMeters, squares } = await this._createDominioFromActor(dominioArgs);
        await this.actor.update({ 'system.recursos.energia.value': Math.max(0, atualPE - custo) });

        // Aplica Active Effects do Item (se houver)
        const effects = item.effects?.contents ?? [];
        if (effects.length) {
          const toCreate = effects.map((e) => {
            const data = e.toObject();
            delete data._id;
            data.origin = item.uuid;
            data.disabled = false;
            return data;
          });
          await this.actor.createEmbeddedDocuments('ActiveEffect', toCreate);
        }

        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          content: `<b>${item.name}</b> foi usada. (Custo: ${custo} PE)<br/>Domínio criado: raio ${radiusMeters} m (${Math.round(squares)} quadrados).`,
        });
      } catch (err) {
        console.error('Falha ao criar Domínio via Item:', err);
        ui.notifications.error('Falha ao criar Domínio. Veja o console.');
      }
      return;
    }

    // Custo de PE (opcional)
    const custoPE = Number(item.system?.custo?.value ?? 0) || 0;
    if (custoPE > 0) {
      const atual = Number(this.actor.system?.recursos?.energia?.value ?? 0) || 0;
      if (atual < custoPE) {
        ui.notifications.warn('PE insuficiente para usar esta aptidão.');
        return;
      }
      await this.actor.update({ 'system.recursos.energia.value': Math.max(0, atual - custoPE) });
    }

    // Aplica Active Effects do Item no Actor (copia)
    const effects = item.effects?.contents ?? [];
    if (effects.length) {
      const toCreate = effects.map((e) => {
        const data = e.toObject();
        delete data._id;
        data.origin = item.uuid;
        data.disabled = false;
        return data;
      });
      await this.actor.createEmbeddedDocuments('ActiveEffect', toCreate);
    }

    // Executa macros mencionados na descrição (tag: [MACRO:Nome do Macro])
    try {
      const desc = (item.system && item.system.descricao && item.system.descricao.value) ? item.system.descricao.value : '';
      const macros = extrairMacrosDaDescricao(desc ?? '');
      if (Array.isArray(macros) && macros.length > 0) {
        for (const macroName of macros) {
          const macro = game.macros?.find?.(m => m.name === macroName) ?? null;
          if (!macro) {
            ui.notifications.warn(`Macro não encontrada: ${macroName}`);
            continue;
          }
          try {
            // Alguns ambientes usam macro.execute(), outros usam macro.run(); tentamos ambos.
            if (typeof macro.execute === 'function') await macro.execute();
            else if (typeof macro.run === 'function') await macro.run();
            else await game.macros.execute?.(macro.id);
          } catch (mx) {
            console.error('Falha ao executar macro de aptidão:', macroName, mx);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao processar macros da descrição:', e);
    }

    // Mensagem simples no chat
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<b>${item.name}</b> foi usada.${custoPE ? ` (Custo: ${custoPE} PE)` : ''}`,
    });

    // Habilidades específicas de classe (ex.: Lutador) podem abrir um fluxo guiado e/ou aplicar efeitos.
    try {
      await handleLutadorUse({ actor: this.actor, item });
    } catch (e) {
      console.warn('Falha ao processar habilidade do Lutador:', e);
    }
  }

  async _onShowAptidaoDescription(event) {
    event.preventDefault();
    const row = $(event.currentTarget).closest('[data-item-id]');
    const item = this.actor.items.get(row.data('itemId'));
    if (!item) return;

    const systemId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
    const aptKey = item.getFlag(systemId, 'aptidaoKey');
    let desc = (item.system && item.system.descricao && item.system.descricao.value) ? item.system.descricao.value : '';
    if ((!desc || desc === '') && aptKey) {
      desc = APTIDOES_DESCRICOES?.[aptKey] ?? '';
    }

    let content = '<div class="aptidao-desc-content">';
    if (desc && desc.length) {
      try {
        const enriched = await TextEditor.enrichHTML(desc, { async: true });
        content += enriched;
      } catch (err) {
        content += `<div>${desc}</div>`;
      }
    } else {
      content += '<i>Sem descrição disponível.</i>';
    }
    content += '</div>';

    new Dialog({
      title: item.name,
      content,
      buttons: { close: { label: 'Fechar' } },
      default: 'close',
    }).render(true);
  }

  async _onSyncAptidoesClick(event) {
    event.preventDefault();
    if (!this.actor.isOwner) return ui.notifications.warn('Sem permissão para modificar este ator.');

    const systemId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
    const activeApt = this.actor.system?.aptidoes ?? {};
    const tasks = [];
    for (const [cat, entries] of Object.entries(activeApt)) {
      if (!entries || typeof entries !== 'object') continue;
      for (const [key, val] of Object.entries(entries)) {
        if (!val) continue; // só as aptidões ativas
        // checa se já existe Item com flag aptidaoKey
        const aptidaoKey = `${cat}.${key}`;
        const exists = this.actor.items.find(i => i.type === 'aptidao' && i.getFlag(systemId, 'aptidaoKey') === aptidaoKey);
        if (exists) continue;
        // prepara dados mínimos (usa catálogo/descrições se disponível)
        const name = (APTIDOES_CATALOGO?.[cat]?.entradas?.find(e => e.key === key)?.label) ?? key;
        const desc = APTIDOES_DESCRICOES?.[`${cat}.${key}`] ?? '';
        tasks.push(this._syncAptidaoEmbeddedItem({ cat, key, name, desc, active: true }));
      }
    }
    if (tasks.length === 0) return ui.notifications.info('Nenhuma aptidão ativa faltando Item.');
    try {
      const results = await Promise.all(tasks);
      const created = results.filter(r => r?.action === 'created').length;
      const updated = results.filter(r => r?.action === 'updated').length;
      ui.notifications.info(`Sincronização concluída. Criados: ${created}, Atualizados: ${updated}`);
      this.render(false);
    } catch (err) {
      console.error('Erro ao sincronizar aptidões:', err);
      ui.notifications.error('Falha ao sincronizar aptidões. Veja o console.');
    }
  }

  /* --------------------------- Expansão de Domínio --------------------------- */
  _getControlledTokenOrWarn() {
    if (!canvas?.scene) {
      ui.notifications.warn('Nenhuma cena aberta.');
      return null;
    }
    const controlled = canvas.tokens?.controlled;
    if (!controlled || controlled.length === 0) {
      ui.notifications.warn('Selecione um token para criar a Expansão de Domínio.');
      return null;
    }
    return controlled[0];
  }

  async _createDominioFromActor({ tipo, acertoGarantido = false }) {
    const token = this._getControlledTokenOrWarn();
    if (!token) throw new Error('Nenhum token controlado');

    const gridMeters = 1.5;
    let radiusMeters = 0;
    if (tipo === 'incompleta') {
      const baseTreino = Number(this.actor.system?.detalhes?.treinamento?.value ?? 0) || 0;
      if (baseTreino <= 0) throw new Error('Bônus de treinamento inválido');
      radiusMeters = 4.5 * baseTreino;
    } else {
      radiusMeters = 9;
    }
    const squares = radiusMeters / gridMeters;
    const radiusPixels = squares * canvas.grid.size;

    const flags = { 'feiticeiros-e-maldicoes': { dominio: { tipo, acertoGarantido: Boolean(acertoGarantido), owner: this.actor.id } } };
    const created = await this._createCircularWalls(token.center, radiusPixels, flags);
    const resumo = created.map(w => ({ id: w.id }));
    await this.actor.setFlag('feiticeiros-e-maldicoes', 'lastDominio', { type: `${tipo}${acertoGarantido ? '-acerto' : ''}`, walls: resumo });
    ui.notifications.info(`Expansão de Domínio criada: raio ${radiusMeters} m (${Math.round(squares)} quadrados).`);
    return { created, radiusMeters, squares };
  }

  async _createCircularWalls(center, radiusPixels, flags = {}) {
    const grid = canvas.grid.size;
    const circumference = 2 * Math.PI * radiusPixels;
    const segments = Math.max(12, Math.round(circumference / grid));
    const walls = [];
    let prev = null;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const x = center.x + Math.cos(theta) * radiusPixels;
      const y = center.y + Math.sin(theta) * radiusPixels;
      if (prev) {
        walls.push({ c: [prev.x, prev.y, x, y], flags });
      }
      prev = { x, y };
    }
    try {
      const created = (canvas.scene?.createEmbeddedDocuments)
        ? await canvas.scene.createEmbeddedDocuments('Wall', walls)
        : (canvas.scene?.createEmbeddedEntity)
          ? await canvas.scene.createEmbeddedEntity('Wall', walls)
          : null;
      if (!created || created.length === 0) throw new Error('Nenhuma wall criada');
      return created;
    } catch (err) {
      console.error('Erro ao criar walls circulares:', err);
      throw err;
    }
  }

  async _onCreateDominioIncompletoClick(event) {
    event.preventDefault();
    try { await this._createDominioFromActor({ tipo: 'incompleta', acertoGarantido: false }); }
    catch (err) { ui.notifications.error('Falha ao criar Expansão de Domínio. Veja o console.'); }
  }

  async _onCreateDominioCompletoClick(event) {
    event.preventDefault();
    try { await this._createDominioFromActor({ tipo: 'completa', acertoGarantido: false }); }
    catch (err) { ui.notifications.error('Falha ao criar Expansão de Domínio. Veja o console.'); }
  }

  async _onCreateDominioAcertoGarantidoClick(event) {
    event.preventDefault();
    try { await this._createDominioFromActor({ tipo: 'completa', acertoGarantido: true }); }
    catch (err) { ui.notifications.error('Falha ao criar Expansão de Domínio. Veja o console.'); }
  }

  _computeAptidaoPontosSnapshot() {
    const system = this.actor.system;
    const nivelTotalDerivado = system.detalhes?.nivel?.value ??
      ((system.detalhes?.niveis?.principal?.value || 0) + (system.detalhes?.niveis?.secundario?.value || 0));

    const lvl = Number(nivelTotalDerivado) || 0;
    const pontosAdicionais = Number(system.aptidaoTreino?.pontosAdicionais?.value ?? 0) || 0;
    const pontosGanhos = Math.floor(lvl / 2) + (lvl >= 10 ? 1 : 0) + (lvl >= 20 ? 1 : 0) + pontosAdicionais;

    const clamp05 = (n) => Math.max(0, Math.min(5, Number(n ?? 0) || 0));
    const pontosGastos = ['aura', 'controleELeitura', 'barreiras', 'dominio', 'energiaReversa']
      .reduce((acc, k) => acc + clamp05(system.aptidaoNiveis?.[k]?.value), 0);

    return {
      ganhos: pontosGanhos,
      gastos: pontosGastos,
      restantes: Math.max(0, pontosGanhos - pontosGastos),
    };
  }

  async _onAptidaoNivelInc(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const key = event.currentTarget?.dataset?.key;
    if (!key) return;
    if (!['aura', 'controleELeitura', 'barreiras', 'dominio', 'energiaReversa'].includes(key)) return;

    const current = Number(this.actor.system?.aptidaoNiveis?.[key]?.value ?? 0) || 0;
    if (current >= 5) return;

    const { restantes } = this._computeAptidaoPontosSnapshot();
    if (restantes <= 0) {
      ui.notifications.warn('Sem pontos de Aptidão restantes para aumentar.');
      return;
    }

    await this.actor.update({ [`system.aptidaoNiveis.${key}.value`]: Math.min(5, current + 1) });
  }

  async _onAptidaoNivelDec(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const key = event.currentTarget?.dataset?.key;
    if (!key) return;
    if (!['aura', 'controleELeitura', 'barreiras', 'dominio', 'energiaReversa'].includes(key)) return;

    const current = Number(this.actor.system?.aptidaoNiveis?.[key]?.value ?? 0) || 0;
    if (current <= 0) return;

    await this.actor.update({ [`system.aptidaoNiveis.${key}.value`]: Math.max(0, current - 1) });
  }

  async _onAptidaoTreinoAdd(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const current = Number(this.actor.system?.aptidaoTreino?.pontosAdicionais?.value ?? 0) || 0;
    await this.actor.update({ ['system.aptidaoTreino.pontosAdicionais.value']: current + 1 });
  }

  /** Criar paredes simples no mapa em volta do token selecionado */
  async _onCreateWallsClick(event) {
    event.preventDefault();
    if (!canvas?.scene) return ui.notifications.warn('Nenhuma cena aberta.');
    const controlled = canvas.tokens.controlled;
    if (!controlled || controlled.length === 0) return ui.notifications.warn('Selecione um token para criar as paredes ao redor.');

    const token = controlled[0];
    const max = this.actor.system?.aptidaoDerivados?.barreira?.maxSegments ?? this.actor.system?.aptidaoDerivados?.barreira?.maxSegmentos ?? 6;
    const segInput = await new Promise((resolve) => {
      new Dialog({
        title: 'Criar Paredes',
        content: `<p>Quantos segmentos (1–${max})?</p><input type="number" id="seg-count" min="1" max="${max}" value="4" />`,
        buttons: {
          ok: { icon: '<i class="fas fa-check"></i>', label: 'Criar', callback: (html) => resolve(Number(html.find('#seg-count').val()) || 0) },
          cancel: { icon: '<i class="fas fa-times"></i>', label: 'Cancelar', callback: () => resolve(0) }
        },
        default: 'ok'
      }).render(true);
    });
    const segments = Number(segInput) || 0;
    if (segments <= 0) return;

    // Gera pequenas paredes em torno do centro do token
    const center = token.center;
    const grid = canvas.grid.size;
    const radius = grid; // distância do centro para posicionar as paredes
    const walls = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const perpAngle = angle + Math.PI / 2;
      const sx = center.x + Math.cos(angle) * radius + Math.cos(perpAngle) * (grid * 1);
      const sy = center.y + Math.sin(angle) * radius + Math.sin(perpAngle) * (grid * 1);
      const ex = center.x + Math.cos(angle) * radius - Math.cos(perpAngle) * (grid * 1);
      const ey = center.y + Math.sin(angle) * radius - Math.sin(perpAngle) * (grid * 1);
      walls.push({ c: [sx, sy, ex, ey] });
    }

    try {
      // Decide qual PV usar (se o ator tem Paredes Resistentes ativas)
      const system = this.actor.system;
      const usoParedesResistentes = !!system?.aptidoes?.barreiras?.paredesResistentes;

      // `system.aptidaoDerivados` é calculado no `getData()` da sheet (não é persistido no Actor).
      // Ao clicar no botão, ele pode não existir e cair em 0. Recalcula aqui com dados persistidos.
      const barNivel = Number(system?.aptidaoNiveis?.barreiras?.value ?? 0) || 0;
      const charNivel = Number(system?.detalhes?.nivel?.value ?? 0) || 0;

      // PV padrão por parede: 5 + (BAR × floor(nível/2))
      const pvPadrao = 5 + (barNivel * Math.floor(charNivel / 2));
      // PV com Paredes Resistentes: 10 + (BAR × nível)
      const pvResist = 10 + (barNivel * charNivel);
      const pvUsado = usoParedesResistentes ? pvResist : pvPadrao;

      const created = (canvas.scene?.createEmbeddedDocuments)
        ? await canvas.scene.createEmbeddedDocuments('Wall', walls.map(w => ({ c: w.c, flags: { 'feiticeiros-e-maldicoes': { pv: pvUsado } } })))
        : (canvas.scene?.createEmbeddedEntity)
          ? await canvas.scene.createEmbeddedEntity('Wall', walls.map(w => ({ c: w.c, flags: { 'feiticeiros-e-maldicoes': { pv: pvUsado } } })))
          : null;

      if (!created || created.length === 0) throw new Error('Nenhuma wall criada');

      // Salva sumário das paredes criadas no ator para exibir na ficha
      const resumo = created.map(w => ({ id: w.id, pv: pvUsado }));
      await this.actor.setFlag('feiticeiros-e-maldicoes', 'lastBarreiras', resumo);

      ui.notifications.info(`Criadas ${created.length} paredes (PV ${pvUsado}).`);
    } catch (err) {
      console.error('Erro ao criar paredes:', err);
      ui.notifications.error('Falha ao criar paredes no mapa. Veja o console.');
    }
  }

  // --- FUNÇÃO DE ROLAR PERÍCIA ---
  async _onRollPericia(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const key = dataset.key;   // Ex: "atletismo"
    const group = dataset.group; // Ex: "pericias"

    return await this._rollPericiaByKey({ key, group });
  }

  async _rollPericiaByKey({ key, group = 'pericias' } = {}) {
    if (!key) return;

    // 1. Pega os dados do Ator
    const system = this.actor.system;
    
    // 2. Acha a perícia no sistema
    const pericia = system?.[group]?.[key];
    if (!pericia) {
      ui.notifications.warn('Perícia inválida.');
      return;
    }
    const grauTreino = pericia.value; // 0, 1 ou 2

    // 3. Acha o Atributo correspondente com fallbacks (atributos -> recursos -> combate)
    const atributoKey = MAPA_ATRIBUTOS[key];
    let atributoMod = 0;
    let atributoLabel = "Atributo";

    if (atributoKey) {
      if (system.atributos && system.atributos[atributoKey]) {
        atributoMod = system.atributos[atributoKey].mod ?? 0;
        atributoLabel = system.atributos[atributoKey].label ?? atributoKey;
      } else if (system.recursos && system.recursos[atributoKey]) {
        const recurso = system.recursos[atributoKey];
        atributoMod = recurso.value ?? recurso.percent ?? 0;
        atributoLabel = recurso.label ?? atributoKey;
      } else if (system.combate && system.combate[atributoKey]) {
        const combate = system.combate[atributoKey];
        atributoMod = combate.value ?? 0;
        atributoLabel = combate.label ?? atributoKey;
      }
    }

    // 4. Calcula o Bônus de Treinamento com base no valor derivado do ator
    // Valores por faixa de nível são calculados em `prepareDerivedData` (actor.mjs)
    const baseTreino = system.detalhes?.treinamento?.value ?? 0;
    let treinoBonus = 0;
    if (grauTreino === 1) {
      treinoBonus = baseTreino;
    } else if (grauTreino === 2) {
      // Mestre: 1.5x do bônus base (arredondado para baixo)
      treinoBonus = Math.floor(baseTreino * 1.5);
    }

    // 5. Calcula o Bônus Total e monta a fórmula de rolagem
    let totalBonus = atributoMod + treinoBonus;

    // Última Ação: se existir flag, força o dado para 20 (crítico garantido) e consome a flag
    let dieTerm = '1d20';
    try {
      const forceCrit = await this.actor.getFlag(game.system.id, 'ultimaAcao.critico');
      if (forceCrit) {
        dieTerm = '20';
        try { await this.actor.unsetFlag(game.system.id, 'ultimaAcao.critico'); } catch (_) {}
      }
    } catch (_) {}

    // Bônus/Modos temporários e persistentes via flags do sistema
    // - flags.<systemId>.bonuses.tests.<group>.<key> => bônus fixo
    // - flags.<systemId>.temp.tests.<group>.<key> => bônus one-shot
    // - flags.<systemId>.temp.rollMode.<group>.<key> => 'adv' | 'dis' (consumido)
    let bonusExtra = 0;
    try {
      const sysId = game?.system?.id ?? 'feiticeiros-e-maldicoes';
      const bonuses = (await this.actor.getFlag(sysId, 'bonuses')) || {};
      bonusExtra += Number(bonuses?.tests?.[group]?.[key] ?? 0) || 0;

      const temp = (await this.actor.getFlag(sysId, 'temp')) || {};
      const tempBonus = Number(temp?.tests?.[group]?.[key] ?? 0) || 0;
      if (tempBonus) {
        bonusExtra += tempBonus;
        const next = foundry.utils.deepClone(temp);
        next.tests = next.tests || {};
        next.tests[group] = next.tests[group] || {};
        delete next.tests[group][key];
        await this.actor.setFlag(sysId, 'temp', next);
      }

      const rollMode = String(temp?.rollMode?.[group]?.[key] ?? '').toLowerCase();
      if (rollMode === 'adv') {
        dieTerm = '2d20kh';
        const next = foundry.utils.deepClone(temp);
        next.rollMode = next.rollMode || {};
        next.rollMode[group] = next.rollMode[group] || {};
        delete next.rollMode[group][key];
        await this.actor.setFlag(sysId, 'temp', next);
      } else if (rollMode === 'dis') {
        dieTerm = '2d20kl';
        const next = foundry.utils.deepClone(temp);
        next.rollMode = next.rollMode || {};
        next.rollMode[group] = next.rollMode[group] || {};
        delete next.rollMode[group][key];
        await this.actor.setFlag(sysId, 'temp', next);
      }
    } catch (_) {}

    let formulaString = `${dieTerm} + ${atributoMod}[${atributoLabel}]`;
    if (treinoBonus > 0) formulaString += ` + ${treinoBonus}[Treino]`;

    // 6. Soma metade do nível total do personagem para TODOS os testes (arredondado para baixo)
    const nivelTotalDerivado = system.detalhes?.nivel?.value ?? ((system.detalhes?.niveis?.principal?.value || 0) + (system.detalhes?.niveis?.secundario?.value || 0));
    const metadeNivel = Math.floor(nivelTotalDerivado / 2);
    if (metadeNivel > 0) {
      totalBonus += metadeNivel;
      formulaString += ` + ${metadeNivel}[MetadeNivel]`;
    }

    if (bonusExtra) {
      totalBonus += bonusExtra;
      formulaString += ` + ${bonusExtra}[Bônus]`;
    }

    // 6. Rola o dado!
    let roll = new Roll(formulaString);
    await roll.evaluate();

    // 7. Manda pro Chat: exibe a face do d20 e a fórmula compacta `1d20 + <bônus>`
    const sign = (totalBonus >= 0) ? `+${totalBonus}` : `${totalBonus}`;

    // Extrai a face do d20 (respeita se o dado foi forçado para 20)
    let dieFace = null;
    if (/^\s*20\s*$/.test(String(dieTerm))) {
      dieFace = 20;
    } else {
      const firstDie = (roll.dice && roll.dice.length) ? roll.dice[0] : null;
      if (firstDie && firstDie.results && firstDie.results.length) dieFace = firstDie.results[0].result;
    }

    // Monta fórmula exibida explicitamente: 1d20 + atributo + metadeNivel + treino
    const totalRoll = Number(roll.total ?? 0) || 0;
    const parts = ['1d20'];
    // Atributo (pode ser negativo)
    parts.push((atributoMod >= 0 ? '+ ' : '- ') + Math.abs(Number(atributoMod || 0)));
    if (metadeNivel > 0) parts.push('+ ' + metadeNivel);
    if (treinoBonus > 0) parts.push('+ ' + treinoBonus);
    const formulaShort = parts.join(' ');

    // HTML estilizado para o chat (fundo preto, texto branco)
    const content = `
      <div class="card chat-card skill-roll" style="background:#000; color:#fff; padding:8px; display:flex; gap:12px; align-items:center; border-radius:6px;">
        <div class="die" style="width:56px; height:56px; border-radius:8px; background:#111; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:18px; color:#fff;">
          <i class="fas fa-dice-d20" style="color:#fff; margin-right:6px"></i><span>${dieFace ?? '-'}</span>
        </div>
        <div class="skill-info" style="flex:1;">
          <div style="display:flex; align-items:center; gap:8px; justify-content:space-between;">
            <div style="font-weight:700; font-size:1rem">${pericia.label}</div>
            <div style="font-weight:700; color:#fff; background:#6f42c1; padding:4px 8px; border-radius:6px;">${sign}</div>
          </div>
          <div style="margin-top:6px; font-size:0.9rem; color:#ddd;">
            <span style="background:#111; padding:3px 6px; border-radius:4px;">Fórmula: <code style="background:transparent; color:#fff;">${formulaShort}</code></span>
            <span style="margin-left:12px">Total: <strong>${totalRoll}</strong></span>
          </div>
        </div>
      </div>`;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content,
      whisper: null,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      flags: { 'feiticeiros-e-maldicoes': { skillRoll: true } }
    });

    // --- Kokusen: agora dispara APENAS para ataque corpo-a-corpo quando o d20 foi 20 ---
    try {
      const isMeleeAttack = (group === 'ataques' && key === 'corpo');
      if (isMeleeAttack) {
        const kokFlag = (await this.actor.getFlag(game.system.id, 'kokusen')) || {};
        let fluxDepth = Number(kokFlag.fluxDepth ?? 0) || 0;
        const fluxExpiresRound = Number(kokFlag.fluxExpiresRound ?? 0) || 0;
        const currentRound = (game.combat && typeof game.combat.round === 'number') ? game.combat.round : 0;
        if (fluxExpiresRound && currentRound && currentRound > fluxExpiresRound) fluxDepth = 0;

        let d20Face = null;
        if (/^\s*20\s*$/.test(String(dieTerm))) {
          d20Face = 20;
        } else {
          const firstDie = (roll.dice && roll.dice.length) ? roll.dice[0] : null;
          if (firstDie && firstDie.results && firstDie.results.length) {
            d20Face = firstDie.results[0].result;
          }
        }

        // Dispara apenas com face exatamente 20
        if (d20Face === 20) {
          await this.actor.setFlag(game.system.id, 'kokusen.pendingDoubleDamage', true);

          // Roda 1d6 para decidir a recuperação
          try {
            const rollD6 = new Roll('1d6');
            rollD6.evaluateSync();
            const face = Number(rollD6.total || 0);

            let recoveredHP = 0;
            let recoveredEnergy = 0;

            // Função auxiliar para rolar o dado de vida/energia
            const rollDie = async (lado) => {
              try {
                const r = new Roll(String(lado || '1d8'));
                r.evaluateSync();
                return Number(r.total || 0);
              } catch (e) { return 0; }
            };

            // 1: nada
            // 2: recupera 1 dado de vida (roda o lado de dadosVida e cura)
            // 3: recupera 1 dado de energia (roda o lado de dadosEnergia e recupera energia)
            // 4: recupera o dobro do dado de vida
            // 5: recupera o dobro do dado de energia
            // 6: recupera dobro de ambos
            const vidaLado = this.actor.system?.combate?.dadosVida?.lado ?? '1d8';
            const energiaLado = this.actor.system?.combate?.dadosEnergia?.lado ?? '1d6';

            if (face === 2 || face === 4 || face === 6) {
              const v = await rollDie(vidaLado);
              recoveredHP += (face === 4 || face === 6) ? (v * 2) : v;
            }
            if (face === 3 || face === 5 || face === 6) {
              const e = await rollDie(energiaLado);
              recoveredEnergy += (face === 5 || face === 6) ? (e * 2) : e;
            }

            // Aplica recuperação nos recursos (cap na max)
            if (recoveredHP > 0 && this.actor.system?.recursos?.hp) {
              const atualHP = Number(this.actor.system.recursos.hp.value ?? 0) || 0;
              const maxHP = Number(this.actor.system.recursos.hp.max ?? atualHP) || atualHP;
              const novoHP = Math.min(maxHP, atualHP + recoveredHP);
              await this.actor.update({ 'system.recursos.hp.value': novoHP });
            }
            if (recoveredEnergy > 0 && this.actor.system?.recursos?.energia) {
              const atualE = Number(this.actor.system.recursos.energia.value ?? 0) || 0;
              const maxE = Number(this.actor.system.recursos.energia.max ?? atualE) || atualE;
              const novoE = Math.min(maxE, atualE + recoveredEnergy);
              await this.actor.update({ 'system.recursos.energia.value': novoE });
            }

            const bonusMaestria = Number(this.actor.system?.detalhes?.treinamento?.value ?? 0) || 0;
            const newFluxDepth = fluxDepth + 1;
            const newFluxExpires = currentRound ? (currentRound + 10) : 0;
            await this.actor.setFlag(game.system.id, 'kokusen', { fluxDepth: newFluxDepth, fluxExpiresRound: newFluxExpires });

            const firstDone = Boolean((await this.actor.getFlag(game.system.id, 'kokusen'))?.firstDone);
            if (!firstDone) {
              try {
                await this.actor.setFlag(game.system.id, 'kokusen.firstDone', true);
                const atualAdicionais = Number(this.actor.system?.aptidaoTreino?.pontosAdicionais?.value ?? 0) || 0;
                await this.actor.update({ 'system.aptidaoTreino.pontosAdicionais.value': atualAdicionais + 1 });
              } catch (e) { console.warn('Falha ao registrar primeiro Kokusen:', e); }
            }

            const parts = [];
            parts.push(`<div class="kokusen-chat__title">KOKUSEN!</div>`);
            parts.push(`<div class="kokusen-chat__body"><strong>${this.actor.name}</strong> ativou <span class="kokusen-badge">Kokusen</span> (d6: <b>${face}</b>).`);
            if (recoveredHP > 0) parts.push(`<div>Recuperou <b>${recoveredHP}</b> PV.</div>`);
            if (recoveredEnergy > 0) parts.push(`<div>Recuperou <b>${recoveredEnergy}</b> PE.</div>`);
            const chatContent = `<div class="kokusen-chat">${parts.join('')}</div>`;
            await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: chatContent });
            try { Hooks.call('kokusen', this.actor, { fluxDepth: newFluxDepth, bonusMaestria, d6: face, recoveredHP, recoveredEnergy }); } catch(e) { console.warn('Hook kokusen erro:', e); }
          } catch (e) {
            console.warn('Erro ao rolar d6 para Kokusen:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao processar Kokusen:', err);
    }

    return roll;
  }

  /**
   * Abrir modal simplificado para ativar/remover aptidão (sem descrição)
   */
  async _onAptidaoClick(event) {
    event.preventDefault();

    const label = event.currentTarget;
    const $label = $(label);
    const key = $label.data('key');
    const cat = $label.data('cat');
    const name = $label.find('.aptidoes-label').text().trim() || key;

    const current = foundry.utils.getProperty(this.actor.system, `aptidoes.${cat}.${key}`) ?? false;
    const action = current ? 'Remover' : 'Ativar';
    // Try to find an existing embedded Item for this aptidão to prefill modal fields
    const aptidaoKey = `${cat}.${key}`;
    const existingItem = this.actor.items.find(i => i.type === 'aptidao' && i.getFlag(game?.system?.id ?? 'feiticeiros-e-maldicoes', 'aptidaoKey') === aptidaoKey);

    // Mostrar somente a descrição específica da aptidão clicada
    const specificKey = `${cat}.${key}`;
    const specificDesc = APTIDOES_DESCRICOES[specificKey] || APTIDOES_CATALOGO[cat]?.entradas?.find(e => e.key === key)?.description;
    const descHtml = specificDesc ? `<div class="aptidao-desc"><p>${specificDesc}</p></div>` : `<div class="aptidao-desc"><p>Descrição não disponível.</p></div>`;

    const content = `
      <div class="aptidao-dialog">
        <div class="aptidao-dialog-body">
          <div class="aptidao-icon"><i class="fas fa-star"></i></div>
          <div class="aptidao-main">
            <h3 style="margin:0">${name} <span class="aptidao-badge ${current ? 'active' : 'inactive'}">${current ? 'Ativa' : 'Inativa'}</span></h3>
            ${descHtml}
          </div>
        </div>
      </div>`;

    new Dialog({
      title: '',
      content,
      buttons: {
        confirm: {
          icon: '<i class="fas fa-check"></i>',
          label: action,
          callback: async () => {
            const update = {};
            const next = !current;

            // Validação de pré-requisitos (cadeia) ao ATIVAR (DESATIVADA)
            if (next && false) {
              const nivelTotalDerivado = this.actor.system.detalhes?.nivel?.value ??
                ((this.actor.system.detalhes?.niveis?.principal?.value || 0) + (this.actor.system.detalhes?.niveis?.secundario?.value || 0));

              // Regras explícitas para Domínio (evita depender de parsing de texto)
              // Fonte: module/sheets/actor-sheet/aptidoes-data.mjs
              if (cat === 'dominio' && key === 'expansaoDeDominioIncompleta') {
                const domNivel = Number(this.actor.system?.aptidaoNiveis?.dominio?.value ?? 0) || 0;
                if ((Number(nivelTotalDerivado) || 0) < 8) {
                  ui.notifications.warn('Pré-requisito não atendido: Nível 8.');
                  return;
                }
                if (domNivel < 1) {
                  ui.notifications.warn('Pré-requisito não atendido: Domínio Nível 1.');
                  return;
                }
              }

              if (cat === 'dominio' && key === 'expansaoDeDominioCompleta') {
                const barNivel = Number(this.actor.system?.aptidaoNiveis?.barreiras?.value ?? 0) || 0;
                const domNivel = Number(this.actor.system?.aptidaoNiveis?.dominio?.value ?? 0) || 0;
                const hasTecnicas = Boolean(this.actor.system?.aptidoes?.barreiras?.tecnicasDeBarreiras);
                const hasIncompleta = Boolean(this.actor.system?.aptidoes?.dominio?.expansaoDeDominioIncompleta);

                if ((Number(nivelTotalDerivado) || 0) < 10) {
                  ui.notifications.warn('Pré-requisito não atendido: Nível 10.');
                  return;
                }
                if (!hasTecnicas) {
                  ui.notifications.warn('Pré-requisito não atendido: Técnicas de Barreira.');
                  return;
                }
                if (!hasIncompleta) {
                  ui.notifications.warn('Pré-requisito não atendido: Expansão de Domínio Incompleta.');
                  return;
                }
                if (barNivel < 3 || domNivel < 3) {
                  ui.notifications.warn('Pré-requisito não atendido: Barreira e Domínio Nível 3.');
                  return;
                }
              }

              if (cat === 'dominio' && key === 'acertoGarantido') {
                const barNivel = Number(this.actor.system?.aptidaoNiveis?.barreiras?.value ?? 0) || 0;
                const domNivel = Number(this.actor.system?.aptidaoNiveis?.dominio?.value ?? 0) || 0;
                const hasCompleta = Boolean(this.actor.system?.aptidoes?.dominio?.expansaoDeDominioCompleta);
                const feiticaria = Number(this.actor.system?.pericias?.feiticaria?.value ?? 0) || 0;

                if ((Number(nivelTotalDerivado) || 0) < 14) {
                  ui.notifications.warn('Pré-requisito não atendido: Nível 14.');
                  return;
                }
                if (!hasCompleta) {
                  ui.notifications.warn('Pré-requisito não atendido: Expansão de Domínio Completa.');
                  return;
                }
                if (feiticaria < 1) {
                  ui.notifications.warn('Pré-requisito não atendido: Treinamento em Feitiçaria.');
                  return;
                }
                if (barNivel < 4 || domNivel < 4) {
                  ui.notifications.warn('Pré-requisito não atendido: Barreira e Domínio Nível 4.');
                  return;
                }
              }

              const prereq = extrairPrereqsDaDescricao(specificDesc ?? '', cat);

              if (prereq?.nivelPersonagemMin && (Number(nivelTotalDerivado) || 0) < prereq.nivelPersonagemMin) {
                ui.notifications.warn(`Pré-requisito não atendido: Nível ${prereq.nivelPersonagemMin}.`);
                return;
              }

              if (prereq?.aptidaoCampo && prereq?.aptidaoMin) {
                const atual = Number(this.actor.system?.aptidaoNiveis?.[prereq.aptidaoCampo]?.value ?? 0) || 0;
                if (atual < prereq.aptidaoMin) {
                  const labelCampo = this.actor.system?.aptidaoNiveis?.[prereq.aptidaoCampo]?.label ?? prereq.aptidaoCampo;
                  ui.notifications.warn(`Pré-requisito não atendido: ${labelCampo} Nível ${prereq.aptidaoMin}.`);
                  return;
                }
              }

              // Atributos mínimos (ex.: Presença 16)
              if (prereq?.atributosMin && Object.keys(prereq.atributosMin).length > 0) {
                for (const [attrKey, minVal] of Object.entries(prereq.atributosMin)) {
                  const atual = Number(this.actor.system?.atributos?.[attrKey]?.value ?? 0) || 0;
                  if (atual < Number(minVal)) {
                    const label = this.actor.system?.atributos?.[attrKey]?.label ?? attrKey;
                    ui.notifications.warn(`Pré-requisito não atendido: ${label} ${minVal}.`);
                    return;
                  }
                }
              }

              // Aptidões prévias mencionadas em [Pré: ...]
              if (Array.isArray(prereq?.prereqTokens) && prereq.prereqTokens.length > 0) {
                for (const token of prereq.prereqTokens) {
                  const resolved = _resolverAptidaoPorLabel(token);
                  if (resolved) {
                    const hasIt = Boolean(this.actor.system?.aptidoes?.[resolved.cat]?.[resolved.key]);
                    if (!hasIt) {
                      ui.notifications.warn(`Pré-requisito não atendido: ${resolved.label}.`);
                      return;
                    }
                    continue;
                  }

                  // Tentar mapear como Técnica embutida no ator
                  const resolvedTec = _resolverTecnicaPorLabel(token, this.actor);
                  if (resolvedTec) {
                    const tItem = this.actor.items.find(i => i.id === resolvedTec.itemId);
                    if (!tItem) {
                      ui.notifications.warn(`Pré-requisito não atendido: Técnica ${resolvedTec.label}.`);
                      return;
                    }
                    // Verifica pré-requisitos da própria técnica (recursivo)
                    const ok = await _verificarPrereqsTecnica(tItem, this.actor, new Set());
                    if (!ok) {
                      ui.notifications.warn(`Pré-requisito não atendido: Técnica ${resolvedTec.label} (pré-requisitos não satisfeitos).`);
                      return;
                    }
                    continue;
                  }

                  // Se não conseguimos mapear, não bloqueia (evita falsos positivos), mas registra para debug.
                  console.warn('Pré-requisito não mapeado no catálogo nem como técnica:', token, 'para', `${cat}.${key}`);
                  continue;
                }
              }

              // Regra explícita do sistema: Paredes Resistentes exige Técnicas de Barreira
              if (cat === 'barreiras' && key === 'paredesResistentes') {
                const hasTecnicas = Boolean(this.actor.system?.aptidoes?.barreiras?.tecnicasDeBarreiras);
                if (!hasTecnicas) {
                  ui.notifications.warn('Pré-requisito não atendido: Técnicas de Barreira.');
                  return;
                }
              }
            }

            update[`system.aptidoes.${cat}.${key}`] = next;
            await this.actor.update(update);

            try {
              // Ação e custo são inferidos pela descrição (não há mais inputs no modal)
              const chosenAction = inferirTipoAcao(specificDesc ?? '');
              let chosenCost = inferirCustoPE(specificDesc ?? '');

              // Custos fixos para Expansões de Domínio (evita ambiguidade do texto)
              if (cat === 'dominio' && key === 'expansaoDeDominioIncompleta') chosenCost = 15;
              if (cat === 'dominio' && key === 'expansaoDeDominioCompleta') chosenCost = 20;
              if (cat === 'dominio' && key === 'acertoGarantido') chosenCost = 25;

              const result = await this._syncAptidaoEmbeddedItem({
                cat,
                key,
                name,
                desc: specificDesc ?? '',
                active: next,
                acao: chosenAction,
                custo: chosenCost,
              });

              // Ajuda a diagnosticar rapidamente se o problema é criação vs. visibilidade.
              if (result?.action === 'created') {
                ui.notifications.info(`Item de Aptidão criado: ${name}.`);
              } else if (result?.action === 'updated') {
                ui.notifications.info(`Item de Aptidão atualizado: ${name}.`);
              } else if (result?.action === 'deleted') {
                ui.notifications.info(`Item de Aptidão removido: ${name}.`);
              }
            } catch (err) {
              console.error('Falha ao sincronizar aptidão como Item:', err);
              ui.notifications.warn('Aptidão atualizada, mas falhou ao criar/remover o Item. Veja o console (F12).');
            }

            ui.notifications.info(`${name} ${next ? 'ativada' : 'removida'}.`);
            this.render(false);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancelar'
        }
      },
      default: 'confirm'
    }, { classes: ['aptidao-dialog'], width: 720, height: 'auto' }).render(true);
  }

  /**
   * Garante que uma aptidão ativa exista como Item embutido no ator.
   * - Ativar: cria (ou atualiza) um Item do tipo `aptidao`.
   * - Remover: apaga o Item correspondente.
   */
  async _syncAptidaoEmbeddedItem({ cat, key, name, desc, active, acao, custo }) {
    // Se o usuário estiver rodando outra pasta/sistema por engano, isso aparece imediatamente.
    const systemId = game?.system?.id ?? 'feiticeiros-e-maldicoes';

    // Em Foundry v12, o sistema precisa declarar o tipo no system.json.
    const supportedTypes = game?.system?.documentTypes?.Item;
    const hasAptidaoType = (() => {
      if (!supportedTypes) return false;
      if (Array.isArray(supportedTypes)) return supportedTypes.includes('aptidao');
      // Foundry pode expor como Set em alguns contextos
      if (supportedTypes instanceof Set) return supportedTypes.has('aptidao');
      // Ou como objeto { aptidao: true } / { aptidao: <schema> }
      if (typeof supportedTypes === 'object') {
        return Object.prototype.hasOwnProperty.call(supportedTypes, 'aptidao');
      }
      return false;
    })();

    if (!hasAptidaoType) {
      const msg = `Este mundo/sistema não tem o tipo de Item "aptidao" habilitado (systemId=${systemId}).`; 
      console.error(msg, { supportedTypes, systemId });
      ui.notifications.error(msg);
      return { action: 'noop' };
    }

    if (!this.actor.isOwner) {
      ui.notifications.warn('Sem permissão para criar Itens neste ator.');
      return { action: 'noop' };
    }

    const aptidaoKey = `${cat}.${key}`;
    const existing = this.actor.items.find(
      (i) => i.type === 'aptidao' && i.getFlag(systemId, 'aptidaoKey') === aptidaoKey
    );

    if (!active) {
      if (existing) {
        await this.actor.deleteEmbeddedDocuments('Item', [existing.id]);
        return { action: 'deleted', itemId: existing.id };
      }
      return { action: 'noop' };
    }

    const fonte = APTIDOES_CATALOGO[cat]?.titulo ?? 'Aptidões';
    // Inferir tipo de ação a partir da descrição (se disponível)
    const inferredAction = inferirTipoAcao(desc ?? '');
    // Tentar extrair custo em Pontos de Energia (PE) da descrição se não for fornecido explicitamente
    let inferredCost = undefined;
    if (typeof desc === 'string' && desc) {
      const peRegex = /(?:gasta|custa|paga|pagar|pago|paga)\s*(?:até\s*)?(\d+)\s*(?:PE|Pontos? de Energia|pontos? de energia)\b/i;
      const simpleRegex = /\b(\d+)\s*(?:PE|Pontos? de Energia|pontos? de energia)\b/i;
      const m1 = desc.match(peRegex);
      const m2 = desc.match(simpleRegex);
      const match = m1 ?? m2;
      if (match && match[1]) inferredCost = Number.parseInt(match[1], 10);
    }

    const baseUpdate = {
      name,
      'system.descricao.value': desc,
      'system.fonte.value': fonte,
      // Campos comuns do nosso template de aptidão (mantém coerente)
      'system.custo.value': (custo ?? inferredCost ?? this.actor.items.get(existing?.id)?.system?.custo?.value) ?? 0,
      'system.acao.value': (acao ?? this.actor.items.get(existing?.id)?.system?.acao?.value ?? inferredAction) ?? 'Passiva',
      'system.requisito.value': this.actor.items.get(existing?.id)?.system?.requisito?.value ?? '',
    };

    if (existing) {
      await existing.update(baseUpdate);
      return { action: 'updated', itemId: existing.id };
    }

    const itemData = {
      name,
      type: 'aptidao',
      img: 'icons/svg/book.svg',
      system: {
        descricao: { value: desc },
        fonte: { value: fonte },
        custo: { value: (custo ?? inferredCost ?? 0), label: 'Custo (PE)' },
        acao: { value: (acao ?? inferredAction ?? 'Passiva'), label: 'Ação' },
        requisito: { value: '', label: 'Requisito' },
      },
      flags: {
        [systemId]: {
          aptidaoKey,
        },
      },
    };

    const created = await this.actor.createEmbeddedDocuments('Item', [itemData]);
    const createdId = created?.[0]?.id;
    if (!createdId) {
      console.warn('createEmbeddedDocuments não retornou um Item criado, verifique permissões/model.', { itemData });
      return { action: 'noop' };
    }
    return { action: 'created', itemId: createdId };
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);
    const name = `Novo(a) ${type.capitalize()}`;
    const itemData = { name: name, type: type, system: data };
    delete itemData.system['type'];
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Modal específica para Origem = Maldição: escolha de raça
   */
  async _openOrigemMaldicaoDialog() {
    const currentRace = this.actor.system.detalhes?.racaMaldicao?.value ?? "";
    // Mapeamento de valores legados para os novos nomes
    const legacyMap = {
      'Besta': 'Colosso Carniçal',
      'Aristocrata': 'Soberano Carmesim',
      'Parasita': 'Parasita do Vazio'
    };
    const displayRace = legacyMap[currentRace] || currentRace;

    const content = `
      <div class="maldicao-origem">
        <div class="maldicao-origem__header">
          <h2>Origem: Maldição</h2>
          <p>Escolha uma variação (Raça) para sua Maldição.</p>
        </div>

        <div class="maldicao-origem__choices">
          <button type="button" class="maldicao-origem__choice" data-choice="Colosso Carniçal">
            <i class="fas fa-drumstick-bite maldicao-icon colosso-icon"></i>
            <div class="title">Colosso Carniçal</div>
            <div class="sub">"A fome não é um sentimento. É um motor que exige combustível."</div>
          </button>

          <button type="button" class="maldicao-origem__choice" data-choice="Soberano Carmesim">
            <i class="fas fa-crown maldicao-icon soberano-icon"></i>
            <div class="title">Soberano Carmesim</div>
            <div class="sub">"Humanos construíram castelos. Eu construirei um império sobre as artérias deles."</div>
          </button>

          <button type="button" class="maldicao-origem__choice" data-choice="Parasita do Vazio">
            <i class="fas fa-bug maldicao-icon parasita-icon"></i>
            <div class="title">Parasita do Vazio</div>
            <div class="sub">"A realidade é tão... quebradiça. Vamos ver o que acontece se eu puxar este fio."</div>
          </button>

          <button type="button" class="maldicao-origem__choice" data-choice="Espreitador das Sombras">
            <i class="fas fa-user-secret maldicao-icon espreitador-icon"></i>
            <div class="title">Espreitador das Sombras</div>
            <div class="sub">"O medo tem um sabor. É frio, metálico e... delicioso."</div>
          </button>
        </div>

        ${currentRace ? `<div class="maldicao-origem__current">Atual: <b>${currentRace}</b></div>` : ``}
      </div>
    `;

    let dlg;
    dlg = new Dialog(
      {
        title: '',
        content,
        buttons: {
          cancel: {
            label: "Cancelar",
            callback: async () => {
              const prev = this._prevOrigemValue ?? "Estudante";
              await this.actor.update({ "system.detalhes.origem.value": prev });
            },
          },
        },
        default: "cancel",
        render: (html) => {
          html.find('.maldicao-origem__choice').on('click', async (ev) => {
            const race = ev.currentTarget.dataset.choice;
            await this.actor.update({
              'system.detalhes.origem.value': 'Maldição',
              'system.detalhes.racaMaldicao.value': race,
            });
            dlg.close();
            this.render(false);
          });
        },
      },
      { classes: ['origem-maldicao-dialog'], width: 520, height: 'auto' }
    );

    dlg.render(true);
  }
  
  /** Toggle manual pill (click) */
  async _onToggleDeathMark(event) {
    event.preventDefault();
    if (!this.isEditable) return;
    const el = event.currentTarget;
    const path = el.dataset.path;
    if (!path) return;
    const current = foundry.utils.getProperty(this.actor, path);
    const update = {};
    update[path] = !current;
    try {
      await this.actor.update(update);
    } catch (err) {
      console.error('Falha ao alternar marcação de morte:', err);
    }
  }

  /** Reset all death save marks */
  async _onDeathReset(event) {
    event?.preventDefault();
    if (!this.isEditable) return;
    const update = {
      'system.combate.morte.s1': false,
      'system.combate.morte.s2': false,
      'system.combate.morte.s3': false,
      'system.combate.morte.f1': false,
      'system.combate.morte.f2': false,
      'system.combate.morte.f3': false,
    };
    await this.actor.update(update);
  }

  /** Perform a death save roll and mark the next pill */
  async _onDeathTest(event) {
    event?.preventDefault();
    if (!this.isEditable) return;
    // only allow death tests when at 0 HP
    const hp = Number(this.actor.system?.recursos?.hp?.value ?? 0) || 0;
    if (hp > 0) return ui.notifications.warn('Testes de morte só podem ser feitos com 0 de HP.');
    const conMod = Number(this.actor.system?.atributos?.constituicao?.mod ?? 0) || 0;
    const formula = `1d20 + ${conMod}`;
    let roll = new Roll(formula);
    await roll.evaluate();
    // Post result to chat
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: `<b>Teste de Morte</b>` });

    const total = Number(roll.total ?? 0);
    const success = total >= 10;

    // find next empty slot
    const successPaths = ['system.combate.morte.s1','system.combate.morte.s2','system.combate.morte.s3'];
    const failPaths = ['system.combate.morte.f1','system.combate.morte.f2','system.combate.morte.f3'];
    const update = {};

    if (success) {
      for (const p of successPaths) {
        if (!foundry.utils.getProperty(this.actor, p)) { update[p] = true; break; }
      }
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: `<strong>${this.actor.name}</strong> obteve <span style="color:#4caf50;">Sucesso</span> no teste de morte (${total}).` });
    } else {
      for (const p of failPaths) {
        if (!foundry.utils.getProperty(this.actor, p)) { update[p] = true; break; }
      }
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: `<strong>${this.actor.name}</strong> obteve <span style="color:#ff5252;">Falha</span> no teste de morte (${total}).` });
    }

    // apply update (if any)
    if (Object.keys(update).length) await this.actor.update(update);

    // check successes count
    const successes = successPaths
      .map(p => Boolean(foundry.utils.getProperty(this.actor, p)))
      .filter(Boolean).length;
    if (successes >= 3) {
      // estabiliza: define 1 de HP e limpa marcas de morte
      const reset = {
        'system.recursos.hp.value': 1,
        'system.combate.morte.s1': false,
        'system.combate.morte.s2': false,
        'system.combate.morte.s3': false,
        'system.combate.morte.f1': false,
        'system.combate.morte.f2': false,
        'system.combate.morte.f3': false,
      };
      try {
        await this.actor.update(reset);
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), content: `<strong>${this.actor.name}</strong> obteve 3 <span style="color:#4caf50;">Sucessos</span> e estabilizou com <b>1 PV</b>.` });
      } catch (e) {
        console.error('Erro ao estabilizar após 3 sucessos:', e);
      }
      return;
    }

    // check failures count
    const failures = ['system.combate.morte.f1','system.combate.morte.f2','system.combate.morte.f3']
      .map(p => Boolean(foundry.utils.getProperty(this.actor, p)))
      .filter(Boolean).length;
    if (failures >= 3) {
      // abrir mini-modal dramático
      this._openLastActionDialog();
    }
  }

  /** Mini-modal dramático: Última Ação */
  async _openLastActionDialog() {
    // Última ação: aplica uma ação com crítico garantido e mata o personagem sem criar mensagens
    // Listar apenas ataques presentes na ficha (system.ataques)
    const ataques = this.actor.system?.ataques ?? {};
    const ataqueEntries = Object.entries(ataques)
      .map(([key, a]) => ({ key, label: a?.label ?? key }))
      .filter(a => Boolean(a.key));

    const options = ataqueEntries.length
      ? ataqueEntries.map(a => `<option value="${a.key}">${a.label}</option>`).join('')
      : `<option value="">(Nenhum ataque encontrado)</option>`;

    const content = `
      <div class="ultima-acao-dialog">
        <div class="ultima-acao-header">
          <i class="fas fa-skull ultima-acao-icon"></i>
          <div class="ultima-acao-meta">
            <h3>Última Ação</h3>
            <div class="ultima-acao-sub">${this.actor.name} alcançou <strong>3 Falhas</strong>. Escolha um ataque para executar com <strong>crítico garantido</strong>.</div>
          </div>
        </div>

        <div class="ultima-acao-body">
          <label for="last-action-ataque">Escolha o ataque</label>
          <select id="last-action-ataque" name="last-action-ataque" class="ultima-acao-select">
            ${options}
          </select>
        </div>
      </div>
    `;

    const dlg = new Dialog({
      title: "Última Ação",
      content,
      buttons: {
        try: {
          label: 'Executar Última Ação (Crítico)',
          callback: async (html) => {
            try {
              const selectedKey = html.find('select[name="last-action-ataque"]').val();
              if (!selectedKey) {
                ui.notifications.warn('Nenhum ataque selecionado.');
                return;
              }

              // 1) Marcar flag temporária para garantir crítico
              await this.actor.setFlag(game.system.id, 'ultimaAcao.critico', true);

              // 2) Rolar o ataque (vai para o chat normalmente)
              await this._rollPericiaByKey({ key: String(selectedKey), group: 'ataques' });

              // 3) Garantir limpeza caso algo falhe antes de consumir
              try { await this.actor.unsetFlag(game.system.id, 'ultimaAcao.critico'); } catch (_) {}
            } catch (err) {
              console.warn('Erro ao aplicar flag de último-crit:', err);
            }
            // Matar o personagem sem mensagens
            await this.actor.update({ 'system.recursos.hp.value': 0 });
            this.render(false);
          }
        },
        accept: {
          label: 'Aceitar Morte',
          callback: async () => {
            await this.actor.update({ 'system.recursos.hp.value': 0 });
            this.render(false);
          }
        }
      },
      default: 'try'
    }, { classes: ['ultima-acao'] });
    dlg.render(true);
  }
/**
   * Lida com a subida de nível e multiclasse com XP Curvo
   */
  async _onLevelUp(event) {
    event.preventDefault();
    const system = this.actor.system;

    // --- TABELA DE XP ---
    const XP_TABELA = [0, 1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000, 55000, 66000, 78000, 91000, 105000, 120000, 136000, 153000, 171000, 190000];

    const niveis = system.detalhes.niveis || { principal: { value: 0 }, secundario: { value: 0 } };
    const nivelPrincipal = niveis.principal?.value || 0;
    const nivelSecundario = niveis.secundario?.value || 0;
    const nivelAtualTotal = nivelPrincipal + nivelSecundario;

    const classePrincipalNome = system.detalhes.classe?.value || "Classe Principal";
    const multiclasseNome = system.detalhes.multiclasse?.value || "Nenhuma";
    const temMulticlasse = multiclasseNome !== "Nenhuma";
    const xpAtual = system.detalhes.xp?.value || 0;

    // --- TRAVAS DE XP ---
    let nivelPermitido = 1;
    for (let i = 0; i < XP_TABELA.length; i++) {
        if (xpAtual >= XP_TABELA[i]) nivelPermitido = i + 1;
    }

    if (nivelAtualTotal >= 20) {
        ui.notifications.warn("Nível máximo atingido!");
        return;
    }
    if (nivelAtualTotal >= nivelPermitido) {
        const proximoNivel = Math.min(20, nivelAtualTotal + 1);
        const xpNecessario = XP_TABELA[proximoNivel - 1] ?? XP_TABELA[XP_TABELA.length - 1] ?? 0;
        const xpFaltante = Math.max(0, xpNecessario - xpAtual);
        ui.notifications.warn(
        `XP insuficiente: faltam ${xpFaltante} XP para o nível ${proximoNivel} (precisa de ${xpNecessario}).`
        );
        return;
    }

    // Abrir o diálogo de Level Up usando a nova API: apenas actor
    try {
      new LevelUpDialog(this.actor).render(true);
    } catch (err) {
      console.error('Falha ao abrir LevelUpDialog:', err);
      ui.notifications.error('Erro ao abrir diálogo de subida de nível. Veja o console.');
    }
  }
}