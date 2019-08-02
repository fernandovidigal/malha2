

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