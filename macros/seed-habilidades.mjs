/**
 * Script para popular o Compêndio de Habilidades Amaldiçoadas (Habilidades de Classe)
 * Organiza por Classe e Nível.
 */

export const HABILIDADES_DATA = [
  // --- LUTADOR ---
  { name: "Corpo Treinado", nivel: 1, categoria: "Lutador", description: "Você treinou o seu corpo para que ele seja sua própria arma. \n• Ataque desarmado como ação bônus ao atacar com corpo ou arma marcial.\n• Dano desarmado 1d8 (aumenta em níveis 5, 9, 13, 17).\n• Pode usar Força ou Destreza para ataques desarmados/marciais.", system: { custo: 0, acao: "Passiva", requisito: "Nível 1" } },
  { name: "Empolgação", nivel: 1, categoria: "Lutador", description: "Começa combate com Nível 1. Acertar ataque/manobra sobe nível (máx 5). Errar turno desce nível. Permite manobras especiais usando Dado de Empolgação.", system: { custo: 0, acao: "Passiva", requisito: "Nível 1" } },
  { name: "Reflexo Evasivo", nivel: 2, categoria: "Lutador", description: "Recebe redução de dano a todo tipo (exceto alma) igual a metade do seu nível de Lutador.", system: { custo: 0, acao: "Passiva", requisito: "Nível 2" } },
  { name: "Aparar Ataque", nivel: 2, categoria: "Lutador", description: "Quando alvo de ataque corpo a corpo, gaste 1 PE e reação para atacar. Se superar o inimigo, evita o ataque.", system: { custo: 1, acao: "Reação", requisito: "Nível 2" } },
  { name: "Aparar Projéteis", nivel: 2, categoria: "Lutador", description: "Quando receber ataque à distância, gaste 1 PE e reação para tentar aparar o projétil, reduzindo o dano recebido em 2d6 + modificador + bônus de treinamento.", system: { custo: 1, acao: "Reação", requisito: "Nível 2" } },
  { name: "Ataque Inconsequente", nivel: 2, categoria: "Lutador", description: "Uma vez por rodada, ao realizar um ataque, você pode escolher receber vantagem na jogada de ataque e +5 na rolagem de dano dele. Porém, fica Desprevenido por 1 rodada.", system: { custo: 0, acao: "Livre", requisito: "Nível 2" } },
  { name: "Deboche Desconcertante", nivel: 2, categoria: "Lutador", description: "Como uma Ação Bônus, realize um teste de Intimidação contra um teste de Vontade dela (+2 bônus). Sucesso: alvo recebe penalidade = seu treino em todos os testes até seu prox turno.", system: { custo: 0, acao: "Ação Bônus", requisito: "Treinado em Intimidação" } },
  { name: "Puxar um Ar", nivel: 2, categoria: "Lutador", description: "Como uma Ação Bônus, realize uma rolagem do seu dano desarmado e se cure nesse valor. Usos = bônus de treinamento por descanso.", system: { custo: 0, acao: "Ação Bônus", requisito: "Nível 2" } },
  { name: "Brutalidade", nivel: 4, categoria: "Lutador", description: "Ação Livre, 2PE: +2 ataque e dano corpo a corpo. Não pode concentrar ou usar feitiços/técnicas de estilo.", system: { custo: 2, acao: "Ação Livre", requisito: "Nível 4" } },
  { name: "Fluxo", nivel: 4, categoria: "Lutador", description: "Cada nível de empolgação dá +1 dano e 4 PV temporários por nível acima do 1º no começo da rodada.", system: { custo: 0, acao: "Passiva", requisito: "Nível 4" } },

  // --- ESPECIALISTA EM COMBATE ---
  { name: "Repertório do Especialista", nivel: 1, categoria: "Especialista em Combate", description: "Escolha um estilo principal: Defensivo, Arremessador, Duelista, Interceptador, Protetor, Distante, Duplo ou Massivo.", system: { custo: 0, acao: "Passiva", requisito: "Nível 1" } },
  { name: "Artes do Combate", nivel: 1, categoria: "Especialista em Combate", description: "Recebe Pontos de Preparo (Nível + Sab). Permite: Arremesso Ágil, Distração Letal, Execução Silenciosa, Golpe Descendente, Investida Imediata.", system: { custo: 0, acao: "Varia", requisito: "Nível 1" } },
  { name: "Golpe Especial", nivel: 4, categoria: "Especialista em Combate", description: "Permite montar ataques especiais com propriedades: Amplo, Atroz, Impactante, Letal, Longo, Penetrante, Preciso, Sanguinário, etc.", system: { custo: 0, acao: "Varia", requisito: "Nível 4" } },
  { name: "Arremessos Potentes", nivel: 2, categoria: "Especialista em Combate", description: "Ataques com armas de arremesso contam como um nível de dano acima. Pode gastar 1PE para ignorar RD.", system: { custo: 1, acao: "Passiva/1PE", requisito: "Nível 2" } },
  { name: "Arsenal Cíclico", nivel: 2, categoria: "Especialista em Combate", description: "Sacar ou trocar item com ação livre. Recebe +1d no dano ao trocar de grupo de armas.", system: { custo: 0, acao: "Livre", requisito: "Nível 2" } },
  { name: "Extensão do Corpo", nivel: 2, categoria: "Especialista em Combate", description: "Alcance corpo a corpo aumenta em 1,5m. +2 em ataques e para evitar ser desarmado.", system: { custo: 0, acao: "Passiva", requisito: "Nível 2" } },
  { name: "Revigorar", nivel: 2, categoria: "Especialista em Combate", description: "Ação Bônus para curar 1d10 + 2xConst + Treino. Usos = bônus de treino.", system: { custo: 0, acao: "Ação Bônus", requisito: "Nível 2" } }
];

export async function seedHabilidades() {
const PACK_NAME = "habilidades-amaldicoadas"; // ID interno (sem acentos, minúsculo)
const PACK_LABEL = "Habilidades Amaldiçoadas";

  let pack = game.packs.get(`world.${PACK_NAME}`);
  if (!pack) {
    pack = await CompendiumCollection.createCompendium({
      type: "Item",
      label: PACK_LABEL,
      name: PACK_NAME,
      package: "world"
    });
  }

  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });

  // Limpar compêndio existente para evitar duplicatas (opcional, mas bom para seed)
  const index = await pack.getIndex();
  for (let i of index) {
    await pack.getDocument(i._id).then(d => d.delete());
  }

  // Criar Pastas
  const categorias = [...new Set(HABILIDADES_DATA.map(h => h.categoria))];
  const folderMap = {};

  for (let cat of categorias) {
    const folder = await Folder.create({
      name: cat,
      type: "Item",
      folder: null
    }, { pack: pack.collection });
    folderMap[cat] = folder.id;
  }

  // Criar Itens
  const itemsToCreate = HABILIDADES_DATA.map(h => ({
    name: h.name,
    type: "habilidade",
    img: "icons/skills/melee/strike-sword-steel-white.webp",
    folder: folderMap[h.categoria],
    system: {
      descricao: { value: h.description },
      custo: { value: h.system.custo },
      acao: { value: h.system.acao },
      requisito: { value: h.system.requisito },
      fonte: { value: "Livro de Regras v2.5" }
    }
  }));

  await Item.createDocuments(itemsToCreate, { pack: pack.collection });

  if (wasLocked) await pack.configure({ locked: true });
  ui.notifications.info(`Compêndio "${PACK_LABEL}" populado com ${itemsToCreate.length} habilidades!`);
}

window.seedHabilidades = seedHabilidades;