const Equipas = require('../models/Equipas');
const dbFunctions = require('../helpers/DBFunctions');
const sequelize = require('../helpers/database');
const { validationResult } = require('express-validator/check');
const util = require('../helpers/util');
const torneioHelpers = require('../helpers/torneioHelperFunctions');

const faker = require('faker');
faker.locale = "pt_BR";

function showValidationErrors(req, res, errors, page, oldData){
    const localidadesInfo = dbFunctions.getLocalidadesInfo();
    const escaloesInfo = dbFunctions.getEscaloesInfo();
    const torneioInfo = dbFunctions.getTorneioInfo();

    Promise.all([localidadesInfo, escaloesInfo, torneioInfo])
    .then(async ([localidades, escaloes, torneio]) => {
        if(localidades.length > 0 && escaloes.length > 0){
            util.sort(localidades);
            const listaEscaloes = await processaListaEscaloes(escaloes, torneio.torneioId);
            res.render('equipas/' + page, {validationErrors: errors.array({ onlyFirstError: true }), localidades: localidades, escaloes: listaEscaloes, equipa: oldData, torneio: torneio, breadcrumbs: req.breadcrumbs()});
        } else {
            console.log(err);
            req.flash('error', 'Não foi possível obter dados dos escalões e/ou localidades.')
            res.redirect('/equipas');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter dados dos escalões e/ou localidades.')
        res.redirect('/equipas');
    });
}

// Gera um array com a lista de equipas unicas com jogos
function geraListaEquipasUnicasComJogos(listaCompletaEquipasComJogos){
    const listaFinal = [];
    for(const jogo of listaCompletaEquipasComJogos){
        const escalao = listaFinal.find(el => el.escalaoId == jogo.escalaoId);
        if(escalao){
            escalao.listaEquipasComJogos.add(jogo.equipa1Id);
            escalao.listaEquipasComJogos.add(jogo.equipa2Id);
        } else {
            const _escalao = {
                escalaoId: jogo.escalaoId,
                listaEquipasComJogos: new Set() 
            }
            _escalao.listaEquipasComJogos.add(jogo.equipa1Id);
            _escalao.listaEquipasComJogos.add(jogo.equipa2Id);
            listaFinal.push(_escalao);
        }
    }
    return listaFinal;
}

function geraPaginacao(total, perPage, page){
    const numPages = Math.ceil(total / perPage);
    const paginas = [];

    if(numPages <= 7){
        // insere no array as 7 páginas
        for(let i = 1; i <= numPages; i++){
            paginas.push(i);
        }
    } else {
        const nextOffset = numPages - page;
        let prevOffset = 0;
        if(nextOffset >= 3){
            if(page > 3){
                for(let i = (page-3); i <= (page+3); i++){
                    paginas.push(i);
                }
            } else {
                for(let i = 1; i <= 7; i++){
                    paginas.push(i);
                }
            }
            
        } else {
            prevOffset = 7 - nextOffset - 1;
            for(let i = (page-prevOffset); i <= (page+nextOffset); i++){
                paginas.push(i);
            }
        }
    }

    return paginas;
}

async function processaListaEscaloes(escaloes, torneioId){
    // Exclui da lista de esclões os escalões que já tenham jogos distribuídos
    // Se já existe jogos distribuídos não é possível adicionar mais equipas
    const listaEscaloes = [];
    for(const escalao of escaloes){
        const numJogosDistribuidos = await dbFunctions.getNumJogosPorEscalao(torneioId, escalao.escalaoId);
        if(numJogosDistribuidos == 0){
            listaEscaloes.push(escalao);
        }
    }
    return listaEscaloes;
}

async function processaPercurso(torneioId, equipaId, escalaoId){
    const _jogos = dbFunctions.getAllJogos(torneioId, equipaId, escalaoId);
    const _equipas = dbFunctions.getAllEquipas(torneioId, escalaoId);

    const [jogos, equipas] = await Promise.all([_jogos, _equipas]);

    const _jogosId = new Set(jogos.map(el => el.jogoId));
    const jogosId = [..._jogosId];
    const _fases = new Set(jogos.map(el => el.fase));
    const fases = [..._fases];
    const _campos = new Set(jogos.map(el => el.campo));
    const campos = [..._campos];

    const listaFases = [];

    for(const [index, fase] of fases.entries()){
        const faseActual = {
            fase: fase,
            campo: campos[index],
            jogos: []
        };

        // PROCESSA A CLASSIFICAÇÃO
        const _classificacao = await torneioHelpers.processaClassificacao(torneioId, escalaoId, fase, campos[index]);
        const posicao = _classificacao[0].classificacao.map(el => el.equipaId).indexOf(equipaId);
        const classificacao = {
            posicao: posicao + 1,
            vitorias: _classificacao[0].classificacao[posicao].vitorias,
            pontos: _classificacao[0].classificacao[posicao].pontos
        }
        faseActual.classificacao = classificacao;

        // PROCESSA JOGOS
        const parciais = await dbFunctions.getAllParciais(jogosId);

        //const parciais = await
        for(const jogo of jogos){
            if(jogo.fase == fase){
                // Equipas
                const equipa1 = equipas.find(el => el.equipaId == jogo.equipa1Id);
                const equipa2 = equipas.find(el => el.equipaId == jogo.equipa2Id);
                const _jogo = {
                    equipas: [equipa1, equipa2]
                }

                // Parciais
                const parciaisEquipa1 = parciais.find(el => (el.jogoId == jogo.jogoId && el.equipaId == equipa1.equipaId));
                const parciaisEquipa2 = parciais.find(el => (el.jogoId == jogo.jogoId && el.equipaId == equipa2.equipaId));
                _jogo.parciais = [parciaisEquipa1, parciaisEquipa2];

                // Pontuação
                _jogo.pontos = [jogo.equipa1Pontos, jogo.equipa2Pontos];

                if(parciaisEquipa1 && parciaisEquipa2){
                    faseActual.jogos.push(_jogo);
                }
            }
        }

        listaFases.push(faseActual);
    }

    return listaFases;
}

exports.getAllEquipas = async (req, res, next) => {
    try{
        const torneioInfo = dbFunctions.getTorneioInfo();
        const localidadesInfo = dbFunctions.getLocalidadesInfo();
        const escaloesInfo = dbFunctions.getEscaloesInfo();
        const page = parseInt(req.params.page) || 1;
        const perPage = parseInt(req.params.perPage) || 15;
        const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);
        
        if(!torneio){
            req.flash('error', 'Não existem torneios activos.');
            return res.redirect("../");
        }

        // Ordena correctamente as localidades
        util.sort(localidades);

        // Lista de Equipas Únicas Com Jogos
        const listaCompletaEquipasComJogos = await dbFunctions.getAllEquipasComJogos(torneio.torneioId);
        listaEquipasComJogos = geraListaEquipasUnicasComJogos(listaCompletaEquipasComJogos);

        const _listaEquipas = await dbFunctions.getAllEquipasPaginacao(torneio.torneioId, page, perPage);
        const listaEquipas = [];

        const numEquipas = await dbFunctions.getNumTotalEquipas(torneio.torneioId);
        const numPages = Math.ceil(numEquipas / perPage);

        // Processa a paginação
        const paginas = geraPaginacao(numEquipas, perPage, page);

        // Verificar se as equipas já estão atribuídas a jogos
        // Se estiverem então não é possível eliminar a equipa
        for(const equipa of _listaEquipas){
            const _escalao = listaEquipasComJogos.find(el => el.escalaoId == equipa.escalaoId);
            const _equipa = {
                equipaId: equipa.equipaId,
                primeiroElemento: equipa.primeiroElemento,
                segundoElemento: equipa.segundoElemento,
                localidade: equipa.localidade.nome,
                escalaoId: equipa.escalao.escalaoId,
                escalao: equipa.escalao.designacao,
                sexo: equipa.escalao.sexo,
                eliminavel: (_escalao && _escalao.listaEquipasComJogos.has(equipa.equipaId)) ? false : true
            }
            listaEquipas.push(_equipa);
        }
        
        res.render('equipas/equipas', {
            torneio: torneio,
            localidades: localidades,
            escaloes: escaloes,
            equipas: listaEquipas,
            numEquipas: numEquipas,
            page: page,
            perPage: perPage,
            paginas: paginas,
            numPages: numPages,
            breadcrumbs: req.breadcrumbs()
        });

    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados das equipas.')
        res.redirect('../');
    }
}

