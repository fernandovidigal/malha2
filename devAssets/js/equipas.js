import Swal from 'sweetalert2';
import axios from 'axios';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { docDefinition, makeHeaderOnlyTorneioInfo, makeEquipasContent, makeFooter } from './printFunctions';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

async function showDeleteMessage(equipa){
    const result = await Swal.fire({
        title: 'Deseja eliminar a equipa?',
        html: `
            <div class="deleteTeam">
                <p>${equipa.equipaId}</p>
                <div class="deleteTeam__elementos">
                    <p>${equipa.primeiroElemento}</p>
                    <p>${equipa.segundoElemento}</p>
                </div>
                <p>${equipa.localidade}</p>
                <p>${equipa.escalao}<br><small>(${equipa.sexo == 1 ? 'Masculino' : 'Feminino'})</small></p>
            </div>`,
        icon: 'question',
        customClass: 'swal-wide',
        showCancelButton: true,
        confirmButtonText: 'Sim, eliminar!',
        confirmButtonColor: '#d9534f',
        cancelButtonText: 'Não!',
        reverseButtons: true,
        animation: true
    });

    if(result.value){
        try {
            const response = await axios({
                method: 'DELETE',
                url: '/equipas/eliminarEquipa',
                data: {
                    torneioId: equipa.torneioId,
                    equipaId: equipa.equipaId,
                    escalaoId: equipa.escalaoId
                }
            });
            
            if(response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Equipa eliminada com sucesso',
                    showConfirmButton: false,
                    timer: 1500,
                    onClose: () => {
                        location.reload();
                    }
                });
            } else {
                throw new Error();
            }
        } catch(err) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Não foi possível eliminar a equipa',
            });
        }
    }
}

async function imprimeListaEquipas(localidade, escalao){
    try {
        const response = await axios(`/equipas/listagem/${localidade}/${escalao}`);
        const data = response.data;

        docDefinition.content = [];
        delete docDefinition.pageBreakBefore;
        docDefinition.pageMargins = [15, 80, 15, 25]

        if(data.success){
            makeHeaderOnlyTorneioInfo(docDefinition, data.torneio);
            makeEquipasContent(docDefinition, data);
            makeFooter(docDefinition, `Lista de Equipas${(data.hasOwnProperty('localidade')) ? ' - ' + data.localidade.nome : ''}${(data.hasOwnProperty('escalao')) ? ' - ' + data.escalao.designacao + ' (' + (data.escalao.sexo == 1 ? 'Masculino' : 'Feminino') + ')' : ''}`);
            pdfMake.createPdf(docDefinition).print();
        } else {
            Swal.fire({
                type: data.errType,
                title: data.errMsg,
            });
        }
    } catch(err){
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível obter dados da equipa',
        });
    }
}

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');
deleteBtns.forEach(function(item, index){
    item.addEventListener('click', async function(e){
        e.preventDefault();
        try {
            const equipaId = this.dataset.equipa;
            const escalaoId = this.dataset.escalao;

            const response = await axios({
                method: 'GET',
                url: `/equipas/eliminarEquipa/${equipaId}/${escalaoId}`
            });

            const equipa = response.data.equipa;
            showDeleteMessage(equipa);
        } catch(err){
            Swal.fire({
                icon: 'error',
                title: 'Não foi possível eliminar a equipa',
            });
        }
    });
});

// Print Button
const printBtn = document.querySelector('.btn-print');
printBtn.addEventListener('click', function(e){
    e.preventDefault();
    try {
        const path = window.location.pathname;
        const pathComponents = path.split('/');
    
        let localidadeIndex = pathComponents.indexOf('localidade');
        let escalaoIndex = pathComponents.indexOf('escalao');
        localidadeIndex = (localidadeIndex != -1) ? pathComponents[localidadeIndex + 1] : 0;
        escalaoIndex = (escalaoIndex != -1) ? pathComponents[escalaoIndex + 1] : 0;
    
        imprimeListaEquipas(localidadeIndex, escalaoIndex);
    } catch(err) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível gerar PDF',
        });
    }
});