import BoilerplateItemBase from "./base-item.mjs";

export default class ClassDataModel extends BoilerplateItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    // Use HTML description for class items (rich text)
    schema.description = new fields.HTMLField({ blank: true, initial: "" });

    // Identifier to indicate class subtype (ex: "lutador", "controlador")
    schema.identifier = new fields.StringField({ required: true, blank: false, initial: "lutador" });

    // PV (HP) progression
    schema.hp = new fields.SchemaField({
      initial: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      perLevel: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })
    });

    // PE (EP) progression
    schema.ep = new fields.SchemaField({
      initial: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
      perLevel: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 })
    });

    // Progression table: { "1": { features, aptitudes, fixed }, "2": { ... } }
    schema.progression = new fields.ObjectField({ initial: {} });

    return schema;
  }

  /**
   * Retorna a configuração de progressão para o nível fornecido.
   * Se não existir, retorna um objeto seguro padrão.
   * @param {number|string} level
   * @returns {{features:number, aptitudes:number, fixed:Array}}
   */
  getProgressionAt(level) {
    const key = String(level ?? "");
    const prog = this.progression ?? {};
    const entry = prog?.[key];

    const safe = { features: 0, aptitudes: 0, fixed: [] };

    if (!entry) return safe;

    return {
      features: Number(entry.features ?? 0),
      aptitudes: Number(entry.aptitudes ?? 0),
      fixed: Array.isArray(entry.fixed) ? entry.fixed : []
    };
  }

}
