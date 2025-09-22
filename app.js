// تهيئة Supabase
const SUPABASE_URL = 'https://rrjocpzsyxefcsztazkd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyam9jcHpzeXhlZmNzenRhemtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTEzMTgsImV4cCI6MjA3Mzg2NzMxOH0.TvUthkBc_lnDdGlHJdEFUPo4Dl2n2oHyokXZE8_wodw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let debugMode = false;
let currentUser = null;

// خريطة الصفحات وملفاتها
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
            
            if (debugMode) {
                const debugEl = document.getElementById('debug-info');
                if (debugEl) {
                    debugEl.innerHTML += `<p>خطأ الاتصال: ${error.message}</p>`;
                }
            }
        } else {
            console.log('اتصال Supabase ناجح');
            connectionStatus.textContent = 'الاتصال مع قاعدة البيانات ناجح';
            connectionStatus.className = 'connection-status connection-success';
            
            // إخفاء رسالة النجاح بعد 3 ثوان
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

// تحميل محتوى الصفحة من ملف منفصل
async function loadPageContent(pageId) {
    console.log(`جاري تحميل الصفحة: ${pageId}`);
    
    if (!pageFiles[pageId]) {
        console.error('الصفحة غير معروفة:', pageId);
        document.getElementById('dynamic-content').innerHTML = `<p>الصفحة غير موجودة: ${pageId}</p>`;
        return false;
    }

    try {
        const response = await fetch(pageFiles[pageId]);
        if (!response.ok) {
            throw new Error(`فشل في تحميل صفحة ${pageId}: ${response.status}`);
        }
        const html = await response.text();
        
        // إضافة المحتوى إلى منطقة المحتوى الديناميكي
        document.getElementById('dynamic-content').innerHTML = html;
        
        // بعد تحميل المحتوى، نقوم بربط الأحداث الخاصة بالصفحة
        bindPageEvents(pageId);
        
        // معالجة خاصة لكل صفحة
        handlePageSpecificLogic(pageId);
        
        console.log(`تم تحميل الصفحة بنجاح: ${pageId}`);
        return true;
    } catch (error) {
        console.error(`خطأ في تحميل صفحة ${pageId}:`, error);
        document.getElementById('dynamic-content').innerHTML = `
            <div class="page">
                <h1 class="section-title">خطأ في تحميل الصفحة</h1>
                <p>تعذر تحميل الصفحة المطلوبة: ${error.message}</p>
                <button onclick="showPage('home')">العودة إلى الرئيسية</button>
            </div>
        `;
        return false;
    }
}

// ربط أحداث الصفحة بعد تحميلها
function bindPageEvents(pageId) {
    console.log(`جاري ربط أحداث الصفحة: ${pageId}`);
    
    switch (pageId) {
        case 'publish':
            bindPublishFormEvents();
            break;
        case 'login':
            bindLoginFormEvents();
            break;
        case 'register':
            bindRegisterFormEvents();
            break;
        case 'profile':
            // لا تحتاج صفحة الملف الشخصي إلى ربط أحداث خاصة
            break;
        case 'home':
            // تحميل المنشورات للصفحة الرئيسية
            loadPosts();
            break;
    }
}

// معالجة خاصة لكل صفحة
function handlePageSpecificLogic(pageId) {
    console.log(`جاري معالجة الصفحة: ${pageId}`);
    
    switch (pageId) {
        case 'publish':
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
            break;
        case 'profile':
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
            break;
    }
}

// ربط أحداث نموذج النشر
function bindPublishFormEvents() {
    const publishForm = document.getElementById('publish-form');
    if (publishForm) {
        console.log('تم العثور على نموذج النشر، جاري ربط الأحداث');
        
        // إزالة أي مستمعين سابقين
        const newForm = publishForm.cloneNode(true);
        publishForm.parentNode.replaceChild(newForm, publishForm);
        
        // إعادة الحصول على النموذج بعد الاستبدال
        const freshForm = document.getElementById('publish-form');
        
        freshForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('تم تقديم نموذج النشر');
            
            if (!currentUser) {
                showStatus('يجب تسجيل الدخول لنشر منشور', 'error');
                showPage('login');
                return;
            }
            
            const name = document.getElementById('name').value;
            const description = document.getElementById('description').value;
            const location = document.getElementById('location').value;
            const category = document.getElementById('category').value;
            const price = document.getElementById('price').value;
            const imageFile = document.getElementById('image').files[0];
            
            let imageUrl = null;
            
            try {
                // إذا تم رفع صورة
                if (imageFile) {
                    // التحقق من حجم الصورة
                    if (imageFile.size > 5 * 1024 * 1024) {
                        showStatus('حجم الصورة كبير جداً. الحد الأقصى هو 5MB', 'error');
                        return;
                    }
                    
                    showStatus('جاري رفع الصورة...', 'success');
                    
                    // رفع الصورة إلى Supabase Storage
                    imageUrl = await uploadImage(imageFile);
                    
                    if (!imageUrl) {
                        showStatus('فشل في رفع الصورة', 'error');
                        return;
                    }
                }
                
                if (name && description && location && category && price) {
                    showStatus('جاري نشر المنشور...', 'success');
                    
                    const success = await addPost(name, description, location, category, price, imageUrl);
                    
                    if (success) {
                        // إعادة تعيين النموذج
                        document.getElementById('publish-form').reset();
                        
                        // إظهار رسالة نجاح
                        showStatus('تم نشر المنشور بنجاح!', 'success');
                        
                        // الانتظار قليلاً ثم العودة إلى الصفحة الرئيسية
                        setTimeout(() => {
                            const statusEl = document.getElementById('upload-status');
                            if (statusEl) {
                                statusEl.classList.remove('success');
                                statusEl.style.display = 'none';
                            }
                            showPage('home');
                        }, 1500);
                    } else {
                        showStatus('فشل في نشر المنشور', 'error');
                    }
                } else {
                    showStatus('يرجى ملء جميع الحقول المطلوبة', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showStatus(`فشل في نشر المنشور: ${error.message}`, 'error');
                
                if (debugMode) {
                    const debugEl = document.getElementById('debug-info');
                    if (debugEl) {
                        debugEl.innerHTML += `<p>خطأ: ${error.message}</p>`;
                    }
                }
            }
        });
    } else {
        console.error('لم يتم العثور على نموذج النشر');
    }
}

// ربط أحداث نموذج تسجيل الدخول
function bindLoginFormEvents() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        console.log('تم العثور على نموذج تسجيل الدخول، جاري ربط الأحداث');
        
        // إزالة أي مستمعين سابقين
        const newForm = loginForm.cloneNode(true);
        loginForm.parentNode.replaceChild(newForm, loginForm);
        
        // إعادة الحصول على النموذج بعد الاستبدال
        const freshForm = document.getElementById('login-form');
        
        freshForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('تم تقديم نموذج تسجيل الدخول');
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
                
                currentUser = data.user;
                updateUIForAuth();
                showPage('home');
            } catch (error) {
                console.error('Error signing in:', error.message);
                const statusEl = document.getElementById('login-status');
                if (statusEl) {
                    statusEl.textContent = `فشل تسجيل الدخول: ${error.message}`;
                    statusEl.className = 'upload-status error';
                    statusEl.style.display = 'block';
                }
            }
        });
    } else {
        console.error('لم يتم العثور على نموذج تسجيل الدخول');
    }
}

