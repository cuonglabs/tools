/* auth.js – đăng nhập dùng chung cho các trang con.

   Nạp trong <head> (đặt trước các script khác của trang):
     <script src="https://cuonglabs.github.io/tools/auth/auth.js"></script>                                    chỉ nạp, tự gọi CL.getSession()...
     <script src="https://cuonglabs.github.io/tools/auth/auth.js" data-require></script>                       bắt buộc đăng nhập
     <script src="https://cuonglabs.github.io/tools/auth/auth.js" data-require="admin,supervisor"></script>    bắt buộc đúng vai trò

   LƯU Ý: đây là kiểm tra phía trình duyệt (chỉ ẩn / hiện giao diện). Muốn bảo vệ dữ liệu thật,
   phải đặt quyền ở phía server (Row Level Security của Supabase), không thể chỉ dựa vào file này. */
(function (w) {
  'use strict';

  var BASE = 'https://cuonglabs.github.io/tools/';
  var LOGIN = BASE + 'auth/login.html';
  var KEY = 'cl_session';          // khóa riêng, tránh trùng với các trang khác cùng tên miền
  var OLD = 'session';             // khóa của bản login cũ (sẽ tự chuyển sang khóa mới)

  /* Quyền theo vai trò. Vai trò lạ (không có trong bảng) được coi như USER. Chỉnh theo thực tế. */
  var ROLE_PERMS = {
    ADMIN: ['*'],
    SUPERVISOR: ['view', 'create', 'edit', 'status', 'delete'],
    USER: ['view', 'create', 'edit']
  };

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  function parse(raw) {
    try {
      var s = JSON.parse(raw);
      return s && s.expireTime && new Date(s.expireTime) > new Date() ? s : null;
    } catch (e) { return null; }
  }

  function getSession() {
    var s = parse(store.get(KEY));
    if (!s) {
      var o = parse(store.get(OLD));                 // phiên do bản login cũ ghi
      if (o) { store.set(KEY, JSON.stringify(o)); s = o; }
    }
    if (!s) store.del(KEY);                          // hết hạn hoặc hỏng
    store.del(OLD);
    return s;
  }

  function saveSession(user, remember) {
    var now = new Date();
    var ms = (remember === false ? 12 * 3600 * 1000 : 7 * 24 * 3600 * 1000);
    var s = {                                        // chỉ lưu các trường cần thiết, không lưu mật khẩu
      id: user.id, username: user.username, fullname: user.fullname,
      role: user.role, status: user.status,
      loginTime: now.toISOString(), expireTime: new Date(now.getTime() + ms).toISOString()
    };
    store.set(KEY, JSON.stringify(s));
    return s;
  }

  function role(s) { return String((s && s.role) || '').toUpperCase(); }
  function userName(s) { s = s || getSession(); return s ? (s.fullname || s.username || '') : ''; }

  function hasRole() {
    var s = getSession();
    if (!s) return false;
    var list = [].concat.apply([], [].slice.call(arguments));
    return list.some(function (r) { return String(r).toUpperCase() === role(s); });
  }

  function can(action) {
    var s = getSession();
    if (!s) return false;
    var p = ROLE_PERMS[role(s)] || ROLE_PERMS.USER;
    return p.indexOf('*') >= 0 || p.indexOf(action) >= 0;
  }

  /* Chỉ cho chuyển về địa chỉ nằm trong /tools/ cùng tên miền (chặn chuyển hướng sang trang lạ) */
  function safeNext(n) {
    try {
      var u = new URL(n, location.origin), b = new URL(BASE);
      return u.origin === b.origin && u.pathname.indexOf(b.pathname) === 0 ? u.pathname + u.search + u.hash : null;
    } catch (e) { return null; }
  }

  function loginUrl(next) {
    return LOGIN + '?next=' + encodeURIComponent(next || (location.pathname + location.search + location.hash));
  }

  function deny() {
    function show() {
      document.documentElement.style.visibility = 'visible';
      document.body.innerHTML = '<div style="padding:32px;font:16px Arial,sans-serif;text-align:center">Bạn không có quyền truy cập trang này.<br><br><a href="' + BASE + '">Về trang chủ</a></div>';
    }
    if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
  }

  function requireLogin(roles) {
    var s = getSession();
    if (!s) { location.replace(loginUrl()); return false; }
    if (roles && roles.length && !hasRole(roles)) { deny(); return false; }
    return true;
  }

  function logout(redirect) {
    store.del(KEY); store.del(OLD);
    if (redirect !== false) location.href = LOGIN;
  }

  /* ---- Gọi Supabase (dùng config.json, không cần thư viện) ---- */
  var _cfg = null;
  function config() {
    if (_cfg) return Promise.resolve(_cfg);
    var urls = ['config.json', BASE + 'trouble/config.json'], i = 0;
    return (function next() {
      if (i >= urls.length) return Promise.resolve(null);
      return fetch(urls[i++], { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (j && j.supabaseUrl && j.anonKey) return (_cfg = { url: j.supabaseUrl.replace(/\/+$/, ''), key: String(j.anonKey).trim() });
          return next();
        }, next);
    })();
  }

  function rpc(fn, args) {
    return config().then(function (c) {
      if (!c) throw new Error('config');
      var h = { apikey: c.key, 'Content-Type': 'application/json' };
      if (/^eyJ/.test(c.key)) h.Authorization = 'Bearer ' + c.key;
      return fetch(c.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: h, body: JSON.stringify(args) })
        .then(function (r) {
          return r.text().then(function (t) {
            var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
            if (!r.ok) throw new Error((j && j.message) || ('HTTP ' + r.status));
            return j;
          });
        });
    });
  }

  w.CL = {
    BASE: BASE, LOGIN: LOGIN, ROLE_PERMS: ROLE_PERMS,
    getSession: getSession, saveSession: saveSession, requireLogin: requireLogin, logout: logout,
    hasRole: hasRole, can: can, userName: userName, safeNext: safeNext, loginUrl: loginUrl,
    config: config, rpc: rpc
  };
  /* tên cũ để các trang đã viết theo bản trước vẫn chạy */
  w.getSession = getSession; w.requireLogin = requireLogin; w.logout = logout;

  /* Tự kiểm tra nếu thẻ <script> có thuộc tính data-require */
  var cs = document.currentScript;
  if (cs && cs.hasAttribute('data-require')) {
    w.CL_REQUIRE = true;
    var rs = (cs.getAttribute('data-require') || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    document.documentElement.style.visibility = 'hidden';          // tránh nháy nội dung trước khi chuyển trang
    if (requireLogin(rs)) document.documentElement.style.visibility = '';
    w.addEventListener('storage', function (e) {                    // đăng xuất ở tab khác thì tab này cũng thoát
      if (e.key === KEY && !e.newValue) location.replace(loginUrl());
    });
  }
})(window);
