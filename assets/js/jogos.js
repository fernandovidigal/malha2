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

let guardaResultados = document.getElementsByName('guardaResultados');
let campoWrapper = document.querySelectorAll('.campo__wrapper');

guardaResultados.forEach((btn, index) => {
    btn.addEventListener('click', function(e){
        e.preventDefault();
        handleParciais(btn, "/torneio/registaParciais", true);
    });
});

function parciaisIguais(parcial, par){
    if(parcial.value == par.value){
        return true;
    } else {
        return false;
    }
}

function validaParesDeParciais(parcialEquipa1, parcialEquipa2){
    const equipaParcial1Value = parseInt(parcialEquipa1.value.trim());
    const equipaParcial2Value = parseInt(parcialEquipa2.value.trim());
    var patt = new RegExp("^[0-9]{1,2}$");
    let valido = true;

    if(parcialEquipa1.value != null && parcialEquipa1.value.length > 0){
        if(!patt.test(parcialEquipa1.value)){
            parcialEquipa1.classList.add('parcial_error');
            valido = false;
        } else {
            if(equipaParcial1Value % 3 != 0 || equipaParcial1Value < 0 || equipaParcial1Value > 30){
                parcialEquipa1.classList.add('parcial_error');
                valido = false;
            }
        }
    }

    if(parcialEquipa2.value != null && parcialEquipa2.value.length > 0){
        if(!patt.test(parcialEquipa2.value)){
            parcialEquipa2.classList.add('parcial_error');
            valido = false;
        } else {
            if(equipaParcial2Value % 3 != 0 || equipaParcial2Value < 0 || equipaParcial2Value > 30){
                parcialEquipa2.classList.add('parcial_error');
                valido = false;
            }
        }
    }

    if(parcialEquipa1.value != null && parcialEquipa1.value.length > 0 && parcialEquipa2.value != null && parcialEquipa2.value.length > 0){
        if(equipaParcial1Value == equipaParcial2Value || (equipaParcial1Value != 30 && equipaParcial2Value != 30)){
            parcialEquipa1.classList.add('parcial_error');
            parcialEquipa2.classList.add('parcial_error');
            valido = false;
        }
    }

    return valido;
}

function verificaVencedor(parcialEquipa1Value, parcialEquipa2Value){
    if(parcialEquipa1Value > parcialEquipa2Value && parcialEquipa1Value == 30){
        return 1;
    } else if(parcialEquipa1Value < parcialEquipa2Value && parcialEquipa2Value == 30){
        return 2;
    } else {
        return -1;
    }
}

const equipaParciais = document.querySelectorAll('.jogoInfo');
equipaParciais.forEach(parciais => {
    const parciaisInput = parciais.querySelectorAll('.parcial');
    parciaisInput.forEach((parcial, index) => {
        parcial.addEventListener('keydown', function(e){
            if(e.keyCode == 9){
                let idx = index;
                if(idx == 5){
                    idx = 0;
                } else {
                    idx++;
                }
                parciaisInput[idx].focus();
                e.preventDefault();
            }
        });

        
        parcial.addEventListener('change', function(e){
            const parcial1 = validaParesDeParciais(parciaisInput[0], parciaisInput[1]);
            const parcial2 = validaParesDeParciais(parciaisInput[2], parciaisInput[3]);
            const parcial3 = validaParesDeParciais(parciaisInput[4], parciaisInput[5]);

            if(parcial1){
                parciaisInput[0].classList.remove('parcial_error');
                parciaisInput[1].classList.remove('parcial_error');
            }

            if(parcial2){
                parciaisInput[2].classList.remove('parcial_error');
                parciaisInput[3].classList.remove('parcial_error');
            }

            if(parcial3){
                parciaisInput[4].classList.remove('parcial_error');
                parciaisInput[5].classList.remove('parcial_error');
            }

            // Desactiva os inputs para o parcial 3 se já houver dois jogos ganhos pela mesma equipa
            if(parcial1 && parcial2){
                const vencedorParcial1 = verificaVencedor(parseInt(parciaisInput[0].value), parseInt(parciaisInput[1].value));
                const vencedorParcial2 = verificaVencedor(parseInt(parciaisInput[2].value), parseInt(parciaisInput[3].value));

                if(vencedorParcial1 == vencedorParcial2 && vencedorParcial1 != -1 && vencedorParcial2 != -1){
                    parciaisInput[4].value = '';
                    parciaisInput[4].disabled = true;
                    parciaisInput[5].value = '';
                    parciaisInput[5].disabled = true;
                    parciaisInput[4].classList.remove('parcial_error');
                    parciaisInput[5].classList.remove('parcial_error');
                } else {
                    parciaisInput[4].disabled = false;
                    parciaisInput[5].disabled = false;
                }
            }
        });
    });
});


