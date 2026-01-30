// ======================================================
//  Script v8 — iOS Pill + Tradução + Bandeiras + Minimalista ASCII (REFACTORED)
// ======================================================
 
print(0, "\x0314Script - iOS Pill Country Fixed v8.0");
 
// CONFIGURAÇÕES
var CONFIG = {
    intervaloAvatar: 15,
    molduraURL: "http://i.imgur.com/9uYxq8W.png",
    apiURLs: {
        geo: "http://ip-api.com/json/",
        translate: "http://translate.googleapis.com/translate_a/single",
        flag: "https://flagcdn.com/w20/"
    }
};

var ultimoAvatar = {};
var paisUsuario = {};
var cacheTraducao = {};
 
// ======================================================
//  MAPA DE BANDEIRAS (centralizado)
// ======================================================
var FLAGS_MAP = {
    "BR":"🇧🇷","US":"🇺🇸","CA":"🇨🇦","MX":"🇲🇽","AR":"🇦🇷","CL":"🇨🇱","CO":"🇨🇴",
    "PE":"🇵🇪","VE":"🇻🇪","UY":"🇺🇾","PY":"🇵🇾","BO":"🇧🇴","PT":"🇵🇹","ES":"🇪🇸",
    "FR":"🇫🇷","IT":"🇮🇹","DE":"🇩🇪","NL":"🇳🇱","BE":"🇧🇪","CH":"🇨🇭","AT":"🇦🇹",
    "SE":"🇸🇪","NO":"🇳🇴","DK":"🇩🇰","FI":"🇫🇮","GB":"🇬🇧","IE":"🇮🇪","RU":"🇷🇺",
    "UA":"🇺🇦","PL":"🇵🇱","CZ":"🇨🇿","RO":"🇷🇴","HU":"🇭🇺","CN":"🇨🇳","JP":"🇯🇵",
    "KR":"🇰🇷","IN":"🇮🇳","PH":"🇵🇭","ID":"🇮🇩","AU":"🇦🇺","NZ":"🇳🇿","ZA":"🇿🇦",
    "EG":"🇪🇬","NG":"🇳🇬","TR":"🇹🇷","SA":"🇸🇦","AE":"🇦🇪"
};
 
