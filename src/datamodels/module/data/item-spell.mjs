import BoilerplateItemBase from "./base-item.mjs";

export default class SpellDataModel extends BoilerplateItemBase {

  // Tabela de custo base por nível (Nível -> PE)
  static COST_TABLE = Object.freeze({
    0: 0,
    1: 2,
    2: 5,
    3: 8,
    4: 12,
    5: 20,
    6: 0
  });

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.level = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0, max: 6 });
    schema.school = new fields.StringField({ required: true, blank: false, initial: "extensao" });
    schema.ability = new fields.StringField({ required: true, blank: false, initial: "int" });
    schema.actionType = new fields.StringField({ blank: true, initial: "" });
    schema.range = new fields.StringField({ blank: true, initial: "" });
    schema.target = new fields.StringField({ blank: true, initial: "" });
    schema.duration = new fields.StringField({ blank: true, initial: "" });

    schema.cost = new fields.SchemaField({
      modifier: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
      override: new fields.NumberField({ required: false, nullable: true, integer: true, initial: null })
    });

    schema.damage = new fields.ArrayField({ initial: [] });

    schema.save = new fields.SchemaField({
      ability: new fields.StringField({ blank: true, initial: "" }),
      dc: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
      scaling: new fields.StringField({ blank: true, initial: "" })
    });

    schema.description = new fields.HTMLField({ blank: true, initial: "" });

    return schema;
  }

  /**
   * prepareDerivedData is available to compute and normalize any derived values.
   * Here we keep it minimal because the effective cost is exposed via a getter.
   */
  prepareDerivedData() {
    // Intencionalmente vazio - lógica de custo está no getter `effectiveCost`.
  }

  /**
   * Propriedade derivada `effectiveCost`.
   * - Se `cost.override` não for nulo, usa-o.
   * - Caso contrário, usa a tabela de custo base por `level` e soma `cost.modifier`.
   * - Nunca retorna valor negativo.
   */
  get effectiveCost() {
    const lvl = Number(this.level ?? 0);
    const costObj = this.cost ?? {};
    const override = costObj.override;
    const modifier = Number(costObj.modifier ?? 0);

    if (override !== null && override !== undefined) {
      return Math.max(0, Number(override));
    }

    const base = Number(this.constructor.COST_TABLE?.[lvl] ?? 0);
    return Math.max(0, base + modifier);
  }

}