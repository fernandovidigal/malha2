import Swal from 'sweetalert2';
import axios from 'axios';

// SERVER PORT
const serverPortBtn = document.querySelector('.changeServerPort-btn');
serverPortBtn.addEventListener('click', async function(e){
    e.preventDefault();
    const inputServerPort = document.getElementById('serverPort');
    const inputServerPortValue = parseInt(inputServerPort.value.trim());

    if(isNaN(inputServerPortValue)){
        showError(inputServerPort, 'Porta inválida');
    } else {
        const response = await axios({
            method: 'PUT',
            url: '/admin/configuracoes/definirPorta',
            data: {
                serverPort: inputServerPortValue
            }
        });

        if(response.data.success){
            Swal.fire({
                icon: 'success',
                title: 'Porta do servidor',
                text: 'Porta do servidor alterada com sucesso',
                showConfirmButton: true,
                onClose: () => {
                    location.reload();
                }
            });
            
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Porta do Servidor',
                text: 'Não foi possível alterar a porta do servidor',
                showConfirmButton: true
            });
        }
    }
});

function showError(element, errorText){
    const parentElement = element.parentNode;

    const error = document.querySelector('.smallWarningText');
    if(!error){
        const errorElement = document.createElement('P');
        errorElement.classList.add('smallWarningText');
        errorElement.classList.add('rowError');
        errorElement.textContent = errorText;

        parentElement.insertBefore(errorElement, element);

        element.classList.add('inputError');
    }
}

// SWITCH BUTTON
const switchBtn = document.querySelectorAll('.btn-switch');
if(switchBtn){
    switchBtn.forEach((el, i) => {
        el.addEventListener('click', async function(e){
            const otherIndex = (i == 0) ? 1 : 0;
            const selectedClass = ['btn-switch-on--selected', 'btn-switch-off--selected'];
            let msg = '';
            let errMsg = '';
            const query = {
                method: 'PUT',
                url: '/admin/configuracoes/switchFaker'
            };

            switchBtn[i].classList.add(selectedClass[i]);
            switchBtn[otherIndex].classList.remove(selectedClass[otherIndex]);

            if(e.target.classList.contains('btn-switch-on')){
                query.data = { switch: 1 };
                msg = 'Geração de equipas aleatórias Ligado';
                errMsg = 'Não foi possível ligar a geração de equipas aleatórias';
            }

            if(e.target.classList.contains('btn-switch-off')){
                query.data = { switch: 0 };
                msg = 'Geração de equipas aleatórias Desligado';
                errMsg = 'Não foi possível desligar a geração de equipas aleatórias';
            }

            const response = await axios(query);

            if(response){
                if(response.data.success){
                    Swal.fire({
                        icon: 'success',
                        title: msg,
                        showConfirmButton: false,
                        timer: 1500
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: errMsg,
                    });
                }
            }
        });
    });
}