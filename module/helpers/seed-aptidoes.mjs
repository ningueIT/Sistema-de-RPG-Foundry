import { APTIDOES_CATALOGO, APTIDOES_DESCRICOES } from '../sheets/actor-sheet/aptidoes-data.mjs';
import { extrairPrereqsDaDescricao, inferirCustoPE, inferirTipoAcao } from '../sheets/actor-sheet/aptidoes-utils.mjs';

function _buildRequisitoText(prereq) {
  if (!prereq) return '';
  const parts = [];
  if (Number.isFinite(prereq.nivelPersonagemMin)) parts.push(`Nível ${prereq.nivelPersonagemMin}`);

  const attrs = prereq.atributosMin ?? {};
  for (const [k, v] of Object.entries(attrs)) {
    if (Number.isFinite(v)) parts.push(`${k} ${v}`);
  }

  if (prereq.aptidaoCampo && Number.isFinite(prereq.aptidaoMin)) {
    parts.push(`${prereq.aptidaoCampo} Nível ${prereq.aptidaoMin}`);
  }

  return parts.join(' | ');
}

/**
 * Popula o Compendium `feiticeiros-e-maldicoes.aptidoes` com base no catálogo do sistema.
 * - Só cria o que estiver faltando
 * - Marca cada item com flag `flags.<systemId>.aptidaoKey = "cat.key"`
 */
export async function seedAptidoesCompendium({ notify = true } = {}) {
  const systemId = game.system.id;

  if (!game.user.isGM) {
    if (notify) ui.notifications.warn('Apenas o GM pode popular o Compendium de Aptidões.');
    return { created: 0, skipped: 0, reason: 'not-gm' };
  }

  // Resolver o compendium alvo.
  // 1) Tenta pack do sistema (<systemId>.aptidoes)
  // 2) Cai para um compendium existente no world com label "Aptidão/Aptidões" (comum em dev local)
  const preferred = game.packs.get(`${systemId}.aptidoes`);

  const labelCandidates = game.packs
    .filter((p) => p.metadata?.type === 'Item')
    .filter((p) => {
      const label = String(p.metadata?.label ?? '');
      return ['Aptidões', 'Aptidão', 'Aptidoes', 'Aptidao'].includes(label);
    });

  const pack =
    preferred ||
    labelCandidates.find((p) => p.metadata?.package === systemId) ||
    labelCandidates.find((p) => p.metadata?.package === 'world') ||
    labelCandidates[0];
  if (!pack) {
    if (notify) {
      ui.notifications.error(
        `Compendium não encontrado. Procurei por "${systemId}.aptidoes" e por um pack Item com label Aptidão/Aptidões.`
      );
    }
    return { created: 0, skipped: 0, reason: 'pack-missing' };
  }

  if (pack.locked) {
    if (notify) ui.notifications.warn(`Destrave o Compendium "${pack.metadata?.label ?? 'Aptidões'}" (cadeado) e recarregue.`);
    return { created: 0, skipped: 0, reason: 'pack-locked' };
  }

  // Pastas (folders) dentro do compendium para organizar por categoria.
  const folderByName = new Map();
  for (const f of pack.folders?.contents ?? []) {
    if (f?.name) folderByName.set(f.name, f);
  }

  async function getOrCreateFolder(folderName) {
    if (!folderName) return null;
    const existing = folderByName.get(folderName);
    if (existing) return existing;

    const [created] = await Folder.createDocuments(
      [
        {
          name: folderName,
          type: 'Item',
          sorting: 'a'
        }
      ],
      { pack: pack.collection }
    );
    if (created) folderByName.set(folderName, created);
    return created ?? null;
  }

  // Carrega docs existentes para evitar duplicar por chave estável.
  const existingDocs = await pack.getDocuments();
  const existingKeys = new Set(
    existingDocs
      .map((d) => d.getFlag(systemId, 'aptidaoKey'))
      .filter(Boolean)
  );

  // Fallback: se houver itens antigos sem flag, evita duplicar por nome.
  const existingNames = new Set(existingDocs.map((d) => d.name));

  const docsToCreate = [];
  let skipped = 0;

  for (const [cat, bloco] of Object.entries(APTIDOES_CATALOGO ?? {})) {
    const folderName = bloco?.titulo ?? cat;
    const folder = await getOrCreateFolder(folderName);

    for (const entry of bloco?.entradas ?? []) {
      const keyFull = `${cat}.${entry.key}`;
      const name = entry.label;
      if (!name) {
        skipped++;
        continue;
      }

      if (existingKeys.has(keyFull) || existingNames.has(name)) {
        skipped++;
        continue;
      }

      const descr = APTIDOES_DESCRICOES?.[keyFull] ?? entry.description ?? '';
      const acao = inferirTipoAcao(descr) ?? 'Passiva';
      const custo = inferirCustoPE(descr);
      const prereq = extrairPrereqsDaDescricao(descr, cat);

      docsToCreate.push({
        name,
        type: 'aptidao',
        img: 'icons/svg/aura.svg',
        folder: folder?.id,
        system: {
          // Você pediu pra não “forçar” fonte: deixa em branco.
          fonte: { value: '' },
          descricao: { value: descr },
          custo: { value: Number.isFinite(custo) ? custo : 0, label: 'Custo (PE)' },
          acao: { value: acao, label: 'Ação' },
          requisito: { value: _buildRequisitoText(prereq), label: 'Requisito' }
        },
        flags: {
          [systemId]: {
            aptidaoKey: keyFull
          }
        }
      });
    }
  }

  if (!docsToCreate.length) {
    if (notify) ui.notifications.info('Compendium de Aptidões já está populado (nenhuma nova entrada).');
    return { created: 0, skipped, reason: 'nothing-to-do' };
  }

  await Item.createDocuments(docsToCreate, { pack: pack.collection });

  if (notify) ui.notifications.info(`Criadas ${docsToCreate.length} Aptidões no Compendium.`);
  return { created: docsToCreate.length, skipped, reason: 'ok' };
}
