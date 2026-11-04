/* layout.js – khung giao diện dùng chung (thương hiệu, menu tài khoản, thiết lập, chân trang).
   Đặt cùng thư mục gốc với index.html (tools/layout.js). Nạp SAU auth.js:
     <script src="https://cuonglabs.github.io/tools/auth/auth.js"></script>
     <script src="https://cuonglabs.github.io/tools/layout.js"></script>
   Trong trang chỉ cần đặt các "khe" sau, layout.js tự điền:
     <span id="cl-brand" data-title="Tên trang" data-compact></span>   logo + CuongLabs (data-compact: điện thoại chỉ hiện logo)
     <div id="cl-account"></div>                                       ảnh đại diện + menu (họ tên, đăng nhập/đăng xuất, thiết lập)
     <div id="cl-footer"></div>                                        chân trang chung
   Trang hỗ trợ chế độ tối: thêm thuộc tính data-cl-themable vào <html>.
   Trang cho phép ảnh nền: thêm thuộc tính data-cl-bg vào <body>.
   Chỉ cần Bootstrap CSS, không cần Bootstrap JS. */
(function (w, d) {
  'use strict';
  var CL = w.CL = w.CL || {};
  var BASE = CL.BASE || 'https://cuonglabs.github.io/tools/';
  var ICON = 'https://raw.githubusercontent.com/cuonglabs/tools/main/favicon.ico';

  CL.TOOLS = [
    { name: 'Báo Cáo Kỹ Thuật', desc: 'Lập báo cáo; xuất PDF, Excel, HTML', icon: 'bi-file-earmark-text', color: 'primary', url: BASE + 'trouble/bao-cao-ky-thuat.html' },
    { name: 'Quản Lý Báo Cáo', desc: 'Xem, lọc, đổi trạng thái báo cáo', icon: 'bi-clipboard-data', color: 'success', url: BASE + 'trouble/report-management.html' },
    { name: 'Đăng Nhập', desc: 'Tài khoản người dùng', icon: 'bi-person-lock', color: 'warning', url: BASE + 'auth/login.html' },
    { name: 'Overtime', desc: 'Công cụ Overtime', icon: 'bi-clock-history', color: 'danger', url: BASE + 'overtime/' }
  ];

  var LS = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function initials(n) { return n.trim().split(/\s+/).slice(-2).map(function (x) { return x[0]; }).join('').toUpperCase() || '?'; }
  function avatarSVG(n) {
    return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#0b5cab"/><text x="40" y="53" font-size="34" font-family="Arial" fill="#fff" text-anchor="middle">' + esc(initials(n)) + '</text></svg>');
  }
  function user() { var s = CL.getSession && CL.getSession(); return s ? { name: s.fullname || s.username || '', role: s.role || '' } : null; }
  function themable() { return d.documentElement.hasAttribute('data-cl-themable'); }
  function loginHref() { return BASE + 'auth/login.html?next=' + encodeURIComponent(location.pathname + location.search + location.hash); }

  function applyLook() {
    if (themable()) {
      var dark = LS.get('cl_dark') === '1' || (LS.get('cl_dark') == null && LS.get('darkMode') === 'true');
      d.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
    }
    if (d.body && d.body.hasAttribute('data-cl-bg')) {
      var bg = LS.get('cl_bg');
      d.body.style.backgroundImage = bg ? 'url(' + bg + ')' : '';
      d.body.style.backgroundSize = 'cover'; d.body.style.backgroundAttachment = 'fixed';
    }
  }

  function css() {
    if (d.getElementById('cl-css')) return;
    var s = d.createElement('style'); s.id = 'cl-css';
    s.textContent =
      '.cl-av{width:38px;height:38px;border-radius:50%;object-fit:cover;border:2px solid var(--bs-border-color,#dee2e6);cursor:pointer;vertical-align:middle}' +
      '.cl-acc{position:relative}.cl-brand img{width:34px;height:34px;border-radius:50%}' +
      '.cl-ov{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:3500;display:none;align-items:center;justify-content:center;padding:12px}' +
      '.cl-pn{background:var(--bs-body-bg,#fff);color:var(--bs-body-color,#212529);border-radius:12px;padding:16px;max-width:420px;width:100%;max-height:92vh;overflow:auto}';
    d.head.appendChild(s);
  }

  function brand(el) {
    var t = el.getAttribute('data-title'), compact = el.hasAttribute('data-compact');
    el.className = (el.className || '') + ' d-flex align-items-center';
    el.innerHTML = '<a class="cl-brand d-flex align-items-center gap-2 text-decoration-none fw-bold" href="' + BASE + '" style="color:var(--blue,#0b5cab);font-size:1.1rem">' +
      '<img src="' + ICON + '" alt="" onerror="this.style.display=\'none\'"><span class="' + (compact ? 'd-none d-sm-inline' : '') + '">CuongLabs</span></a>' +
      (t ? '<span class="text-muted ms-2 d-none d-md-inline">› ' + esc(t) + '</span>' : '');
  }

  function account(el) {
    var u = user(), n = u ? u.name : '';
    el.className = (el.className || '').replace(/\bcl-acc\b/, '') + ' cl-acc';
    el.innerHTML =
      '<button type="button" class="btn p-0 border-0" data-cl="menu" aria-label="Tài khoản" title="Tài khoản"><img class="cl-av" alt="" src="' + (LS.get('cl_avatar') || avatarSVG(n || 'Khách')) + '"></button>' +
      '<ul class="dropdown-menu dropdown-menu-end shadow" style="right:0;left:auto;top:100%;margin-top:6px;min-width:210px">' +
      '<li><h6 class="dropdown-header">' + esc(u ? n + (u.role ? ' · ' + u.role : '') : 'Khách (chưa đăng nhập)') + '</h6></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      (u ? '<li><button type="button" class="dropdown-item" data-cl="logout">Đăng xuất</button></li>'
         : '<li><a class="dropdown-item" href="' + loginHref() + '">Đăng nhập</a></li>') +
      '<li><button type="button" class="dropdown-item" data-cl="settings">Thiết lập</button></li></ul>';
  }

  function footer(el) {
    el.innerHTML = '<footer class="bg-body border-top py-3 small mt-4"><div class="container-fluid d-flex flex-wrap justify-content-between gap-2">' +
      '<div class="d-flex flex-wrap gap-3">' + CL.TOOLS.map(function (t) { return '<a class="text-decoration-none" href="' + esc(t.url) + '" target="_blank" rel="noopener">' + esc(t.name) + '</a>'; }).join('') + '</div>' +
      '<div class="text-muted">support@cuonglabs.com · github.com/cuonglabs · v2.0 · © 2026 CuongLabs</div></div></footer>';
  }

  function mount() {
    css(); applyLook();
    var b = d.getElementById('cl-brand'); if (b) brand(b);
    var a = d.getElementById('cl-account'); if (a) account(a);
    var f = d.getElementById('cl-footer'); if (f) footer(f);
  }
  CL.refresh = mount;

  function closeMenus() { [].forEach.call(d.querySelectorAll('.cl-acc .dropdown-menu.show'), function (m) { m.classList.remove('show'); }); }

  /* ---------- Thiết lập ---------- */
  function imgFile(f, max, sq) {
    return new Promise(function (ok, no) {
      var u = URL.createObjectURL(f), i = new Image();
      i.onload = function () {
        var sw = i.width, sh = i.height, sx = 0, sy = 0, w, h;
        if (sq) { var m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; w = h = max; }
        else { var k = Math.min(1, max / Math.max(sw, sh)); w = Math.round(sw * k); h = Math.round(sh * k); }
        var c = d.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(i, sx, sy, sw, sh, 0, 0, w, h); URL.revokeObjectURL(u);
        ok(c.toDataURL('image/jpeg', .85));
      };
      i.onerror = function () { no(); }; i.src = u;
    });
  }
  function settingsHTML() {
    return '<div class="cl-pn"><div class="d-flex justify-content-between align-items-center mb-3"><b class="fs-5">Thiết lập</b><button type="button" class="btn-close" data-cl="set-close" aria-label="Đóng"></button></div>' +
      (themable() ? '<div class="form-check form-switch mb-3"><input id="cl-dark" class="form-check-input" type="checkbox"><label class="form-check-label" for="cl-dark">Chế độ tối (Dark mode)</label></div>' : '') +
      '<label class="form-label">Ảnh đại diện</label><div class="input-group mb-3"><input type="file" id="cl-av" class="form-control" accept="image/*"><button type="button" class="btn btn-outline-secondary" data-cl="av-del">Xóa</button></div>' +
      (d.body.hasAttribute('data-cl-bg') ? '<label class="form-label">Ảnh nền</label><div class="input-group mb-3"><input type="file" id="cl-bg" class="form-control" accept="image/*"><button type="button" class="btn btn-outline-secondary" data-cl="bg-del">Xóa</button></div>' : '') +
      '<div class="d-flex gap-2"><button type="button" class="btn btn-outline-danger me-auto" data-cl="set-reset">Đặt lại thiết lập</button><button type="button" class="btn btn-primary" data-cl="set-close">Đóng</button></div></div>';
  }
  function openSettings() {
    var ov = d.getElementById('cl-set');
    if (!ov) {
      ov = d.createElement('div'); ov.id = 'cl-set'; ov.className = 'cl-ov'; d.body.appendChild(ov);
      ov.addEventListener('change', function (e) {
        var t = e.target, f = t.files && t.files[0];
        if (t.id === 'cl-dark') { LS.set('cl_dark', t.checked ? '1' : '0'); applyLook(); return; }
        if (!f) return;
        if (t.id === 'cl-av') imgFile(f, 160, true).then(function (v) { LS.set('cl_avatar', v); mount(); }, function () { alert('Không đọc được ảnh'); });
        if (t.id === 'cl-bg') imgFile(f, 1600, false).then(function (v) { if (!LS.set('cl_bg', v)) alert('Bộ nhớ trình duyệt đầy, hãy chọn ảnh nhỏ hơn'); applyLook(); }, function () { alert('Không đọc được ảnh'); });
      });
    }
    ov.innerHTML = settingsHTML();
    var dk = d.getElementById('cl-dark'); if (dk) dk.checked = d.documentElement.getAttribute('data-bs-theme') === 'dark';
    ov.style.display = 'flex';
  }

  d.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-cl]') : null;
    if (!b) { closeMenus(); return; }
    var a = b.getAttribute('data-cl');
    if (a === 'menu') { var m = b.parentNode.querySelector('.dropdown-menu'), was = m.classList.contains('show'); closeMenus(); if (!was) m.classList.add('show'); return; }
    closeMenus();
    if (a === 'logout') {
      if (CL.logout) CL.logout(false);
      if (w.CL_REQUIRE && CL.loginUrl) location.replace(CL.loginUrl()); else { mount(); d.dispatchEvent(new CustomEvent('cl:session')); }
    }
    if (a === 'settings') openSettings();
    if (a === 'set-close') d.getElementById('cl-set').style.display = 'none';
    if (a === 'av-del') { LS.del('cl_avatar'); mount(); }
    if (a === 'bg-del') { LS.del('cl_bg'); applyLook(); }
    if (a === 'set-reset' && confirm('Đặt lại chế độ tối, ảnh nền và ảnh đại diện?')) {   // chỉ xóa thiết lập giao diện, không đụng dữ liệu các công cụ
      ['cl_dark', 'darkMode', 'cl_bg', 'cl_avatar'].forEach(LS.del); mount(); d.getElementById('cl-set').style.display = 'none';
    }
  });
  w.addEventListener('storage', function (e) {
    if (!e.key || /^cl_/.test(e.key) || e.key === 'session') { mount(); d.dispatchEvent(new CustomEvent('cl:session')); }
  });

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', mount); else mount();
})(window, document);
