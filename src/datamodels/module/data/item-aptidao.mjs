import BoilerplateItemBase from "./base-item.mjs";

export default class BoilerplateAptidao extends BoilerplateItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const schema = super.defineSchema();

    schema.aptType = new fields.StringField({ required: true, blank: false, initial: "toggle" });
    schema.prerequisitos = new fields.StringField({ required: true, blank: true, initial: "" });
    schema.custoPE = new fields.NumberField({ required: false, nullable: true, initial: 0, min: 0 });
    schema.custoDV = new fields.NumberField({ required: false, nullable: true, initial: 0, min: 0 });
    schema.custoDE = new fields.NumberField({ required: false, nullable: true, initial: 0, min: 0 });
    schema.tempoExec = new fields.StringField({ required: true, blank: true, initial: "Ação" });
    schema.duracao = new fields.StringField({ required: true, blank: true, initial: "Instantâneo" });

    return schema;
  }

  prepareDerivedData() {
    // Provide a small display string for cost to be used in templates
    try {
      const pe = this.custoPE ?? 0;
      const dv = this.custoDV ?? 0;
      const de = this.custoDE ?? 0;
      this.displayCost = `${pe} PE${dv ? ` • ${dv} DV` : ''}${de ? ` • ${de} DE` : ''}`;
    } catch (err) {
      this.displayCost = "";
    }
  }

}
