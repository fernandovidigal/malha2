import Swal from 'sweetalert2';
import axios from 'axios';

const sync = document.querySelector('.syncData');
if(sync){
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

    (async () => {
        const syncResponse = await axios.get('/syncData');
        console.log();
        if(!syncResponse.data.success){
            Swal.fire({
                icon: 'error',
                title: "Erro",
                text: syncResponse.data.message
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: "Sucesso",
                text: 'Sincronização efectuada'
            });
        }
    })();
}