function getEquipasInputValues(jogosInfoRow){
    return {
        equipa1: {
            parcial1: parseInt(jogosInfoRow.querySelector('.equipa1_parcial1').value),
            parcial2: parseInt(jogosInfoRow.querySelector('.equipa1_parcial2').value),
            parcial3: (isNaN(parseInt(jogosInfoRow.querySelector('.equipa1_parcial3').value))) ? 0 : parseInt(jogosInfoRow.querySelector('.equipa1_parcial3').value)
        },
        equipa2: {
            parcial1: parseInt(jogosInfoRow.querySelector('.equipa2_parcial1').value),
            parcial2: parseInt(jogosInfoRow.querySelector('.equipa2_parcial2').value),
            parcial3: (isNaN(parseInt(jogosInfoRow.querySelector('.equipa2_parcial3').value))) ? 0 : parseInt(jogosInfoRow.querySelector('.equipa2_parcial3').value)
        }
    }
}

function validaPontosEquipas(equipa1, equipa2){
    let valido = true;

    if(equipa1.parcial1 < 0 || equipa1.parcial1 > 30 || equipa2.parcial1 < 0 || equipa2.parcial1 > 30 || equipa1.parcial1 == equipa2.parcial1 || equipa1.parcial1 % 3 != 0 || equipa2.parcial1 % 3 != 0 || (equipa1.parcial1 != 30 && equipa2.parcial1 != 30)){
        valido = false;
        Swal.fire({
            type: 'error',
            title: 'Parciais do primeiro jogo inválidos'
        });
    } else if(equipa1.parcial2 < 0 || equipa1.parcial2 > 30 || equipa2.parcial2 < 0 || equipa2.parcial2 > 30 || equipa1.parcial2 == equipa2.parcial2 || equipa1.parcial2 % 3 != 0 || equipa2.parcial2 % 3 != 0 || (equipa1.parcial2 != 30 && equipa2.parcial2 != 30)){
        valido = false;
        Swal.fire({
            type: 'error',
            title: 'Parciais do segundo jogo inválidos'
        });
    } else if(equipa1.parcial3 < 0 || equipa1.parcial2 > 30 || equipa2.parcial3 < 0 || equipa2.parcial3 > 30 || equipa1.parcial3 % 3 != 0 || equipa2.parcial3 % 3 != 0){
        valido = false;
        Swal.fire({
            type: 'error',
            title: 'Parciais do terceiro jogo inválidos'
        });
    } else if(equipa1.parcial3 != 0 && equipa2.parcial3 != 0 && (equipa1.parcial3 == equipa2.parcial3 || (equipa1.parcial3 != 30 && equipa2.parcial3 != 30))){
        valido = false;
        Swal.fire({
            type: 'error',
            title: 'Parciais do terceiro jogo inválidos'
        });
    }

    return valido;
}

async function handleParciais(btn, url, moveToEnd, actualizar = 0){
    const jogosInfoRow = btn.closest('.jogoInfo');
    const jogoID = btn.dataset.jogoid;

    const equipasInputValues = getEquipasInputValues(jogosInfoRow);
    const valido = validaPontosEquipas(equipasInputValues.equipa1, equipasInputValues.equipa2);

    if(valido){
        // Cria o componente de carregamento loading
        const loadingDiv = createLoading();
        const currentBtnWrapper = btn.closest('.btn_wrapper');
        // Substitui o botão pelo componente de carregamento
        currentBtnWrapper.replaceChild(loadingDiv, btn);

        try {
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                  },
                method: 'POST',
                body: JSON.stringify({
                    jogoId: jogoID,
                    parciaisData: equipasInputValues
                })
            });

            const data = await response.json();

            if(!data.success){
                if(typeof data.message != undefined){
                    throw new Error(data.message);
                } else {
                    throw new Error((actualizar == 0) ? 'Não foi possível adicionar os parciais' : 'Não foi possível actualizar os parciais');
                }
            }

            Swal.fire({
                type: 'success',
                title: `Parciais ${(actualizar == 0) ? 'adicionados': 'actualizados'} com sucesso!`,
                showConfirmButton: false,
                timer: 1000
            });

            // Mostra as pontuações
            jogosInfoRow.querySelector('.equipa1_pontos').textContent = data.equipa1_pontos;
            jogosInfoRow.querySelector('.equipa2_pontos').textContent = data.equipa2_pontos;

            if(moveToEnd){
                const parent = jogosInfoRow.closest('tbody');
                parent.removeChild(jogosInfoRow);
                parent.appendChild(jogosInfoRow);
            }
            
            const parciaisInput = jogosInfoRow.querySelectorAll(".parcial");
            parciaisInput.forEach(parcial => {
                parcial.disabled = true;
            });

            // Cria o botão EDITAR
            const editBtn = createEditButton(jogoID);
            removeAllChilds(currentBtnWrapper);
            currentBtnWrapper.appendChild(editBtn);
        } catch(err) {
            Swal.fire({
                type: 'error',
                title: err.message,
            });
            currentBtnWrapper.replaceChild(btn, loadingDiv);
        }
    }
}

