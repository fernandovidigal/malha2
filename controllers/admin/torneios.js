const Torneio = require('../../models/Torneios');
const { validationResult } = require('express-validator/check');

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

exports.createTorneio = (req, res, next) => {
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = req.body.ano.trim();
    const campos = 0;
    const errors = validationResult(req);

    if(campos){
        campos = req.body.campos.trim();
    }

    if(!errors.isEmpty()){
        const oldData = {
            designacao: designacao,
            localidade: localidade,
            ano: ano,
            campos: campos
        }
        res.render('admin/adicionarTorneio', {validationErrors: errors.array({ onlyFirstError: true }), torneio: oldData});
    } else {
        Torneio.create({
            designacao: designacao,
            localidade: localidade,
            ano: ano,
            campos: campos
        })
        .then(torneio => {
            // Escolheu adicionar e activar o torneios
            if(req.body.adicionar_activar){
                torneio.activo = 1;
                torneio.save()
                .then(result => {
                    if(result){
                        req.flash('success', 'Torneio adicionado e activado com sucesso!')
                        res.redirect('/admin/torneios');
                    } else {
                        req.flash('error', 'Não foi possível activar o torneio!');
                        res.redirect('/admin/torneios');
                    }
                })
                .catch(err => {
                    console.log(err);
                    req.flash('error', 'Não foi possível activar o torneio!');
                    res.redirect('/admin/torneios');
                });
            } else {
                // Escolheu só adicionar o torneio
                /*Torneio.count()
                .then()
                .catch();*/
            }
        })
        .catch(err => {
            console.log(err);
            req.flash('error', 'Não foi possível adicionar o torneio!');
            res.redirect('/admin/torneios');
        });
    }
}