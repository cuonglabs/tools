const API_URL = "https://script.google.com/macros/s/AKfycbxX4l1AfUFroLcgazD-ijuKLJrnCfRU0U0o8oR4cfVSqmFRlj7h-vhgstqcqBEk4m17/exec";

let rawOTData = [];
let rawHolidayData = [];

// Trả về danh sách chuỗi dạng YYYY-MM đại diện cho tháng hiện tại và tháng liền trước
function getRecentMonthKeys() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 - 11

    const currentKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    
    return [currentKey, prevKey];
}

function resetForm() {
    document.getElementById("editId").value = "";
    document.getElementById("otDate").valueAsDate = new Date();
    document.getElementById("shift").value = "";
    document.getElementById("otHours").value = "";
    document.getElementById("otTask").value = "";
    document.getElementById("form-title").innerText = "⏱️ Đăng ký Tăng ca";
    const btnSubmit = document.getElementById("btn-submit");
    btnSubmit.innerText = "+ Đăng ký Tăng ca";
    btnSubmit.className = "btn btn-success w-100 fw-bold py-2";
    document.getElementById("btn-reset").innerText = "Xoá trống";
}

function resetHolidayForm() {
    document.getElementById("editHolidayId").value = "";
    document.getElementById("holidayDate").valueAsDate = new Date();
    document.getElementById("leaveType").selectedIndex = 0;
    document.getElementById("holidayReason").value = "";
    document.getElementById("holiday-form-title").innerText = "🌴 Đăng ký Nghỉ phép";
    const btnSubmit = document.getElementById("btn-holiday-submit");
    btnSubmit.innerText = "+ Đăng ký Nghỉ phép";
    btnSubmit.className = "btn btn-info text-white w-100 fw-bold py-2";
    document.getElementById("btn-holiday-reset").innerText = "Xoá trống";
}

function clearMonthFilter() {
    document.getElementById("filterMonth").value = "";
    renderGroupedData();
}

function clearHolidayMonthFilter() {
    document.getElementById("filterHolidayMonth").value = "";
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

function getToken() { return localStorage.getItem("token") || ""; }
function logout() { localStorage.clear(); location.reload(); }

function toggleLoading(show, message = "Đang xử lý...") {
    const overlay = document.getElementById("loadingOverlay");
    const msgEl = document.getElementById("loadingMessage");
    if (show) {
        msgEl.innerText = message;
        overlay.style.display = "flex";
    } else {
        overlay.style.display = "none";
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
    const toastEl = document.getElementById("liveToast");
    const toastBody = document.getElementById("toastBody");
    toastEl.classList.remove("bg-success", "bg-danger", "bg-warning", "text-white", "text-dark");
    if (type === "success") {
        toastEl.classList.add("bg-success", "text-white");
    } else if (type === "danger") {
        toastEl.classList.add("bg-danger", "text-white");
    } else {
        toastEl.classList.add("bg-warning", "text-dark");
    }
    toastBody.innerText = message;
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}

function handleLoginKey(e) { if (e.key === "Enter") login(); }
function handleSaveKey(e) { if (e.key === "Enter") saveData(); }
function handleHolidaySaveKey(e) { if (e.key === "Enter") saveHolidayData(); }

async function api(data) {
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (e) {
        return { success: false, error: "Không thể kết nối đến máy chủ API" };
    }
}

async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
        showToast("Vui lòng nhập đầy đủ thông tin đăng nhập!", "danger");
        return;
    }

    toggleLoading(true, "Đang xác thực tài khoản...");
    const result = await api({ action: "login", username, password });
    toggleLoading(false);

    if (!result.success) {
        showToast(result.error, "danger");
        return;
    }

    localStorage.setItem("token", result.token);
    localStorage.setItem("role", result.role);
    localStorage.setItem("username", result.username);

    showToast("Đăng nhập thành công!", "success");
    showDashboard();
}

