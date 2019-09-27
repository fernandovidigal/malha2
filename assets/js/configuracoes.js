
// SERVER PORT
const serverPortBtn = document.querySelector('.changeServerPort-btn');
serverPortBtn.addEventListener('click', async function(e){
    e.preventDefault();
    const inputServerPort = document.getElementById('serverPort');
    const inputServerPortValue = parseInt(inputServerPort.value.trim());

    if(isNaN(inputServerPortValue)){
        showError(inputServerPort, 'Porta inválida');
    } else {
        const result = await fetch("/admin/configuracoes/definirPorta", {
            headers: {'Content-Type': 'application/json'},
            method: 'PUT',
            body: JSON.stringify({
                serverPort: inputServerPortValue
            })
        });

        const data = await result.json();

        if(data.success){
            Swal.fire({
                type: 'success',
                title: 'Porta do Servidor',
                text: 'Porta do servidor alterada com sucesso',
                showConfirmButton: true,
                onClose: () => {
                    location.reload();
                }
            });
            
        } else {
            Swal.fire({
                type: 'error',
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

        parentElement.append(errorElement);

        element.classList.add('inputError');
    }
}