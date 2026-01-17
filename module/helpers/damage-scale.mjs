// module/helpers/damage-scale.mjs

/**
 * Tabela de Escala de Dano conforme Feiticeiros & Maldições
 * Índices:
 * 0: 1
 * 1: 1d2
 * 2: 1d3
 * 3: 1d4
 * 4: 1d6
 * 5: 1d8
 * 6: 1d10
 * 7: 1d12
 */
const DAMAGE_SCALE = ["1", "1d2", "1d3", "1d4", "1d6", "1d8", "1d10", "1d12"];

/**
 * Converte uma fórmula de dado base ajustando seus níveis de dano.
 * @param {string} baseFormula - A fórmula original (ex: "1d6", "1d4 + @for").
 * @param {number} levelBoost - Quantos níveis aumentar (pode ser negativo).
 * @returns {string} - A nova fórmula calculada (ex: "1d10 + @for").
 */
export function convertDamageLevel(baseFormula, levelBoost) {
  if (!levelBoost || levelBoost === 0) return baseFormula;

  // Regex para encontrar o primeiro dado (ex: 1d6, d8, 1d12)
  const diceRegex = /(\d*d\d+|1)(?![a-z])/i;
  const match = baseFormula.match(diceRegex);

  // Se não achar dado (ex: dano fixo "2"), retorna como está
  if (!match) return baseFormula;

  const originalDie = match[0]; // Ex: "1d6"

  // Normaliza para busca (d6 vira 1d6 para bater com a array)
  let searchDie = originalDie.toLowerCase();
  if (searchDie.startsWith("d")) searchDie = "1" + searchDie;

  // Encontra o índice na tabela
  let currentIndex = DAMAGE_SCALE.indexOf(searchDie);

  // Se o dado não estiver na tabela padrão (ex: 2d6), não alteramos a escala
  if (currentIndex === -1) return baseFormula;

  // Calcula o novo índice
  let newIndex = currentIndex + Number(levelBoost);

  let newDieString = "";

  if (newIndex < 0) {
    // Redução abaixo do mínimo: retorna "1"
    newDieString = "1";
  } else if (newIndex < DAMAGE_SCALE.length) {
    // Escala normal
    newDieString = DAMAGE_SCALE[newIndex];
  } else {
    // Lógica de Excedente (> 1d12) — acumula múltiplos dados conforme níveis extra
    // Estratégia:
    // - Enquanto o índice total exceder o máximo (7), extraímos 1d12 e reduzimos o excesso
    // - O restante (<=7) vira um dado da tabela; quando o restante estiver entre 1..5
    //   mapeamos para 1d4..1d12. Se o restante for 0 usamos 1d12.
    const parts = [];
    let remaining = newIndex;

    // Extrai 1d12s enquanto o índice exceder o máximo
    while (remaining > 7) {
      parts.push(DAMAGE_SCALE[7]); // 1d12
      // Cada 1d12 "consome" 5 níveis além do índice 7 (mapeamento: 1 -> d4, ... ,5 -> d12)
      remaining -= 5;
    }

    if (remaining <= 0) {
      parts.push("1");
    } else if (remaining < DAMAGE_SCALE.length) {
      parts.push(DAMAGE_SCALE[remaining]);
    } else {
      parts.push(DAMAGE_SCALE[DAMAGE_SCALE.length - 1]);
    }

    newDieString = parts.join(" + ");
  }

  // Substitui apenas a primeira ocorrência do dado na string original
  const finalFormula = baseFormula.replace(originalDie, newDieString);
  return finalFormula;
}