// Render Bảng tổng quan cho Admin và User1 (Sắp xếp từ MỚI đến CŨ theo Ngày OT và Ngày nghỉ)
function renderSummaryTables() {
    const myRole = localStorage.getItem("role");
    if (myRole !== "admin" && myRole !== "user1") return;

    const validMonths = getRecentMonthKeys();

    // Lọc & Sắp xếp OT cho tháng này & tháng trước (từ MỚI -> CŨ theo OtDate)
    const filteredOtData = rawOTData.filter(item => {
        if (!item.OtDate) return false;
        const d = new Date(item.OtDate);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return validMonths.includes(key);
    }).sort((a, b) => new Date(b.OtDate) - new Date(a.OtDate));

    // Render Bảng OT Tổng
    const otTbody = document.getElementById("summaryOtTbody");
    if (filteredOtData.length === 0) {
        otTbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Chưa có dữ liệu tăng ca trong tháng này và tháng trước.</td></tr>`;
    } else {
        let html = "";
        filteredOtData.forEach(row => {
            let createdStr = row.Created ? new Date(row.Created).toLocaleString('vi-VN') : "-";
            let updatedStr = row.Updated ? new Date(row.Updated).toLocaleString('vi-VN') : "-";
            html += `
            <tr>
                <td><span class="badge bg-secondary">${escapeHtml(row.CreatedBy)}</span></td>
                <td><strong>${formatDateDDMMYYYY(row.OtDate)}</strong></td>
                <td>${escapeHtml(row.Shift)}</td>
                <td><span class="text-success fw-bold">${escapeHtml(row.OtHours)}h</span></td>
                <td>${escapeHtml(row.OtTask || "-")}</td>
                <td class="small text-muted">${escapeHtml(createdStr)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(row.UpdatedBy) || "-"}</span></td>
                <td class="small text-muted">${escapeHtml(updatedStr)}</td>
            </tr>`;
        });
        otTbody.innerHTML = html;
    }

    // Lọc & Sắp xếp Nghỉ phép cho tháng này & tháng trước (từ MỚI -> CŨ theo HolidayDate)
    const filteredHolidayData = rawHolidayData.filter(item => {
        if (!item.HolidayDate) return false;
        const d = new Date(item.HolidayDate);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return validMonths.includes(key);
    }).sort((a, b) => new Date(b.HolidayDate) - new Date(a.HolidayDate));

    // Render Bảng Nghỉ Phép Tổng
    const holidayTbody = document.getElementById("summaryHolidayTbody");
    if (filteredHolidayData.length === 0) {
        holidayTbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Chưa có dữ liệu nghỉ phép trong tháng này và tháng trước.</td></tr>`;
    } else {
        let html = "";
        filteredHolidayData.forEach(row => {
            let createdStr = row.Created ? new Date(row.Created).toLocaleString('vi-VN') : "-";
            let updatedStr = row.Updated ? new Date(row.Updated).toLocaleString('vi-VN') : "-";
            html += `
            <tr>
                <td><span class="badge bg-secondary">${escapeHtml(row.CreatedBy)}</span></td>
                <td><strong>${formatDateDDMMYYYY(row.HolidayDate)}</strong></td>
                <td><span class="badge bg-info text-dark">${escapeHtml(row.LeaveType)}</span></td>
                <td>${escapeHtml(row.Reason || "-")}</td>
                <td class="small text-muted">${escapeHtml(createdStr)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(row.UpdatedBy) || "-"}</span></td>
                <td class="small text-muted">${escapeHtml(updatedStr)}</td>
            </tr>`;
        });
        holidayTbody.innerHTML = html;
    }
}

