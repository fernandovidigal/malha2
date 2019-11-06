const sequelize = require("../../helpers/database");
const Torneios = require("../../models/Torneios");
const Campos = require("../../models/Campos");
const dbFunctions = require("../../helpers/DBFunctions");
const { validationResult } = require("express-validator/check");

exports.getAllTorneios = async (req, res, next) => {
  try {
    const torneios = await dbFunctions.getAllTorneios();
    res.render("admin/torneios", {
      torneios: torneios,
      breadcrumbs: req.breadcrumbs()
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Não foi possível obter os dados dos torneios!");
    res.redirect("/admin/torneios");
  }
};

exports.getTorneio = async (req, res, next) => {
  try {
    const torneioId = parseInt(req.params.id);
    let tab = req.params.tab || 1;

    if(tab < 1 || tab > 3){
      tab = 1;
    }

    const _listaEscaloes = dbFunctions.getAllEscaloesComCampos(torneioId);
    const _listaNumJogos = dbFunctions.getNumJogosAllEscaloes(torneioId);
    const _torneio = dbFunctions.getTorneioById(torneioId);
    const _listaUltimaFasePorEscalao = dbFunctions.getUltimaFasePorEscalao(torneioId);
    let escaloes = [];
    const listaEscaloesComCampo = [];

    const [listaEscaloes, torneio, listaNumJogos, listaUltimaFasePorEscalao] = await Promise.all([
      _listaEscaloes,
      _torneio,
      _listaNumJogos,
      _listaUltimaFasePorEscalao
    ]);

    for (const escalao of listaEscaloes) {
      const jogos = listaNumJogos.find(_escalao => _escalao.escalaoId == escalao.escalaoId);

      const _escalao = {
        escalaoId: escalao.escalaoId,
        designacao: escalao.designacao,
        sexo: escalao.sexo,
        campos: escalao.campos[0].numCampos,
        editavel: jogos == undefined ? true : false
      };

      escaloes.push(_escalao);
      listaEscaloesComCampo.push(escalao.escalaoId);
    }

    const escaloesSemCampos = await dbFunctions.getAllEscaloesSemCampos(torneioId,listaEscaloesComCampo);

    for (const escalao of escaloesSemCampos) {
      escalao.editavel = true;
    }

    // Junta as duas Arrays (com e sem campos definidos)
    escaloes = escaloes.concat(escaloesSemCampos);

    // Ordena a lista de Escalões pelo escalão Id
    escaloes.sort((a, b) => (a.escalaoId > b.escalaoId ? 1 : -1));


    // Lista dos escalões já com fases definidas para ser possível eliminar a última fase
    for(const faseEscalao of listaUltimaFasePorEscalao){
      let escalao = listaEscaloes.find(el => el.escalaoId == faseEscalao.escalaoId);
      if(!escalao){
        escalao = escaloesSemCampos.find(el => el.escalaoId == faseEscalao.escalaoId);
      }

      faseEscalao.designacao = escalao.designacao
      faseEscalao.sexo = escalao.sexo;
    }

    req.breadcrumbs("Editar Torneio", "/admin/editarTorneio");
    res.render("admin/editarTorneio", {
      torneio: torneio,
      escaloes: escaloes,
      resetFase: listaUltimaFasePorEscalao,
      selectedTab: tab,
      breadcrumbs: req.breadcrumbs()
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Não é possível editar o torneio.");
    res.redirect("/admin/torneios");
  }
};

exports.adicionarTorneio = async (req, res, next) => {
  try {
    const escaloes = await dbFunctions.getAllEscaloes();
    escaloes.forEach(escalao => {
      escalao.editavel = true
    });
    req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
    res.render("admin/adicionarTorneio", {
      torneio: {},
      escaloes: escaloes,
      breadcrumbs: req.breadcrumbs()
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Não foi possivel adicionar torneio. Não foi possível aceder à lista de escalões.");
    res.redirect("/admin/torneios");
  }
};

async function processaCriacaoCampos(transaction, torneioId, listaEscaloes) {
  for await (const escalao of listaEscaloes) {
    if (escalao.campos > 0) {
      await Campos.create(
        {
          torneioId: torneioId,
          escalaoId: escalao.escalaoId,
          numCampos: escalao.campos
        },
        { transaction }
      );
    }
  }
}

exports.createTorneio = async (req, res, next) => {
  try {
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = parseInt(req.body.ano.trim());
    const oldAno = req.body.ano.trim();
    const errors = validationResult(req).array({ onlyFirstError: true });

    // Processa todos os escalões
    const listaEscaloes = await dbFunctions.getAllEscaloes();
    for (const escalao of listaEscaloes) {
      const numCampos = parseInt(req.body[escalao.escalaoId]);
      // Campos - Verifica se é potência de 2
      if (Math.log2(numCampos) % 1 === 0) {
        escalao.campos = numCampos;
      } else {
        escalao.campos = 0;
      }
    }

    if(isNaN(ano)){
      errors.push({
        location: 'body',
        param: 'ano',
        value: '',
        msg: 'Ano do torneio inválido'
      });
    }

    if (errors.length > 0) {
      const oldData = {
        designacao: designacao,
        localidade: localidade,
        ano: isNaN(ano) ? oldAno : ano
      };
      req.breadcrumbs("Adicionar Torneio", "/admin/adicionarTorneio");
      res.render("admin/adicionarTorneio", {
        validationErrors: errors,
        escaloes: listaEscaloes,
        torneio: oldData,
        breadcrumbs: req.breadcrumbs()
      });
    } else {
      let novoTorneioId = 0;
      let transaction;

      try {
        transaction = await sequelize.transaction();

        let torneioCriado = await Torneios.create(
          {
            designacao: designacao,
            localidade: localidade,
            ano: ano
          },
          { transaction }
        );

        novoTorneioId = torneioCriado.torneioId;

        await processaCriacaoCampos(transaction, novoTorneioId, listaEscaloes);

        await transaction.commit();
      } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
      }

      if (transaction.finished === "commit" && novoTorneioId != 0) {
        // Escolheu adicionar e activar o torneios
        if (req.body.adicionar_activar) {
          await dbFunctions.setTorneioActivo(novoTorneioId);
          req.flash("success", "Torneio adicionado e activado com sucesso.");
          res.redirect("/admin/torneios");
        } else {
          // Escolheu só adicionar o torneio

          // Se só existe 1 torneio registado este fica activo
          const numTorneios = await dbFunctions.getNumTorneios();
          if (numTorneios == 1) {
            await dbFunctions.setTorneioActivo(novoTorneioId);
            req.flash("success", "Torneio adicionado e activado com sucesso.");
            res.redirect("/admin/torneios");
          } else {
            req.flash("success", "Torneio adicionado com sucesso.");
            res.redirect("/admin/torneios");
          }
        }
      } else {
        req.flash("error", "Não foi possível adicionar o torneio.");
        res.redirect("/admin/torneios");
      }
    }
  } catch (err) {
    console.log(err);
    req.flash("error", "Não foi possivel adicionar torneio.");
    res.redirect("/admin/torneios");
  }
};

exports.ActivaTorneio = async (req, res, next) => {
  try {
    const torneioId = parseInt(req.params.id);

    const torneio = await dbFunctions.getTorneioById(torneioId);
    if (torneio) {
      await dbFunctions.setTorneioActivo(torneio.torneioId);
      req.flash(
        "success",
        `${torneio.designacao}, activado com sucesso.`
      );
      res.redirect("/admin/torneios");
    } else {
      req.flash("error", "Torneio não existe.");
      res.redirect("/admin/torneios");
    }
  } catch (err) {
    console.log(err);
    req.flash("error", "Não foi possível activar o torneio.");
    res.redirect("/admin/torneios");
  }
};

async function processaUpdateCampos(transaction, torneioId, listaEscaloes) {
  const listaCampos = await dbFunctions.getAllCamposTransaction(
    torneioId,
    transaction
  );
  for await (const escalao of listaEscaloes) {
    const campoToUpdate = listaCampos.find(
      _campo => _campo.escalaoId == escalao.escalaoId
    );

    if (campoToUpdate != undefined) {
      if (escalao.campos == 0) {
        await campoToUpdate.destroy({ transaction });
      } else {
        await campoToUpdate.update(
          {
            numCampos: escalao.campos
          },
          { transaction }
        );
      }
    } else {
      if (escalao.campos > 0) {
        await Campos.create(
          {
            torneioId: torneioId,
            escalaoId: escalao.escalaoId,
            numCampos: escalao.campos
          },
          { transaction }
        );
      }
    }
  }
}

exports.updateTorneio = async (req, res, next) => {
  try {
    const torneioId = parseInt(req.params.id);
    const designacao = req.body.designacao.trim();
    const localidade = req.body.localidade.trim();
    const ano = parseInt(req.body.ano.trim());
    const errors = validationResult(req).array({ onlyFirstError: true });

    // Processa todos os escalões
    const listaEscaloes = await dbFunctions.getAllEscaloes();
    for (const escalao of listaEscaloes) {
      const numCampos = parseInt(req.body[escalao.escalaoId]);
      // Campos - Verifica se numCampos é potência de 2
      if (Math.log2(numCampos) % 1 === 0) {
        escalao.campos = numCampos;
      } else {
        escalao.campos = 0;
      }
    }

    if (errors.length > 0) {
      const oldData = {
        torneioId: torneioId,
        designacao: designacao,
        localidade: localidade,
        ano: ano
      };
      req.breadcrumbs("Editar Torneio", "/admin/editarTorneio");
      res.render("admin/editarTorneio", {
        validationErrors: errors,
        torneio: oldData,
        escaloes: listaEscaloes,
        breadcrumbs: req.breadcrumbs()
      });
    } else {
      let transaction;
      try {
        transaction = await sequelize.transaction();

        let torneioToUpdate = await Torneios.findByPk(torneioId, {
          transaction
        });

        await torneioToUpdate.update(
          {
            designacao: designacao,
            localidade: localidade,
            ano: ano
          },
          { transaction }
        );

        await processaUpdateCampos(transaction, torneioId, listaEscaloes);

        await transaction.commit();
      } catch (err) {
        console.log(err);
        await transaction.rollback();
        throw err;
      }

      if (transaction.finished === "commit") {
        req.flash("success", "Torneio actualizado com sucesso.");
        res.redirect("/admin/torneios");
      } else {
        req.flash("error", "Não foi possível actualizar o torneio.");
        res.redirect("/admin/torneios");
      }
    }
  } catch (err) {
    console.log(err);
    req.flash("error", "Não foi possível actualizar o torneio.");
    res.redirect("/admin/torneios");
  }
};

exports.deleteTorneio = (req, res, next) => {
  const torneioId = parseInt(req.body.id);

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
};

exports.deleteFase = async (req, res, next) => {
  const escalaoId = parseInt(req.body.escalaoId);
  const fase = parseInt(req.body.fase);
  const torneioId = parseInt(req.body.torneioId);

  try {
    const ultimaFase = await dbFunctions.getUltimaFase(torneioId, escalaoId);

    if(ultimaFase == fase){
      await dbFunctions.deleteFase(torneioId, escalaoId, ultimaFase);
      res.status(200).json({ 
        success: true ,
        fase: fase,
        escalaoId: escalaoId
      });
    } else {
      res.status(200).json({
        success: false,
        errMsg: `Fase Inválida!`
      });
    }

  } catch(err) {
    console.log(err);
    res.status(200).json({
      success: false,
      errMsg: `Não foi possível eliminar a fase ${((fase != 100) ? fase : 'Final')}`
    });
  }
}