exports.getEquipaToEdit = async (req, res, next) => {
    try {
        req.breadcrumbs('Editar Equipa', '/equipas/editarEquipa');
        const equipaId = parseInt(req.params.id);
        const escalaoId = parseInt(req.params.escalao);

        const torneioInfo = dbFunctions.getTorneioInfo();
        const localidadesInfo = dbFunctions.getLocalidadesInfo();
        const escaloesInfo = dbFunctions.getEscaloesInfo();

        const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);

        const equipa = await dbFunctions.getEquipaFullDetails(torneio.torneioId, equipaId, escalaoId);    
        if(equipa){
            // Verifica se a equipa já foi atribuida a algum jogo
            const numJogos = await dbFunctions.getNumJogosEquipa(torneio.torneioId, escalaoId, equipaId);
            equipa.escaloesEditaveis = (numJogos == 0) ? true : false;

            // Para ser possível mudar de escalão
            equipa.oldEscalaoId = escalaoId;

            util.sort(localidades);
            // Exclui da lista de esclões os escalões que já tenham jogos distribuídos
            // Se já existe jogos distribuídos não é possível adicionar mais equipas
            const listaEscaloesDisponiveis = await processaListaEscaloes(escaloes, torneio.torneioId);
            // Adicionar o escalão actual caso não exista já na lista de escalões disponíveis
            const found = listaEscaloesDisponiveis.find(el => el.escalaoId == equipa.escalaoId);
            if(!found){
                listaEscaloesDisponiveis.push({
                    escalaoId: equipa.escalao.escalaoId,
                    designacao: equipa.escalao.designacao,
                    sexo: equipa.escalao.sexo
                });
            }
            
            listaEscaloesDisponiveis.sort((a,b) => (a.escalaoId > b.escalaoId) ? 1 : -1);

            const percursoTorneio = await processaPercurso(torneio.torneioId, equipaId, escalaoId);

            res.render('equipas/editarEquipa', {
                localidades: localidades,
                escaloes: listaEscaloesDisponiveis,
                torneio: torneio,
                equipa: equipa,
                percurso: percursoTorneio,
                breadcrumbs: req.breadcrumbs()
            });
        } else {
            req.flash('error', 'Equipa não existe!');
            res.redirect('/equipas'); 
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados da equipa.');
        res.redirect('/equipas');
    }
}

