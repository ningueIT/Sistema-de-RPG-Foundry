// Macro: Criar Ficha de Inimigo (template rápido)
// Uso: executar dentro do Foundry para abrir um diálogo e criar um Actor NPC
(async ()=>{
  const content = `
  <form>
    <div class="form-group">
      <label>Nome</label>
      <input name="name" type="text" />
    </div>
    <div class="form-group">
      <label>ND</label>
      <input name="nd" type="number" min="1" max="20" value="1" />
    </div>
    <div class="form-group">
      <label>Patamar</label>
      <select name="patamar">
        <option value="lacaio">lacaio</option>
        <option value="capanga">capanga</option>
        <option value="comum" selected>comum</option>
        <option value="desafio">desafio</option>
        <option value="calamidade">calamidade</option>
      </select>
    </div>
    <div class="form-group">
      <label>Origem</label>
      <select name="origem">
        <option value="humano" selected>humano</option>
        <option value="espirito">espírito</option>
        <option value="feiticeiro">feiticeiro</option>
        <option value="corpo_amaldicoado">corpo_amaldicoado</option>
        <option value="restrito_corpo">restrito_corpo</option>
        <option value="restrito_fisico">restrito_fisico</option>
      </select>
    </div>
    <hr />
    <div class="form-group grid-row">
      <div class="col-4"><label>FOR</label><input name="forca" type="number" value="10"/></div>
      <div class="col-4"><label>DES</label><input name="destreza" type="number" value="10"/></div>
      <div class="col-4"><label>CON</label><input name="constituicao" type="number" value="10"/></div>
    </div>
  </form>`;

  new Dialog({
    title: "Criar Inimigo - Template",
    content,
    buttons: {
      create: {
        label: "Criar",
        callback: async (html) => {
          const name = html.find('[name="name"]').val() || 'Inimigo';
          const nd = Math.max(1, Math.min(20, parseInt(html.find('[name="nd"]').val()||1)));
          const patamar = html.find('[name="patamar"]').val() || 'comum';
          const origem = html.find('[name="origem"]').val() || 'humano';
          const forca = Number(html.find('[name="forca"]').val()||10);
          const destreza = Number(html.find('[name="destreza"]').val()||10);
          const constituicao = Number(html.find('[name="constituicao"]').val()||10);

          // multiplicador de vida (2..6 conforme ND)
          const mult = Math.min(6, 2 + Math.floor((nd - 1) / 4));
          const basePerNd = { capanga:40, comum:60, desafio:80, calamidade:100 };

          let hpMax = 0;
          if (patamar === 'lacaio') hpMax = 10 + (constituicao * 2);
          else hpMax = ( (basePerNd[patamar] ?? basePerNd.comum) * nd ) + (constituicao * mult);

          const conMod = Math.floor((constituicao - 10)/2);
          const peMax = Math.max(0, Math.floor((2 * nd) + conMod));

          const actorData = {
            name,
            type: 'npc',
            img: 'icons/svg/mystery-man.svg',
            system: {
              nd,
              patamar,
              origem,
              dificuldade_mesa: 'intermediario',
              atributos: {
                forca: { value: forca },
                destreza: { value: destreza },
                constituicao: { value: constituicao },
                inteligencia: { value: 10 },
                sabedoria: { value: 10 },
                presenca: { value: 10 }
              },
              recursos: {
                hp: { value: Math.floor(hpMax), max: Math.floor(hpMax) },
                energia: { value: Math.floor(peMax), max: Math.floor(peMax) }
              }
            }
          };

          try {
            const created = await Actor.create(actorData, {renderSheet: true});
            ui.notifications.info(`Inimigo "${created.name}" criado.`);
          } catch (err) {
            console.error('Erro ao criar inimigo:', err);
            ui.notifications.error('Falha ao criar inimigo. Veja o console.');
          }
        }
      },
      cancel: { label: "Cancelar" }
    },
    default: 'create'
  }).render(true);

})();
