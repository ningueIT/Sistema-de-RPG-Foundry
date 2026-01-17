export async function migratePacksDocs() {
  const prefix = '/systems/feiticeiros-e-maldicoes/';
  const isTarget = (p = '') => p && p.startsWith('icons/') && (p.includes('/weapons/') || p.includes('/equipment/') || p.includes('/tools/'));
  const result = { updated: [], failed: [] };

  for (const pack of game.packs) {
    try {
      if (pack.metadata?.type !== 'Item') continue;
      await pack.getIndex();
      const docs = await pack.getDocuments();
      for (const doc of docs) {
        const img = doc.img || '';
        if (isTarget(img) && img.toLowerCase().endsWith('.webp')) {
          const newImg = (prefix + img).replace(/\.webp$/i, '.svg');
          try {
            if (typeof doc.update === 'function') {
              await doc.update({ img: newImg });
              result.updated.push({ pack: pack.collection, name: doc.name, from: img, to: newImg });
            } else {
              result.failed.push({ pack: pack.collection, name: doc.name, reason: 'doc.update not available' });
            }
          } catch (e) {
            result.failed.push({ pack: pack.collection, name: doc.name, reason: e?.message ?? String(e) });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to process pack', pack.collection, e);
      result.failed.push({ pack: pack.collection, reason: e?.message ?? String(e) });
    }
  }

  console.log('Pack docs migration result', result);
  ui.notifications.info(`Pack docs migration: ${result.updated.length} updated, ${result.failed.length} failed.`);
  return result;
}

try { if (typeof window !== 'undefined') window.PackIconMigrator = { migratePacksDocs }; } catch (e) {}
