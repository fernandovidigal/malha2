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
        text: 'Campo Nº 5',
        alignment: 'center',
        bold: true,
        margin: [0, 10]
    },
    {
        table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*'],
            body: [
                [
                    {text: 'Equipa 11', colSpan: 3, alignment: 'center', bold: true, fillColor: '#dddddd'}, 
                    '', '', 
                    {text: 'Equipa 39', colSpan: 3, alignment: 'center', bold: true, fillColor: '#dddddd'}, 
                    '', '',
                    {text: 'Equipa 11', colSpan: 3, alignment: 'center', bold: true, fillColor: '#dddddd'},
                    '', '',
                    {text: 'Equipa 11', colSpan: 3, alignment: 'center', bold: true, fillColor: '#dddddd'}, 
                    '', '', 
                    {text: 'Equipa 39', colSpan: 3, alignment: 'center', bold: true, fillColor: '#dddddd'}, 
                    '', '',
                    {text: 'Equipa 11', colSpan: 3, alignment: 'center', bold: true, fillColor: '#dddddd'},
                    '', ''
                ],
                [
                    {text: '1º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'}, 
                    '',
                    {text: '2º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'}, 
                    '',
                    {text: '3º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'}, 
                    '', 
                    {text: '1º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'}, 
                    '', 
                    {text: '2º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'}, 
                    '', 
                    {text: '3º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'}, 
                    '', 
                    {text: '1º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'}, 
                    '', 
                    {text: '2º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'}, 
                    '', 
                    {text: '3º Jogo', colSpan: 2, alignment: 'center', bold: true, fillColor: '#eeeeee'}, 
                    '', 
                ],
                [
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '3', alignment: 'center', margin: [0,3], fontSize: 10}
                ],
                [
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '6', alignment: 'center', margin: [0,3], fontSize: 10}
                ],
                [
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10},
                    {text: '9', alignment: 'center', margin: [0,3], fontSize: 10}
                ],
                [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
            ]
        },
        layout: {
            hLineWidth: function(i, node) {
                if(i === 0 || i === 5 || i === 6) {
                    return 1.5;
                } else {
                    return 1;
                }
            },
            vLineWidth: function(i, node) {
                if(i % 6 === 0) {
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