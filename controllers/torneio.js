const sequelize = require('../helpers/database');
const { validationResult } = require('express-validator/check');
const torneioHelpers = require('../helpers/torneioHelperFunctions');
const dbFunctions = require('../helpers/DBFunctions');

exports.getStarting = async (req, res, next) => {
    try {
        const torneio = await dbFunctions.getTorneioInfo();

        // Não existe torneio registado ou activo
        if(!torneio){
            req.flash('error', 'Não existem torneios activos.');
            return res.redirect("../");
        }

        const torneioId = torneio.torneioId;

        // 1. Verificar se existem equipas (não se pode fazer um torneio sem equipas)
        // e se exitem pelo menos 2 equipas
        const numEquipas = await dbFunctions.getNumEquipas(torneioId);
        if(numEquipas == 0){
            const error = { msg: "Não existem equipas registadas no torneio."};
            return res.render('torneio/index', {torneio: torneio, messages: error, breadcrumbs: req.breadcrumbs()});
        } else if(numEquipas < 2){
            const error = { msg: "Existem menos de 2 equipas registadas."};
            return res.render('torneio/index', {torneio: torneio, messages: error, breadcrumbs: req.breadcrumbs()});
        }

        // Lista dos Escalões com equipas registadas
        const _listaEscaloes = dbFunctions.getEscaloesComEquipas(torneioId);
        const _listaCamposPorEscalao = dbFunctions.getNumCamposEscaloes(torneioId);
        const _listaNumEquipasPorCadaEscalao = dbFunctions.getNumEquipasPorCadaEscalao(torneioId);
        const _listaEscaloesComJogosDistribuídos = dbFunctions.getNumJogosAllEscaloes(torneioId);
        const listaDeCamposPotenciaDeDois = [2,4,8,16,32,64,128];

        const [listaEscaloes, listaCamposPorEscalao, listaNumEquipasPorCadaEscalao, listaEscaloesComJogosDistribuídos] = await Promise.all([_listaEscaloes, _listaCamposPorEscalao, _listaNumEquipasPorCadaEscalao, _listaEscaloesComJogosDistribuídos]);

        // Adiciona o número de campos definidos a cada escalão e verifica se existem
        // escalões ainda sem campos definidos
        let existemNumCamposNaoDefinidos = false;
        const listaEscaloesEditaveis = [];
        for(const escalao of listaEscaloes){
            // Verifica se já foram distríbuidos jogos para determinado escalão
            // se já foram então o número de campos não pode ser alterado
            const editavel = listaEscaloesComJogosDistribuídos.find(el => el.escalaoId == escalao.escalaoId);
            if(!editavel){
                // Verifica se o escalão já tem o número de campos definidos
                const campos = listaCamposPorEscalao.find(element => element.escalaoId == escalao.escalaoId);
                if(campos){
                    if(campos.numCampos != 0){
                        escalao.campos = campos.numCampos;
                    } else {
                        existemNumCamposNaoDefinidos = true;
                    }
                } else {
                    existemNumCamposNaoDefinidos = true;
                }

                // Procura na lista de com o número de equipas por escalão, qual o número de equipas para determinado escalão
                const numEquipas = listaNumEquipasPorCadaEscalao.find(element => element.escalaoId == escalao.escalaoId);
                escalao.numEquipas = numEquipas.numEquipas;

                // Calcula o número de campos mínimo para o número de equipas
                const numCamposMaximo = Math.floor(escalao.numEquipas / 3);;
                for(let i = 0; i < listaDeCamposPotenciaDeDois.length; i++){
                    if(numCamposMaximo < listaDeCamposPotenciaDeDois[i]){
                        escalao.numCamposMax = listaDeCamposPotenciaDeDois[i-1];
                        break;
                    }
                }

                listaEscaloesEditaveis.push(escalao);
            }
        }

        if(existemNumCamposNaoDefinidos){
            req.breadcrumbs('Definir Número de Campos', '/torneio/definirNumeroCampos');
            return res.render('torneio/definirNumeroCampos', {torneio: torneio, escaloes: listaEscaloesEditaveis, breadcrumbs: req.breadcrumbs()});
        }

        if(numEquipas > 0 && !existemNumCamposNaoDefinidos){
            const escaloesMasculinos = [];
            const escaloesFemininos = [];
            let numTotalJogos = 0;

            // Percorre todos os escalões
            for(const escalao of listaEscaloes){
                // Informações sobre o escalão
                const _escalao = {
                    escalaoId: escalao.escalaoId,
                    designacao: escalao.designacao,
                    sexo: escalao.sexo,
                    numTotalCampos: escalao.campos,
                    existeVencedor: false
                }

                // Verificar se o escalão tem mais de 2 equipas
                // Se não tiver, mostrar alerta
                const _numEquipas = dbFunctions.getNumEquipasPorEscalao(torneioId, escalao.escalaoId);
                
                // Verifica em que fase do torneio se encontra o escalão
                const _fase = dbFunctions.getFaseTorneioPorEscalao(torneioId, escalao.escalaoId);

                const [numEquipas, fase] = await Promise.all([_numEquipas, _fase]);
                _escalao.numEquipas = numEquipas;
                _escalao.fase = (fase == null) ? 0 : fase.fase;

                // Verifica o número de jogos que determinada fase já tem distribuidos
                const numJogos = await dbFunctions.getNumeroJogosPorFase(torneioId, _escalao.escalaoId, _escalao.fase);
                _escalao.numJogos = numJogos;

                // Serve para verificar se já existem jogos distribuídos para algum escalão
                // Se for 0, então nenhum escalão tem jogos distribuídos
                numTotalJogos += numJogos;

                // Se já existem jogos distribuídos para determinado escalão, então o número de jogos é maior que 0
                // então obtem as informações sobre os jogos
                if(numJogos > 0){

                    // Array de cada campo individual
                    _escalao.campos = [];

                    // Mantem o registo do número de jogos completos
                    // Se o número de campos completos for igual ao número de campos total do escalão então a fase está concluída
                    let numCamposCompletos = 0;

                    // Obtem a lista de campos para determinado escalão em determinada fase
                    // [1,2,3,4,5,6,7,8,9,...]
                    const listaCampos = await dbFunctions.getAllCampos(torneioId, _escalao.escalaoId, _escalao.fase);
                    _escalao.numCamposFase = listaCampos.length;
                    
                    // Para cada campo da lista de campos
                    for(const campo of listaCampos){
                        // guarda o número do campo
                        const numCampo = campo.num;

                        // Determina para determinado escalão e fase, o número de jogos total para o campo e
                        // o número de jogos já jogados
                        const _numJogosParaJogar = await dbFunctions.getNumGamesPorCampo(torneioId, _escalao.escalaoId, _escalao.fase, numCampo);
                        const _numJogosJogados = await dbFunctions.getNumGamesPlayed(torneioId, _escalao.escalaoId, _escalao.fase, numCampo);

                        const [numJogosParaJogar, numJogosJogados] = await Promise.all([_numJogosParaJogar, _numJogosJogados]);

                        const campoData = {
                            campo: numCampo,
                            completo: ((numJogosParaJogar - numJogosJogados[0].count) > 0) ? false: true
                        }
                        _escalao.campos.push(campoData);

                        // Verifica o número de campos completos
                        if(numJogosParaJogar == numJogosJogados[0].count){
                            numCamposCompletos++;
                        }
                    }

                    // Guarda e veriffica se os jogos de todos os campos já foram jogados
                    _escalao.numCamposCompletos = numCamposCompletos;
                    _escalao.todosCamposCompletos = (_escalao.numCamposFase == _escalao.numCamposCompletos) ? true : false;

                    // Verifica se já existe vencedor
                    if(_escalao.fase == 100 && _escalao.todosCamposCompletos){
                        const vencedor = await torneioHelpers.processaClassificacao(torneioId, _escalao.escalaoId, _escalao.fase, 1);
                        _escalao.existeVencedor = true;
                        _escalao.equipaVencedora = vencedor[0].classificacao[0];
                    }
                }
                
                if(_escalao.sexo == 0){
                    escaloesFemininos.push(_escalao);
                } else {
                    escaloesMasculinos.push(_escalao);
                }
            }

            res.render('torneio/selecionaEscalao', {torneio: torneio, numTotalJogos: numTotalJogos, escaloesMasculinos: escaloesMasculinos, escaloesFemininos: escaloesFemininos, breadcrumbs: req.breadcrumbs()});
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Ocorreu um erro! Não foi possível aceder à página do torneio.');
        res.redirect('../');
    }
}

exports.setNumeroCampos = async (req, res, next) => {
    try{
        req.breadcrumbs('Definir Número de Campos', '/torneio/definirNumeroCampos');
        const errors = validationResult(req).array({ onlyFirstError: true });
        const torneio = await dbFunctions.getTorneioInfo();

        const _listaEscaloes = dbFunctions.getEscaloesComEquipas(torneio.torneioId);
        const _listaNumEquipasPorCadaEscalao = dbFunctions.getNumEquipasPorCadaEscalao(torneio.torneioId);

        const [listaEscaloes, listaNumEquipasPorCadaEscalao] = await Promise.all([_listaEscaloes, _listaNumEquipasPorCadaEscalao]);
        const listaEscaloesEditados = [];

        for(const escalao of listaEscaloes){
        
            // Procura na lista com o número de equipas pro escalão, qual o número de equipa para determinado escalão
            const numEquipas = listaNumEquipasPorCadaEscalao.find(element => element.escalaoId == escalao.escalaoId);
            escalao.numEquipas = numEquipas.numEquipas;

            const numCampos = req.body[escalao.escalaoId];
            if(numCampos){
                // Verifica se o número de campos é potência de 2
                if(Math.log2(numCampos) % 1 === 0){
                    escalao.campos = numCampos;
                
                    // Verifica se existem equipas suficientes para o número de campos
                    if(numCampos * 3 > escalao.numEquipas){
                        errors.push({
                            msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Equipas insuficientes para o número de campos selecionado.'
                        });
                    }
                } else {
                    if(numCampos == 0){
                        errors.push({
                            msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Número de campos deve ser superior a 0.'
                        });
                    } else {
                        errors.push({
                            msg: 'Escalão: <strong>' + escalao.designacao + ' (' + ((escalao.sexo == 1) ? 'Masculino' : 'Feminino') + ')</strong> - Número de campos inválido.'
                        });
                    }
                }

                listaEscaloesEditados.push(escalao);
            }

            const listaDeCamposPotenciaDeDois = [2,4,8,16,32,64,128];
            // Calcula o número de campos mínimo para o número de equipas
            const numCamposMaximo = Math.floor(escalao.numEquipas / 3);
            for(let i = 0; i < listaDeCamposPotenciaDeDois.length; i++){
                if(numCamposMaximo < listaDeCamposPotenciaDeDois[i]){
                    escalao.numCamposMax = listaDeCamposPotenciaDeDois[i-1];
                    break;
                }
            }
        }

        if(errors.length > 0){
            res.render('torneio/definirNumeroCampos', {validationErrors: errors, torneio: torneio, escaloes: listaEscaloesEditados, breadcrumbs: req.breadcrumbs()});
        } else {

            let transaction;

            try {
                transaction = await sequelize.transaction();

                await dbFunctions.processaUpdateCampos(transaction, torneio.torneioId, listaEscaloesEditados);

                await transaction.commit();

            } catch(err) {
                console.log(err);
                await transaction.rollback();
                throw err;
            }

            if(transaction.finished === 'commit'){
                req.flash("success", "Número de campos do torneio foi actualizado com sucesso!");
                res.redirect('/torneio');
            } else {
                req.flash("error", "Não foi possível definir o número de campos para o torneio.");
                res.redirect('/torneio');
            }
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Ocorreu um erro! Não foi possível definir o número de campos para o torneio.');
        res.redirect('/torneio');
    }
}

exports.distribuirTodasEquipas = async (req, res, next) => {
    try{
        const torneio = await dbFunctions.getTorneioInfo();

        const escaloesDistribuidos = await torneioHelpers.distribuiEquipasPorCampos(torneio.torneioId);
        
        let distribuidos = 0;
        let naoDistribuidos = 0;
        escaloesDistribuidos.forEach(escalao => {
            (escalao.sucesso) ? distribuidos++ : naoDistribuidos++;
        });

        if(naoDistribuidos > 0 && naoDistribuidos < escaloesDistribuidos.length){
            req.flash('warning', 'Existem escalões da qual não foi possível distribuir equipas.');
        } else if(naoDistribuidos == escaloesDistribuidos.length) {
            req.flash('warning', 'Existem escalões da qual não foi possível distribuir equipas.');
        } else {
            req.flash('success', 'Todos as equipas foram distribuídas, no respectivo escalão, com sucesso.');
        }
        
        res.redirect('/torneio');
    } catch(err) {
        console.log(err);
        req.flash('error', 'Ocorreu um erro na distribuíção das equipas pelos campos.');
        res.redirect('/torneio');
    }
    
}

exports.distribuirEquipasPorEscalao = async (req, res, next) => {
    try {
        const torneio = await dbFunctions.getTorneioInfo();
        const escalaoId = parseInt(req.params.escalao);

        const escaloesDistribuidos = await torneioHelpers.distribuiEquipasPorCampos(torneio.torneioId, escalaoId);

        if(escaloesDistribuidos[0].sucesso == false){
            req.flash('error', 'Não foi possível distribuir as equipas do escalão.');
        } else {
            req.flash('success', 'Equipas distribuídas com sucesso.');
        }

        res.redirect('/torneio');
    } catch(err) {
        console.log(err);
        req.flash('error', 'Ocorreu um erro na distribuíção das equipas pelos campos.');
        res.redirect('/torneio');
    }
}

// Resultados
exports.mostraResultados = async (req, res, next) => {
    try{
        const escalaoId = req.params.escalao;
        const fase = parseInt(req.params.fase);
        const campo = parseInt(req.params.campo);

        const torneio = await dbFunctions.getTorneioInfo();

        const _listaCampos = dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);
        const _escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
        const _listaFases = dbFunctions.getAllFasesPorEscalao(torneio.torneioId, escalaoId);

        const info = {
            escalaoId: escalaoId,
            fase: fase,
            campo: 0
        }

        let [listaCampos, listaFases, escalaoInfo] = await Promise.all([_listaCampos, _listaFases, _escalaoInfo]);

        info.escalao = escalaoInfo;

        // 1. Obter a lista de fases do escalão
        // transforma a lista de fases num array com o número das fases
        listaFases = listaFases.map(fase => fase.fase);
        
        const ultimaFase = listaFases[listaFases.length-1];
        info.editavel = (ultimaFase == fase) ? true : false;

        // Adicionar a lista de fase a info para que se possa alternar de fase nos resultados
        info.listaFases = listaFases;

        // 2. Preencher um array com o mesmo número de campos que o escalão tem ocupados
        const campos = [];
        if(campo == 0){
            for(let i = 0; i < listaCampos.length; i++){
                campos.push(JSON.parse(JSON.stringify(listaCampos[i])));
                if(fase == 100){
                    campos[i].designacao = (i == 0) ? 'Final' : '3º e 4º';
                    listaCampos[i].designacao = (i == 0) ? 'Final' : '3º e 4º';
                }
            }
        } else {
            // Número do campo é passado como parametro
            campos.push({campo: campo});
            info.campo = campo;
            if(fase == 100){
                const index = listaCampos.map(el => el.campo).indexOf(campo);
                campos[0].designacao = (index == 0) ? 'Final' : '3º e 4º';
                listaCampos[0].designacao = 'Final';
                listaCampos[1].designacao = '3º e 4º';
            }
        }

        listaCampos = await torneioHelpers.verificaCamposCompletos(listaCampos, torneio.torneioId, escalaoId, fase);

        // 3. Obter todos os jogos de cada campo
        //for(let i = 0; i < campos.length; i++){
        for(const campo of campos){
            // Processa a lista de jogos que ainda falta jogar
            const _listaJogosPorJogar = dbFunctions.getAllGamesNotPlayed(torneio.torneioId, escalaoId, fase, campo.campo);
            // Processa a lista de jogos que já foram jogados
            const _listaJogosFinalizados = dbFunctions.getAllGamesPlayed(torneio.torneioId, escalaoId, fase, campo.campo);

            const [listaJogosPorJogar, listaJogosFinalizados] = await Promise.all([_listaJogosPorJogar, _listaJogosFinalizados]);
            campo.jogos = await torneioHelpers.processaEquipas(torneio.torneioId, listaJogosPorJogar);
            campo.jogosFinalizados = await torneioHelpers.processaEquipas(torneio.torneioId, listaJogosFinalizados);

            // Obter parciais dos jogos já finalizados
            for(const jogo of campo.jogosFinalizados){
                const _equipa1Parciais = dbFunctions.getParciais(jogo.jogoId, jogo.equipa1Id);
                const _equipa2Parciais = dbFunctions.getParciais(jogo.jogoId, jogo.equipa2Id);
                const _pontuacoes = dbFunctions.getPontuacoes(jogo.jogoId);

                const [equipa1Parciais, equipa2Parciais, pontuacoes] = await await Promise.all([_equipa1Parciais, _equipa2Parciais, _pontuacoes]);
                jogo.equipa1Pontos = pontuacoes.equipa1Pontos;
                jogo.equipa2Pontos = pontuacoes.equipa2Pontos;
                jogo.equipa1Parciais = {
                    parcial1: equipa1Parciais.parcial1,
                    parcial2: equipa1Parciais.parcial2,
                    parcial3: equipa1Parciais.parcial3
                };
                jogo.equipa2Parciais = {
                    parcial1: equipa2Parciais.parcial1,
                    parcial2: equipa2Parciais.parcial2,
                    parcial3: equipa2Parciais.parcial3
                };
            }
        }

        req.breadcrumbs('Resultados', '/torneio/index');
        res.render('torneio/index', {torneio: torneio, info: info, campos: campos, listaCampos: listaCampos, breadcrumbs: req.breadcrumbs()});
    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível obter os jogos');
        res.redirect('/torneio');
    }
}

exports.processaProximaFase = async (req, res, next) => {
    try{
        const escalaoId = parseInt(req.params.escalao);

        const torneio = await dbFunctions.getTorneioInfo();
        const ultimaFase = await dbFunctions.getUltimaFase(torneio.torneioId, escalaoId);
        const proximaFase = ultimaFase + 1;

        const _listaCampos = torneioHelpers.processaClassificacao(torneio.torneioId, escalaoId, ultimaFase);
        const _numJogosPorCampo = dbFunctions.getNumeroJogosPorFase(torneio.torneioId, escalaoId, ultimaFase);
        const _listaCamposInterditos = await dbFunctions.getCamposInterditados(torneio.torneioId, escalaoId);
        const [listaCampos, numJogosPorCampo, listaCamposInterditos] = await Promise.all([_listaCampos, _numJogosPorCampo, _listaCamposInterditos]);

        const camposInterditos = listaCamposInterditos.map(el => el.campo);

        // Só existem 2 campos, então processa jogos 3ª e 4ª lugar e final
        // verifica-se se só existem dois jogos porque pode haver competição só em 2 campos e depois não há fases de apuramento dos finalistas
        if(listaCampos.length == 2 && numJogosPorCampo == 2){
            let campoJogo = 1;
            while(camposInterditos.includes(campoJogo)){
                campoJogo++;
            }
            // Adiciona jogo da final
            await dbFunctions.createJogo(torneio.torneioId, escalaoId, 100, campoJogo, listaCampos[0].classificacao[0].equipaId, listaCampos[1].classificacao[0].equipaId);
            campoJogo++;

            while(camposInterditos.includes(campoJogo)){
                campoJogo++;
            }
            // Adiciona jogo do 3º e 4º lugar
            await dbFunctions.createJogo(torneio.torneioId, escalaoId, 100, campoJogo, listaCampos[0].classificacao[1].equipaId, listaCampos[1].classificacao[1].equipaId);
            
            req.flash('success', 'Próxima fase processada com sucesso');
            res.redirect('/torneio');
        } else {

            const listaEquipasApuradas = [];
            for(const campo of listaCampos){
                listaEquipasApuradas.push(campo.classificacao[0]);

                // Na fase 3 e seguintes apenas o vencedor passa à próxima fase
                if(ultimaFase < 2){
                    listaEquipasApuradas.push(campo.classificacao[1]);
                }
            }

            // Agrupa as equipas por localidade para não calharem equipas da mesma localidade no mesmo campo
            listaEquipasApuradas.sort((a, b) => {
                if(a.localidadeId < b.localidadeId){
                    return -1;
                } else {
                    return 1;
                }
            });

            const numCampos = listaEquipasApuradas.length / 2;
            let campoActual = 0;
            let k = 0;
            // Cria uma array multidimensional com o número de campos para a próxima fase;
            const listaEquipasPorCampo = [];
            for(let i = 0; i < numCampos; i++){
                listaEquipasPorCampo.push(new Array());
            }

            for(let k = 0; k < listaEquipasApuradas.length; k++){
                if(campoActual >= numCampos){
                    campoActual = 0;
                }

                listaEquipasPorCampo[campoActual].push(listaEquipasApuradas[k]);
                campoActual++;
            }

            campoActual = 1;
            for(const par of listaEquipasPorCampo){
                while(camposInterditos.includes(campoActual)){
                    campoActual++;
                }
                await dbFunctions.createJogo(torneio.torneioId, escalaoId, proximaFase, campoActual, par[0].equipaId, par[1].equipaId);
                campoActual++;
            }

            req.flash('success', 'Próxima fase processada com sucesso');
            res.redirect('/torneio');
        }
    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível processar a próxima fase.');
        res.redirect('/torneio');
    }
}

// Classificação
exports.mostraClassificacao = async (req, res, next) => {
    try {
        const escalaoId = parseInt(req.params.escalao);
        const fase = parseInt(req.params.fase);
        const campo = parseInt(req.params.campo);

        const _torneio = dbFunctions.getTorneioInfo();
        const _escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);

        const [torneio, escalaoInfo] = await Promise.all([_torneio,_escalaoInfo]);
        
        const listaCampos = await torneioHelpers.processaClassificacao(torneio.torneioId, escalaoId, fase, campo);

        req.breadcrumbs('Resultados', `/torneio/resultados/escalao/${escalaoId}/fase/${fase}/campo/${campo}`);
        req.breadcrumbs('Classificação', '/torneio/classificacao');
        res.render('torneio/classificacao', {torneio: torneio, listaCampos: listaCampos, escalao: escalaoInfo, fase: fase, breadcrumbs: req.breadcrumbs()});
    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível mostrar a classificação.');
        res.redirect('/torneio');
    }
}

