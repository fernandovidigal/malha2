
function makeHeader(dd, torneioInfo){
    dd.header = {
        table: {
            widths: ['*'],
            body: [
                [{text: `${torneioInfo.designacao} - ${torneioInfo.localidade}`, fillColor: '#eeeeee',  color: '#455cc7', alignment: 'center', bold: true, fontSize: 25, margin: [0,5,0,0]}],
                [{text: `${torneioInfo.escalao} (${torneioInfo.sexo})`, fillColor: '#eeeeee', color: '#333333', alignment: 'center', bold: true, fontSize: 18, margin: [0,0,0,5]}]
            ]
        },
        layout: 'noBorders',
        margin: [15, 20]
    }
}

function makeFooter(dd){
    dd.footer = function(currentPage, pageCount, pageSize) {
	    if(pageCount > 1){
            return { text: 'Pág. ' + currentPage.toString() + '/' + pageCount, fontSize: 8, alignment: 'right', margin: [0,0,40,0],};
	    }
    }
}

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

function makeContentFichaJogoPrimeiraFase(dd, data){
    
    const listaJogos = splitIntoThree(data.listaJogos);
    const totalPaginas = Math.ceil(listaJogos.length / 2);
    let page = 1;

    listaJogos.forEach((jogos, index) => {
        if(Math.abs(index % 2) == 0 ){
            dd.content.push({
                text: `Campo Nº ${data.campo}`,
                alignment: 'center',
                bold: true,
                fontSize: 14
            });
        }

        const _table = {
            table: {
                headerRows: 1,
                widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
                body: []
            },
            id: 'tabela',
            layout: {
                hLineWidth: function(i, node) {
                    if(i === 0 || i === 12 || i === 13) {
                        return 1.5;
                    } else {
                        return 1;
                    }
                },
                vLineWidth: function(i, node) {
                    if(i % 6 === 0) {
                        return 1.5;
                    } else {
                        return 1;
                    }
                },
                hLineColor: function(i, node) {
                    if(i > 2 && i < 12) {
                        return 'gray';
                    } else {
                        return 'black';
                    }
                },
                vLineColor: function(i, node) {
                    if(Math.abs(i % 2) == 1) {
                        return 'gray';
                    } else {
                        return 'black';
                    }
                }
            },
            margin: [0, 20, 0, 10]
        }

        const equipasRow = [];
        jogos.forEach(jogo => {
            equipasRow.push({text: `Equipa ${jogo.equipa1Id}`, colSpan: 3, alignment: 'center', bold: true, fillColor: '#dddddd'});
            equipasRow.push('');
            equipasRow.push('');
            equipasRow.push({text: `Equipa ${jogo.equipa2Id}`, colSpan: 3, alignment: 'center', bold: true, fillColor: '#dddddd'});
            equipasRow.push('');
            equipasRow.push('');
        });
        _table.table.body.push(equipasRow);

        const jogosRow = [];
        for(let i = 0; i < jogos.length; i++){
            jogosRow.push({text: `1º Jogo`, colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'});
            jogosRow.push('');
            jogosRow.push({text: `2º Jogo`, colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'});
            jogosRow.push('');
            jogosRow.push({text: `3º Jogo`, colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'});
            jogosRow.push('');
        }
        _table.table.body.push(jogosRow);

        for(let i = 1; i <= 11; i++){
            const pontuacaoRow = [];
            for(let k = 0; k < (jogos.length * 6); k++){
                const value = i * 3;
                pontuacaoRow.push({text: `${(i != 11)? value : ' '}`, alignment: 'center', margin: [0,3], fontSize: 10});
            }
            _table.table.body.push(pontuacaoRow);
        }

        dd.content.push(_table);

        if(Math.abs(index % 2) == 1){
            dd.content.push({text: 'Nota: O terceiro jogo de cada Partida só se joga em caso de empate.', alignment: 'center', fontSize: 10, margin:[0,0,0,10]});
            dd.content.push({text: `Pág. ${page}/${totalPaginas}`, fontSize: 8, alignment: 'right', margin: [0,0,0,20]});
            page++;
        }
    });

    if(listaJogos.length % 2 != 0){
        dd.content.push({text: 'Nota: O terceiro jogo de cada Partida só se joga em caso de empate.', alignment: 'center', fontSize: 10, margin:[0,0,0,10]});
        dd.content.push({text: `Pág. ${page}/${totalPaginas}`, fontSize: 8, alignment: 'right', margin: [0,0,0,20]});
    }
}

function makeFolhaRostoJogosPrimeiraFase(dd, data, equipas, fase){
    
    dd.content.push({
        text: `Jogos a efectuar - ${fase}`,
        alignment: 'center',
        bold: true
    });

    dd.content.push({
        text: `Campo Nº ${data.campo}`,
        alignment: 'center',
        bold: true,
        fontSize: 16,
        margin: [0, 10]
    });

    const _table = {
        table: {
            headerRows: 1,
            widths: ['auto', '*', '*', 'auto', 40, 40, 40, 40],
            body: [[
                {text: 'Equipas', fontSize: 10, bold: true, border: [false, false, false, true]},
                {text: 'Jogadores', colSpan: 2, fontSize: 10, bold: true, border: [false, false, false, true]},
                {},
                {text: 'Localidade', fontSize: 10, bold: true, border: [false, false, false, true]},
                {text: 'Parcial 1', alignment: 'center', fontSize: 10, bold: true, border: [false, false, false, true]},
                {text: 'Parcial 2', alignment: 'center', fontSize: 10, bold: true, border: [false, false, false, true]},
                {text: 'Parcial 3', alignment: 'center', fontSize: 10, bold: true, border: [false, false, false, true]},
                {text: 'Pontos', alignment: 'center', fontSize: 10, bold: true, border: [false, false, false, true]},
                
            ]]
        },
        layout: {
            hLineWidth: function(i, node) {
                if(i === 1) {
                    return 2;
                }
                if(Math.abs(i % 2) === 1){
                    return 1;
                }
            },
            vLineWidth: function(i, node) {
                return 0;
            },
            hLineColor: function(i, node) {
                if(i > 1) {
                    return 'gray';
                } else {
                    return 'black';
                }
    		}
        }
    }

    data.listaJogos.forEach((jogo, index) => {
        const equipa1 = equipas.find(equipa => equipa.equipaId == jogo.equipa1Id);
        const equipa2 = equipas.find(equipa => equipa.equipaId == jogo.equipa2Id);
        const equipa1Row = [
            {text: `${equipa1.equipaId}`, alignment: 'center', fontSize: 10, margin: [0, 5]},
            {text: `${equipa1.primeiroElemento}`, fontSize: 9, margin: [0, 5]},
            {text: `${equipa1.segundoElemento}`, fontSize: 9, margin: [0, 5]},
            {text: 'Borba', fontSize: 10, margin: [5, 5]},
            {
                table: {
                    widths: ['*'],
                    heights: ['auto'],
                    body: [
                        [{
                            border: [false, false, false, true],
                            text:' '
                        }],
                    ]
                },
                margin: [4,2]
            },
            {
                table: {
                    widths: ['*'],
                    heights: ['auto'],
                    body: [
                        [{
                            border: [false, false, false, true],
                            text:' '
                        }],
                    ]
                },
                margin: [4,2]
            },
            {
                table: {
                    widths: ['*'],
                    heights: ['auto'],
                    body: [
                        [{
                            border: [false, false, false, true],
                            text:' '
                        }],
                    ]
                },
                margin: [4,2]
            },
            {
                table: {
                    widths: ['*'],
                    heights: [10],
                    body: [
                        [{
                            text:' '
                        }],
                    ]
                },
                margin: [4,2]
            }
        ];

        const equipa2Row = [
            {text: `${equipa2.equipaId}`, alignment: 'center', fontSize: 10, margin: [0, 5]},
            {text: `${equipa2.primeiroElemento}`, fontSize: 9, margin: [0, 5]},
            {text: `${equipa2.segundoElemento}`, fontSize: 9, margin: [0, 5]},
            {text: 'Borba', fontSize: 10, margin: [5, 5]},
            {
                table: {
                    widths: ['*'],
                    heights: ['auto'],
                    body: [
                        [{
                            border: [false, false, false, true],
                            text:' '
                        }],
                    ]
                },
                margin: [4,2]
            },
            {
                table: {
                    widths: ['*'],
                    heights: ['auto'],
                    body: [
                        [{
                            border: [false, false, false, true],
                            text:' '
                        }],
                    ]
                },
                margin: [4,2]
            },
            {
                table: {
                    widths: ['*'],
                    heights: ['auto'],
                    body: [
                        [{
                            border: [false, false, false, true],
                            text:' '
                        }],
                    ]
                },
                margin: [4,2]
            },
            {
                table: {
                    widths: ['*'],
                    heights: [10],
                    body: [
                        [{
                            text:' '
                        }],
                    ]
                },
                margin: [4,2],
            }
        ];

        _table.table.body.push(equipa1Row);
        _table.table.body.push(equipa2Row);
    });

    dd.content.push(_table);
    //dd.content.push({text: `Pág. 1/2`, fontSize: 8, alignment: 'right', margin: [0,0,0,20]});
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

function mostraCheckBox(parent){
    const checkBox = document.createElement('input');
    checkBox.type = 'checkbox';
    checkBox.name = 'soFolhaRosto';
    checkBox.id = 'soFolhaRosto';
    checkBox.classList.add('soFolhaRosto');

    const checkLabel = document.createElement('label');
    checkLabel.setAttribute('for', 'soFolhaRosto');
    checkLabel.textContent = 'Só Folha de Rosto';

    parent.appendChild(checkBox);
    parent.appendChild(checkLabel);
}

const escalaoSelect = document.getElementsByName('escalao');
escalaoSelect.forEach(function(escalao, index){
    escalao.addEventListener('change', async function(e){
        const escalaoId = this[this.selectedIndex].value;
        
        switch(index){
            case 1 :
            case 2 :
                await mostraFaseSelect(escalaoId, this.parentNode, false);
                const data = getControllersValues(this.parentNode);
                await mostraCamposSelect(escalaoId, data.fase, this.parentNode);
                mostraCheckBox(this.parentNode);
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

        if(e.target.name == 'fichasJogo_btn'){ 
            e.preventDefault();
            const ctrlData = getControllersValues(card);
            imprimeFichasJogo(ctrlData.escalaoId, ctrlData.fase, ctrlData.campo, e.target.parentNode);
        }
        
    });
});

async function imprimeFichasJogo(escalaoId, fase, campo, parent){
    let data;
    const soFolhaRosto = parent.querySelector('.soFolhaRosto');
    const equipas = await getData(`/listagens/getEquipas/${escalaoId}`);

    let docDefinition = {
        pageSize: 'A4',
        pageMargins: [15, 100, 15, 40],
        content: [],
        pageBreakBefore: function(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
            if (currentNode.table && currentNode.pageNumbers.length != 1) {
                return true;
              }
            /*if(currentNode.text && currentNode.text.startsWith("PageBreak") && currentNode.startPosition.pageNumber != 1){
                return true;
            }*/
            return false;
        },
    };

    if(fase == 1){
        // Imprime todos os jogos
        data = await getData(`/listagens/fichaJogoPrimeiraFase/${escalaoId}/${campo}`);
    } else {
        
    }

    if(data.success){
        makeHeader(docDefinition, data.torneio);

        data.campos.forEach(async campo => {
            const pageBreak = {
                text: 'PageBreak',
                fontSize: 0,
                color: '#ffffff',
                margin: [0,0,0,0],
                pageBreak: 'before'
            }

            makeFolhaRostoJogosPrimeiraFase(docDefinition, campo, equipas.listaEquipas, fase);
            
            // Verifica se só se pretende imprimir a folha de rosto
            if(!soFolhaRosto.checked){
                console.log("aqui");
                docDefinition.content.push(pageBreak);
                makeContentFichaJogoPrimeiraFase(docDefinition, campo);
            } 
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

