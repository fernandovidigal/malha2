// Delete Buttons
const deleteBtns = document.querySelectorAll('.delete_btn');

deleteBtns.forEach(function(item, index){
    item.addEventListener('click', function(e){
        e.preventDefault();
        const torneioId = this.dataset.torneio;
        const row = this.closest('tr');
        const designacao = row.querySelector('.torneio_designacao').textContent;
        const localidade = row.querySelector('.torneio_localidade').textContent;

        swal.fire({
            title: 'Tem a certeza?',
            html: "O torneio <strong>" + designacao + " (" + localidade + ")</strong> será eliminado!",
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