const Sequelize = require('sequelize');
const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Localidades = require('../models/Localidades');
const Escaloes = require('../models/Escaloes');
const Jogos = require('../models/Jogos');
const { validationResult } = require('express-validator/check');
const util = require('../helpers/util');
const Op = Sequelize.Op;

const faker = require('faker');
faker.locale = "pt_BR";

function getTorneioInfo(){
    return Torneios.findOne({where: {activo: 1}, raw: true});
}

function getLocalidadesInfo(){
    return Localidades.findAll({
        order: ['nome'],
        raw: true
    })
}

function getLocalidade(localidadeId){
    return Localidades.findOne({
        where: {
            localidadeId: localidadeId
        },
        raw: true
    })
}

function getAllLocalidadesId(){
    return Localidades.findAll({
        attributes: ['localidadeId'],
        raw: true
    });
}

function getEscaloesInfo(){
    return Escaloes.findAll({raw: true});
}

function getEscalao(escalaoId){
    return Escaloes.findOne({
        where: {
            escalaoId: escalaoId
        },
        raw: true
    })
}

function getNumJogosPorEscalao(torneioId, escalaoId){
    return Jogos.count({
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        }
    });
}

function getLastEquipaID(torneioId){
    return Equipas.max('equipaId', {
        where: { torneioId: torneioId }
    });
}

