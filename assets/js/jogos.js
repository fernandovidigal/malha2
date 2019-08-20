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

function getEquipasInputValues(form){
    return {
        equipa1: {
            parcial1: parseInt(form.elements['equipa1_parcial1'].value),
            parcial2: parseInt(form.elements['equipa1_parcial2'].value),
            parcial3: (isNaN(parseInt(form.elements['equipa1_parcial3'].value))) ? 0 : parseInt(form.elements['equipa1_parcial3'].value)
        },
        equipa2: {
            parcial1: parseInt(form.elements['equipa2_parcial1'].value),
            parcial2: parseInt(form.elements['equipa2_parcial2'].value),
            parcial3: (isNaN(parseInt(form.elements['equipa2_parcial3'].value))) ? 0 : parseInt(form.elements['equipa2_parcial3'].value)
        }
    }
}

function validaPontosEquipas(equipa1, equipa2){
    let valido = true;

    if(equipa1.parcial1 < 0 || equipa1.parcial1 > 30 || equipa2.parcial1 < 0 || equipa2.parcial1 > 30 || equipa1.parcial1 == equipa2.parcial1){
        valido = false;
        Swal.fire({
            type: 'error',
            title: 'Parciais do primeiro jogo inválidos'
        });
    } else if(equipa1.parcial2 < 0 || equipa1.parcial2 > 30 || equipa2.parcial2 < 0 || equipa2.parcial2 > 30 || equipa1.parcial2 == equipa2.parcial2){
        valido = false;
        Swal.fire({
            type: 'error',
            title: 'Parciais do segundo jogo inválidos'
        });
    } else if(equipa1.parcial3 < 0 || equipa1.parcial2 > 30 || equipa2.parcial3 < 0 || equipa2.parcial3 > 30){
        valido = false;
        Swal.fire({
            type: 'error',
            title: 'Parciais do terceiro jogo inválidos'
        });
    } else if(equipa1.parcial3 != 0 && equipa2.parcial3 != 0 && equipa1.parcial3 == equipa2.parcial3){
        valido = false;
        Swal.fire({
            type: 'error',
            title: 'Parciais do terceiro jogo inválidos'
        });
    }

    return valido;
}

async function handleParciais(btn, url, moveToEnd, actualizar = 0){
    const campoWrapper = btn.closest('.campo__wrapper');
    const currentForm = btn.closest('.resultados__form');
    const currentEquipasInfowrapper = currentForm.querySelector(".equipasInfo__wrapper");
    const jogoID = btn.dataset.jogoid;
    let equipa1_pontos_text = currentForm.querySelector('.equipa1_pontos');
    let equipa2_pontos_text = currentForm.querySelector('.equipa2_pontos');

    const equipasInputValues = getEquipasInputValues(currentForm);
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
                throw new Error((actualizar == 0) ? 'Não foi possível adicionar os parciais' : 'Não foi possível actualizar os parciais');
            }

            Swal.fire({
                type: 'success',
                title: `Parciais ${(actualizar == 0) ? 'adicionados': 'actualizados'} com sucesso!`,
                showConfirmButton: false,
                timer: 1000
            });

            equipa1_pontos_text.appendChild(document.createTextNode(data.equipa1_pontos));
            equipa2_pontos_text.appendChild(document.createTextNode(data.equipa2_pontos));

            if(moveToEnd){
                campoWrapper.removeChild(currentForm);
                campoWrapper.appendChild(currentForm);
            }
            
            const parciaisInput = currentForm.querySelectorAll("input[type=text]");
            parciaisInput.forEach(inputsParaTexto);

            
            const editBtn = createEditButton(jogoID);

            removeAllChilds(currentBtnWrapper);
            currentBtnWrapper.appendChild(editBtn);

            currentEquipasInfowrapper.classList.add('resultados_finalizados');
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

function createEditButton(jogo_id){
    const editButton = document.createElement("A");
    editButton.setAttribute("href", "");
    editButton.classList.add("btn__edit-resultados");
    editButton.setAttribute("name", "editarResultados");
    editButton.setAttribute("data-jogoid", jogo_id);
    editButton.innerHTML = "Editar";

    return editButton;
}

function createDeleteButton(jogo_id){
    const deleteButton = document.createElement("A");
    deleteButton.setAttribute("href", "");
    deleteButton.classList.add("btn__delete-resultados");
    deleteButton.setAttribute("name", "deleteResultados");
    deleteButton.setAttribute("data-jogoid", jogo_id);
    deleteButton.innerHTML = "Eliminar";

    return deleteButton;
}

function createUdpateButton(jogo_id){
    const deleteButton = document.createElement("A");
    deleteButton.setAttribute("href", "");
    deleteButton.classList.add("btn__update-resultados");
    deleteButton.setAttribute("name", "updateResultados");
    deleteButton.setAttribute("data-jogoid", jogo_id);
    deleteButton.innerHTML = "Actualizar";

    return deleteButton;
}

function inputsParaTexto(item, index){
    const parentNode = item.parentNode;
    const inputValue = item.value;
    parentNode.innerHTML = inputValue;
}

const editResultadosBtns = document.querySelectorAll('.btn_wrapper');
editResultadosBtns.forEach((item, index)=>{
    item.addEventListener('click', function(event){
        event.preventDefault();
        const btn = event.target;
        const jogoID = btn.dataset.jogoid;

        if(btn.tagName == 'A' && btn.getAttribute('name') == "editarResultados"){
            const equipasWrapper = this.previousElementSibling;
            activaEdicaoResultados(equipasWrapper);
            removeAllChilds(this);
            removeAllChilds(equipasWrapper.querySelector('.equipa1_pontos'));
            removeAllChilds(equipasWrapper.querySelector('.equipa2_pontos'));
            this.appendChild(createUdpateButton(jogoID));
        } else if(btn.tagName == 'A' && btn.getAttribute('name') == "updateResultados"){
            handleParciais(btn, "/torneio/actualizaParciais", false, 1);
        }
    });
});

function activaEdicaoResultados(element){
    const equipaParcial = element.querySelectorAll('.equipa_parcial');
    const count = equipaParcial.length;
    const division = Math.ceil(count / 2);
    let equipaCount = 1;
    let parcialCount = 1;

    equipaParcial.forEach((parcial, index) => {
        if(parcialCount > 3){
            equipaCount++;
            parcialCount = 1;
        }

        const parcialValue = parcial.childNodes[0].nodeValue;
        removeAllChilds(parcial);
        let inputName = 'equipa'+equipaCount+'_parcial'+parcialCount;
        parcial.appendChild(createInputTextField(inputName, 8, parcialValue));

        parcialCount++;
    }); 
}

function createInputTextField(name, size, value){
    const inputField = document.createElement('INPUT');
    inputField.setAttribute('type', 'text');
    inputField.setAttribute('name', name);
    inputField.setAttribute('size', size);
    inputField.setAttribute('value', value);

    return inputField;
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
        docDefinition.pageBreakBefore = function(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
            if(currentNode.text && currentNode.text.startsWith("Campo") && currentNode.startPosition.top > 130){
                return true;
            }
        };

        if(data.success){           makeHeader(docDefinition, data.torneio);
            data.listaCampos.forEach(campo => {
                makeFolhaParciais(docDefinition, campo, data.listaEquipas, data.listaParciais);
            });
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

const printBtn = document.querySelector('.print_btn');
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