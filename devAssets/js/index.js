import Swal from 'sweetalert2';
import axios from 'axios';

const sync = document.querySelector('.syncData');
if(sync){
    (async () => {
        // Verifica a Ligação
        const connection = await axios.get('/checkConnection');
        if(connection.data.success){
            const conectionStatus = document.querySelector('.connectionStatus');
            const connectionStatusText = document.querySelector('.connectionStatus--text');
            if(conectionStatus && connectionStatusText){
                conectionStatus.classList.remove('noConnection');
                conectionStatus.classList.add('connection');
                connectionStatusText.textContent = 'Ligação activa';
            }

            Swal.fire({
                title: 'Sincronizar',
                text: 'A sincronizar dados com a plataforma Web. Aguarde!',
                imageUrl: '/imagens/loader.gif',
                imageWidth: 120,
                imageHeight: 120,
                imageAlt: 'Custom image',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
            });

            const syncResponse = await axios.get('/syncData');
            if(syncResponse.data.success){
                Swal.fire({
                    icon: 'success',
                    title: "Sucesso",
                    text: 'Sincronização efectuada',
                    showConfirmButton: false,
                    timer: 1500
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: "Erro",
                    text: 'Não foi possível efectuar a sincronização',
                });
            }
        } else {

        }
    })();
}