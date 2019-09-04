
function splitIntoThree(listaJogos){
    const three = [];
    while(listaJogos.length > 0){
        if(listaJogos.length > 3){
            const threeRow = [];
            threeRow.push(listaJogos[0]);
            threeRow.push(listaJogos[1]);
            threeRow.push(listaJogos[2]);
            listaJogos.splice(0,3);
            three.push(threeRow);
        } else {
            three.push(listaJogos);
            break;
        }
    }
    return three;
}

async function getData(url) {
    try {
        let response = await fetch(url);
        let data = await response.json();
        return data;
    } catch(err){
        return {
            success: false,
            msg: 'Não foi possível obter os dados!'
        }
    }    
}

function getControllersValues(parent){
    const escalaoSelect = parent.querySelector('.escalaoSelect');
    const escalaoId = escalaoSelect[escalaoSelect.selectedIndex].value || 0;

    const faseSelect = parent.querySelector('.faseSelect');
    const fase = (faseSelect) ? faseSelect[faseSelect.selectedIndex].value : 0;

    const camposSelect = parent.querySelector('.camposSelect');
    const campo = (camposSelect) ? camposSelect[camposSelect.selectedIndex].value : 0;

    return {
        escalaoId: parseInt(escalaoId),
        fase: parseInt(fase),
        campo: parseInt(campo)
    }
}

async function mostraFaseSelect(escalaoId, parent){
    const data = await getData(`/listagens/getFases/${escalaoId}`);
    const faseSelectExists = parent.querySelector('.faseSelect');

    if(faseSelectExists){
        parent.removeChild(faseSelectExists);
    }

    const selectBox = document.createElement('select');
    selectBox.name = 'fase';
    selectBox.id = 'fase';
    selectBox.classList.add('faseSelect');

    data.listaFases.forEach(function(fase){
        const option = document.createElement('option');
        option.value = fase;
        option.text = (fase != 100) ? `Fase ${fase}`: 'Fase Final';
        selectBox.appendChild(option);
    });
    parent.appendChild(selectBox);
}

async function mostraCamposSelect(escalaoId, fase, parent){
    const data = await getData(`/listagens/getCampos/${escalaoId}/${fase}`);
    const campoSelectExists = parent.querySelector('.camposSelect');

    if(campoSelectExists){
        parent.removeChild(campoSelectExists);
    }

    const selectBox = document.createElement('select');
    selectBox.name = 'campos';
    selectBox.id = 'campos';
    selectBox.classList.add('camposSelect');

    const todasOption = document.createElement('option');
    todasOption.value = 0;
    todasOption.text = 'Todos os Campos';
    selectBox.appendChild(todasOption);

    data.listaCampos.forEach(function(campo){
        const option = document.createElement('option');
        option.value = campo;
        option.text = `Campo ${campo}`;
        selectBox.appendChild(option);
    });
    parent.appendChild(selectBox);
}

function mostraSoFolhaRostoCheckBox(parent){
    const soFolhaRostoExists = parent.querySelector('.soFolhaRostoWrapper');

    if(soFolhaRostoExists){
        parent.removeChild(soFolhaRostoExists);
    }

    const soFolhaRostoWrapper = document.createElement('div');
    soFolhaRostoWrapper.classList.add('soFolhaRostoWrapper');

    const checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.name = 'soFolhaRosto';
    checkBox.id = 'soFolhaRosto';
    checkBox.classList.add('soFolhaRosto');

    const checkLabel = document.createElement('label');
    checkLabel.setAttribute('for', 'soFolhaRosto');
    checkLabel.textContent = 'Só Folha de Rosto';
    checkLabel.classList.add('soFolhaRostoLabel');

    soFolhaRostoWrapper.appendChild(checkBox);
    soFolhaRostoWrapper.appendChild(checkLabel);

    parent.appendChild(soFolhaRostoWrapper);
}

function removeSelectBoxes(parent){
    // Fase selectbox
    const faseSelectExists = parent.querySelector('.faseSelect');
    if(faseSelectExists){
        parent.removeChild(faseSelectExists);
    }

    // Campos selectbox
    const campoSelectExists = parent.querySelector('.camposSelect');
    if(campoSelectExists){
        parent.removeChild(campoSelectExists);
    }

    // So Folha Rosto checkbox
    const soFolhaRostoExists = parent.querySelector('.soFolhaRostoWrapper');
    if(soFolhaRostoExists){
        parent.removeChild(soFolhaRostoExists);
    }
}

