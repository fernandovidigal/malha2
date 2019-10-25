async function getData(url) {
    try {
        let response = await fetch(url);
        let data = await response.json();
        return data;
    } catch (err) {
        return {
        success: false,
        msg: "Não foi possível obter os dados!"
        };
    }
}

const printClassificacaoBtn = document.querySelector('.btn-print');
printClassificacaoBtn.addEventListener('click', async function(e){
    e.preventDefault();
    try {
        const escalaoId = this.dataset.escalao;
        const fase = this.dataset.fase;
        const campo = this.dataset.campo;

        const data = await getData(`/listagens/getClassificacao/${escalaoId}/${campo}/${fase}`);

        docDefinition.content = [];
        delete docDefinition.pageBreakBefore;

        if (data.success) {
            makeHeader(docDefinition, data.torneio);
        
            docDefinition.content.push({
                text: `Resultados da ${fase != 100 ? fase + "ª Fase" : "fase Final"}`,
                alignment: "center",
                fontSize: 14,
                bold: true,
                margin: [0, 0, 0, 20]
            });
        
            data.listaCampos.forEach(campo => {
                makeContentResultados(docDefinition, campo, fase, data.listaCampos.length);
            });
        
            makeFooter(docDefinition, `Resultados da ${fase != 100 ? fase + "ª Fase" : "fase Final"}${campo != 0 ? ' - Campo ' + campo : ''}`);
        
            pdfMake.createPdf(docDefinition).print();
        } else {
            Swal.fire({
                type: "error",
                title: "Oops...",
                text: data.errMsg
            });
        }
    } catch (err) {
        console.log(err);
        Swal.fire({
            type: "error",
            title: "Oops...",
            text: "Não foi possível obter os dados!"
        });
    }
});