function showValidationErrors(req, res, errors, page, oldData){
    const localidadesInfo = getLocalidadesInfo();
    const escaloesInfo = getEscaloesInfo();

    Promise.all([localidadesInfo, escaloesInfo])
    .then(([localidades, escaloes]) => {
        if(localidades.length > 0 && escaloes.length > 0){
            util.sort(localidades);
            res.render('equipas/' + page, {validationErrors: errors.array({ onlyFirstError: true }), localidades: localidades, escaloes: escaloes, equipa: oldData});
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

function getAllEquipas(torneioId, offset, limit){
    const _offset = (offset-1) * limit;
    return Equipas.findAll({ 
        include: [
            {
                model: Localidades,
                attributes: ['nome']
            },
            {
                model: Escaloes,
                attributes: ['designacao', 'sexo']
            }
        ],
        where: {torneioId: torneioId},
        offset: _offset,
        limit: limit
    });
}

function getNumTotalEquipas(torneioId){
    return Equipas.count({
        where: {
            torneioId: torneioId
        }
    });
}

function getEquipa(torneioId, equipaId, raw = true){
    return Equipas.findOne({
        where: {
            equipaId: equipaId,
            torneioId: torneioId
        },
        raw: raw
    });
}

function getEquipaFullDetails(torneioId, equipaId){
    return Equipas.findOne({
        where: {
            equipaId: equipaId,
            torneioId: torneioId
        }, 
        include: [
            {
                model: Localidades,
                attributes: ['nome']
            },
            {
                model: Escaloes,
                attributes: ['designacao', 'sexo']
            }
        ]
    });
}

function getAllEquipasFullDetails(whereClause){
    return Equipas.findAll({
        where: whereClause, 
        include: [
            {
                model: Localidades,
                attributes: ['nome']
            },
            {
                model: Escaloes,
                attributes: ['designacao', 'sexo']
            }
        ]
    });
}

function getAllEquipasPorFiltro(whereClause, offset, limit){
    return Equipas.findAll({
        where: whereClause, 
        include: [
            {
                model: Localidades,
                attributes: ['nome']
            },
            {
                model: Escaloes,
                attributes: ['designacao', 'sexo']
            }
        ],
        offset: (offset - 1) * limit,
        limit: limit
    }); 
}

function getNumEquipasPorFiltro(whereClause){
    return Equipas.count({
        where: whereClause
    });
}

function getNumJogosEquipa(torneioId, equipaId){
    return Jogos.count({
        where: {
            torneioId: torneioId,
            [Op.or]: [
                {equipa1Id: equipaId},
                {equipa2Id: equipaId}
            ]
        },
        raw: true
    });
}

function getAllEquipasComJogos(torneioId){
    return Jogos.findAll({
        attributes: ['equipa1Id', 'equipa2Id'],
        where: {
            torneioId: torneioId
        },
        raw: true
    });
}

function uniao(setA, setB) {
    var _uniao = new Set(setA);
    for (var elem of setB) {
        _uniao.add(elem);
    }
    return _uniao;
}

// Gera um array com a lista de equipas unicas com jogos
function geraListaEquipasUnicasComJogos(listaCompletaEquipas){
    //console.log(listaCompletaEquipas);
    let listaEquipas1 = listaCompletaEquipas.map(equipa => equipa.equipa1Id);
    //console.log(listaEquipas1);
    let listaEquipas2 = listaCompletaEquipas.map(equipa => equipa.equipa2Id);
    //console.log(listaEquipas2);
    listaEquipas1 = [...new Set(listaEquipas1)];
    listaEquipas2 = [...new Set(listaEquipas2)];
    return listaFinal = uniao(listaEquipas1, listaEquipas2);
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

exports.getAllEquipas = async (req, res, next) => {
    try{
        const torneioInfo = getTorneioInfo();
        const localidadesInfo = getLocalidadesInfo();
        const escaloesInfo = getEscaloesInfo();
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
        const listaCompletaEquipas = await getAllEquipasComJogos(torneio.torneioId);
        listaEquipasComJogos = geraListaEquipasUnicasComJogos(listaCompletaEquipas);

        const _listaEquipas = await getAllEquipas(torneio.torneioId, page, perPage);
        const listaEquipas = [];

        const numEquipas = await getNumTotalEquipas(torneio.torneioId);
        const numPages = Math.ceil(numEquipas / perPage);

        // Processa a paginação
        const paginas = geraPaginacao(numEquipas, perPage, page);

        // Verificar se as equipas já estão atribuídas a jogos
        // Se estiverem então não é possível eliminar a equipa
        for(const equipa of _listaEquipas){

            const _equipa = {
                equipaId: equipa.equipaId,
                primeiroElemento: equipa.primeiroElemento,
                segundoElemento: equipa.segundoElemento,
                localidade: equipa.localidade.nome,
                escalao: equipa.escalao.designacao,
                sexo: equipa.escalao.sexo,
                eliminavel: (listaEquipasComJogos.has(equipa.equipaId)) ? false : true
            }

            // Verificar se existem jogos desta equipa
            listaEquipas.push(_equipa);
        }
        
        res.render('equipas/equipas', {
            torneio: torneio,
            localidades: localidades,
            escaloes: escaloes,
            equipas: listaEquipas,
            page: page,
            perPage: perPage,
            paginas: paginas,
            numPages: numPages
        });

    } catch(err){
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados das equipas.')
        res.redirect('../');
    }
}

exports.getEquipaToEdit = async (req, res, next) => {
    try {
        const equipaId = req.params.id;

        const torneioInfo = getTorneioInfo();
        const localidadesInfo = getLocalidadesInfo();
        const escaloesInfo = getEscaloesInfo();

        const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);
        
        const equipa = await getEquipa(torneio.torneioId, equipaId);    
        if(equipa){
            // Verifica se a equipa já foi atribuida a algum jogo
            const numJogos = await getNumJogosEquipa(torneio.torneioId, equipaId);
            equipa.escaloesEditaveis = (numJogos == 0) ? true : false;

            res.render('equipas/editarEquipa', {
                localidades: localidades,
                escaloes: escaloes,
                equipa: equipa
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
        const torneioInfo = getTorneioInfo();
        const localidadesInfo = getLocalidadesInfo();
        const escaloesInfo = getEscaloesInfo();

        const [torneio, localidades, escaloes] = await Promise.all([torneioInfo, localidadesInfo, escaloesInfo]);

        if(localidades.length > 0 && escaloes.length > 0){
            
            util.sort(localidades);

            // Exclui da lista de esclões os escalões que já tenham jogos distribuídos
            // Se já existe jogos distribuídos não é possível adicionar mais equipas
            const listaEscaloes = [];
            for(const escalao of escaloes){
                const numJogosDistribuidos = await getNumJogosPorEscalao(torneio.torneioId, escalao.escalaoId);
                if(numJogosDistribuidos == 0){
                    listaEscaloes.push(escalao);
                }
            }

            if(listaEscaloes.length == 0){
                req.flash('warning', 'Todos os escalões disponíveis já têm os jogos distribuídos.')
                res.redirect('/equipas');
            } else {
                res.render('equipas/adicionarEquipa', {localidades: localidades, escaloes: listaEscaloes});
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
    const primeiroElemento = req.body.primeiro_elemento.trim();
    const segundoElemento = req.body.segundo_elemento.trim();
    const localidadeId = req.body.localidade;
    const escalaoId = req.body.escalao;
    const errors = validationResult(req);
    
    const oldData = {
        primeiroElemento: primeiroElemento,
        segundoElemento: segundoElemento,
        localidadeId: localidadeId,
        escalaoId: escalaoId
    }

    if(!errors.isEmpty()){
        showValidationErrors(req, res, errors, 'adicionarEquipa', oldData);
    } else {
        getTorneioInfo()
        .then(async torneio => {
            let nextEquipaID = await getLastEquipaID(torneio.torneioId) || 0;
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
                    res.render('equipas/adicionarEquipa', {validationErrors: errors, equipa: oldData});
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
    }
}

exports.updateEquipa = async (req, res, next) => {
    const equipaId = req.params.id;
    const primeiroElemento = req.body.primeiro_elemento.trim();
    const segundoElemento = req.body.segundo_elemento.trim();
    const localidadeId = req.body.localidade;
    const escalaoId = req.body.escalao;
    const errors = validationResult(req);
    
    const oldData = {
        equipaId: equipaId,
        primeiroElemento: primeiroElemento,
        segundoElemento: segundoElemento,
        localidadeId: localidadeId,
        escalaoId: escalaoId
    }

    if(!errors.isEmpty()){
        showValidationErrors(req, res, errors, 'editarEquipa', oldData);
    } else {

        try {
            const torneio = await getTorneioInfo();
            const equipa = await getEquipa(torneio.torneioId, equipaId, false);

            if(equipa){
                equipa.primeiroElemento = primeiroElemento;
                equipa.segundoElemento = segundoElemento;
                equipa.localidadeId = localidadeId;
                equipa.escalaoId = escalaoId;
                equipa.save()
                .then(result => {
                    if(result){
                        req.flash('success', 'Equipa actualizada com sucesso.')
                        res.redirect('/equipas');
                    } else {
                        req.flash('error', 'Não foi possível actualizar a equipa.')
                        res.redirect('/equipas');
                    }
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'Não foi possível actualizar a equipa.')
                    res.redirect('/equipas');
                });
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
    const equipaId = req.params.equipaId;

    const torneio = await getTorneioInfo();
    const equipa = await getEquipaFullDetails(torneio.torneioId, equipaId);
    let response;

    if(equipa){
        response = {
            success: true,
            equipa: {
                equipaId: equipa.equipaId,
                torneioId: equipa.torneioId,
                primeiroElemento: equipa.primeiroElemento,
                segundoElemento: equipa.segundoElemento,
                localidade: equipa.localidade.nome,
                sexo: equipa.escalao.sexo,
                escalao: equipa.escalao.designacao
            }
        }
    } else {
        response = { success: false }
    }

    res.status(200).json(response);
}

exports.deleteEquipa = async (req, res, next) => {
    const equipaId = req.body.equipaId;
    const torneioId = req.body.torneioId;
    let response;

    const equipa = await getEquipa(torneioId, equipaId, false);
    if(equipa){
        const result = await equipa.destroy();
        response = {
            success: (result) ? true: false,
        }
    } else {
        response = { success: false }
    }

    res.status(200).json(response);
}

// Pesquisar Equipas
exports.searchEquipa = async (req, res, next) => {
    const equipaId = req.body.pesquisaEquipaId;
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const error = errors.array({ onlyFirstError: true })[0].msg;
        req.flash("error", error);
        res.redirect('/equipas');
    } else {

        try {
            const torneio = await getTorneioInfo();
            const equipa = await getEquipaFullDetails(torneio.torneioId, equipaId);

            if(equipa){
                const localidadesInfo = getLocalidadesInfo();
                const escaloesInfo = getEscaloesInfo();
                // Verifica se a equipa já está associada a jogos
                const _numJogos = getNumJogosEquipa(torneio.torneioId, equipaId);

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

                res.render("equipas/equipas", {
                    equipaId: equipaId,
                    equipas: _equipa,
                    torneio: torneio,
                    localidades: localidades,
                    escaloes: escaloes
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
        const localidadeId = req.params.localidadeId;
        const escalaoId = req.params.escalaoId;
        const page = parseInt(req.params.page) || 1;
        const perPage = parseInt(req.params.perPage) || 15;
        const torneio = await getTorneioInfo();
        
        const filtro = {
            torneioId: torneio.torneioId
        };
    
        if(!localidadeId && !escalaoId){ 
            throw new Error();
        }
    
        if(localidadeId){ filtro.localidadeId = parseInt(localidadeId); }
    
        if(escalaoId){ filtro.escalaoId = parseInt(escalaoId); }
    
        const equipasInfo = getAllEquipasPorFiltro(filtro, page, perPage);
        const localidadesInfo = getLocalidadesInfo();
        const escaloesInfo = getEscaloesInfo();
        const _numEquipas = getNumEquipasPorFiltro(filtro);

        const [_listaEquipas, localidades, escaloes, numEquipas] = await Promise.all([equipasInfo, localidadesInfo, escaloesInfo, _numEquipas]);
        
        util.sort(localidades);

        const numPages = Math.ceil(numEquipas / perPage);

        // Processa a paginação
        const paginas = geraPaginacao(numEquipas, perPage, page);
    
        // Lista de Equipas Únicas Com Jogos
        const listaCompletaEquipas = await getAllEquipasComJogos(torneio.torneioId);
        listaEquipasComJogos = geraListaEquipasUnicasComJogos(listaCompletaEquipas);
    
        // Verificar se as equipas já estão atribuídas a jogos
        // Se estiverem então não é possível eliminar a equipa
        const listaEquipas = [];
        for(const equipa of _listaEquipas){

            const _equipa = {
                equipaId: equipa.equipaId,
                primeiroElemento: equipa.primeiroElemento,
                segundoElemento: equipa.segundoElemento,
                localidade: equipa.localidade.nome,
                escalao: equipa.escalao.designacao,
                sexo: equipa.escalao.sexo,
                eliminavel: (listaEquipasComJogos.has(equipa.equipaId)) ? false : true
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
            filtro: filtro,
            page: page,
            perPage: perPage,
            paginas: paginas,
            numPages: numPages
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
        const torneio = await getTorneioInfo();
        const listaEquipas = [];
        const query = {
            torneioId: torneio.torneioId
        }

        const response = {
            success: false
        };

        if(!torneio){
            response.errMsg = 'Não foi possível obter os dados!';
            return res.status(200).json(response);
        } else {
            response.torneio = {
                designacao: torneio.designacao,
                localidade: torneio.localidade
            };
        }

        if(localidadeId != 0){
            query.localidadeId = localidadeId;
            response.localidade = await getLocalidade(localidadeId);
        }

        if(escalaoId != 0){
            query.escalaoId = escalaoId;
            response.escalao = await getLocalidade(escalaoId);
        }

        const _listaEquipas = await getAllEquipasFullDetails(query);
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
    const num = req.params.num;
    let count = 0;

    const torneioInfo = getTorneioInfo();
    const localidadesInfo = getAllLocalidadesId();
    const escaloesInfo = getEscaloesInfo();

    await Promise.all([torneioInfo, localidadesInfo, escaloesInfo])
    .then(async ([torneio, localidades, escaloes]) => {
        
        const listaLocalidades = localidades.map(localidade => localidade.localidadeId);
        const listaEscaloes = escaloes.map(escalao => escalao.escalaoId);

        let nextEquipaID = await getLastEquipaID(torneio.torneioId) || 0;
        for(let i = 0; i < num; i++){
            nextEquipaID++;
            await Equipas.create({
                equipaId: nextEquipaID,
                torneioId: torneio.torneioId,
                primeiroElemento: faker.name.firstName() + " " + faker.name.lastName(),
                segundoElemento: faker.name.firstName() + " " + faker.name.lastName(),
                localidadeId: listaLocalidades[Math.floor(Math.random() * listaLocalidades.length)],
                escalaoId: listaEscaloes[Math.floor(Math.random() * listaEscaloes.length)]
            }).then(equipa => {
                count++;
            });
        }        
    }).then(() => {
        req.flash('success', `${count} equipas adicionadas com sucesso.`);
        res.redirect('/equipas');
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível gerar equipas aleatóriamente.');
        res.redirect('/equipas');
    });
}

exports.createEquipasAleatoriamentePorEscalao = async (req, res, next) => {
    const escalaoId = req.params.escalao;
    const num = req.params.num;
    let count = 0;

    const torneioInfo = getTorneioInfo();
    const localidadesInfo = getAllLocalidadesId();

    await Promise.all([torneioInfo, localidadesInfo])
    .then(async ([torneio, localidades]) => {
        const listaLocalidades = localidades.map(localidade => localidade.localidadeId);

        let nextEquipaID = await getLastEquipaID(torneio.torneioId) || 0;
        for(let i = 0; i < num; i++){
            nextEquipaID++;
            await Equipas.create({
                equipaId: nextEquipaID,
                torneioId: torneio.torneioId,
                primeiroElemento: faker.name.firstName() + " " + faker.name.lastName(),
                segundoElemento: faker.name.firstName() + " " + faker.name.lastName(),
                localidadeId: listaLocalidades[Math.floor(Math.random() * listaLocalidades.length)],
                escalaoId: escalaoId
            }).then(equipa => {
                count++;
            });
        }
    })
    .then(() => {
        req.flash('success', `${count} equipas adicionadas com sucesso.`);
        res.redirect('/equipas');
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível gerar equipas aleatóriamente.');
        res.redirect('/equipas');
    });
}