async function getData(url) {
  try {
    let response = await fetch(url);
    let data = await response.json();
    return data;
  } catch (err) {
    return {
      success: false,
      msg: "Não foi possível obter os dados!"
    };
  }
}

function removeAllChilds(node){
  while(node.firstChild){
    node.removeChild(node.firstChild);
  }
}

function getSelectedValues(parent) {
  const escalaoSelect = parent.querySelector(".escalaoInput");
  const escalaoId = escalaoSelect.value || 0;
  let fase = 0;
  let campo = 0;

  const faseSelect = parent.querySelector(".faseInput");
  if(faseSelect){
    fase = faseSelect.value;
  }

  const campoSelect = parent.querySelector(".campoInput");
  if(campoSelect){
    campo = campoSelect.value;
  }

  return {
    escalaoId: parseInt(escalaoId),
    fase: parseInt(fase),
    campo: parseInt(campo)
  };
}

async function mostraFaseSelect(escalaoId, parent) {
  const data = await getData(`/listagens/getFases/${escalaoId}`);
  const faseSelect = parent.querySelector(".listagemFaseSelect");
  const itemsList = faseSelect.querySelector('.customSelect__list');
  const faseHeader = faseSelect.querySelector('.customSelect__header');
  const faseInput = faseSelect.getElementsByClassName('faseInput');

  // Reset ao cabeçalho da select box
  removeAllChilds(faseHeader);
  const placeholder = document.createElement('SPAN');
  placeholder.classList.add('placeholder');
  placeholder.textContent = 'Fase';
  faseHeader.appendChild(placeholder);
  faseHeader.classList.remove('customSelect__header-selected');

  // Reset fase input
  faseInput[0].value = 0;

  // Limpa a lista
  removeAllChilds(itemsList);

  // Constroi os items da fase
  data.listaFases.forEach(fase => {
    const item = document.createElement('P');
    item.classList.add("customSelect__links", "fase__link");
    item.dataset.fase = fase;
    item.textContent = (fase != 100) ? `${fase}ª Fase` : "Fase Final";
    itemsList.appendChild(item);
  });

  // Mostra Select das Fases
  faseSelect.classList.add('select-show');
}

async function mostraCamposSelect(escalaoId, fase, parent) {
  const data = await getData(`/listagens/getCampos/${escalaoId}/${fase}`);
  const campoSelect = parent.querySelector(".listagemCampoSelect");
  const itemsList = campoSelect.querySelector('.customSelect__list');
  const campoHeader = campoSelect.querySelector('.customSelect__header');
  const campoInput = campoSelect.getElementsByClassName('campoInput');

  // Reset ao cabeçalho da select box
  removeAllChilds(campoHeader);
  const placeholder = document.createElement('SPAN');
  placeholder.classList.add('placeholder');
  placeholder.textContent = 'Campos';
  campoHeader.appendChild(placeholder);
  campoHeader.classList.remove('customSelect__header-selected');

  // Reset fase input
  campoInput[0].value = 0;

  // Limpa a lista
  removeAllChilds(itemsList);

  // Constroi os items da fase
  data.listaCampos.forEach(campo => {
    const item = document.createElement('P');
    item.classList.add("customSelect__links", "campo__link");
    item.dataset.campo = campo.campo;
    item.textContent = `Campo ${campo.campo}${(campo.designacao != undefined) ? ' - ' + campo.designacao : ''}`;
    itemsList.appendChild(item);
  });

  // Mostra Select das Fases
  campoSelect.classList.add('select-show');
}

function resetFaseCamposSelect(parent){
  const faseSelect = parent.querySelector(".listagemFaseSelect");
  const campoSelect = parent.querySelector(".listagemCampoSelect");
  
  if(faseSelect){
    const faseInput = faseSelect.getElementsByClassName('faseInput');
    faseInput[0].value = 0;
    faseSelect.classList.remove('select-show');
  }
  
  if(campoSelect){
    const campoInput = campoSelect.getElementsByClassName('campoInput');
    campoInput[0].value = 0;
    campoSelect.classList.remove('select-show');
  }
}

function resetSoFolhaRosto(parent){
  const soFolhaRosto = parent.querySelector('.soFolhaRostoContainer');
  if(soFolhaRosto){
    soFolhaRosto.classList.remove('soFolhaRostoContainer-show');
    soFolhaRosto.querySelector('.soFolhaRostoInput').checked = false;
  }
}

async function imprimeNumEquipasPorConcelho(escalaoId) {
  try {
    const data = await getData(
      `/listagens/getNumEquipasPorConcelho/${escalaoId}`
    );
    docDefinition.content = [];
    delete docDefinition.pageBreakBefore;

    if (data.success) {
      makeHeader(docDefinition, data.torneio);

      makeNumEquipaPorConcelho(docDefinition, data);

      makeFooter(
        docDefinition,
        `Número de Equipas por Localidade e Escalão`
      );

      pdfMake.createPdf(docDefinition).print();
    } else {
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: data.errMsg
      });
    }
  } catch (err) {
    Swal.fire({
      type: "error",
      title: "Oops...",
      text: "Não foi possível obter os dados!"
    });
  }
}

