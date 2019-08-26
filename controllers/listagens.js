const util = require('../helpers/util');
const dbFunctions = require('../helpers/DBFunctions');
const torneioHelpers = require('../helpers/torneioHelperFunctions');

async function processaListaEquipasAgrupadasPorCampos(torneioId, escalaoId, fase, listaCampos){
    try{
        const _listaEquipasEscalao = dbFunctions.getAllEquipasEscalao(torneioId, escalaoId);
        const _listaJogosEscalao = dbFunctions.getAllJogosEscalaoFase(torneioId, escalaoId, fase);
        const [listaEquipasEscalao, listaJogosEscalao] = await Promise.all([_listaEquipasEscalao, _listaJogosEscalao])

        const listaEquipasId = listaEquipasEscalao.map(equipa => equipa.equipaId);

        for(const campo of listaCampos){
            campo.equipasIds = new Set();
            const listaJogosPorCampo = listaJogosEscalao.filter(jogo => jogo.campo == campo.campo);
            
            for(const jogo of listaJogosPorCampo){
                // Equipa 1
                if(!campo.equipasIds.has(jogo.equipa1Id)){
                    campo.equipasIds.add(jogo.equipa1Id);
                    const index = listaEquipasId.indexOf(jogo.equipa1Id);
                    const _equipa = {
                        equipaId: jogo.equipa1Id,
                        primeiroElemento: listaEquipasEscalao[index].primeiroElemento,
                        segundoElemento: listaEquipasEscalao[index].segundoElemento,
                        localidade: listaEquipasEscalao[index].localidade.nome
                    }
                    campo.listaEquipas.push(_equipa);
                }

                // Equipa 2
                if(!campo.equipasIds.has(jogo.equipa2Id)){
                    campo.equipasIds.add(jogo.equipa2Id);
                    const index = listaEquipasId.indexOf(jogo.equipa2Id);
                    const _equipa = {
                        equipaId: jogo.equipa2Id,
                        primeiroElemento: listaEquipasEscalao[index].primeiroElemento,
                        segundoElemento: listaEquipasEscalao[index].segundoElemento,
                        localidade: listaEquipasEscalao[index].localidade.nome
                    }
                    campo.listaEquipas.push(_equipa);
                }
            }
        }
        return listaCampos;
    } catch(err) {
        return Promise.reject(err);
    }
}

exports.mostraListagens = async (req, res, next) => {
    const torneio = await dbFunctions.getTorneioInfo();

    if(!torneio){
        req.flash('error', 'Não existem torneios activos.');
        return res.redirect("../");
    }

    const listaEscaloes = await dbFunctions.getEscaloesComEquipas(torneio.torneioId);
    const listaEscaloesComJogos = await dbFunctions.getAllEscaloesComJogos(torneio.torneioId);

    res.render('listagens/index', {torneio: torneio, escaloes: listaEscaloes, escaloesComJogos: listaEscaloesComJogos});
}

exports.numEquipasPorConcelho = async (req, res, next) => {
    const torneio = await dbFunctions.getTorneioInfo();
    const escalaoId = req.body.escalao || 0;

    if(!torneio){
        // TODO: mostrar mensagem de erro
    }

    const equipasPorConcelho = await dbFunctions.getNumEquipasPorConcelhoInfo(torneio.torneioId, escalaoId);
    util.sort(equipasPorConcelho);

    res.render('listagens/numEquipasPorConcelho', {torneio: torneio, escalaoId: escalaoId, localidades: equipasPorConcelho});
}

exports.equipasAgrupadasPorCampos = async (req, res, next) => {
    const torneio = await dbFunctions.getTorneioInfo();
    let escalaoId = req.body.escalao || 0;
    let fase = req.body.fase || 0;
    let numCampos = 0;

    if(escalaoId == 0 || fase == 0){
        req.flash('error', 'Deve selecionar o escalão e a fase.');
        return res.redirect("/listagens");
    }

    // 1. Verificar se para o escalão selecionado já existem jogos distribuidos
    const numJogos = await dbFunctions.getNumJogosPorEscalao(torneio.torneioId, escalaoId);
    if(numJogos == 0){
        req.flash('error', 'O Escalão selecionado ainda não tem equipas distribuídas!');
        return res.redirect("/listagens");
    }

    // 2. Verificar o número de campos para o escalão e fase
    numCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);

    if(numCampos.length > 0){
        // Processa um array de objectos com o número do campo e placeholder para a lista de equipas
        const listaCampos = numCampos.map(campo => {
            return _campo = {
                campo: campo.campo,
                listaEquipas: []
            }
        });

        processaListaEquipasAgrupadasPorCampos(torneio.torneioId, escalaoId, fase, listaCampos)
        .then(_listaCampos => {
            res.render('listagens/equipasAgrupadasPorCampos', {torneio: torneio, escalaoId: escalaoId, fase: fase, campos: _listaCampos});
        })
        .catch(err => {
            console.log(err);
            // TODO: Handle ERROR
        });
    } else {
        req.flash('error', 'Número de campos ainda não foi definido.');
        return res.redirect("/listagens");
    }
}

