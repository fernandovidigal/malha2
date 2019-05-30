// Delete Buttons
const deleteBtns = document.querySelectorAll('.delete_btn');

deleteBtns.forEach(function(item, index){
    item.addEventListener('click', function(e){
        e.preventDefault();

        swal.fire({
            title: 'Tem a certeza?',
            text: "Esta acção não pode ser revertida!",
            type: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, eliminar!',
            cancelButtonText: 'Não!',
            reverseButtons: true,
        })
        .then(result => {
            if(result.value){
                alert("sucesso");
            } else {
                e.preventDefault();
            }
        });

    });
});