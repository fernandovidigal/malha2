const sequelize = require('../../helpers/database');
const Torneio = require('../../models/Torneios');
const Escaloes = require('../../models/Escaloes');
const Campos = require('../../models/Campos');
const { validationResult } = require('express-validator/check');

function setTorneioActivo(id){
    return sequelize.transaction(t => {
        return sequelize.query("UPDATE torneios SET activo = 0", {transaction: t})
        .then(() => {
            Torneio.update(
                {activo: 1},
                {where: {torneioId: id}, limit: 1},
                {transaction: t}
            )
        })
    })
    .then(result => {
        return true;
    })
    .catch(err => {
        return false;
    });
}

function getAllEscaloes(){
    return Escaloes.findAll({raw: true});
}

exports.getAllTorneios = (req, res, next) => {
    Torneio.findAll({
        order: [['ano', 'DESC']],
        raw: true
    })
    .then(torneios => {
        res.render('admin/torneios', {torneios: torneios});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível obter os dados dos torneios!');
        res.redirect('/admin/torneios');
    });
}

exports.getTorneio = (req, res, next) => {
    const torneioId = req.params.id;

    Torneio.findByPk(torneioId)
    .then(torneio => {
        if(torneio){
            res.render('admin/editarTorneio', {torneio: torneio});
        } else {
            req.flash('error', 'Torneio não existe.');
            res.redirect('/admin/torneios');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível aceder ao torneio.');
        res.redirect('/admin/torneios');
    });
}

exports.adicionarTorneio = (req, res, next) => {

    getAllEscaloes()
    .then( _escaloes => {
        const escaloes = {};
        escaloes.masculinos = _escaloes.filter(escalao => escalao.sexo == 1);
        escaloes.femininos = _escaloes.filter(escalao => escalao.sexo == 0);

        res.render('admin/adicionarTorneio', {escaloes: escaloes});
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não é possivel adicionar torneio. Sem acesso à lista de escalões.');
        res.redirect('/admin/torneios');
    });
}

exports.createTorneio = async (req, res, next) => {
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = req.body.ano.trim();
    const errors = validationResult(req);
    const camposMasculinos =  req.body.camposMasculinos;
    const escalaoIdMasculinos = req.body.escalaoIdMasculinos;
    const camposFemininos = req.body.camposFemininos;
    const escalaoIdFemininos = req.body.escalaoIdFemininos;

    console.log(camposMasculinos);

    // Valida número de campos introduzidos

    // Processa todos os escalões
    const _escaloes = await getAllEscaloes();
    const escaloes = {};
    escaloes.masculinos = _escaloes.filter(escalao => escalao.sexo == 1);
    escaloes.femininos = _escaloes.filter(escalao => escalao.sexo == 0);

    if(!errors.isEmpty()){
        const oldData = {
            designacao: designacao,
            localidade: localidade,
            ano: ano,
            camposMasculinos: camposMasculinos,
            escalaoIdMasculinos: escalaoIdMasculinos,
            camposFemininos: camposFemininos,
            escalaoIdFemininos: escalaoIdFemininos
        }
        res.render('admin/adicionarTorneio', {validationErrors: errors.array({ onlyFirstError: true }), escaloes: escaloes, oldData: oldData});
    } else {
        let torneioId = 0;

        sequelize.transaction(t => {
            return Torneio.create({
                designacao: designacao,
                localidade: localidade,
                ano: ano
            }, {transaction: t})
            .then(async torneio => {
                torneioId = torneio.torneioId;

                let i = 0;
                // Processa os campos para os escalões masculinos
                for(const escalao of camposMasculinos){
                    await Campos.create({
                        torneioId: torneio.torneioId,
                        escalaoId: escalaoIdMasculinos[i],
                        numCampos: camposMasculinos[i],
                    }, {transaction: t})
                    .then(() => i++ );
                }
                
                i = 0;
                // Processa os campos para os escalões Femininos
                for(const escalao of camposFemininos){
                    await Campos.create({
                        torneioId: torneio.torneioId,
                        escalaoId: escalaoIdFemininos[i],
                        numCampos: camposFemininos[i]
                    }, {transaction: t})
                    .then(() => i++ );
                }
            });
        })
        .then(async result => {
            // Escolheu adicionar e activar o torneios
            if(req.body.adicionar_activar){
                if(await setTorneioActivo(torneioId)){
                    req.flash('success', 'Torneio adicionado e activado com sucesso.')
                    res.redirect('/admin/torneios');
                } else {
                    req.flash('error', 'Não foi possível activar o torneio.');
                    res.redirect('/admin/torneios');
                }
            } else {
                // Escolheu só adicionar o torneio

                // Se só existe 1 torneio registado este fica activo
                Torneio.count()
                .then(async count => {
                    if(count == 1){
                        if(await setTorneioActivo(torneioId)){
                            req.flash('success', 'Torneio adicionado e activado com sucesso.')
                            res.redirect('/admin/torneios');
                        } else {
                            req.flash('error', 'Não foi possível activar o torneio.');
                            res.redirect('/admin/torneios');
                        }
                    } else {
                        // Existem mais que 1 torneios registados, adicionar apenas
                        req.flash('success', 'Torneio adicionado e activado com sucesso.')
                        res.redirect('/admin/torneios');
                    }
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'Não foi possível activar o torneio.');
                    res.redirect('/admin/torneios');
                });
            }
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível adicionar o torneio.');
            res.redirect('/admin/torneios');
        });
    }
}

