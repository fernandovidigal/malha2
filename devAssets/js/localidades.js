import Swal from 'sweetalert2';
import axios from 'axios';

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');

deleteBtns.forEach(function(item, index){
    item.addEventListener('click', async function(e){
        e.preventDefault();
        const localidadeId = this.dataset.localidade;
        const row = this.closest('tr');
        const localidade = row.querySelector('.localidade').textContent;

        const result = await Swal.fire({
            title: 'Tem a certeza?',
            html: "A localidade: <strong>" + localidade + "</strong> será eliminada!",
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
                    url: '/admin/localidades/deleteLocalidade',
                    data: {
                        id: localidadeId
                    }
                });
                
                if(response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Localidade eliminada com sucesso',
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
                    text: 'Não foi possível eliminar a localidade',
                });
            }
        }
    });
});