exports.interditarCampos = async (req, res, next) => {
    try {
        const escalaoId = parseInt(req.params.escalao);

        const torneio = await dbFunctions.getTorneioInfo();

        const _escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
        const _numCampos = dbFunctions.getNumeroCamposPorEscalao(torneio.torneioId, escalaoId);
        const _listaCamposInterditos = dbFunctions.getCamposInterditados(torneio.torneioId, escalaoId);
        const [{numCampos}, listaCamposInterditos, escalaoInfo] = await Promise.all([_numCampos, _listaCamposInterditos, _escalaoInfo]);
        
        const listaCampos = [];
        for(let i = 1; i <= numCampos; i++){
            const interdito = listaCamposInterditos.find(el => el.campo == i);
            const campo = {
                campo: i,
                interdito: (!interdito) ? false : true
            }
            listaCampos.push(campo);
        }
        
        req.breadcrumbs('Interditar Campos', `/torneio/interditarCampos/${escalaoId}`);
        res.render('torneio/interditarCampos', {torneio: torneio, listaCampos: listaCampos, escalao: escalaoInfo, breadcrumbs: req.breadcrumbs()});
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível obter dados dos campos interditados');
        res.redirect('/torneio');
    }
}

exports.adicionarCamposInterditos = async (req, res, next) => {

    try {
        const escalaoId = parseInt(req.params.escalao);
        const torneio = await dbFunctions.getTorneioInfo();

        const campos = req.body.campo;
        // quando nada selecionado retorna undefined
        let listaCamposInput = [];
        if(campos){
            listaCamposInput = campos.map(el => parseInt(el))
        }

        // 1. Obter lista de campos Interditados
        const listaCamposInterditados = await dbFunctions.getCamposInterditados(torneio.torneioId, escalaoId);
        //console.log(listaCamposInterditados);

        // Não existem campso interditados então regista os campos selecionados como interditados
        if(listaCamposInterditados.length == 0 && listaCamposInput.length > 0){
            const bulkCreate = [];
            for(let i = 0; i < listaCamposInput.length; i++){
                bulkCreate.push({
                    torneioId: torneio.torneioId,
                    escalaoId: escalaoId,
                    campo: listaCamposInput[i]
                });
            }

            await dbFunctions.createBulkCamposInterditados(bulkCreate);
        // Existem campos interditados mas o utilizador não selecionou nenhum, então elimina os campos interditados
        } else if(listaCamposInterditados.length > 0 && listaCamposInput.length == 0){
            for(const campo of listaCamposInterditados){
                await dbFunctions.deleteCampoInterditado(campo);
            }
        } else {
            // Verifica quais os campos do input que não estão na lista de campos interditados e cria-os
            const novosCamposAInterditar = [];
            for(let i = 0; i < listaCamposInput.length; i ++){
                const found = listaCamposInterditados.find(el => el.campo == listaCamposInput[i]);
                if(!found){
                    novosCamposAInterditar.push({
                        torneioId: torneio.torneioId,
                        escalaoId: escalaoId,
                        campo: listaCamposInput[i]
                    });
                }
            }
            // Regista os campos novos interditados
            await dbFunctions.createBulkCamposInterditados(novosCamposAInterditar);

            // Verifica quais os campos que existem na lista de campos interditados mas não existem no input, ou seja, os campos
            // voltaram a ficar disponíveis, então elimina-os da interdição
            const camposADisponibilizar = [];
            for(let i = 0; i < listaCamposInterditados.length; i++){
                const found = listaCamposInput.find(el => el == listaCamposInterditados[i].campo);
                if(!found){
                    camposADisponibilizar.push(listaCamposInterditados[i]);
                }
            }
            // remove os campos da interdição
            for(const campo of camposADisponibilizar){
                await dbFunctions.deleteCampoInterditado(campo);
            } 
        }

        req.flash('success', 'Interdição de campos processada com sucesso');
        res.redirect('/torneio');
    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível interditar os campos');
        res.redirect('/torneio');
    }
}

