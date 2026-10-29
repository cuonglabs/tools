import { supabase } from "./supabaseClient.js";
import { getCurrentUser } from "./auth.js";
import { saveCurrentUrlAndRedirect, logoutAndRedirect, createStyledSheetFromTable, convertSolarToLunar, getLunarString, normalizeToYYYYMMDD } from "./utilities.js?v=20261029";
let rawOTData = [], rawHolidayData = [], currentUser = null, activePopup = null, rawLtHldData = [], tsShift, tsHours, tsTask;
const el_otFormCard = document.getElementById("otFormCard"), el_holidayFormCard = document.getElementById("holidayFormCard"), el_filterMonth = document.getElementById("filterMonth"), el_editId = document.getElementById("editId"), el_otDate = document.getElementById("otDate"), el_formTitle = document.getElementById("form-title"), el_btnSubmit = document.getElementById("btn-submit"), el_btnReset = document.getElementById("btn-reset"), el_editHolidayId = document.getElementById("editHolidayId"), el_holidayDate = document.getElementById("holidayDate"), el_leaveType = document.getElementById("leaveType"), el_holidayReason = document.getElementById("holidayReason"), el_holidayFormTitle = document.getElementById("holiday-form-title"), el_btnHolidaySubmit = document.getElementById("btn-holiday-submit"), el_btnHolidayReset = document.getElementById("btn-holiday-reset"), el_filterHolidayMonth = document.getElementById("filterHolidayMonth"), el_loadingOverlay = document.getElementById("loadingOverlay"), el_loadingMessage = document.getElementById("loadingMessage"), el_liveToast = document.getElementById("liveToast"), el_toastBody = document.getElementById("toastBody"), el_username = document.getElementById("username"), el_password = document.getElementById("password"), el_summaryMonth = document.getElementById("summaryMonth"), el_summaryWeeklyHeader = document.getElementById("summaryWeeklyHeader"), el_summaryWeeklyTbody = document.getElementById("summaryWeeklyTbody"), el_summaryEmployeeHeader = document.getElementById("summaryEmployeeHeader"), el_summaryEmployeeTbody = document.getElementById("summaryEmployeeTbody"), el_summaryOtTbody = document.getElementById("summaryOtTbody"), el_summaryHolidayTbody = document.getElementById("summaryHolidayTbody"), el_tableHeader = document.getElementById("tableHeader"), el_tbody = document.getElementById("tbody"), el_holidayTableHeader = document.getElementById("holidayTableHeader"), el_holidayTbody = document.getElementById("holidayTbody"), el_loadStatus = document.getElementById("loadStatus"), el_shift = document.getElementById("shift"), el_otHours = document.getElementById("otHours"), el_otTask = document.getElementById("otTask"), el_newUser = document.getElementById("newUser"), el_newPass = document.getElementById("newPass"), el_newRole = document.getElementById("newRole"), el_resetTargetUser = document.getElementById("resetTargetUser"), el_resetNewPass = document.getElementById("resetNewPass"), el_oldPass = document.getElementById("oldPass"), el_newPassUser = document.getElementById("newPassUser"), el_cfgUrls = document.getElementById("cfgUrls"), el_quickLinksContainer = document.getElementById("quickLinksContainer"), el_quickLinksCard = document.getElementById("quickLinksCard"), el_userInfo = document.getElementById("userInfo"), el_adminPanel = document.getElementById("adminPanel"), el_summaryPanel = document.getElementById("summaryPanel"), el_loggedUsername = document.getElementById("logged-username"), el_filterOtSearch = document.getElementById("filterOtSearch"), el_filterSummarySearch = document.getElementById("filterSummarySearch"), el_editLtHldId = document.getElementById("editLtHldId"), el_ltHldDate = document.getElementById("ltHldDate"), el_ltHldType = document.getElementById("ltHldType"), el_ltHldTbody = document.getElementById("ltHldTbody"), el_btnLtHldSubmit = document.getElementById("btn-lt-hld-submit"), el_btnLtHldReset = document.getElementById("btn-lt-hld-reset"), el_ltHldAdminCard = document.getElementById("ltHldAdminCard"), hld_type = { 1: "Ngày nghỉ chủ nhật", 2: "Ngày nghỉ công ty", 3: "Ngày nghỉ bù toàn công ty", 4: "Ngày nghỉ thay cho ngày lễ quốc gia", 5: "Ngày nghỉ ngày lễ quốc gia" }, hld_type_color = { 1: "rgba(255, 0, 0, 0.25)", 2: "rgba(0, 128, 0, 0.25)", 3: "rgba(128, 0, 128, 0.25)", 4: "rgba(255, 255, 0, 0.35)", 5: "rgba(255, 255, 0, 0.35)" };
function renderLtHldTypeOptions() {
    if (!el_ltHldType)
        return;
    let _0x11068f = "<option value=\"\">-- Chọn loại ngày lễ --</option>";
    for (const [_0x280c6c, _0x24172c] of Object.entries(hld_type)) {
        _0x11068f += "<option value=\"" + _0x24172c + "\">" + _0x24172c + "</option>";
    }
    el_ltHldType.innerHTML = _0x11068f;
}
function getHolidayColorByType(_0x5b1e51) {
    if (!_0x5b1e51)
        return "#e2e8f0";
    const _0x1c3b58 = removeVietnameseAccents(_0x5b1e51).toLowerCase();
    for (const [_0x6975df, _0xbe789e] of Object.entries(hld_type)) {
        if (removeVietnameseAccents(_0xbe789e).toLowerCase() === _0x1c3b58)
            return hld_type_color[_0x6975df] || "#e2e8f0";
    }
    return "#e2e8f0";
}
function getRecentMonthKeys() { const _0xc35e9 = new Date(), _0x360d78 = _0xc35e9.getFullYear(), _0x1feaf6 = _0xc35e9.getMonth(), _0x218e11 = _0x360d78 + "-" + String(_0x1feaf6 + 1).padStart(2, "0"), _0x2cd5c6 = new Date(_0x360d78, _0x1feaf6 - 1, 1), _0x301c41 = _0x2cd5c6.getFullYear() + "-" + String(_0x2cd5c6.getMonth() + 1).padStart(2, "0"); return [_0x218e11, _0x301c41]; }
function resetForm() {
    el_editId.value = "", el_otDate.valueAsDate = new Date();
    if (tsShift)
        tsShift.clear();
    if (tsHours)
        tsHours.clear();
    if (tsTask)
        tsTask.clear();
    el_formTitle.innerText = "⏱ Đăng ký Tăng ca", el_btnSubmit.innerText = "+ Đăng ký", el_btnSubmit.className = "btn btn-success w-100 fw-bold py-2", el_btnReset.innerText = "Xoá trống";
}
function resetHolidayForm() { el_editHolidayId.value = "", el_holidayDate.valueAsDate = new Date(), el_leaveType.selectedIndex = 0, el_holidayReason.value = "", el_holidayFormTitle.innerText = "🌴 Đăng ký Nghỉ phép", el_btnHolidaySubmit.innerText = "+ Đăng ký", el_btnHolidaySubmit.className = "btn btn-info text-white w-100 fw-bold py-2", el_btnHolidayReset.innerText = "Xoá trống"; }
function clearMonthFilter() { el_filterMonth.value = "", renderGroupedData(); }
function clearHolidayMonthFilter() { el_filterHolidayMonth.value = "", renderGroupedHolidayData(); }
function escapeHtml(_0x4731b4) {
    if (_0x4731b4 === null || _0x4731b4 === undefined)
        return "";
    return String(_0x4731b4).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function formatOtHours(_0x3ffca3) {
    if (_0x3ffca3 === null || _0x3ffca3 === undefined || _0x3ffca3 === "")
        return "";
    if (typeof _0x3ffca3 === "number")
        return Number.isInteger(_0x3ffca3) ? String(_0x3ffca3) : String(parseFloat(_0x3ffca3.toFixed(2)));
    let _0x3b05ca = String(_0x3ffca3).trim().replace(/h/gi, "").replace(",", ".");
    const _0x504e1e = Number(_0x3b05ca);
    if (!Number.isFinite(_0x504e1e))
        return escapeHtml(String(_0x3ffca3));
    return Number.isInteger(_0x504e1e) ? String(_0x504e1e) : String(parseFloat(_0x504e1e.toFixed(2)));
}
function formatDateDDMMYYYY(_0x2f154a) {
    if (!_0x2f154a)
        return "N/A";
    let _0x46377e = new Date(_0x2f154a);
    if (isNaN(_0x46377e.getTime()))
        return escapeHtml(_0x2f154a);
    let _0x473913 = String(_0x46377e.getDate()).padStart(2, "0"), _0x4fa9d0 = String(_0x46377e.getMonth() + 1).padStart(2, "0"), _0x41615f = _0x46377e.getFullYear();
    return _0x473913 + "/" + _0x4fa9d0 + "/" + _0x41615f;
}
function formatDateYYYYMMDD(_0xd4f682) {
    if (!_0xd4f682)
        return "";
    let _0xd34fc8 = new Date(_0xd4f682);
    if (isNaN(_0xd34fc8.getTime()))
        return "";
    let _0x2ea09b = String(_0xd34fc8.getDate()).padStart(2, "0"), _0x17b347 = String(_0xd34fc8.getMonth() + 1).padStart(2, "0"), _0x3fd2b6 = _0xd34fc8.getFullYear();
    return _0x3fd2b6 + "-" + _0x17b347 + "-" + _0x2ea09b;
}
function logout() { logoutAndRedirect("auth.html"); }
function toggleLoading(_0x1d717a, _0x334cfb = "Đang xử lý...") {
    _0x1d717a ? (el_loadingMessage.innerText = _0x334cfb, el_loadingOverlay.style.display = "flex") : el_loadingOverlay.style.display = "none";
    const _0x5249be = ["btn-login", "btn-submit", "btn-cancel", "btn-refresh", "btn-changepass", "btn-saveconfig", "btn-createuser", "btn-resetpass", "btn-holiday-submit", "btn-holiday-reset", "btn-holiday-refresh"];
    _0x5249be.forEach(_0x24dbc2 => {
        const _0x2c64c8 = document.getElementById(_0x24dbc2);
        if (_0x2c64c8)
            _0x2c64c8.disabled = _0x1d717a;
    });
}
function showToast(_0x196059, _0x310892 = "success") {
    el_liveToast.classList.remove("bg-success", "bg-danger", "bg-warning", "text-white", "text-dark");
    if (_0x310892 === "success")
        el_liveToast.classList.add("bg-success", "text-white");
    else
        _0x310892 === "danger" ? el_liveToast.classList.add("bg-danger", "text-white") : el_liveToast.classList.add("bg-warning", "text-dark");
    el_toastBody.innerText = _0x196059;
    const _0x1ed9d6 = new bootstrap[("Toast")](el_liveToast, { "delay": 3000 });
    _0x1ed9d6.show();
}
function handleLoginKey(_0x18ee64) {
    if (_0x18ee64.key === "Enter")
        login();
}
function handleSaveKey(_0x3e9530) {
    if (_0x3e9530.key === "Enter")
        saveData();
}
function handleHolidaySaveKey(_0x20a296) {
    if (_0x20a296.key === "Enter")
        saveHolidayData();
}
async function login() {
    const _0x341121 = el_username.value.trim(), _0x1f23a8 = el_password.value;
    if (!_0x341121 || !_0x1f23a8) {
        showToast("Vui lòng điền đầy đủ thông tin đăng nhập!", "danger");
        return;
    }
    toggleLoading(true, "Đang xác thực tài khoản...");
    try {
        const { data: _0x5584b7, error: _0x3c2beb } = await supabase.from("users").select("*").eq("username", _0x341121).single();
        toggleLoading(false);
        if (_0x3c2beb || !_0x5584b7 || _0x5584b7.password !== _0x1f23a8) {
            showToast("Tên đăng nhập hoặc mật khẩu không chính xác!", "danger");
            return;
        }
        localStorage.setItem("token", "supatoken_" + _0x5584b7.username), localStorage.setItem("role", _0x5584b7.role || "user"), localStorage.setItem("username", _0x5584b7.username), showToast("Đăng nhập thành công!", "success"), showDashboard();
    }
    catch (_0xc2d74b) {
        toggleLoading(false), showToast("Lỗi kết nối cơ sở dữ liệu!", "danger");
    }
}
function getSummaryMonthKey() {
    if (el_summaryMonth && el_summaryMonth.value)
        return el_summaryMonth.value;
    const _0x4d4a73 = new Date();
    return _0x4d4a73.getFullYear() + "-" + String(_0x4d4a73.getMonth() + 1).padStart(2, "0");
}
function parseSummaryDate(_0x216105) {
    if (!_0x216105)
        return null;
    const _0x23c9f4 = new Date(_0x216105);
    return isNaN(_0x23c9f4.getTime()) ? null : _0x23c9f4;
}
function getSummaryMonthInfo() {
    const _0x440ab0 = getSummaryMonthKey(), _0x1be199 = _0x440ab0.split("-"), _0x33ce96 = Number(_0x1be199[0]), _0x13599e = Number(_0x1be199[1]);
    if (!_0x33ce96 || !_0x13599e)
        return null;
    return { "key": _0x440ab0, "year": _0x33ce96, "month": _0x13599e, "daysInMonth": new Date(_0x33ce96, _0x13599e, 0).getDate(), "firstDay": new Date(_0x33ce96, _0x13599e - 1, 1) };
}
function getSummaryDateKey(_0x1f69b4) {
    const _0x5f4159 = parseSummaryDate(_0x1f69b4);
    if (!_0x5f4159)
        return "";
    return _0x5f4159.getFullYear() + "-" + String(_0x5f4159.getMonth() + 1).padStart(2, "0") + "-" + String(_0x5f4159.getDate()).padStart(2, "0");
}
function getSummaryHours(_0x49487e) { const _0x379340 = parseFloat(String(_0x49487e ?? "").replace(",", ".")); return Number.isFinite(_0x379340) ? _0x379340 : 0; }
function formatSummaryHours(_0x42dd4d) { const _0x4e8672 = getSummaryHours(_0x42dd4d); return Number.isInteger(_0x4e8672) ? String(_0x4e8672) : String(parseFloat(_0x4e8672.toFixed(2))); }
function formatSummaryTotalHours(_0x5333f9) { return getSummaryHours(_0x5333f9).toFixed(1); }
function removeVietnameseAccents(_0x130826) {
    if (!_0x130826)
        return "";
    return _0x130826.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}
function getLeaveCode(_0x4c8907) { const _0x592336 = removeVietnameseAccents(_0x4c8907).toLowerCase(), _0x364ddf = { "nghi phep nam": "off1", "nghi bu tang ca": "off2", "nghi cong tac": "off3", "nghi dac biet": "off4", "nghi bao hiem": "off5", "nghi khong luong": "off6" }; return _0x364ddf[_0x592336] || "off?"; }
function getSummaryUserName(_0x49fd71) {
    const _0x3efcb3 = String(_0x49fd71.createdby || _0x49fd71.CreatedBy || "").trim();
    if (!_0x3efcb3)
        return "N/A";
    return _0x3efcb3.toLocaleLowerCase("vi-VN").split(/\s+/).map(_0xe9eab3 => _0xe9eab3 ? _0xe9eab3.charAt(0).toLocaleUpperCase("vi-VN") + _0xe9eab3.slice(1) : "").join(" ");
}
function getSummaryOtRecords() { const _0xc1ff00 = getSummaryMonthKey(); return (rawOTData || []).filter(_0x49d23e => getSummaryDateKey(_0x49d23e.otdate || _0x49d23e.OtDate).slice(0, 7) === _0xc1ff00); }
function getSummaryHolidayRecords() { const _0x834e69 = getSummaryMonthKey(); return (rawHolidayData || []).filter(_0x316b3b => getSummaryDateKey(_0x316b3b.hldate || _0x316b3b.HolidayDate).slice(0, 7) === _0x834e69); }
function showTitle(_0x17bae0) {
    if (activePopup) {
        if (activePopup.targetEl === _0x17bae0) {
            activePopup.element.remove(), activePopup = null;
            return;
        }
        activePopup.element.remove(), activePopup = null;
    }
    let _0x1b207c = _0x17bae0.dataset.title || "Không có thông tin";
    const _0x815cfe = _0x1b207c.replace(/\\n/g, "<br>").replace(/\n/g, "<br>"), _0xbeb569 = document.createElement("div");
    _0xbeb569.className = "custom-popup-tooltip text-muted", _0xbeb569.innerHTML = _0x815cfe, document.body.appendChild(_0xbeb569), activePopup = { "element": _0xbeb569, "targetEl": _0x17bae0 };
    const _0x54a72d = _0x17bae0.getBoundingClientRect();
    let _0x4bd429 = _0x54a72d.bottom + 6, _0x2e6337 = _0x54a72d.left;
    _0x2e6337 + _0xbeb569.offsetWidth > window.innerWidth && (_0x2e6337 = window.innerWidth - _0xbeb569.offsetWidth - 10);
    _0xbeb569.style.top = _0x4bd429 + "px", _0xbeb569.style.left = _0x2e6337 + "px";
    function _0x3514b4(_0x3eb618) { !_0xbeb569.contains(_0x3eb618.target) && _0x3eb618.target !== _0x17bae0 && (_0xbeb569.remove(), activePopup && activePopup.element === _0xbeb569 && (activePopup = null), document.removeEventListener("click", _0x3514b4)); }
    setTimeout(() => { document.addEventListener("click", _0x3514b4); }, 0);
}
function renderSummaryWeeklyTable(_0x40cd36, _0xd0e56d) {
    const _0x1e02c9 = (el_filterSummarySearch.value || "").toLowerCase();
    if (!el_summaryWeeklyHeader || !el_summaryWeeklyTbody || !_0xd0e56d)
        return;
    const _0xa9d68e = ["THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7", "CHỦ NHẬT"];
    el_summaryWeeklyHeader.innerHTML = _0xa9d68e.map(_0x5bf09a => "<th>" + _0x5bf09a + "</th>").join("");
    const _0x3099fa = {};
    _0x40cd36.forEach(_0x2b4259 => {
        const _0x4b9c85 = getSummaryDateKey(_0x2b4259.otdate || _0x2b4259.OtDate);
        if (!_0x4b9c85)
            return;
        if (_0x1e02c9) {
            const _0x393bab = (_0x2b4259.otdate + " " + _0x2b4259.otshift + " " + _0x2b4259.othours + " " + _0x2b4259.ottask + " " + _0x2b4259.createdby).toLowerCase();
            if (!_0x393bab.includes(_0x1e02c9))
                return;
        }
        const _0x1371a4 = getSummaryUserName(_0x2b4259), _0x53c0e4 = _0x1371a4.toLocaleLowerCase("vi-VN"), _0x5f3929 = _0x2b4259.ottask || _0x2b4259.OtTask || "", _0x423d04 = _0x2b4259.created || _0x2b4259.Created;
        let _0x4d1602 = _0x423d04 ? new Date(_0x423d04).toLocaleString("vi-VN") : "-";
        if (!_0x3099fa[_0x4b9c85])
            _0x3099fa[_0x4b9c85] = {};
        if (!_0x3099fa[_0x4b9c85][_0x53c0e4])
            _0x3099fa[_0x4b9c85][_0x53c0e4] = { "name": _0x1371a4, "type": "ot", "hours": 0, "task": _0x5f3929, "createdStr": _0x4d1602 };
        _0x3099fa[_0x4b9c85][_0x53c0e4].hours += getSummaryHours(_0x2b4259.othours || _0x2b4259.OtHours);
    }), getSummaryHolidayRecords().forEach(_0x3ca603 => {
        if (_0x1e02c9) {
            const _0x201d8f = (_0x3ca603.otdate + " " + _0x3ca603.otshift + " " + _0x3ca603.othours + " " + _0x3ca603.ottask + " " + _0x3ca603.createdby).toLowerCase();
            if (!_0x201d8f.includes(_0x1e02c9))
                return;
        }
        const _0x50c10b = getSummaryDateKey(_0x3ca603.hldate || _0x3ca603.HolidayDate);
        if (!_0x50c10b)
            return;
        const _0x3a6a6d = getSummaryUserName(_0x3ca603), _0x3af9a0 = _0x3ca603.hltype || _0x3ca603.HolidayType || "???", _0x229ba2 = _0x3ca603.hlreason || _0x3ca603.HolidayReason || "", _0x560a4f = getLeaveCode(_0x3af9a0), _0x4538f5 = _0x3a6a6d.toLocaleLowerCase("vi-VN"), _0x9668f3 = _0x3ca603.created || _0x3ca603.Created;
        let _0x26ed6c = _0x9668f3 ? new Date(_0x9668f3).toLocaleString("vi-VN") : "-";
        if (!_0x3099fa[_0x50c10b])
            _0x3099fa[_0x50c10b] = {};
        _0x3099fa[_0x50c10b][_0x4538f5] = { "name": _0x3a6a6d, "type": "off", "typeName": _0x3af9a0, "typeLeave": _0x560a4f, "reason": _0x229ba2, "createdStr": _0x26ed6c };
    });
    let _0x3c9b64 = _0xd0e56d.firstDay.getDay() - 1;
    if (_0x3c9b64 < 0)
        _0x3c9b64 = 6;
    const _0x2550fb = Math.ceil((_0x3c9b64 + _0xd0e56d.daysInMonth) / 7) * 7, _0x35b3f4 = _0x2550fb / 7;
    let _0x2206b7 = "";
    for (let _0x4b1d67 = 0; _0x4b1d67 < _0x35b3f4; _0x4b1d67++) {
        _0x2206b7 += "<tr>";
        for (let _0x2fad15 = 0; _0x2fad15 < 7; _0x2fad15++) {
            const _0x95ae1e = _0x4b1d67 * 7 + _0x2fad15, _0xaacf0d = _0x95ae1e - _0x3c9b64 + 1, _0x310249 = _0xd0e56d.year + "-" + String(_0xd0e56d.month).padStart(2, "0") + "-" + String(_0xaacf0d).padStart(2, "0"), _0x1444fc = Object.values(_0x3099fa[_0x310249] || {}).sort((_0x5c808b, _0x4efb84) => _0x5c808b.name.localeCompare(_0x4efb84.name, "vi")), _0x28b73b = getLunarString(_0x310249);
            if (_0xaacf0d < 1 || _0xaacf0d > _0xd0e56d.daysInMonth) {
                _0x2206b7 += "<td class=\"summary-empty-day\" data-hld=\"" + _0x310249 + "\"></td>";
                continue;
            }
            let _0x42dc49 = "<span class=\"weekly-day-number mb-2 text-wrap text-break\">Ngày " + _0xaacf0d + "<br>\n(" + _0x28b73b + ")</span><br><br>";
            !_0x1444fc.length ? _0x42dc49 += "<span class=\"summary-week-empty\">—</span><br><br><br><br><br>" : _0x1444fc.forEach(_0xc33b37 => { _0xc33b37.type === "off" ? _0x42dc49 += "<span class=\"ot-person-line weekly-off-line\" onclick=\"showTitle(this)\" data-title=\"" + (escapeHtml(_0xc33b37.typeLeave) + " : " + escapeHtml(_0xc33b37.typeName)) + "\nLý do : " + _0xc33b37.reason + "\nNgày tạo : " + _0xc33b37.createdStr + "\">\n                            <span class=\"ot-person-name\">" + escapeHtml(_0xc33b37.name) + "</span>-<span class=\"ot-person-off\">" + escapeHtml(_0xc33b37.typeLeave) + "</span>\n                        </span><br>" : _0x42dc49 += "<span class=\"ot-person-line\" onclick=\"showTitle(this)\" data-title=\"Công việc : " + _0xc33b37.task + "\nNgày tạo : " + _0xc33b37.createdStr + "\">\n                        <span class=\"ot-person-name\">" + escapeHtml(_0xc33b37.name) + "</span>-<span class=\"ot-person-hours\">" + escapeHtml(formatSummaryHours(_0xc33b37.hours)) + "h</span>\n                        </span><br>"; }), _0x2206b7 += "<td data-hld=\"" + _0x310249 + "\">" + _0x42dc49 + "</td>";
        }
        _0x2206b7 += "</tr>";
    }
    _0x2206b7 += "\n    <td colspan=\"7\" class=\"text-muted py-4\">\n        <div class=\"text-start ps-4 mb-4\">\n            <div class=\"fw-bold mb-2 small\">Note:</div>\n            <div class=\"row ps-3 g-1 small\">\n                <div class=\"col-12 col-md-6\">\n                    <div><b>OFF1</b> : <span>Nghỉ phép năm</span></div>\n                </div>\n                <div class=\"col-12 col-md-6\">\n                    <div><b>OFF2</b> : <span>Nghỉ bù tăng ca</span></div>\n                </div>\n                <div class=\"col-12 col-md-6\">\n                    <div><b>OFF3</b> : <span>Nghỉ công tác</span></div>\n                </div>\n                <div class=\"col-12 col-md-6\">\n                    <div><b>OFF4</b> : <span>Nghỉ đặc biệt</span></div>\n                </div>\n                <div class=\"col-12 col-md-6\">\n                    <div><b>OFF5</b> : <span>Nghỉ bảo hiểm</span></div>\n                </div>\n                <div class=\"col-12 col-md-6\">\n                    <div><b>OFF6</b> : <span>Nghỉ không lương</span></div>\n                </div>\n            </div>\n        </div>\n    </td>\n    ", el_summaryWeeklyTbody.innerHTML = _0x2206b7;
}
function renderSummaryEmployeeTable(_0x1d5fa7, _0x51ac46) {
    const _0x163bb4 = (el_filterSummarySearch.value || "").toLowerCase();
    if (!el_summaryEmployeeHeader || !el_summaryEmployeeTbody || !_0x51ac46)
        return;
    let _0x41022d = "<th>STT</th><th>TÊN</th><th>SỐ LẦN OT</th><th>TỔNG GIỜ OT</th>";
    for (let _0x368f6e = 1; _0x368f6e <= 31; _0x368f6e++) {
        const _0x2a3ca9 = new Date(_0x51ac46.year, _0x51ac46.month - 1, _0x368f6e), _0x15b2db = _0x51ac46.year + "-" + String(_0x51ac46.month).padStart(2, "0") + "-" + String(_0x368f6e).padStart(2, "0"), _0x5d4fd5 = getLunarString(_0x15b2db);
        _0x41022d += "<th data-hld=\"" + _0x15b2db + "\">\n            <div class=\"d-flex flex-column align-items-center\">\n                <span class=\"fs-6\">" + _0x368f6e + "</span>\n                <span class=\"text-muted\" style=\"font-size: 0.75rem;\">(" + _0x5d4fd5 + ")</span>\n            </div>\n        </th>";
    }
    el_summaryEmployeeHeader.innerHTML = _0x41022d;
    const _0x7a37b5 = {}, _0x449c1d = _0x5a7906 => {
        const _0x54c975 = _0x5a7906.toLocaleLowerCase("vi-VN");
        if (!_0x7a37b5[_0x54c975])
            _0x7a37b5[_0x54c975] = { "name": _0x5a7906, "count": 0, "hours": 0, "days": {}, "offDays": {} };
        return _0x7a37b5[_0x54c975];
    };
    _0x1d5fa7.forEach(_0x47f90d => {
        if (_0x163bb4) {
            const _0x5f915f = (_0x47f90d.otdate + " " + _0x47f90d.otshift + " " + _0x47f90d.othours + " " + _0x47f90d.ottask + " " + _0x47f90d.createdby).toLowerCase();
            if (!_0x5f915f.includes(_0x163bb4))
                return;
        }
        const _0x246285 = _0x449c1d(getSummaryUserName(_0x47f90d)), _0x37f8d1 = getSummaryHours(_0x47f90d.othours || _0x47f90d.OtHours);
        _0x246285.count += 1, _0x246285.hours += _0x37f8d1;
        const _0x2617d1 = parseSummaryDate(_0x47f90d.otdate || _0x47f90d.OtDate);
        if (_0x2617d1)
            _0x246285.days[_0x2617d1.getDate()] = (_0x246285.days[_0x2617d1.getDate()] || 0) + _0x37f8d1;
    }), getSummaryHolidayRecords().forEach(_0x18f360 => {
        if (_0x163bb4) {
            const _0x55f3df = (_0x18f360.otdate + " " + _0x18f360.otshift + " " + _0x18f360.othours + " " + _0x18f360.ottask + " " + _0x18f360.createdby).toLowerCase();
            if (!_0x55f3df.includes(_0x163bb4))
                return;
        }
        const _0x4ed43a = _0x449c1d(getSummaryUserName(_0x18f360)), _0x2bf830 = parseSummaryDate(_0x18f360.hldate || _0x18f360.HolidayDate);
        if (_0x2bf830)
            _0x4ed43a.offDays[_0x2bf830.getDate()] = true;
    }), Object.values(_0x7a37b5).forEach(_0x2caf40 => { Object.keys(_0x2caf40.offDays).forEach(_0x413121 => delete _0x2caf40.days[_0x413121]); });
    const _0x1ab93f = Object.values(_0x7a37b5).sort((_0xbba94a, _0x4ef6d2) => _0xbba94a.name.localeCompare(_0x4ef6d2.name, "vi"));
    if (!_0x1ab93f.length) {
        el_summaryEmployeeTbody.innerHTML = "<tr><td colspan=\"35\" class=\"text-center text-muted py-4\">Tháng này chưa có dữ liệu tăng ca/nghỉ.</td></tr>";
        return;
    }
    let _0x3f4b78 = "";
    _0x1ab93f.forEach((_0x5002bc, _0xa2f91e) => {
        _0x3f4b78 += "<tr>\n        <td>" + (_0xa2f91e + 1) + "</td>\n        <td><strong>" + escapeHtml(_0x5002bc.name) + "</strong></td>\n        <td class=\"ot-count\">" + _0x5002bc.count + "</td>\n        <td class=\"ot-total\">" + escapeHtml(formatSummaryTotalHours(_0x5002bc.hours)) + "h</td>";
        for (let _0x13c317 = 1; _0x13c317 <= 31; _0x13c317++) {
            const _0x4fa3d3 = new Date(_0x51ac46.year, _0x51ac46.month - 1, _0x13c317), _0x4476de = _0x51ac46.year + "-" + String(_0x51ac46.month).padStart(2, "0") + "-" + String(_0x13c317).padStart(2, "0"), _0x3369d3 = _0x13c317 <= _0x51ac46.daysInMonth && _0x4fa3d3.getDay() === 0, _0x320daf = _0x13c317 <= _0x51ac46.daysInMonth && !!_0x5002bc.offDays[_0x13c317], _0x42976d = _0x13c317 <= _0x51ac46.daysInMonth && !_0x320daf && _0x5002bc.days[_0x13c317] > 0;
            let _0x38df91 = _0x320daf ? "<span class=\"off-mark\">Off</span>" : _0x42976d ? escapeHtml(formatSummaryHours(_0x5002bc.days[_0x13c317])) + "h" : "";
            _0x3f4b78 += "<td data-hld=\"" + _0x4476de + "\">" + _0x38df91 + "</td>";
        }
        _0x3f4b78 += "</tr>";
    }), el_summaryEmployeeTbody.innerHTML = _0x3f4b78;
}
function renderSummaryDashboard() {
    const _0x782231 = getSummaryMonthInfo();
    if (!_0x782231)
        return;
    if (el_summaryMonth && !el_summaryMonth.value)
        el_summaryMonth.value = _0x782231.key;
    renderSummaryLists();
    const _0x126662 = getSummaryOtRecords();
    renderSummaryWeeklyTable(_0x126662, _0x782231), renderSummaryEmployeeTable(_0x126662, _0x782231), applyHolidayBackgrounds(), updateLunarAttributes();
}
function renderSummaryLists() {
    const _0x4a1423 = (el_filterSummarySearch.value || "").toLowerCase(), _0x135b1e = [getSummaryMonthKey()], _0x4141c1 = (rawOTData || []).filter(_0x4517b6 => {
        const _0x2ccdee = _0x4517b6.otdate || _0x4517b6.OtDate;
        if (!_0x2ccdee)
            return false;
        const _0x11533d = new Date(_0x2ccdee);
        if (isNaN(_0x11533d.getTime()))
            return false;
        const _0x406941 = _0x11533d.getFullYear() + "-" + String(_0x11533d.getMonth() + 1).padStart(2, "0");
        return _0x135b1e.includes(_0x406941);
    }).sort((_0x1d1142, _0x590e27) => new Date(_0x590e27.otdate || _0x590e27.OtDate) - new Date(_0x1d1142.otdate || _0x1d1142.OtDate));
    if (_0x4141c1.length === 0)
        el_summaryOtTbody.innerHTML = "<tr><td colspan=\"8\" class=\"text-center text-muted\">Chưa có dữ liệu tăng ca trong tháng đã chọn.</td></tr>";
    else {
        let _0x56ef85 = "";
        _0x4141c1.forEach(_0x1d91ef => {
            if (_0x4a1423) {
                const _0x50bdd = (_0x1d91ef.otdate + " " + _0x1d91ef.otshift + " " + _0x1d91ef.othours + " " + _0x1d91ef.ottask + " " + _0x1d91ef.createdby).toLowerCase();
                if (!_0x50bdd.includes(_0x4a1423))
                    return;
            }
            const _0x50e38e = _0x1d91ef.created || _0x1d91ef.Created, _0x2601bf = _0x1d91ef.updated || _0x1d91ef.Updated;
            let _0x1df7b1 = _0x50e38e ? new Date(_0x50e38e).toLocaleString("vi-VN") : "-", _0x5a9167 = _0x2601bf ? new Date(_0x2601bf).toLocaleString("vi-VN") : "-", _0x45fbb6 = formatDateDDMMYYYY(_0x1d91ef.otdate || _0x1d91ef.OtDate);
            const _0x18bd2d = _0x1d91ef.createdby || _0x1d91ef.CreatedBy || "", _0x395a33 = _0x18bd2d ? _0x18bd2d.charAt(0).toLocaleUpperCase("vi-VN") + _0x18bd2d.slice(1).toLocaleLowerCase("vi-VN") : "";
            let _0x1d5890 = escapeHtml(_0x395a33);
            _0x56ef85 += "\n            <tr data-hld=\"" + _0x45fbb6 + "\">\n                <td><strong>" + _0x1d5890 + "</strong></td>\n                <td><span>" + _0x45fbb6 + "</span></td>\n                <td>" + escapeHtml(_0x1d91ef.otshift || _0x1d91ef.Shift) + "</td>\n                <td><span class=\"text-success fw-bold\">" + escapeHtml(_0x1d91ef.othours || _0x1d91ef.OtHours) + "h</span></td>\n                <td>" + escapeHtml(_0x1d91ef.ottask || _0x1d91ef.OtTask || "-") + "</td>\n                <td class=\"small text-muted\">" + escapeHtml(_0x1df7b1) + "</td>\n                <td><span class=\"badge bg-light text-dark border\">" + (escapeHtml(_0x1d91ef.updatedby || _0x1d91ef.UpdatedBy) || "-") + "</span></td>\n                <td class=\"small text-muted\">" + escapeHtml(_0x5a9167) + "</td>\n            </tr>";
        }), _0x56ef85.length == 0 && (_0x56ef85 = "<tr><td colspan=\"7\">Không có dữ liệu</td></tr>"), el_summaryOtTbody.innerHTML = _0x56ef85;
    }
    const _0x239492 = (rawHolidayData || []).filter(_0x3a4cb6 => {
        const _0x4cd974 = _0x3a4cb6.hldate || _0x3a4cb6.HolidayDate;
        if (!_0x4cd974)
            return false;
        const _0xa5101c = new Date(_0x4cd974);
        if (isNaN(_0xa5101c.getTime()))
            return false;
        const _0x2313fd = _0xa5101c.getFullYear() + "-" + String(_0xa5101c.getMonth() + 1).padStart(2, "0");
        return _0x135b1e.includes(_0x2313fd);
    }).sort((_0x4e5679, _0x140d8a) => new Date(_0x140d8a.hldate || _0x140d8a.HolidayDate) - new Date(_0x4e5679.hldate || _0x4e5679.HolidayDate));
    if (_0x239492.length === 0)
        el_summaryHolidayTbody.innerHTML = "<tr><td colspan=\"7\" class=\"text-center text-muted\">Chưa có dữ liệu nghỉ phép trong tháng đã chọn.</td></tr>";
    else {
        let _0x127988 = "";
        _0x239492.forEach(_0x5c43f6 => {
            if (_0x4a1423) {
                const _0x2fb636 = (_0x5c43f6.otdate + " " + _0x5c43f6.otshift + " " + _0x5c43f6.othours + " " + _0x5c43f6.ottask + " " + _0x5c43f6.createdby).toLowerCase();
                if (!_0x2fb636.includes(_0x4a1423))
                    return;
            }
            const _0x5927a5 = _0x5c43f6.created || _0x5c43f6.Created, _0x57a2d7 = _0x5c43f6.updated || _0x5c43f6.Updated;
            let _0x1ce73d = _0x5927a5 ? new Date(_0x5927a5).toLocaleString("vi-VN") : "-", _0x4a44d7 = _0x57a2d7 ? new Date(_0x57a2d7).toLocaleString("vi-VN") : "-", _0x25744d = formatDateDDMMYYYY(_0x5c43f6.hldate || _0x5c43f6.HolidayDate);
            const _0x238218 = _0x5c43f6.createdby || _0x5c43f6.CreatedBy || "", _0x3950b8 = _0x238218 ? _0x238218.charAt(0).toLocaleUpperCase("vi-VN") + _0x238218.slice(1).toLocaleLowerCase("vi-VN") : "";
            let _0x7a4827 = escapeHtml(_0x3950b8);
            _0x127988 += "\n            <tr data-hld=\"" + _0x25744d + "\">\n                <td><strong>" + _0x7a4827 + "</strong></td>\n                <td><span>" + _0x25744d + "</span></td>\n                <td><span class=\"badge bg-info text-dark\">" + escapeHtml(_0x5c43f6.hltype || _0x5c43f6.LeaveType) + "</span></td>\n                <td>" + escapeHtml(_0x5c43f6.hlreason || _0x5c43f6.Reason || "-") + "</td>\n                <td class=\"small text-muted\">" + escapeHtml(_0x1ce73d) + "</td>\n                <td><span class=\"badge bg-light text-dark border\">" + (escapeHtml(_0x5c43f6.updatedby || _0x5c43f6.UpdatedBy) || "-") + "</span></td>\n                <td class=\"small text-muted\">" + escapeHtml(_0x4a44d7) + "</td>\n            </tr>";
        }), _0x127988.length == 0 && (_0x127988 = "<tr><td colspan=\"7\">Không có dữ liệu</td></tr>"), el_summaryHolidayTbody.innerHTML = _0x127988;
    }
}
function renderSummaryTables() { renderSummaryDashboard(); }
function exportSummaryExcel() { const _0xa23bf2 = XLSX.utils.book_new(), _0x34e31d = createStyledSheetFromTable("summaryOtTable"); XLSX.utils.book_append_sheet(_0xa23bf2, _0x34e31d, "Tổng Hợp Tăng Ca"); const _0x486080 = createStyledSheetFromTable("summaryHolidayTable"); XLSX.utils.book_append_sheet(_0xa23bf2, _0x486080, "Tổng Hợp Ngày Nghỉ"); const _0x43c42b = createStyledSheetFromTable("summaryWeeklyTable"); XLSX.utils.book_append_sheet(_0xa23bf2, _0x43c42b, "Tổng Hợp Theo Tuần"); const _0x53a9ff = createStyledSheetFromTable("summaryEmployeeHeaderTable"); XLSX.utils.book_append_sheet(_0xa23bf2, _0x53a9ff, "Tổng Hợp Nhân Viên"); const _0x265c7a = new Date().toISOString().slice(0, 10); XLSX.writeFile(_0xa23bf2, "Bao_Cao_" + _0x265c7a + ".xlsx"); }
function renderGroupedData() {
    const _0x4b0aed = currentUser.username || "", _0x1f4fd3 = currentUser.role || "user", _0x4dcc18 = el_filterMonth.value, _0x4facf1 = (el_filterOtSearch.value || "").toLowerCase();
    el_tableHeader.innerHTML = "\n    <th>Ngày OT</th>\n    <th>Ca làm việc</th>\n    <th>Số giờ OT</th>\n    <th>Công việc</th>\n    <th>Người OT</th>\n    <th>Thời gian tạo</th>\n    <th>Người sửa</th>\n    <th>Thời gian sửa</th>\n    <th class=\"text-center\" style=\"width: 110px;\">Thao tác</th>", el_tbody.innerHTML = "";
    let _0x1f75b0 = rawOTData;
    _0x1f4fd3 !== "admin" && (_0x1f75b0 = rawOTData.filter(_0x33a6fb => String(_0x33a6fb.createdby || _0x33a6fb.CreatedBy).toLowerCase() === _0x4b0aed.toLowerCase()));
    if (_0x1f75b0.length === 0) {
        el_tbody.innerHTML = "<tr><td colspan=\"9\" class=\"text-center text-muted py-4\">Chưa có dữ liệu tăng ca nào.</td></tr>";
        return;
    }
    const _0x2475e7 = {};
    _0x1f75b0.forEach(_0x3081f8 => {
        const _0x314140 = _0x3081f8.otdate || _0x3081f8.OtDate;
        if (!_0x314140)
            return;
        const _0x572a54 = new Date(_0x314140);
        if (isNaN(_0x572a54.getTime()))
            return;
        const _0x269758 = _0x572a54.getFullYear() + "-" + String(_0x572a54.getMonth() + 1).padStart(2, "0");
        if (_0x4dcc18 && _0x269758 !== _0x4dcc18)
            return;
        if (_0x4facf1) {
            const _0x2de8e6 = (_0x3081f8.otdate + " " + _0x3081f8.otshift + " " + _0x3081f8.othours + " " + _0x3081f8.ottask + " " + _0x3081f8.createdby).toLowerCase();
            if (!_0x2de8e6.includes(_0x4facf1))
                return;
        }
        if (!_0x2475e7[_0x269758])
            _0x2475e7[_0x269758] = [];
        _0x2475e7[_0x269758].push(_0x3081f8);
    });
    const _0x28141a = Object.keys(_0x2475e7).sort().reverse();
    if (_0x28141a.length === 0) {
        el_tbody.innerHTML = "<tr><td colspan=\"9\" class=\"text-center text-muted py-4\">Không tìm thấy bản ghi nào trong tháng đã chọn.</td></tr>";
        return;
    }
    let _0x1e5533 = "";
    _0x28141a.forEach(_0x2c0dae => {
        const _0x4d4949 = _0x2475e7[_0x2c0dae];
        _0x4d4949.sort((_0x4d3f81, _0x57515a) => new Date(_0x57515a.otdate || _0x57515a.OtDate) - new Date(_0x4d3f81.otdate || _0x4d3f81.OtDate));
        const _0x4740ff = _0x4d4949.reduce((_0x771dbc, _0x2a3dc3) => _0x771dbc + (parseFloat(_0x2a3dc3.othours || _0x2a3dc3.OtHours) || 0), 0), _0xb3b124 = _0x4d4949.length, [_0x4a1e29, _0x235a50] = _0x2c0dae.split("-"), _0x459014 = "Tháng " + _0x235a50 + "/" + _0x4a1e29;
        _0x1e5533 += "\n        <tr class=\"table-primary border-0\">\n            <td colspan=\"9\" class=\"py-2 bg-primary bg-opacity-10 border-0\">\n                <div class=\"d-flex gap-2 align-items-center month-group-header\">\n                    <span class=\"fw-bold text-primary fs-6\">📅 " + _0x459014 + "</span>\n                    <div class=\"d-flex gap-2\">\n                        <span class=\"badge bg-primary text-white d-inline-block text-center\" style=\"min-width: 110px;\">Tổng số lần: " + _0xb3b124 + "</span>\n                        <span class=\"badge bg-success text-white d-inline-block text-center\" style=\"min-width: 125px;\">Tổng số giờ: " + _0x4740ff + "h</span>\n                    </div>\n                </div>\n            </td>\n        </tr>", _0x4d4949.forEach(_0x53e820 => {
            const _0x375a2f = _0x53e820.created || _0x53e820.Created, _0x61735 = _0x53e820.updated || _0x53e820.Updated;
            let _0x1d0b30 = _0x375a2f ? new Date(_0x375a2f).toLocaleString("vi-VN") : "-", _0x31b394 = _0x61735 ? new Date(_0x61735).toLocaleString("vi-VN") : "-";
            const _0x2861ef = formatDateDDMMYYYY(_0x53e820.otdate || _0x53e820.OtDate), _0x21ee99 = escapeHtml(_0x53e820.otshift || _0x53e820.Shift), _0x460aa2 = formatOtHours(_0x53e820.othours || _0x53e820.OtHours), _0x15fdb0 = escapeHtml(_0x53e820.ottask || _0x53e820.OtTask || ""), _0xba08da = escapeHtml(_0x53e820.createdby || _0x53e820.CreatedBy), _0xd897a0 = escapeHtml(_0x53e820.updatedby || _0x53e820.UpdatedBy), _0x13882e = _0x1f4fd3 === "admin" || _0xba08da.toLowerCase() === _0x4b0aed.toLowerCase();
            _0x1e5533 += "\n                <tr data-hld=\"" + _0x2861ef + "\">\n                    <td><strong class=\"text-dark\">" + _0x2861ef + "</strong></td>\n                    <td><span class=\"badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25\">" + _0x21ee99 + "</span></td>\n                    <td><span class=\"badge bg-success bg-opacity-10 text-success border border-success border-opacity-25\">" + _0x460aa2 + "h</span></td>\n                    <td><span>" + (_0x15fdb0 || "-") + "</span></td>\n                    <td><span class=\"badge bg-light text-dark border\">" + (_0xba08da || "N/A") + "</span></td>\n                    <td class=\"small text-muted\">" + escapeHtml(_0x1d0b30) + "</td>\n                    <td><span class=\"badge bg-light text-dark border\">" + (_0xd897a0 || "-") + "</span></td>\n                    <td class=\"small text-muted\">" + escapeHtml(_0x31b394) + "</td>\n                    <td class=\"text-center\">";
            if (_0x13882e) {
                const _0x197a9c = formatDateYYYYMMDD(_0x53e820.otdate || _0x53e820.OtDate), _0x307329 = _0x53e820.id || _0x53e820.ID;
                _0x1e5533 += "\n                    <button class=\"btn btn-action btn-outline-warning text-dark me-1\" onclick=\"startEdit('" + escapeHtml(_0x307329) + "', '" + _0x197a9c + "', '" + _0x21ee99 + "', '" + _0x460aa2 + "', '" + _0x15fdb0 + "')\">Sửa</button>\n                    <button class=\"btn btn-action btn-outline-danger\" onclick=\"deleteData('" + escapeHtml(_0x307329) + "')\">Xóa</button>";
            }
            else
                _0x1e5533 += "<span class=\"text-muted small\">N/A</span>";
            _0x1e5533 += "</td></tr>";
        });
    }), el_tbody.innerHTML = _0x1e5533;
}
function renderGroupedHolidayData() {
    const _0x31d531 = currentUser.username || "", _0x392a49 = currentUser.role || "user", _0x374502 = el_filterHolidayMonth.value, _0x34d011 = (el_filterSummarySearch.value || "").toLowerCase();
    el_holidayTableHeader.innerHTML = "\n    <th>Ngày nghỉ</th>\n    <th>Loại nghỉ phép</th>\n    <th>Lý do nghỉ</th>\n    <th>Người nghỉ</th>\n    <th>Thời gian tạo</th>\n    <th>Người sửa</th>\n    <th>Thời gian sửa</th>\n    <th class=\"text-center\" style=\"width: 110px;\">Thao tác</th>", el_holidayTbody.innerHTML = "";
    let _0x15cfb6 = rawHolidayData;
    _0x392a49 !== "admin" && (_0x15cfb6 = rawHolidayData.filter(_0x48db7a => String(_0x48db7a.createdby || _0x48db7a.CreatedBy).toLowerCase() === _0x31d531.toLowerCase()));
    if (_0x15cfb6.length === 0) {
        el_holidayTbody.innerHTML = "<tr><td colspan=\"8\" class=\"text-center text-muted py-4\">Chưa có ngày nghỉ phép nào được đăng ký.</td></tr>";
        return;
    }
    const _0x20b795 = {};
    _0x15cfb6.forEach(_0x6a3569 => {
        const _0x327bce = _0x6a3569.hldate || _0x6a3569.HolidayDate;
        if (!_0x327bce)
            return;
        const _0x10edb4 = new Date(_0x327bce);
        if (isNaN(_0x10edb4.getTime()))
            return;
        const _0x219cb4 = _0x10edb4.getFullYear() + "-" + String(_0x10edb4.getMonth() + 1).padStart(2, "0");
        if (_0x374502 && _0x219cb4 !== _0x374502)
            return;
        if (_0x34d011) {
            const _0x168a78 = (_0x6a3569.hldate + " " + _0x6a3569.hltype + " " + _0x6a3569.hlreason + " " + _0x6a3569.createdby).toLowerCase();
            if (!_0x168a78.includes(_0x34d011))
                return;
        }
        if (!_0x20b795[_0x219cb4])
            _0x20b795[_0x219cb4] = [];
        _0x20b795[_0x219cb4].push(_0x6a3569);
    });
    const _0x6fbddc = Object.keys(_0x20b795).sort().reverse();
    if (_0x6fbddc.length === 0) {
        el_holidayTbody.innerHTML = "<tr><td colspan=\"8\" class=\"text-center text-muted py-4\">Không tìm thấy ngày nghỉ nào trong tháng đã chọn.</td></tr>";
        return;
    }
    let _0x3ffac5 = "";
    _0x6fbddc.forEach(_0x38121f => {
        const _0x5e72cf = _0x20b795[_0x38121f];
        _0x5e72cf.sort((_0x1beb13, _0x18124b) => new Date(_0x18124b.hldate || _0x18124b.HolidayDate) - new Date(_0x1beb13.hldate || _0x1beb13.HolidayDate));
        const _0x34f9eb = _0x5e72cf.length, [_0x5c45b0, _0x39ca72] = _0x38121f.split("-"), _0x143d7f = "Tháng " + _0x39ca72 + "/" + _0x5c45b0;
        _0x3ffac5 += "\n    <tr class=\"table-info border-0\">\n        <td colspan=\"8\" class=\"py-2 bg-info bg-opacity-10 border-0\">\n            <div class=\"d-flex gap-2 align-items-center month-group-header\">\n                <span class=\"fw-bold text-info-emphasis fs-6\">🌴 " + _0x143d7f + "</span>\n                <div>\n                    <span class=\"badge bg-info text-white d-inline-block text-center\">Tổng ngày nghỉ: " + _0x34f9eb + " ngày</span>\n                </div>\n            </div>\n        </td>\n    </tr>", _0x5e72cf.forEach(_0x2aa071 => {
            const _0x3d918c = _0x2aa071.created || _0x2aa071.Created, _0x5d8da0 = _0x2aa071.updated || _0x2aa071.Updated;
            let _0x118cfe = _0x3d918c ? new Date(_0x3d918c).toLocaleString("vi-VN") : "-", _0x2a1422 = _0x5d8da0 ? new Date(_0x5d8da0).toLocaleString("vi-VN") : "-";
            const _0x315328 = formatDateDDMMYYYY(_0x2aa071.hldate || _0x2aa071.HolidayDate), _0x346374 = escapeHtml(_0x2aa071.hltype || _0x2aa071.LeaveType), _0x44b930 = escapeHtml(_0x2aa071.hlreason || _0x2aa071.Reason || ""), _0x245310 = escapeHtml(_0x2aa071.createdby || _0x2aa071.CreatedBy), _0x55e652 = escapeHtml(_0x2aa071.updatedby || _0x2aa071.UpdatedBy), _0x1dfaf4 = _0x392a49 === "admin" || _0x245310.toLowerCase() === _0x31d531.toLowerCase();
            _0x3ffac5 += "\n    <tr data-hld=\"" + _0x315328 + "\">\n        <td><strong class=\"text-dark\">" + _0x315328 + "</strong></td>\n        <td><span class=\"badge bg-info bg-opacity-10 text-info-emphasis border border-info border-opacity-25\">" + _0x346374 + "</span></td>\n        <td><span>" + (_0x44b930 || "-") + "</span></td>\n        <td><span class=\"badge bg-light text-dark border\">" + (_0x245310 || "N/A") + "</span></td>\n        <td class=\"small text-muted\">" + escapeHtml(_0x118cfe) + "</td>\n        <td><span class=\"badge bg-light text-dark border\">" + (_0x55e652 || "-") + "</span></td>\n        <td class=\"small text-muted\">" + escapeHtml(_0x2a1422) + "</td>\n        <td class=\"text-center\">";
            if (_0x1dfaf4) {
                const _0x32dbfb = formatDateYYYYMMDD(_0x2aa071.hldate || _0x2aa071.HolidayDate), _0x624355 = _0x2aa071.id || _0x2aa071.ID;
                _0x3ffac5 += "\n            <button class=\"btn btn-action btn-outline-warning text-dark me-1\" onclick=\"startEditHoliday('" + escapeHtml(_0x624355) + "', '" + _0x32dbfb + "', '" + _0x346374 + "', '" + _0x44b930 + "')\">Sửa</button>\n            <button class=\"btn btn-action btn-outline-danger\" onclick=\"deleteHolidayData('" + escapeHtml(_0x624355) + "')\">Xóa</button>";
            }
            else
                _0x3ffac5 += "<span class=\"text-muted small\">N/A</span>";
            _0x3ffac5 += "</td></tr>";
        });
    }), el_holidayTbody.innerHTML = _0x3ffac5;
}
async function loadData(_0x42ce85 = false) {
    el_loadStatus.innerText = "Đang đồng bộ dữ liệu...";
    if (_0x42ce85)
        toggleLoading(true, "Đang tải danh sách tăng ca...");
    let _0x4d8487 = supabase.from("data").select("*").order("otdate", { "ascending": false });
    const _0x20bfc5 = currentUser.role || "user";
    _0x20bfc5 !== "admin" && _0x20bfc5 !== "user1" && _0x20bfc5 !== "user" && (_0x4d8487 = _0x4d8487.eq("createdby", currentUser.username));
    const { data: _0x378109, error: _0x493b68 } = await _0x4d8487;
    if (_0x42ce85)
        toggleLoading(false);
    if (_0x493b68) {
        showToast("Lỗi tải dữ liệu tăng ca: " + _0x493b68.message, "danger");
        return;
    }
    rawOTData = _0x378109 || [], renderGroupedData(), renderSummaryTables(), updateTimestamp();
    if (_0x42ce85)
        showToast("Đã cập nhật dữ liệu tăng ca mới nhất!", "success");
}
async function loadHolidayData(_0x117cfa = false) {
    if (_0x117cfa)
        toggleLoading(true, "Đang tải danh sách nghỉ phép...");
    let _0x3bbee9 = supabase.from("holidays").select("*").order("hldate", { "ascending": false });
    const _0x4d387c = currentUser.role || "user";
    _0x4d387c !== "admin" && _0x4d387c !== "user1" && _0x4d387c !== "user" && (_0x3bbee9 = _0x3bbee9.eq("createdby", currentUser.username));
    const { data: _0x2dc874, error: _0x113935 } = await _0x3bbee9;
    if (_0x117cfa)
        toggleLoading(false);
    if (_0x113935) {
        showToast("Lỗi tải danh sách ngày nghỉ: " + _0x113935.message, "danger");
        return;
    }
    rawHolidayData = _0x2dc874 || [], renderGroupedHolidayData(), renderSummaryTables();
    if (_0x117cfa)
        showToast("Đã cập nhật dữ liệu ngày nghỉ mới nhất!", "success");
}
async function loadInitialData() {
    toggleLoading(true, "Đang tải dữ liệu hệ thống..."), el_loadStatus.innerText = "Đang đồng bộ dữ liệu...";
    const _0x2d795e = currentUser.role || "user";
    let _0x3c33b4 = supabase.from("data").select("*").order("otdate", { "ascending": false }), _0x71a26 = supabase.from("holidays").select("*").order("hldate", { "ascending": false });
    _0x2d795e !== "admin" && _0x2d795e !== "user1" && _0x2d795e !== "user" && (_0x3c33b4 = _0x3c33b4.eq("createdby", currentUser.username), _0x71a26 = _0x71a26.eq("createdby", currentUser.username));
    const [_0x26e173, _0x82460, _0x407202] = await Promise.all([_0x3c33b4, _0x71a26, supabase.from("lt_hld").select("*")]);
    toggleLoading(false);
    if (_0x26e173.error || _0x82460.error) {
        showToast("Lỗi tải dữ liệu từ Supabase!", "danger");
        return;
    }
    rawOTData = _0x26e173.data || [], rawHolidayData = _0x82460.data || [], rawLtHldData = _0x407202.data || [];
    const _0x4a7977 = new Date(), _0x508d51 = _0x4a7977.getFullYear(), _0x1faf3d = String(_0x4a7977.getMonth() + 1).padStart(2, "0"), _0x39850f = _0x508d51 + "-" + _0x1faf3d;
    if (!el_filterMonth.value)
        el_filterMonth.value = _0x39850f;
    if (!el_filterHolidayMonth.value)
        el_filterHolidayMonth.value = _0x39850f;
    if (!el_summaryMonth.value)
        el_summaryMonth.value = _0x39850f;
    renderGroupedData(), renderGroupedHolidayData(), renderSummaryTables(), applyUserOptionToUI(currentUser.option), updateTimestamp(), applyHolidayBackgrounds(), updateLunarAttributes();
}
function updateTimestamp() { const _0x3740e6 = new Date(), _0x1faaa3 = String(_0x3740e6.getHours()).padStart(2, "0"), _0x1fdc6d = String(_0x3740e6.getMinutes()).padStart(2, "0"), _0x5a13b8 = String(_0x3740e6.getDate()).padStart(2, "0"), _0x33ad91 = String(_0x3740e6.getMonth() + 1).padStart(2, "0"), _0x21c8d0 = _0x3740e6.getFullYear(); el_loadStatus.innerText = "Cập nhật gần nhất: " + _0x1faaa3 + ":" + _0x1fdc6d + " - " + _0x5a13b8 + "/" + _0x33ad91 + "/" + _0x21c8d0; }
function setTomSelectValue(_0x212cf0, _0x527b54) {
    if (!_0x212cf0)
        return;
    let _0x1af9ac = "";
    _0x527b54 !== null && _0x527b54 !== undefined && _0x527b54 !== "" && (_0x1af9ac = String(_0x527b54).trim());
    if (!_0x1af9ac) {
        _0x212cf0.clear();
        return;
    }
    _0x212cf0 === tsHours && (_0x1af9ac = formatOtHours(_0x1af9ac));
    if (!_0x1af9ac) {
        _0x212cf0.clear();
        return;
    }
    !_0x212cf0.options[_0x1af9ac] && _0x212cf0.addOption({ "value": _0x1af9ac, "text": _0x1af9ac }), _0x212cf0.setValue(_0x1af9ac);
}
function startEdit(_0x2e79c5, _0x123a7f, _0xd79cb2, _0x24301b, _0x447966) {
    el_editId.value = _0x2e79c5, el_otDate.value = _0x123a7f;
    if (tsShift)
        tsShift.setValue(_0xd79cb2);
    if (tsHours)
        setTomSelectValue(tsHours, _0x24301b);
    if (tsTask)
        setTomSelectValue(tsTask, _0x447966);
    el_formTitle.innerText = "✏️ Chỉnh sửa Tăng ca", el_btnSubmit.innerText = "Lưu thay đổi", el_btnSubmit.className = "btn btn-warning w-100 fw-bold py-2 text-dark", el_btnReset.innerText = "Hủy thay đổi", el_formTitle.scrollIntoView({ "behavior": "smooth" });
}
function startEditHoliday(_0x22402f, _0x1abf84, _0x48dc7a, _0x1983f3) {
    el_editHolidayId.value = _0x22402f, el_holidayDate.value = _0x1abf84;
    for (let _0xd7157a = 0; _0xd7157a < el_leaveType.options.length; _0xd7157a++) {
        if (el_leaveType.options[_0xd7157a].value === _0x48dc7a) {
            el_leaveType.selectedIndex = _0xd7157a;
            break;
        }
    }
    el_holidayReason.value = _0x1983f3 || "", el_holidayFormTitle.innerText = "✏ Chỉnh sửa Nghỉ phép", el_btnHolidaySubmit.innerText = "Lưu thay đổi", el_btnHolidaySubmit.className = "btn btn-warning w-100 fw-bold py-2 text-dark", el_btnHolidayReset.innerText = "Hủy thay đổi", el_holidayFormTitle.scrollIntoView({ "behavior": "smooth" });
}
async function saveData() {
    const _0xe474c2 = el_editId.value, _0x6e1571 = el_otDate.value, _0x3cd96b = el_shift.value.trim(), _0xcfaef4 = formatOtHours(el_otHours.value), _0x3a4f76 = el_otTask.value.trim();
    if (!_0x6e1571 || !_0x3cd96b || !_0xcfaef4 || !_0x3a4f76) {
        showToast("Vui lòng điền đủ: Ngày, Ca làm việc, Số giờ OT và Công việc !", "danger");
        return;
    }
    const _0x5815cf = Number(_0xcfaef4);
    if (!Number.isFinite(_0x5815cf) || _0x5815cf <= 0) {
        showToast("Số giờ OT không hợp lệ!", "danger");
        return;
    }
    const _0x5b46c1 = _0xe474c2 !== "", _0x27cac2 = currentUser.username || "", _0xe11573 = new Date().toISOString();
    toggleLoading(true, "Đang lưu dữ liệu tăng ca...");
    let _0x1effe6;
    _0x5b46c1 ? _0x1effe6 = await supabase.from("data").update({ "otdate": _0x6e1571, "otshift": _0x3cd96b, "othours": _0x5815cf, "ottask": _0x3a4f76, "updatedby": _0x27cac2, "updated": _0xe11573 }).eq("id", _0xe474c2) : _0x1effe6 = await supabase.from("data").insert([{ "otdate": _0x6e1571, "otshift": _0x3cd96b, "othours": _0x5815cf, "ottask": _0x3a4f76, "createdby": _0x27cac2, "created": _0xe11573, "updatedby": _0x27cac2, "updated": _0xe11573 }]), toggleLoading(false), !_0x1effe6.error ? (showToast(_0x5b46c1 ? "Cập nhật dữ liệu thành công!" : "Đăng ký Tăng ca thành công!", "success"), resetForm(), loadData(false)) : showToast("Lỗi hệ thống: " + _0x1effe6.error.message, "danger");
}
async function saveHolidayData() {
    const _0x4aa788 = el_editHolidayId.value, _0x277c80 = el_holidayDate.value, _0x2368b9 = el_leaveType.value, _0x37c923 = el_holidayReason.value.trim();
    if (!_0x277c80 || !_0x2368b9 || !_0x37c923) {
        showToast("Vui lòng điền đủ: Ngày nghỉ, Loại nghỉ phép và Lý do nghỉ!", "danger");
        return;
    }
    const _0x2df5b4 = _0x4aa788 !== "", _0x4121f3 = currentUser.username || "", _0x226d01 = new Date().toISOString();
    toggleLoading(true, "Đang lưu thông tin nghỉ phép...");
    let _0x3fa1da;
    _0x2df5b4 ? _0x3fa1da = await supabase.from("holidays").update({ "hldate": _0x277c80, "hltype": _0x2368b9, "hlreason": _0x37c923, "updatedby": _0x4121f3, "updated": _0x226d01 }).eq("id", _0x4aa788) : _0x3fa1da = await supabase.from("holidays").insert([{ "hldate": _0x277c80, "hltype": _0x2368b9, "hlreason": _0x37c923, "createdby": _0x4121f3, "updatedby": _0x4121f3, "created": _0x226d01, "updated": _0x226d01 }]), toggleLoading(false), !_0x3fa1da.error ? (showToast(_0x2df5b4 ? "Cập nhật thông tin nghỉ phép thành công!" : "Đăng ký Nghỉ phép thành công!", "success"), resetHolidayForm(), loadHolidayData(false)) : showToast("Lỗi hệ thống: " + _0x3fa1da.error.message, "danger");
}
async function deleteData(_0x8515b7) {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn lần tăng ca này?"))
        return;
    toggleLoading(true, "Đang xóa...");
    const { error: _0x5e7d34 } = await supabase.from("data").delete().eq("id", _0x8515b7);
    toggleLoading(false), !_0x5e7d34 ? (showToast("Đã xóa thành công!", "success"), loadData(false)) : showToast("Lỗi khi xóa: " + _0x5e7d34.message, "danger");
}
async function deleteHolidayData(_0x855058) {
    if (!confirm("Bạn có chắc chắn muốn xóa ngày nghỉ này?"))
        return;
    toggleLoading(true, "Đang xóa...");
    const { error: _0xebfc4d } = await supabase.from("holidays").delete().eq("id", _0x855058);
    toggleLoading(false), !_0xebfc4d ? (showToast("Đã xóa ngày nghỉ thành công!", "success"), loadHolidayData(false)) : showToast("Lỗi khi xóa: " + _0xebfc4d.message, "danger");
}
async function createUser() {
    const _0x1d0f48 = el_newRole.value, _0x28434f = el_newUser.value.trim(), _0x45fe8d = el_newPass.value;
    if (!_0x28434f || !_0x45fe8d) {
        showToast("Vui lòng không để trống tên đăng nhập và mật khẩu!", "danger");
        return;
    }
    toggleLoading(true, "Đang khởi tạo tài khoản...");
    const { error: _0x463099 } = await supabase.from("users").insert([{ "username": _0x28434f, "password": _0x45fe8d, "role": _0x1d0f48, "option": {} }]);
    toggleLoading(false), !_0x463099 ? (showToast("Khởi tạo tài khoản thành công!", "success"), el_newUser.value = "", el_newPass.value = "") : showToast("Lỗi: " + _0x463099.message, "danger");
}
async function resetPasswordByAdmin() {
    const _0x3252de = el_resetTargetUser.value.trim(), _0x2b3f0a = el_resetNewPass.value;
    if (!_0x3252de || !_0x2b3f0a) {
        showToast("Vui lòng nhập đầy đủ Tên tài khoản và Mật khẩu mới!", "danger");
        return;
    }
    if (!confirm("Bạn chắc chắn muốn đặt lại mật khẩu cho tài khoản [" + _0x3252de + "]?"))
        return;
    toggleLoading(true, "Đang cấp lại mật khẩu...");
    const { error: _0x2c2344 } = await supabase.from("users").update({ "password": _0x2b3f0a }).eq("username", _0x3252de);
    toggleLoading(false), !_0x2c2344 ? (showToast("Cấp lại mật khẩu cho tài khoản " + _0x3252de + " thành công!", "success"), el_resetTargetUser.value = "", el_resetNewPass.value = "") : showToast("Lỗi: " + _0x2c2344.message, "danger");
}
async function changePassword() {
    const _0x102b0b = el_oldPass.value, _0x287c02 = el_newPassUser.value, _0xc7eb6f = currentUser.username || "";
    if (!_0x102b0b || !_0x287c02) {
        showToast("Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới!", "danger");
        return;
    }
    toggleLoading(true, "Đang đổi mật khẩu...");
    const { data: _0x13f202, error: _0x4c51e7 } = await supabase.from("users").select("password").eq("username", _0xc7eb6f).single();
    if (_0x4c51e7 || _0x13f202.password !== _0x102b0b) {
        toggleLoading(false), showToast("Mật khẩu hiện tại không chính xác!", "danger");
        return;
    }
    const { error: _0x4af850 } = await supabase.from("users").update({ "password": _0x287c02 }).eq("username", _0xc7eb6f);
    toggleLoading(false), !_0x4af850 ? (showToast("Đổi mật khẩu thành công! Đang đăng xuất...", "success"), setTimeout(logout, 2000)) : showToast("Lỗi: " + _0x4af850.message, "danger");
}
async function saveUserOption(_0x36053b = false) {
    const _0x127080 = el_cfgUrls.value.split("\n"), _0x27292f = [];
    _0x127080.forEach(_0x2dd8aa => {
        if (_0x2dd8aa.includes("|")) {
            const _0x1067b8 = _0x2dd8aa.split("|");
            _0x27292f.push({ "title": _0x1067b8[0].trim(), "url": _0x1067b8[1].trim() });
        }
    });
    const _0x4544b7 = { "urls": _0x27292f }, _0x1d61d6 = currentUser.username || "";
    if (!_0x36053b)
        toggleLoading(true, "Đang lưu cấu hình...");
    const { error: _0x88a879 } = await supabase.from("users").update({ "option": _0x4544b7 }).eq("username", _0x1d61d6);
    if (!_0x36053b)
        toggleLoading(false);
    if (!_0x88a879) {
        if (!_0x36053b)
            showToast("Lưu cấu hình thành công!", "success");
    }
    else {
        if (!_0x36053b)
            showToast("Không thể lưu cấu hình: " + _0x88a879.message, "danger");
    }
}
function applyUserOptionToUI(_0x4fe1d4) {
    const _0x4b05c6 = _0x4fe1d4.urls || [];
    if (el_quickLinksContainer && el_quickLinksCard) {
        el_quickLinksContainer.innerHTML = "";
        if (_0x4b05c6.length > 0) {
            el_quickLinksCard.style.display = "block";
            let _0x2320ee = "";
            _0x4b05c6.forEach(_0x1c4a97 => { _0x2320ee += _0x1c4a97.title + "|" + _0x1c4a97.url + "\n"; const _0x559410 = document.createElement("a"); _0x559410.href = _0x1c4a97.url, _0x559410.target = "_blank", _0x559410.className = "btn btn-xs btn-outline-dark pt-0 pb-0 ps-2 pe-2 small bg-white border shadow-sm", _0x559410.style.fontSize = "12px", _0x559410.innerText = _0x1c4a97.title, el_quickLinksContainer.appendChild(_0x559410); }), el_cfgUrls.value = _0x2320ee.trim();
        }
        else
            el_quickLinksCard.style.display = "none", el_cfgUrls.value = "";
    }
}
function showDashboard() {
    el_otDate.valueAsDate = new Date(), el_holidayDate.valueAsDate = new Date();
    const _0x5e2b2d = currentUser.username || "", _0x8d770a = (currentUser.role || "").toLowerCase(), _0x42a9b5 = _0x5e2b2d ? _0x5e2b2d.charAt(0).toUpperCase() + _0x5e2b2d.slice(1) : "";
    let _0x43d62d = "<span>Xin chào, </span><strong>" + escapeHtml(_0x42a9b5) + "</strong><br>\n    <span class=\"badge bg-info bg-opacity-10 text-info-emphasis border border-info border-opacity-25\">(" + _0x8d770a.toUpperCase() + ")</span>";
    el_userInfo.innerHTML = _0x43d62d;
    const _0x3e3b89 = document.getElementById("otFormCard"), _0x30fdab = document.getElementById("holidayFormCard");
    if (_0x8d770a === "admin" || _0x8d770a === "user1") {
        if (_0x8d770a === "admin") {
            if (_0x3e3b89)
                _0x3e3b89.style.display = "none";
            if (_0x30fdab)
                _0x30fdab.style.display = "none";
        }
        el_ltHldAdminCard && (el_ltHldAdminCard.style.display = "block", renderLtHldTypeOptions(), loadLtHldData());
    }
    else {
        if (_0x3e3b89)
            _0x3e3b89.style.display = "block";
        if (_0x30fdab)
            _0x30fdab.style.display = "block";
        el_ltHldAdminCard && (el_ltHldAdminCard.style.display = "none");
    }
    _0x8d770a === "admin" || _0x8d770a === "user1" || _0x8d770a === "user" ? el_summaryPanel.style.display = "block" : el_summaryPanel.style.display = "none";
}
function toggleCardFullscreen(_0x353c8a) {
    const _0xe4927 = document.getElementById(_0x353c8a);
    if (!_0xe4927)
        return;
    _0xe4927.classList.toggle("card-fullscreen");
}
function renderSummaryData() { renderSummaryTables(); }
function clearSummaryFilter() { el_filterSummarySearch.value = "", renderSummaryTables(); }
async function copyActiveSummaryPaneAsImage() {
    const _0x3e72d3 = document.querySelector(".tab-pane.active") || document.getElementById("summaryPanel");
    if (!_0x3e72d3)
        return;
    const _0x1995db = _0x3e72d3.cloneNode(true);
    _0x1995db.style.position = "absolute", _0x1995db.style.left = "-99999px", _0x1995db.style.top = "0", _0x1995db.style.width = "auto", _0x1995db.style.height = "auto", _0x1995db.style.maxHeight = "none", _0x1995db.style.overflow = "visible", _0x1995db.style.zIndex = "999999";
    const _0x8346d0 = _0x1995db.querySelectorAll("*");
    _0x8346d0.forEach(_0x5dc7d6 => { _0x5dc7d6.style.overflow = "visible", _0x5dc7d6.style.maxHeight = "none", _0x5dc7d6.style.width = "auto", _0x5dc7d6.style.height = "auto"; });
    const _0x555552 = _0x1995db.querySelectorAll("th, td");
    _0x555552.forEach(_0x22c577 => { _0x22c577.style.position = "static", _0x22c577.style.top = "auto", _0x22c577.style.left = "auto"; }), document.body.appendChild(_0x1995db);
    try {
        await new Promise(_0x15f739 => setTimeout(_0x15f739, 100));
        const _0x315769 = await html2canvas(_0x1995db, { "scale": 2, "useCORS": true, "logging": false, "windowWidth": _0x1995db.scrollWidth, "windowHeight": _0x1995db.scrollHeight });
        _0x315769.toBlob(async (_0x327ce5) => {
            try {
                await navigator.clipboard.write([new ClipboardItem({ "image/png": _0x327ce5 })]), showToast("Đã copy toàn bộ hình ảnh vào clipboard thành công!");
            }
            catch (_0x1849c0) {
                console.error("Không thể copy vào clipboard: ", _0x1849c0), showToast("Lỗi khi copy ảnh vào clipboard!", "danger");
            }
        });
    }
    catch (_0x13a2aa) {
        console.error("Lỗi html2canvas:", _0x13a2aa), showToast("Lỗi khi tạo ảnh chụp!", "danger");
    }
    finally {
        document.body.removeChild(_0x1995db);
    }
}
function resetLtHldForm() {
    if (el_editLtHldId)
        el_editLtHldId.value = "";
    if (el_ltHldDate)
        el_ltHldDate.valueAsDate = new Date();
    if (el_ltHldType)
        el_ltHldType.value = "";
    el_btnLtHldSubmit && (el_btnLtHldSubmit.innerText = "+ Thêm", el_btnLtHldSubmit.className = "btn btn-warning w-50 fw-bold py-2 text-dark");
    if (el_btnLtHldReset)
        el_btnLtHldReset.innerText = "Xoá trống";
}
function startEditLtHld(_0x21e671, _0x14f2a4, _0x5dea5d) {
    if ((currentUser.role || "").toLowerCase() !== "admin")
        return;
    el_editLtHldId.value = _0x21e671, el_ltHldDate.value = _0x14f2a4;
    if (el_ltHldType) {
        el_ltHldType.value = _0x5dea5d;
        if (el_ltHldType.value !== _0x5dea5d) {
            const _0x1ee830 = document.createElement("option");
            _0x1ee830.value = _0x5dea5d, _0x1ee830.textContent = _0x5dea5d, el_ltHldType.appendChild(_0x1ee830), el_ltHldType.value = _0x5dea5d;
        }
    }
    el_btnLtHldSubmit.innerText = "Lưu thay đổi", el_btnLtHldSubmit.className = "btn btn-warning w-50 fw-bold py-2 text-dark", el_btnLtHldReset.innerText = "Hủy", el_ltHldAdminCard.scrollIntoView({ "behavior": "smooth" });
}
function renderLtHldData() {
    if (!el_ltHldTbody)
        return;
    const _0x1574ff = (currentUser.role || "").toLowerCase();
    if (_0x1574ff !== "admin" && _0x1574ff !== "user1") {
        el_ltHldTbody.innerHTML = "<tr><td colspan=\"7\" class=\"text-center text-muted py-4\">Bạn không có quyền xem nội dung này.</td></tr>";
        return;
    }
    if (!rawLtHldData || rawLtHldData.length === 0) {
        el_ltHldTbody.innerHTML = "<tr><td colspan=\"7\" class=\"text-center text-muted py-4\">Chưa có dữ liệu danh sách ngày lễ.</td></tr>";
        return;
    }
    let _0x46193d = "";
    rawLtHldData.forEach(_0x25e08a => { const _0x45766d = _0x25e08a.id, _0x345808 = _0x25e08a.date || "", _0x5e4dff = _0x25e08a.type || "", _0x505e1c = escapeHtml(_0x25e08a.createby || "-"), _0x4491a1 = escapeHtml(_0x25e08a.updateby || "-"), _0x5b91f5 = _0x25e08a.created ? new Date(_0x25e08a.created).toLocaleString("vi-VN") : "-", _0x1662fb = _0x25e08a.update ? new Date(_0x25e08a.update).toLocaleString("vi-VN") : "-"; _0x46193d += "\n        <tr>\n            <td><strong>" + formatDateDDMMYYYY(_0x345808) + "</strong></td>\n            <td><span class=\"badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25\">" + escapeHtml(_0x5e4dff) + "</span></td>\n            <td><span class=\"badge bg-secondary\">" + _0x505e1c + "</span></td>\n            <td class=\"small text-muted\">" + escapeHtml(_0x5b91f5) + "</td>\n            <td><span class=\"badge bg-light text-dark border\">" + _0x4491a1 + "</span></td>\n            <td class=\"small text-muted\">" + escapeHtml(_0x1662fb) + "</td>\n            <td class=\"text-center\">\n                <button class=\"btn btn-action btn-outline-warning text-dark me-1\" onclick=\"startEditLtHld('" + escapeHtml(_0x45766d) + "', '" + formatDateYYYYMMDD(_0x345808) + "', '" + escapeHtml(_0x5e4dff) + "')\">Sửa</button>\n                <button class=\"btn btn-action btn-outline-danger\" onclick=\"deleteLtHldData('" + escapeHtml(_0x45766d) + "')\">Xóa</button>\n            </td>\n        </tr>"; }), el_ltHldTbody.innerHTML = _0x46193d;
}
async function loadLtHldData(_0x46ab92 = false) {
    const _0x4a1e49 = (currentUser.role || "").toLowerCase();
    if (_0x46ab92)
        toggleLoading(true, "Đang tải danh sách ngày lễ (lt_hld)...");
    const { data: _0x30c616, error: _0x4cf092 } = await supabase.from("lt_hld").select("*").order("date", { "ascending": false });
    if (_0x46ab92)
        toggleLoading(false);
    if (_0x4cf092) {
        if (_0x46ab92)
            showToast("Lỗi tải bảng lt_hld: " + _0x4cf092.message, "danger");
        return;
    }
    rawLtHldData = _0x30c616 || [];
    (_0x4a1e49 === "admin" || _0x4a1e49 === "user1") && renderLtHldData();
    applyHolidayBackgrounds(), updateLunarAttributes();
    if (_0x46ab92)
        showToast("Đã cập nhật danh sách ngày lễ!", "success");
}
async function saveLtHldData() {
    const _0x1f5600 = (currentUser.role || "").toLowerCase();
    if (_0x1f5600 !== "admin" && _0x1f5600 !== "user1") {
        showToast("Bạn không có quyền thực hiện thao tác này!", "danger");
        return;
    }
    const _0x2b63ef = el_editLtHldId.value, _0x41382f = el_ltHldDate.value, _0x323548 = el_ltHldType.value;
    if (!_0x41382f || !_0x323548) {
        showToast("Vui lòng điền đầy đủ Ngày và chọn Loại ngày lễ!", "danger");
        return;
    }
    const _0x58af9f = _0x2b63ef !== "", _0x359307 = currentUser.username || _0x1f5600, _0x39ab9a = new Date().toISOString();
    toggleLoading(true, "Đang lưu dữ liệu ngày lễ...");
    let _0x54777a;
    _0x58af9f ? _0x54777a = await supabase.from("lt_hld").update({ "date": _0x41382f, "type": _0x323548, "updateby": _0x359307, "update": _0x39ab9a }).eq("id", _0x2b63ef) : _0x54777a = await supabase.from("lt_hld").insert([{ "date": _0x41382f, "type": _0x323548, "createby": _0x359307, "updateby": _0x359307, "created": _0x39ab9a, "update": _0x39ab9a }]), toggleLoading(false), !_0x54777a.error ? (showToast(_0x58af9f ? "Cập nhật ngày lễ thành công!" : "Thêm ngày lễ thành công!", "success"), resetLtHldForm(), loadLtHldData(false)) : showToast("Lỗi hệ thống: " + _0x54777a.error.message, "danger");
}
async function deleteLtHldData(_0x141203) {
    const _0x5a51cd = (currentUser.role || "").toLowerCase();
    if (_0x5a51cd !== "admin" && _0x5a51cd !== "user1") {
        showToast("Bạn không có quyền thực hiện thao tác này!", "danger");
        return;
    }
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi ngày lễ này không?"))
        return;
    toggleLoading(true, "Đang xóa...");
    const { error: _0x319b89 } = await supabase.from("lt_hld").delete().eq("id", _0x141203);
    toggleLoading(false), !_0x319b89 ? (showToast("Đã xóa thành công!", "success"), loadLtHldData(false)) : showToast("Lỗi khi xóa: " + _0x319b89.message, "danger");
}
function applyHolidayBackgrounds() {
    const _0x2ea1b4 = {};
    rawLtHldData && rawLtHldData.length > 0 && rawLtHldData.forEach(_0x50d7ba => {
        const _0x2da775 = normalizeToYYYYMMDD(_0x50d7ba.date);
        if (_0x2da775) {
            let _0x207442 = Object.keys(hld_type).find(_0x3a372f => hld_type[_0x3a372f] === _0x50d7ba.type);
            if (!_0x207442 && !isNaN(_0x50d7ba.type))
                _0x207442 = _0x50d7ba.type;
            _0x207442 && hld_type_color[_0x207442] && (_0x2ea1b4[_0x2da775] = hld_type_color[_0x207442]);
        }
    });
    const _0x2169d8 = document.querySelectorAll("[data-hld]");
    _0x2169d8.forEach(_0x47c720 => {
        const _0xad4889 = _0x47c720.getAttribute("data-hld"), _0x2d425f = normalizeToYYYYMMDD(_0xad4889);
        let _0x449ace = "";
        if (_0x2d425f) {
            if (_0x2ea1b4[_0x2d425f])
                _0x449ace = _0x2ea1b4[_0x2d425f];
            else {
                const _0x4db09e = new Date(_0x2d425f);
                !isNaN(_0x4db09e.getTime()) && _0x4db09e.getDay() === 0 && (_0x449ace = hld_type_color[1] || "#f8d7da");
            }
        }
        _0x47c720.style.backgroundColor = _0x449ace;
        const _0x43a2f0 = _0x47c720.querySelectorAll("td, th, span");
        _0x43a2f0.forEach(_0x46b94a => { _0x449ace ? _0x46b94a.style.backgroundColor = "transparent" : _0x46b94a.style.backgroundColor = ""; });
    });
}
function updateLunarAttributes() {
    return;
    const _0x210329 = document.querySelectorAll("[data-hld]");
    _0x210329.forEach(_0x5dcaaf => {
        const _0x31a6a1 = _0x5dcaaf.getAttribute("data-hld"), _0x4556fd = normalizeToYYYYMMDD(_0x31a6a1);
        if (_0x4556fd) {
            const _0x1fb9c7 = _0x4556fd.split("-"), _0x469038 = parseInt(_0x1fb9c7[0], 10), _0x5cd210 = parseInt(_0x1fb9c7[1], 10), _0x521423 = parseInt(_0x1fb9c7[2], 10), _0x29d255 = convertSolarToLunar(_0x521423, _0x5cd210, _0x469038), _0x1454bf = _0x29d255.day + "/" + _0x29d255.month + (_0x29d255.isLeap ? " (Nhuận)" : "");
            _0x5dcaaf.innerHTML += "\n(" + _0x1454bf + ")";
        }
    });
}
function assignPublicFunction() { window.logout = logout, window.renderGroupedData = renderGroupedData, window.renderGroupedHolidayData = renderGroupedHolidayData, window.startEdit = startEdit, window.deleteData = deleteData, window.startEditHoliday = startEditHoliday, window.deleteHolidayData = deleteHolidayData, window.saveData = saveData, window.saveHolidayData = saveHolidayData, window.resetForm = resetForm, window.resetHolidayForm = resetHolidayForm, window.clearMonthFilter = clearMonthFilter, window.clearHolidayMonthFilter = clearHolidayMonthFilter, window.exportSummaryExcel = exportSummaryExcel, window.loadData = loadData, window.loadHolidayData = loadHolidayData, window.createUser = createUser, window.resetPasswordByAdmin = resetPasswordByAdmin, window.changePassword = changePassword, window.saveUserOption = saveUserOption, window.renderSummaryDashboard = renderSummaryDashboard, window.handleLoginKey = handleLoginKey, window.handleSaveKey = handleSaveKey, window.handleHolidaySaveKey = handleHolidaySaveKey, window.toggleCardFullscreen = toggleCardFullscreen, window.renderSummaryTables = renderSummaryTables, window.renderSummaryData = renderSummaryData, window.clearSummaryFilter = clearSummaryFilter, window.copyActiveSummaryPaneAsImage = copyActiveSummaryPaneAsImage, window.showTitle = showTitle, window.saveLtHldData = saveLtHldData, window.resetLtHldForm = resetLtHldForm, window.startEditLtHld = startEditLtHld, window.deleteLtHldData = deleteLtHldData, window.loadLtHldData = loadLtHldData; }
document.addEventListener("DOMContentLoaded", function () {
    currentUser = getCurrentUser();
    if (!currentUser) {
        saveCurrentUrlAndRedirect("auth.html");
        return;
    }
    assignPublicFunction();
    el_loggedUsername && (el_loggedUsername.innerText = currentUser.username);
    const _0x195527 = { "create": true, "persist": false, "createOnBlur": true, "maxItems": 1 }, _0x44578f = { "create": true, "createFilter": function (_0x1b8b5b) { return /^\d+(\.\d+)?$/.test(_0x1b8b5b.trim()); }, "create": function (_0x1f91ba) { const _0x7ee2d5 = parseFloat(_0x1f91ba); return { "value": _0x7ee2d5.toString(), "text": _0x7ee2d5.toString() }; }, "onType": function (_0xa60f93) { const _0x3e5f3c = _0xa60f93.replace(/[^0-9.]/g, ""); _0x3e5f3c !== _0xa60f93 && this.setTextboxValue(_0x3e5f3c); } };
    tsShift = new TomSelect("#shift", _0x195527), tsHours = new TomSelect("#otHours", _0x44578f), tsTask = new TomSelect("#otTask", _0x195527), showDashboard(), loadInitialData();
});
