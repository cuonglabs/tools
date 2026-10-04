import { supabase } from './supabaseClient.js';
import { getCurrentUser } from './auth.js';
import { saveCurrentUrlAndRedirect, logoutAndRedirect } from './utilities.js';


let rawOTData = [];
let rawHolidayData = [];
let currentUser = null;

// Biến lưu Instance TomSelect
let tsShift, tsHours, tsTask;

const el_filterMonth = document.getElementById("filterMonth");
const el_editId = document.getElementById("editId");
const el_otDate = document.getElementById("otDate");
const el_formTitle = document.getElementById("form-title");
const el_btnSubmit = document.getElementById("btn-submit");
const el_btnReset = document.getElementById("btn-reset");
const el_editHolidayId = document.getElementById("editHolidayId");
const el_holidayDate = document.getElementById("holidayDate");
const el_leaveType = document.getElementById("leaveType");
const el_holidayReason = document.getElementById("holidayReason");
const el_holidayFormTitle = document.getElementById("holiday-form-title");
const el_btnHolidaySubmit = document.getElementById("btn-holiday-submit");
const el_btnHolidayReset = document.getElementById("btn-holiday-reset");
const el_filterHolidayMonth = document.getElementById("filterHolidayMonth");
const el_loadingOverlay = document.getElementById("loadingOverlay");
const el_loadingMessage = document.getElementById("loadingMessage");
const el_liveToast = document.getElementById("liveToast");
const el_toastBody = document.getElementById("toastBody");
const el_username = document.getElementById("username");
const el_password = document.getElementById("password");
const el_summaryMonth = document.getElementById("summaryMonth");
const el_summaryWeeklyHeader = document.getElementById("summaryWeeklyHeader");
const el_summaryWeeklyTbody = document.getElementById("summaryWeeklyTbody");
const el_summaryEmployeeHeader = document.getElementById("summaryEmployeeHeader");
const el_summaryEmployeeTbody = document.getElementById("summaryEmployeeTbody");
const el_summaryOtTbody = document.getElementById("summaryOtTbody");
const el_summaryHolidayTbody = document.getElementById("summaryHolidayTbody");
const el_tableHeader = document.getElementById("tableHeader");
const el_tbody = document.getElementById("tbody");
const el_holidayTableHeader = document.getElementById("holidayTableHeader");
const el_holidayTbody = document.getElementById("holidayTbody");
const el_loadStatus = document.getElementById("loadStatus");
const el_shift = document.getElementById("shift");
const el_otHours = document.getElementById("otHours");
const el_otTask = document.getElementById("otTask");
const el_newUser = document.getElementById("newUser");
const el_newPass = document.getElementById("newPass");
const el_newRole = document.getElementById("newRole");
const el_resetTargetUser = document.getElementById("resetTargetUser");
const el_resetNewPass = document.getElementById("resetNewPass");
const el_oldPass = document.getElementById("oldPass");
const el_newPassUser = document.getElementById("newPassUser");
const el_cfgUrls = document.getElementById("cfgUrls");
const el_quickLinksContainer = document.getElementById("quickLinksContainer");
const el_quickLinksCard = document.getElementById("quickLinksCard");
const el_userInfo = document.getElementById("userInfo");
const el_adminPanel = document.getElementById("adminPanel");
const el_summaryPanel = document.getElementById("summaryPanel");
const el_loggedUsername = document.getElementById('logged-username');

const el_summaryWeeklyTable = document.getElementById("summaryWeeklyTable");
const el_summaryEmployeeTable = document.getElementById("summaryEmployeeTable");
const el_summaryOtTable = document.getElementById("summaryOtTable");
const el_summaryHolidayTable = document.getElementById("summaryHolidayTable");

function getRecentMonthKeys() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const currentKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    return [currentKey, prevKey];
}

function resetForm() {
    el_editId.value = "";
    el_otDate.valueAsDate = new Date();
    
    if (tsShift) tsShift.clear();
    if (tsHours) tsHours.clear();
    if (tsTask) tsTask.clear();

    el_formTitle.innerText = "⏱ Đăng ký Tăng ca";
    el_btnSubmit.innerText = "+ Đăng ký Tăng ca";
    el_btnSubmit.className = "btn btn-success w-100 fw-bold py-2";
    el_btnReset.innerText = "Xoá trống";
}

function resetHolidayForm() {
    el_editHolidayId.value = "";
    el_holidayDate.valueAsDate = new Date();
    el_leaveType.selectedIndex = 0;
    el_holidayReason.value = "";
    el_holidayFormTitle.innerText = "🌴 Đăng ký Nghỉ phép";
    el_btnHolidaySubmit.innerText = "+ Đăng ký Nghỉ phép";
    el_btnHolidaySubmit.className = "btn btn-info text-white w-100 fw-bold py-2";
    el_btnHolidayReset.innerText = "Xoá trống";
}

function clearMonthFilter() {
    el_filterMonth.value = "";
    renderGroupedData();
}

function clearHolidayMonthFilter() {
    el_filterHolidayMonth.value = "";
    renderGroupedHolidayData();
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatOtHours(value) {
    if (value === null || value === undefined || value === "") return "";
    if (typeof value === "number") {
        return Number.isInteger(value) ? String(value) : String(parseFloat(value.toFixed(2)));
    }
    let str = String(value).trim().replace(/h/gi, "").replace(",", ".");
    const num = Number(str);
    if (!Number.isFinite(num)) return escapeHtml(String(value));
    return Number.isInteger(num) ? String(num) : String(parseFloat(num.toFixed(2)));
}

function formatDateDDMMYYYY(dateInput) {
    if (!dateInput) return "N/A";
    let d = new Date(dateInput);
    if (isNaN(d.getTime())) return escapeHtml(dateInput);
    let day = String(d.getDate()).padStart(2, '0');
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateYYYYMMDD(dateInput) {
    if (!dateInput) return "";
    let d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    let day = String(d.getDate()).padStart(2, '0');
    let month = String(d.getMonth() + 1).padStart(2, '0');
    let year = d.getFullYear();
    return `${year}-${month}-${day}`;
}

function logout() { logoutAndRedirect('auth.html'); }

function toggleLoading(show, message = "Đang xử lý...") {
    if (show) {
        el_loadingMessage.innerText = message;
        el_loadingOverlay.style.display = "flex";
    } else {
        el_loadingOverlay.style.display = "none";
    }

    const ActionButtons = [
        "btn-login", "btn-submit", "btn-cancel", "btn-refresh",
        "btn-changepass", "btn-saveconfig", "btn-createuser", "btn-resetpass",
        "btn-holiday-submit", "btn-holiday-reset", "btn-holiday-refresh"
    ];
    ActionButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = show;
    });
}