// ======================================================
//  UTILIDADES
// ======================================================
function escaparHTML(t) {
    if (!t) return "";
    return t.replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
            .replace(/'/g,"&#39;");
}

function getUserCountryCode(userobj) {
    return paisUsuario[userobj.externalIp] || "UN";
}

function getUserDisplayData(userobj) {
    var countryCode = getUserCountryCode(userobj);
    return {
        nome: escaparHTML(userobj.name),
        countryCode: countryCode,
        emoji: bandeiraEmoji(countryCode),
        avatar: "(•‿•)"
    };
}
 
// ======================================================
//  ANTI-FLOOD
// ======================================================
function podeMostrarAvatar(nome) {
    var agora = Date.now();
    var ultimo = ultimoAvatar[nome] || 0;
 
    if (agora - ultimo > CONFIG.intervaloAvatar) {
        ultimoAvatar[nome] = agora;
        return true;
    }
    return false;
}
 
// ======================================================
//  AVATAR + MOLDURA
// ======================================================
function mostrarAvatarComMoldura(userobj) {
    if (!userobj.avatar) return;
 
    var avatarScribble = userobj.avatar.toScribble();
    var moldura = new Scribble();
    moldura.src = CONFIG.molduraURL;
 
    moldura.oncomplete = function() {
        Users.local(function(localUser) {
            if (localUser.vroom === userobj.vroom) {
                localUser.scribble(avatarScribble);
                localUser.scribble(moldura);
            }
        });
    };
 
    moldura.download();
}
 
// ======================================================
//  BANDEIRAS — API + EMOJI
// ======================================================
function bandeiraAPI(countryCode) {
    if (!countryCode) return CONFIG.apiURLs.flag + "un.png";
    return CONFIG.apiURLs.flag + countryCode.toLowerCase() + ".png";
}
 
function bandeiraEmoji(countryCode) {
    if (!countryCode) return "🌐";
    return FLAGS_MAP[countryCode.toUpperCase()] || "🌐";
}
 
// ======================================================
//  BUSCAR PAÍS REAL (cache por IP)
// ======================================================
function obterPaisUsuario(userobj) {
    var ip = userobj.externalIp;
 
    if (paisUsuario[ip]) return;
 
    var req = new HttpRequest();
    req.utf = true;
    req.src = CONFIG.apiURLs.geo + ip + "?fields=countryCode";
 
    req.oncomplete = function() {
        try {
            var r = JSON.parse(this.page);
            paisUsuario[ip] = r.countryCode || "UN";
        } catch(e) {
            paisUsuario[ip] = "UN";
        }
    };
 
    req.download();
}
 
// ======================================================
//  TRADUÇÃO — Função genérica unificada
// ======================================================
function traduzirPara(texto, idioma, onSuccess) {
    var req = new HttpRequest();
    req.utf = true;
    
    var uri = encodeURIComponent(stripColors(texto));
    req.src = CONFIG.apiURLs.translate + "?client=gtx&sl=auto&tl=" + idioma + "&dt=t&q=" + uri;
 
    req.oncomplete = function() {
        if (!this.page) return;
 
        try {
            var r = JSON.parse(this.page);
            var traducao = r[0][0][0];
            onSuccess(traducao);
        } catch(e) {}
    };
 
    req.download();
}

function traduzirAutomatico(userobj, textoOriginal) {
    obterPaisUsuario(userobj);
 
    // Verifica cache
    if (cacheTraducao[textoOriginal]) {
        enviarMensagem(userobj, textoOriginal, cacheTraducao[textoOriginal]);
        return;
    }
 
    // Tenta traduzir para PT
    traduzirPara(textoOriginal, "pt", function(traduzPT) {
        if (textoOriginal.toLowerCase() !== traduzPT.toLowerCase()) {
            cacheTraducao[textoOriginal] = traduzPT;
            enviarMensagem(userobj, textoOriginal, traduzPT);
        } else {
            // Se PT não funcionou, tenta ES
            traduzirPara(textoOriginal, "es", function(traduzES) {
                if (textoOriginal.toLowerCase() !== traduzES.toLowerCase()) {
                    cacheTraducao[textoOriginal] = traduzES;
                    enviarMensagem(userobj, textoOriginal, traduzES);
                } else {
                    // Sem tradução necessária
                    enviarMensagem(userobj, textoOriginal, textoOriginal);
                }
            });
        }
    });
}
 
// ======================================================
//  CAIXA iOS PILL (Ares)
// ======================================================
function caixaAres(nome, original, traduzido, countryCode) {
    var flagURL = bandeiraAPI(countryCode);
 
    return "<div style='" +
        "font-family:-apple-system,Arial;" +
        "font-size:11px;" +
        "color:#1C1C1E;" +
        "background:#FFFFFF;" +
        "padding:8px 14px;" +
        "border-radius:20px;" +
        "border:1px solid #D1D1D6;" +
        "box-shadow:0 2px 4px rgba(0,0,0,0.15);" +
        "display:inline-block;" +
        "max-width:300px;" +
        "margin-left:40px;" +
        "transition:all 0.45s ease;" +
        "'" +
        " onmouseover=\"this.style.marginLeft='0px';\">" +
 
        "<div style='margin-bottom:4px;'>" +
        "<img src='" + flagURL + "' width='16' height='12' style='margin-right:6px;border-radius:2px;'/>" +
        "<span style='font-weight:600;color:#0A84FF;'>" + nome + "</span>" +
        ": <span style='color:#1C1C1E;'>" + escaparHTML(original) + "</span>" +
        "</div>" +
 
        "<div style='color:#3A3A3C;'>Tradução: " + escaparHTML(traduzido) + "</div>" +
        "</div>";
}
 
// ======================================================
//  ENVIO DUAL (Ares + Web) - Unificado
// ======================================================
function enviarDual(userobj, conteudoAres, conteudoWebArray) {
    Users.local(function(localUser) {
        if (localUser.vroom === userobj.vroom) {
            if (localUser.canHTML) {
                localUser.sendHTML(conteudoAres);
            } else {
                for (var i = 0; i < conteudoWebArray.length; i++) {
                    print(localUser, conteudoWebArray[i]);
                }
            }
        }
    });
}
 
// ======================================================
//  ENVIAR MENSAGEM - Função unificada
// ======================================================
function enviarMensagem(userobj, original, traduzido) {
    var userData = getUserDisplayData(userobj);
    var comTraducao = original.toLowerCase() !== traduzido.toLowerCase();
    
    // Conteúdo para Ares (HTML)
    var conteudoAres = caixaAres(userData.nome, original, traduzido, userData.countryCode);
    
    // Conteúdo para Web (texto simples)
    var conteudoWeb = [
        userData.avatar + " " + userData.emoji + " " + userData.nome + ": " + original
    ];
    
    if (comTraducao) {
        conteudoWeb.push("   ↳ " + traduzido);
    }
    
    enviarDual(userobj, conteudoAres, conteudoWeb);
}
 
// ======================================================
//  EVENTO PRINCIPAL
// ======================================================
function onTextBefore(userobj, text) {
    obterPaisUsuario(userobj);
 
    if (podeMostrarAvatar(userobj.name)) {
        mostrarAvatarComMoldura(userobj);
    }
 
    traduzirAutomatico(userobj, text);
 
    return ""; // oculta o texto original
}
