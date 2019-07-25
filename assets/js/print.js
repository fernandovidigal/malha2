
function makeHeader(dd, torneioInfo){
    dd.header = {
        table: {
            widths: ['*'],
            body: [
                [{text: `${torneioInfo.designacao} - ${torneioInfo.localidade}`, fillColor: '#eeeeee',  color: '#455cc7', alignment: 'center', bold: true, fontSize: 25, margin: [0,5,0,0]}],
                [{text: `${torneioInfo.escalao} - ${torneioInfo.sexo}`, fillColor: '#eeeeee', color: '#333333', alignment: 'center', bold: true, fontSize: 18, margin: [0,0,0,5]}]
            ]
        },
        layout: 'noBorders',
        margin: [40, 20]
    }
}

function makeFooter(dd){
    dd.footer = function(currentPage, pageCount, pageSize) {
	    if(pageCount > 1){
            return { text: 'Pág. ' + currentPage.toString(), alignment: 'right', margin: [0,0,40,0],};
	    }
    }
}

async function getData(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}


// Abre o pdf noutra janela
//pdfMake.createPdf(docDefinition).print();
// Quando se pretende abrir o pdf na mesma janela
//pdfMake.createPdf(docDefinition).print({}, window);

