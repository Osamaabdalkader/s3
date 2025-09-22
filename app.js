// تهيئة Supabase
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// متغيرات التطبيق
let currentUser = null;
let debugMode = false;

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    checkAuthState();
    loadPosts();
    
    // إضافة معالجات الأحداث للنماذج
    document.getElementById('publish-form').addEventListener('submit', handlePublish);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
});

// تهيئة التطبيق
function initializeApp() {
    console.log('تم تهيئة التطبيق');
    updateConnectionStatus('جارٍ الاتصال بقاعدة البيانات...', 'info');
    
    // اختبار الاتصال بـ Supabase
    testSupabaseConnection();
}

// اختبار الاتصال بـ Supabase
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase.from('posts').select('id').limit(1);
        
        if (error) {
            console.error('خطأ في الاتصال:', error);
            updateConnectionStatus('فشل الاتصال بقاعدة البيانات', 'error');
        } else {
            console.log('الاتصال ناجح');
            updateConnectionStatus('متصل بقاعدة البيانات', 'success');
        }
    } catch (error) {
        console.error('خطأ غير متوقع:', error);
        updateConnectionStatus('خطأ في الاتصال', 'error');
    }
}

// تحديث حالة الاتصال
function updateConnectionStatus(message, type) {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = message;
    statusElement.className = 'connection-status';
    
    if (type === 'success') {
        statusElement.classList.add('connected');
    } else if (type === 'error') {
        statusElement.classList.add('error');
    }
}

// التحقق من حالة المصادقة
async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        updateUIForLoggedInUser();
        loadUserProfile();
    } else {
        currentUser = null;
        updateUIForLoggedOutUser();
    }
}

// تحديث واجهة المستخدم للمستخدم المسجل دخوله
function updateUIForLoggedInUser() {
    document.getElementById('publish-link').style.display = 'block';
    document.getElementById('profile-link').style.display = 'block';
    document.getElementById('logout-link').style.display = 'block';
    document.getElementById('login-link').style.display = 'none';
    document.getElementById('register-link').style.display = 'none';
    
    document.getElementById('publish-content').style.display = 'block';
    document.getElementById('login-required-publish').style.display = 'none';
    
    document.getElementById('profile-content').style.display = 'block';
    document.getElementById('login-required-profile').style.display = 'none';
}

// تحديث واجهة المستخدم للمستخدم غير المسجل دخوله
function updateUIForLoggedOutUser() {
    document.getElementById('publish-link').style.display = 'none';
    document.getElementById('profile-link').style.display = 'none';
    document.getElementById('logout-link').style.display = 'none';
    document.getElementById('login-link').style.display = 'block';
    document.getElementById('register-link').style.display = 'block';
    
    document.getElementById('publish-content').style.display = 'none';
    document.getElementById('login-required-publish').style.display = 'block';
    
    document.getElementById('profile-content').style.display = 'none';
    document.getElementById('login-required-profile').style.display = 'block';
}

// تحميل المنشورات
async function loadPosts() {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('خطأ في تحميل المنشورات:', error);
            return;
        }
        
        displayPosts(posts || []);
    } catch (error) {
        console.error('خطأ غير متوقع في تحميل المنشورات:', error);
    }
}

