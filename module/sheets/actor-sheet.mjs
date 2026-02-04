import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

import { MAPA_ATRIBUTOS } from './actor-sheet/atributos.mjs';
const MAPA_DE_ATRIBUTOS = {
  'lutador': 'sabedoria',
  'especialista em combate': 'sabedoria',
  'especialista em técnica': 'inteligencia',
  'especialista em tecnica': 'inteligencia',
  'controlador': 'inteligencia',
  'suporte': 'sabedoria',
  'restringido': null 
};
import {
  APTIDOES_CATALOGO,
  APTIDOES_DESCRICOES,
  APTIDOES_DESC_COMPLETA,
} from './actor-sheet/aptidoes-data.mjs';
import { extrairPrereqsDaDescricao, inferirTipoAcao, inferirCustoPE } from './actor-sheet/aptidoes-utils.mjs';
import { handleLutadorUse } from '../helpers/lutador-habilidades.mjs';
import LevelUpDialog from '../apps/level-up-dialog.mjs';
import { rollFormula } from '../helpers/rolls.mjs';

function _normalizarTextoAptidaoLocal(str = '') {
  return String(str)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function _resolverAptidaoPorLabel(tokenNormalizado) {
  if (!tokenNormalizado) return null;

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

  for (const [cat, bloco] of Object.entries(APTIDOES_CATALOGO ?? {})) {
    const entradas = bloco?.entradas;
    if (!Array.isArray(entradas)) continue;
    for (const entry of entradas) {
      const lbl = _normalizarTextoAptidaoLocal(entry?.label ?? '');
      if (lbl && lbl === tokenNormalizado) return { cat, key: entry.key, label: entry.label };
    }
  }

  for (const [cat, bloco] of Object.entries(APTIDOES_CATALOGO ?? {})) {
    const entradas = bloco?.entradas;
    if (!Array.isArray(entradas)) continue;
    for (const entry of entradas) {
      const lbl = _normalizarTextoAptidaoLocal(entry?.label ?? '');
      if (!lbl) continue;
      if (lbl.includes(tokenNormalizado) || tokenNormalizado.includes(lbl)) {
        return { cat, key: entry.key, label: entry.label };
      }
      const lblSing = lbl.replace(/s\b/, '');
      const tokSing = tokenNormalizado.replace(/s\b/, '');
      if (lblSing === tokSing || lblSing.includes(tokSing) || tokSing.includes(lblSing)) {
        return { cat, key: entry.key, label: entry.label };
      }
    }
  }

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
  const tecnicas = actor.items?.filter?.(i => i?.type === 'tecnica') ?? [];
  if (!Array.isArray(tecnicas) || tecnicas.length === 0) return null;

  for (const t of tecnicas) {
    const nameNorm = _normalizarTextoAptidaoLocal(t?.name ?? '');
    if (nameNorm && nameNorm === tokenNormalizado) return { type: 'tecnica', itemId: t.id, label: t.name };
  }

  for (const t of tecnicas) {
    const nameNorm = _normalizarTextoAptidaoLocal(t?.name ?? '');
    if (!nameNorm) continue;
    if (nameNorm.includes(tokenNormalizado) || tokenNormalizado.includes(nameNorm)) return { type: 'tecnica', itemId: t.id, label: t.name };
    const nameSing = nameNorm.replace(/s\b/, '');
    const tokSing = tokenNormalizado.replace(/s\b/, '');
    if (nameSing === tokSing || nameSing.includes(tokSing) || tokSing.includes(nameSing)) return { type: 'tecnica', itemId: t.id, label: t.name };
  }

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
  if (visited.has(item.id)) return true;
  visited.add(item.id);

  const requisitoText = String(item.system?.requisito?.value ?? '').trim();
  const descText = String(item.system?.descricao?.value ?? '').trim();
  const combined = `${requisitoText} ${descText}`.trim();

  const prereq = extrairPrereqsDaDescricao(combined, null);

  const actorNivel = _getActorNivel(actor);
  if (prereq?.nivelPersonagemMin && actorNivel < prereq.nivelPersonagemMin) return false;

  if (prereq?.aptidaoCampo && prereq?.aptidaoMin) {
    const atual = Number(actor.system?.aptidaoNiveis?.[prereq.aptidaoCampo]?.value ?? 0) || 0;
    if (atual < prereq.aptidaoMin) return false;
  }

  if (prereq?.atributosMin && Object.keys(prereq.atributosMin).length > 0) {
    for (const [attrKey, minVal] of Object.entries(prereq.atributosMin)) {
      const atual = Number(actor.system?.atributos?.[attrKey]?.value ?? 0) || 0;
      if (atual < Number(minVal)) return false;
    }
  }

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
      continue;
    }
  }

  return true;
}
export class BoilerplateActorSheet extends ActorSheet {
  _prevOrigemValue = null;

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
    // Start from raw system data, then apply ActiveEffects transiently for display
    context.system = actorData.system;
    try {
      context.system = this._applyActiveEffectsToSystem(foundry.utils.deepClone(context.system));
    } catch (e) { console.warn('Falha ao aplicar ActiveEffects ao contexto da ficha:', e); }
    context.flags = actorData.flags;
    context.config = CONFIG.FEITICEIROS ?? CONFIG.BOILERPLATE;

    const aptCatalogClone = foundry.utils.deepClone(APTIDOES_CATALOGO);
    context.aptidoesCatalogo = aptCatalogClone;

