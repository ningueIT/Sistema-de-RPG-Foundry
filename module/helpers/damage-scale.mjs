// module/helpers/damage-scale.mjs

const SINGLE_BASE_SCALE = ["1", "1d2", "1d3", "1d4", "1d6", "1d8", "1d10", "1d12"];
const DOUBLE_BASE_SCALE = ["2d4", "2d6", "2d8", "2d10", "2d12"];
const EXTRA_DIE_SCALE = [4, 6, 8, 10];

function normalizeDamageExpression(value) {
  return String(value ?? "").toLowerCase().replace(/\s+/g, "");
}

function formatDamageExpression(value) {
  const clean = normalizeDamageExpression(value);
  if (!clean.includes("+")) return clean;
  return clean.split("+").join(" + ");
}

function detectStyle(value) {
  const clean = normalizeDamageExpression(value);
  if (/^2d\d+/.test(clean)) return "double";
  return "single";
}

function parseD12Expression(value) {
  const clean = normalizeDamageExpression(value);
  const match = clean.match(/^(\d+)d12(?:\+1d(4|6|8|10))?$/);
  if (!match) return null;
  return {
    count: Number(match[1]),
    extra: match[2] ? Number(match[2]) : null
  };
}

function stepUpDamage(value) {
  const clean = normalizeDamageExpression(value);

  const singleIdx = SINGLE_BASE_SCALE.indexOf(clean);
  if (singleIdx !== -1) {
    if (singleIdx < SINGLE_BASE_SCALE.length - 1) return SINGLE_BASE_SCALE[singleIdx + 1];
    return "1d12 + 1d4";
  }

  const doubleIdx = DOUBLE_BASE_SCALE.indexOf(clean);
  if (doubleIdx !== -1) {
    if (doubleIdx < DOUBLE_BASE_SCALE.length - 1) return DOUBLE_BASE_SCALE[doubleIdx + 1];
    return "2d12 + 1d4";
  }

  const parsed = parseD12Expression(clean);
  if (!parsed) return clean;

  if (parsed.extra == null) return `${parsed.count}d12 + 1d4`;
  const extraIdx = EXTRA_DIE_SCALE.indexOf(parsed.extra);
  if (extraIdx === -1) return clean;
  if (extraIdx < EXTRA_DIE_SCALE.length - 1) {
    return `${parsed.count}d12 + 1d${EXTRA_DIE_SCALE[extraIdx + 1]}`;
  }
  return `${parsed.count + 1}d12`;
}

function stepDownDamage(value, style = "single") {
  const clean = normalizeDamageExpression(value);
  if (clean === "1") return "1";

  const singleIdx = SINGLE_BASE_SCALE.indexOf(clean);
  if (singleIdx > 0) return SINGLE_BASE_SCALE[singleIdx - 1];

  const doubleIdx = DOUBLE_BASE_SCALE.indexOf(clean);
  if (doubleIdx !== -1) {
    if (doubleIdx > 0) return DOUBLE_BASE_SCALE[doubleIdx - 1];
    return "1d6";
  }

  const parsed = parseD12Expression(clean);
  if (!parsed) return clean;

  if (parsed.extra != null) {
    const extraIdx = EXTRA_DIE_SCALE.indexOf(parsed.extra);
    if (extraIdx === -1) return clean;
    if (extraIdx === 0) return `${parsed.count}d12`;
    return `${parsed.count}d12 + 1d${EXTRA_DIE_SCALE[extraIdx - 1]}`;
  }

  if (parsed.count <= 1) return "1d10";
  if (parsed.count === 2) {
    return style === "double" ? "2d10" : "1d12 + 1d10";
  }
  return `${parsed.count - 1}d12 + 1d10`;
}

function buildSingleScale(limit = 40) {
  const levels = ["1"];
  while (levels.length < limit) {
    levels.push(normalizeDamageExpression(stepUpDamage(levels[levels.length - 1])));
  }
  return levels;
}

function getMaxDamageFromExpression(value) {
  const clean = normalizeDamageExpression(value);
  const diceMatches = [...clean.matchAll(/(\d*)d(\d+)/g)];
  if (!diceMatches.length) return null;
  return diceMatches.reduce((sum, m) => {
    const count = Number(m[1] || 1);
    const faces = Number(m[2] || 0);
    return sum + (count * faces);
  }, 0);
}

function findNearestSingleScaleExpression(maxValue) {
  const scale = buildSingleScale(60);
  let best = scale[0];
  let bestDiff = Infinity;
  for (const expr of scale) {
    const exprMax = getMaxDamageFromExpression(expr) ?? Number(expr);
    const diff = Math.abs(exprMax - maxValue);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = expr;
    }
  }
  return best;
}

/**
 * Converte uma fórmula de dado base ajustando seus níveis de dano.
 * @param {string} baseFormula - A fórmula original (ex: "1d6", "1d4 + @for").
 * @param {number} levelBoost - Quantos níveis aumentar (pode ser negativo).
 * @returns {string} - A nova fórmula calculada (ex: "1d10 + @for").
 */
export function convertDamageLevel(baseFormula, levelBoost) {
  if (!levelBoost || levelBoost === 0) return baseFormula;

  // Captura o primeiro bloco de dados (ex: "1d12 + 1d6") preservando o resto da fórmula
  const baseText = String(baseFormula);
  const diceBlockRegex = /\b((?:\d*d\d+)(?:\s*\+\s*\d*d\d+)*)\b/i;
  const match = baseText.match(diceBlockRegex) ?? baseText.match(/\b(1)\b/i);
  if (!match) return baseFormula;

  const originalBlock = match[1];
  let current = normalizeDamageExpression(originalBlock);
  let style = detectStyle(current);

  const knownBase =
    SINGLE_BASE_SCALE.includes(current) ||
    DOUBLE_BASE_SCALE.includes(current) ||
    !!parseD12Expression(current);

  if (!knownBase) {
    const maxValue = getMaxDamageFromExpression(current);
    if (maxValue == null) return baseFormula;
    current = findNearestSingleScaleExpression(maxValue);
    style = "single";
  }

  let steps = Number(levelBoost);
  while (steps > 0) {
    current = normalizeDamageExpression(stepUpDamage(current));
    steps -= 1;
  }
  while (steps < 0) {
    current = normalizeDamageExpression(stepDownDamage(current, style));
    steps += 1;
  }

  const finalFormula = baseText.replace(originalBlock, formatDamageExpression(current));
  return finalFormula;
}
