
/**
 * Element.closest() polyfill
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/closest#Polyfill
 */
if (!Element.prototype.closest) {
	if (!Element.prototype.matches) {
		Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
	}
	Element.prototype.closest = function (s) {
		var el = this;
		var ancestor = this;
		if (!document.documentElement.contains(el)) return null;
		do {
			if (ancestor.matches(s)) return ancestor;
			ancestor = ancestor.parentElement;
		} while (ancestor !== null);
		return null;
	};
}

const deleteBtn = document.querySelectorAll('.deleteBtn');
console.log(deleteBtn);
deleteBtn[3].addEventListener('click', function(){
    swal.fire({
        title: 'Tem a certeza?',
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: "Sim, apagar!",
        cancelButtonText: 'Não'
    });
});

var msgCloseBtn = document.querySelector('.msg_close');

if(msgCloseBtn){
    msgCloseBtn.addEventListener('click', function(e){
        e.preventDefault();
        var msgBlock = this.parentNode;
        msgBlock.remove();
    });
}


// RESULTADOS
let guardaResultados = document.getElementsByName('guardaResultados');
let campoWrapper = document.querySelectorAll('.campo__wrapper');

guardaResultados.forEach((btn, index) => {
    btn.addEventListener('click', function(e){
        e.preventDefault();
        handleParciais(btn, "/torneio/resultados/registaParciais", true);
    });
});

function handleParciais(btn, url, moveToEnd){
    const campoWrapper = btn.closest('.campo__wrapper');
    const currentForm = btn.closest('.resultados__form');
    const currentEquipasInfowrapper = currentForm.querySelector(".equipasInfo__wrapper");

    const jogoID = btn.dataset.jogoid;

    const equipa1_parcial1 = currentForm.elements['equipa1_parcial1'].value;
    const equipa1_parcial2 = currentForm.elements['equipa1_parcial2'].value;
    const equipa1_parcial3 = currentForm.elements['equipa1_parcial3'].value;

    const equipa2_parcial1 = currentForm.elements['equipa2_parcial1'].value;
    const equipa2_parcial2 = currentForm.elements['equipa2_parcial2'].value;
    const equipa2_parcial3 = currentForm.elements['equipa2_parcial3'].value;


    let equipa1_pontos_text = currentForm.querySelector('.equipa1_pontos');
    let equipa2_pontos_text = currentForm.querySelector('.equipa2_pontos');

    // Cria o componente de carregamento loading
    const loadingDiv = createLoading();
    const currentBtnWrapper = btn.closest('.btn_wrapper');
    // Substitui o botão pelo componente de carregamento
    currentBtnWrapper.replaceChild(loadingDiv, btn);

    fetch(url, {
        headers: { "Content-Type": "application/json; charset=utf-8" },
        method: 'POST',
        body: JSON.stringify({
            jogo_id: jogoID,
            parciaisData: {
                equipa1: {
                    parcial1: equipa1_parcial1,
                    parcial2: equipa1_parcial2,
                    parcial3: equipa1_parcial3
                },
                equipa2: {
                    parcial1: equipa2_parcial1,
                    parcial2: equipa2_parcial2,
                    parcial3: equipa2_parcial3
                }
            }
        })
    })
    .then(function(response){
        if(response.status != 200){
            throw new Error("Não foi possível adicionar os parciais");
        }
        
        return response.json();
    }).then(data => {
        if(!data.success){
            throw new Error("Não foi possível adicionar os parciais");
        }

        alert("Parciais adicionados com sucesso");
        equipa1_pontos_text.appendChild(document.createTextNode(data.equipa1_pontos));
        equipa2_pontos_text.appendChild(document.createTextNode(data.equipa2_pontos));

        if(moveToEnd){
            campoWrapper.removeChild(currentForm);
            campoWrapper.appendChild(currentForm);
        }
        
        const parciaisInput = currentForm.querySelectorAll("input[type=text]");
        parciaisInput.forEach(inputsParaTexto);

        
        const editBtn = createEditButton(jogoID);
        //const deleteBtn = createDeleteButton(jogoID);

        removeAllChilds(currentBtnWrapper);
        currentBtnWrapper.appendChild(editBtn);
        //currentBtnWrapper.appendChild(deleteBtn);

        currentEquipasInfowrapper.classList.add('resultados_finalizados');
    })
    .catch(function(err){
        alert(err);
    });
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
            handleParciais(btn, "/torneio/resultados/actualizaParciais", false);
        }
    });
});

function activaEdicaoResultados(element){
    const equipaParcial = element.querySelectorAll('.equipa_parcial');
    const count = equipaParcial.length;
    const division = Math.ceil(count / 2);
    let equipaCount = 1;
    let parcialCount = 1;

    equipaParcial.forEach((parcial, index)=>{
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



