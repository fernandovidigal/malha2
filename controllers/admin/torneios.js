const sequelize = require("../../helpers/database");
const Torneios = require("../../models/Torneios");
const Campos = require("../../models/Campos");
const Jogos = require("../../models/Jogos");
const Equipas = require("../../models/Equipas");
const Interdicoes = require("../../models/Interdicoes");
const dbFunctions = require("../../helpers/DBFunctions");
const { validationResult } = require("express-validator");
const crypto = require('crypto');
const axios = require('axios');
const Sequelize = require('sequelize');
const { syncTorneios } = require('../../helpers/sync/torneios');

exports.getAllTorneios = async (req, res) => {
  try {
    const torneios = await dbFunctions.getAllTorneios();
    res.render("admin/torneios", {
      torneios: torneios,
      breadcrumbs: req.breadcrumbs()
    });
  } catch (err) {
    req.flash("error", "Não foi possível obter os torneios");
    res.redirect("/admin/torneios");
  }
};

exports.getTorneio = async (req, res) => {
  try {
    const torneioId = parseInt(req.params.id);
    let tab = req.params.tab || 1;

    if(tab < 1 || tab > 4){
      tab = 1;
    }
    
    const _listaEscaloes = dbFunctions.getAllEscaloes();
    const _listaNumJogos = dbFunctions.getNumJogosAllEscaloes(torneioId);
    const _torneio = dbFunctions.getTorneioById(torneioId);
    const _listaUltimaFasePorEscalao = dbFunctions.getUltimaFasePorEscalao(torneioId);
    const _listaNumCampos = dbFunctions.getNumCamposEscaloes(torneioId);
    const _numEquipasPorEscalao = dbFunctions.getNumEquipasPorCadaEscalao(torneioId);
    const _totalJogos = dbFunctions.getTotalJogos(torneioId);

    const [listaEscaloes, torneio, listaNumJogos, listaUltimaFasePorEscalao, listaNumCampos, numEquipasPorEscalao, totalJogos] = await Promise.all([
      _listaEscaloes,
      _torneio,
      _listaNumJogos,
      _listaUltimaFasePorEscalao,
      _listaNumCampos,
      _numEquipasPorEscalao,
      _totalJogos
    ]);

    const numTotalEquipas = numEquipasPorEscalao.reduce((acumulador, {numEquipas}) => acumulador + numEquipas, 0);

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
    res.render("admin/editarTorneio", { torneio: torneio, escaloes: listaEscaloes, selectedTab: tab, numTotalJogos: totalJogos, numTotalEquipas: numTotalEquipas, breadcrumbs: req.breadcrumbs() });
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

    // Verifica o número de torneios
    const numTorneios = await dbFunctions.getNumTorneios();

    if(!errors.isEmpty()){
      req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
      return res.render("admin/adicionarTorneio", { validationErrors: errors.array({ onlyFirstError: true }), escaloes: listaEscaloes, torneio: oldData, breadcrumbs: req.breadcrumbs() });
    }

    const torneioToHash = designacao + localidade + ano;
    const hash = crypto.createHash('sha512').update(torneioToHash.toUpperCase()).digest('hex');
    const transaction = await sequelize.transaction();

    try {
      if(req.session.activeConnection){
        const response = await axios.post(`${req.session.syncUrl}torneios/create.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
          designacao: designacao,
          localidade: localidade,
          ano: ano,
          hash: hash
        });

        // Pode ser retornado uma localidade (caso exista) ou o uuid (caso seja inserido)
        if(response.data.sucesso && (response.data.uuid || response.data.torneio)){
          const torneioModel = await Torneios.create({
            designacao: designacao,
            localidade: localidade,
            ano: ano,
            activo: (req.body.adicionar_activar || numTorneios == 0) ? 1 : 0,
            uuid: response.data.uuid || response.data.torneio.uuid,
            hash: hash
          }, {transaction: transaction});
          
          await processaCriacaoCampos(transaction, torneioModel.torneioId, listaEscaloes);
         
          let message = '';
          // Escolheu adicionar e activar o torneios
          if (req.body.adicionar_activar || numTorneios == 0) {
            message = "Torneio adicionado e activado com sucesso.";
          } else {
            message = "Torneio adicionado com sucesso.";
          }

          await transaction.commit();

          req.flash("success", message);
          return res.redirect("/admin/torneios");

        } else {
          throw new Error();
        }
      } else {
        throw new Error();
      }
    } catch(error){
      await transaction.rollback();
      throw error;
    }
  } catch (err) {
    if(err instanceof Sequelize.UniqueConstraintError){
      const errors = [{
        msg: 'O Torneio já existe',
        param: 'designacao'
      }];
      req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
      return res.render("admin/adicionarTorneio", { validationErrors: errors, escaloes: listaEscaloes, torneio: oldData, breadcrumbs: req.breadcrumbs() });
    } else {
      req.flash("error", "Não foi possivel adicionar o torneio.");
      res.redirect("/admin/torneios");
    } 
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
    const hash = crypto.createHash('sha512').update(torneioToHash.toUpperCase()).digest('hex');

    const transaction = await sequelize.transaction();

    try {
      const torneio = await Torneios.findByPk(torneioId);

      await Torneios.update({
        designacao: designacao,
        localidade: localidade,
        ano: ano,
        hash: hash
      }, {
        where: {
          torneioId: torneioId
        },
        transaction: transaction
      });

      const response = await axios.post(`${req.session.syncUrl}torneios/update.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
        uuid: torneio.uuid,
        designacao: designacao,
        localidade: localidade,
        ano: ano,
        hash: hash
      });

      if(response.data.sucesso){
        await processaUpdateCampos(transaction, torneioId, listaEscaloes);
        await transaction.commit();

        req.flash("success", "Torneio actualizado com sucesso");
        return res.redirect("/admin/torneios");
      } else {
        throw new Error();
      }
    } catch(error) {
      await transaction.rollback();
      throw error;
    }
  } catch (err) {
    if(err instanceof Sequelize.UniqueConstraintError){
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

exports.deleteTorneio = async (req, res) => {
  const torneioId = parseInt(req.body.id);

  if(req.session.activeConnection && (req.user.level == 5 || req.user.level == 10)){
    try {
      const torneio = await Torneios.findByPk(torneioId);
      const response = await axios.post(`${req.session.syncUrl}torneios/delete.php?key=LhuYm7Fr3FIy9rrUZ4HH9HTvYLr1DoGevZ0IWvXN1t90KrIy`, {
        uuid: torneio.uuid
      });

      if(response.data.sucesso){
        await torneio.destroy();
      } else {
          throw new Error();
      }

      res.status(200).json({ success: true });
    } catch(error){
      throw error;
    }
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
      success: true,
      fase: fase,
      escalaoId: escalaoId
    });

  } catch(err) {
    res.status(200).json({
      success: false,
      errMsg: err.message
    });
  }
}

exports.sincronizarTorneios = async (req, res) => {
  try {
    const url = req.session.syncUrl;
    await syncTorneios(url);
    req.flash("success", "Torneios sincronizados");
    return res.redirect("/admin/torneios");
  } catch(error) {
    req.flash("error", "Não foi sincronizar os torneios");
    res.redirect("/admin/torneios");
  }
}

exports.resetTorneio = async (req, res) => {
  try {
    const torneioId = parseInt(req.body.torneioId);
    const torneio = await Torneios.findByPk(torneioId);

    await Campos.destroy({
      where: { torneioId: torneio.torneioId }
    });

    await Jogos.destroy({
      where: { torneioId: torneio.torneioId }
    });

    await Interdicoes.destroy({
      where: { torneioId: torneio.torneioId }
    });

    res.status(200).json({ 
      success: true
    });

  } catch(error){
    res.status(200).json({
      success: false,
      errMsg: error.message
    });
  }
}

exports.deleteEquipas = async (req, res) => {
  try {
    const torneioId = parseInt(req.body.torneioId);
    const torneio = await Torneios.findByPk(torneioId);

    await Equipas.destroy({
      where: { torneioId: torneio.torneioId }
    });

    res.status(200).json({ 
      success: true
    });

  } catch(error){
    res.status(200).json({
      success: false,
      errMsg: error.message
    });
  }
}