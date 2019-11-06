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
                    title: 'Oops...',
                    text: 'Não foi possível eliminar o torneio',
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
                    title: 'Oops...',
                    text: 'Não foi possível eliminar a fase selecionada',
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

tabItems.forEach((item, index) => {
    item.addEventListener('click', function(){
        closeAllTabs(tabItems, tabContainers);
        item.classList.add('tabbedMenu__item-selected');
        tabContainers[index].classList.add('tabbedContainer-open');
    });
});