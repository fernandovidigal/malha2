
function makeHeader(dd, torneioInfo){
    dd.header = {
        table: {
            widths: ['*'],
            body: [
                [{text: `${torneioInfo.designacao} - ${torneioInfo.localidade}`, fillColor: '#eeeeee',  color: '#455cc7', alignment: 'center', bold: true, fontSize: 25, margin: [0,5,0,0]}],
                [{text: `${torneioInfo.escalao} - ${torneioInfo.sexo}`, fillColor: '#eeeeee', color: '#455cc7', alignment: 'center', bold: true, fontSize: 18, margin: [0,0,0,5]}]
            ]
        },
        layout: 'noBorders',
        margin: [40, 20]
    }
}

function makeContent(ddContent, numEquipas, total){
    const content = {
        table: {
            headerRows: 1,
            widths: ['*', '*'],
            body: [
                ['Concelho', 'Equipas']
            ]
        },
        layout: 'lightHorizontalLines'
    }

    numEquipas.forEach(equipa => {
        const row = [{
            text: equipa.nome,
            margin: [10, 5]
        }, 
        {
            text: equipa.numEquipas,
            margin: [10, 5]
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
        margin: [10, 5],
        text: `${total}`,
        fillColor: '#eeeeee',
        bold: true
    }];

    content.table.body.push(totalRow);

    ddContent.push(content);
}

(function(){
    fetch('/listagens/getNumEquipasPorConcelho/1')
    .then(response => {
        if(response.ok){
            return response.json();
        } else {
            // TODO: throw Promise.reject
        }
    })
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
            console.log("Error");
            // TODO: throw Promise.reject
        }
    })
    .catch(err => {
        console.log(err);
    });

    /*var docDefinition = {
        content: [
        {
        table: {
        headerRows: 1,
        widths: ['*'],
        body: [
        [{text: '26º Jogo da Malha - Évora', fillColor: '#eeeeee', color: '#455cc7', alignment: 'center', bold: true, fontSize: 25, margin: [0,5,0,0]}],
        [{text: '65M', fillColor: '#eeeeee', color: '#455cc7', alignment: 'center', bold: true, fontSize: 18, margin: [0,0,0,5]}]
        ]
        },
        layout: 'noBorders'
        },
        {
           text: 'Número de Equipas por Concelho',
           alignment: 'center',
           margin: [40, 20]
        },
        {
           table: {
               headerRows: 1,
               widths: ['*', '*'],
               body: [
        ['Concelho', 'Equipas'],
        ['Arraiolos', '3'],
        ['Portel', '15'],
        [{
           border: [true, true, true, true],
           text: 'Total',
           fillColor: '#eeeeee'
        }, 
        {
           border: [false, false, false,false],
           margin: [5, 5, 5, 5],
           text: '38',
           fillColor: '#eeeeee'
        }]
        ]
           },
           layout: 'lightHorizontalLines'
        }
        ]
        
        }*/


    // Abre o pdf noutra janela
    //pdfMake.createPdf(docDefinition).print();
    // Quando se pretende abrir o pdf na mesma janela
    //pdfMake.createPdf(docDefinition).print({}, window);
})();