async function imprimeEquipasAgrupadasPorCampos(escalaoId, fase, campo) {
  try {
    const data = await getData(
      `/listagens/equipasAgrupadasPorCampos/${escalaoId}/${fase}/${campo}`
    );
    docDefinition.content = [];

    if (data.success) {
      makeHeader(docDefinition, data.torneio);

      docDefinition.content.push({
        text: `Equipas Agrupadas por Campos - ${
          data.fase != 100 ? data.fase + "ª Fase" : "Fase Final"
        }`,
        alignment: "center",
        bold: true,
        fontSize: 14,
        margin: [0, 0, 0, 10]
      });

      makeEquipasAgrupadasPorCampos(
        docDefinition.content,
        data.listaCampos,
        data.fase
      );
      
      makeFooter(
        docDefinition,
        `Equipas Agrupadas por Campos - ${
          data.fase != 100 ? data.fase + "ª Fase" : "Fase Final"
        }`
      );

      pdfMake.createPdf(docDefinition).print();
    } else {
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: data.errMsg
      });
    }
  } catch (err) {
    Swal.fire({
      type: "error",
      title: "Oops...",
      text: "Não foi possível obter os dados!"
    });
  }
}

async function imprimeFichasJogo(escalaoId, fase, campo, parent) {
  try {
    const equipas = await getData(`/listagens/getEquipas/${escalaoId}`);
    const data = await getData(`/listagens/getFichasJogo/${escalaoId}/${campo}/${fase}`);

    docDefinition.content = [];
    delete docDefinition.footer;

    if (data.success) {
      makeHeader(docDefinition, data.torneio);

      data.campos.forEach((campo, index) => {
        const pageBreak = {
          text: "PageBreak",
          fontSize: 0,
          color: "#ffffff",
          margin: [0, 0, 0, 0],
          pageBreak: "before"
        };

        if (index > 0) {
          docDefinition.content.push(pageBreak);
        }

        if (fase == 1) {
          const soFolhaRosto = parent.querySelector(".soFolhaRostoInput");
          makeFolhaRostoJogosPrimeiraFase(docDefinition, campo, equipas.listaEquipas, fase);

          // Verifica se só se pretende imprimir a folha de rosto
          if (!soFolhaRosto.checked) {
            makeContentFichaJogoPrimeiraFase(docDefinition, campo, fase);
          }
        } else {
          makeFichasJogoFasesSeguintes(docDefinition, campo, equipas.listaEquipas, fase);
        }
      });

      if (fase > 1) {
        makeFooter(docDefinition, `Fichas de Jogo - ${fase != 100 ? fase + "ª Fase" : "Fase Final"}`);
      }
      
      pdfMake.createPdf(docDefinition).print();
    } else {
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: data.errMsg
      });
    }
  } catch (err) {
    Swal.fire({
      type: "error",
      title: "Oops...",
      text: "Não foi possível obter os dados!"
    });
  }
}

async function imprimeResultados(escalaoId, fase, campo) {
  try {
    const data = await getData(`/listagens/getClassificacao/${escalaoId}/${campo}/${fase}`);

    docDefinition.content = [];

    if (data.success) {
      makeHeader(docDefinition, data.torneio);

      docDefinition.content.push({
        text: `Resultados da ${fase != 100 ? fase + "ª Fase" : "fase Final"}`,
        alignment: "center",
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 20]
      });

      data.listaCampos.forEach((campo, index) => {
        makeContentResultados(docDefinition, campo, fase, index, data.listaCampos.length);
      });

      makeFooter(docDefinition, `Resultados da ${fase != 100 ? fase + "ª Fase" : "fase Final"}`);

      pdfMake.createPdf(docDefinition).print();
    } else {
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: data.errMsg
      });
    }
  } catch (err) {
    Swal.fire({
      type: "error",
      title: "Oops...",
      text: "Não foi possível obter os dados!"
    });
  }
}

function setSelectHeader(elemento, value, input){
  const parentSelectBox = elemento.closest('.customSelect');
  const selectBoxHeader = parentSelectBox.querySelector('.customSelect__header');
  const selectBoxInput = parentSelectBox.getElementsByClassName(input);

  selectBoxInput[0].value = value;
  selectBoxHeader.innerHTML = elemento.textContent;
  selectBoxHeader.classList.add('customSelect__header-selected');
}