exports.adicionarEquipa = async (req, res, next) => {
    try {
        const torneioInfo = dbFunctions.getTorneioInfo();
        const localidadesInfo = dbFunctions.getLocalidadesInfo();
        const escaloesInfo = dbFunctions.getEscaloesInfo();

        const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);

        if(localidades.length > 0 && escaloes.length > 0){
            
            util.sort(localidades);

            // Exclui da lista de esclões os escalões que já tenham jogos distribuídos
            // Se já existe jogos distribuídos não é possível adicionar mais equipas
            const listaEscaloes = await processaListaEscaloes(escaloes, torneio.torneioId);

            if(listaEscaloes.length == 0){
                req.flash('warning', 'Todos os escalões disponíveis já têm os jogos distribuídos.')
                res.redirect('/equipas');
            } else {
                req.breadcrumbs('Adicionar Equipa', '/equipas/adicionarEquipa');
                res.render('equipas/adicionarEquipa', {localidades: localidades, escaloes: listaEscaloes, torneio: torneio, breadcrumbs: req.breadcrumbs()});
            }
        } else {
            console.log(err);
            req.flash('error', 'Não foi possível obter dados dos escalões e/ou localidades.')
            res.redirect('/equipas');
        }
    } catch(err) {
        console.log(err);
        req.flash('error', 'Oops...Algo correu mal!');
        res.redirect('/equipas');
    }
}