// Tải xuống File Excel
function exportSummaryExcel() {
    const wb = XLSX.utils.book_new();
    const validMonths = getRecentMonthKeys();

    const filteredOtData = rawOTData.filter(item => {
        if (!item.OtDate) return false;
        const d = new Date(item.OtDate);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return validMonths.includes(key);
    }).sort((a, b) => new Date(b.OtDate) - new Date(a.OtDate));

    const filteredHolidayData = rawHolidayData.filter(item => {
        if (!item.HolidayDate) return false;
        const d = new Date(item.HolidayDate);
        if (isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return validMonths.includes(key);
    }).sort((a, b) => new Date(b.HolidayDate) - new Date(a.HolidayDate));

    const otExportData = filteredOtData.map(item => ({
        "Người Tạo": item.CreatedBy || "",
        "Ngày OT": formatDateDDMMYYYY(item.OtDate),
        "Ca Làm Việc": item.Shift || "",
        "Số Giờ OT": item.OtHours || 0,
        "Công Việc": item.OtTask || "",
        "Thời Gian Tạo": item.Created ? new Date(item.Created).toLocaleString('vi-VN') : "",
        "Người Sửa": item.UpdatedBy || "",
        "Thời Gian Sửa": item.Updated ? new Date(item.Updated).toLocaleString('vi-VN') : ""
    }));

    const holidayExportData = filteredHolidayData.map(item => ({
        "Người Tạo": item.CreatedBy || "",
        "Ngày Nghỉ": formatDateDDMMYYYY(item.HolidayDate),
        "Loại Nghỉ Phép": item.LeaveType || "",
        "Lý Do Nghỉ": item.Reason || "",
        "Thời Gian Tạo": item.Created ? new Date(item.Created).toLocaleString('vi-VN') : "",
        "Người Sửa": item.UpdatedBy || "",
        "Thời Gian Sửa": item.Updated ? new Date(item.Updated).toLocaleString('vi-VN') : ""
    }));

    const otSheet = XLSX.utils.json_to_sheet(otExportData);
    const holidaySheet = XLSX.utils.json_to_sheet(holidayExportData);

    XLSX.utils.book_append_sheet(wb, otSheet, "Tăng Ca");
    XLSX.utils.book_append_sheet(wb, holidaySheet, "Nghỉ Phép");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Báo_Cáo_${today}.xlsx`);
}

function renderGroupedData() {
    const currentUsername = localStorage.getItem("username") || "";
    const myRole = localStorage.getItem("role");
    const selectedMonth = document.getElementById("filterMonth").value;

    const tableHeader = document.getElementById("tableHeader");
    tableHeader.innerHTML = `
    <th>Ngày OT</th>
    <th>Ca làm việc</th>
    <th>Số giờ</th>
    <th>Công việc</th>
    <th>Người tạo</th>
    <th>Thời gian tạo</th>
    <th>Người sửa</th>
    <th>Thời gian sửa</th>
    <th class="text-center" style="width: 110px;">Thao tác</th>`;

    const tbody = document.getElementById("tbody");
    tbody.innerHTML = "";

    let displayData = rawOTData;
    if (myRole !== "admin") {
        displayData = rawOTData.filter(item => String(item.CreatedBy).toLowerCase() === currentUsername.toLowerCase());
    }

    if (displayData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Chưa có dữ liệu tăng ca nào.</td></tr>`;
        return;
    }

    const grouped = {};
    displayData.forEach(row => {
        if (!row.OtDate) return;
        const d = new Date(row.OtDate);
        if (isNaN(d.getTime())) return;

        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (selectedMonth && monthKey !== selectedMonth) return;

        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(row);
    });

    const monthKeys = Object.keys(grouped).sort().reverse();

    if (monthKeys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">Không tìm thấy bản ghi nào trong tháng đã chọn.</td></tr>`;
        return;
    }

    let htmlContentBuffer = "";

    monthKeys.forEach(monthKey => {
        const records = grouped[monthKey];
        records.sort((a, b) => new Date(b.OtDate) - new Date(a.OtDate));

        const totalHours = records.reduce((sum, item) => sum + (parseFloat(item.OtHours) || 0), 0);
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
            let createdStr = row.Created ? new Date(row.Created).toLocaleString('vi-VN') : "-";
            let updatedStr = row.Updated ? new Date(row.Updated).toLocaleString('vi-VN') : "-";

            const cleanOtDate = formatDateDDMMYYYY(row.OtDate);
            const cleanShift = escapeHtml(row.Shift);
            const cleanOtHours = escapeHtml(row.OtHours);
            const cleanOtTask = escapeHtml(row.OtTask || "");
            const cleanCreatedBy = escapeHtml(row.CreatedBy);
            const cleanUpdatedBy = escapeHtml(row.UpdatedBy);

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
                const rawOtDateForInput = formatDateYYYYMMDD(row.OtDate);
                htmlContentBuffer += `
            <button class="btn btn-action btn-outline-warning text-dark me-1" onclick="startEdit('${escapeHtml(row.ID)}', '${rawOtDateForInput}', '${cleanShift}', '${cleanOtHours}', '${cleanOtTask}')">Sửa</button>
            <button class="btn btn-action btn-outline-danger" onclick="deleteData('${escapeHtml(row.ID)}')">Xóa</button>`;
            } else {
                htmlContentBuffer += `<span class="text-muted small">N/A</span>`;
            }

            htmlContentBuffer += `</td></tr>`;
        });
    });

    tbody.innerHTML = htmlContentBuffer;
}

