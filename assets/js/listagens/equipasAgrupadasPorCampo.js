// playground requires you to assign document definition to a variable called dd

/*var dd = {
    pageSize: 'A4',
    pageMargins: [40, 100, 40, 60],
    header: {
        table: {
            widths: ['*'],
            body: [
                [{text: '26º Jogo da Malha - Évora', fillColor: '#eeeeee',  color: '#455cc7', alignment: 'center', bold: true, fontSize: 25, margin: [0,5,0,0]}],
                [{text: '65M - Masculinos', fillColor: '#eeeeee', color: '#333333', alignment: 'center', bold: true, fontSize: 18, margin: [0,0,0,5]}]
            ]
        },
        layout: 'noBorders',
        margin: [40, 20]
    },
	content: [
        {
            text: 'Equipas Agrupadas por Campos - 1ª Fase',
            alignment: 'center',
            bold: true,
            margin: [40, 10]
        },
        {
            table: {
                widths:['auto','auto','*'],
                headerRows: 1,
                body: [
                    [{text: 'Campo 1', style: 'tableHeader', colSpan: 3, alignment: 'left', bold: true, fontSize: 14}, {}, {}],
                    [{text: '34', fontSize: 12, margin: [15, 10, 20, 0]}, {
                        table: {
                            body: [
                                ['Luis Ângelo'],
                                ['Luis Carriço']
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, 0, 50, 0]
                    }, {text: 'Vendas Novas', fontSize: 12, margin: [0, 10, 0, 0]}],
                    [{text: '19', fontSize: 12, margin: [15, 10, 20, 0]}, {
                        table: {
                            body: [
                                ['Francisco António Pereira'],
                                ['Gabriel Grulha']
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, 0, 50, 0]
                    }, {text: 'Montemor-o-novo', fontSize: 12, margin: [0, 10, 0, 0]}]
                ]
            },
            layout: 'lightHorizontalLines',
            
        },
        {
            table: {
                widths:['auto','auto','*'],
                headerRows: 1,
                body: [
                    [{text: 'Campo 2', style: 'tableHeader', colSpan: 3, alignment: 'left', bold: true, fontSize: 14}, {}, {}],
                    [{text: '34', fontSize: 12, margin: [15, 10, 20, 0]}, {
                        table: {
                            body: [
                                ['Luis Ângelo'],
                                ['Luis Carriço']
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, 0, 50, 0]
                    }, {text: 'Vendas Novas', fontSize: 12, margin: [0, 10, 0, 0]}],
                    [{text: '19', fontSize: 12, margin: [15, 10, 20, 0]}, {
                        table: {
                            body: [
                                ['Francisco António Pereira'],
                                ['Gabriel Grulha']
                            ]
                        },
                        layout: 'noBorders',
                        margin: [0, 0, 50, 0]
                    }, {text: 'Montemor-o-novo', fontSize: 12, margin: [0, 10, 0, 0]}]
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0,20,0.0]
            
        }
    ],
	footer: function(currentPage, pageCount, pageSize) {
	    if(pageCount > 1){
            return { text: 'Pág. ' + currentPage.toString(), alignment: 'right', margin: [0,0,40,0],};
	    }
    },
};*/

function makeContent(ddContent, listaCampos){
    listaCampos.forEach(campo => {
        const content = {
            table: {
                widths:['auto',200,'*'],
                headerRows: 1,
                body: [
                    [{text: `Campo ${campo.campo}`, style: 'tableHeader', colSpan: 3, alignment: 'left', bold: true, fontSize: 14}, {}, {}],
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0,0,0,20]
        }

        campo.listaEquipas.forEach(equipa => {
            const row = [{text: `${equipa.equipaId}`, fontSize: 11, margin: [15, 10, 20, 0]}, {
                table: {
                    body: [
                        [{text: `${equipa.primeiroElemento}`, fontSize: 10}],
                        [{text: `${equipa.segundoElemento}`, fontSize: 10}]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 0, 50, 0]
            }, {text: `${equipa.localidade}`, fontSize: 11, margin: [0, 10, 0, 0]}];

            content.table.body.push(row);
        });

        ddContent.push(content);
    });
}

const printBtn = document.querySelector('.print_btn');

printBtn.addEventListener('click', function(e){
    e.preventDefault();
    const escalaoId = this.dataset.escalao;
    const fase = this.dataset.fase;

    getData(`/listagens/equipasAgrupadasPorCampos/${escalaoId}/${fase}`)
    .then(data => {
        if(data.success){
            var docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 100, 40, 60],
                content: [{
                    text: `Equipas Agrupadas por Campos - ${data.fase}ª Fase`,
                    alignment: 'center',
                    bold: true,
                    margin: [40, 10]
                 }]
            };
            makeHeader(docDefinition, data.torneio);
            makeContent(docDefinition.content, data.listaCampos);
            makeFooter(docDefinition);

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