exports.createEquipa = async (req, res, next) => {
    const primeiroElemento = req.body.primeiroElemento.trim();
    const segundoElemento = req.body.segundoElemento.trim();
    const localidadeId = parseInt(req.body.localidade);
    const escalaoId = parseInt(req.body.escalao);
    const errors = validationResult(req);

    req.breadcrumbs('Adicionar Equipa', '/equipas/adicionarEquipa');
    
    const oldData = {
        primeiroElemento: primeiroElemento,
        segundoElemento: segundoElemento,
        localidadeId: localidadeId,
        escalaoId: escalaoId
    }

    if(!errors.isEmpty()){
        showValidationErrors(req, res, errors, 'adicionarEquipa', oldData);
    } else {
        try {
            const torneioInfo = dbFunctions.getTorneioInfo();
            const localidadesInfo = dbFunctions.getLocalidadesInfo();
            const escaloesInfo = dbFunctions.getEscaloesInfo();
    
            const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);
            util.sort(localidades);

            let lastEquipaID = await dbFunctions.getLastEquipaID(torneio.torneioId, escalaoId) || 0;
            lastEquipaID++;

            const equipa = {
                torneioId: torneio.torneioId,
                primeiroElemento: primeiroElemento,
                segundoElemento: segundoElemento,
                localidadeId: localidadeId,
                escalaoId: escalaoId
            }

            const [_equipa, created] = await dbFunctions.createEquipa(equipa, lastEquipaID);

            if(created){
                req.flash('success', 'Equipa adicionada com sucesso.');
                res.redirect('/equipas');
            } else {
                const errors = [{
                    msg: 'A equipa já se encontra registada neste torneio.'
                }]
                // Exclui da lista de esclões os escalões que já tenham jogos distribuídos
                // Se já existe jogos distribuídos não é possível adicionar mais equipas
                const listaEscaloes = await processaListaEscaloes(escaloes, torneio.torneioId);

                res.render('equipas/adicionarEquipa', {validationErrors: errors, equipa: oldData, localidades: localidades, escaloes: listaEscaloes, breadcrumbs: req.breadcrumbs()});
            }
        } catch(err){
            console.log(err);
            req.flash('error', 'Não foi possível registar a equipa');
            res.redirect('/equipas');
        }
    }



        /*dbFunctions.getTorneioInfo()
        .then(async torneio => {
            let nextEquipaID = await dbFunctions.getLastEquipaID(torneio.torneioId, escalaoId) || 0;
            nextEquipaID++;

            Equipas.findOrCreate({
                where: {
                    torneioId: torneio.torneioId,
                    primeiroElemento: primeiroElemento,
                    segundoElemento: segundoElemento,
                    localidadeId: localidadeId,
                    escalaoId: escalaoId
                },
                defaults: {
                    equipaId: nextEquipaID
                }
            })
            .then(([equipa, created]) => {
                if(created){
                    req.flash('success', 'Equipa adicionada com sucesso.');
                    res.redirect('/equipas');
                } else {
                    const errors = [{
                        msg: 'Equipa já existe neste torneio.'
                    }]
                    res.render('equipas/adicionarEquipa', {validationErrors: errors, equipa: oldData, breadcrumbs: req.breadcrumbs()});
                }
            })
            .catch(err => {
                console.log(err);
                req.flash('error', 'Não foi possível adicionar a equipa.');
                res.redirect('/equipas');
            });
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Oops...Algo correu mal!');
            res.redirect('/equipas');
        });
    }*/
}

