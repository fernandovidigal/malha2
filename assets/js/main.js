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
})({"main.js":[function(require,module,exports) {
var msgCloseBtn = document.querySelector('.floatMessage-closeBtn');

if (msgCloseBtn) {
  var msgBlock = msgCloseBtn.parentNode;
  var showTimer;
  showTimer = setTimeout(function () {
    msgBlock.remove();
  }, 4000);
  msgCloseBtn.addEventListener('click', function (e) {
    e.preventDefault();
    msgBlock.remove();
    showTimer.clearTimeout;
  });
}

var eye = '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="14" class="loginForm__showPassword--btn" viewBox="0 0 21 14"><path d="M10.5,66.917a4.044,4.044,0,0,0-1.139.182,2.02,2.02,0,0,1,.264.984,2.042,2.042,0,0,1-2.042,2.042,2.02,2.02,0,0,1-.984-.264,4.073,4.073,0,1,0,3.9-2.944Zm10.373,3.551A11.694,11.694,0,0,0,10.5,64,11.7,11.7,0,0,0,.127,70.468a1.179,1.179,0,0,0,0,1.064A11.694,11.694,0,0,0,10.5,78a11.7,11.7,0,0,0,10.373-6.468,1.179,1.179,0,0,0,0-1.064ZM10.5,76.25A9.918,9.918,0,0,1,1.826,71,9.917,9.917,0,0,1,10.5,65.75,9.917,9.917,0,0,1,19.175,71,9.917,9.917,0,0,1,10.5,76.25Z" transform="translate(-0.001 -64)"/></svg>';
var eyeSlash = '<svg xmlns="http://www.w3.org/2000/svg" width="23.268" height="18.614" class="loginForm__showPassword--btn" viewBox="0 0 23.268 18.614"><path d="M23.04,17.123,1.3.127A.582.582,0,0,0,.482.218L.118.672a.582.582,0,0,0,.091.818l21.741,17a.582.582,0,0,0,.818-.091l.364-.454a.582.582,0,0,0-.091-.818ZM10.78,5.324l4.9,3.831a4.054,4.054,0,0,0-4.9-3.831Zm1.688,7.964-4.9-3.831a4.062,4.062,0,0,0,4.057,3.921,4.108,4.108,0,0,0,.844-.089Zm-.844-9.218a9.89,9.89,0,0,1,8.65,5.235,10.381,10.381,0,0,1-1.6,2.189l1.372,1.072A12.132,12.132,0,0,0,21.97,9.837a1.176,1.176,0,0,0,0-1.061A11.665,11.665,0,0,0,11.624,2.326a11.224,11.224,0,0,0-3.8.684L9.508,4.329A9.543,9.543,0,0,1,11.624,4.071Zm0,10.47a9.89,9.89,0,0,1-8.65-5.235,10.378,10.378,0,0,1,1.6-2.188L3.2,6.046a12.128,12.128,0,0,0-1.923,2.73,1.176,1.176,0,0,0,0,1.061,11.66,11.66,0,0,0,10.344,6.449,11.268,11.268,0,0,0,3.8-.684l-1.687-1.319A9.561,9.561,0,0,1,11.624,14.542Z" transform="translate(0.01 0.001)"/></svg>';
var passwordField = document.querySelector('.passwordField');
var passwordIconContainer = document.querySelector('.showPassword__icon');

if (passwordIconContainer) {
  passwordIconContainer.addEventListener('click', function () {
    if (passwordField.type === 'password') {
      passwordField.type = 'text';
      passwordIconContainer.innerHTML = eyeSlash;
    } else {
      passwordField.type = 'password';
      passwordIconContainer.innerHTML = eye;
    }
  });
} // USER NAV MENU


var userNavToggle = document.querySelector('.userMenu');

if (userNavToggle) {
  var userMenu = document.querySelector('.user__navigation');
  userNavToggle.addEventListener('click', function (e) {
    e.stopPropagation();
    userMenu.classList.toggle('user__navigation-open');
  });
  document.addEventListener('click', function () {
    userMenu.classList.remove('user__navigation-open');
  });
}
},{}]},{},["main.js"], null)