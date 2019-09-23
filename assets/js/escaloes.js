// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');

deleteBtns.forEach(function(item, index){
    item.addEventListener('click', function(e){
        e.preventDefault();
        const escalaoId = this.dataset.escalao;
        const row = this.closest('tr');
        const designacao = row.querySelector('.escalao').textContent;
        const sexo = row.querySelector('.sexo').textContent;

        swal.fire({
            title: 'Tem a certeza?',
            html: "O escalão <strong>" + designacao + " (" + sexo + ")</strong> será eliminado!",
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
                fetch("/admin/escaloes/deleteEscalao", {
                    headers: {'Content-Type': 'application/json'},
                    method: 'DELETE',
                    body: JSON.stringify({id: escalaoId})
                })
                .then(response => {
                    if(response.status != 200){
                        throw new Error("Não foi possível eliminar o escalão.");
                    }

                    return response.json();
                })
                .then(data => {
                    if(!data.success){
                        throw new Error("Não foi possível eliminar o escalão.");
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