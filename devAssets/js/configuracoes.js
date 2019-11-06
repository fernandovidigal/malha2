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