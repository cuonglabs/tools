/**
 * Chuyển hướng về trang trước đó (lasturl) nếu có trong sessionStorage, 
 * nếu không thì về trang mặc định.
 * @param {string} defaultUrl - Đường dẫn trang mặc định (ví dụ: 'index.html')
 */
export function redirectBackOrDefault(defaultUrl = 'index.html') {
    const lastUrl = sessionStorage.getItem('lasturl');
    
    if (lastUrl) {
        // Xóa đi để tránh bị lưu vòng lặp cho các lần đăng nhập sau
        sessionStorage.removeItem('lasturl');
        window.location.href = lastUrl;
    } else {
        window.location.href = defaultUrl;
    }
}

/**
 * (Mở rộng) Lưu lại trang hiện tại trước khi bắt người dùng phải đăng nhập
 * Gọi hàm này ở các trang bảo mật khi phát hiện chưa đăng nhập
 */
export function saveCurrentUrlAndRedirect(loginPageUrl = 'login.html') {
    sessionStorage.setItem('lasturl', window.location.href);
    window.location.href = loginPageUrl;
}

/**
 * Xóa session đăng nhập và chuyển hướng về trang đăng nhập
 * @param {string} loginPageUrl - Đường dẫn trang đăng nhập (mặc định 'auth.html')
 */
export function logoutAndRedirect(loginPageUrl = 'auth.html') {
    sessionStorage.removeItem('supabase_logged_user');
    sessionStorage.setItem('lasturl', window.location.href);
    window.location.href = loginPageUrl;
}