// API
exports.createParciais = async (req, res, next) => {
    try{
        let data = req.body;
        const jogoId = parseInt(data.jogoId);
        const _equipas = dbFunctions.getEquipasPorJogo(jogoId);
        const _existemParciais = dbFunctions.verificaExistenticaJogo(jogoId);

        const [equipas, existemParciais] = await Promise.all([_equipas, _existemParciais]);

        if(existemParciais.length > 0){
            throw err;
        }

        data.parciaisData.equipa1.equipaId = equipas.equipa1Id;
        data.parciaisData.equipa2.equipaId = equipas.equipa2Id;
        
        data = torneioHelpers.processaPontuacao(data);

        await dbFunctions.createParciais(jogoId, data);
        res.status(200).json({
            success: true,
            equipa1_pontos: data.parciaisData.equipa1.pontos,
            equipa2_pontos: data.parciaisData.equipa2.pontos
        });
    } catch(err) {
        res.status(200).json({
            success: false,
            message: "Parciais já introduzidos anteriormente. Recarregue a página!"
        });
    }
}

exports.updateParciais = async (req, res, next) => {
    let data = req.body;
    const jogoId = data.jogoId;
    const equipas = await dbFunctions.getEquipasPorJogo(jogoId);

    data.parciaisData.equipa1.equipaId = equipas.equipa1Id;
    data.parciaisData.equipa2.equipaId = equipas.equipa2Id;

    data = torneioHelpers.processaPontuacao(data);

    try{
        await dbFunctions.updateParciais(jogoId, data);
        res.status(200).json({
            success: true,
            equipa1_pontos: data.parciaisData.equipa1.pontos,
            equipa2_pontos: data.parciaisData.equipa2.pontos
        });
    } catch(err) {
        console.log(err);
        res.status(200).json({
            success: false
        });
    }
}