async function imprimeNumEquipasPorConcelho(escalaoId){
    try {
        const data = await getData(`/listagens/getNumEquipasPorConcelho/${escalaoId}`);
        docDefinition.content = [];
        delete docDefinition.pageBreakBefore;

        if(data.success){
            makeHeader(docDefinition, data.torneio);

            docDefinition.content.push({
                text: 'Número de Equipas por Localidade',
                alignment: 'center',
                bold: true,
                fontSize: 14,
                margin: [0, 10]
            });

            makeNumEquipaPorConcelho(docDefinition, data.numEquipas, data.total);

            pdfMake.createPdf(docDefinition).print();
        } else {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: data.errMsg,
            });
        }
    } catch(err){
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Não foi possível obter os dados!',
        });
    }
}

async function imprimeEquipasAgrupadasPorCampos(escalaoId, fase, campo){
    try {
        const data = await getData(`/listagens/equipasAgrupadasPorCampos/${escalaoId}/${fase}/${campo}`);
        docDefinition.content = [];

        if(data.success){
            makeHeader(docDefinition, data.torneio);

            docDefinition.content.push({
                text: `Equipas Agrupadas por Campos - ${data.fase != 100 ? data.fase + 'ª Fase' : 'Fase Final'}`,
                alignment: 'center',
                bold: true,
                fontSize: 14,
                margin: [0,0,0,10]
            });

            makeEquipasAgrupadasPorCampos(docDefinition.content, data.listaCampos, data.fase);
            makeFooter(docDefinition, `Equipas Agrupadas por Campos - ${data.fase != 100 ? data.fase + 'ª Fase' : 'Fase Final'}`);

            pdfMake.createPdf(docDefinition).print();
        } else {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: data.errMsg,
            });
        }
    } catch(err){
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Não foi possível obter os dados!',
        });
    }
}

async function imprimeFichasJogo(escalaoId, fase, campo, parent){
    try {
        const equipas = await getData(`/listagens/getEquipas/${escalaoId}`);
        const data = await getData(`/listagens/getFichasJogo/${escalaoId}/${campo}/${fase}`);

        docDefinition.content = [];
        delete docDefinition.footer;

        if(data.success){
            makeHeader(docDefinition, data.torneio);

            data.campos.forEach((campo, index) => {
                const pageBreak = {
                    text: 'PageBreak',
                    fontSize: 0,
                    color: '#ffffff',
                    margin: [0,0,0,0],
                    pageBreak: 'before'
                }

                if(fase == 1){

                    if(index > 0){
                        docDefinition.content.push(pageBreak);
                    }
                    const soFolhaRosto = parent.querySelector('.soFolhaRosto');
                    makeFolhaRostoJogosPrimeiraFase(docDefinition, campo, equipas.listaEquipas, fase);
                    
                    // Verifica se só se pretende imprimir a folha de rosto
                    if(!soFolhaRosto.checked){ 
                        //docDefinition.content.push(pageBreak);
                        makeContentFichaJogoPrimeiraFase(docDefinition, campo, fase);  
                    }
                } else {
                    docDefinition.content.push(pageBreak);
                    makeFichasJogoFasesSeguintes(docDefinition, campo, equipas.listaEquipas, fase);
                }
            });
            pdfMake.createPdf(docDefinition).print();
        } else {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: data.errMsg,
            });
        }
    } catch(err) {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Não foi possível obter os dados!',
        });
    }
}

async function imprimeResultados(escalaoId, fase, campo){
    try {
        const data = await getData(`/listagens/getClassificacao/${escalaoId}/${campo}/${fase}`);

        docDefinition.content = [];
        
        if(data.success){
            makeHeader(docDefinition, data.torneio);

            docDefinition.content.push({
                text: `Resultados da ${fase != 100 ? fase + 'ª Fase' : 'fase Final'}`,
                alignment: 'center',
                fontSize: 14,
                bold: true,
                margin: [0,0,0,20]
            });

            data.listaCampos.forEach((campo, index) => {
                makeContentResultados(docDefinition, campo, fase, index, data.listaCampos.length)
            });

            makeFooter(docDefinition, `Resultados da ${fase != 100 ? fase + 'ª Fase' : 'fase Final'}`);

            pdfMake.createPdf(docDefinition).print();
        } else {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: data.errMsg,
            });
        }
    } catch(err) {
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Não foi possível obter os dados!',
        });
    }
}

