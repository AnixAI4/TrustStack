/**
 * TrustStack consent widget, version 1 (Slice 10, Stage 3b).
 *
 *   <script src="https://<truststack>/widget/consent-v1.js" data-org="<public address>" async></script>
 *
 * Optional attributes:
 *   data-principal       your own identifier for a signed-in person (else a random id kept in this browser)
 *   data-principal-kind  "child" (a parent consents) or "guardian_ward" (a lawful guardian consents); default the person
 *   data-lang            a language the widget version offers; default the browser's, else English
 *
 * Who asks (s.5, Rule 3): the organisation is named in the first sentence, and "Accept all" and "Reject
 * all" carry equal weight — consent must be free (s.6(1)); nothing is focused or pre-selected for the visitor.
 *
 * What it does (s.6): shows the purposes of the organisation's live widget version, in the words of its
 * published privacy notice, with NOTHING ticked; records the choice — given, refused or withdrawn — with
 * TrustStack; and keeps a "Privacy choices" button so withdrawing is as easy as giving (s.6(4)). It never
 * claims a parent's or guardian's verification: the organisation records that (Rules 10–11).
 *
 * Words: English, and the Hindi and Marathi phrases carried over from the earlier widget. Every other
 * language — and any phrase without a reviewed translation — is shown in English, never machine-translated.
 * The site can reopen the choices with window.TrustStackConsent.open().
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;
  var SLUG = script.getAttribute("data-org");
  if (!SLUG || !/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/.test(SLUG)) return;
  var ORIGIN;
  try {
    ORIGIN = new URL(script.src).origin;
  } catch (e) {
    return;
  }
  var API = ORIGIN + "/api/v1/public/" + SLUG + "/consent";
  var KIND = script.getAttribute("data-principal-kind");
  if (KIND !== "child" && KIND !== "guardian_ward") KIND = "self";
  var STATE_KEY = "ts_consent_v1_" + SLUG;
  var UID_KEY = "ts_uid_" + SLUG;

  var EN = {
    title: "We value your privacy",
    desc: "We ask for your consent to use your personal data for the purposes below. Nothing is ticked: choose what you agree to.",
    descNamed: "{org} asks for your consent to use your personal data for the purposes below. Nothing is ticked: choose what you agree to.",
    accept: "Accept all",
    reject: "Reject all",
    save: "Save my choices",
    manage: "Privacy choices",
    withdrawNote: "You can withdraw consent at any time.",
    withdraw: "Withdraw consent",
    withdrawn: "Your consent has been withdrawn.",
    saved: "Your choices are saved.",
    notice: "Read the privacy notice",
    data: "Personal data:",
    pending: "Translation pending — shown in English.",
  };
  // Carried over from the earlier widget (to be reviewed by a translator before production). Missing phrases fall back to English.
  var WORDS = {
    en: EN,
    hi: {
      title: "हम आपकी गोपनीयता को महत्व देते हैं",
      accept: "सभी स्वीकार करें",
      reject: "सभी अस्वीकार करें",
      save: "मेरी पसंद सहेजें",
      manage: "प्राथमिकताएं प्रबंधित करें",
      withdrawNote: "आप किसी भी समय सहमति वापस ले सकते हैं।",
      withdraw: "सहमति वापस लें",
      withdrawn: "आपकी सहमति वापस ले ली गई है।",
    },
    mr: {
      title: "आम्ही तुमच्या गोपनीयतेचा आदर करतो",
      accept: "सर्व स्वीकारा",
      reject: "सर्व नाकारा",
      save: "माझ्या निवडी जतन करा",
      manage: "प्राधान्ये व्यवस्थापित करा",
      withdrawNote: "तुम्ही कधीही संमती मागे घेऊ शकता.",
      withdraw: "संमती मागे घ्या",
      withdrawn: "तुमची संमती मागे घेण्यात आली आहे.",
    },
  };
  var RTL = { ur: true, ks: true, sd: true };

  function store(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (e) {}
  }
  function read(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  function state() {
    try {
      return JSON.parse(read(STATE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  /** The site's identifier for the person, or a random one kept in this browser (crypto, never Math.random). */
  function identifier() {
    var given = script.getAttribute("data-principal");
    if (given && given.trim()) return given.trim().slice(0, 320);
    var id = read(UID_KEY);
    if (!id) {
      var bytes = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(bytes);
      id = "browser-" + Array.prototype.map.call(bytes, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
      store(UID_KEY, id);
    }
    return id;
  }

  function language(offered) {
    var asked = (script.getAttribute("data-lang") || "").toLowerCase();
    if (asked && offered.indexOf(asked) !== -1) return asked;
    var nav = ((navigator.language || "en").split("-")[0] || "en").toLowerCase();
    return offered.indexOf(nav) !== -1 ? nav : "en";
  }
  function words(lang) {
    var w = WORDS[lang] || {};
    var out = {};
    for (var k in EN) out[k] = w[k] || EN[k];
    out.pendingNote = WORDS[lang] ? null : lang === "en" ? null : EN.pending;
    return out;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(c);
    });
    return node;
  }

  var CSS =
    ".tsw-root{position:fixed;z-index:2147483646;font:14px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e293b}" +
    ".tsw-bottom_bar{left:0;right:0;bottom:0}.tsw-corner{right:16px;bottom:16px;max-width:380px}" +
    ".tsw-centre_modal{inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center}" +
    ".tsw-box{background:#fff;border:1px solid #e2e8f0;box-shadow:0 10px 40px rgba(15,23,42,.18);padding:18px;max-height:85vh;overflow:auto;box-sizing:border-box}" +
    ".tsw-box:focus{outline:none}.tsw-centre_modal .tsw-box{border-radius:12px;max-width:520px;width:calc(100vw - 32px)}.tsw-corner .tsw-box{border-radius:12px}" +
    ".tsw-title{font-weight:600;font-size:16px;margin:0 0 6px}.tsw-desc{margin:0 0 10px;color:#475569}" +
    ".tsw-list{list-style:none;margin:0 0 12px;padding:0}.tsw-item{display:flex;gap:10px;padding:8px 0;border-top:1px solid #f1f5f9}" +
    ".tsw-item input{margin-top:3px;width:16px;height:16px;flex-shrink:0}.tsw-name{font-weight:500}.tsw-uses,.tsw-data{font-size:12px;color:#64748b}" +
    ".tsw-btns{display:flex;flex-wrap:wrap;gap:8px}.tsw-btn{border-radius:8px;padding:8px 14px;font:inherit;font-weight:600;cursor:pointer;border:2px solid var(--tsw)}" +
    ".tsw-primary{background:var(--tsw);color:#fff}.tsw-secondary{background:#fff;color:var(--tsw)}.tsw-withdraw{background:#fff;color:#b91c1c;border-color:#fecaca}" +
    ".tsw-foot{font-size:12px;color:#64748b;margin-top:10px}.tsw-foot a{color:var(--tsw)}" +
    ".tsw-fab{position:fixed;left:16px;bottom:16px;z-index:2147483645;border-radius:999px;padding:8px 14px;border:0;background:#0f172a;color:#fff;font:600 13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;cursor:pointer;box-shadow:0 4px 16px rgba(15,23,42,.25)}" +
    ".tsw-toast{position:fixed;left:16px;bottom:64px;z-index:2147483647;background:#0f172a;color:#fff;padding:10px 14px;border-radius:8px;font:13px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}";

  var config = null;
  var orgName = "";
  var lang = "en";

  function injectCss() {
    if (document.getElementById("tsw-css")) return;
    document.head.appendChild(el("style", { id: "tsw-css", text: CSS }));
  }

  function remove(id) {
    var node = document.getElementById(id);
    if (node) node.parentNode.removeChild(node);
  }

  function toast(text) {
    remove("tsw-toast");
    var t = el("div", { id: "tsw-toast", class: "tsw-toast", role: "status", text: text });
    document.body.appendChild(t);
    setTimeout(function () {
      remove("tsw-toast");
    }, 4000);
  }

  function fab() {
    if (document.getElementById("tsw-fab") || !config) return;
    var b = el("button", { id: "tsw-fab", class: "tsw-fab", type: "button", text: words(lang).manage });
    b.onclick = function () {
      open();
    };
    document.body.appendChild(b);
  }

  /** One choice, sent as text/plain so the browser needs no preflight. A failure keeps nothing locally. */
  function record(action, purposes) {
    var body = JSON.stringify({
      configId: config.id,
      identifier: identifier(),
      action: action,
      purposes: action === "given" ? purposes : [],
      principalKind: KIND,
      language: lang,
    });
    return fetch(API, { method: "POST", headers: { "Content-Type": "text/plain" }, body: body, credentials: "omit" })
      .then(function (r) {
        return r.json();
      })
      .then(function (env) {
        if (!env || !env.success) return false;
        store(STATE_KEY, JSON.stringify({ configId: config.id, action: action, purposes: action === "given" ? purposes : [] }));
        return true;
      })
      .catch(function () {
        return false;
      });
  }

  function close() {
    remove("tsw-root");
    fab();
  }

  function open() {
    if (!config) return;
    remove("tsw-fab");
    remove("tsw-root");
    injectCss();
    var w = words(lang);
    var prior = state();
    var chosen = prior && prior.configId === config.id && prior.action === "given" ? prior.purposes : [];
    var boxes = [];

    var list = el(
      "ul",
      { class: "tsw-list" },
      config.purposes.map(function (p) {
        var id = "tsw-p-" + p.key;
        var box = el("input", { type: "checkbox", id: id, "data-key": p.key });
        box.checked = chosen.indexOf(p.key) !== -1;
        boxes.push(box);
        return el("li", { class: "tsw-item" }, [
          box,
          el("label", { for: id }, [
            el("div", { class: "tsw-name", text: p.title }),
            el("div", { class: "tsw-uses", text: p.uses }),
            el("div", { class: "tsw-data", text: w.data + " " + p.dataItems.join(", ") }),
          ]),
        ]);
      }),
    );
    var checked = function () {
      return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.getAttribute("data-key"); });
    };
    var done = function (text) {
      return function (ok) {
        if (ok) toast(text);
        close();
      };
    };

    var accept = el("button", { type: "button", class: "tsw-btn tsw-primary", text: w.accept });
    accept.onclick = function () {
      record("given", config.purposes.map(function (p) { return p.key; })).then(done(w.saved));
    };
    // Equal weight: refusing looks exactly like accepting (s.6(1)).
    var reject = el("button", { type: "button", class: "tsw-btn tsw-primary", text: w.reject });
    reject.onclick = function () {
      record("refused", []).then(done(w.saved));
    };
    var save = el("button", { type: "button", class: "tsw-btn tsw-secondary", text: w.save });
    save.onclick = function () {
      var keys = checked();
      record(keys.length ? "given" : "refused", keys).then(done(w.saved));
    };
    var buttons = [accept, reject, save];
    if (prior && prior.action === "given") {
      var withdraw = el("button", { type: "button", class: "tsw-btn tsw-withdraw", text: w.withdraw });
      withdraw.onclick = function () {
        record("withdrawn", []).then(done(w.withdrawn));
      };
      buttons.push(withdraw);
    }

    // A translated description stays; otherwise the English one names the organisation.
    var translated = lang !== "en" && WORDS[lang] && WORDS[lang].desc;
    var desc = !translated && orgName ? w.descNamed.replace("{org}", orgName) : w.desc;
    var box = el("div", { class: "tsw-box", role: "dialog", "aria-modal": "true", "aria-label": w.title, tabindex: "-1" }, [
      el("p", { class: "tsw-title", text: w.title }),
      el("p", { class: "tsw-desc", text: desc }),
      w.pendingNote ? el("p", { class: "tsw-foot", text: w.pendingNote }) : null,
      list,
      el("div", { class: "tsw-btns" }, buttons),
      el("p", { class: "tsw-foot" }, [
        document.createTextNode(w.withdrawNote + " "),
        el("a", { href: ORIGIN + "/p/" + SLUG + "/notice?lang=" + encodeURIComponent(lang), target: "_blank", rel: "noopener", text: w.notice }),
      ]),
    ]);
    if (RTL[lang]) box.setAttribute("dir", "rtl");
    var root = el("div", { id: "tsw-root", class: "tsw-root tsw-" + config.position }, [box]);
    root.style.setProperty("--tsw", config.primaryColor);
    document.body.appendChild(root);
    box.focus();
  }

  function boot() {
    fetch(API, { credentials: "omit" })
      .then(function (r) {
        return r.json();
      })
      .then(function (env) {
        if (!env || !env.success || !env.data.config.purposes.length) return;
        config = env.data.config;
        orgName = (env.data.organization && env.data.organization.name) || "";
        lang = language(config.languages);
        var prior = state();
        // A new widget version asks again: its purposes may have changed.
        if (prior && prior.configId === config.id) fab();
        else open();
      })
      .catch(function () {});
  }

  window.TrustStackConsent = {
    open: open,
    status: function () {
      return state();
    },
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