exports.getEscalaoInfo = async (req, res, next) => {
    const escalaoId = req.params.escalaoId;
    const torneio = await dbFunctions.getTorneioInfo();

    const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
    const numCampos = dbFunctions.getNumeroCamposPorEscalao(torneio.torneioId, escalaoId);

    Promise.all([escalaoInfo, numCampos])
    .then(([_escalao, _campos]) => {
        if(_escalao && _campos){
            const response = { 
                success: true,
                escalao: {
                    torneioId: torneio.torneioId,
                    escalaoId: _escalao.escalaoId,
                    designacao: _escalao.designacao,
                    sexo: (_escalao.sexo == 1) ? 'Masculino' : 'Feminino',
                    numCampos: _campos.numCampos
                }
             }
            res.status(200).json(response);
        } else {
            return Promise.reject("Não foi possível obter dados do escalão ou do número de campos.");
        }
    })
    .catch(err => {
        console.log(err);
        const response = { success: false }
        res.status(200).json(response);
    });
}

exports.setNumeroCamposAPI = (req, res, next) => {
    const torneioId = req.body.torneioId;
    const escalaoId = req.body.escalaoId;
    const numCampos = req.body.numCampos;

    dbFunctions.updateNumCampos(torneioId, escalaoId, numCampos)
    .then(() => {
        const response = { success: true }
        res.status(200).json(response);
    })
    .catch(err => {
        console.log(err);
        const response = { success: false }
        res.status(200).json(response); 
    });
}

