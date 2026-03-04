import { convertDamageLevel } from "./damage-scale.mjs";
import assert from "node:assert/strict";

const cases = [
  { base: "1d4", boost: 2, expected: "1d8" },
  { base: "1d6 + @forca", boost: 3, expected: "1d12 + @forca" },
  { base: "1d12", boost: 1, expected: "1d12 + 1d4" },
  { base: "1d12 + 1d6", boost: 1, expected: "1d12 + 1d8" },
  { base: "1d12 + 1d6", boost: -2, expected: "1d12" },
  { base: "2d8", boost: 1, expected: "2d10" },
  { base: "2d12", boost: 1, expected: "2d12 + 1d4" },
  { base: "6d6", boost: 1, expected: "3d12 + 1d4" },
  { base: "10 + 1d6", boost: 1, expected: "10 + 1d8" },
  { base: "1d2", boost: -4, expected: "1" },
  // Dano totalmente fixo (sem dado) permanece inalterado.
  { base: "2", boost: 2, expected: "2" }
];

for (const c of cases) {
  const out = convertDamageLevel(c.base, c.boost);
  assert.equal(out, c.expected, `${c.base} (${c.boost}) deveria resultar em ${c.expected}, mas retornou ${out}`);
}

console.log(`OK: ${cases.length} cenários de nível de dano passaram.`);