// ربط أحداث نموذج إنشاء حساب
function bindRegisterFormEvents() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        console.log('تم العثور على نموذج إنشاء حساب، جاري ربط الأحداث');
        
        // إزالة أي مستمعين سابقين
        const newForm = registerForm.cloneNode(true);
        registerForm.parentNode.replaceChild(newForm, registerForm);
        
        // إعادة الحصول على النموذج بعد الاستبدال
        const freshForm = document.getElementById('register-form');
        
        freshForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('تم تقديم نموذج إنشاء حساب');
            
            const name = document.getElementById('register-name').value;
            const phone = document.getElementById('register-phone').value;
            const address = document.getElementById('register-address').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            // التحقق من تطابق كلمة المرور
            if (password !== confirmPassword) {
                const statusEl = document.getElementById('register-status');
                if (statusEl) {
                    statusEl.textContent = 'كلمة المرور غير متطابقة';
                    statusEl.className = 'upload-status error';
                    statusEl.style.display = 'block';
                }
                return;
            }
            
            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                            phone: phone,
                            address: address
                        }
                    }
                });
                
                if (error) throw error;
                
                const statusEl = document.getElementById('register-status');
                if (statusEl) {
                    statusEl.textContent = 'تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول';
                    statusEl.className = 'upload-status success';
                    statusEl.style.display = 'block';
                }
                
                // إعادة تعيين النموذج
                document.getElementById('register-form').reset();
                
                // الانتظار قليلاً ثم الانتقال إلى صفحة تسجيل الدخول
                setTimeout(() => {
                    showPage('login');
                }, 2000);
            } catch (error) {
                console.error('Error signing up:', error.message);
                const statusEl = document.getElementById('register-status');
                if (statusEl) {
                    statusEl.textContent = `فشل في إنشاء الحساب: ${error.message}`;
                    statusEl.className = 'upload-status error';
                    statusEl.style.display = 'block';
                }
            }
        });
    } else {
        console.error('لم يتم العثور على نموذج إنشاء حساب');
    }
}

