let currentUser = null;

// تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
function updateUIForAuth() {
    if (currentUser) {
        document.getElementById('publish-link').style.display = 'list-item';
        document.getElementById('profile-link').style.display = 'list-item';
        document.getElementById('logout-link').style.display = 'list-item';
        document.getElementById('login-link').style.display = 'none';
        document.getElementById('register-link').style.display = 'none';
    } else {
        document.getElementById('publish-link').style.display = 'none';
        document.getElementById('profile-link').style.display = 'none';
        document.getElementById('logout-link').style.display = 'none';
        document.getElementById('login-link').style.display = 'list-item';
        document.getElementById('register-link').style.display = 'list-item';
    }
}

// تسجيل الخروج
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        currentUser = null;
        updateUIForAuth();
        showPage('home');
    } catch (error) {
        console.error('Error signing out:', error.message);
        alert(`خطأ في تسجيل الخروج: ${error.message}`);
    }
}

// التحقق من حالة المصادقة عند تحميل الصفحة
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
            currentUser = session.user;
            updateUIForAuth();
        }
    } catch (error) {
        console.error('Error checking auth:', error.message);
        document.getElementById('connection-status').textContent = `خطأ في المصادقة: ${error.message}`;
        document.getElementById('connection-status').className = 'connection-status connection-error';
    }
}

// الاستماع لتغيرات حالة المصادقة
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
        currentUser = session.user;
        updateUIForAuth();
        document.getElementById('connection-status').textContent = 'تم تسجيل الدخول بنجاح';
        document.getElementById('connection-status').className = 'connection-status connection-success';
        
        setTimeout(() => {
            document.getElementById('connection-status').style.display = 'none';
        }, 3000);
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateUIForAuth();
    }
});