// Processa alterações na escolha do escalão
const escalaoSelect = document.getElementsByName('escalao');
escalaoSelect.forEach(function(escalao, index){
    escalao.addEventListener('change', async function(e){
        try{
            const escalaoId = this[this.selectedIndex].value;

            if(escalaoId != 0) {
                if(index == 1 || index == 2 || index == 3){
                    await mostraFaseSelect(escalaoId, this.parentNode, false);
                    const data = getControllersValues(this.parentNode);
                    await mostraCamposSelect(escalaoId, data.fase, this.parentNode);
                } 
                if(index == 2){
                    mostraSoFolhaRostoCheckBox(this.parentNode);
                }
            } else {
                removeSelectBoxes(this.parentNode);
            }

            
        } catch(err) {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: 'Não foi possível obter os dados!',
            });
        }
    });
});

// Processa as alterações na escalho da fase
const cardsControllers = document.querySelectorAll('.listagemCard__controllers');
cardsControllers.forEach(controller => {
    controller.addEventListener('change', async function(e){
        if(e.target.name == 'fase'){
            try{
                // Obtem os dados das select boxes
                const ctrlData = getControllersValues(controller);
                await mostraCamposSelect(ctrlData.escalaoId, ctrlData.fase, this);

                if(this.classList.contains('fichasJogo') && ctrlData.fase == 1){
                    mostraSoFolhaRostoCheckBox(this);
                } else {
                    const soFolhaRostoExists = this.querySelector('.soFolhaRostoWrapper');

                    if(soFolhaRostoExists){
                        this.removeChild(soFolhaRostoExists);
                    }
                }
            } catch(err){
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: 'Não foi possível obter os dados!',
                });
            }
        }
    });
});

const numEquipasPorConcelhoBtn = document.querySelector('.numEquipasPorConcelho_btn');
numEquipasPorConcelhoBtn.addEventListener('click', function(e){
    e.preventDefault();
    const ctrlData = getControllersValues(this.parentNode);
    if(ctrlData.escalaoId != 0){
        imprimeNumEquipasPorConcelho(ctrlData.escalaoId);
    } else {
        Swal.fire({
            type: 'warning',
            title: 'Oops...',
            text: 'Deve selecionar o Escalão.',
        });
    }
});

const equipasAgrupadasPorCamposBtn = document.querySelector('.equipasAgrupadasPorCampos_btn');
equipasAgrupadasPorCamposBtn.addEventListener('click', function(e){
    e.preventDefault();
    const ctrlData = getControllersValues(this.parentNode);
    if(ctrlData.escalaoId != 0){
        imprimeEquipasAgrupadasPorCampos(ctrlData.escalaoId, ctrlData.fase, ctrlData.campo);
    } else {
        Swal.fire({
            type: 'warning',
            title: 'Oops...',
            text: 'Deve selecionar o Escalão.',
        });
    }
});

// Processa o click no botão das fichas de Jogo
const fichasJogoBtn = document.querySelector('.fichasJogo_btn');
fichasJogoBtn.addEventListener('click', async function(e){
    e.preventDefault();
    const ctrlData = getControllersValues(this.parentNode);
    if(ctrlData.escalaoId != 0){
        await imprimeFichasJogo(ctrlData.escalaoId, ctrlData.fase, ctrlData.campo, this.parentNode);
    } else {
        Swal.fire({
            type: 'warning',
            title: 'Oops...',
            text: 'Deve selecionar o Escalão.',
        });
    }
});

// Processa o click no botão resultados
const resultadosBtn = document.querySelector('.resultados_btn');
resultadosBtn.addEventListener('click', function(e){
    e.preventDefault();
    const ctrlData = getControllersValues(this.parentNode);
    if(ctrlData.escalaoId != 0){
        imprimeResultados(ctrlData.escalaoId, ctrlData.fase, ctrlData.campo, ctrlData.fase);
    } else {
        Swal.fire({
            type: 'warning',
            title: 'Oops...',
            text: 'Deve selecionar o Escalão.',
        });
    }
});






// Abre o pdf noutra janela
//pdfMake.createPdf(docDefinition).print();
// Quando se pretende abrir o pdf na mesma janela
//pdfMake.createPdf(docDefinition).print({}, window);