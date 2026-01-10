/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // --- PARTES DO SEU SISTEMA (Feiticeiros) ---
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-header.hbs",    
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-attributes.hbs", 
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-conditions.hbs", 
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-status.hbs",
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-combat.hbs",
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-skills.hbs",
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-aptidoes.hbs",
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-aptidoes-amaldicoadas.hbs",
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-itens.hbs",
    "systems/feiticeiros-e-maldicoes/templates/actor/parts/actor-passivas.hbs",
    
    // Item partials
    "systems/feiticeiros-e-maldicoes/templates/item/parts/item-effects.hbs",
      ]);
};