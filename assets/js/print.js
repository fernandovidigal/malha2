
function makeHeader(dd, torneioInfo){
    dd.header = {
        table: {
            widths: ['*'],
            body: [
                [{text: `${torneioInfo.designacao} - ${torneioInfo.localidade}`, fillColor: '#eeeeee',  color: '#455cc7', alignment: 'center', bold: true, fontSize: 25, margin: [0,5,0,0]}],
                [{text: `${torneioInfo.escalao} - ${torneioInfo.sexo}`, fillColor: '#eeeeee', color: '#333333', alignment: 'center', bold: true, fontSize: 18, margin: [0,0,0,5]}]
            ]
        },
        layout: 'noBorders',
        margin: [40, 20]
    }
}

function makeFooter(dd){
    dd.footer = function(currentPage, pageCount, pageSize) {
	    if(pageCount > 1){
            return { text: 'Pág. ' + currentPage.toString(), alignment: 'right', margin: [0,0,40,0],};
	    }
    }
}

function makeContentFichaJogoPrimeiraFase(dd, listaJogos){
    const content = {
        table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
            body: []
        }
    }

    listaJogos.forEach(jogo => {
        const row = [{
            text: equipa.nome,
            margin: [20, 5]
        }, 
        {
            text: equipa.numEquipas,
            margin: [20, 5]
        }];
        content.table.body.push(row);
    });

    console.log(listaJogos);

    //dd.content.push(content);
}

async function getData(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
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

async function mostraFaseSelect(escalaoId, parent, todasOption = true){
    const data = await getData(`/listagens/getFases/${escalaoId}`);
    const faseSelectExists = parent.querySelector('.faseSelect');

    if(faseSelectExists){
        parent.removeChild(faseSelectExists);
    }

    const selectBox = document.createElement('select');
    selectBox.name = 'fase';
    selectBox.id = 'fase';
    selectBox.classList.add('faseSelect');

    if(todasOption){
        const todasOption = document.createElement('option');
        todasOption.value = 0;
        todasOption.text = 'Todas as Fases';
        selectBox.appendChild(todasOption);
    }

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

const escalaoSelect = document.getElementsByName('escalao');
escalaoSelect.forEach(function(escalao, index){
    escalao.addEventListener('change', function(e){
        const escalaoId = this[this.selectedIndex].value;

        switch(index){
            case 1 : 
                mostraFaseSelect(escalaoId, this.parentNode, true);
                break;
            case 2 : 
                mostraFaseSelect(escalaoId, this.parentNode, false);
                mostraCamposSelect(escalaoId, 1, this.parentNode);
                break;
            default: break;
        }
    });
});

const cardsControllers = document.querySelectorAll('.listagemCard__controllers');
cardsControllers.forEach(controller => {

    controller.addEventListener('change', function(e){
        if(e.target.name == 'fase'){
            const _fase = e.target;
            const fase = _fase[_fase.selectedIndex].value;
            const ctrlData = getControllersValues(controller);
            mostraCamposSelect(ctrlData.escalaoId, ctrlData.fase, this);
        }
    });
});

const cardsWrapper = document.querySelectorAll('.listagemCard_wrapper');

cardsWrapper.forEach(card => {
    card.addEventListener('click', function(e){
        e.preventDefault();

        if(e.target.name == 'fichasJogo_btn'){ 
            const ctrlData = getControllersValues(card);
            console.log(ctrlData);
            imprimeFichasJogo(ctrlData.escalaoId, ctrlData.fase, ctrlData.campo);
        }
        
    });
});

async function imprimeFichasJogo(escalaoId, fase, campo){
    let data;
    let docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 100, 40, 60],
        content: []
    };

    if(fase == 1){
        // Imprime todos os jogos
        data = await getData(`/listagens/fichaJogoPrimeiraFase/${escalaoId}/${campo}`);
    } else {
        
    }

    if(data.success){
        makeHeader(docDefinition, data.torneio);

        data.campos.forEach(campo => {
            const title = {
                text: `Campo Nº ${campo.campo}`,
                alignment: 'center',
                bold: true,
                margin: [0, 10]
            }
            docDefinition.content.push(title);
            makeContentFichaJogoPrimeiraFase(docDefinition, campo.listaJogos);
        });

        pdfMake.createPdf(docDefinition).print();
    } else {
        // TODO: Handle error
    }

    // Handle erro Quando fase == 0
}

// Abre o pdf noutra janela
//pdfMake.createPdf(docDefinition).print();
// Quando se pretende abrir o pdf na mesma janela
//pdfMake.createPdf(docDefinition).print({}, window);

