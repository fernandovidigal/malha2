// playground requires you to assign document definition to a variable called dd

/*var dd = {
	pageSize: 'A4',
    pageMargins: [40, 100, 40, 60],
    header: {
        table: {
            widths: ['*'],
            body: [
                [{text: `TORNEIO`, fillColor: '#eeeeee',  color: '#455cc7', alignment: 'center', bold: true, fontSize: 25, margin: [0,5,0,0]}],
                [{text: `ESCALÃO`, fillColor: '#eeeeee', color: '#333333', alignment: 'center', bold: true, fontSize: 18, margin: [0,0,0,5]}]
            ]
        },
        layout: 'noBorders',
        margin: [40, 20]
    },
    content: [
    {
        text: 'Fase da Competição: 2ª Fase',
        alignment: 'center',
        bold: true,
        margin: [0, 10]
    },
    {
        text: 'Ficha de Jogo',
        alignment: 'center',
        bold: true,
        margin: [0, 10]
    },
    {
        table: {
            widths: ['auto', '*', 'auto'],
            body: [
                [{text: '16', margin: [20, 13], rowSpan: 2}, {text: 'Manuel Joaquim Grou', margin: [10, 2]}, {text: 'Montemor-o-Novo', rowSpan: 2, margin: [10, 13]}],
                ['', {text: 'Dionísio Santos', margin: [10, 2]}, ''],
                [{text: '16', margin: [20, 13], rowSpan: 2}, {text: 'Gabriel Coelho', margin: [10, 2]}, {text: 'Montemor-o-Novo', rowSpan: 2, margin: [10, 13]}],
                ['', {text: 'Dionísio Santos', margin: [10, 2]}, '']
            ]
        },
        layout: {
            hLineWidth: function(i, node) {
                if(i === 0 || i === 2 || i === 4) {
                    return 1.5;
                } else {
                    return 1;
                }
            },
            vLineWidth: function(i, node) {
                if(i === 0 || i === 3) {
                    return 1.5;
                } else {
                    return 1;
                }
            }
        }
    },
    {
        table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*'],
            body: [
                [{text: '1º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#dddddd'}, '', {text: '2º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#dddddd'}, '', {text: '3º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#dddddd'}, ''],
                [{text: 'Equipa 22', alignment: 'center', fillColor: '#eeeeee', margin: [0,5]}, {text: 'Equipa 16', alignment: 'center', fillColor: '#eeeeee', margin: [0,5]}, {text: 'Equipa 22', alignment: 'center', fillColor: '#eeeeee', margin: [0,5]}, {text: 'Equipa 16', alignment: 'center', fillColor: '#eeeeee', margin: [0,5]}, {text: 'Equipa 22', alignment: 'center', fillColor: '#eeeeee', margin: [0,5]}, {text: 'Equipa 16', alignment: 'center', fillColor: '#eeeeee', margin: [0,5]}],
                [{text: '3', alignment: 'center', margin: [0,3]},{text: '3', alignment: 'center', margin: [0,3]},{text: '3', alignment: 'center', margin: [0,3]},{text: '3', alignment: 'center', margin: [0,3]},{text: '3', alignment: 'center', margin: [0,3]},{text: '3', alignment: 'center', margin: [0,3]}],
                [{text: '6', alignment: 'center'},{text: '6', alignment: 'center'},{text: '6', alignment: 'center'},{text: '6', alignment: 'center'},{text: '6', alignment: 'center'},{text: '6', alignment: 'center'}],
                [{text: '9', alignment: 'center'},{text: '9', alignment: 'center'},{text: '9', alignment: 'center'},{text: '9', alignment: 'center'},{text: '9', alignment: 'center'},{text: '9', alignment: 'center'}],
                [{text: '12', alignment: 'center'},{text: '12', alignment: 'center'},{text: '12', alignment: 'center'},{text: '12', alignment: 'center'},{text: '12', alignment: 'center'},{text: '12', alignment: 'center'}],
                [' ',' ',' ',' ',' ',' ']
            ]
        },
        margin: [30, 40],
        layout: {
            hLineWidth: function(i, node) {
                if(i === 0 || i === 6 || i === 7) {
                    return 1.5;
                } else {
                    return 1;
                }
            },
            vLineWidth: function(i, node) {
                if(i === 0 || i === 2 || i === 4 || i === 6) {
                    return 1.5;
                } else {
                    return 1;
                }
            },
            hLineColor: function(i, node) {
                if(i > 2 && i < 6) {
                    return 'gray';
                } else {
                    return 'black';
                }
    		},
            vLineColor: function(i, node) {
                if(i === 1 || i === 3 || i === 5) {
                    return 'gray';
                } else {
                    return 'black';
                }
    		}
        }
    }
    ]
	
}*/