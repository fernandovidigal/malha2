import Swal from 'sweetalert2';
import axios from 'axios';

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');
deleteBtns.forEach(function(item, index){
    item.addEventListener('click', async function(e){
        e.preventDefault();
        const torneioId = this.dataset.torneio;
        const row = this.closest('tr');
        const designacao = row.querySelector('.torneio_designacao').textContent;
        const localidade = row.querySelector('.torneio_localidade').textContent;

        const result = await Swal.fire({
            title: 'Tem a certeza?',
            html: "<strong>" + designacao + " (" + localidade + ")</strong> será eliminado!<br><p class='swal-apart'>Todas as Equipas, Jogos e Resultados serão eliminados!</p><p class='smallWarningText'>Esta acção não é reversível.</p>",
            icon: 'question',
            showCancelButton: true,
            cancelButtonColor: '#398ad0',
            confirmButtonText: 'Sim, eliminar!',
            confirmButtonColor: '#d9534f',
            cancelButtonText: 'Não!',
            reverseButtons: true,
            animation: true
        });

        if(result.value){
            try {
                const response = await axios({
                    method: 'DELETE',
                    url: '/admin/torneios/deleteTorneio',
                    data: {
                        id: torneioId
                    }
                });
                
                if(response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Torneio eliminado com sucesso',
                        showConfirmButton: false,
                        timer: 1500,
                        onClose: () => {
                            location.reload();
                        }
                    });
                } else {
                    throw new Error();
                }
            } catch(err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Não foi possível eliminar o torneio',
                });
            }
        }
    });
});

// RESET BUTTONS
const resetButtons = document.querySelectorAll('.btn-faseReset');
resetButtons.forEach(btn => {
    btn.addEventListener('click', async function(e){
        e.preventDefault();

        const escalaoId = parseInt(this.dataset.escalao);
        const fase = parseInt(this.dataset.fase);
        const designacao = this.dataset.designacao;
        const torneioId = this.dataset.torneio;

        const result = await Swal.fire({
            title: 'Tem a certeza?',
            html: "A <strong>Fase " + ((fase != 100) ? fase : 'Final' ) + "</strong> do escalão <strong>" + designacao + "</strong> será eliminada!",
            icon: 'question',
            showCancelButton: true,
            cancelButtonColor: '#398ad0',
            confirmButtonText: 'Sim, eliminar!',
            confirmButtonColor: '#d9534f',
            cancelButtonText: 'Não!',
            reverseButtons: true,
            animation: true
        });

        if(result.value){
            try {
                const response = await axios({
                    method: 'DELETE',
                    url: '/admin/torneios/deleteFase',
                    data: {
                        torneioId,
                        escalaoId,
                        fase
                    }
                });
                
                if(response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        html: `<strong>Fase ${((response.data.fase != 100) ? response.data.fase : 'Final')}</strong> do escalão <strong>${designacao}</strong> eliminada com sucesso!`,
                        showConfirmButton: false,
                        timer: 1500,
                        onClose: () => {
                            const url = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/admin/torneios/editarTorneio/${torneioId}/3`;
                            window.location.assign(url);
                        }
                    });
                } else {
                    throw new Error();
                }
            } catch(err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Não foi possível eliminar a fase selecionada',
                });
            }
        }
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
const actionBtnsBar = document.querySelector('.inputBtnBar');

tabItems.forEach((item, index) => {
    item.addEventListener('click', function(){
        closeAllTabs(tabItems, tabContainers);
        item.classList.add('tabbedMenu__item-selected');
        tabContainers[index].classList.add('tabbedContainer-open');
        if(index == 3){
            actionBtnsBar.classList.add('inputBtnBar--hide');
        } else {
            actionBtnsBar.classList.remove('inputBtnBar--hide');
        }
    });
});

// REINICIALIZAR TORNEIO
const resetBtn = document.querySelector('.ResetTorneio-btn');
if(resetBtn){
    resetBtn.addEventListener('click', async function(e){
        const torneioId = this.dataset.torneio;

        const result = await Swal.fire({
            title: 'Reinicializar o Torneio',
            html: "<strong>Tem a certeza?</strong><br><p class='swal-apart'>Todos os Jogos, Fases, Resultados e Distribuição de Equipas será elimiado</p><p class='smallWarningText'>Esta acção não é reversível.</p>",
            icon: 'question',
            showCancelButton: true,
            cancelButtonColor: '#398ad0',
            confirmButtonText: 'Sim, eliminar!',
            confirmButtonColor: '#d9534f',
            cancelButtonText: 'Não!',
            reverseButtons: true,
            animation: true
        });

        if(result.value){
            try {
                const response = await axios({
                    method: 'DELETE',
                    url: '/admin/torneios/resetTorneio',
                    data: {
                        torneioId
                    }
                });

                if(response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Sucesso',
                        text: 'Torneio reinicializado'
                    });
                } else {
                    throw new Error();
                }
                
            } catch(err) {
                console.log(err);
                Swal.fire({
                    icon: 'error',
                    title: 'Não foi possível reinicializar o torneio',
                });
            }
        }
    });
}

const deleteEquipasBtn = document.querySelector('.DeleteEquipasTorneio-btn');
if(deleteEquipasBtn){
    deleteEquipasBtn.addEventListener('click', async function(e){
        const torneioId = this.dataset.torneio;

        const result = await Swal.fire({
            icon: 'question',
            title: 'Eliminar Equipas',
            html: "<strong>Tem a certeza?</strong><br><p class='swal-apart'>Todos as Equipas serão eliminadas</p><p class='smallWarningText'>Esta acção não é reversível.</p>",
            showCancelButton: true,
            cancelButtonColor: '#398ad0',
            confirmButtonText: 'Sim, eliminar!',
            confirmButtonColor: '#d9534f',
            cancelButtonText: 'Não!',
            reverseButtons: true,
            animation: true
        });

        if(result.value){
            try {
                const response = await axios({
                    method: 'DELETE',
                    url: '/admin/torneios/deleteEquipas',
                    data: {
                        torneioId
                    }
                });

                console.log(response);

                if(response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Sucesso',
                        text: 'Equipas Eliminadas'
                    });
                } else {
                    throw new Error();
                }
                
            } catch(err) {
                console.log(err);
                Swal.fire({
                    icon: 'error',
                    title: 'Não foi possível eliminar as equipas',
                });
            }
        }
    });
}