// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');
deleteBtns.forEach(function(item, index){
    item.addEventListener('click', function(e){
        e.preventDefault();
        const torneioId = this.dataset.torneio;
        const row = this.closest('tr');
        const designacao = row.querySelector('.torneio_designacao').textContent;
        const localidade = row.querySelector('.torneio_localidade').textContent;

        swal.fire({
            title: 'Tem a certeza?',
            html: "O torneio <strong>" + designacao + " (" + localidade + ")</strong> será eliminado!<br>Todas as Equipas, Jogos e Resultados serão eliminados!<br><p class='smallWarningText'>Esta acção não é reversível.</p>",
            type: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, eliminar!',
            confirmButtonColor: '#d9534f',
            cancelButtonText: 'Não!',
            reverseButtons: true,
            animation: true
        })
        .then(result => {
            if(result.value){
                fetch("/admin/torneios/deleteTorneio", {
                    headers: {'Content-Type': 'application/json'},
                    method: 'DELETE',
                    body: JSON.stringify({id: torneioId})
                })
                .then(response => {
                    if(response.status != 200){
                        throw new Error("Não foi possível eliminar o torneio.");
                    }

                    return response.json();
                })
                .then(data => {
                    if(!data.success){
                        throw new Error("Não foi possível eliminar o torneio.");
                    } else {
                        Swal.fire({
                            type: 'success',
                            html: "O torneio <strong>" + designacao + " (" + localidade + ")</strong> foi eliminado com sucesso!",
                            onClose: () => {
                                location.reload();
                            }
                        });
                    }
                })
                .catch(err => {
                    Swal.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: err.message,
                      })
                });
            }
        });

    });
});

// RESET BUTTONS
const resetButtons = document.querySelectorAll('.faseReset__erase-btn');
resetButtons.forEach(btn => {
    btn.addEventListener('click', function(e){
        e.preventDefault();

        const escalaoId = parseInt(this.dataset.escalao);
        const fase = parseInt(this.dataset.fase);
        const designacao = this.dataset.designacao;

        swal.fire({
            title: 'Tem a certeza?',
            html: "A fase <strong>" + ((fase != 100) ? fase : 'Final' ) + "</strong> do escalão <strong>" + designacao + "</strong> será eliminada!<br><p class='smallWarningText'>Esta acção não é reversível.</p>",
            type: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, eliminar!',
            confirmButtonColor: '#d9534f',
            cancelButtonText: 'Não!',
            reverseButtons: true,
            animation: true
        })
        .then((result) => {
            if(result.value){
                fetch("/admin/torneios/deleteFase", {
                    headers: {'Content-Type': 'application/json'},
                    method: 'DELETE',
                    body: JSON.stringify({
                        escalaoId: escalaoId,
                        fase: fase
                    })
                })
                .then(response => {
                    if(response.ok){
                        return response.json();
                    } else {
                        return Promise.reject('Não foi possível eliminar a fase!');
                    }
                })
                .then(data => {
                    if(data.success){
                        Swal.fire({
                            type: 'success',
                            title: `Fase ${((data.fase != 100) ? data.fase : 'Final')} eliminada com sucesso!`,
                            onClose: () => {
                                location.reload();
                            }
                        });
                    } else {
                        return Promise.reject(data.errMsg);
                    }
                })
                .catch(err => {
                    console.log(err);
                    Swal.fire({
                        type: 'error',
                        title: err,
                    });
                });
            }
        });
    });
});


// TAB CONTROLLER
function closeAllTabs(tabItems, tabContainers){
    tabItems.forEach((item, index) => {
        item.classList.remove('tabbedMenu__item-selected');
        tabContainers[index].classList.remove('tabbedContainer-open');
    });
}
const tabItems = document.querySelectorAll('.tabbedMenu__item');
const tabContainers = document.querySelectorAll('.tabbedContainer');

tabItems.forEach((item, index) => {
    item.addEventListener('click', function(){
        closeAllTabs(tabItems, tabContainers);
        item.classList.add('tabbedMenu__item-selected');
        tabContainers[index].classList.add('tabbedContainer-open');
    });
});