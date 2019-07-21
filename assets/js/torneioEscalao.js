// Delete Buttons
const alteraEscalaoBtns = document.querySelectorAll('.alteraNumCampos_btn');

alteraEscalaoBtns.forEach(function(item, index){
    item.addEventListener('click', function(e){
        e.preventDefault();
        const escalaoId = this.dataset.escalao;

        fetch(`/torneio/getEscalaoInfo/${escalaoId}`)
        .then(response => {
            if(response.ok){
                return response.json();
            } else {
                return Promise.reject('Não foi possível connectar à base de dados.');
            }
        })
        .then(data => {
            if(data.success){
                const escalao = data.escalao;
                Swal.fire({
                    title: 'Alterar número de campos',
                    html: `<strong>Escalão:</strong> ${escalao.designacao} <small>(${escalao.sexo})</small>`,
                    input: 'number',
                    inputValue: escalao.numCampos,
                    inputAttributes: {
                      autocapitalize: 'off',
                      autofocus: true,
                      min: 0
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Alterar',
                    showLoaderOnConfirm: true,
                    preConfirm: (campos) => {
                        return fetch("/torneio/setEscalaoNumCampos", {
                            headers: {'Content-Type': 'application/json'},
                            method: 'PUT',
                            body: JSON.stringify({
                                torneioId: escalao.torneioId,
                                escalaoId: escalao.escalaoId,
                                numCampos: campos
                            })
                        })
                        .then(response => {
                            if(response.ok){
                                return response.json();
                            } else {
                                return Promise.reject('Não foi possível connectar à base de dados.');
                            }
                        })
                        .catch(err => {
                            Swal.fire({
                                type: 'error',
                                title: 'Oops...',
                                text: err,
                            });
                        });
                    },
                    inputValidator: (numCampos) => {
                        console.log("Aqui");
                        console.log(numCampos);
                        if(numCampos != '' && numCampos != 0){
                            if(Math.log2(parseInt(numCampos)) % 1 !== 0){
                                return "Número de campos inválido. O número de campos deve ser uma potência de 2. (Ex: 2, 4, 8, 16, ...)";
                            }
                        } else if(numCampos == 0){
                            return "O número de campos não pode ser 0.";
                        }
                    },
                    allowOutsideClick: () => !Swal.isLoading()
                }).then((data) => {
                    if(data.value.success){
                        Swal.fire({
                            type: 'success',
                            title: 'Número de campos actualizado com sucesso.',
                            showConfirmButton: false,
                            timer: 1000,
                            onClose: () => {
                                location.reload();
                            }
                        });
                    } else {
                        return Promise.reject('Não foi actualiazar o número de campos.');
                    }
                })
            } else {
                return Promise.reject('Não foi possível obter dados do escalão.');
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