    if (actorData.type == 'character') {
            const hasTecnicasBarreiras = Boolean(context.system?.aptidoes?.barreiras?.tecnicasDeBarreiras);
            if (!hasTecnicasBarreiras && context.aptidoesCatalogo?.barreiras?.entradas) {
              context.aptidoesCatalogo.barreiras.entradas = context.aptidoesCatalogo.barreiras.entradas.filter(e => e.key !== 'paredesResistentes');
            }
            const detalhes = context.system.detalhes || {};

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
            const pvPadrao = 5 + (barNivel * Math.floor(charNivel / 2));
            const pvParedesResistentes = 10 + (barNivel * charNivel);
            const pvCascaDominio = pvPadrao * 2;

            context.system.aptidaoDerivados.barreira = {
              tamanhoSegmentoM,
              custoPEporParede,
              pvPadrao,
              pvParedesResistentes,
              pvCascaDominio,
              maxSegmentos: 6,
              pvPadraoObj: { label: 'PV por Parede (Padrão)', value: pvPadrao },
              pvParedesResistentesObj: { label: 'PV Paredes Resistentes', value: pvParedesResistentes },
              pvCascaDominioObj: { label: 'PV Casca do Domínio', value: pvCascaDominio }
            };

        const maldLabel = context.system?.detalhes?.racaMaldicao?.value
          ? `Maldição - ${context.system.detalhes.racaMaldicao.value}`
          : 'Maldição';

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

        if (context.system.recursos) {
            for (let [key, resource] of Object.entries(context.system.recursos)) {
                if (resource.max > 0) {
                    resource.percent = Math.max(0, Math.min(100, Math.round((resource.value / resource.max) * 100)));
                } else {
                    resource.percent = 0;
                }
            }
        }

        try {
          const actorHasIntegridade = typeof actorData.system?.recursos?.integridade?.value !== 'undefined' || typeof actorData.system?.recursos?.integridade?.max !== 'undefined';
          if (!actorHasIntegridade) {
            context.system.recursos.integridade = context.system.recursos.integridade || {};
            context.system.recursos.integridade.value = Number(context.system.recursos.integridade.value ?? 0) || 0;
            context.system.recursos.integridade.max = Number(context.system.recursos.integridade.max ?? 0) || 0;
            context.system.recursos.integridade.percent = (context.system.recursos.integridade.max > 0)
              ? Math.max(0, Math.min(100, Math.round((context.system.recursos.integridade.value / context.system.recursos.integridade.max) * 100)))
              : 0;
          }
        } catch (e) { /* ignore */ }
        try {
          context.system.combate = context.system.combate || {};

          context.system.combate.defesa = context.system.combate.defesa || {};
          context.system.combate.defesa.breakdown = context.system.combate.defesa.breakdown || context.system.combate.ca?.breakdown || {
            base: Number(context.system.combate?.baseValue ?? 10) || 10,
            dex: Number(context.system.atributos?.destreza?.mod ?? Math.floor((Number(context.system.atributos?.destreza?.value ?? 10) - 10) / 2)) || 0,
            equipment: Number(0),
            uniform: Number(0),
            adHoc: Number(0)
          };

          context.system.combate.cd = context.system.combate.cd || {};
          context.system.combate.cd.breakdown = context.system.combate.cd.breakdown || {
            base: Number(context.system.combate?.cd?.breakdown?.base ?? context.system.combate?.cd?.base ?? 10) || 10,
            metadeNivel: Number(
              context.system.combate?.cd?.breakdown?.metadeNivel ?? (
                Math.floor(Number(context.system.detalhes?.nivel?.value ?? 0) / 2)
              )
            ) || 0,
            atributo: Number(
              context.system.combate?.cd?.breakdown?.atributo ?? (
                Math.max(Number(context.system.atributos?.inteligencia?.mod ?? 0), Number(context.system.atributos?.sabedoria?.mod ?? 0))
              )
            ) || 0,
            treinamento: Number(
              context.system.combate?.cd?.breakdown?.treinamento ?? context.system.detalhes?.treinamento?.value ?? 0
            ) || 0,
            outros: Number(
              context.system.combate?.cd?.breakdown?.outros ?? (
                Number(context.system.combate?.cd?.breakdown?.equipment ?? 0) +
                Number(context.system.combate?.cd?.breakdown?.adHoc ?? context.system.combate?.cd?.bonusAdHoc ?? 0) +
                Number(context.system.combate?.cd?.breakdown?.manual ?? context.system.combate?.cd?.outrosBonus ?? 0) +
                Number(context.system.combate?.cd?.breakdown?.flags ?? 0)
              )
            ) || 0,
            equipment: Number(context.system.combate?.cd?.breakdown?.equipment ?? context.system.combate?.cd?.equipment ?? 0) || 0,
            adHoc: Number(context.system.combate?.cd?.breakdown?.adHoc ?? context.system.combate?.cd?.bonusAdHoc ?? 0) || 0,
            flags: Number(context.system.combate?.cd?.breakdown?.flags ?? 0) || 0,
            manual: Number(context.system.combate?.cd?.breakdown?.manual ?? context.system.combate?.cd?.outrosBonus ?? 0) || 0
          };

          try {
            console.debug('DEBUG: sheet context combate.defesa.breakdown', {
              actorId: actorData._id || actorData.id,
              defesa: context.system.combate.defesa.breakdown,
              cd: context.system.combate.cd.breakdown
            });
          } catch (e) { /* ignore */ }
        } catch (e) { /* ignore normalization errors */ }

        const modelAptidoes = game?.system?.model?.Actor?.[actorData.type]?.aptidoes ?? {};

        if (Object.keys(modelAptidoes).length > 0) {
          context.system.aptidoes = foundry.utils.mergeObject(
            foundry.utils.deepClone(modelAptidoes),
            context.system.aptidoes ?? {},
            { inplace: false, overwrite: true }
          );
        } else {
          context.system.aptidoes = context.system.aptidoes ?? {};
        }

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

        const nivelTotalDerivado = context.system.detalhes?.nivel?.value ??
          ((context.system.detalhes?.niveis?.principal?.value || 0) + (context.system.detalhes?.niveis?.secundario?.value || 0));

        try {
          const lvl = Number(nivelTotalDerivado) || 0;
          context.system.combate = context.system.combate || {};
          context.system.combate.dadosVida = context.system.combate.dadosVida || {};
          context.system.combate.dadosVida.max = Number(context.system.combate.dadosVida.max ?? lvl) || lvl;
          context.system.combate.dadosVida.value = Number(context.system.combate.dadosVida.value ?? context.system.combate.dadosVida.max) || context.system.combate.dadosVida.max;
          if (!context.system.combate.dadosVida.lado) {
            const cls = String(context.system.detalhes?.classe?.value ?? '').toLowerCase();
            if (cls.includes('lutador') || cls.includes('especialista em combate')) context.system.combate.dadosVida.lado = '1d10';
            else if (cls.includes('restringido')) context.system.combate.dadosVida.lado = '1d12';
            else context.system.combate.dadosVida.lado = '1d8';
          }

          context.system.combate.dadosEnergia = context.system.combate.dadosEnergia || {};
          const clsRaw = String(context.system.detalhes?.classe?.value ?? '');
          const clsNorm = clsRaw.toLowerCase().trim();

          if (clsNorm === 'restringido') {
            context.system.combate.dadosEnergia.max = 0;
            context.system.combate.dadosEnergia.value = 0;
            context.system.combate.dadosEnergia.lado = '';
          } else {
            context.system.combate.dadosEnergia.max = Number(context.system.combate.dadosEnergia.max ?? lvl) || lvl;
            context.system.combate.dadosEnergia.value = Number(context.system.combate.dadosEnergia.value ?? context.system.combate.dadosEnergia.max) || context.system.combate.dadosEnergia.max;
            if (!context.system.combate.dadosEnergia.lado) {
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

        const nivelCL = clamp05(context.system.aptidaoNiveis?.controleELeitura?.value);
        const nivelBAR = clamp05(context.system.aptidaoNiveis?.barreiras?.value);
        const nivelDOM = clamp05(context.system.aptidaoNiveis?.dominio?.value);
        const refinamento = (Number(nivelTotalDerivado) || 0) + nivelDOM;

        context.system.aptidaoDerivados = context.system.aptidaoDerivados ?? {};
        context.system.aptidaoDerivados.limiteGastoPE = { value: nivelCL, label: 'Limite de Gasto (PE)' };
        context.system.aptidaoDerivados.rdBarreira = { value: nivelBAR, label: 'RD Barreira' };
        context.system.aptidaoDerivados.refinamento = { value: refinamento, label: 'Refinamento' };

        const modelAptidaoTreino = game?.system?.model?.Actor?.[actorData.type]?.aptidaoTreino ?? {
          notas: { value: '', label: 'Treino (Interlúdio)' },
        };
        context.system.aptidaoTreino = foundry.utils.mergeObject(
          foundry.utils.deepClone(modelAptidaoTreino),
          context.system.aptidaoTreino ?? {},
          { inplace: false, overwrite: true }
        );

        if (context.system.pericias) {
          for (let [key, pericia] of Object.entries(context.system.pericias)) {
            const atributoKey = MAPA_ATRIBUTOS[key];

            if (!atributoKey) {
              pericia.atributoLabel = "";
              pericia.atributoMod = 0;
              continue;
            }

            if (context.system.atributos && context.system.atributos[atributoKey]) {
              const atributoObj = context.system.atributos[atributoKey];
              pericia.atributoLabel = (atributoObj.label || atributoKey).substring(0, 3).toUpperCase();
              pericia.atributoMod = atributoObj.mod ?? 0;
              continue;
            }

            if (context.system.recursos && context.system.recursos[atributoKey]) {
              const recursoObj = context.system.recursos[atributoKey];
              pericia.atributoLabel = (recursoObj.label || atributoKey).substring(0, 3).toUpperCase();
              pericia.atributoMod = recursoObj.value ?? recursoObj.percent ?? 0;
              continue;
            }

            if (context.system.combate && context.system.combate[atributoKey]) {
              const combateObj = context.system.combate[atributoKey];
              pericia.atributoLabel = (combateObj.label || atributoKey).substring(0, 3).toUpperCase();
              pericia.atributoMod = combateObj.value ?? 0;
              continue;
            }

            pericia.atributoLabel = atributoKey.substring(0, 3).toUpperCase();
            pericia.atributoMod = 0;
          }
        }

        context.niveisPericia = { 0: "—", 1: "Treinado", 2: "Mestre" };
    }

      await this._ensureUnarmedAttackItem();

      this._prepareItems(context);

      try {
        const attacks = (this.actor?.items?.contents ?? [])
          .filter(i => ['arma', 'tecnica'].includes(String(i.type)))
          .map(i => i.toObject(false));

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
        await this.actor.update(updateData);
      }
    } catch (e) {
      console.warn('Falha ao persistir Dados de Vida/Energia calculados:', e);
    }

    return context;
  }

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

      if (['item', 'arma', 'armadura'].includes(i.type)) {
          equipamentos.push(i);
      }
      else if (i.type === 'tecnica') {
          tecnicas.push(i);
      }
      else if (i.type === 'habilidade') {
        habilidades.push(i);
      }
      else if (i.type === 'aptidao') {
        aptidoes.push(i);
      }
    }