// API
exports.getFases = async (req, res, next) => {
    try {
        const torneio = await dbFunctions.getTorneioInfo();
        const escalaoId = parseInt(req.params.escalao);

        const response = {
            success: false
        };

        if(!torneio){
            response.errMsg = 'Não foi possível obter dados.';
            return res.status(200).json(response);
        }

        let listaFases = await dbFunctions.getAllFasesPorEscalao(torneio.torneioId, escalaoId);
        listaFases = listaFases.map(_fase => _fase.fase);

        if(listaFases.length > 0){
            response.success = true;
            response.listaFases = listaFases
        } else {
            response.errMsg = 'Não existem fases para o escalão selecionado.';
        }

        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(200).json({
            success: false,
            errMsg: 'Ocorreu um erro. Por favor tente novamente.'
        });
    }
}

exports.getCampos = async (req, res, next) => {
    try {
        const torneio = await dbFunctions.getTorneioInfo();
        const escalaoId = parseInt(req.params.escalao);
        const fase = parseInt(req.params.fase);
    
        const response = {
            success: false
        };
    
        if(!torneio){
            response.errMsg = 'Não foi possível obter dados.';
            return res.status(200).json(response);
        }
    
        let listaCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);
        listaCampos = listaCampos.map(_campo => _campo.campo);
    
        if(listaCampos.length > 0){
            response.success = true;
            response.listaCampos = listaCampos;
        } else {
            response.errMsg = 'Não existem campos para esta fase.';
        }
    
        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(200).json({
            success: false,
            errMsg: 'Ocorreu um erro. Por favor tente novamente.'
        });
    } 
}

exports.getEquipas = async (req, res, next) => {
    try {
        const torneio = await dbFunctions.getTorneioInfo();
        const escalaoId = parseInt(req.params.escalao);
    
        const response = {
            success: false
        };
    
        if(!torneio){
            response.errMsg = 'Não foi possível obter dados.';
            return res.status(200).json(response);
        }
    
        let listaEquipas = await dbFunctions.getAllEquipas(torneio.torneioId, escalaoId);
    
        if(listaEquipas.length > 0){
            response.success = true;
            response.listaEquipas = listaEquipas;
        } else {
            response.errMsg = 'Não existem equipas para este escalão.';
        }
    
        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(200).json({
            success: false,
            errMsg: 'Ocorreu um erro. Por favor tente novamente.'
        });
    } 
}

exports.getNumEquipasPorConcelho = async (req, res, next) => {
    try{
        const escalaoId = parseInt(req.params.escalao);
        const torneioInfo = dbFunctions.getTorneioInfo();
        const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
        const [torneio, escalao] = await Promise.all([torneioInfo, escalaoInfo]);

        const response = {
            success: false
        };

        if(!torneio || !escalao){
            response.errMsg = 'Não foi possível obter dados.';
            return res.status(200).json(response);
        }

        const equipasPorConcelho = await dbFunctions.getNumEquipasPorConcelhoInfo(torneio.torneioId, escalaoId);
        util.sort(equipasPorConcelho);

        if(equipasPorConcelho.length > 0){
            response.success = true;
            response.torneio = {
                designacao: torneio.designacao,
                localidade: torneio.localidade,
                escalao: escalao.designacao,
                sexo: (escalao.sexo == 1) ? 'Masculino' : 'Feminino'
            }

            response.numEquipas = equipasPorConcelho;
            
            let total = 0;
            equipasPorConcelho.forEach(equipa => total += equipa.numEquipas);
            response.total = total;

        } else {
            response.errMsg = 'Não existem equipas registadas neste torneio';
        }

        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(200).json({
            success: false,
            errMsg: 'Ocorreu um erro. Por favor tente novamente.'
        });
    }
}