exports.fichasParciais = async (req, res, next) => {
    try {
        const escalaoId = parseInt(req.params.escalao);
        const campo = parseInt(req.params.campo);
        const fase = parseInt(req.params.fase) || 1;
        const torneioInfo = dbFunctions.getTorneioInfo();
        const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
        const [torneio, escalao] = await Promise.all([torneioInfo, escalaoInfo]);
        let listaCampos = [];
        const query = {};

        const response = {
            success: false
        };

        if(!torneio || !escalao){
            response.errMsg = 'Não foi possível obter os dados.';
            return res.status(200).json(response);
        } else {
            response.torneio = {
                designacao: torneio.designacao,
                localidade: torneio.localidade,
                escalao: escalao.designacao,
                sexo: (escalao.sexo == 1) ? 'Masculino' : 'Feminino'
            };

            query.torneioId = torneio.torneioId;
            query.escalaoId = escalao.escalaoId;
            query.fase = fase
        }

        if(campo == 0){
            listaCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);
        } else {
            listaCampos.push({campo: campo});
            query.campo = campo;
        }

        const listaJogos = await dbFunctions.getAllGames(query);
        const listaJogosId = listaJogos.map(jogo => jogo.jogoId);
        const _listaParciais = dbFunctions.getAllParciais(listaJogosId);
        const _listaEquipas = dbFunctions.getAllEquipas(torneio.torneioId, escalao.escalaoId);
        const [listaParciais, listaEquipas] = await Promise.all([_listaParciais, _listaEquipas]);

        for(const campo of listaCampos){
            campo.listaJogos = listaJogos.filter(jogo => jogo.campo == campo.campo);
        }

        response.listaCampos = listaCampos;
        response.listaEquipas = listaEquipas;
        response.listaParciais = listaParciais;

        response.success = true;
        res.status(200).json(response);

    } catch(err) {
        console.log(err);
        res.status(200).json({
            success: false,
            errMsg: 'Ocorreu um erro. Por favor tente novamente.'
        });
    }
}