function renderGroupedHolidayData() {
    const currentUsername = localStorage.getItem("username") || "";
    const myRole = localStorage.getItem("role");
    const selectedMonth = document.getElementById("filterHolidayMonth").value;

    const tableHeader = document.getElementById("holidayTableHeader");
    tableHeader.innerHTML = `
    <th>Ngày nghỉ</th>
    <th>Loại nghỉ phép</th>
    <th>Lý do nghỉ</th>
    <th>Người tạo</th>
    <th>Thời gian tạo</th>
    <th>Người sửa</th>
    <th>Thời gian sửa</th>
    <th class="text-center" style="width: 110px;">Thao tác</th>`;

    const tbody = document.getElementById("holidayTbody");
    tbody.innerHTML = "";

    let displayData = rawHolidayData;
    if (myRole !== "admin") {
        displayData = rawHolidayData.filter(item => String(item.CreatedBy).toLowerCase() === currentUsername.toLowerCase());
    }

    if (displayData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Chưa có ngày nghỉ phép nào được đăng ký.</td></tr>`;
        return;
    }

    const grouped = {};
    displayData.forEach(row => {
        if (!row.HolidayDate) return;
        const d = new Date(row.HolidayDate);
        if (isNaN(d.getTime())) return;

        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (selectedMonth && monthKey !== selectedMonth) return;

        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(row);
    });

    const monthKeys = Object.keys(grouped).sort().reverse();

    if (monthKeys.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Không tìm thấy ngày nghỉ nào trong tháng đã chọn.</td></tr>`;
        return;
    }

    let htmlContentBuffer = "";

    monthKeys.forEach(monthKey => {
        const records = grouped[monthKey];
        records.sort((a, b) => new Date(b.HolidayDate) - new Date(a.HolidayDate));

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
            let createdStr = row.Created ? new Date(row.Created).toLocaleString('vi-VN') : "-";
            let updatedStr = row.Updated ? new Date(row.Updated).toLocaleString('vi-VN') : "-";

            const cleanHolidayDate = formatDateDDMMYYYY(row.HolidayDate);
            const cleanLeaveType = escapeHtml(row.LeaveType);
            const cleanReason = escapeHtml(row.Reason || "");
            const cleanCreatedBy = escapeHtml(row.CreatedBy);
            const cleanUpdatedBy = escapeHtml(row.UpdatedBy);

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
                const rawHolidayDateForInput = formatDateYYYYMMDD(row.HolidayDate);
                htmlContentBuffer += `
            <button class="btn btn-action btn-outline-warning text-dark me-1" onclick="startEditHoliday('${escapeHtml(row.ID)}', '${rawHolidayDateForInput}', '${cleanLeaveType}', '${cleanReason}')">Sửa</button>
            <button class="btn btn-action btn-outline-danger" onclick="deleteHolidayData('${escapeHtml(row.ID)}')">Xóa</button>`;
            } else {
                htmlContentBuffer += `<span class="text-muted small">N/A</span>`;
            }

            htmlContentBuffer += `</td></tr>`;
        });
    });

    tbody.innerHTML = htmlContentBuffer;
}

