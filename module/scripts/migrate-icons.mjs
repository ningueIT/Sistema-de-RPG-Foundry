export async function migrateIcons() {
  const prefix = '/systems/feiticeiros-e-maldicoes/';
  const isTarget = (p = '') => p.startsWith('icons/') && (p.includes('/weapons/') || p.includes('/equipment/') || p.includes('/tools/'));
  const changed = { world: [], packs: [], packsManual: [] };

  // Update world Items
  for (const item of (game.items?.contents ?? [])) {
    const img = item.img || '';
    if (isTarget(img) && img.toLowerCase().endsWith('.webp')) {
      const newImg = (prefix + img).replace(/\.webp$/i, '.svg');
      try {
        await item.update({ img: newImg });
        changed.world.push({ name: item.name, from: img, to: newImg });
      } catch (e) {
        console.error('Falha ao atualizar item', item.name, e);
      }
    }
  }

  // Update compendium packs (Item packs only)
  for (const pack of game.packs ?? []) {
    try {
      if (pack.metadata?.type !== 'Item') continue;
      await pack.getIndex();
      const docs = await pack.getDocuments();
      const updates = [];
      for (const doc of docs) {
        const img = doc.img || '';
        if (isTarget(img) && img.toLowerCase().endsWith('.webp')) {
          const newImg = (prefix + img).replace(/\.webp$/i, '.svg');
          updates.push({ _id: doc.id, img: newImg });
          changed.packs.push({ pack: pack.collection, name: doc.name, from: img, to: newImg });
        }
      }
      if (updates.length) {
        if (typeof pack.updateDocuments === 'function') {
          await pack.updateDocuments(updates);
        } else {
          // Fallback: muitas instalações de Foundry/pack wrappers não expõem updateDocuments.
          // Registra para intervenção manual em vez de tentar operação insegura.
          changed.packsManual.push({ pack: pack.collection, updates });
          console.warn('Pack não suporta updateDocuments, mudanças registradas para revisão manual:', pack.collection);
        }
      }
    } catch (e) {
      console.error('Falha ao processar pack', pack.collection, e);
    }
  }

  console.log('Migração de ícones concluída', changed);
  ui.notifications.info('Migração de ícones concluída. Veja console para detalhes.');
  return changed;
}

// Exponha a função para execução rápida no console
try { if (typeof window !== 'undefined') window.MigrateIcons = { migrateIcons }; } catch (e) {}
