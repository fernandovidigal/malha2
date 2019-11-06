import Swal from 'sweetalert2';
import axios from 'axios';

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');

deleteBtns.forEach(function(item, index){
    item.addEventListener('click', async function(e){
        e.preventDefault();
        const userId = this.dataset.user;
        const row = this.closest('tr');
        const username = row.querySelector('.utilizadores_username').textContent;

        const result = await Swal.fire({
            title: 'Tem a certeza?',
            html: "O utilizador: <strong>" + username + "</strong> será eliminado!",
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
                    url: '/admin/utilizadores/deleteUser',
                    data: {
                        id: userId
                    }
                });
                
                if(response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Utilizador eliminado com sucesso',
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
                    text: 'Não foi possível eliminar o utilizador',
                });
            }
        }
    });
});

function closeAllUserLevelChangers(userLevelChange){
    userLevelChange.forEach(el => {
        el.classList.remove('userLevelChange-open');
    });
}

// LEVEL TOOGLE
const userLevel = document.querySelectorAll('.userLevel');
const userLevelChange = document.querySelectorAll('.userLevelChange');
userLevel.forEach((level, index) => {
    level.addEventListener('click', function(e){
        e.stopPropagation();
        if(!userLevelChange[index].classList.contains('userLevelChange-open')){
            closeAllUserLevelChangers(userLevelChange);
            userLevelChange[index].classList.add('userLevelChange-open');
        } else {
            userLevelChange[index].classList.remove('userLevelChange-open');
        }
    });
});

document.addEventListener('click', function(){
    closeAllUserLevelChangers(userLevelChange);
});