    context.equipamentos = equipamentos;
    context.tecnicas = tecnicas;
    context.aptidoes = aptidoes;
    context.habilidades = habilidades;

    for (const it of aptidoes) {
      const acao = String(it.system?.acao?.value ?? 'Passiva').trim().toLowerCase();
      if (!acao || acao === 'passiva') aptidoesPassivas.push(it);
      else aptidoesAtivas.push(it);
    }

    context.aptidoesAtivas = aptidoesAtivas;
    context.aptidoesPassivas = aptidoesPassivas;

    try {
      context.uniformItem = (Array.isArray(context.items) ? context.items.find(i => i.type === 'uniforme') : null) || null;
    } catch (e) {
      context.uniformItem = null;
    }
  }


  /** @override */
  async _onDrop(event) {
    const dropZone = event?.target?.closest?.('[data-aptidao-tipo]');
    this._dropAptidaoTipo = dropZone?.dataset?.aptidaoTipo ?? null;
    return super._onDrop(event);
  }

  /** @override */
  async _onDropItemCreate(itemData, event) {
    try {
      if (itemData?.type === 'aptidao' && this._dropAptidaoTipo) {
        itemData.system ??= {};
        itemData.system.acao ??= {};
        itemData.system.acao.value = (this._dropAptidaoTipo === 'passiva') ? 'Passiva' : 'Ativa';
      }

      if (false) {
        const descricao = String(itemData?.system?.descricao?.value ?? itemData?.system?.requisito?.value ?? '');
        const prereq = extrairPrereqsDaDescricao(descricao, null);
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
            console.warn('Token de pré-requisito não mapeado durante drop:', token);
          }
        }

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

    html.find('.roll-dice').click(async (event) => {
        event.preventDefault();
        const element = event.currentTarget;
        const formula = String(element.dataset.formula ?? '').trim();
        const flavor = String(element.dataset.flavor ?? '').trim();

        if (!formula) return;

        const flavorText = flavor.toLowerCase();
        const isVida = flavorText.includes('vida');
        const isEnergia = flavorText.includes('energia');

        if (isVida || isEnergia) {
          if (!this.isEditable) return ui.notifications.warn('Sem permissão para modificar este ator.');

          const combate = this.actor.system?.combate ?? {};
          const dadosKey = isVida ? 'dadosVida' : 'dadosEnergia';
          const recursosKey = isVida ? 'hp' : 'energia';
          const available = Number(combate?.[dadosKey]?.value ?? 0) || 0;
          const lado = String(combate?.[dadosKey]?.lado ?? formula).trim() || formula;
          if (available <= 0) return ui.notifications.warn('Nenhum Dado disponível para gastar.');

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

                const dIndex = lado.indexOf('d');
                const diePart = (dIndex >= 0) ? lado.slice(dIndex) : lado;
                const rollFormulaStr = `${n}${diePart}`;

                let roll;
                try {
                  roll = await rollFormula(rollFormulaStr, { actor: this.actor }, { asyncEval: true, toMessage: false, flavor: `Gasto de ${isVida ? 'DV' : 'DE'}` });
                } catch (err) {
                  console.warn('Erro ao rolar dados via rollFormula:', err);
                  return ui.notifications.error('Fórmula inválida.');
                }

                let attrKey = 'constituicao';
                if (isEnergia) {
                  const clsRaw = String(this.actor.system?.detalhes?.classe?.value ?? '');
                  const clsNorm = clsRaw.toLowerCase().trim();
                  const mapped = MAPA_DE_ATRIBUTOS[clsNorm];
                  if (typeof mapped === 'string' && mapped) attrKey = mapped;
                  else attrKey = 'inteligencia';
                }

                const attrMod = Number(this.actor.system?.atributos?.[attrKey]?.mod ?? 0) || 0;
                const diceTotal = Number(roll.total ?? 0) || 0;
                const recovered = diceTotal + (n * attrMod);

                const chatContent = `<div class="dice-recovery"><strong>${this.actor.name}</strong> gastou <b>${n}</b> ${isVida ? 'DV' : 'DE'} (${rollFormula}) → ` +
                  `<b>${diceTotal}</b> + ${n}×${attrMod} = <b>${recovered}</b> ${isVida ? 'PV' : 'PE'} recuperados.</div>`;
                await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: chatContent });

                const updates = {};
                const newAvailable = Math.max(0, available - n);
                updates[`system.combate.${dadosKey}.value`] = newAvailable;

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
          let roll;
          try {
            roll = await rollFormula(formula, { actor: this.actor }, { asyncEval: true, toMessage: false, flavor: `Rolou <b>${flavor}</b>` });
          } catch (err) {
            console.warn('Erro ao rolar dado:', { formula, err });
            ui?.notifications?.error?.('Fórmula inválida para rolagem.');
            return;
          }
          await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: `Rolou <b>${flavor}</b>` });
        }
    });

    html.find('.roll-initiative').click(this._onRollInitiative.bind(this));

    html.find('.pericia-label').click(this._onRollPericia.bind(this));

    html.on('click', '[data-action="aptidao-nivel-inc"]', this._onAptidaoNivelInc.bind(this));
    html.on('click', '[data-action="aptidao-nivel-dec"]', this._onAptidaoNivelDec.bind(this));
    html.on('click', '[data-action="create-walls"]', this._onCreateWallsClick.bind(this));
    html.on('click', '.aptidao-treino-add', this._onAptidaoTreinoAdd.bind(this));

    html.on('click', '[data-action="use-aptidao"]', this._onUseAptidaoItem.bind(this));
    html.on('click', '[data-action="show-aptidao-desc"]', this._onShowAptidaoDescription.bind(this));


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

    try {
      const handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    } catch (e) {
      console.warn('Falha ao registrar dragstart para itens:', e);
    }

    try {
      html.find('.uniform-slot').on('dragover', (ev) => {
        ev.preventDefault();
        ev.currentTarget.classList.add('drag-over');
      });
      html.find('.uniform-slot').on('dragleave', (ev) => {
        ev.currentTarget.classList.remove('drag-over');
      });
      html.find('.uniform-slot').on('drop', async (ev) => {
        ev.preventDefault();
        ev.currentTarget.classList.remove('drag-over');
        const dt = ev.originalEvent?.dataTransfer;
        if (!dt) return;
        let payload = dt.getData('application/json') || dt.getData('text/plain');
        try {
          if (payload) payload = JSON.parse(payload);
        } catch (e) { /* keep raw */ }

        try {
          if (payload && payload.type === 'Item' && payload.data) {
            await this.actor.createEmbeddedDocuments('Item', [payload.data]);
            this.render(false);
            return;
          }
          const uri = dt.getData('text/uri-list') || dt.getData('text/uri');
          if (uri) {
            try {
              const doc = await fromUuid(uri);
              if (doc && doc.toObject) {
                const data = doc.toObject(false);
                await this.actor.createEmbeddedDocuments('Item', [data]);
                this.render(false);
                return;
              }
            } catch (err) { /* ignore */ }
          }
        } catch (err) {
          console.warn('Falha ao processar drop no slot de uniforme:', err);
        }
      });
    } catch (e) { console.warn('Falha ao registrar drop para uniform-slot', e); }

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
    html.on('click', '.uniform-remove', async (ev) => {
      ev.stopPropagation();
      const $card = $(ev.currentTarget).closest('.uniform-card');
      const itemId = $card.data('itemId');
      if (!itemId) return;
      if (!this.actor.isOwner) return ui.notifications.warn('Sem permissão para remover este uniforme.');
      const item = this.actor.items.get(itemId);
      if (!item) return ui.notifications.warn('Item não encontrado.');

      new Dialog({
        title: 'Remover Uniforme',
        content: `<p>Remover <strong>${item.name}</strong> deste ator?</p>`,
        buttons: {
          yes: { label: 'Remover', callback: async () => {
            try {
              await this.actor.deleteEmbeddedDocuments('Item', [itemId]);
              this.render(false);
            } catch (err) {
              console.error('Falha ao remover uniforme:', err);
              ui.notifications.error('Falha ao remover uniforme. Veja o console.');
            }
          } },
          no: { label: 'Cancelar' }
        },
        default: 'no'
      }).render(true);
    });
    html.on('click', '.item-create', this._onItemCreate.bind(this));
    html.on('click', '.death-test-btn', this._onDeathTest.bind(this));
    html.on('click', '.death-reset-btn', this._onDeathReset.bind(this));
    html.on('click', '.death-pill', this._onToggleDeathMark.bind(this));

    // Ao marcar/desmarcar uma condição na lista, persistir e aplicar um ActiveEffect correspondente
    html.on('change', '.condition-list input[type=checkbox]', this._onToggleCondition.bind(this));

    try {
      this._updateHpVisualState(html);
    } catch (err) {
      console.warn('Falha ao aplicar estado visual de HP:', err);
    }

  }

  async _onRollInitiative(event) {
    event.preventDefault();
    if (!this.actor) return;

    if (!this.actor.isOwner) {
      return ui?.notifications?.warn?.('Sem permissão para rolar iniciativa deste ator.');
    }

    const actor = this.actor;

    // Preferir token controlado do ator; senão, um token ativo qualquer.
    let token = null;
    try {
      const controlled = canvas?.tokens?.controlled ?? [];
      token = controlled.find(t => t?.actor?.id === actor.id) ?? null;
    } catch (_) { /* ignore */ }

    if (!token) {
      try {
        const active = (typeof actor.getActiveTokens === 'function') ? actor.getActiveTokens(true, true) : [];
        token = (Array.isArray(active) && active.length) ? active[0] : null;
      } catch (_) { /* ignore */ }
    }

    const combat = game?.combat ?? null;
    const sameScene = !combat?.scene || !canvas?.scene || (combat.scene.id === canvas.scene.id);

    // Se existir combate ativo na cena, rolar iniciativa no combate.
    if (combat && sameScene) {
      try {
        const combatants = combat.combatants;
        let combatant = null;

        if (token) {
          combatant = combatants?.find?.(c => c?.actor?.id === actor.id && c?.tokenId === token.id) ?? null;
        }

        if (!combatant) {
          combatant = combatants?.find?.(c => c?.actor?.id === actor.id) ?? null;
        }

        if (!combatant) {
          const data = { actorId: actor.id };
          if (token) data.tokenId = token.id;

          if (typeof combat.createEmbeddedDocuments === 'function') {
            await combat.createEmbeddedDocuments('Combatant', [data]);
          } else if (typeof combat.createCombatants === 'function') {
            await combat.createCombatants([data]);
          }

          if (token) {
            combatant = combatants?.find?.(c => c?.actor?.id === actor.id && c?.tokenId === token.id) ?? null;
          }
          if (!combatant) {
            combatant = combatants?.find?.(c => c?.actor?.id === actor.id) ?? null;
          }
        }

        if (!combatant) {
          return ui?.notifications?.error?.('Não foi possível adicionar o ator ao combate para rolar iniciativa.');
        }

        await combat.rollInitiative([combatant.id]);
        return;
      } catch (e) {
        console.warn('Falha ao rolar iniciativa no combate; caindo para rolagem no chat.', e);
      }
    }

    // Fallback: rolar no chat (útil fora de combate ou se o combate não está na cena atual).
    const formula = String(CONFIG?.Combat?.initiative?.formula ?? '1d20 + @iniciativa');
    const rollData = actor.getRollData();
    rollData.actor = actor;

    try {
      await rollFormula(formula, rollData, {
        asyncEval: true,
        toMessage: true,
        flavor: `<b>Iniciativa</b> — ${actor.name}`,
      });
    } catch (err) {
      console.warn('Erro ao rolar iniciativa via rollFormula:', err);
      ui?.notifications?.error?.('Falha ao rolar iniciativa. Veja o console.');
    }
  }

  _updateHpVisualState(html) {
    const hpVal = Number(this.actor.system?.recursos?.hp?.value ?? 0) || 0;
    const hpMax = Number(this.actor.system?.recursos?.hp?.max ?? 0) || 0;
    const percent = hpMax > 0 ? Math.round((hpVal / hpMax) * 100) : (hpVal > 0 ? 100 : 0);
    const $root = this.element; 
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

  async _onToggleCondition(event) {
    event.preventDefault();
    const input = event.currentTarget;
    if (!input || !input.name) return;
    if (!this.actor) return;
    if (!this.actor.isOwner) return ui.notifications.warn('Sem permissão para modificar este ator.');

    const checked = !!input.checked;
    const name = input.name; // ex: system.condicoes.fisicas.condenado
    try {
      // Persistir o estado do checkbox no actor
      await this.actor.update({ [name]: checked });
    } catch (err) {
      console.warn('Falha ao atualizar condição no actor data:', err);
      return ui.notifications.error('Falha ao salvar condição. Veja o console.');
    }

    // Mapear severidade para cada condição (baseado nas regras fornecidas)
    const severityMap = {
      'condicoes.fisicas.condenado': 'media',
      'condicoes.fisicas.engasgando': 'media',
      'condicoes.fisicas.enjoado': 'media',
      'condicoes.fisicas.envenenado': 'media',
      'condicoes.fisicas.sangramento': 'variavel',
      'condicoes.fisicas.sofrendo': 'fraca',
      'condicoes.fisicas.paralisado': 'extrema',
      'condicoes.fisicas.fragilizado': 'forte',

      'condicoes.mentais.abalado': 'fraca',
      'condicoes.mentais.amedrontado': 'media',
      'condicoes.mentais.aterrorizado': 'forte',
      'condicoes.mentais.confuso': 'media',
      'condicoes.mentais.enfeitiacado': 'media',
      'condicoes.mentais.indefeso': 'especial',
      'condicoes.mentais.exposto': 'forte',

      'condicoes.sensoriais.cego': 'forte',
      'condicoes.sensoriais.desorientado': 'fraca',
      'condicoes.sensoriais.desprevenido': 'fraca',
      'condicoes.sensoriais.surdo': 'media',
      'condicoes.sensoriais.surpreso': 'especial',
      'condicoes.sensoriais.inconsciente': 'extrema',

      'condicoes.movimento.agarrado': 'media',
      'condicoes.movimento.caido': 'fraca',
      'condicoes.movimento.enredado': 'media',
      'condicoes.movimento.imovel': 'forte',
      'condicoes.movimento.lento': 'media',
      'condicoes.movimento.atordoado': 'extrema'
    };

    const key = name.replace(/^system\./, '');
    const severity = severityMap[key] || 'desconhecida';

    // Procurar ActiveEffect já existente para esta condição (procura pela flag customizada)
    const existing = this.actor.effects.find(e => {
      try { return e?.flags?.['feiticeiros-e-maldicoes']?.condition === key; } catch (e) { return false; }
    });

    if (checked) {
      if (existing) return; // já aplicado
      const label = `Condição: ${key.split('.').pop()} (${severity})`;
      const changes = [];

      const pericias = Object.keys(this.actor.system?.pericias || {});
      const ataques = Object.keys(this.actor.system?.ataques || {});
      const salvaguardas = Object.keys(this.actor.system?.salvaguardas || {});

      // Helpers
      const addPericias = (n) => {
        for (const p of pericias) changes.push({ key: `system.pericias.${p}.value`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 });
      };
      const addAtaques = (n) => {
        for (const a of ataques) changes.push({ key: `system.ataques.${a}.value`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 });
      };
      const addSalv = (n) => {
        for (const s of salvaguardas) changes.push({ key: `system.salvaguardas.${s}.value`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(n), priority: 20 });
      };

      // Mapear efeitos mecânicos básicos por condição
      if (key === 'condicoes.sensoriais.desprevenido') {
        changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-3), priority: 20 });
        if (salvaguardas.includes('reflexos')) changes.push({ key: 'system.salvaguardas.reflexos.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-3), priority: 20 });
      }
      else if (key === 'condicoes.movimento.caido') {
        changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-3), priority: 20 });
        changes.push({ key: 'system.combate.movimento.value', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: String(4.5), priority: 20 });
      }
      else if (key === 'condicoes.movimento.enredado') {
        changes.push({ key: 'system.combate.movimento.value', mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: '0.5', priority: 20 });
        changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-2), priority: 20 });
        addPericias(-2); addAtaques(-2);
      }
      else if (key === 'condicoes.movimento.imovel') {
        changes.push({ key: 'system.combate.movimento.value', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: String(0), priority: 20 });
      }
      else if (key === 'condicoes.movimento.lento') {
        changes.push({ key: 'system.combate.movimento.value', mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: '0.5', priority: 20 });
      }
      else if (key === 'condicoes.fisicas.envenenado') {
        addPericias(-2); addSalv(-2); addAtaques(-2);
      }
      else if (key === 'condicoes.fisicas.paralisado') {
        changes.push({ key: 'system.combate.defesa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-10), priority: 20 });
        changes.push({ key: 'system.combate.movimento.value', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: String(0), priority: 20 });
      }
      else if (key === 'condicoes.sensoriais.surdo') {
        changes.push({ key: 'system.combate.iniciativa.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-5), priority: 20 });
      }
      else if (key === 'condicoes.sensoriais.cego') {
        if (pericias.includes('percepcao')) changes.push({ key: 'system.pericias.percepcao.value', mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: String(-5), priority: 20 });
      }
      else if (key === 'condicoes.fisicas.fragilizado') {
        changes.push({ key: 'system.combate.rd.value', mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: String(0), priority: 20 });
      }
      else if (key === 'condicoes.mentais.abalado') {
        addPericias(-1); addAtaques(-1);
      }
      else if (key === 'condicoes.mentais.amedrontado') {
        addPericias(-3); addAtaques(-3);
      }

      const effectData = {
        label,
        icon: 'icons/svg/downgrade.svg',
        origin: this.actor.uuid || this.actor.id,
        disabled: false,
        changes: changes.length ? changes : undefined,
        flags: {
          'feiticeiros-e-maldicoes': {
            condition: key,
            severity
          }
        }
      };
      try {
        const created = await this.actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
        console.log('CONDITION EFFECT CREATED', { key, severity, changes, created });
        try { this.render(false); } catch (e) { /* non-fatal */ }
        try { console.log('Actor effects count after create:', (this.actor.effects?.size ?? this.actor.effects?.length ?? null)); } catch (e) {}
        try { console.log('Find created effect on actor by flag:', this.actor.effects?.find?.(e => e?.flags?.['feiticeiros-e-maldicoes']?.condition === key)); } catch (e) {}
      } catch (err) {
        console.error('Falha ao criar ActiveEffect de condição:', err);
        return ui.notifications.error('Falha ao aplicar condição. Veja o console.');
      }
    } else {
      if (!existing) return;
      try {
        const removed = await this.actor.deleteEmbeddedDocuments('ActiveEffect', [existing.id]);
        console.log('CONDITION EFFECT REMOVED', { key, existing, removed });
        try { this.render(false); } catch (e) { /* non-fatal */ }
        try { console.log('Actor effects count after remove:', (this.actor.effects?.size ?? this.actor.effects?.length ?? null)); } catch (e) {}
      } catch (err) {
        console.error('Falha ao remover ActiveEffect de condição:', err);
        return ui.notifications.error('Falha ao remover condição. Veja o console.');
      }
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

    if (aptidaoKey === 'dominio.expansaoDeDominioIncompleta'
      || aptidaoKey === 'dominio.expansaoDeDominioCompleta'
      || aptidaoKey === 'dominio.acertoGarantido') {

      const custo = (aptidaoKey === 'dominio.expansaoDeDominioIncompleta')
        ? 15
        : (aptidaoKey === 'dominio.expansaoDeDominioCompleta')
          ? 20
          : 25;

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

    const custoPE = Number(item.system?.custo?.value ?? 0) || 0;
    let actualCost = custoPE;
    try {
      const condCondenado = Boolean(this.actor.system?.condicoes?.fisicas?.condenado);
      if (condCondenado && actualCost > 0) actualCost = actualCost + 1; // Condenado: +1 PE em todas as habilidades
    } catch (e) { /* ignore */ }

    if (actualCost > 0) {
      const atual = Number(this.actor.system?.recursos?.energia?.value ?? 0) || 0;
      if (atual < actualCost) {
        ui.notifications.warn('PE insuficiente para usar esta aptidão.');
        return;
      }
      await this.actor.update({ 'system.recursos.energia.value': Math.max(0, atual - actualCost) });
    }

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

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<b>${item.name}</b> foi usada.${custoPE ? ` (Custo: ${custoPE} PE)` : ''}`,
    });

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
        if (!val) continue;
        const aptidaoKey = `${cat}.${key}`;
        const exists = this.actor.items.find(i => i.type === 'aptidao' && i.getFlag(systemId, 'aptidaoKey') === aptidaoKey);
        if (exists) continue;
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

  _applyActiveEffectsToSystem(system) {
    if (!system || !this.actor) return system;
    try {
      const effects = (this.actor.effects || []).filter(e => !e.disabled);
      for (const eff of effects) {
        const changes = (eff.changes && eff.changes.length) ? eff.changes : (eff.toObject().changes || []);
        for (const ch of changes) {
          try {
            const mode = Number(ch.mode);
            const key = String(ch.key || '').trim();
            const raw = ch.value ?? '';
            if (!key) continue;
            // Only handle keys under system.* for templates
            if (!key.startsWith('system.')) continue;
            const path = key.replace(/^system\./, '').split('.');
            // Resolve reference to target container and property
            let target = system;
            for (let i = 0; i < path.length - 1; i++) {
              const p = path[i];
              if (typeof target[p] === 'undefined') { target[p] = {}; }
              target = target[p];
            }
            const last = path[path.length - 1];
            // Current value (coerce numeric when possible)
            const curVal = target[last];
            const curNum = (typeof curVal === 'number') ? curVal : (typeof curVal === 'string' && !Number.isNaN(Number(curVal)) ? Number(curVal) : null);
            const delta = (raw === null || raw === undefined) ? 0 : (Number.isNaN(Number(raw)) ? raw : Number(raw));

            if (mode === CONST.ACTIVE_EFFECT_MODES.ADD) {
              if (typeof curNum === 'number' && typeof delta === 'number') target[last] = curNum + delta;
            } else if (mode === CONST.ACTIVE_EFFECT_MODES.MULTIPLY) {
              const mul = Number(delta) || 1;
              if (typeof curNum === 'number') target[last] = curNum * mul;
            } else if (mode === CONST.ACTIVE_EFFECT_MODES.OVERRIDE) {
              // override with given value (try numeric)
              target[last] = (typeof delta === 'number') ? delta : raw;
            } else if (mode === CONST.ACTIVE_EFFECT_MODES.UPGRADE) {
              // treat as max(current, delta) when numeric
              if (typeof curNum === 'number' && typeof delta === 'number') target[last] = Math.max(curNum, delta);
            } else {
              // unsupported modes are ignored for now
            }
          } catch (e) { /* ignore single change errors */ }
        }
      }
    } catch (e) {
      console.warn('Erro ao aplicar efeitos ativos ao system:', e);
    }
    return system;
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

    const center = token.center;
    const grid = canvas.grid.size;
    const radius = grid; 
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
      const system = this.actor.system;
      const usoParedesResistentes = !!system?.aptidoes?.barreiras?.paredesResistentes;

      const barNivel = Number(system?.aptidaoNiveis?.barreiras?.value ?? 0) || 0;
      const charNivel = Number(system?.detalhes?.nivel?.value ?? 0) || 0;

      const pvPadrao = 5 + (barNivel * Math.floor(charNivel / 2));
      const pvResist = 10 + (barNivel * charNivel);
      const pvUsado = usoParedesResistentes ? pvResist : pvPadrao;

      const created = (canvas.scene?.createEmbeddedDocuments)
        ? await canvas.scene.createEmbeddedDocuments('Wall', walls.map(w => ({ c: w.c, flags: { 'feiticeiros-e-maldicoes': { pv: pvUsado } } })))
        : (canvas.scene?.createEmbeddedEntity)
          ? await canvas.scene.createEmbeddedEntity('Wall', walls.map(w => ({ c: w.c, flags: { 'feiticeiros-e-maldicoes': { pv: pvUsado } } })))
          : null;

      if (!created || created.length === 0) throw new Error('Nenhuma wall criada');

      const resumo = created.map(w => ({ id: w.id, pv: pvUsado }));
      await this.actor.setFlag('feiticeiros-e-maldicoes', 'lastBarreiras', resumo);

      ui.notifications.info(`Criadas ${created.length} paredes (PV ${pvUsado}).`);
    } catch (err) {
      console.error('Erro ao criar paredes:', err);
      ui.notifications.error('Falha ao criar paredes no mapa. Veja o console.');
    }
  }

  async _onRollPericia(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const key = dataset.key;   
    const group = dataset.group; 

    return await this._rollPericiaByKey({ key, group });
  }

  async _rollPericiaByKey({ key, group = 'pericias' } = {}) {
    if (!key) return;

    const system = this.actor.system;
    
    const pericia = system?.[group]?.[key];
    if (!pericia) {
      ui.notifications.warn('Perícia inválida.');
      return;
    }
    const grauTreino = pericia.value; // 0, 1 ou 2

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

    const baseTreino = system.detalhes?.treinamento?.value ?? 0;
    let treinoBonus = 0;
    if (grauTreino === 1) {
      treinoBonus = baseTreino;
    } else if (grauTreino === 2) {
      treinoBonus = Math.floor(baseTreino * 1.5);
    }

    let totalBonus = atributoMod + treinoBonus;

    let dieTerm = '1d20';
    try {
      const forceCrit = await this.actor.getFlag(game.system.id, 'ultimaAcao.critico');
      if (forceCrit) {
        dieTerm = '20';
        try { await this.actor.unsetFlag(game.system.id, 'ultimaAcao.critico'); } catch (_) {}
      }
    } catch (_) {}

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

    let roll;
    try {
      roll = await rollFormula(formulaString, { actor: this.actor }, { asyncEval: true, toMessage: false });
    } catch (err) {
      console.warn('Erro ao rolar teste de perícia via rollFormula:', err);
      ui?.notifications?.error?.('Fórmula inválida para perícia.');
      return null;
    }

    const sign = (totalBonus >= 0) ? `+${totalBonus}` : `${totalBonus}`;

    let dieFace = null;
    if (/^\s*20\s*$/.test(String(dieTerm))) {
      dieFace = 20;
    } else {
      const firstDie = (roll.dice && roll.dice.length) ? roll.dice[0] : null;
      if (firstDie && firstDie.results && firstDie.results.length) dieFace = firstDie.results[0].result;
    }

    const totalRoll = Number(roll.total ?? 0) || 0;
    const parts = ['1d20'];
    parts.push((atributoMod >= 0 ? '+ ' : '- ') + Math.abs(Number(atributoMod || 0)));
    if (metadeNivel > 0) parts.push('+ ' + metadeNivel);
    if (treinoBonus > 0) parts.push('+ ' + treinoBonus);
    const formulaShort = parts.join(' ');

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

        if (d20Face === 20) {
          await this.actor.setFlag(game.system.id, 'kokusen.pendingDoubleDamage', true);

          try {
            const rollD6 = await rollFormula('1d6', { actor: this.actor }, { asyncEval: true, toMessage: false });
            const face = Number(rollD6.total || 0);

            let recoveredHP = 0;
            let recoveredEnergy = 0;

            const rollDie = async (lado) => {
              try {
                const r = await rollFormula(String(lado || '1d8'), { actor: this.actor }, { asyncEval: true, toMessage: false });
                return Number(r.total || 0);
              } catch (e) { return 0; }
            };

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

  async _onAptidaoClick(event) {
    event.preventDefault();

    const label = event.currentTarget;
    const $label = $(label);
    const key = $label.data('key');
    const cat = $label.data('cat');
    const name = $label.find('.aptidoes-label').text().trim() || key;

    const current = foundry.utils.getProperty(this.actor.system, `aptidoes.${cat}.${key}`) ?? false;
    const action = current ? 'Remover' : 'Ativar';
    const aptidaoKey = `${cat}.${key}`;
    const existingItem = this.actor.items.find(i => i.type === 'aptidao' && i.getFlag(game?.system?.id ?? 'feiticeiros-e-maldicoes', 'aptidaoKey') === aptidaoKey);

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

            if (next && false) {
              const nivelTotalDerivado = this.actor.system.detalhes?.nivel?.value ??
                ((this.actor.system.detalhes?.niveis?.principal?.value || 0) + (this.actor.system.detalhes?.niveis?.secundario?.value || 0));

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

                  const resolvedTec = _resolverTecnicaPorLabel(token, this.actor);
                  if (resolvedTec) {
                    const tItem = this.actor.items.find(i => i.id === resolvedTec.itemId);
                    if (!tItem) {
                      ui.notifications.warn(`Pré-requisito não atendido: Técnica ${resolvedTec.label}.`);
                      return;
                    }
                    const ok = await _verificarPrereqsTecnica(tItem, this.actor, new Set());
                    if (!ok) {
                      ui.notifications.warn(`Pré-requisito não atendido: Técnica ${resolvedTec.label} (pré-requisitos não satisfeitos).`);
                      return;
                    }
                    continue;
                  }

                  console.warn('Pré-requisito não mapeado no catálogo nem como técnica:', token, 'para', `${cat}.${key}`);
                  continue;
                }
              }

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
              const chosenAction = inferirTipoAcao(specificDesc ?? '');
              let chosenCost = inferirCustoPE(specificDesc ?? '');

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

  async _syncAptidaoEmbeddedItem({ cat, key, name, desc, active, acao, custo }) {
    const systemId = game?.system?.id ?? 'feiticeiros-e-maldicoes';

    const supportedTypes = game?.system?.documentTypes?.Item;
    const hasAptidaoType = (() => {
      if (!supportedTypes) return false;
      if (Array.isArray(supportedTypes)) return supportedTypes.includes('aptidao');
      if (supportedTypes instanceof Set) return supportedTypes.has('aptidao');
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
    const inferredAction = inferirTipoAcao(desc ?? '');
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

  async _openOrigemMaldicaoDialog() {
    const currentRace = this.actor.system.detalhes?.racaMaldicao?.value ?? "";
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

  async _onDeathTest(event) {
    event?.preventDefault();
    if (!this.isEditable) return;
    const hp = Number(this.actor.system?.recursos?.hp?.value ?? 0) || 0;
    if (hp > 0) return ui.notifications.warn('Testes de morte só podem ser feitos com 0 de HP.');
    const conMod = Number(this.actor.system?.atributos?.constituicao?.mod ?? 0) || 0;
    const formula = `1d20 + ${conMod}`;
    let roll;
    try {
      roll = await rollFormula(formula, { actor: this.actor }, { asyncEval: true, toMessage: false, flavor: `<b>Teste de Morte</b>` });
    } catch (err) {
      console.warn('Erro ao rolar teste de morte via rollFormula:', err);
      ui?.notifications?.error?.('Fórmula inválida para Teste de Morte.');
      return;
    }
    // Post result to chat
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this.actor }), flavor: `<b>Teste de Morte</b>` });

    const total = Number(roll.total ?? 0);
    const success = total >= 10;

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

    if (Object.keys(update).length) await this.actor.update(update);

    const successes = successPaths
      .map(p => Boolean(foundry.utils.getProperty(this.actor, p)))
      .filter(Boolean).length;
    if (successes >= 3) {
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

    const failures = ['system.combate.morte.f1','system.combate.morte.f2','system.combate.morte.f3']
      .map(p => Boolean(foundry.utils.getProperty(this.actor, p)))
      .filter(Boolean).length;
    if (failures >= 3) {
      this._openLastActionDialog();
    }
  }

  async _openLastActionDialog() {
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

              await this.actor.setFlag(game.system.id, 'ultimaAcao.critico', true);

              await this._rollPericiaByKey({ key: String(selectedKey), group: 'ataques' });

              try { await this.actor.unsetFlag(game.system.id, 'ultimaAcao.critico'); } catch (_) {}
            } catch (err) {
              console.warn('Erro ao aplicar flag de último-crit:', err);
            }
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

  async _onLevelUp(event) {
    event.preventDefault();
    const system = this.actor.system;
    const XP_TABELA = [0, 1000, 3000, 6000, 10000, 15000, 21000, 28000, 36000, 45000, 55000, 66000, 78000, 91000, 105000, 120000, 136000, 153000, 171000, 190000];

    const niveis = system.detalhes.niveis || { principal: { value: 0 }, secundario: { value: 0 } };
    const nivelPrincipal = niveis.principal?.value || 0;
    const nivelSecundario = niveis.secundario?.value || 0;
    const nivelAtualTotal = nivelPrincipal + nivelSecundario;

    const classePrincipalNome = system.detalhes.classe?.value || "Classe Principal";
    const multiclasseNome = system.detalhes.multiclasse?.value || "Nenhuma";
    const temMulticlasse = multiclasseNome !== "Nenhuma";
    const xpAtual = system.detalhes.xp?.value || 0;

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

    try {
      new LevelUpDialog(this.actor).render(true);
    } catch (err) {
      console.error('Falha ao abrir LevelUpDialog:', err);
      ui.notifications.error('Erro ao abrir diálogo de subida de nível. Veja o console.');
    }
  }
}