exports.updateEquipa = async (req, res, next) => {
    const equipaId = parseInt(req.params.id);
    const primeiroElemento = req.body.primeiroElemento.trim();
    const segundoElemento = req.body.segundoElemento.trim();
    const localidadeId = parseInt(req.body.localidade);
    const oldEscalaoId = parseInt(req.params.escalao);
    const escalaoId = parseInt(req.body.escalao);
    const errors = validationResult(req);
    req.breadcrumbs('Editar Equipa', '/equipas/editarEquipa');
    
    const oldData = {
        equipaId: equipaId,
        primeiroElemento: primeiroElemento,
        segundoElemento: segundoElemento,
        localidadeId: localidadeId,
        escalaoId: escalaoId,
        oldEscalaoId: oldEscalaoId
    }

    if(!errors.isEmpty()){
        showValidationErrors(req, res, errors, 'editarEquipa', oldData);
    } else {

        try {
            const torneio = await dbFunctions.getTorneioInfo();
            const equipa = await dbFunctions.getSimpleEquipa(torneio.torneioId, equipaId, oldEscalaoId, false);

            if(equipa){
                let createdEquipa = null;
                let updatedEquipa = null;

                if(escalaoId != oldEscalaoId){
                    const lastId = await dbFunctions.getLastEquipaID(torneio.torneioId, escalaoId) || 0;

                    const _equipa = {
                        equipaId: lastId+1,
                        torneioId: torneio.torneioId,
                        primeiroElemento: primeiroElemento,
                        segundoElemento: segundoElemento,
                        localidadeId: localidadeId,
                        escalaoId: escalaoId
                    }

                    let transaction;
                    try{
                        transaction = await sequelize.transaction();

                        // Verifica se a Equipas já existe no escalão selecionado
                        const existeEquipa = await Equipas.findOne({
                            where: _equipa,
                            transaction
                        });

                        if(existeEquipa) {
                            throw 'A equipas já existe no escalão selecionado'
                        } else {
                            // Elimina a equipa do escalão antigo
                            await equipa.destroy({transaction});
                            // Regista a equipa no novo escalão
                            console.log(_equipa);
                            createdEquipa = await Equipas.create(_equipa, {transaction});

                            if(createdEquipa) {
                                await transaction.commit();
                            } else {
                                throw "Não foi possível actualizar a equipa";
                            }
                        }
                    } catch(err){
                        if(transaction) await transaction.rollback();
                        throw err;
                    }
                    
                } else {
                    equipa.primeiroElemento = primeiroElemento;
                    equipa.segundoElemento = segundoElemento;
                    equipa.localidadeId = localidadeId;
                    equipa.escalaoId = escalaoId;

                    updatedEquipa = await equipa.save();
                }

                if(updatedEquipa || createdEquipa){
                    req.flash('success', 'Equipa actualizada com sucesso.')
                    res.redirect('/equipas');
                } else {
                    req.flash('error', 'Não foi possível actualizar a equipa.')
                    res.redirect('/equipas');
                }
            } else {
                req.flash('error', 'Equipa não existe.')
                res.redirect('/equipas');
            }
        } catch(err) {
            console.log(err);
            req.flash('error', 'Não foi possível actualizar a equipa.');
            res.redirect('/equipas');
        }
    }
}

exports.getEquipaToDelete = async (req, res, next) => {
    const equipaId = parseInt(req.params.equipaId);
    const escalaoId = parseInt(req.params.escalaoId);

    let response = {
        success: false
    };
    
    try {
        const torneio = await dbFunctions.getTorneioInfo();
        const equipa = await dbFunctions.getEquipaFullDetails(torneio.torneioId, equipaId, escalaoId);

        if(equipa){
            response.success = true,
            response.equipa = {
                    equipaId: equipa.equipaId,
                    torneioId: equipa.torneioId,
                    primeiroElemento: equipa.primeiroElemento,
                    segundoElemento: equipa.segundoElemento,
                    localidade: equipa.localidade.nome,
                    sexo: equipa.escalao.sexo,
                    escalao: equipa.escalao.designacao,
                    escalaoId: equipa.escalao.escalaoId
                };
        }
    } catch(err){
        console.log(err);
    }

    res.status(200).json(response);
}

