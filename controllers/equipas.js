const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Localidades = require('../models/Localidades');
const Escaloes = require('../models/Escaloes');
const { validationResult } = require('express-validator/check');
const util = require('../helpers/util');

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

function getAllLocalidadesId(){
    return Localidades.findAll({
        attributes: ['localidadeId'],
        raw: true
    });
}

function getEscaloesInfo(){
    return Escaloes.findAll({raw: true});
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

exports.getAllEquipas = async (req, res, next) => {
    const torneioInfo = getTorneioInfo();
    const localidadesInfo = getLocalidadesInfo();
    const escaloesInfo = getEscaloesInfo();

    Promise.all([torneioInfo, localidadesInfo, escaloesInfo])
    .then(([torneio, localidades, escaloes]) => {

        // Ordena correctamente as localidades
        util.sort(localidades);

        if(torneio){
            Equipas.findAll({
                where: {torneioId: torneio.torneioId}, 
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
            })
            .then(equipas => {
                res.render('equipas/equipas', {
                    torneio: torneio,
                    localidades: localidades,
                    escaloes: escaloes,
                    equipas: equipas
                });
            })
            .catch(err => {
                console.log(err);
                req.flash('error', 'Não foi possível obter dados das equipas.')
                res.redirect('/equipas');
            });
        } else {
            req.flash('error', 'Não existem torneios registados ou activados.')
            res.redirect('/equipas');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Oops...Algo correu mal!')
        res.redirect('../');
    });
}

exports.getEquipaToEdit = async (req, res, next) => {
    const equipaId = req.params.id;

    const localidadesInfo = getLocalidadesInfo();
    const escaloesInfo = getEscaloesInfo();

    Promise.all([localidadesInfo, escaloesInfo])
    .then(([localidades, escaloes]) => {
        if(localidades.length > 0 || escaloes.length > 0){
            Equipas.findByPk(equipaId)
            .then(equipa => {
                if(equipa) {
                    res.render('equipas/editarEquipa', {
                        localidades: localidades,
                        escaloes: escaloes,
                        equipa: equipa
                    });
                } else {
                    req.flash('error', 'Equipa não existe.')
                    res.redirect('/equipas');
                }
            })
            .catch(err => {
                console.log(err);
                req.flash('error', 'Não foi possível obter os dados da equipa.')
                res.redirect('/equipas');
            });
        } else {
            req.flash('error', 'Não foi possível obter os dados das localidades e/ou escalões.')
            res.redirect('/equipas');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Oops...Algo correu mal!')
        res.redirect('/equipas');
    });
}

exports.adicionarEquipa = async (req, res, next) => {
    const localidadesInfo = getLocalidadesInfo();
    const escaloesInfo = getEscaloesInfo();

    Promise.all([localidadesInfo, escaloesInfo])
    .then(([localidades, escaloes]) => {
        if(localidades.length > 0 && escaloes.length > 0){
            util.sort(localidades);
            res.render('equipas/adicionarEquipa', {localidades: localidades, escaloes: escaloes});
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

exports.createEquipa = async (req, res, next) => {
    const primeiroElemento = req.body.primeiro_elemento.trim();
    const segundoElemento = req.body.segundo_elemento.trim();
    const localidade = req.body.localidade;
    const escalao = req.body.escalao;
    const errors = validationResult(req);
    
    const oldData = {
        primeiroElemento: primeiroElemento,
        segundoElemento: segundoElemento,
        localidadeId: localidade,
        escalaoId: escalao
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
                    localidadeId: localidade,
                    escalaoId: escalao
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
            req.flash('error', 'Não foi possível adicionar a equipa.');
            res.redirect('/equipas');
        });
    }
}

exports.updateEquipa = (req, res, next) => {
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
        Equipas.findByPk(equipaId)
        .then(equipa => {
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
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível obter os dados da equipa.')
            res.redirect('/equipas');
        });
    }
}

exports.getEquipaToDelete = async (req, res, next) => {
    const equipaId = req.params.id;

    Equipas.findOne({
        where: {equipaId: equipaId}, 
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
    })
    .then(equipa => {
        res.render('equipas/eliminarEquipa', { equipa: equipa });
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter dados das equipas.');
        res.redirect('/equipas');
    });
}

exports.deleteEquipa = (req, res, next) => {
    const equipaId = req.params.id;
    const confirmacao = req.body.confirmacao;

    if(confirmacao == '1'){
        Equipas.destroy({where: {equipaId: equipaId}, limit: 1})
        .then(result => {
            if(result){
                req.flash('success', 'Equipa eliminada com sucesso.');
                res.redirect('/equipas');
            } else {
                req.flash('error', 'Não foi possível eliminar a equipa.');
                res.redirect('/equipas');
            }
        })
        .catch(err => { 
            console.log(err);
            req.flash('error', 'Não foi possível eliminar a equipa.');
            res.redirect('/equipas');
        });
    } else {
        res.redirect('/equipas');
    }
}

// Pesquisar Equipas
exports.searchEquipa = (req, res, next) => {
    const equipaId = req.body.pesquisaEquipaId;
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        const error = errors.array({ onlyFirstError: true })[0].msg;
        req.flash("error", error);
        res.redirect('/equipas');
    } else {
        Equipas.findAll({
            where: {equipaId: equipaId},
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
        })
        .then(async equipa => {
            if(equipa){
                const torneioInfo = getTorneioInfo();
                const localidadesInfo = getLocalidadesInfo();
                const escaloesInfo = getEscaloesInfo();

                Promise.all([torneioInfo, localidadesInfo, escaloesInfo])
                .then(([torneio, localidades, escaloes]) => {
                    res.render("equipas/equipas", {
                        equipaId: equipaId,
                        equipas: equipa,
                        torneio: torneio,
                        localidades: localidades,
                        escaloes: escaloes
                    });
                })
                .catch(err => {
                    console.log(err);
                    req.flash("error", "Ocorreu um erro. Não foi possível pesquisar a equipa.");
                    res.redirect('/equipas');
                });
            } else {
                req.flash("error", "Não exitem equipa com o número indicado.");
                res.redirect('/equipas');
            }
        })
        .catch(err => {
            console.log(err);
            req.flash("error", "Não foi possível encontrar a equipa.");
            res.redirect('/equipas');
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

    Promise.all([torneioInfo, localidadesInfo, escaloesInfo])
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

    Promise.all([torneioInfo, localidadesInfo])
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