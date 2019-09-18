async function getData(url) {
    try {
        let response = await fetch(url);
        let data = await response.json();
        return data;
    } catch(err){
        throw new Error("Não foi possível obter os dados!");
    }    
}

function showDeleteMessage(equipa){
    swal.fire({
        title: 'Deseja eliminar a equipa?',
        html: `
            <div class="deleteTeam">
                <p>${equipa.equipaId}</p>
                <div class="deleteTeam__elementos">
                    <p>${equipa.primeiroElemento}</p>
                    <p>${equipa.segundoElemento}</p>
                </div>
                <p>${equipa.localidade}</p>
                <p>${equipa.escalao}<br><small>(${equipa.sexo == 1 ? 'Masculino' : 'Feminino'})</small></p>
            </div>`,
        type: 'warning',
        customClass: 'swal-wide',
        showCancelButton: true,
        confirmButtonText: 'Sim, eliminar!',
        confirmButtonColor: '#d9534f',
        cancelButtonText: 'Não!',
        reverseButtons: true,
        animation: true
    }).then(result => {
        if(result.value){
            fetch("/equipas/eliminarEquipa", {
                headers: {'Content-Type': 'application/json'},
                method: 'DELETE',
                body: JSON.stringify({
                    torneioId: equipa.torneioId,
                    equipaId: equipa.equipaId,
                    escalaoId: equipa.escalaoId
                })
            })
            .then(response => {
                if(response.ok){
                    return response.json();
                } else {
                    return Promise.reject('Não foi possível connectar à base de dados.');
                }
            })
            .then(data => {
                if(data.success){
                    Swal.fire({
                        type: 'success',
                        title: 'Equipa eliminada com sucesso!',
                        showConfirmButton: false,
                        timer: 1000,
                        onClose: () => {
                            location.reload();
                        }
                    });
                } else {
                    return Promise.reject('Não foi possível eliminar a equipa.');
                }
            })
            .catch(err => {
                console.log(err);
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: err,
                });
            });
        }
    });
}

async function imprimeListaEquipas(localidade, escalao){
    try {
        const data = await getData(`/equipas/listagem/${localidade}/${escalao}`);
        docDefinition.content = [];
        delete docDefinition.pageBreakBefore;
        docDefinition.pageMargins = [15, 105, 15, 25]

        if(data.success){
            makeHeaderOnlyTorneioInfo(docDefinition, data.torneio);
            makeEquipasContent(docDefinition, data);
            makeFooter(docDefinition, `Lista de Equipas${(data.hasOwnProperty('localidade')) ? ' - ' + data.localidade.nome : ''}${(data.hasOwnProperty('escalao')) ? ' - ' + data.escalao.designacao + ' (' + (data.escalao.sexo == 1 ? 'Masculino' : 'Feminino') + ')' : ''}`);
            pdfMake.createPdf(docDefinition).print();
        } else {
            Swal.fire({
                type: data.errType,
                title: data.errMsg,
            });
        }
    } catch(err){
        Swal.fire({
            type: 'error',
            title: 'Não foi possível obter os dados!',
        });
    }
}

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');
deleteBtns.forEach(function(item, index){
    item.addEventListener('click', async function(e){
        e.preventDefault();

        try {
            const equipaId = this.dataset.equipa;
            const escalaoId = this.dataset.escalao;

            const data = await getData(`/equipas/eliminarEquipa/${equipaId}/${escalaoId}`);
            const equipa = data.equipa;
            showDeleteMessage(equipa);
        } catch(err){
            Swal.fire({
                type: 'error',
                title: err.message,
            });
        }
    });
});

// Print Button
const printBtn = document.querySelector('.btn-print');
printBtn.addEventListener('click', function(e){
    e.preventDefault();
    const path = window.location.pathname;
    const pathComponents = path.split('/');

    let localidadeIndex = pathComponents.indexOf('localidade');
    let escalaoIndex = pathComponents.indexOf('escalao');
    localidadeIndex = (localidadeIndex != -1) ? pathComponents[localidadeIndex + 1] : 0;
    escalaoIndex = (escalaoIndex != -1) ? pathComponents[escalaoIndex + 1] : 0;

    imprimeListaEquipas(localidadeIndex, escalaoIndex);
});

//Mudança da selecção de resultados por página
/*const perPage = document.querySelector('.perPage');
perPage.addEventListener('change', function(e){
    window.location = this.options[this.selectedIndex].value;
    return false;
});*/

function closeAllCheckboxes(selectBoxesDropList){
    for(let i = 0; i < selectBoxesDropList.length; i++){
        selectBoxesDropList[i].classList.remove("customSelect__list-open");
    }
}

// CHECKBOXES
const selectBoxes = document.querySelectorAll('.customSelect__header');
const selectBoxesDropList = document.querySelectorAll('.customSelect__list');
selectBoxes.forEach((selectBox, index) => {
    selectBox.addEventListener('click', function(e){
        e.stopPropagation();
        closeAllCheckboxes(selectBoxesDropList);
        selectBoxesDropList[index].classList.toggle('customSelect__list-open');
    });
});

document.addEventListener('click', function(){
    closeAllCheckboxes(selectBoxesDropList);
});