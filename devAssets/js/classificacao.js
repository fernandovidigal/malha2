import Swal from 'sweetalert2';
import axios from 'axios';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { docDefinition, makeHeader, makeContentResultados, makeFooter } from './printFunctions';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const printClassificacaoBtn = document.querySelector('.btn-print');
if(printClassificacaoBtn){
    printClassificacaoBtn.addEventListener('click', async function(e){
        e.preventDefault();
        try {
            const escalaoId = this.dataset.escalao;
            const fase = this.dataset.fase;
            const campo = this.dataset.campo;

            const response = await axios(`/listagens/getClassificacao/${escalaoId}/${campo}/${fase}`);
            const data = response.data;

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
                    icon: "error",
                    title: "Oops...",
                    text: data.errMsg
                });
            }
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Não foi possível obter os dados!"
            });
        }
    });
}