async function loadData(isManualClick = false) {
    document.getElementById("loadStatus").innerText = "Đang đồng bộ dữ liệu...";
    if (isManualClick) toggleLoading(true, "Đang tải danh sách tăng ca...");

    const result = await api({ action: "list", token: getToken() });
    if (isManualClick) toggleLoading(false);

    if (result.success === false) {
        showToast("Phiên làm việc hết hạn hoặc lỗi: " + result.error, "danger");
        setTimeout(logout, 2000);
        return;
    }

    rawOTData = result.data || [];

    const filterInput = document.getElementById("filterMonth");
    if (!filterInput.value) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        filterInput.value = `${yyyy}-${mm}`;
    }

    renderGroupedData();
    renderSummaryTables();
    updateTimestamp();
    if (isManualClick) showToast("Đã cập nhật dữ liệu tăng ca mới nhất!", "success");
}

async function loadHolidayData(isManualClick = false) {
    if (isManualClick) toggleLoading(true, "Đang tải danh sách nghỉ phép...");

    const result = await api({ action: "listHolidays", token: getToken() });
    if (isManualClick) toggleLoading(false);

    if (result.success === false) {
        showToast("Lỗi tải danh sách ngày nghỉ: " + result.error, "danger");
        return;
    }

    rawHolidayData = result.data || [];

    const filterInput = document.getElementById("filterHolidayMonth");
    if (!filterInput.value) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        filterInput.value = `${yyyy}-${mm}`;
    }

    renderGroupedHolidayData();
    renderSummaryTables();
    if (isManualClick) showToast("Đã cập nhật dữ liệu ngày nghỉ mới nhất!", "success");
}

function updateTimestamp() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    document.getElementById("loadStatus").innerText = `Cập nhật gần nhất: ${hh}:${mm} - ${dd}/${MM}/${yyyy}`;
}

function startEdit(id, otDate, shift, otHours, otTask) {
    document.getElementById("editId").value = id;
    document.getElementById("otDate").value = otDate;
    document.getElementById("shift").value = shift;
    document.getElementById("otHours").value = otHours;
    document.getElementById("otTask").value = otTask || "";
    document.getElementById("form-title").innerText = "✏️ Chỉnh sửa Tăng ca";

    const btnSubmit = document.getElementById("btn-submit");
    btnSubmit.innerText = "Lưu thay đổi";
    btnSubmit.className = "btn btn-warning w-100 fw-bold py-2 text-dark";
    document.getElementById("btn-reset").innerText = "Hủy thay đổi";
    document.getElementById("form-title").scrollIntoView({ behavior: 'smooth' });
}

function startEditHoliday(id, holidayDate, leaveType, reason) {
    document.getElementById("editHolidayId").value = id;
    document.getElementById("holidayDate").value = holidayDate;

    const leaveTypeSelect = document.getElementById("leaveType");
    for (let i = 0; i < leaveTypeSelect.options.length; i++) {
        if (leaveTypeSelect.options[i].value === leaveType) {
            leaveTypeSelect.selectedIndex = i;
            break;
        }
    }

    document.getElementById("holidayReason").value = reason || "";
    document.getElementById("holiday-form-title").innerText = "✏️ Chỉnh sửa Nghỉ phép";

    const btnSubmit = document.getElementById("btn-holiday-submit");
    btnSubmit.innerText = "Lưu thay đổi";
    btnSubmit.className = "btn btn-warning w-100 fw-bold py-2 text-dark";
    document.getElementById("btn-holiday-reset").innerText = "Hủy thay đổi";
    document.getElementById("holiday-form-title").scrollIntoView({ behavior: 'smooth' });
}

async function saveData() {
    const id = document.getElementById("editId").value;
    const otDate = document.getElementById("otDate").value;
    const shift = document.getElementById("shift").value.trim();
    const otHours = document.getElementById("otHours").value.trim();
    const otTask = document.getElementById("otTask").value.trim();

    if (!otDate || !shift || !otHours || !otTask) {
        showToast("Vui lòng điền đủ: \nNgày, Ca làm việc, Số giờ OT và Công việc !", "danger");
        return;
    }

    const isEdit = id !== "";
    const action = isEdit ? "update" : "add";
    const payload = { action, token: getToken(), otDate, shift, otHours, otTask };
    if (isEdit) payload.id = id;

    toggleLoading(true, "Đang lưu dữ liệu tăng ca...");
    const result = await api(payload);
    toggleLoading(false);

    if (result.success) {
        showToast(isEdit ? "Cập nhật dữ liệu thành công!" : "Đăng ký Tăng ca thành công!", "success");
        resetForm();
        loadData(false);
    } else {
        showToast("Lỗi hệ thống: " + result.error, "danger");
    }
}