// عرض المنشورات
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    
    if (posts.length === 0) {
        postsContainer.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">لا توجد منشورات متاحة حالياً</p>';
        return;
    }
    
    postsContainer.innerHTML = posts.map(post => `
        <div class="post-card">
            ${post.image_url ? `<img src="${post.image_url}" alt="${post.name}" class="post-image">` : ''}
            <div class="post-content">
                <h3 class="post-title">${post.name}</h3>
                <p class="post-description">${post.description}</p>
                <div class="post-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${post.location}</span>
                    <span><i class="fas fa-tag"></i> ${post.category}</span>
                    <span><i class="fas fa-money-bill-wave"></i> ${post.price} ريال</span>
                </div>
                <div class="post-meta">
                    <span><i class="fas fa-calendar"></i> ${formatDate(post.created_at)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// تنسيق التاريخ
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('ar-YE', options);
}

// معالجة نشر منشور جديد
async function handlePublish(e) {
    e.preventDefault();
    
    if (!currentUser) {
        showMessage('يجب تسجيل الدخول أولاً', 'error', 'upload-status');
        return;
    }
    
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const location = document.getElementById('location').value;
    const category = document.getElementById('category').value;
    const price = document.getElementById('price').value;
    const imageFile = document.getElementById('image').files[0];
    
    try {
        showMessage('جاري نشر المنشور...', 'info', 'upload-status');
        
        let imageUrl = null;
        
        // رفع الصورة إذا تم اختيارها
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${currentUser.id}/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
                .from('post-images')
                .upload(filePath, imageFile);
            
            if (uploadError) {
                throw uploadError;
            }
            
            const { data: { publicUrl } } = supabase.storage
                .from('post-images')
                .getPublicUrl(filePath);
            
            imageUrl = publicUrl;
        }
        
        // إدخال البيانات في قاعدة البيانات
        const { error } = await supabase
            .from('posts')
            .insert([
                {
                    name,
                    description,
                    location,
                    category,
                    price: parseInt(price),
                    image_url: imageUrl,
                    user_id: currentUser.id
                }
            ]);
        
        if (error) {
            throw error;
        }
        
        showMessage('تم نشر المنشور بنجاح', 'success', 'upload-status');
        
        // إعادة تعيين النموذج
        document.getElementById('publish-form').reset();
        
        // إعادة تحميل المنشورات
        loadPosts();
        
        // العودة إلى الصفحة الرئيسية
        setTimeout(() => showPage('home'), 2000);
        
    } catch (error) {
        console.error('خطأ في النشر:', error);
        showMessage('حدث خطأ أثناء النشر: ' + error.message, 'error', 'upload-status');
    }
}

// معالجة تسجيل الدخول
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        showMessage('جاري تسجيل الدخول...', 'info', 'login-status');
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            throw error;
        }
        
        showMessage('تم تسجيل الدخول بنجاح', 'success', 'login-status');
        currentUser = data.user;
        
        // تحديث الواجهة
        updateUIForLoggedInUser();
        loadUserProfile();
        
        // إعادة تعيين النموذج
        document.getElementById('login-form').reset();
        
        // الانتقال إلى الصفحة الرئيسية
        setTimeout(() => showPage('home'), 1000);
        
    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        showMessage('فشل تسجيل الدخول: ' + error.message, 'error', 'login-status');
    }
}

// معالجة إنشاء حساب
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const phone = document.getElementById('register-phone').value;
    const address = document.getElementById('register-address').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // التحقق من تطابق كلمات المرور
    if (password !== confirmPassword) {
        showMessage('كلمتا المرور غير متطابقتين', 'error', 'register-status');
        return;
    }
    
    try {
        showMessage('جاري إنشاء الحساب...', 'info', 'register-status');
        
        // إنشاء المستخدم في المصادقة
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (authError) {
            throw authError;
        }
        
        // إضافة بيانات المستخدم الإضافية إلى جدول المستخدمين
        const { error: profileError } = await supabase
            .from('users')
            .insert([
                {
                    id: authData.user.id,
                    name,
                    phone,
                    address,
                    email
                }
            ]);
        
        if (profileError) {
            throw profileError;
        }
        
        showMessage('تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.', 'success', 'register-status');
        
        // إعادة تعيين النموذج
        document.getElementById('register-form').reset();
        
        // الانتقال إلى صفحة تسجيل الدخول
        setTimeout(() => showPage('login'), 2000);
        
    } catch (error) {
        console.error('خطأ في إنشاء الحساب:', error);
        showMessage('فشل إنشاء الحساب: ' + error.message, 'error', 'register-status');
    }
}

// تحميل بيانات الملف الشخصي
async function loadUserProfile() {
    if (!currentUser) return;
    
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('خطأ في تحميل الملف الشخصي:', error);
            return;
        }
        
        if (user) {
            document.getElementById('profile-name').textContent = user.name;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-phone').textContent = user.phone;
            document.getElementById('profile-address').textContent = user.address;
            document.getElementById('profile-created').textContent = formatDate(user.created_at);
        }
    } catch (error) {
        console.error('خطأ غير متوقع في تحميل الملف الشخصي:', error);
    }
}

// تسجيل الخروج
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            throw error;
        }
        
        currentUser = null;
        updateUIForLoggedOutUser();
        showPage('home');
        
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
        alert('حدث خطأ أثناء تسجيل الخروج: ' + error.message);
    }
}

// تبديل الصفحات
function showPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    // إذا كانت الصفحة الرئيسية، إعادة تحميل المنشورات
    if (pageId === 'home') {
        loadPosts();
    }
}

// عرض رسالة
function showMessage(message, type, elementId) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = 'upload-status';
    
    if (type === 'success') {
        element.classList.add('success');
    } else if (type === 'error') {
        element.classList.add('error');
    }
    
    element.style.display = 'block';
    
    // إخفاء الرسالة بعد 5 ثواني
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// تبديل وضع التصحيح
function toggleDebug() {
    debugMode = !debugMode;
    const debugInfo = document.getElementById('debug-info');
    
    if (debugMode) {
        debugInfo.style.display = 'block';
        updateDebugInfo();
    } else {
        debugInfo.style.display = 'none';
    }
}

// تحديث معلومات التصحيح
function updateDebugInfo() {
    const debugInfo = document.getElementById('debug-info');
    
    const debugData = {
        currentUser: currentUser ? {
            id: currentUser.id,
            email: currentUser.email
        } : null,
        timestamp: new Date().toISOString(),
        debugMode: debugMode
    };
    
    debugInfo.textContent = JSON.stringify(debugData, null, 2);
}

// تحديث معلومات التصحيح كل 5 ثواني عند تفعيل الوضع
setInterval(() => {
    if (debugMode) {
        updateDebugInfo();
    }
}, 5000);
