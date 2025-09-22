// تهيئة Supabase
const SUPABASE_URL = 'https://rrjocpzsyxefcsztazkd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyam9jcHpzeXhlZmNzenRhemtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTEzMTgsImV4cCI6MjA3Mzg2NzMxOH0.TvUthkBc_lnDdGlHJdEFUPo4Dl2n2oHyokXZE8_wodw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let debugMode = false;
let currentUser = null;

// خريطة الصفحات وملفاتها مع مسارات GitHub Pages
const pageFiles = {
    'home': 'home.html',
    'publish': 'add-post.html', 
    'login': 'login.html',
    'register': 'register.html',
    'profile': 'profile.html'
};

// اختبار اتصال Supabase
async function testConnection() {
    const connectionStatus = document.getElementById('connection-status');
    try {
        const { data, error } = await supabase.from('marketing').select('count');
        
        if (error) {
            console.error('اتصال Supabase فشل:', error);
            connectionStatus.textContent = `خطأ في الاتصال: ${error.message}`;
            connectionStatus.className = 'connection-status connection-error';
        } else {
            console.log('اتصال Supabase ناجح');
            connectionStatus.textContent = 'الاتصال مع قاعدة البيانات ناجح';
            connectionStatus.className = 'connection-status connection-success';
            
            setTimeout(() => {
                connectionStatus.style.display = 'none';
            }, 3000);
        }
    } catch (error) {
        console.error('خطأ في اختبار الاتصال:', error);
        connectionStatus.textContent = `خطأ في الاتصال: ${error.message}`;
        connectionStatus.className = 'connection-status connection-error';
    }
}

// تحميل محتوى الصفحة من ملف منفصل (معدل تماماً)
function loadPageContent(pageId) {
    return new Promise(async (resolve, reject) => {
        console.log(`جاري تحميل الصفحة: ${pageId}`);
        
        if (!pageFiles[pageId]) {
            const error = `الصفحة غير معروفة: ${pageId}`;
            console.error(error);
            reject(error);
            return;
        }

        try {
            // استخدام XMLHttpRequest بدلاً من fetch لتحسين التوافق
            const xhr = new XMLHttpRequest();
            const url = pageFiles[pageId] + '?v=' + Date.now(); // إضافة timestamp لتجنب caching
            
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        const html = xhr.responseText;
                        document.getElementById('dynamic-content').innerHTML = html;
                        
                        // ربط الأحداث بعد التأكد من تحميل DOM
                        setTimeout(() => {
                            initializePage(pageId);
                            resolve(true);
                        }, 100);
                    } else {
                        const error = `فشل في تحميل الصفحة: ${xhr.status} - ${pageFiles[pageId]}`;
                        console.error(error);
                        document.getElementById('dynamic-content').innerHTML = `
                            <div class="page">
                                <h1 class="section-title">خطأ في تحميل الصفحة</h1>
                                <p>${error}</p>
                                <p>مسار الملف: ${url}</p>
                                <button onclick="showPage('home')">العودة إلى الرئيسية</button>
                            </div>
                        `;
                        reject(error);
                    }
                }
            };
            
            xhr.onerror = function() {
                const error = `خطأ في الشبكة أثناء تحميل: ${pageFiles[pageId]}`;
                console.error(error);
                reject(error);
            };
            
            xhr.send();
        } catch (error) {
            console.error(`خطأ في تحميل صفحة ${pageId}:`, error);
            reject(error);
        }
    });
}

// تهيئة الصفحة بعد تحميلها (معدل)
function initializePage(pageId) {
    console.log(`جاري تهيئة الصفحة: ${pageId}`);
    
    // ربط الأحداث باستخدام event delegation
    bindPageEventsWithDelegation(pageId);
    
    // معالجة خاصة لكل صفحة
    handlePageSpecificLogic(pageId);
    
    // إذا كانت الصفحة الرئيسية، تحميل المنشورات
    if (pageId === 'home') {
        loadPosts();
    }
}

// ربط الأحداث باستخدام event delegation (الحل الجذري)
function bindPageEventsWithDelegation(pageId) {
    console.log(`جاري ربط الأحداث للصفحة: ${pageId} باستخدام delegation`);
    
    // لا حاجة لربط أحداث هنا - سيتم التعامل معها عبر handleDynamicContentClick
}

