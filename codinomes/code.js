
var chavesMode;
var gameNumber;
var corInicio;
var random;
var celulas;

var initGame = function (isChaves) {
    chavesMode = !!isChaves;
    var num = window.location.search;
    if (num.length > 1 && num[0] === "?") {
        num = Number.parseFloat(num.substr(1));
        if (num >= 0) gameNumber = Number.parseFloat(num.toFixed(1));
    }
    if (gameNumber === undefined) {
        gameNumber = ((Math.random() * 1000000) | 0) + (Math.random() >= 0.5 ? 0.1 : 0.2);
        window.top.location.href = window.location.origin +  window.location.pathname + "?" + gameNumber.toFixed(1);
    }

    corInicio = Math.round(((gameNumber - (gameNumber | 0)) * 10));
    if (corInicio !== 1 && corInicio !== 2) {
        gameNumber = (gameNumber | 0) + 0.1;
        window.top.location.href = window.location.origin +  window.location.pathname + "?" + gameNumber.toFixed(1);
    }

    console.log("Game: " + gameNumber);
    random = randomGenerator(gameNumber | 0);
    cria();
};

function cria() {

    var tabela = document.createElement("div");
    tabela.classList.add("tabela");
    document.body.appendChild(tabela);

    celulas = new Array(5);

    for (var lin = 0; lin < 5; ++lin) {
        celulas[lin] = new Array(5);

        var linha = document.createElement("div");
        linha.classList.add("linha");
        tabela.appendChild(linha);

        for (var col = 0; col < 5; ++col) {
            var wrapper = document.createElement("div");
            wrapper.classList.add("celula-wrapper");
            linha.appendChild(wrapper);
            var celula = celulas[lin][col] = document.createElement("button");
            celula.classList.add("celula");
            wrapper.appendChild(celula);
            celula.addEventListener("click", celulaClicked);
        }
    }

    var body = document.body;
    var fullscreenAPIEnterMethod = body.requestFullscreen || body.webkitRequestFullscreen || body.webkitRequestFullScreen || body.mozRequestFullScreen;
    if (fullscreenAPIEnterMethod) {
        var goFS = function (e) {
            e.stopPropagation();
            fullscreenAPIEnterMethod.call(body);
            tabela.removeEventListener("click", goFS, true);
        };
        tabela.addEventListener("click", goFS, true);
    }

    setaPalavras();
    setaCores();
}

function celulaClicked(e) {
    var celula = e.target;
    if (chavesMode) {
        escondeCelula(celula, !celula.escondida);
    } else {
        var corWasOn = celula.corOn;
        mostraCorCelula(celula, !corWasOn);
        //escondeCelula(celula, !corWasOn);
    }
}

function mostraCorCelula(celula, on) {
    celula.corOn = !!on;
    for (var cla = 0; cla < 5; ++cla) celula.classList.remove(CORES[cla]);
    if (on) celula.classList.add(CORES[celula.cor]);
}

function escondeCelula(celula, on) {
    celula.escondida = !!on;
    if (on) celula.classList.add("escondida");
    else celula.classList.remove("escondida");
}

function setaPalavras() {
    sorteia(celulas, DICIONARIO, function(celula, palavra) {
        celula.palavra = palavra;
        celula.innerHTML = palavra;
    });
}

function setaCores() {
    CHAVES.push(corInicio);
    sorteia(celulas, CHAVES, function(celula, cor) {
        celula.cor = cor;
        if (chavesMode) mostraCorCelula(celula, true);
    });
}

function sorteia(celulas, possiveis, aplica) {
    celulas = Array.prototype.concat.apply([], celulas);
    possiveis = possiveis.slice();

    while(possiveis.length && celulas.length) {
        var valor = possiveis.splice(random(possiveis.length), 1)[0];
        var celula = celulas.splice(random(celulas.length), 1)[0];
        aplica(celula, valor);
    }
}

function randomGenerator(state1, state2){
    var mod1 = 4294967087;
    var mul1 = 65539;
    var mod2 = 4294965887;
    var mul2 = 65537;
    if (typeof state1 != "number") state1 = +new Date();
    if (typeof state2 != "number") state2 = state1;
    state1 = state1 % (mod1-1) + 1;
    state2 = state2 % (mod2-1) + 1;
    function rng(limit){
        state1 = (state1 * mul1) % mod1;
        state2 = (state2 * mul2) % mod2;
        if (state1 < limit && state2 < limit && state1 < mod1 % limit && state2 < mod2 % limit)
            return rng(limit);
        return (state1 + state2) % limit;
    }
    return rng;
}



var CORES = [ "original", "azul", "vermelha", "amarela", "preta" ];

var CHAVES = [
    1, 1, 1, 1, 1, 1, 1, 1,
    2, 2, 2, 2, 2, 2, 2, 2,
    3, 3, 3, 3, 3, 3, 3,
    4
    // Adicionar 1 ou 2 ao final para completar as 25 entradas
];