async function saveHolidayData() {
    const id = document.getElementById("editHolidayId").value;
    const holidayDate = document.getElementById("holidayDate").value;
    const leaveType = document.getElementById("leaveType").value;
    const reason = document.getElementById("holidayReason").value.trim();

    if (!holidayDate || !leaveType || !reason) {
        showToast("Vui lòng điền đủ: Ngày nghỉ, Loại nghỉ phép và Lý do nghỉ!", "danger");
        return;
    }

    const isEdit = id !== "";
    const action = isEdit ? "updateHoliday" : "addHoliday";
    const payload = { action, token: getToken(), holidayDate, leaveType, reason };
    if (isEdit) payload.id = id;

    toggleLoading(true, "Đang lưu thông tin nghỉ phép...");
    const result = await api(payload);
    toggleLoading(false);

    if (result.success) {
        showToast(isEdit ? "Cập nhật thông tin nghỉ phép thành công!" : "Đăng ký Nghỉ phép thành công!", "success");
        resetHolidayForm();
        loadHolidayData(false);
    } else {
        showToast("Lỗi hệ thống: " + result.error, "danger");
    }
}

async function deleteData(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn lần tăng ca này?")) return;

    toggleLoading(true, "Đang xóa...");
    const result = await api({ action: "delete", token: getToken(), id });
    toggleLoading(false);

    if (result.success) {
        showToast("Đã xóa thành công!", "success");
        loadData(false);
    } else {
        showToast("Lỗi khi xóa: " + result.error, "danger");
    }
}

async function deleteHolidayData(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa ngày nghỉ này?")) return;

    toggleLoading(true, "Đang xóa...");
    const result = await api({ action: "deleteHoliday", token: getToken(), id });
    toggleLoading(false);

    if (result.success) {
        showToast("Đã xóa ngày nghỉ thành công!", "success");
        loadHolidayData(false);
    } else {
        if (result.error && result.error.includes("Không tìm thấy ID")) {
            loadHolidayData(true);
        }
        showToast("Lỗi khi xóa: " + result.error, "danger");
    }
}

async function createUser() {
    const userEl = document.getElementById("newUser");
    const passEl = document.getElementById("newPass");
    const role = document.getElementById("newRole").value;

    const username = userEl.value.trim();
    const password = passEl.value;

    if (!username || !password) {
        showToast("Vui lòng không để trống tên đăng nhập và mật khẩu!", "danger");
        return;
    }

    toggleLoading(true, "Đang khởi tạo tài khoản...");
    const result = await api({ action: "createUser", token: getToken(), username, password, role });
    toggleLoading(false);

    if (result.success) {
        showToast("Khởi tạo tài khoản thành công!", "success");
        userEl.value = "";
        passEl.value = "";
    } else {
        showToast("Lỗi: " + result.error, "danger");
    }
}

async function resetPasswordByAdmin() {
    const targetUsername = document.getElementById("resetTargetUser").value.trim();
    const newPassword = document.getElementById("resetNewPass").value;

    if (!targetUsername || !newPassword) {
        showToast("Vui lòng nhập đầy đủ Tên tài khoản và Mật khẩu mới!", "danger");
        return;
    }

    if (!confirm(`Bạn chắc chắn muốn đặt lại mật khẩu cho tài khoản [${targetUsername}]?`)) return;

    toggleLoading(true, "Đang cấp lại mật khẩu...");
    const result = await api({ action: "resetPassword", token: getToken(), targetUsername, newPassword });
    toggleLoading(false);

    if (result.success) {
        showToast(`Cấp lại mật khẩu cho tài khoản ${targetUsername} thành công!`, "success");
        document.getElementById("resetTargetUser").value = "";
        document.getElementById("resetNewPass").value = "";
    } else {
        showToast("Lỗi: " + result.error, "danger");
    }
}

