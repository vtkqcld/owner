/* SkyWorld day / night mode. Load this in <head> (no defer) so there is no white flash. */
(function () {
  var KEY = 'sw_theme', root = document.documentElement;
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function initial() {
    var s = saved(); if (s === 'dark' || s === 'light') return s;
    return (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  }
  function apply(t) {
    root.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.content = t === 'dark' ? '#0c1230' : '#4169E1';
    document.querySelectorAll('.themebtn').forEach(paint);
  }
  function paint(b) {
    var dark = root.getAttribute('data-theme') === 'dark';
    b.innerHTML = '<span class="ti">' + (dark ? '☀️' : '🌙') + '</span><span class="tx">' + (dark ? 'Day' : 'Night') + '</span>';
    var l = dark ? 'Switch to day mode' : 'Switch to night mode';
    b.title = l; b.setAttribute('aria-label', l); b.setAttribute('aria-pressed', dark ? 'true' : 'false');
  }
  function toggle() {
    var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.classList.add('theme-anim'); apply(t);
    try { localStorage.setItem(KEY, t); } catch (e) {}
    setTimeout(function () { root.classList.remove('theme-anim'); }, 450);
  }
  /* HTML for the button; call SWTheme.sync() after injecting it into the page */
  function btn(extra) {
    var dark = root.getAttribute('data-theme') === 'dark', l = dark ? 'Switch to day mode' : 'Switch to night mode';
    return '<button type="button" class="themebtn ' + (extra || '') + '" onclick="SWTheme.toggle()" title="' + l + '" aria-label="' + l + '" aria-pressed="' + dark + '">' +
      '<span class="ti">' + (dark ? '☀️' : '🌙') + '</span><span class="tx">' + (dark ? 'Day' : 'Night') + '</span></button>';
  }
  function sync() { document.querySelectorAll('.themebtn').forEach(paint); }
  apply(initial());
  window.SWTheme = { toggle: toggle, btn: btn, sync: sync, apply: apply };
})();
