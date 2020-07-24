const sequelize = require("../../helpers/database");
const Torneios = require("../../models/Torneios");
const Campos = require("../../models/Campos");
const dbFunctions = require("../../helpers/DBFunctions");
const { validationResult } = require("express-validator");
const crypto = require('crypto');
const axios = require('axios');

exports.getAllTorneios = async (req, res) => {
  try {
    const torneios = await dbFunctions.getAllTorneios();
    res.render("admin/torneios", {
      torneios: torneios,
      breadcrumbs: req.breadcrumbs()
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Não foi possível obter os torneios");
    res.redirect("/admin/torneios");
  }
};

exports.getTorneio = async (req, res) => {
  try {
    const torneioId = parseInt(req.params.id);
    let tab = req.params.tab || 1;

    if(tab < 1 || tab > 3){
      tab = 1;
    }
    
    const _listaEscaloes = dbFunctions.getAllEscaloes();
    const _listaNumJogos = dbFunctions.getNumJogosAllEscaloes(torneioId);
    const _torneio = dbFunctions.getTorneioById(torneioId);
    const _listaUltimaFasePorEscalao = dbFunctions.getUltimaFasePorEscalao(torneioId);
    const _listaNumCampos = dbFunctions.getNumCamposEscaloes(torneioId);
    const _numEquipasPorEscalao = dbFunctions.getNumEquipasPorCadaEscalao(torneioId);

    const [listaEscaloes, torneio, listaNumJogos, listaUltimaFasePorEscalao, listaNumCampos, numEquipasPorEscalao] = await Promise.all([
      _listaEscaloes,
      _torneio,
      _listaNumJogos,
      _listaUltimaFasePorEscalao,
      _listaNumCampos,
      _numEquipasPorEscalao
    ]);

    for (const escalao of listaEscaloes) {
      const jogos = listaNumJogos.find(el => el.escalaoId == escalao.escalaoId);
      const numCampos = listaNumCampos.find(el => el.escalaoId == escalao.escalaoId);
      const fase = listaUltimaFasePorEscalao.find(el => el.escalaoId == escalao.escalaoId);
      const numEquipas = numEquipasPorEscalao.find(el => el.escalaoId == escalao.escalaoId);

      escalao.campos = numCampos != undefined ? numCampos.numCampos : 0;
      escalao.editavel = jogos == undefined ? true : false;
      escalao.fase = fase != undefined ? fase.fase : 0;
      escalao.numEquipas = numEquipas != undefined ? numEquipas.numEquipas : 0;
    }

    req.breadcrumbs("Editar Torneio", "/admin/editarTorneio");
    res.render("admin/editarTorneio", { torneio: torneio, escaloes: listaEscaloes, selectedTab: tab, breadcrumbs: req.breadcrumbs() });
  } catch (err) {
    console.log(err);
    req.flash("error", "Não é possível editar o torneio");
    res.redirect("/admin/torneios");
  }
}

exports.adicionarTorneio = async (req, res) => {
  try {
    const escaloes = await dbFunctions.getAllEscaloes();
    escaloes.forEach(escalao => {
      escalao.editavel = true
    });

    req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
    res.render("admin/adicionarTorneio", { torneio: {}, escaloes: escaloes, breadcrumbs: req.breadcrumbs() });

  } catch (err) {
    console.log(err);
    req.flash("error", "Não foi possivel adicionar torneio");
    res.redirect("/admin/torneios");
  }
};

async function processaCriacaoCampos(transaction, torneioId, listaEscaloes) {
  const campos = [];

  listaEscaloes.forEach(escalao => {
    if(escalao.campos > 0){
      const campo = {
        torneioId: torneioId,
        escalaoId: escalao.escalaoId,
        numCampos: escalao.campos
      }
      campos.push(campo);
    }
  });

  await Campos.bulkCreate(campos, { transaction });
}

exports.createTorneio = async (req, res) => {
  const designacao = req.body.designacao.trim();
  const localidade = req.body.localidade.trim();
  const ano = parseInt(req.body.ano.trim());
  const errors = validationResult(req);

  const oldData = {
    designacao: designacao,
    localidade: localidade,
    ano: ano
  };

  try {
    // Processa todos os escalões
    const listaEscaloes = await dbFunctions.getAllEscaloes();
    listaEscaloes.forEach(escalao => {
      const numCampos = parseInt(req.body[escalao.escalaoId]);
      escalao.campos = (Math.log2(numCampos) % 1 === 0) ? numCampos : 0;
    });

    if(!errors.isEmpty()){
      req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
      return res.render("admin/adicionarTorneio", { validationErrors: errors.array({ onlyFirstError: true }), escaloes: listaEscaloes, torneio: oldData, breadcrumbs: req.breadcrumbs() });
    }

    const torneioToHash = designacao + localidade + ano;
    const syncAppHash = crypto.createHash('sha512').update(torneioToHash.toUpperCase()).digest('hex');

    let transaction;

    try {
      transaction = await sequelize.transaction();

      const [torneioModel, created] = await Torneios.findOrCreate({
        where: { syncApp: syncAppHash },
        defaults: {
            designacao: designacao,
            localidade: localidade,
            ano: ano
        },
        transaction: transaction
      });

      if(!created){
        await transaction.rollback();
        const errors = [{
          msg: 'O Torneio já existe',
          param: 'designacao'
        }];
        req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
        return res.render("admin/adicionarTorneio", { validationErrors: errors, escaloes: listaEscaloes, torneio: oldData, breadcrumbs: req.breadcrumbs() });
      }

      await processaCriacaoCampos(transaction, torneioModel.torneioId, listaEscaloes);

      await transaction.commit();

      if (transaction.finished === "commit") {
        // TODO: Sync na plataforma WEB

        // Escolheu adicionar e activar o torneios
        if (req.body.adicionar_activar) {
          await dbFunctions.setTorneioActivo(torneioModel.torneioId);
          req.flash("success", "Torneio adicionado e activado com sucesso.");
          return res.redirect("/admin/torneios");
        } else {
          // Escolheu só adicionar o torneio
          // Se só existe 1 torneio registado este fica activo
          const numTorneios = await dbFunctions.getNumTorneios();
          if (numTorneios == 1) {
            await dbFunctions.setTorneioActivo(torneioModel.torneioId);
            req.flash("success", "Torneio adicionado e activado com sucesso.");
            return res.redirect("/admin/torneios");
          } else {
            req.flash("success", "Torneio adicionado com sucesso.");
            return res.redirect("/admin/torneios");
          }
        }
      } else {
        req.flash("error", "Não foi possível adicionar o torneio.");
        return res.redirect("/admin/torneios");
      }

    } catch(err){
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    req.flash("error", "Não foi possivel adicionar o torneio.");
    res.redirect("/admin/torneios");
  }
}

exports.ActivaTorneio = async (req, res) => {
  try {
    const torneioId = parseInt(req.params.id);

    const torneio = await dbFunctions.getTorneioById(torneioId);
    if (torneio) {
      await dbFunctions.setTorneioActivo(torneio.torneioId);
      req.flash("success", `${torneio.designacao}, activado com sucesso`);
      res.redirect("/admin/torneios");
    } else {
      req.flash("error", "Torneio não existe");
      res.redirect("/admin/torneios");
    }
  } catch (err) {
    console.log(err);
    req.flash("error", "Não foi possível activar o torneio");
    res.redirect("/admin/torneios");
  }
};

async function processaUpdateCampos(transaction, torneioId, listaEscaloes) {
  const listaCampos = await dbFunctions.getAllCamposTransaction(torneioId, transaction);

  for await (const escalao of listaEscaloes) {
    const campoToUpdate = listaCampos.find(el => el.escalaoId == escalao.escalaoId);

    if (campoToUpdate) {
      if (escalao.campos == 0) {
        await campoToUpdate.destroy({ transaction });
      } else {
        await campoToUpdate.update({ numCampos: escalao.campos }, { transaction });
      }
    } else {
      if (escalao.campos > 0) {
        await Campos.create({
            torneioId: torneioId,
            escalaoId: escalao.escalaoId,
            numCampos: escalao.campos
          }, { transaction }
        );
      }
    }
  }
}

exports.updateTorneio = async (req, res) => {
  const torneioId = parseInt(req.params.id);
  const designacao = req.body.designacao.trim();
  const localidade = req.body.localidade.trim();
  const ano = parseInt(req.body.ano.trim());
  let tab = req.params.tab || 1;

  if(tab < 1 || tab > 3){
    tab = 1;
  }

  // Processa todos os escalões
  const listaEscaloes = await dbFunctions.getAllEscaloes();
  listaEscaloes.forEach(escalao => {
    const numCampos = parseInt(req.body[escalao.escalaoId]);
    escalao.campos = (Math.log2(numCampos) % 1 === 0) ? numCampos : 0;
  });

  const oldData = {
    torneioId: torneioId,
    designacao: designacao,
    localidade: localidade,
    ano: ano
  };

  try {
    
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.breadcrumbs("Editar Torneio", "/admin/editarTorneio");
      return res.render("admin/editarTorneio", { validationErrors: errors.array({ onlyFirstError: true }), torneio: oldData, escaloes: listaEscaloes, selectedTab: tab, breadcrumbs: req.breadcrumbs() });
    }

    const torneioToHash = designacao + localidade + ano;
    const updatedSyncAppHash = crypto.createHash('sha512').update(torneioToHash.toUpperCase()).digest('hex');

    let transaction;

    try {
      transaction = await sequelize.transaction();

      await Torneios.update(
        {
          designacao: designacao,
          localidade: localidade,
          ano: ano,
          syncApp: updatedSyncAppHash
        },
        {
          where: { torneioId: torneioId }
        },
        { transaction: transaction }
      );

      await processaUpdateCampos(transaction, torneioId, listaEscaloes);

      await transaction.commit();

      if (transaction.finished === "commit") {
        const torneio = await Torneios.findByPk(torneioId);

        // TODO: Sync com plataforma WEB

        req.flash("success", "Torneio actualizado com sucesso");
        return res.redirect("/admin/torneios");
      } else {
        req.flash("error", "Não foi possível actualizar o torneio");
        return res.redirect("/admin/torneios");
      }

    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    if(err.name == 'SequelizeUniqueConstraintError'){
      const errors = [{
          msg: 'O Torneio já existe',
          param: 'designacao'
      }];
      req.breadcrumbs("Editar Torneio", "/admin/editarTorneio");
      return res.render("admin/editarTorneio", { validationErrors: errors, torneio: oldData, escaloes: listaEscaloes, selectedTab: tab, breadcrumbs: req.breadcrumbs() });
    }
    req.flash("error", "Não foi possível actualizar o torneio");
    res.redirect("/admin/torneios");
  }
};

exports.deleteTorneio = (req, res) => {
  const torneioId = parseInt(req.body.id);

  if(req.user.level == 5 || req.user.level == 10){
    Torneios.destroy({ where: { torneioId: torneioId }, limit: 1 })
      .then(result => {
        if (result) {
          res.status(200).json({ success: true });
        } else {
          res.status(200).json({ success: false });
        }
      })
      .catch(err => {
        res.status(200).json({ success: false });
      });
  } else {
    res.status(200).json({ success: false });
  }
};

exports.deleteFase = async (req, res) => {
  try {
    const escalaoId = parseInt(req.body.escalaoId);
    const torneioId = parseInt(req.body.torneioId);
    const fase = parseInt(req.body.fase);

    if(req.user.level != 5 && req.user.level != 10){
      throw new Error('Não tem permissões para eliminar a fase');
    }

    const ultimaFase = await dbFunctions.getUltimaFase(torneioId, escalaoId);

    if(ultimaFase != fase){
      throw new Error('Fase Inválida');
    }

    await dbFunctions.deleteFase(torneioId, escalaoId, ultimaFase);
    
    res.status(200).json({ 
      success: true ,
      fase: fase,
      escalaoId: escalaoId
    });

  } catch(err) {
    console.log(err);
    res.status(200).json({
      success: false,
      errMsg: err.message
    });
  }
}
