// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');

deleteBtns.forEach(function(item, index){
    item.addEventListener('click', function(e){
        e.preventDefault();
        const localidadeId = this.dataset.localidade;
        const row = this.closest('tr');
        const localidade = row.querySelector('.localidade').textContent;

        swal.fire({
            title: 'Tem a certeza?',
            html: "O localidade <strong>" + localidade + "</strong> será eliminada!",
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
                fetch("/admin/localidades/deleteLocalidade", {
                    headers: {'Content-Type': 'application/json'},
                    method: 'DELETE',
                    body: JSON.stringify({id: localidadeId})
                })
                .then(response => {
                    if(response.status != 200){
                        throw new Error("Não foi possível eliminar a localidade.");
                    }

                    return response.json();
                })
                .then(data => {
                    if(!data.success){
                        throw new Error("Não foi possível eliminar a localidade.");
                    }

                    location.reload();
                })
                .catch(err => {
                    Swal.fire({
                        type: 'error',
                        title: 'Oops...',
                        text: err.message,
                    });
                });
            }
        });

    });
});