exports.ActivaTorneio = (req, res, next) => {
    const torneioId = req.params.id;

    Torneio.findByPk(torneioId)
    .then(async torneio => {
        if(torneio){
            if(await setTorneioActivo(torneio.torneioId)){
                req.flash('success', `Torneio, ${torneio.designacao}, activado com sucesso.`)
                res.redirect('/admin/torneios');
            } else {
                req.flash('error', 'Não foi possível activar o torneio.');
                res.redirect('/admin/torneios');
            }
        } else{
            req.flash('error', 'Torneio não existe.')
            res.redirect('/admin/torneios');
        }
    })
    .catch(err => {
        console.log(err);
        req.flash('error', 'Não foi possível activar o torneio.')
        res.redirect('/admin/torneios');
    });
}

exports.updateTorneio = (req, res, next) => {
    const torneioId = req.params.id;
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = req.body.ano.trim();
    let campos = 0;
    const errors = validationResult(req);

    if(req.body.campos){
        campos = req.body.campos.trim();
    }

    if(!errors.isEmpty()){
        const oldData = {
            torneioId: torneioId,
            designacao: designacao,
            localidade: localidade,
            ano: ano,
            campos: campos
        }
        res.render('admin/editarTorneio', {validationErrors: errors.array({ onlyFirstError: true }), torneio: oldData});
    } else {
        Torneio.findByPk(torneioId)
        .then(torneio => {
            if(torneio){
                torneio.designacao = designacao;
                torneio.localidade = localidade;
                torneio.ano = ano;
                torneio.campos = campos;
                
                torneio.save()
                .then(result => {
                    if(result) {
                        req.flash('success', 'Torneio actualizado com sucesso.');
                        res.redirect('/admin/torneios');
                    } else {
                        req.flash('error', 'Ocurreu um erro durante a actualização do torneio.');
                        res.redirect('/admin/torneios');
                    }
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'Não foi possível actualizar o torneio.');
                    res.redirect('/admin/torneios');
                });
            } else {
                req.flash('error', 'Torneio não existe.');
                res.redirect('/admin/torneios');
            }
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível actualizar o torneio.');
            res.redirect('/admin/torneios');
        });
    }
}

exports.deleteTorneio = (req, res, next) => {
    const torneioId = req.body.id;

    Torneio.destroy({where: {torneioId: torneioId}, limit: 1})
        .then(result => {
            if(result){
                res.status(200).json({success: true});
            } else {
                res.status(200).json({success: false});
            }
        })
        .catch(err => { 
            res.status(200).json({success: false});
        });
}