exports.deleteEquipa = async (req, res, next) => {
    const equipaId = parseInt(req.body.equipaId);
    const torneioId = parseInt(req.body.torneioId);
    const escalaoId = parseInt(req.body.escalaoId);

    let response = {
        success: false
    };

    try {
        const equipa = await dbFunctions.getSimpleEquipa(torneioId, equipaId, escalaoId, false);
        if(equipa){
            const result = await equipa.destroy();
            response = {
                success: (result) ? true: false,
            }
        }
    } catch(err) {
        console.log(err);
    }

    res.status(200).json(response);
}

// Pesquisar Equipas
exports.searchEquipa = async (req, res, next) => {
    const equipaId = parseInt(req.body.pesquisaEquipaId);
    const escalaoId = parseInt(req.params.escalao);
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const error = errors.array({ onlyFirstError: true })[0].msg;
        req.flash("error", error);
        res.redirect('/equipas');
    } else {

        try {
            const torneio = await dbFunctions.getTorneioInfo();
            const equipa = await dbFunctions.getEquipaFullDetails(torneio.torneioId, equipaId, escalaoId);

            if(equipa){
                const localidadesInfo = dbFunctions.getLocalidadesInfo();
                const escaloesInfo = dbFunctions.getEscaloesInfo();
                // Verifica se a equipa já está associada a jogos
                const _numJogos = dbFunctions.getNumJogosEquipa(torneio.torneioId, escalaoId, equipaId);

                const [localidades, escaloes, numJogos] = await Promise.all([localidadesInfo, escaloesInfo, _numJogos]);
                const _equipa = [{
                    equipaId: equipa.equipaId,
                    primeiroElemento: equipa.primeiroElemento,
                    segundoElemento: equipa.segundoElemento,
                    localidade: equipa.localidade.nome,
                    escalao: equipa.escalao.designacao,
                    sexo: equipa.escalao.sexo,
                    eliminavel: (numJogos == 0) ? true : false,
                }];

                util.sort(localidades);

                let i = escaloes.map(escalao => escalao.escalaoId).indexOf(parseInt(escalaoId));
                const filtro = {
                    escalaoId: escalaoId,
                    escalao: (i != -1) ? escaloes[i].designacao : '',
                    sexo: (i != -1) ? (escaloes[i].sexo == 1) ? 'Masculino' : 'Feminino' : ''
                }
                

                res.render("equipas/equipas", {
                    equipaId: equipaId,
                    equipas: _equipa,
                    torneio: torneio,
                    filtro: filtro,
                    localidades: localidades,
                    escaloes: escaloes,
                    breadcrumbs: req.breadcrumbs()
                });
            } else {
                req.flash("error", "Não exite equipa com o número indicado.");
                res.redirect('/equipas');
            }
        } catch(err) {
            console.log(err);
            req.flash('error', 'Não foi possível pesquisar a equipa.');
            res.redirect('/equipas');
        }
    }
}

