function makeContent(ddContent, numEquipas, total){
    const content = {
        table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
                [{text: 'Concelho', margin: [10, 5]}, {text: 'Equipas', margin: [10, 5]}]
            ]
        },
        layout: 'lightHorizontalLines'
    }

    numEquipas.forEach(equipa => {
        const row = [{
            text: equipa.nome,
            margin: [20, 5]
        }, 
        {
            text: equipa.numEquipas,
            margin: [20, 5]
        }];
        content.table.body.push(row);
    });

    const totalRow = [{
        margin: [10, 5],
        text: 'Total',
        fillColor: '#eeeeee',
        bold: true
    }, 
    {
        margin: [20, 5],
        text: `${total}`,
        fillColor: '#eeeeee',
        bold: true
    }];

    content.table.body.push(totalRow);

    ddContent.push(content);
}

const printBtn = document.querySelector('.print_btn');

printBtn.addEventListener('click', function(e){
    e.preventDefault();
    const escalaoId = this.dataset.escalao;

    getData(`/listagens/getNumEquipasPorConcelho/${escalaoId}`)
    .then(data => {
        if(data.success){
            var docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 100, 40, 60],
                content: [{
                    text: 'Número de Equipas por Concelho',
                    alignment: 'center',
                    bold: true,
                    margin: [40, 10]
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