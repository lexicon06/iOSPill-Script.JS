// ======================================================
//  Script v8 — iOS Pill + Tradução + Bandeiras + Minimalista ASCII
// ======================================================
 
print(0, "\x0314Script - iOS Pill Country Fixed v8.0");
 
// CONFIGURAÇÕES
var intervaloAvatar = 15;
var ultimoAvatar = {};
var paisUsuario = {};       // cache de país por IP
var cacheTraducao = {};     // cache de traduções
var molduraURL = "http://i.imgur.com/9uYxq8W.png";
 
// ======================================================
//  ANTI-FLOOD
// ======================================================
function podeMostrarAvatar(nome) {
    var agora = Date.now();
    var ultimo = ultimoAvatar[nome] || 0;
 
    if (agora - ultimo > intervaloAvatar) {
        ultimoAvatar[nome] = agora;
        return true;
    }
    return false;
}
 
// ======================================================
//  AVATAR + MOLDURA
// ======================================================
function mostrarAvatarComMoldura(user) {
    if (!user.avatar) return;
 
    var avatarScribble = user.avatar.toScribble();
    var moldura = new Scribble();
    moldura.src = molduraURL;
 
    moldura.oncomplete = function() {
        Users.local(function(u) {
            if (u.vroom === user.vroom) {
                u.scribble(avatarScribble);
                u.scribble(moldura);
            }
        });
    };
 
    moldura.download();
}
 
// ======================================================
//  BANDEIRAS — API + EMOJI
// ======================================================
function bandeiraAPI(countryCode) {
    if (!countryCode) return "https://flagcdn.com/w20/un.png";
    return "https://flagcdn.com/w20/" + countryCode.toLowerCase() + ".png";
}
 
function bandeiraEmoji(countryCode) {
    if (!countryCode) return "🌐";
    countryCode = countryCode.toUpperCase();
 
    var flags = {
        "BR":"🇧🇷","US":"🇺🇸","CA":"🇨🇦","MX":"🇲🇽","AR":"🇦🇷","CL":"🇨🇱","CO":"🇨🇴",
        "PE":"🇵🇪","VE":"🇻🇪","UY":"🇺🇾","PY":"🇵🇾","BO":"🇧🇴","PT":"🇵🇹","ES":"🇪🇸",
        "FR":"🇫🇷","IT":"🇮🇹","DE":"🇩🇪","NL":"🇳🇱","BE":"🇧🇪","CH":"🇨🇭","AT":"🇦🇹",
        "SE":"🇸🇪","NO":"🇳🇴","DK":"🇩🇰","FI":"🇫🇮","GB":"🇬🇧","IE":"🇮🇪","RU":"🇷🇺",
        "UA":"🇺🇦","PL":"🇵🇱","CZ":"🇨🇿","RO":"🇷🇴","HU":"🇭🇺","CN":"🇨🇳","JP":"🇯🇵",
        "KR":"🇰🇷","IN":"🇮🇳","PH":"🇵🇭","ID":"🇮🇩","AU":"🇦🇺","NZ":"🇳🇿","ZA":"🇿🇦",
        "EG":"🇪🇬","NG":"🇳🇬","TR":"🇹🇷","SA":"🇸🇦","AE":"🇦🇪"
    };
 
    return flags[countryCode] || "🌐";
}
 
// ======================================================
//  BUSCAR PAÍS REAL (cache por IP)
// ======================================================
function obterPaisUsuario(user) {
    var ip = user.externalIp;
 
    if (paisUsuario[ip]) return; // já temos
 
    var req = new HttpRequest();
    req.utf = true;
    req.src = "http://ip-api.com/json/" + ip + "?fields=countryCode";
 
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
//  TRADUÇÃO — com cache
// ======================================================
function traduzirAutomatico(user, textoOriginal) {
 
    obterPaisUsuario(user);
 
    if (cacheTraducao[textoOriginal]) {
        var t = cacheTraducao[textoOriginal];
        enviarTraducao(user, textoOriginal, t);
        return;
    }
 
    var req = new HttpRequest();
    req.utf = true;
 
    req.src = "http://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=pt&dt=t&q=" +
              encodeURIComponent(textoOriginal);
 
    req.oncomplete = function() {
        if (!this.page) return;
 
        try {
            var r = JSON.parse(this.page);
            var traduzPT = r[0][0][0];
 
            if (textoOriginal.toLowerCase() != traduzPT.toLowerCase()) {
                cacheTraducao[textoOriginal] = traduzPT;
                enviarTraducao(user, textoOriginal, traduzPT);
            } else {
                traduzirParaES(user, textoOriginal);
            }
 
        } catch(e) {}
    };
 
    req.download();
}
 
function traduzirParaES(user, texto) {
 
    var req = new HttpRequest();
    req.utf = true;
 
    req.src = "http://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=es&dt=t&q=" +
              encodeURIComponent(texto);
 
    req.oncomplete = function() {
        if (!this.page) return;
 
        try {
            var r = JSON.parse(this.page);
            var traduzES = r[0][0][0];
 
            if (texto.toLowerCase() != traduzES.toLowerCase()) {
                cacheTraducao[texto] = traduzES;
                enviarTraducao(user, texto, traduzES);
            } else {
                enviarSemTraducao(user, texto);
            }
 
        } catch(e) {}
    };
 
    req.download();
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
//  ENVIO DUAL (Ares + Web)
// ======================================================
function enviarDual(user, conteudoAres, conteudoWebArray) {
    Users.local(function(u) {
        if (u.vroom === user.vroom) {
 
            if (u.canHTML) {
                u.sendHTML(conteudoAres);
            } else {
                for (var i = 0; i < conteudoWebArray.length; i++) {
                    print(u, conteudoWebArray[i]);
                }
            }
        }
    });
}
 
// ======================================================
//  ENVIAR COM TRADUÇÃO — Minimalista + Avatar ASCII
// ======================================================
function enviarTraducao(user, original, traduzido) {
 
    var nome = escaparHTML(user.name);
    var countryCode = paisUsuario[user.externalIp] || "UN";
    var emoji = bandeiraEmoji(countryCode);
    var avatar = "(•‿•)";
 
    var conteudoAres = caixaAres(nome, original, traduzido, countryCode);
 
    var conteudoWeb = [
        avatar + " " + emoji + " " + nome + ": " + original,
        "   ↳ " + traduzido
    ];
 
    enviarDual(user, conteudoAres, conteudoWeb);
}
 
// ======================================================
//  ENVIAR SEM TRADUÇÃO — Minimalista + Avatar ASCII
// ======================================================
function enviarSemTraducao(user, texto) {
 
    var nome = escaparHTML(user.name);
    var countryCode = paisUsuario[user.externalIp] || "UN";
    var emoji = bandeiraEmoji(countryCode);
    var avatar = "(•‿•)";
 
    var conteudoAres = caixaAres(nome, texto, texto, countryCode);
 
    var conteudoWeb = [
        avatar + " " + emoji + " " + nome + ": " + texto
    ];
 
    enviarDual(user, conteudoAres, conteudoWeb);
}
 
// ======================================================
//  ESCAPAR HTML
// ======================================================
function escaparHTML(t) {
    if (!t) return "";
    return t.replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
            .replace(/'/g,"&#39;");
}
 
// ======================================================
//  EVENTO PRINCIPAL
// ======================================================
function onTextBefore(user, text) {
 
    obterPaisUsuario(user);
 
    if (podeMostrarAvatar(user.name)) {
        mostrarAvatarComMoldura(user);
    }
 
    traduzirAutomatico(user, text);
 
    return ""; // oculta o texto original
}