async function changePassword() {
    const oldPassword = document.getElementById("oldPass").value;
    const newPassword = document.getElementById("newPassUser").value;

    if (!oldPassword || !newPassword) {
        showToast("Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới!", "danger");
        return;
    }

    toggleLoading(true, "Đang đổi mật khẩu...");
    const result = await api({ action: "changePassword", token: getToken(), oldPassword, newPassword });
    toggleLoading(false);

    if (result.success) {
        showToast("Đổi mật khẩu thành công! Đang đăng xuất...", "success");
        setTimeout(logout, 2000);
    } else {
        showToast("Lỗi: " + result.error, "danger");
    }
}

async function loadUserConfigs(isSilent = false) {
    if (!isSilent) toggleLoading(true, "Đang tải cấu hình cá nhân...");
    const result = await api({ action: "getUserConfigs", token: getToken() });
    if (!isSilent) toggleLoading(false);

    if (!result.success) return;
    const configs = result.configs || {};

    const urls = configs.urls || [];
    const container = document.getElementById("quickLinksContainer");
    const cardBlock = document.getElementById("quickLinksCard");

    if (container && cardBlock) {
        container.innerHTML = "";
        if (urls.length > 0) {
            cardBlock.style.display = "block";
            let rawTextareaValue = "";
            urls.forEach(item => {
                rawTextareaValue += `${item.title}|${item.url}\n`;
                const a = document.createElement("a");
                a.href = item.url; a.target = "_blank";
                a.className = "btn btn-xs btn-outline-dark pt-0 pb-0 ps-2 pe-2 small bg-white border shadow-sm";
                a.style.fontSize = "12px"; a.innerText = item.title;
                container.appendChild(a);
            });
            document.getElementById("cfgUrls").value = rawTextareaValue.trim();
        } else {
            cardBlock.style.display = "none";
            document.getElementById("cfgUrls").value = "";
        }
    }
}

async function saveUserConfigs(isSilent = false) {
    const rawUrls = document.getElementById("cfgUrls").value.split("\n");
    const urlsArray = [];
    rawUrls.forEach(line => {
        if (line.includes("|")) {
            const parts = line.split("|");
            urlsArray.push({ title: parts[0].trim(), url: parts[1].trim() });
        }
    });

    const newConfigs = { urls: urlsArray };

    if (!isSilent) toggleLoading(true, "Đang lưu cấu hình...");
    const result = await api({ action: "updateUserConfigs", token: getToken(), configs: newConfigs });
    if (!isSilent) toggleLoading(false);

    if (result.success) {
        if (!isSilent) showToast("Lưu cấu hình thành công!", "success");
        loadUserConfigs(true);
    } else {
        if (!isSilent) showToast("Không thể lưu cấu hình: " + result.error, "danger");
    }
}

function showDashboard() {
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("dashboard").style.display = "block";

    document.getElementById("otDate").valueAsDate = new Date();
    document.getElementById("holidayDate").valueAsDate = new Date();

    const username = localStorage.getItem("username") || "";
    const role = localStorage.getItem("role") || "";
    const capitalizedUser = username.charAt(0).toUpperCase() + username.slice(1);

    let greetingString = `<span>Xin chào, </span><strong>${escapeHtml(capitalizedUser)}</strong><br>
    <span class="badge bg-info bg-opacity-10 text-info-emphasis border border-info border-opacity-25">(${role.toUpperCase()})</span>`;
    document.getElementById("userInfo").innerHTML = greetingString;

    // Kiểm tra phân quyền hiển thị Admin Panel
    if (role === "admin") {
        document.getElementById("adminPanel").style.display = "block";
    } else {
        document.getElementById("adminPanel").style.display = "none";
    }

    // Kiểm tra phân quyền hiển thị Bảng Dữ Liệu Tổng
    if (role === "admin" || role === "user1") {
        document.getElementById("summaryPanel").style.display = "block";
    } else {
        document.getElementById("summaryPanel").style.display = "none";
    }

    toggleLoading(true, "Đang khởi tạo không gian làm việc...");
    Promise.all([loadData(false), loadHolidayData(false), loadUserConfigs(true)]).then(() => {
        toggleLoading(false);
    });
}

if (localStorage.getItem("token")) {
    showDashboard();
}