function showToast(message, type = "success") {
    el_liveToast.classList.remove("bg-success", "bg-danger", "bg-warning", "text-white", "text-dark");
    if (type === "success") {
        el_liveToast.classList.add("bg-success", "text-white");
    } else if (type === "danger") {
        el_liveToast.classList.add("bg-danger", "text-white");
    } else {
        el_liveToast.classList.add("bg-warning", "text-dark");
    }
    el_toastBody.innerText = message;
    const toast = new bootstrap.Toast(el_liveToast, { delay: 3000 });
    toast.show();
}

function handleLoginKey(e) { if (e.key === "Enter") login(); }
function handleSaveKey(e) { if (e.key === "Enter") saveData(); }
function handleHolidaySaveKey(e) { if (e.key === "Enter") saveHolidayData(); }

// ==========================================
// XÁC THỰC & ĐĂNG NHẬP (SUPABASE)
// ==========================================
async function login() {
    const username = el_username.value.trim();
    const password = el_password.value;

    if (!username || !password) {
        showToast("Vui lòng điền đầy đủ thông tin đăng nhập!", "danger");
        return;
    }

    toggleLoading(true, "Đang xác thực tài khoản...");
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("username", username)
            .single();

        toggleLoading(false);

        if (error || !data || data.password !== password) {
            showToast("Tên đăng nhập hoặc mật khẩu không chính xác!", "danger");
            return;
        }

        localStorage.setItem("token", "supatoken_" + data.username);
        localStorage.setItem("role", data.role || "user");
        localStorage.setItem("username", data.username);

        showToast("Đăng nhập thành công!", "success");
        showDashboard();
    } catch (e) {
        toggleLoading(false);
        showToast("Lỗi kết nối cơ sở dữ liệu!", "danger");
    }
}

