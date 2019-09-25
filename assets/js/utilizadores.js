// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');

deleteBtns.forEach(function(item, index){
    item.addEventListener('click', function(e){
        e.preventDefault();
        const userId = this.dataset.user;
        const row = this.closest('tr');
        const username = row.querySelector('.utilizadores_username').textContent;

        swal.fire({
            title: 'Tem a certeza?',
            html: "O utilizador <strong>" + username + "</strong> será eliminado!",
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
                fetch("/admin/utilizadores/deleteUser", {
                    headers: {'Content-Type': 'application/json'},
                    method: 'DELETE',
                    body: JSON.stringify({id: userId})
                })
                .then(response => {
                    if(response.status != 200){
                        throw new Error("Não foi possível eliminar o utilizador.");
                    }

                    return response.json();
                })
                .then(data => {
                    if(!data.success){
                        throw new Error("Não foi possível eliminar o utilizador.");
                    }

                    location.reload();
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