// Filtrar Equipas
exports.filtrarEquipas = async (req, res, next) => {
    try {
        const localidadeId = parseInt(req.params.localidadeId);
        const escalaoId = parseInt(req.params.escalaoId);
        const page = parseInt(req.params.page) || 1;
        const perPage = parseInt(req.params.perPage) || 15;
        const torneio = await dbFunctions.getTorneioInfo();
        
        const filtro = {
            torneioId: torneio.torneioId
        };
    
        if(!localidadeId && !escalaoId){ 
            throw new Error();
        }
    
        if(localidadeId){ filtro.localidadeId = parseInt(localidadeId); }
    
        if(escalaoId){ filtro.escalaoId = parseInt(escalaoId); }
    
        const equipasInfo = dbFunctions.getAllEquipasPorFiltroPaginacao(filtro, page, perPage);
        const localidadesInfo = dbFunctions.getLocalidadesInfo();
        const escaloesInfo = dbFunctions.getEscaloesInfo();
        const _numEquipas = dbFunctions.getNumEquipasPorFiltro(filtro);

        const [_listaEquipas, localidades, escaloes, numEquipas] = await Promise.all([equipasInfo, localidadesInfo, escaloesInfo, _numEquipas]);
        
        util.sort(localidades);

        const numPages = Math.ceil(numEquipas / perPage);

        // Processa a paginação
        const paginas = geraPaginacao(numEquipas, perPage, page);
    
        // Lista de Equipas Únicas Com Jogos
        const listaCompletaEquipasComJogos = await dbFunctions.getAllEquipasComJogos(torneio.torneioId);
        listaEquipasComJogos = geraListaEquipasUnicasComJogos(listaCompletaEquipasComJogos);
    
        // Verificar se as equipas já estão atribuídas a jogos
        // Se estiverem então não é possível eliminar a equipa
        const listaEquipas = [];
        for(const equipa of _listaEquipas){
            const _escalao = listaEquipasComJogos.find(el => el.escalaoId == equipa.escalaoId);
            const _equipa = {
                equipaId: equipa.equipaId,
                primeiroElemento: equipa.primeiroElemento,
                segundoElemento: equipa.segundoElemento,
                localidade: equipa.localidade.nome,
                escalaoId: equipa.escalao.escalaoId,
                escalao: equipa.escalao.designacao,
                sexo: equipa.escalao.sexo,
                eliminavel: (_escalao && _escalao.listaEquipasComJogos.has(equipa.equipaId)) ? false : true
            }
    
            // Verificar se existem jogos desta equipa
            listaEquipas.push(_equipa);
        }

        if(localidadeId){ 
            let i = localidades.map(localidade => localidade.localidadeId).indexOf(parseInt(localidadeId));
            filtro.localidade = (i != -1) ? localidades[i].nome : '';
        }

        if(escalaoId){ 
            let i = escaloes.map(escalao => escalao.escalaoId).indexOf(parseInt(escalaoId));
            filtro.escalao = (i != -1) ? escaloes[i].designacao : '';
            filtro.sexo = (i != -1) ? (escaloes[i].sexo == 1) ? 'Masculino' : 'Feminino' : '';
        } 

        res.render('equipas/equipas', {
            torneio: torneio,
            localidades: localidades,
            escaloes: escaloes,
            equipas: listaEquipas,
            numEquipas: numEquipas,
            filtro: filtro,
            page: page,
            perPage: perPage,
            paginas: paginas,
            numPages: numPages,
            breadcrumbs: req.breadcrumbs()
        });
    } catch(err) {
        console.log(err);
        req.flash("error", "Não foi possível filtrar equipas.");
        res.redirect('/equipas');
    }
}