// ==========================================
// DASHBOARD TỔNG HỢP OT & NGHỈ PHÉP
// ==========================================
function getSummaryMonthKey() {
    if (el_summaryMonth && el_summaryMonth.value) return el_summaryMonth.value;
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function parseSummaryDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

function getSummaryMonthInfo() {
    const key = getSummaryMonthKey();
    const parts = key.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (!year || !month) return null;

    return {
        key,
        year,
        month,
        daysInMonth: new Date(year, month, 0).getDate(),
        firstDay: new Date(year, month - 1, 1)
    };
}

function getSummaryDateKey(value) {
    const d = parseSummaryDate(value);
    if (!d) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getSummaryHours(value) {
    const n = parseFloat(String(value ?? "").replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
}

function formatSummaryHours(value) {
    const n = getSummaryHours(value);
    return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
}

function formatSummaryTotalHours(value) {
    return getSummaryHours(value).toFixed(1);
}

function getSummaryUserName(row) {
    const raw = String(row?.createdby || row?.CreatedBy || "").trim();
    if (!raw) return "N/A";
    return raw.toLocaleLowerCase("vi-VN").split(/\s+/).map(word =>
        word ? word.charAt(0).toLocaleUpperCase("vi-VN") + word.slice(1) : ""
    ).join(" ");
}

function getSummaryOtRecords() {
    const monthKey = getSummaryMonthKey();
    return (rawOTData || []).filter(row => getSummaryDateKey(row.otdate || row.OtDate).slice(0, 7) === monthKey);
}

function getSummaryHolidayRecords() {
    const monthKey = getSummaryMonthKey();
    return (rawHolidayData || []).filter(row => getSummaryDateKey(row.hldate || row.HolidayDate).slice(0, 7) === monthKey);
}

function renderSummaryWeeklyTable(records, info) {
    if (!el_summaryWeeklyHeader || !el_summaryWeeklyTbody || !info) return;

    const weekdayNames = ["THỨ 2", "THỨ 3", "THỨ 4", "THỨ 5", "THỨ 6", "THỨ 7", "CHỦ NHẬT"];
    el_summaryWeeklyHeader.innerHTML = weekdayNames.map(x => `<th>${x}</th>`).join("");

    const byDate = {};

    records.forEach(row => {
        const dateKey = getSummaryDateKey(row.otdate || row.OtDate);
        if (!dateKey) return;
        const name = getSummaryUserName(row);
        const userKey = name.toLocaleLowerCase("vi-VN");
        if (!byDate[dateKey]) byDate[dateKey] = {};
        if (!byDate[dateKey][userKey]) byDate[dateKey][userKey] = { name, type: "ot", hours: 0 };
        byDate[dateKey][userKey].hours += getSummaryHours(row.othours || row.OtHours);
    });

    getSummaryHolidayRecords().forEach(row => {
        const dateKey = getSummaryDateKey(row.hldate || row.HolidayDate);
        if (!dateKey) return;
        const name = getSummaryUserName(row);
        const userKey = name.toLocaleLowerCase("vi-VN");
        if (!byDate[dateKey]) byDate[dateKey] = {};
        byDate[dateKey][userKey] = { name, type: "off" };
    });

    let mondayOffset = info.firstDay.getDay() - 1;
    if (mondayOffset < 0) mondayOffset = 6;
    const totalCells = Math.ceil((mondayOffset + info.daysInMonth) / 7) * 7;
    const weeks = totalCells / 7;
    let html = "";

    for (let week = 0; week < weeks; week++) {
        html += "<tr>";
        for (let col = 0; col < 7; col++) {
            const index = week * 7 + col;
            const day = index - mondayOffset + 1;
            if (day < 1 || day > info.daysInMonth) {
                html += `<td class="summary-empty-day"></td>`;
                continue;
            }

            const dateKey = `${info.year}-${String(info.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const items = Object.values(byDate[dateKey] || {}).sort((a,b) => a.name.localeCompare(b.name, 'vi'));
            let cell = `<span class="weekly-day-number">Ngày ${day}</span>`;

            if (!items.length) {
                cell += `<span class="summary-week-empty">—</span>`;
            } else {
                items.forEach(item => {
                    if (item.type === "off") {
                        cell += `<span class="ot-person-line weekly-off-line"><span class="ot-person-name">${escapeHtml(item.name)}</span>-<span class="ot-person-off">Off</span></span>`;
                    } else {
                        cell += `<span class="ot-person-line"><span class="ot-person-name">${escapeHtml(item.name)}</span>-<span class="ot-person-hours">${escapeHtml(formatSummaryHours(item.hours))}h</span></span>`;
                    }
                });
            }
            html += `<td>${cell}</td>`;
        }
        html += "</tr>";
    }
    el_summaryWeeklyTbody.innerHTML = html;
}

function renderSummaryEmployeeTable(records, info) {
    if (!el_summaryEmployeeHeader || !el_summaryEmployeeTbody || !info) return;

    let headerHtml = `<th>STT</th><th>TÊN</th><th>SỐ LẦN OT</th><th>TỔNG GIỜ OT</th>`;
    for (let day = 1; day <= 31; day++) {
        const d = new Date(info.year, info.month - 1, day);
        const sunday = day <= info.daysInMonth && d.getDay() === 0;
        headerHtml += `<th class="${sunday ? 'sunday-day' : ''}">${day}</th>`;
    }
    el_summaryEmployeeHeader.innerHTML = headerHtml;

    const users = {};
    const ensureUser = name => {
        const key = name.toLocaleLowerCase("vi-VN");
        if (!users[key]) users[key] = { name, count: 0, hours: 0, days: {}, offDays: {} };
        return users[key];
    };

    records.forEach(row => {
        const employee = ensureUser(getSummaryUserName(row));
        const hours = getSummaryHours(row.othours || row.OtHours);
        employee.count += 1;
        employee.hours += hours;
        const d = parseSummaryDate(row.otdate || row.OtDate);
        if (d) employee.days[d.getDate()] = (employee.days[d.getDate()] || 0) + hours;
    });

    getSummaryHolidayRecords().forEach(row => {
        const employee = ensureUser(getSummaryUserName(row));
        const d = parseSummaryDate(row.hldate || row.HolidayDate);
        if (d) employee.offDays[d.getDate()] = true;
    });

    Object.values(users).forEach(employee => {
        Object.keys(employee.offDays).forEach(day => delete employee.days[day]);
    });

    const employees = Object.values(users).sort((a,b) => a.name.localeCompare(b.name, 'vi'));
    if (!employees.length) {
        el_summaryEmployeeTbody.innerHTML = `<tr><td colspan="35" class="text-center text-muted py-4">Tháng này chưa có dữ liệu tăng ca/nghỉ.</td></tr>`;
        return;
    }

    let html = "";
    employees.forEach((employee, index) => {
        html += `<tr><td>${index + 1}</td><td><strong>${escapeHtml(employee.name)}</strong></td><td class="ot-count">${employee.count}</td><td class="ot-total">${escapeHtml(formatSummaryTotalHours(employee.hours))}h</td>`;
        for (let day = 1; day <= 31; day++) {
            const d = new Date(info.year, info.month - 1, day);
            const sunday = day <= info.daysInMonth && d.getDay() === 0;
            const off = day <= info.daysInMonth && !!employee.offDays[day];
            const hasOt = day <= info.daysInMonth && !off && employee.days[day] > 0;
            let cls = `${sunday ? 'sunday-day ' : ''}${off ? 'off-day' : ''}`.trim();
            let content = off ? `<span class="off-mark">Off</span>` : (hasOt ? `${escapeHtml(formatSummaryHours(employee.days[day]))}h` : "");
            html += `<td class="${cls}">${content}</td>`;
        }
        html += `</tr>`;
    });
    el_summaryEmployeeTbody.innerHTML = html;
}

function renderSummaryDashboard() {
    const role = currentUser.role || "user";
    if (role !== "admin" && role !== "user1") return;

    const info = getSummaryMonthInfo();
    if (!info) return;

    if (el_summaryMonth && !el_summaryMonth.value) el_summaryMonth.value = info.key;

    const records = getSummaryOtRecords();
    renderSummaryWeeklyTable(records, info);
    renderSummaryEmployeeTable(records, info);
}

function renderSummaryTables() {
    const myRole = currentUser.role || "user";
    if (myRole !== "admin" && myRole !== "user1") return;

    const validMonths = getRecentMonthKeys();

    const filteredOtData = (rawOTData || []).filter(item => {
        const dt = item.otdate || item.OtDate;
        if (!dt) return false;
        const d = new Date(dt);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return validMonths.includes(key);
    }).sort((a, b) => new Date(b.otdate || b.OtDate) - new Date(a.otdate || a.OtDate));

    if (filteredOtData.length === 0) {
        el_summaryOtTbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Chưa có dữ liệu tăng ca trong tháng này và tháng trước.</td></tr>`;
    } else {
        let html = "";
        filteredOtData.forEach(row => {
            const created = row.created || row.Created;
            const updated = row.updated || row.Updated;
            let createdStr = created ? new Date(created).toLocaleString('vi-VN') : "-";
            let updatedStr = updated ? new Date(updated).toLocaleString('vi-VN') : "-";
            html += `
            <tr>
                <td><span class="badge bg-secondary">${escapeHtml(row.createdby || row.CreatedBy)}</span></td>
                <td><strong>${formatDateDDMMYYYY(row.otdate || row.OtDate)}</strong></td>
                <td>${escapeHtml(row.otshift || row.Shift)}</td>
                <td><span class="text-success fw-bold">${escapeHtml(row.othours || row.OtHours)}h</span></td>
                <td>${escapeHtml(row.ottask || row.OtTask || "-")}</td>
                <td class="small text-muted">${escapeHtml(createdStr)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(row.updatedby || row.UpdatedBy) || "-"}</span></td>
                <td class="small text-muted">${escapeHtml(updatedStr)}</td>
            </tr>`;
        });
        el_summaryOtTbody.innerHTML = html;
    }

    const filteredHolidayData = (rawHolidayData || []).filter(item => {
        const dt = item.hldate || item.HolidayDate;
        if (!dt) return false;
        const d = new Date(dt);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return validMonths.includes(key);
    }).sort((a, b) => new Date(b.hldate || b.HolidayDate) - new Date(a.hldate || a.HolidayDate));

    if (filteredHolidayData.length === 0) {
        el_summaryHolidayTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Chưa có dữ liệu nghỉ phép trong tháng này và tháng trước.</td></tr>`;
    } else {
        let html = "";
        filteredHolidayData.forEach(row => {
            const created = row.created || row.Created;
            const updated = row.updated || row.Updated;
            let createdStr = created ? new Date(created).toLocaleString('vi-VN') : "-";
            let updatedStr = updated ? new Date(updated).toLocaleString('vi-VN') : "-";
            html += `
            <tr>
                <td><span class="badge bg-secondary">${escapeHtml(row.createdby || row.CreatedBy)}</span></td>
                <td><strong>${formatDateDDMMYYYY(row.hldate || row.HolidayDate)}</strong></td>
                <td><span class="badge bg-info text-dark">${escapeHtml(row.hltype || row.LeaveType)}</span></td>
                <td>${escapeHtml(row.hlreason || row.Reason || "-")}</td>
                <td class="small text-muted">${escapeHtml(createdStr)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(row.updatedby || row.UpdatedBy) || "-"}</span></td>
                <td class="small text-muted">${escapeHtml(updatedStr)}</td>
            </tr>`;
        });
        el_summaryHolidayTbody.innerHTML = html;
    }

    renderSummaryDashboard();
}

// Tải xuống File Excel lấy dữ liệu trực tiếp từ các table hiển thị trên giao diện
function exportSummaryExcel() {
    const wb = XLSX.utils.book_new();

// 1. Sheet "Tăng Ca" từ el_summaryOtTable
    const otRows = [];
    let otHeaders = [];
    if (el_summaryOtTable) {
        otHeaders = Array.from(el_summaryOtTable.querySelectorAll("thead th")).map(th => th.innerText.trim());

        el_summaryOtTable.querySelectorAll("tbody tr").forEach(tr => {
            const tds = tr.querySelectorAll("td");
            if (tds.length >= otHeaders.length) {
                const rowObj = {};
                otHeaders.forEach((h, c) => {
                    let val = tds[c].innerText.trim();
                    if (h.toLowerCase().includes("số giờ")) {
                        val = val.replace('h', '');
                    }
                    rowObj[h] = (val === '-' || val === '—') ? '' : val;
                });
                otRows.push(rowObj);
            }
        });
    }
    const otSheet = XLSX.utils.json_to_sheet(
        otRows.length > 0 ? otRows : [{ "Thông báo": "Không có dữ liệu" }],
        { header: otHeaders, skipHeader: false }
    );
    XLSX.utils.book_append_sheet(wb, otSheet, "Tăng Ca");


    // 2. Sheet "Chi Tiết" từ el_summaryHolidayTable (Thay thế tên biến bảng tương ứng của bạn nếu có, ví dụ el_summaryDetailTable)
    // Nếu bạn có bảng Chi Tiết tương tự, áp dụng khuôn mẫu sau:
    const holidayRows = [];
    let holidayHeaders = [];
    if (el_summaryHolidayTable) {
        holidayHeaders = Array.from(el_summaryHolidayTable.querySelectorAll("thead th")).map(th => th.innerText.trim());

        el_summaryHolidayTable.querySelectorAll("tbody tr").forEach(tr => {
            const tds = tr.querySelectorAll("td");
            if (tds.length >= holidayHeaders.length) {
                const rowObj = {};
                holidayHeaders.forEach((h, c) => {
                    let val = tds[c].innerText.trim();
                    rowObj[h] = (val === '-' || val === '—') ? '' : val;
                });
                holidayRows.push(rowObj);
            }
        });
    }
    const detailSheet = XLSX.utils.json_to_sheet(
        holidayRows.length > 0 ? holidayRows : [{ "Thông báo": "Không có dữ liệu" }],
        { header: holidayHeaders, skipHeader: false }
    );
    XLSX.utils.book_append_sheet(wb, detailSheet, "Chi Tiết");


    // 3. Sheet "OT Theo Tuần" - Tách mỗi nhân viên thành một dòng riêng biệt
    const weeklyRows = [];
    let weeklyHeaders = [];
    if (el_summaryWeeklyTable) {
        weeklyHeaders = Array.from(el_summaryWeeklyTable.querySelectorAll("thead th")).map(th => th.innerText.trim());

        el_summaryWeeklyTable.querySelectorAll("tbody tr").forEach(tr => {
            const tds = tr.querySelectorAll("td");
            if (tds.length >= weeklyHeaders.length) {
                const cellDataList = [];
                let maxLines = 1; // Mỗi tuần ít nhất có 1 dòng chứa tên Ngày

                // Bước 1: Quét và thu thập dữ liệu của từng ô trong tuần
                weeklyHeaders.forEach((h, c) => {
                    const td = tds[c];
                    let dayText = "";
                    let personLines = [];
                    let rawOther = "";

                    if (td) {
                        const dayNumSpan = td.querySelector(".weekly-day-number");
                        if (dayNumSpan) {
                            dayText = dayNumSpan.innerText.trim();
                            td.querySelectorAll(".ot-person-line").forEach(lineEl => {
                                personLines.push(lineEl.innerText.trim().replace(/\s+/g, ' '));
                            });
                            if (personLines.length === 0) {
                                rawOther = td.innerText.replace(dayText, "").trim();
                            }
                        } else {
                            rawOther = td.innerText.trim();
                        }
                    }

                    // Tính số dòng cần thiết cho cột này (1 dòng cho Ngày + số dòng nhân viên)
                    const totalLinesForCell = dayText ? (1 + Math.max(1, personLines.length)) : 1;
                    if (totalLinesForCell > maxLines) {
                        maxLines = totalLinesForCell;
                    }

                    cellDataList.push({ dayText, personLines, rawOther });
                });

                // Bước 2: Trải phẳng (flatten) thành nhiều hàng trong Excel cho tuần này
                for (let l = 0; l < maxLines; l++) {
                    const rowObj = {};
                    weeklyHeaders.forEach((h, c) => {
                        const cell = cellDataList[c];
                        let val = "";

                        if (l === 0) {
                            // Dòng đầu tiên của tuần hiển thị Ngày (Ví dụ: "Ngày 1")
                            val = cell.dayText || cell.rawOther;
                        } else {
                            // Các dòng tiếp theo hiển thị từng nhân viên tương ứng
                            const personIndex = l - 1;
                            if (cell.personLines && personIndex < cell.personLines.length) {
                                val = cell.personLines[personIndex];
                            }
                        }

                        if (val === '-' || val === '—') val = '';
                        rowObj[h] = val;
                    });

                    // Chỉ thêm vào danh sách nếu hàng đó có ít nhất một ô có dữ liệu
                    const hasData = Object.values(rowObj).some(val => val !== "");
                    if (hasData) {
                        weeklyRows.push(rowObj);
                    }
                }
            }
        });
    }

    const weeklySheet = XLSX.utils.json_to_sheet(
        weeklyRows.length > 0 ? weeklyRows : [{ "Thông báo": "Không có dữ liệu" }],
        { header: weeklyHeaders, skipHeader: false }
    );
    XLSX.utils.book_append_sheet(wb, weeklySheet, "OT Theo Tuần");

    // 4. Sheet "Tổng Hợp Nhân Viên" từ el_summaryEmployeeTable
    const employeeRows = [];
    let employeeHeaders = [];
    
    if (el_summaryEmployeeTable) {
        employeeHeaders = Array.from(el_summaryEmployeeTable.querySelectorAll("thead th")).map(th => th.innerText.trim());

        el_summaryEmployeeTable.querySelectorAll("tbody tr").forEach(tr => {
            const tds = tr.querySelectorAll("td");
            if (tds.length >= employeeHeaders.length) {
                const rowObj = {};
                employeeHeaders.forEach((h, c) => {
                    let val = tds[c].innerText.trim().replace('h', '');
                    rowObj[h] = (val === '-' || val === '—') ? '' : val;
                });
                employeeRows.push(rowObj);
            }
        });
    }
    
    const employeeSheet = XLSX.utils.json_to_sheet(
        employeeRows.length > 0 ? employeeRows : [{ "Thông báo": "Không có dữ liệu" }], 
        { header: employeeHeaders, skipHeader: false }
    );
    XLSX.utils.book_append_sheet(wb, employeeSheet, "Tổng Hợp Nhân Viên");

    // Xuất file Excel
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Bao_Cao_${today}.xlsx`);
}

function renderGroupedData() {
    const currentUsername = currentUser.username || "";
    const myRole = currentUser.role || "user";
    const selectedMonth = el_filterMonth.value;

    el_tableHeader.innerHTML = `
    <th>Ngày OT</th>
    <th>Ca làm việc</th>
    <th>Số giờ</th>
    <th>Công việc</th>
    <th>Người tạo</th>
    <th>Thời gian tạo</th>
    <th>Người sửa</th>
    <th>Thời gian sửa</th>
    <th class="text-center" style="width: 110px;">Thao tác</th>`;

    el_tbody.innerHTML = "";

    let displayData = rawOTData;
    if (myRole !== "admin") {
        displayData = rawOTData.filter(item => String(item.createdby || item.CreatedBy).toLowerCase() === currentUsername.toLowerCase());
    }

    if (displayData.length === 0) {
        el_tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Chưa có dữ liệu tăng ca nào.</td></tr>`;
        return;
    }

    const grouped = {};
    displayData.forEach(row => {
        const dt = row.otdate || row.OtDate;
        if (!dt) return;
        const d = new Date(dt);
        if (isNaN(d.getTime())) return;

        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (selectedMonth && monthKey !== selectedMonth) return;

        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(row);
    });

    const monthKeys = Object.keys(grouped).sort().reverse();

    if (monthKeys.length === 0) {
        el_tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Không tìm thấy bản ghi nào trong tháng đã chọn.</td></tr>`;
        return;
    }

    let htmlContentBuffer = "";

    monthKeys.forEach(monthKey => {
        const records = grouped[monthKey];
        records.sort((a, b) => new Date(b.otdate || b.OtDate) - new Date(a.otdate || a.OtDate));

        const totalHours = records.reduce((sum, item) => sum + (parseFloat(item.othours || item.OtHours) || 0), 0);
        const totalCount = records.length;
        const [year, month] = monthKey.split("-");
        const formattedMonthLabel = `Tháng ${month}/${year}`;

        htmlContentBuffer += `
    <tr class="table-primary border-0">
        <td colspan="9" class="py-2 bg-primary bg-opacity-10 border-0">
            <div class="d-flex gap-2 align-items-center month-group-header">
                <span class="fw-bold text-primary fs-6">📅 ${formattedMonthLabel}</span>
                <div class="d-flex gap-2">
                    <span class="badge bg-primary text-white d-inline-block text-center" style="min-width: 110px;">Tổng số lần: ${totalCount}</span>
                    <span class="badge bg-success text-white d-inline-block text-center" style="min-width: 125px;">Tổng số giờ: ${totalHours}h</span>
                </div>
            </div>
        </td>
    </tr>`;

        records.forEach(row => {
            const created = row.created || row.Created;
            const updated = row.updated || row.Updated;
            let createdStr = created ? new Date(created).toLocaleString('vi-VN') : "-";
            let updatedStr = updated ? new Date(updated).toLocaleString('vi-VN') : "-";

            const cleanOtDate = formatDateDDMMYYYY(row.otdate || row.OtDate);
            const cleanShift = escapeHtml(row.otshift || row.Shift);
            const cleanOtHours = formatOtHours(row.othours || row.OtHours);
            const cleanOtTask = escapeHtml(row.ottask || row.OtTask || "");
            const cleanCreatedBy = escapeHtml(row.createdby || row.CreatedBy);
            const cleanUpdatedBy = escapeHtml(row.updatedby || row.UpdatedBy);

            const isOwnerOrAdmin = (myRole === "admin" || cleanCreatedBy.toLowerCase() === currentUsername.toLowerCase());

            htmlContentBuffer += `
    <tr>
        <td><strong class="text-dark">${cleanOtDate}</strong></td>
        <td><span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">${cleanShift}</span></td>
        <td><span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">${cleanOtHours}h</span></td>
        <td><span>${cleanOtTask || "-"}</span></td>
        <td><span class="badge bg-light text-dark border">${cleanCreatedBy || "N/A"}</span></td>
        <td class="small text-muted">${escapeHtml(createdStr)}</td>
        <td><span class="badge bg-light text-dark border">${cleanUpdatedBy || "-"}</span></td>
        <td class="small text-muted">${escapeHtml(updatedStr)}</td>
        <td class="text-center">`;

            if (isOwnerOrAdmin) {
                const rawOtDateForInput = formatDateYYYYMMDD(row.otdate || row.OtDate);
                const rowId = row.id || row.ID;
                htmlContentBuffer += `
            <button class="btn btn-action btn-outline-warning text-dark me-1" onclick="startEdit('${escapeHtml(rowId)}', '${rawOtDateForInput}', '${cleanShift}', '${cleanOtHours}', '${cleanOtTask}')">Sửa</button>
            <button class="btn btn-action btn-outline-danger" onclick="deleteData('${escapeHtml(rowId)}')">Xóa</button>`;
            } else {
                htmlContentBuffer += `<span class="text-muted small">N/A</span>`;
            }

            htmlContentBuffer += `</td></tr>`;
        });
    });

    el_tbody.innerHTML = htmlContentBuffer;
}

function renderGroupedHolidayData() {
    const currentUsername = currentUser.username || "";
    const myRole = currentUser.role || "user";
    const selectedMonth = el_filterHolidayMonth.value;

    el_holidayTableHeader.innerHTML = `
    <th>Ngày nghỉ</th>
    <th>Loại nghỉ phép</th>
    <th>Lý do nghỉ</th>
    <th>Người tạo</th>
    <th>Thời gian tạo</th>
    <th>Người sửa</th>
    <th>Thời gian sửa</th>
    <th class="text-center" style="width: 110px;">Thao tác</th>`;

    el_holidayTbody.innerHTML = "";

    let displayData = rawHolidayData;
    if (myRole !== "admin") {
        displayData = rawHolidayData.filter(item => String(item.createdby || item.CreatedBy).toLowerCase() === currentUsername.toLowerCase());
    }

    if (displayData.length === 0) {
        el_holidayTbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Chưa có ngày nghỉ phép nào được đăng ký.</td></tr>`;
        return;
    }

    const grouped = {};
    displayData.forEach(row => {
        const dt = row.hldate || row.HolidayDate;
        if (!dt) return;
        const d = new Date(dt);
        if (isNaN(d.getTime())) return;

        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (selectedMonth && monthKey !== selectedMonth) return;

        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(row);
    });

    const monthKeys = Object.keys(grouped).sort().reverse();

    if (monthKeys.length === 0) {
        el_holidayTbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Không tìm thấy ngày nghỉ nào trong tháng đã chọn.</td></tr>`;
        return;
    }

    let htmlContentBuffer = "";

    monthKeys.forEach(monthKey => {
        const records = grouped[monthKey];
        records.sort((a, b) => new Date(b.hldate || b.HolidayDate) - new Date(a.hldate || a.HolidayDate));

        const totalCount = records.length;
        const [year, month] = monthKey.split("-");
        const formattedMonthLabel = `Tháng ${month}/${year}`;

        htmlContentBuffer += `
    <tr class="table-info border-0">
        <td colspan="8" class="py-2 bg-info bg-opacity-10 border-0">
            <div class="d-flex gap-2 align-items-center month-group-header">
                <span class="fw-bold text-info-emphasis fs-6">🌴 ${formattedMonthLabel}</span>
                <div>
                    <span class="badge bg-info text-white d-inline-block text-center">Tổng ngày nghỉ: ${totalCount} ngày</span>
                </div>
            </div>
        </td>
    </tr>`;

        records.forEach(row => {
            const created = row.created || row.Created;
            const updated = row.updated || row.Updated;
            let createdStr = created ? new Date(created).toLocaleString('vi-VN') : "-";
            let updatedStr = updated ? new Date(updated).toLocaleString('vi-VN') : "-";

            const cleanHolidayDate = formatDateDDMMYYYY(row.hldate || row.HolidayDate);
            const cleanLeaveType = escapeHtml(row.hltype || row.LeaveType);
            const cleanReason = escapeHtml(row.hlreason || row.Reason || "");
            const cleanCreatedBy = escapeHtml(row.createdby || row.CreatedBy);
            const cleanUpdatedBy = escapeHtml(row.updatedby || row.UpdatedBy);

            const isOwnerOrAdmin = (myRole === "admin" || cleanCreatedBy.toLowerCase() === currentUsername.toLowerCase());

            htmlContentBuffer += `
    <tr>
        <td><strong class="text-dark">${cleanHolidayDate}</strong></td>
        <td><span class="badge bg-info bg-opacity-10 text-info-emphasis border border-info border-opacity-25">${cleanLeaveType}</span></td>
        <td><span>${cleanReason || "-"}</span></td>
        <td><span class="badge bg-light text-dark border">${cleanCreatedBy || "N/A"}</span></td>
        <td class="small text-muted">${escapeHtml(createdStr)}</td>
        <td><span class="badge bg-light text-dark border">${cleanUpdatedBy || "-"}</span></td>
        <td class="small text-muted">${escapeHtml(updatedStr)}</td>
        <td class="text-center">`;

            if (isOwnerOrAdmin) {
                const rawHolidayDateForInput = formatDateYYYYMMDD(row.hldate || row.HolidayDate);
                const rowId = row.id || row.ID;
                htmlContentBuffer += `
            <button class="btn btn-action btn-outline-warning text-dark me-1" onclick="startEditHoliday('${escapeHtml(rowId)}', '${rawHolidayDateForInput}', '${cleanLeaveType}', '${cleanReason}')">Sửa</button>
            <button class="btn btn-action btn-outline-danger" onclick="deleteHolidayData('${escapeHtml(rowId)}')">Xóa</button>`;
            } else {
                htmlContentBuffer += `<span class="text-muted small">N/A</span>`;
            }

            htmlContentBuffer += `</td></tr>`;
        });
    });

    el_holidayTbody.innerHTML = htmlContentBuffer;
}

async function loadData(isManualClick = false) {
    el_loadStatus.innerText = "Đang đồng bộ dữ liệu...";
    if (isManualClick) toggleLoading(true, "Đang tải danh sách tăng ca...");

    let query = supabase.from("data").select("*").order("otdate", { ascending: false });
    const myRole = currentUser.role || "user";
    if (myRole !== "admin" && myRole !== "user1") {
        query = query.eq("createdby", currentUser.username);
    }

    const { data, error } = await query;
    if (isManualClick) toggleLoading(false);

    if (error) {
        showToast("Lỗi tải dữ liệu tăng ca: " + error.message, "danger");
        return;
    }

    rawOTData = data || [];
    renderGroupedData();
    renderSummaryTables();
    updateTimestamp();
    if (isManualClick) showToast("Đã cập nhật dữ liệu tăng ca mới nhất!", "success");
}

async function loadHolidayData(isManualClick = false) {
    if (isManualClick) toggleLoading(true, "Đang tải danh sách nghỉ phép...");

    let query = supabase.from("holidays").select("*").order("hldate", { ascending: false });
    const myRole = currentUser.role || "user";
    if (myRole !== "admin" && myRole !== "user1") {
        query = query.eq("createdby", currentUser.username);
    }

    const { data, error } = await query;
    if (isManualClick) toggleLoading(false);

    if (error) {
        showToast("Lỗi tải danh sách ngày nghỉ: " + error.message, "danger");
        return;
    }

    rawHolidayData = data || [];
    renderGroupedHolidayData();
    renderSummaryTables();
    if (isManualClick) showToast("Đã cập nhật dữ liệu ngày nghỉ mới nhất!", "success");
}

async function loadInitialData() {
    toggleLoading(true, "Đang tải dữ liệu hệ thống...");
    el_loadStatus.innerText = "Đang đồng bộ dữ liệu...";

    const myRole = currentUser.role || "user";
    
    // Xây dựng câu lệnh query linh hoạt theo quyền hạn
    let otQuery = supabase.from("data").select("*").order("otdate", { ascending: false });
    let holidayQuery = supabase.from("holidays").select("*").order("hldate", { ascending: false });

    // Nếu không phải admin hoặc user1, chỉ lấy dữ liệu của chính user đó
    if (myRole !== "admin" && myRole !== "user1") {
        otQuery = otQuery.eq("createdby", currentUser.username);
        holidayQuery = holidayQuery.eq("createdby", currentUser.username);
    }

    const [otRes, holidayRes] = await Promise.all([otQuery, holidayQuery]);

    toggleLoading(false);

    if (otRes.error || holidayRes.error) {
        showToast("Lỗi tải dữ liệu từ Supabase!", "danger");
        return;
    }

    rawOTData = otRes.data || [];
    rawHolidayData = holidayRes.data || [];

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthStr = `${yyyy}-${mm}`;

    if (!el_filterMonth.value) {
        el_filterMonth.value = currentMonthStr;
    }
    if (!el_filterHolidayMonth.value) {
        el_filterHolidayMonth.value = currentMonthStr;
    }
    if (!el_summaryMonth.value) {
        el_summaryMonth.value = currentMonthStr;
    }

    renderGroupedData();
    renderGroupedHolidayData();
    renderSummaryTables();
    applyUserOptionToUI(currentUser.option);
    updateTimestamp();
}

function updateTimestamp() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    el_loadStatus.innerText = `Cập nhật gần nhất: ${hh}:${mm} - ${dd}/${MM}/${yyyy}`;
}

function setTomSelectValue(tsInstance, value) {
    if (!tsInstance) return;
    let cleanValue = "";
    if (value !== null && value !== undefined && value !== "") {
        cleanValue = String(value).trim();
    }
    if (!cleanValue) {
        tsInstance.clear();
        return;
    }
    if (tsInstance === tsHours) {
        cleanValue = formatOtHours(cleanValue);
    }
    if (!cleanValue) {
        tsInstance.clear();
        return;
    }
    if (!tsInstance.options[cleanValue]) {
        tsInstance.addOption({ value: cleanValue, text: cleanValue });
    }
    tsInstance.setValue(cleanValue);
}

function startEdit(id, otDate, shift, otHours, otTask) {
    el_editId.value = id;
    el_otDate.value = otDate;
    
    if (tsShift) tsShift.setValue(shift);
    if (tsHours) setTomSelectValue(tsHours, otHours);
    if (tsTask) setTomSelectValue(tsTask, otTask);

    el_formTitle.innerText = "✏️ Chỉnh sửa Tăng ca";
    el_btnSubmit.innerText = "Lưu thay đổi";
    el_btnSubmit.className = "btn btn-warning w-100 fw-bold py-2 text-dark";
    el_btnReset.innerText = "Hủy thay đổi";
    el_formTitle.scrollIntoView({ behavior: 'smooth' });
}

function startEditHoliday(id, holidayDate, leaveType, reason) {
    el_editHolidayId.value = id;
    el_holidayDate.value = holidayDate;

    for (let i = 0; i < el_leaveType.options.length; i++) {
        if (el_leaveType.options[i].value === leaveType) {
            el_leaveType.selectedIndex = i;
            break;
        }
    }

    el_holidayReason.value = reason || "";
    el_holidayFormTitle.innerText = "✏ Chỉnh sửa Nghỉ phép";

    el_btnHolidaySubmit.innerText = "Lưu thay đổi";
    el_btnHolidaySubmit.className = "btn btn-warning w-100 fw-bold py-2 text-dark";
    el_btnHolidayReset.innerText = "Hủy thay đổi";
    el_holidayFormTitle.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// THÊM / SỬA / XÓA DỮ LIỆU (SUPABASE)
// ==========================================
async function saveData() {
    const id = el_editId.value;
    const otDate = el_otDate.value;
    const shift = el_shift.value.trim();
    const otHours = formatOtHours(el_otHours.value);
    const otTask = el_otTask.value.trim();

    if (!otDate || !shift || !otHours || !otTask) {
        showToast("Vui lòng điền đủ: Ngày, Ca làm việc, Số giờ OT và Công việc !", "danger");
        return;
    }

    const otHoursNumber = Number(otHours);
    if (!Number.isFinite(otHoursNumber) || otHoursNumber <= 0) {
        showToast("Số giờ OT không hợp lệ!", "danger");
        return;
    }

    const isEdit = id !== "";
    const username = currentUser.username || "";
    const now = new Date().toISOString();

    toggleLoading(true, "Đang lưu dữ liệu tăng ca...");

    let res;
    if (isEdit) {
        res = await supabase.from("data").update({
            otdate: otDate,
            otshift: shift,
            othours: otHoursNumber,
            ottask: otTask,
            updatedby: username,
            updated: now
        }).eq("id", id);
    } else {
        res = await supabase.from("data").insert([{
            otdate: otDate,
            otshift: shift,
            othours: otHoursNumber,
            ottask: otTask,
            createdby: username,
            created: now,
            updatedby: username,
            updated: now
        }]);
    }

    toggleLoading(false);

    if (!res.error) {
        showToast(isEdit ? "Cập nhật dữ liệu thành công!" : "Đăng ký Tăng ca thành công!", "success");
        resetForm();
        loadData(false);
    } else {
        showToast("Lỗi hệ thống: " + res.error.message, "danger");
    }
}

async function saveHolidayData() {
    const id = el_editHolidayId.value;
    const holidayDate = el_holidayDate.value;
    const leaveType = el_leaveType.value;
    const reason = el_holidayReason.value.trim();

    if (!holidayDate || !leaveType || !reason) {
        showToast("Vui lòng điền đủ: Ngày nghỉ, Loại nghỉ phép và Lý do nghỉ!", "danger");
        return;
    }

    const isEdit = id !== "";
    const username = currentUser.username || "";
    const now = new Date().toISOString();

    toggleLoading(true, "Đang lưu thông tin nghỉ phép...");

    let res;
    if (isEdit) {
        res = await supabase.from("holidays").update({
            hldate: holidayDate,
            hltype: leaveType,
            hlreason: reason,
            updatedby: username,
            updated: now
        }).eq("id", id);
    } else {
        res = await supabase.from("holidays").insert([{
            hldate: holidayDate,
            hltype: leaveType,
            hlreason: reason,
            createdby: username,
            updatedby: username,
            created: now,
            updated: now
        }]);
    }

    toggleLoading(false);

    if (!res.error) {
        showToast(isEdit ? "Cập nhật thông tin nghỉ phép thành công!" : "Đăng ký Nghỉ phép thành công!", "success");
        resetHolidayForm();
        loadHolidayData(false);
    } else {
        showToast("Lỗi hệ thống: " + res.error.message, "danger");
    }
}

async function deleteData(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn lần tăng ca này?")) return;

    toggleLoading(true, "Đang xóa...");
    const { error } = await supabase.from("data").delete().eq("id", id);
    toggleLoading(false);

    if (!error) {
        showToast("Đã xóa thành công!", "success");
        loadData(false);
    } else {
        showToast("Lỗi khi xóa: " + error.message, "danger");
    }
}

async function deleteHolidayData(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa ngày nghỉ này?")) return;

    toggleLoading(true, "Đang xóa...");
    const { error } = await supabase.from("holidays").delete().eq("id", id);
    toggleLoading(false);

    if (!error) {
        showToast("Đã xóa ngày nghỉ thành công!", "success");
        loadHolidayData(false);
    } else {
        showToast("Lỗi khi xóa: " + error.message, "danger");
    }
}

// ==========================================
// QUẢN TRỊ TÀI KHOẢN & CÀI ĐẶT
// ==========================================
async function createUser() {
    const role = el_newRole.value;
    const username = el_newUser.value.trim();
    const password = el_newPass.value;

    if (!username || !password) {
        showToast("Vui lòng không để trống tên đăng nhập và mật khẩu!", "danger");
        return;
    }

    toggleLoading(true, "Đang khởi tạo tài khoản...");
    const { error } = await supabase.from("users").insert([{ username, password, role, option: {} }]);
    toggleLoading(false);

    if (!error) {
        showToast("Khởi tạo tài khoản thành công!", "success");
        el_newUser.value = "";
        el_newPass.value = "";
    } else {
        showToast("Lỗi: " + error.message, "danger");
    }
}

async function resetPasswordByAdmin() {
    const targetUsername = el_resetTargetUser.value.trim();
    const newPassword = el_resetNewPass.value;

    if (!targetUsername || !newPassword) {
        showToast("Vui lòng nhập đầy đủ Tên tài khoản và Mật khẩu mới!", "danger");
        return;
    }

    if (!confirm(`Bạn chắc chắn muốn đặt lại mật khẩu cho tài khoản [${targetUsername}]?`)) return;

    toggleLoading(true, "Đang cấp lại mật khẩu...");
    const { error } = await supabase.from("users").update({ password: newPassword }).eq("username", targetUsername);
    toggleLoading(false);

    if (!error) {
        showToast(`Cấp lại mật khẩu cho tài khoản ${targetUsername} thành công!`, "success");
        el_resetTargetUser.value = "";
        el_resetNewPass.value = "";
    } else {
        showToast("Lỗi: " + error.message, "danger");
    }
}

async function changePassword() {
    const oldPassword = el_oldPass.value;
    const newPassword = el_newPassUser.value;
    const username = currentUser.username || "";

    if (!oldPassword || !newPassword) {
        showToast("Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới!", "danger");
        return;
    }

    toggleLoading(true, "Đang đổi mật khẩu...");
    const { data, error: fetchErr } = await supabase.from("users").select("password").eq("username", username).single();

    if (fetchErr || data.password !== oldPassword) {
        toggleLoading(false);
        showToast("Mật khẩu hiện tại không chính xác!", "danger");
        return;
    }

    const { error: updateErr } = await supabase.from("users").update({ password: newPassword }).eq("username", username);
    toggleLoading(false);

    if (!updateErr) {
        showToast("Đổi mật khẩu thành công! Đang đăng xuất...", "success");
        setTimeout(logout, 2000);
    } else {
        showToast("Lỗi: " + updateErr.message, "danger");
    }
}

async function saveUserOption(isSilent = false) {
    const rawUrls = el_cfgUrls.value.split("\n");
    const urlsArray = [];
    rawUrls.forEach(line => {
        if (line.includes("|")) {
            const parts = line.split("|");
            urlsArray.push({ title: parts[0].trim(), url: parts[1].trim() });
        }
    });

    const newOption = { urls: urlsArray };
    const username = currentUser.username || "";

    if (!isSilent) toggleLoading(true, "Đang lưu cấu hình...");
    const { error } = await supabase.from("users").update({ option: newOption }).eq("username", username);
    if (!isSilent) toggleLoading(false);

    if (!error) {
        if (!isSilent) showToast("Lưu cấu hình thành công!", "success");
    } else {
        if (!isSilent) showToast("Không thể lưu cấu hình: " + error.message, "danger");
    }
}

function applyUserOptionToUI(option) {
    const urls = option.urls || [];

    if (el_quickLinksContainer && el_quickLinksCard) {
        el_quickLinksContainer.innerHTML = "";
        if (urls.length > 0) {
            el_quickLinksCard.style.display = "block";
            let rawTextareaValue = "";
            urls.forEach(item => {
                rawTextareaValue += `${item.title}|${item.url}\n`;
                const a = document.createElement("a");
                a.href = item.url; a.target = "_blank";
                a.className = "btn btn-xs btn-outline-dark pt-0 pb-0 ps-2 pe-2 small bg-white border shadow-sm";
                a.style.fontSize = "12px"; a.innerText = item.title;
                el_quickLinksContainer.appendChild(a);
            });
            el_cfgUrls.value = rawTextareaValue.trim();
        } else {
            el_quickLinksCard.style.display = "none";
            el_cfgUrls.value = "";
        }
    }
}

function showDashboard() {
    el_otDate.valueAsDate = new Date();
    el_holidayDate.valueAsDate = new Date();

    const username = currentUser.username || "";
    const role = currentUser.role || "";
    
    const capitalizedUser = username ? username.charAt(0).toUpperCase() + username.slice(1) : "";

    let greetingString = `<span>Xin chào, </span><strong>${escapeHtml(capitalizedUser)}</strong><br>
    <span class="badge bg-info bg-opacity-10 text-info-emphasis border border-info border-opacity-25">(${role.toUpperCase()})</span>`;
    el_userInfo.innerHTML = greetingString;

    if (role === "admin") {
        el_adminPanel.style.display = "block";
    } else {
        el_adminPanel.style.display = "none";
    }

    if (role === "admin" || role === "user1") {
        el_summaryPanel.style.display = "block";
    } else {
        el_summaryPanel.style.display = "none";
    }
}

function assignPublicFunction() {
    // Gắn các hàm được gọi trực tiếp từ HTML vào window để module có thể chia sẻ ra ngoài
    window.logout = logout;
    window.renderGroupedData = renderGroupedData;
    window.renderGroupedHolidayData = renderGroupedHolidayData;
    window.startEdit = startEdit;
    window.deleteData = deleteData;
    window.startEditHoliday = startEditHoliday;
    window.deleteHolidayData = deleteHolidayData;
    window.saveData = saveData;
    window.saveHolidayData = saveHolidayData;
    window.resetForm = resetForm;
    window.resetHolidayForm = resetHolidayForm;
    window.clearMonthFilter = clearMonthFilter;
    window.clearHolidayMonthFilter = clearHolidayMonthFilter;
    window.exportSummaryExcel = exportSummaryExcel;
    window.loadData = loadData;
    window.loadHolidayData = loadHolidayData;
    window.createUser = createUser;
    window.resetPasswordByAdmin = resetPasswordByAdmin;
    window.changePassword = changePassword;
    window.saveUserOption = saveUserOption;
    window.renderSummaryDashboard = renderSummaryDashboard;
    window.handleLoginKey = handleLoginKey;
    window.handleSaveKey = handleSaveKey;
    window.handleHolidaySaveKey = handleHolidaySaveKey;
}

document.addEventListener("DOMContentLoaded", function () {
    currentUser = getCurrentUser();
    if (!currentUser) {
        saveCurrentUrlAndRedirect('auth.html');
        return;
    }

    assignPublicFunction()

    if (el_loggedUsername) {
        el_loggedUsername.innerText = currentUser.username;
    }

    const tsTextConfig = {
        create: true,
        persist: false,
        createOnBlur: true,
        maxItems: 1
    };

    const tsNumberConfig = {
        create: true,
        createFilter: function(input) {
            return /^\d+(\.\d+)?$/.test(input.trim());
        },
        create: function(input) {
            const num = parseFloat(input);
            return {
                value: num.toString(),
                text: num.toString()
            };
        },
        onType: function(str) {
            const cleanStr = str.replace(/[^0-9.]/g, '');
            if (cleanStr !== str) {
                this.setTextboxValue(cleanStr);
            }
        }
    };

    tsShift = new TomSelect("#shift", tsTextConfig);
    tsHours = new TomSelect("#otHours", tsNumberConfig);
    tsTask = new TomSelect("#otTask", tsTextConfig);

    showDashboard();

    loadInitialData();
});