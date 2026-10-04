import { supabase } from './supabaseClient.js';

let currentUser = JSON.parse(sessionStorage.getItem('supabase_logged_user')) || null;
let isRegisterMode = false;

export function getCurrentUser() {
    return currentUser;
}

// Hàm mã hóa mật khẩu thành chuỗi SHA-256 ở phía Client trước khi gửi qua mạng
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export function initAuth(onLoginSuccess, onLogoutSuccess) {
    // Xử lý chuyển đổi qua lại giữa giao diện Đăng nhập và Đăng ký
    window.toggleAuthMode = function(mode=null) {
        if (mode) { isRegisterMode = mode; } else {isRegisterMode = !isRegisterMode;}
        document.getElementById('auth-title').innerText = isRegisterMode ? 'Đăng ký tài khoản mới' : 'Đăng nhập hệ thống';
        document.getElementById('btn-submit-auth').innerText = isRegisterMode ? 'Đăng ký ngay' : 'Đăng nhập';
        document.getElementById('btn-switch-mode').innerText = isRegisterMode ? 'Đã có tài khoản? Đăng nhập' : 'Tạo tài khoản mới';
        document.getElementById('auth-error').innerText = ''; // Điều chỉnh id của ô báo lỗi nếu giao diện của bạn khác
        document.getElementById('btn-submit-auth').disabled = false;
    };

    // Xử lý khi người dùng bấm nút Submit (Đăng nhập / Đăng ký)
    window.handleAuthAction = async function() {
        const username = document.getElementById('auth-username').value.trim();
        const rawPassword = document.getElementById('auth-password').value.trim();
        const errorBox = document.getElementById('auth-error');
        const btnSubmit = document.getElementById('btn-submit-auth');

        btnSubmit.disabled = true;

        if (errorBox) errorBox.innerText = '';

        if (!username || !rawPassword) {
            if (errorBox) errorBox.innerText = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!';
            btnSubmit.disabled = false;
            return;
        }

        if (isRegisterMode) {
            // 1. Kiểm tra xem username đã tồn tại trong hệ thống chưa
            const { data: existing, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('username', username);

            if (checkError) {
                if (errorBox) errorBox.innerText = 'Lỗi kiểm tra tài khoản: ' + checkError.message;
                return;
            }

            if (existing && existing.length > 0) {
                if (errorBox) errorBox.innerText = 'Tên đăng nhập này đã tồn tại!';
                return;
            }

            // 2. Mã hóa mật khẩu bằng SHA-256 ở phía Client
            const hashedPassword = await hashPassword(rawPassword);

            // 3. Khởi tạo giá trị mặc định cho cột option (JSONB)
            const defaultOptions = { theme: 'light', notifications: true };

            // 4. Thực hiện Insert bản ghi mới 
            // (Lưu ý: Cột `id` dạng 4 ký tự ngẫu nhiên sẽ tự động được Database sinh ra nhờ hàm default)
            const { data, error } = await supabase.from('users').insert([{ 
                username, 
                password: hashedPassword, 
                option: defaultOptions 
            }]).select();

            if (error) {
                if (errorBox) errorBox.innerText = 'Lỗi đăng ký: ' + error.message;
                btnSubmit.disabled = false;
            } else {
                alert('Đăng ký tài khoản thành công!');
                completeLogin(data[0], onLoginSuccess);
            }
        } else {
            // 1. Mã hóa mật khẩu thành chuỗi SHA-256 ở Client trước
            const hashedPassword = await hashPassword(rawPassword);

            // 2. Gọi hàm RPC với chuỗi đã mã hóa
            const { data, error } = await supabase.rpc('login_user', { 
                p_username: username, 
                p_password: hashedPassword
            });

            if (error || !data) {
                if (errorBox) errorBox.innerText = 'Sai tên đăng nhập hoặc mật khẩu!';
                btnSubmit.disabled = false;
            } else {
                // data trả về là đối tượng JSON chứa user (gồm id 4 ký tự, username, option, ...)
                completeLogin(data, onLoginSuccess);
            }
        }
    };

    // Xử lý Đăng xuất
    window.handleLogout = async function() {
        sessionStorage.removeItem('supabase_logged_user');
        currentUser = null;
        if (typeof onLogoutSuccess === 'function') {
            onLogoutSuccess();
        }
    };

    if (currentUser && typeof onLoginSuccess === 'function') {
        onLoginSuccess(currentUser);
    }
}

async function completeLogin(userData, callback) {
    currentUser = userData; // userData lúc này bao gồm cả id (4 ký tự), username, option
    // Lưu vào sessionStorage để cách ly phiên làm việc giữa các tab trình duyệt
    sessionStorage.setItem('supabase_logged_user', JSON.stringify(currentUser));
    if (typeof callback === 'function') {
        callback(currentUser);
    }
}