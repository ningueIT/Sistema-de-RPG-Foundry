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

export async function seedAptidoesCompendium({ notify = true, forceUpdate = true } = {}) {
  const systemId = game.system.id;

  if (!game.user.isGM) {
    if (notify) ui.notifications.warn('Apenas o GM pode popular o Compendium de Aptidões.');
    return { created: 0, updated: 0, reason: 'not-gm' };
  }

  // 1. Encontrar o Compendium
  const preferred = game.packs.get(`${systemId}.aptidoes`);
  const labelCandidates = game.pack
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
    if (notify) ui.notifications.error(`Compendium não encontrado.`);
    return { created: 0, updated: 0, reason: 'pack-missing' };
  }

  if (pack.locked) {
    if (notify) ui.notifications.warn(`Destrave o Compendium "${pack.metadata?.label}" para atualizar.`);
    return { created: 0, updated: 0, reason: 'pack-locked' };
  }

  // 2. Gerenciar Pastas
  const folderByName = new Map();
  for (const f of pack.folders?.contents ?? []) {
    if (f?.name) folderByName.set(f.name, f);
  }

  async function getOrCreateFolder(folderName) {
    if (!folderName) return null;
    const existing = folderByName.get(folderName);
    if (existing) return existing;

    const [created] = await Folder.createDocuments([{ name: folderName, type: 'Item', sorting: 'a' }], { pack: pack.collection });
    if (created) folderByName.set(folderName, created);
    return created ?? null;
  }

  // 3. Carregar documentos existentes
  const existingDocs = await pack.getDocuments();
  
  const docsToCreate = [];
  const updates = [];
  let processedCount = 0;

  for (const [cat, bloco] of Object.entries(APTIDOES_CATALOGO ?? {})) {
    const folderName = bloco?.titulo ?? cat;
    const folder = await getOrCreateFolder(folderName);

    for (const entry of bloco?.entradas ?? []) {
      const keyFull = `${cat}.${entry.key}`;
      const name = entry.label;
      if (!name) continue;

      // Dados atualizados do código
      const descr = APTIDOES_DESCRICOES?.[keyFull] ?? entry.description ?? '';
      const acao = inferirTipoAcao(descr) ?? 'Passiva';
      const custo = inferirCustoPE(descr);
      const prereq = extrairPrereqsDaDescricao(descr, cat);

      const systemData = {
        fonte: { value: '' },
        descricao: { value: descr }, // Aqui está a atualização do texto
        custo: { value: Number.isFinite(custo) ? custo : 0, label: 'Custo (PE)' },
        acao: { value: acao, label: 'Ação' },
        requisito: { value: _buildRequisitoText(prereq), label: 'Requisito' }
      };

      // Tenta encontrar item existente por Key ou Nome
      const existingItem = existingDocs.find(d => 
        d.getFlag(systemId, 'aptidaoKey') === keyFull || d.name === name
      );

      if (existingItem) {
        // Se forçar update, empurra os dados novos para o item antigo
        if (forceUpdate) {
          updates.push({
            _id: existingItem.id,
            system: systemData,
            [`flags.${systemId}.aptidaoKey`]: keyFull // Garante que a flag esteja lá
          });
        }
      } else {
        // Cria novo
        docsToCreate.push({
          name,
          type: 'aptidao',
          img: 'icons/svg/aura.svg', // Pode mudar para um ícone genérico se quiser
          folder: folder?.id,
          system: systemData,
          flags: { [systemId]: { aptidaoKey: keyFull } }
        });
      }
      processedCount++;
    }
  }

  // 4. Executar operações no Banco de Dados
  if (updates.length > 0) {
    console.log(`Atualizando ${updates.length} aptidões existentes...`);
    await Item.updateDocuments(updates, { pack: pack.collection });
  }

  if (docsToCreate.length > 0) {
    console.log(`Criando ${docsToCreate.length} novas aptidões...`);
    await Item.createDocuments(docsToCreate, { pack: pack.collection });
  }

  if (notify) {
    ui.notifications.info(`Sincronização concluída: ${docsToCreate.length} criados, ${updates.length} atualizados.`);
  }

  return { created: docsToCreate.length, updated: updates.length, reason: 'ok' };
}