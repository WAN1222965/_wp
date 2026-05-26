(function () {
  var BASE = window.BASE_URL || window.location.pathname.replace(/\/[^/]*$/, '') || '/s111410509';
  var SUPPORTED = ['zh-TW', 'en', 'ja'];
  var DEFAULT = 'zh-TW';

  function getLang() {
    var match = document.cookie.match(/(?:^|;\s*)lang=([^;]+)/);
    if (match && SUPPORTED.indexOf(match[1]) !== -1) return match[1];
    var nav = (navigator.language || navigator.userLanguage || '').split('-')[0];
    if (nav === 'ja') return 'ja';
    if (nav === 'en') return 'en';
    if (nav === 'zh') return 'zh-TW';
    return DEFAULT;
  }

  var currentLang = getLang();
  window.__i18nLang = currentLang;
  window.__i18nT = {};

  function resolveKey(obj, key) {
    var keys = key.split('.');
    var val = obj;
    for (var i = 0; i < keys.length; i++) {
      if (val && typeof val === 'object' && keys[i] in val) {
        val = val[keys[i]];
      } else {
        return null;
      }
    }
    return typeof val === 'string' ? val : null;
  }

  function applyTranslations(translations) {
    window.__i18nT = translations;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = resolveKey(translations, key);
      if (typeof val === 'string') {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          var type = el.getAttribute('type');
          if (type === 'email' || type === 'text' || type === 'password' || type === 'url' || !type) {
            el.setAttribute('placeholder', val);
          }
        } else if (el.tagName === 'IMG') {
          el.setAttribute('alt', val);
        } else {
          el.textContent = val;
        }
      }
    });
    document.documentElement.lang = currentLang;
    document.dispatchEvent(new CustomEvent('i18n-ready', { detail: { lang: currentLang, t: translations } }));
  }

  fetch(BASE + '/api/locale/' + currentLang)
    .then(function (r) { return r.json(); })
    .then(applyTranslations)
    .catch(function () {});
})();
