export function redirectBackOrDefault(_0x34e82d = "index.html") { const _0x590b52 = sessionStorage.getItem("lasturl"); _0x590b52 ? (sessionStorage.removeItem("lasturl"), window.location.href = _0x590b52) : window.location.href = _0x34e82d; }
export function saveCurrentUrlAndRedirect(_0x195f87 = "login.html") { sessionStorage.setItem("lasturl", window.location.href), window.location.href = _0x195f87; }
export function logoutAndRedirect(_0x46af79 = "auth.html") { sessionStorage.removeItem("supabase_logged_user"), sessionStorage.setItem("lasturl", window.location.href), window.location.href = _0x46af79; }
export function createStyledSheetFromTable(_0x499cac) { const _0x3aac4a = document.getElementById(_0x499cac); if (!_0x3aac4a)
    return XLSX.utils.json_to_sheet([{ "Thông báo": "Không tìm thấy bảng dữ liệu" }]); const _0x14dc07 = XLSX.utils.table_to_sheet(_0x3aac4a, { "raw": true }); if (!_0x14dc07["!ref"])
    return XLSX.utils.json_to_sheet([{ "Thông báo": "Bảng không có dữ liệu" }]); const _0x2603c9 = XLSX.utils.decode_range(_0x14dc07["!ref"]), _0x20409a = _0x3aac4a.querySelectorAll("tr"); function _0x559932(_0x506919) { if (!_0x506919)
    return null; _0x506919 = _0x506919.trim(); const _0x10a422 = _0x506919.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/); if (_0x10a422) {
    const _0x28cb4b = parseInt(_0x10a422[1]).toString(16).padStart(2, "0"), _0x384ccd = parseInt(_0x10a422[2]).toString(16).padStart(2, "0"), _0x3d1640 = parseInt(_0x10a422[3]).toString(16).padStart(2, "0");
    return (_0x28cb4b + _0x384ccd + _0x3d1640).toUpperCase();
} if (_0x506919.startsWith("#")) {
    let _0x596c0a = _0x506919.replace("#", "");
    _0x596c0a.length === 3 && (_0x596c0a = _0x596c0a.split("").map(_0x4b8ece => _0x4b8ece + _0x4b8ece).join(""));
    if (_0x596c0a.length === 6)
        return _0x596c0a.toUpperCase();
} return null; } function _0x271e29(_0x317c35) { if (!_0x317c35)
    return "center"; const _0x2274bf = _0x317c35.toLowerCase().trim(); if (_0x2274bf === "left" || _0x2274bf === "start")
    return "left"; if (_0x2274bf === "right" || _0x2274bf === "end")
    return "right"; if (_0x2274bf === "justify")
    return "justify"; return "center"; } function _0x139b74(_0x173929) { if (!_0x173929)
    return "center"; const _0x491280 = _0x173929.toLowerCase().trim(); if (_0x491280.includes("top"))
    return "top"; if (_0x491280.includes("bottom"))
    return "bottom"; return "center"; } const _0x5aabac = {}; for (let _0x46f877 = _0x2603c9.s.r; _0x46f877 <= _0x2603c9.e.r; _0x46f877++) {
    const _0x2fc012 = _0x20409a[_0x46f877];
    if (!_0x2fc012)
        continue;
    const _0x45764e = _0x2fc012.querySelectorAll("th, td");
    for (let _0x35a6ad = _0x2603c9.s.c; _0x35a6ad <= _0x2603c9.e.c; _0x35a6ad++) {
        const _0x47e613 = _0x45764e[_0x35a6ad];
        let _0x5f22dd = "";
        if (_0x47e613) {
            const _0x3d9d24 = _0x47e613.cloneNode(true);
            _0x3d9d24.querySelectorAll("br").forEach(_0x41a6cf => _0x41a6cf.replaceWith("\n")), _0x5f22dd = _0x3d9d24.innerText || _0x3d9d24.textContent || "", _0x5f22dd = _0x5f22dd.split("\n").map(_0x570dc3 => _0x570dc3.trim()).filter(_0x2973a7 => _0x2973a7 !== "").join("\n");
        }
        _0x5aabac[_0x46f877 + "," + _0x35a6ad] = _0x5f22dd;
    }
} const _0x213001 = [], _0x48f0b1 = {}, _0x37c930 = _0x20409a[0] || _0x20409a[_0x2603c9.s.r], _0x1649e8 = _0x37c930 ? _0x37c930.querySelectorAll("th, td") : []; for (let _0x1b0c69 = _0x2603c9.s.c; _0x1b0c69 <= _0x2603c9.e.c; _0x1b0c69++) {
    let _0x4be340 = 0;
    const _0xab1f47 = _0x1649e8[_0x1b0c69];
    if (_0xab1f47) {
        const _0x57ed58 = _0xab1f47.getBoundingClientRect().width || _0xab1f47.offsetWidth;
        _0x57ed58 > 0 && (_0x4be340 = Math.round(_0x57ed58 / 7.5));
    }
    if (!_0x4be340 || _0x4be340 < 3) {
        let _0x4444b2 = 3;
        for (let _0x412cce = _0x2603c9.s.r; _0x412cce <= _0x2603c9.e.r; _0x412cce++) {
            const _0x3a7d86 = _0x5aabac[_0x412cce + "," + _0x1b0c69] || "";
            for (const _0x1f11e6 of _0x3a7d86.split("\n")) {
                if (_0x1f11e6.length > _0x4444b2)
                    _0x4444b2 = _0x1f11e6.length;
            }
        }
        _0x4be340 = _0x4444b2 + 2;
    }
    const _0x235464 = Math.max(_0x4be340, 3);
    _0x48f0b1[_0x1b0c69] = _0x235464, _0x213001.push({ "wch": _0x235464 });
} _0x14dc07["!cols"] = _0x213001; const _0x262fd6 = []; for (let _0x2982c0 = _0x2603c9.s.r; _0x2982c0 <= _0x2603c9.e.r; _0x2982c0++) {
    const _0x2ce774 = _0x20409a[_0x2982c0];
    let _0x299a8b = 1;
    if (_0x2ce774) {
        const _0x390159 = _0x2ce774.querySelectorAll("th, td");
        for (let _0x131c5d = _0x2603c9.s.c; _0x131c5d <= _0x2603c9.e.c; _0x131c5d++) {
            const _0x51a977 = _0x5aabac[_0x2982c0 + "," + _0x131c5d] || "", _0x1bed82 = _0x48f0b1[_0x131c5d] || 6, _0xf3e402 = _0x51a977.split("\n");
            let _0x31556d = 0;
            for (const _0x55972d of _0xf3e402) {
                const _0x34a58b = Math.max(1, Math.ceil(_0x55972d.length / _0x1bed82));
                _0x31556d += _0x34a58b;
            }
            _0x31556d > _0x299a8b && (_0x299a8b = _0x31556d);
        }
    }
    const _0x4d8482 = Math.max(_0x2982c0 === 0 ? 28 : 25, _0x299a8b * 18 + 4);
    _0x262fd6.push({ "hpt": _0x4d8482 });
} _0x14dc07["!rows"] = _0x262fd6; for (let _0x1f7c8b = _0x2603c9.s.r; _0x1f7c8b <= _0x2603c9.e.r; _0x1f7c8b++) {
    const _0x418ed3 = _0x20409a[_0x1f7c8b];
    if (!_0x418ed3)
        continue;
    const _0x225d24 = _0x418ed3.querySelectorAll("th, td");
    for (let _0x3cd36 = _0x2603c9.s.c; _0x3cd36 <= _0x2603c9.e.c; _0x3cd36++) {
        const _0x42c40 = XLSX.utils.encode_cell({ "r": _0x1f7c8b, "c": _0x3cd36 }), _0x1771ae = _0x14dc07[_0x42c40];
        if (!_0x1771ae)
            continue;
        const _0x2bdde0 = _0x225d24[_0x3cd36], _0x166b56 = _0x5aabac[_0x1f7c8b + "," + _0x3cd36] || "";
        _0x1771ae.v = _0x166b56, _0x1771ae.t = "s";
        let _0x2f1d33 = _0x2bdde0 ? window.getComputedStyle(_0x2bdde0) : null;
        const _0x25f8f2 = _0x2f1d33 ? _0x271e29(_0x2f1d33.textAlign) : "center", _0xe1be5a = _0x2f1d33 ? _0x139b74(_0x2f1d33.verticalAlign) : "center";
        _0x1771ae.s = { "alignment": { "horizontal": _0x25f8f2, "vertical": _0xe1be5a, "wrapText": true }, "border": { "top": { "style": "thin", "color": { "rgb": "E2E8F0" } }, "bottom": { "style": "thin", "color": { "rgb": "E2E8F0" } }, "left": { "style": "thin", "color": { "rgb": "E2E8F0" } }, "right": { "style": "thin", "color": { "rgb": "E2E8F0" } } } };
        if (_0x2f1d33) {
            const _0x30650c = _0x559932(_0x2f1d33.color), _0x1d5ebc = _0x2f1d33.fontWeight, _0x17f7a0 = parseFloat(_0x2f1d33.fontSize) ? Math.round(parseFloat(_0x2f1d33.fontSize) * 0.75) : 11;
            _0x1771ae.s.font = { "name": "Arial", "sz": _0x17f7a0, "bold": _0x1d5ebc === "bold" || parseInt(_0x1d5ebc) >= 600 || _0x1f7c8b === 0, "color": { "rgb": _0x30650c || (_0x1f7c8b === 0 ? "475569" : "000000") } };
            const _0x9a5a23 = _0x559932(_0x2f1d33.backgroundColor);
            if (_0x9a5a23 && _0x2f1d33.backgroundColor !== "rgba(0, 0, 0, 0)" && _0x2f1d33.backgroundColor !== "transparent")
                _0x1771ae.s.fill = { "fgColor": { "rgb": _0x9a5a23 } };
            else
                _0x1f7c8b === 0 && (_0x1771ae.s.fill = { "fgColor": { "rgb": "F1F5F9" } });
        }
        else
            _0x1f7c8b === 0 && (_0x1771ae.s.font = { "bold": true, "color": { "rgb": "475569" } }, _0x1771ae.s.fill = { "fgColor": { "rgb": "F1F5F9" } });
    }
} return _0x14dc07; }
// ===== Lịch âm Việt Nam (thuật toán Hồ Ngọc Đức, múi giờ UTC+7) =====
const PI = Math.PI;
const INT = Math.floor;

