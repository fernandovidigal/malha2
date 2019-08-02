

const printBtn = document.querySelector('.print_btn');

printBtn.addEventListener('click', function(e){
    e.preventDefault();
    const escalaoId = this.dataset.escalao;

    getData(`/listagens/getNumEquipasPorConcelho/${escalaoId}`)
    .then(data => {
        if(data.success){
            var docDefinition = {
                pageSize: 'A4',
                pageMargins: [10, 120, 10, 20],
                content: [{
                    text: 'Número de Equipas por Concelho',
                    alignment: 'center',
                    bold: true,
                    margin: [0, 10]
                }]
            };
            makeHeader(docDefinition, data.torneio);
            makeContent(docDefinition.content, data.numEquipas, data.total);

            pdfMake.createPdf(docDefinition).print();

        } else {
            return Promise.reject('Não foi possível obter dados.');
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