// وظائف التنقل بين الصفحات
function showPage(pageId) {
    console.log(`جاري تحميل الصفحة: ${pageId}`);
    
    // مسح المحتوى الديناميكي
    document.getElementById('dynamic-content').innerHTML = '<div class="loading">جاري التحميل...</div>';
    
    // تحميل الصفحة المطلوبة
    loadPageContent(pageId);
    
    return false;
}

// تبديل وضع التصحيح
function toggleDebug() {
    debugMode = !debugMode;
    const debugInfo = document.getElementById('debug-info');
    if (debugInfo) {
        debugInfo.style.display = debugMode ? 'block' : 'none';
        if (debugMode) {
            loadDebugInfo();
        }
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
            
            setTimeout(() => {
                connectionStatus.style.display = 'none';
            }, 3000);
        }
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        updateUIForAuth();
    }
});

// تحميل المنشورات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    console.log('تم تحميل الصفحة، جاري التهيئة');
    
    // اختبار الاتصال أولاً
    await testConnection();
    
    // ثم التحقق من المصادقة
    await checkAuth();
    
    // تحميل الصفحة الرئيسية عند البدء
    showPage('home');
});

// عرض حالة الرفع
function showStatus(message, type) {
    const statusEl = document.getElementById('upload-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'upload-status';
        statusEl.classList.add(type);
        statusEl.style.display = 'block';
    }
}

// تحميل المنشورات من Supabase
async function loadPosts() {
    try {
        const { data: posts, error } = await supabase
            .from('marketing')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading posts:', error);
            const connectionStatus = document.getElementById('connection-status');
            if (connectionStatus) {
                connectionStatus.textContent = `خطأ في تحميل المنشورات: ${error.message}`;
                connectionStatus.className = 'connection-status connection-error';
            }
            
            if (debugMode) {
                const debugEl = document.getElementById('debug-info');
                if (debugEl) {
                    debugEl.innerHTML += `<p>خطأ في تحميل المنشورات: ${error.message}</p>`;
                }
            }
            return;
        }
        
        displayPosts(posts);
    } catch (error) {
        console.error('Error:', error);
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.textContent = `خطأ في تحميل المنشورات: ${error.message}`;
            connectionStatus.className = 'connection-status connection-error';
        }
        
        if (debugMode) {
            const debugEl = document.getElementById('debug-info');
            if (debugEl) {
                debugEl.innerHTML += `<p>خطأ في تحميل المنشورات: ${error.message}</p>`;
            }
        }
    }
}

// عرض المنشورات في الصفحة الرئيسية
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) {
        console.error('لم يتم العثور على حاوية المنشورات');
        return;
    }
    
    postsContainer.innerHTML = '';
    
    if (!posts || posts.length === 0) {
        postsContainer.innerHTML = '<p>لا توجد منشورات بعد.</p>';
        return;
    }
    
    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-card';
        
        // إضافة صورة إذا كانت موجودة
        const imageHtml = post.image_url 
            ? `<img src="${post.image_url}" alt="${post.name}" class="post-image">`
            : `<div class="post-image no-image">لا توجد صورة</div>`;
        
        // تنسيق السعر
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
        // إنشاء اسم فريد للصورة
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        // رفع الصورة إلى bucket المسمى "marketing"
        const { data, error: uploadError } = await supabase.storage
            .from('marketing')
            .upload(filePath, file);
        
        if (uploadError) {
            console.error('Error uploading image:', uploadError);
            if (debugMode) {
                const debugEl = document.getElementById('debug-info');
                if (debugEl) {
                    debugEl.innerHTML += `<p>خطأ في رفع الصورة: ${uploadError.message}</p>`;
                }
            }
            throw new Error(uploadError.message);
        }
        
        // الحصول على رابط الصورة
        const { data: { publicUrl } } = supabase.storage
            .from('marketing')
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error('Error:', error);
        if (debugMode) {
            const debugEl = document.getElementById('debug-info');
            if (debugEl) {
                debugEl.innerHTML += `<p>خطأ في رفع الصورة: ${error.message}</p>`;
            }
        }
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
                user_id: currentUser.email // استخدام البريد الإلكتروني كمعرف للمستخدم
            }]);
        
        if (error) {
            console.error('Error adding post:', error);
            if (debugMode) {
                const debugEl = document.getElementById('debug-info');
                if (debugEl) {
                    debugEl.innerHTML += `<p>خطأ في إضافة المنشور: ${error.message}</p>`;
                }
            }
            throw new Error(error.message);
        }
        
        // إعادة تحميل المنشورات بعد الإضافة
        loadPosts();
        return true;
    } catch (error) {
        console.error('Error:', error);
        if (debugMode) {
            const debugEl = document.getElementById('debug-info');
            if (debugEl) {
                debugEl.innerHTML += `<p>خطأ في إضافة المنشور: ${error.message}</p>`;
            }
        }
        throw error;
    }
}
