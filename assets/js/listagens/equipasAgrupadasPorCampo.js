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
            id: 'tabela',
            margin: [0,0,0,10]
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
                    margin: [0, 5]
                }],
                pageBreakBefore: function(currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
                    if (currentNode.id === 'tabela' && currentNode.pageNumbers.length != 1) {
                      return true;
                    }
                    return false;
                  },
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