// Delete Buttons
const deleteBtns = document.querySelectorAll('.delete_btn');

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
                    equipaId: equipa.equipaId,
                    torneioId: equipa.torneioId
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
                Swal.fire({
                    type: 'error',
                    title: 'Oops...',
                    text: err,
                });
            });
        }
    });
}

deleteBtns.forEach(function(item, index){
    item.addEventListener('click', function(e){
        e.preventDefault();
        const equipaId = this.dataset.equipa;

        // Obter dados da equipa
        fetch(`/equipas/eliminarEquipa/${equipaId}`)
        .then(response => {
            if(response.ok){
                return response.json();
            } else {
                return Promise.reject('Não foi possível connectar ao servidor.');
            }
        })
        .then(data => {
            if(data.success){
                const equipa = data.equipa;
                showDeleteMessage(equipa);
            } else {
                return Promise.reject('Não foi possível obter os dados da equipa.');
            }
        })
        .catch(err => {
            Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: err,
            });
        });
    });
});