// معالجة النقر على المحتوى الديناميكي (event delegation)
function handleDynamicContentClick(event) {
    const target = event.target;
    
    // التعامل مع النقر على الأزرار داخل النماذج
    if (target.tagName === 'BUTTON' && target.type === 'submit') {
        event.preventDefault();
        const form = target.closest('form');
        if (form) {
            handleFormSubmit(form.id);
        }
    }
    
    // التعامل مع النقر على الروابط
    if (target.tagName === 'A' && target.onclick) {
        // السماح للروابط بالعمل بشكل طبيعي
        return true;
    }
}

// معالجة تقديم النماذج (مركزي)
function handleFormSubmit(formId) {
    console.log(`تم تقديم النموذج: ${formId}`);
    
    switch (formId) {
        case 'publish-form':
            handlePublishSubmit();
            break;
        case 'login-form':
            handleLoginSubmit();
            break;
        case 'register-form':
            handleRegisterSubmit();
            break;
        default:
            console.warn(`نموذج غير معروف: ${formId}`);
    }
}

// معالجة خاصة لكل صفحة
function handlePageSpecificLogic(pageId) {
    console.log(`جاري معالجة الصفحة: ${pageId}`);
    
    switch (pageId) {
        case 'publish':
            updatePublishPageUI();
            break;
        case 'profile':
            updateProfilePageUI();
            break;
    }
}

// تحديث واجهة صفحة النشر
function updatePublishPageUI() {
    if (!currentUser) {
        const publishContent = document.getElementById('publish-content');
        const loginRequired = document.getElementById('login-required-publish');
        if (publishContent && loginRequired) {
            publishContent.style.display = 'none';
            loginRequired.style.display = 'block';
        }
    } else {
        const publishContent = document.getElementById('publish-content');
        const loginRequired = document.getElementById('login-required-publish');
        if (publishContent && loginRequired) {
            publishContent.style.display = 'block';
            loginRequired.style.display = 'none';
        }
    }
}

// تحديث واجهة صفحة الملف الشخصي
function updateProfilePageUI() {
    if (!currentUser) {
        const profileContent = document.getElementById('profile-content');
        const loginRequired = document.getElementById('login-required-profile');
        if (profileContent && loginRequired) {
            profileContent.style.display = 'none';
            loginRequired.style.display = 'block';
        }
    } else {
        const profileContent = document.getElementById('profile-content');
        const loginRequired = document.getElementById('login-required-profile');
        if (profileContent && loginRequired) {
            profileContent.style.display = 'block';
            loginRequired.style.display = 'none';
            loadProfileData();
        }
    }
}