function jdFromDate(dd, mm, yy) {
    const a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
    let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    return jd;
}

function getNewMoonDay(k, timeZone) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
    let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    const deltat = T < -11
        ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
        : -0.000278 + 0.000265 * T + 0.000262 * T2;
    return INT(Jd1 + C1 - deltat + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn, timeZone) {
    const T = (jdn - 2451545.5 - timeZone / 24) / 36525, T2 = T * T, dr = PI / 180;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    let L = (L0 + DL) * dr;
    L -= PI * 2 * INT(L / (PI * 2));
    return INT(L / PI * 6);
}

function getLunarMonth11(yy, timeZone) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    const k = INT(off / 29.530588853);
    let nm = getNewMoonDay(k, timeZone);
    if (getSunLongitude(nm, timeZone) >= 9) nm = getNewMoonDay(k - 1, timeZone);
    return nm;
}

function getLeapMonthOffset(a11, timeZone) {
    const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0, i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
        last = arc;
        i++;
        arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
}

// Đổi dương lịch (dd, mm: 1-12, yy) sang âm lịch Việt Nam
export function convertSolarToLunar(dd, mm, yy, timeZone = 7) {
    const dayNumber = jdFromDate(dd, mm, yy);
    const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
    let a11 = getLunarMonth11(yy, timeZone), b11 = a11, lunarYear;
    if (a11 >= monthStart) {
        lunarYear = yy;
        a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
        lunarYear = yy + 1;
        b11 = getLunarMonth11(yy + 1, timeZone);
    }
    const lunarDay = dayNumber - monthStart + 1;
    const diff = INT((monthStart - a11) / 29);
    let lunarLeap = 0, lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
        const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
        if (diff >= leapMonthDiff) {
            lunarMonth = diff + 10;
            if (diff === leapMonthDiff) lunarLeap = 1;
        }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeap: lunarLeap };
}