function createLoading(){
    const loadingDiv = document.createElement("DIV");
    loadingDiv.classList.add("loading");

    const bounce1Div = document.createElement("DIV");
    bounce1Div.classList.add("bounce1");
    const bounce2Div = document.createElement("DIV");
    bounce2Div.classList.add("bounce2");
    const bounce3Div = document.createElement("DIV");
    bounce3Div.classList.add("bounce3");

    loadingDiv.appendChild(bounce1Div);
    loadingDiv.appendChild(bounce2Div);
    loadingDiv.appendChild(bounce3Div);

    return loadingDiv;
}

function createEditButton(jogoId){
    const editButton = document.createElement("A");
    editButton.classList.add("btn", "btn-tertiary", "btn__edit-resultados");
    editButton.setAttribute("name", "editarResultados");
    editButton.dataset.jogoid = jogoId;
    editButton.textContent = "Editar";

    return editButton;
}

function createUdpateButton(jogoId){
    const deleteButton = document.createElement("A");
    deleteButton.classList.add("btn", "btn-secondary", "btn__update-resultados");
    deleteButton.setAttribute("name", "updateResultados");
    deleteButton.dataset.jogoid = jogoId;
    deleteButton.textContent = "Actualizar";

    return deleteButton;
}

const editResultadosBtns = document.querySelectorAll('.btn_wrapper');
editResultadosBtns.forEach((btn, index)=>{
    btn.addEventListener('click', function(e){
        e.preventDefault();
        const editBtn = e.target;
        const jogoId = editBtn.dataset.jogoid;

        if(editBtn.tagName == 'A' && editBtn.getAttribute('name') == "editarResultados"){
            const jogoInfoRow = this.parentNode;
            activaEdicaoResultados(jogoInfoRow);
            removeAllChilds(this);
            removeAllChilds(jogoInfoRow.querySelector('.equipa1_pontos'));
            removeAllChilds(jogoInfoRow.querySelector('.equipa2_pontos'));
            this.appendChild(createUdpateButton(jogoId));
        } else if(editBtn.tagName == 'A' && editBtn.getAttribute('name') == "updateResultados"){
            handleParciais(editBtn, "/torneio/actualizaParciais", false, 1);
        }
    });
});

function activaEdicaoResultados(element){
    const equipaParcial = element.querySelectorAll('.parcial');

    equipaParcial.forEach((parcial, index) => {
        parcial.disabled = false;
    }); 
}

function removeAllChilds(element){
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

async function imprimeFichaParciais(escalao, fase, campo){
    try {
        const data = await getData(`/torneio/fichaParciais/${escalao}/${fase}/${campo}`);
        docDefinition.content = [];

        if(data.success){           
            makeHeader(docDefinition, data.torneio);

            docDefinition.content.push({
                text: `Resultados dos parciais - ${(fase != 100) ? fase + 'ª Fase' : 'Fase Final'}`,
                alignment: 'center',
                bold: true,
                fontSize: 16
            });
            
            data.listaCampos.forEach((campo, index) => {
                if(index > 0 && campo.listaJogos.length > 7){
                    docDefinition.content.push({
                        text: "PageBreak",
                        fontSize: 0,
                        color: "#ffffff",
                        margin: [0, 0, 0, 0],
                        pageBreak: "before"
                      });
                }
                makeFolhaParciais(docDefinition, fase, campo, data.listaEquipas, data.listaParciais);
            });
            makeFooter(docDefinition, `Resultados dos parciais - ${(fase != 100) ? fase + 'ª Fase' : 'Fase Final'}`);
            pdfMake.createPdf(docDefinition).print();
        } else {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: data.errMsg,
            });
        }
    } catch(err){
        console.log(err);
        Swal.fire({
            type: 'error',
            title: 'Oops...',
            text: 'Não foi possível obter os dados!',
        });
    }
}

const printBtn = document.querySelector('.btn-print');
printBtn.addEventListener('click', function(e){
    e.preventDefault();
    const path = window.location.pathname;
    const pathComponents = path.split('/');

    let escalaoIndex = pathComponents.indexOf('escalao');
    let faseIndex = pathComponents.indexOf('fase');
    let campoIndex = pathComponents.indexOf('campo');
    
    escalaoIndex = (escalaoIndex != -1) ? pathComponents[escalaoIndex + 1] : 0;
    faseIndex = (faseIndex != -1) ? pathComponents[faseIndex + 1] : 0;
    campoIndex = (campoIndex != -1) ? pathComponents[campoIndex + 1] : 0;

    imprimeFichaParciais(escalaoIndex, faseIndex, campoIndex);
});