// معالجة تقديم نموذج النشر
async function handlePublishSubmit() {
    if (!currentUser) {
        showStatus('يجب تسجيل الدخول لنشر منشور', 'error');
        showPage('login');
        return;
    }
    
    const name = document.getElementById('name')?.value;
    const description = document.getElementById('description')?.value;
    const location = document.getElementById('location')?.value;
    const category = document.getElementById('category')?.value;
    const price = document.getElementById('price')?.value;
    const imageFile = document.getElementById('image')?.files[0];
    
    if (!name || !description || !location || !category || !price) {
        showStatus('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    let imageUrl = null;
    
    try {
        if (imageFile) {
            if (imageFile.size > 5 * 1024 * 1024) {
                showStatus('حجم الصورة كبير جداً. الحد الأقصى هو 5MB', 'error');
                return;
            }
            
            showStatus('جاري رفع الصورة...', 'success');
            imageUrl = await uploadImage(imageFile);
            
            if (!imageUrl) {
                showStatus('فشل في رفع الصورة', 'error');
                return;
            }
        }
        
        showStatus('جاري نشر المنشور...', 'success');
        const success = await addPost(name, description, location, category, price, imageUrl);
        
        if (success) {
            document.getElementById('publish-form').reset();
            showStatus('تم نشر المنشور بنجاح!', 'success');
            
            setTimeout(() => {
                const statusEl = document.getElementById('upload-status');
                if (statusEl) statusEl.style.display = 'none';
                showPage('home');
            }, 1500);
        } else {
            showStatus('فشل في نشر المنشور', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showStatus(`فشل في نشر المنشور: ${error.message}`, 'error');
    }
}

// معالجة تقديم نموذج تسجيل الدخول
async function handleLoginSubmit() {
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        showLoginStatus('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;
        
        currentUser = data.user;
        updateUIForAuth();
        showPage('home');
    } catch (error) {
        console.error('Error signing in:', error.message);
        showLoginStatus(`فشل تسجيل الدخول: ${error.message}`, 'error');
    }
}

// معالجة تقديم نموذج إنشاء حساب
async function handleRegisterSubmit() {
    const name = document.getElementById('register-name')?.value;
    const phone = document.getElementById('register-phone')?.value;
    const address = document.getElementById('register-address')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    const confirmPassword = document.getElementById('register-confirm-password')?.value;
    
    if (!name || !phone || !address || !email || !password || !confirmPassword) {
        showRegisterStatus('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showRegisterStatus('كلمة المرور غير متطابقة', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, phone: phone, address: address } }
        });
        
        if (error) throw error;
        
        showRegisterStatus('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول', 'success');
        document.getElementById('register-form').reset();
        
        setTimeout(() => showPage('login'), 2000);
    } catch (error) {
        console.error('Error signing up:', error.message);
        showRegisterStatus(`فشل في إنشاء الحساب: ${error.message}`, 'error');
    }
}

// وظائف التنقل بين الصفحات (معدلة)
async function showPage(pageId) {
    console.log(`جاري تحميل الصفحة: ${pageId}`);
    
    // إظهار رسالة تحميل
    document.getElementById('dynamic-content').innerHTML = `
        <div class="loading-page">
            <div class="loading-spinner"></div>
            <p>جاري تحميل الصفحة...</p>
        </div>
    `;
    
    try {
        await loadPageContent(pageId);
        console.log(`تم تحميل الصفحة بنجاح: ${pageId}`);
    } catch (error) {
        console.error(`فشل في تحميل الصفحة: ${pageId}`, error);
        document.getElementById('dynamic-content').innerHTML = `
            <div class="error-page">
                <h1 class="section-title">خطأ في تحميل الصفحة</h1>
                <p>تعذر تحميل الصفحة المطلوبة: ${error}</p>
                <button onclick="showPage('home')">العودة إلى الرئيسية</button>
            </div>
        `;
    }
    
    return false;
}

// تبديل وضع التصحيح
function toggleDebug() {
    debugMode = !debugMode;
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.style.display = debugMode ? 'block' : 'none';
        if (debugMode) loadDebugInfo();
    }
    return false;
}

// تحميل معلومات التصحيح
function loadDebugInfo() {
    const debugEl = document.getElementById('debug-info');
    if (debugEl) {
        debugEl.innerHTML = `
            <h3>معلومات التصحيح:</h3>
            <p>Supabase URL: ${SUPABASE_URL}</p>
            <p>Supabase Key: ${SUPABASE_KEY.substring(0, 20)}...</p>
            <p>تم تحميل الصفحة: ${new Date().toLocaleString('ar-SA')}</p>
            <p>حالة المستخدم: ${currentUser ? 'مسجل الدخول' : 'غير مسجل'}</p>
            <p>معلومات المتصفح: ${navigator.userAgent}</p>
            <p>الصفحة الحالية: ${window.location.href}</p>
        `;
    }
}

// تحميل بيانات الملف الشخصي
function loadProfileData() {
    if (currentUser) {
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profilePhone = document.getElementById('profile-phone');
        const profileAddress = document.getElementById('profile-address');
        const profileCreated = document.getElementById('profile-created');
        
        if (profileName) profileName.textContent = currentUser.user_metadata.full_name || 'غير محدد';
        if (profileEmail) profileEmail.textContent = currentUser.email;
        if (profilePhone) profilePhone.textContent = currentUser.user_metadata.phone || 'غير محدد';
        if (profileAddress) profileAddress.textContent = currentUser.user_metadata.address || 'غير محدد';
        if (profileCreated) profileCreated.textContent = new Date(currentUser.created_at).toLocaleString('ar-SA');
    }
}

// تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
function updateUIForAuth() {
    const publishLink = document.getElementById('publish-link');
    const profileLink = document.getElementById('profile-link');
    const logoutLink = document.getElementById('logout-link');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    
    if (currentUser) {
        if (publishLink) publishLink.style.display = 'list-item';
        if (profileLink) profileLink.style.display = 'list-item';
        if (logoutLink) logoutLink.style.display = 'list-item';
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
    } else {
        if (publishLink) publishLink.style.display = 'none';
        if (profileLink) profileLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'none';
        if (loginLink) loginLink.style.display = 'list-item';
        if (registerLink) registerLink.style.display = 'list-item';
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
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.textContent = `خطأ في المصادقة: ${error.message}`;
            connectionStatus.className = 'connection-status connection-error';
        }
    }
}

// الاستماع لتغيرات حالة المصادقة
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
        currentUser = session.user;
        updateUIForAuth();
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.textContent = 'تم تسجيل الدخول بنجاح';
            connectionStatus.className = 'connection-status connection-success';
            
            setTimeout(() => connectionStatus.style.display = 'none', 3000);
        }
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateUIForAuth();
    }
});

