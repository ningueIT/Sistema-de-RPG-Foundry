import { convertDamageLevel } from "./damage-scale.mjs";

const cases = [
  { base: "1d4", boost: 2 },       // espera 1d8
  { base: "1d12", boost: 1 },      // espera 1d12 + 1d4
  { base: "1d12", boost: 50 },     // stress test
  { base: "1d6 + @forca", boost: 3 }, // composta com modifier
  { base: "2", boost: 2 }          // dano fixo
];

for (const c of cases) {
  const out = convertDamageLevel(c.base, c.boost);
  console.log(`${c.base} + ${c.boost} níveis => ${out}`);
}