export function normalizeToYYYYMMDD(_0x51c2cb) { if (!_0x51c2cb)
    return ""; let _0x163117 = String(_0x51c2cb).trim(); if (/^\d{2}\/\d{2}\/\d{4}$/.test(_0x163117)) {
    const _0x3ea94c = _0x163117.split("/");
    return _0x3ea94c[2] + "-" + _0x3ea94c[1] + "-" + _0x3ea94c[0];
} let _0x5011cb = new Date(_0x163117); if (!isNaN(_0x5011cb.getTime())) {
    let _0xbccdb4 = _0x5011cb.getFullYear(), _0x10afb4 = String(_0x5011cb.getMonth() + 1).padStart(2, "0"), _0x12937e = String(_0x5011cb.getDate()).padStart(2, "0");
    return _0xbccdb4 + "-" + _0x10afb4 + "-" + _0x12937e;
} return ""; }
export function getLunarString(_0x3ad0cb) { if (!_0x3ad0cb)
    return ""; const _0x3dec66 = normalizeToYYYYMMDD(_0x3ad0cb); if (!_0x3dec66)
    return ""; const _0x437415 = _0x3dec66.split("-"), _0x5b5d8c = parseInt(_0x437415[0], 10), _0x30cc52 = parseInt(_0x437415[1], 10), _0x5bb791 = parseInt(_0x437415[2], 10), _0x28f4b7 = convertSolarToLunar(_0x5bb791, _0x30cc52, _0x5b5d8c); if (!_0x28f4b7)
    return ""; return _0x28f4b7.day + "/" + _0x28f4b7.month + (_0x28f4b7.isLeap ? " (Nhuận)" : ""); }