// تحميل المنشورات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    console.log('تم تحميل الصفحة، جاري التهيئة');
    
    await testConnection();
    await checkAuth();
    showPage('home');
});

// وظائف عرض الحالة
function showStatus(message, type) {
    const statusEl = document.getElementById('upload-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `upload-status ${type}`;
        statusEl.style.display = 'block';
    }
}

function showLoginStatus(message, type) {
    const statusEl = document.getElementById('login-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `upload-status ${type}`;
        statusEl.style.display = 'block';
    }
}

function showRegisterStatus(message, type) {
    const statusEl = document.getElementById('register-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `upload-status ${type}`;
        statusEl.style.display = 'block';
    }
}

// باقي الوظائف (loadPosts, displayPosts, uploadImage, addPost) تبقى كما هي
// تحميل المنشورات من Supabase
async function loadPosts() {
    try {
        const { data: posts, error } = await supabase
            .from('marketing')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        displayPosts(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.textContent = `خطأ في تحميل المنشورات: ${error.message}`;
            connectionStatus.className = 'connection-status connection-error';
        }
    }
}

// عرض المنشورات في الصفحة الرئيسية
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    
    postsContainer.innerHTML = '';
    
    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = '<p>لا توجد منشورات بعد.</p>';
        return;
    }
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        
        const imageHtml = post.image_url 
            ? `<img src="${post.image_url}" alt="${post.name}" class="post-image">`
            : `<div class="post-image no-image">لا توجد صورة</div>`;
        
        const formattedPrice = new Intl.NumberFormat('ar-YE').format(post.price) + " ريال يمني";
        
        postElement.innerHTML = `
            ${imageHtml}
            <h3 class="post-title">${post.name}</h3>
            <p class="post-description">${post.description}</p>
            <div class="post-details">
                <span class="post-detail post-price"><i class="fas fa-money-bill-wave"></i> ${formattedPrice}</span>
                <span class="post-detail"><i class="fas fa-tag"></i> ${post.category}</span>
                <span class="post-detail"><i class="fas fa-map-marker-alt"></i> ${post.location}</span>
            </div>
            <div class="post-author">
                <i class="fas fa-user"></i> 
                ${post.user_id ? `تم النشر بواسطة: ${post.user_id}` : 'مستخدم غير معروف'}
            </div>
            <small>${new Date(post.created_at).toLocaleString('ar-SA')}</small>
        `;
        postsContainer.appendChild(postElement);
    });
}

// رفع الصورة إلى Supabase Storage
async function uploadImage(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { data, error: uploadError } = await supabase.storage
            .from('marketing')
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
            .from('marketing')
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// إضافة منشور جديد إلى Supabase
async function addPost(name, description, location, category, price, imageUrl) {
    try {
        const { data, error } = await supabase
            .from('marketing')
            .insert([{ 
                name,
                description, 
                location,
                category,
                price,
                image_url: imageUrl,
                user_id: currentUser.email
            }]);
        
        if (error) throw error;
        
        loadPosts();
        return true;
    } catch (error) {
        console.error('Error adding post:', error);
        throw error;
    }
                }