exports.getEquipasAgrupadasPorCampos = async (req, res, next) => {
    try {
        const escalaoId = parseInt(req.params.escalao);
        const fase = parseInt(req.params.fase);
        const campo = parseInt(req.params.campo) || 0;
        const torneioInfo = dbFunctions.getTorneioInfo();
        const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
        const [torneio, escalao] = await Promise.all([torneioInfo, escalaoInfo]);
        let numCampos = [];

        const response = {
            success: false
        };

        if(!torneio || !escalao){
            response.errMsg = 'Não foi possível obter dados.';
            return res.status(200).json(response);
        }

        // 2. Verificar o número de campos para o escalão e fase
        if(campo == 0){
            numCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);
        } else {
            numCampos.push({
                campo: campo
            });
        }
        
        
        if(numCampos.length > 0){
            // Processa um array de objectos com o número do campo e placeholder para a lista de equipas
            const listaCampos = numCampos.map(campo => {
                return _campo = {
                    campo: campo.campo,
                    listaEquipas: []
                }
            });

            await processaListaEquipasAgrupadasPorCampos(torneio.torneioId, escalaoId, fase, listaCampos)
            .then(_listaCampos => {
                response.success = true;
                response.torneio = {
                    designacao: torneio.designacao,
                    localidade: torneio.localidade,
                    escalao: escalao.designacao,
                    sexo: (escalao.sexo == 1) ? 'Masculino' : 'Feminino'
                }
                response.listaCampos = _listaCampos;
                response.fase = fase;
            })
            .catch(err => {
                console.log(err);
                response.errMsg = 'Não foi possível obter os dados das equipas por campos.'
            });
        } else {
            response.errMsg = 'Não existem campos com jogos atribuídos.'
        }

        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(200).json({
            success: false,
            errMsg: 'Ocorreu um erro. Por favor tente novamente.'
        });
    }
}

exports.getFichasJogo = async (req, res, next) => {
    try {
        const escalaoId = parseInt(req.params.escalao);
        const campo = parseInt(req.params.campo);
        const fase = parseInt(req.params.fase) || 1;
        const torneioInfo = dbFunctions.getTorneioInfo();
        const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
        const [torneio, escalao] = await Promise.all([torneioInfo, escalaoInfo]);
        let listaJogos = [];
        let listaCampos = [];

        const response = {
            success: false
        };

        if(!torneio || !escalao){
            response.errMsg = 'Não foi possível obter dados.';
            return res.status(200).json(response);
        }

        // Todos os campos
        if(campo == 0){
            listaCampos = await dbFunctions.getAllCamposPorEscalaoFase(torneio.torneioId, escalaoId, fase);
            listaCampos = listaCampos.map(_campo => _campo.campo);
            if(listaCampos.length > 0){
                listaJogos = await dbFunctions.getAllJogosEscalaoFase(torneio.torneioId, escalaoId, fase);
            } else {
                response.errMsg = 'Não existem campos com jogos atribuídos.';
                return res.status(200).json(response);
            }
        } else {
            // Foi indicado o número do campo
            listaCampos.push(campo);
            listaJogos = await getAllJogosEscalaoFaseCampo(torneio.torneioId, escalaoId, fase, campo);   
        }

        if(listaJogos.length > 0){
            response.torneio = {
                designacao: torneio.designacao,
                localidade: torneio.localidade,
                escalao: escalao.designacao,
                sexo: (escalao.sexo == 1) ? 'Masculino' : 'Feminino'
            };
            
            response.campos = [];
            listaCampos.forEach(campo => {
                const _listaJogosCampo = listaJogos.filter(jogo => jogo.campo == campo);
                const _campo = {
                    campo: campo,
                    listaJogos: _listaJogosCampo
                }
                response.campos.push(_campo);
            });
            response.success = true;
        } else {
            response.errMsg = 'Não existem jogos para os campos selecionados.';
        }

        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(200).json({
            success: false,
            errMsg: 'Ocorreu um erro. Por favor tente novamente.'
        });
    }
}

exports.getClassificacao = async (req, res, next) => {
    try {

        const escalaoId = parseInt(req.params.escalao);
        const campo = parseInt(req.params.campo);
        const fase = parseInt(req.params.fase) || 1;
        const torneioInfo = dbFunctions.getTorneioInfo();
        const escalaoInfo = dbFunctions.getEscalaoInfo(escalaoId);
        const [torneio, escalao] = await Promise.all([torneioInfo, escalaoInfo]);

        const response = {
            success: false
        };

        if(!torneio || !escalao){
            response.errMsg = 'Não foi possível obter dados.';
            return res.status(200).json(response);
        }
        
        const listaCampos = await torneioHelpers.processaClassificacao(torneio.torneioId, escalaoId, fase, campo);

        if(listaCampos.length > 0){
            response.torneio = {
                designacao: torneio.designacao,
                localidade: torneio.localidade,
                escalao: escalao.designacao,
                sexo: (escalao.sexo == 1) ? 'Masculino' : 'Feminino'
            };
            
            response.listaCampos = listaCampos;
            response.success = true;
        } else {
            response.errMsg = 'Não existem jogos para os campos selecionados.';
        }

        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(200).json({
            success: false,
            errMsg: 'Ocorreu um erro. Por favor tente novamente.'
        });
    }
}