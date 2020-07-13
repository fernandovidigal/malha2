const { default: Swal } = require("sweetalert2");

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
        allowEscapeKey: false
    });
}