// API
exports.listagemEquipas = async (req, res, next) => {
    try {
        const localidadeId = parseInt(req.params.localidade);
        const escalaoId = parseInt(req.params.escalao);
        const torneio = await dbFunctions.getTorneioInfo();
        const listaEquipas = [];
        const query = {
            torneioId: torneio.torneioId
        }

        const response = {
            success: false
        };

        if(!torneio){
            response.errType = 'error';
            response.errMsg = 'Não foi possível obter os dados!';
            return res.status(200).json(response);
        } else {
            response.torneio = {
                designacao: torneio.designacao,
                localidade: torneio.localidade,
                ano: torneio.ano
            };
        }

        if(localidadeId != 0){
            query.localidadeId = localidadeId;
            response.localidade = await dbFunctions.getLocalidade(localidadeId);
        }

        if(escalaoId != 0){
            query.escalaoId = escalaoId;
            response.escalao = await dbFunctions.getEscalao(escalaoId);
        }

        const _listaEquipas = await dbFunctions.getAllEquipasFullDetails(query);
        if(_listaEquipas.length > 0){
            for(const equipa of _listaEquipas){
                const _equipa = {
                    equipaId: equipa.equipaId,
                    primeiroElemento: equipa.primeiroElemento,
                    segundoElemento: equipa.segundoElemento,
                    localidade: equipa.localidade.nome,
                    escalao: equipa.escalao.designacao,
                    sexo: (equipa.escalao.sexo == 1) ? 'Masculino' : 'Feminino'
                }
                listaEquipas.push(_equipa);
            }
    
            response.success = true;
            response.listaEquipas = listaEquipas;
        } else {
            response.errType = 'warning';
            response.errMsg = 'Não existem equipas!';
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

// Faker
exports.createEquipasAleatoriamente = async (req, res, next) => {
    const num = parseInt(req.params.num) || 0;

    const torneioInfo = dbFunctions.getTorneioInfo();
    const localidadesInfo = dbFunctions.getAllLocalidadesID();
    const escaloesInfo = dbFunctions.getEscaloesInfo();

    await Promise.all([torneioInfo, localidadesInfo, escaloesInfo])
    .then(async ([torneio, localidades, escaloes]) => {
        
        const _listaLocalidades = localidades.map(localidade => localidade.localidadeId);
        const _listaEscaloes = escaloes.map(escalao => escalao.escalaoId);
        const listaEquipas = [];

        let listaEscaloes = await dbFunctions.getLastEquipaIDTodosEscaloes(torneio.torneioId);

        for(const escalao of _listaEscaloes){
            const found = listaEscaloes.find(el => el.escalaoId == escalao);
            if(!found){
                listaEscaloes.push({
                    escalaoId: escalao,
                    lastId: 0
                });
            }
        }

        for(let i = 0; i < num; i++){
            const _escalao = listaEscaloes[Math.floor(Math.random() * listaEscaloes.length)];
            _escalao.lastId++;
            const equipa = {
                equipaId: _escalao.lastId,
                torneioId: torneio.torneioId,
                primeiroElemento: faker.name.firstName() + " " + faker.name.lastName(),
                segundoElemento: faker.name.firstName() + " " + faker.name.lastName(),
                localidadeId: _listaLocalidades[Math.floor(Math.random() * _listaLocalidades.length)],
                escalaoId: _escalao.escalaoId
            }
            listaEquipas.push(equipa);
        }

        await Equipas.bulkCreate(listaEquipas);     
    }).then(() => {
        req.flash('success', `${num} equipas adicionadas com sucesso.`);
        res.redirect('/equipas');
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível gerar equipas aleatóriamente.');
        res.redirect('/equipas');
    });
}

exports.createEquipasAleatoriamentePorEscalao = async (req, res, next) => {
    const escalaoId = parseInt(req.params.escalao);
    const num = parseInt(req.params.num) || 0;

    const torneioInfo = dbFunctions.getTorneioInfo();
    const localidadesInfo = dbFunctions.getAllLocalidadesID();

    await Promise.all([torneioInfo, localidadesInfo])
    .then(async ([torneio, localidades]) => {
        const listaLocalidades = localidades.map(localidade => localidade.localidadeId);
        const listaEquipas = [];

        let lastEquipaID = await dbFunctions.getLastEquipaID(torneio.torneioId, escalaoId) || 0;
        for(let i = 0; i < num; i++){
            lastEquipaID++;
            const equipa = {
                equipaId: lastEquipaID,
                torneioId: torneio.torneioId,
                primeiroElemento: faker.name.firstName() + " " + faker.name.lastName(),
                segundoElemento: faker.name.firstName() + " " + faker.name.lastName(),
                localidadeId: listaLocalidades[Math.floor(Math.random() * listaLocalidades.length)],
                escalaoId: escalaoId
            }
            listaEquipas.push(equipa);
        }

        await Equipas.bulkCreate(listaEquipas);
    })
    .then(() => {
        req.flash('success', `${num} equipas adicionadas com sucesso.`);
        res.redirect('/equipas');
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível gerar equipas aleatóriamente.');
        res.redirect('/equipas');
    });
}