const itemsListagem = document.querySelectorAll('.listagem__item');
itemsListagem.forEach((itemListagem, index) => {
  itemListagem.addEventListener('click', async function(e){

    try {
      if(e.target.classList.contains('escalao__link')){
        const elemento = e.target;
        const escalaoId = parseInt(elemento.dataset.escalao);
        setSelectHeader(elemento, escalaoId, 'escalaoInput');
        resetFaseCamposSelect(elemento.closest('.listagems__item-inputs'));

        if(index == 2){
          resetSoFolhaRosto(elemento.closest('.listagems__item-inputs'));
        }
  
        if(index > 0) {
          await mostraFaseSelect(escalaoId, elemento.closest('.listagems__item-inputs'));
        }
      } else if(e.target.classList.contains('fase__link')){
        const elemento = e.target;
        const fase = parseInt(elemento.dataset.fase);
        setSelectHeader(elemento, fase, 'faseInput');
  
        if(index > 0) {
          const { escalaoId } = getSelectedValues(elemento.closest('.listagems__item-inputs'));
          await mostraCamposSelect(escalaoId, fase, elemento.closest('.listagems__item-inputs'));
        }

        if(index == 2){
          const { fase } = getSelectedValues(elemento.closest('.listagems__item-inputs'));
          const soFolhaRosto = elemento.closest('.listagems__item-inputs').querySelector('.soFolhaRostoContainer');
          if(fase != 0 && fase == 1){
            soFolhaRosto.classList.add('soFolhaRostoContainer-show');
          } else {
            resetSoFolhaRosto(elemento.closest('.listagems__item-inputs'));
          }
        }
  
      } else if(e.target.classList.contains('campo__link')){
        const elemento = e.target;
        const campo = parseInt(elemento.dataset.campo);
        setSelectHeader(elemento, campo, 'campoInput');
      }
    } catch (err) {
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: "Não foi possível obter os dados!"
      });
    }
  });
});

const numEquipasPorConcelhoBtn = document.querySelector(".numEquipasPorConcelho_btn");
numEquipasPorConcelhoBtn.addEventListener("click", function(e) {
  e.preventDefault();
  const inputs = this.closest('.listagem__item-content').querySelector('.listagems__item-inputs');
  const { escalaoId } = getSelectedValues(inputs);
  if (escalaoId != 0) {
    imprimeNumEquipasPorConcelho(escalaoId);
  } else {
    Swal.fire({
      type: "warning",
      title: "Oops...",
      text: "Deve selecionar o Escalão."
    });
  }
});

const equipasAgrupadasPorCamposBtn = document.querySelector(".equipasAgrupadasPorCampos_btn");
equipasAgrupadasPorCamposBtn.addEventListener("click", function(e) {
  e.preventDefault();
  try {
    const inputs = this.closest('.listagem__item-content').querySelector('.listagems__item-inputs');
    const ctrlData = getSelectedValues(inputs);

    if (ctrlData.escalaoId == 0) throw 'Deve selecionar o Escalão';
    if (ctrlData.fase == 0) throw 'Deve selecionar a Fase';

    imprimeEquipasAgrupadasPorCampos(
      ctrlData.escalaoId,
      ctrlData.fase,
      ctrlData.campo
    );

  } catch (err) {
    Swal.fire({
      type: "warning",
      title: "Oops...",
      text: err
    });
  }
});

// Processa o click no botão das fichas de Jogo
const fichasJogoBtn = document.querySelector(".fichasJogo_btn");
fichasJogoBtn.addEventListener("click", function(e) {
  e.preventDefault();
  try {
    const inputs = this.closest('.listagem__item-content').querySelector('.listagems__item-inputs');
    const ctrlData = getSelectedValues(inputs);

    if (ctrlData.escalaoId == 0) throw 'Deve selecionar o Escalão';
    if (ctrlData.fase == 0) throw 'Deve selecionar a Fase';

    imprimeFichasJogo(
      ctrlData.escalaoId,
      ctrlData.fase,
      ctrlData.campo,
      inputs
    );
  } catch (err) {
    Swal.fire({
      type: "warning",
      title: "Oops...",
      text: err
    });
  }
});

// Processa o click no botão resultados
const resultadosBtn = document.querySelector(".resultados_btn");
resultadosBtn.addEventListener("click", function(e) {
  e.preventDefault();
  try {
    const inputs = this.closest('.listagem__item-content').querySelector('.listagems__item-inputs');
    const ctrlData = getSelectedValues(inputs);

    if (ctrlData.escalaoId == 0) throw 'Deve selecionar o Escalão';
    if (ctrlData.fase == 0) throw 'Deve selecionar a Fase';

    imprimeResultados(
      ctrlData.escalaoId,
      ctrlData.fase,
      ctrlData.campo
    );

  } catch (err) {
    Swal.fire({
      type: "warning",
      title: "Oops...",
      text: err
    });
  }
});

// Abre o pdf noutra janela
//pdfMake.createPdf(docDefinition).print();
// Quando se pretende abrir o pdf na mesma janela
//pdfMake.createPdf(docDefinition).print({}, window);
