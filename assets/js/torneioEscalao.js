// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"torneioEscalao.js":[function(require,module,exports) {
// Delete Buttons
var alteraEscalaoBtns = document.querySelectorAll('.alteraNumCampos_btn');
alteraEscalaoBtns.forEach(function (item, index) {
  item.addEventListener('click', function (e) {
    e.preventDefault();
    var escalaoId = this.dataset.escalao;
    fetch("/torneio/getEscalaoInfo/".concat(escalaoId)).then(function (response) {
      if (response.ok) {
        return response.json();
      } else {
        return Promise.reject('Não foi possível connectar à base de dados.');
      }
    }).then(function (data) {
      if (data.success) {
        var escalao = data.escalao;
        Swal.fire({
          title: 'Alterar número de campos',
          html: "<strong>Escal\xE3o:</strong> ".concat(escalao.designacao, " <small>(").concat(escalao.sexo, ")</small>"),
          input: 'number',
          inputValue: escalao.numCampos,
          inputAttributes: {
            autocapitalize: 'off',
            autofocus: true,
            min: 0
          },
          showCancelButton: true,
          confirmButtonText: 'Alterar',
          showLoaderOnConfirm: true,
          preConfirm: function preConfirm(campos) {
            return fetch("/torneio/setEscalaoNumCampos", {
              headers: {
                'Content-Type': 'application/json'
              },
              method: 'PUT',
              body: JSON.stringify({
                torneioId: escalao.torneioId,
                escalaoId: escalao.escalaoId,
                numCampos: campos
              })
            }).then(function (response) {
              if (response.ok) {
                return response.json();
              } else {
                return Promise.reject('Não foi possível connectar à base de dados.');
              }
            })["catch"](function (err) {
              Swal.fire({
                type: 'error',
                title: 'Oops...',
                text: err
              });
            });
          },
          inputValidator: function inputValidator(numCampos) {
            console.log("Aqui");
            console.log(numCampos);

            if (numCampos != '' && numCampos != 0) {
              if (Math.log2(parseInt(numCampos)) % 1 !== 0) {
                return "Número de campos inválido. O número de campos deve ser uma potência de 2. (Ex: 2, 4, 8, 16, ...)";
              }
            } else if (numCampos == 0) {
              return "O número de campos não pode ser 0.";
            }
          },
          allowOutsideClick: function allowOutsideClick() {
            return !Swal.isLoading();
          }
        }).then(function (data) {
          if (data.value.success) {
            Swal.fire({
              type: 'success',
              title: 'Número de campos actualizado com sucesso.',
              showConfirmButton: false,
              timer: 1000,
              onClose: function onClose() {
                location.reload();
              }
            });
          } else {
            return Promise.reject('Não foi actualiazar o número de campos.');
          }
        });
      } else {
        return Promise.reject('Não foi possível obter dados do escalão.');
      }
    })["catch"](function (err) {
      Swal.fire({
        type: 'error',
        title: 'Oops...',
        text: err
      });
    });
  });
});
},{}]},{},["torneioEscalao.js"], null)