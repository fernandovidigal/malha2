const Equipas = require('../models/Equipas');
const Torneios = require('../models/Torneios');
const Localidades = require('../models/Localidades');
const Escaloes = require('../models/Escaloes');
const Jogos = require('../models/Jogos');
const { validationResult } = require('express-validator/check');
const util = require('../helpers/util');

function getTorneioInfo(){
    return Torneios.findOne({where: {activo: 1}, raw: true});
}

function getNumEquipas(torneioId){
    return Equipas.count({where: {torneioId: torneioId}});
}

function getNumCampos(torneioId){
    return Torneios.findOne({
        attributes: ['campos'],
        where: {torneioId : torneioId}
    });
}

function getNumeroJogosPorFase(torneioId, fase){
    return Jogos.count({
        where: {
            torneioId: torneioId,
            fase: fase
        }
    });
}

function getEscaloesComEquipas(torneioId){
    return Escaloes.findAll({
        include: {
            model: Equipas,
            where: {torneioId: torneioId},
            attributes: []
        },
        group: ['equipas.escalaoId'] 
    });
}

function getFaseTorneioPorEscalao(torneioId, escalaoId){
    return Jogos.findOne({
        attributes: ['fase'],
        where: {
            torneioId: torneioId,
            escalaoId: escalaoId
        },
        group: ['fase'],
        order: [['fase', "DESC"]]
    });
}

exports.getStarting = async (req, res, next) => {
    const torneio = await getTorneioInfo();
    const torneioId = torneio.torneioId;

    // 1. Verificar se existem equipas (não se pode fazer um torneio sem equipas)
    // e se exitem pelo menos 2 equipas
    const numEquipas = await getNumEquipas(torneioId);
    if(numEquipas == 0){
        const error = { msg: "Não existem equipas registadas."};
        return res.render('torneio/index', {torneio: torneio, messages: error});
    } else if(numEquipas < 2){
        const error = { msg: "Existem menos de 2 equipas registadas"};
        return res.render('torneio/index', {torneio: torneio, messages: error});
    }

    // 2. Verificar se existem o número de campos definido para o torneio
    const numCampos = await getNumCampos(torneioId);
    if(numCampos.campos == 0){
        return res.render('torneio/definirNumeroCampos', {torneio: torneio});
    }

    // 3. verificar se já existem jogos distribuidos
    /*const numJogos = await getNumeroJogos(torneioId);
    console.log(numJogos);
    if(numJogos == 0){
        return res.render('torneio/selecionaEscalao', {data: data});
    }*/
    if(numEquipas > 0 && numCampos.campos > 0){
        const listaEscaloes = await getEscaloesComEquipas(torneioId);

        const escaloesMasculino = [];
        const escaloesFeminino = [];

        for(const escalao of listaEscaloes){
            const _escalao = {
                escalaoId: escalao.escalaoId,
                designacao: escalao.designacao,
                sexo: escalao.sexo
            }
            const fase = await getFaseTorneioPorEscalao(torneioId, escalao.escalaoId);
            _escalao.fase = fase == null ? 0 : fase;

            const numJogos = await getNumeroJogosPorFase(torneioId, _escalao.fase);
            _escalao.numJogos = numJogos;

            if(_escalao.sexo == 0){
                escaloesFeminino.push(_escalao);
            } else {
                escaloesMasculino.push(_escalao);
            }
        }
    }

}

exports.getNumeroCampos = async (req, res, next) => {
    const torneio = await getTorneioInfo();
    res.render('torneio/definirNumeroCampos', {torneio: torneio});
}

exports.setNumeroCampos = async (req, res, next) => {
    const numCampos = req.body.numCampos;
    const errors = validationResult(req);
    const torneio = await getTorneioInfo();
    
    const oldData = {
        count: numCampos
    }

    if(!errors.isEmpty()){
        res.render('torneio/definirNumeroCampos', {validationErrors: errors.array({ onlyFirstError: true }), torneio: torneio, campos: oldData});
    } else {
        Torneios.findByPk(torneio.torneioId)
        .then(torneio => {
            torneio.campos = numCampos;
            torneio.save()
            .then(result => {
                if(result){
                    req.flash("success", "Número de campos do torneio foi actualizado com sucesso!");
                    res.redirect('/torneio');
                } else {
                    req.flash("error", "Não foi possível definir o número de campos do torneio.");
                    res.redirect('/torneio/definirNumeroCampos');
                }
            })
            .catch(err => {
                console.log(err);
                req.flash("error", "Não foi possível definir o número de campos do torneio.");
                res.redirect('/torneio/definirNumeroCampos');
            });
        })
        .catch(err => {
            console.log(err);
            req.flash("error", "Não foi possível obter os dados do torneio.");
            res.redirect('/torneio/definirNumeroCampos');
        });
    }
}