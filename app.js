// تهيئة Supabase
const SUPABASE_URL = 'https://rrjocpzsyxefcsztazkd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyam9jcHpzeXhlZmNzenRhemtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTEzMTgsImV4cCI6MjA3Mzg2NzMxOH0.TvUthkBc_lnDdGlHJdEFUPo4Dl2n2oHyokXZE8_wodw';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let debugMode = false;
let currentUser = null;

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
                debugEl.innerHTML += `<p>خطأ الاتصال: ${error.message}</p>`;
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

// تحميل محتوى صفحة النشر من ملف منفصل
async function loadPublishPage() {
    try {
        const response = await fetch('add-post.html');
        if (!response.ok) {
            throw new Error('فشل في تحميل صفحة النشر');
        }
        const html = await response.text();
        document.getElementById('dynamic-content').innerHTML = html;
        
        // بعد تحميل المحتوى، نقوم بربط الأحداث
        bindPublishFormEvents();
        
        // التحقق من حالة تسجيل الدخول
        if (!currentUser) {
            document.getElementById('publish-content').style.display = 'none';
            document.getElementById('login-required-publish').style.display = 'block';
        } else {
            document.getElementById('publish-content').style.display = 'block';
            document.getElementById('login-required-publish').style.display = 'none';
        }
        
        return true;
    } catch (error) {
        console.error('Error loading publish page:', error);
        document.getElementById('dynamic-content').innerHTML = '<p>خطأ في تحميل صفحة النشر</p>';
        return false;
    }
}

// ربط أحداث نموذج النشر
function bindPublishFormEvents() {
    const publishForm = document.getElementById('publish-form');
    if (publishForm) {
        publishForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
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
                            document.getElementById('upload-status').classList.remove('success');
                            document.getElementById('upload-status').style.display = 'none';
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
                    debugEl.innerHTML += `<p>خطأ: ${error.message}</p>`;
                }
            }
        });
    }
}

// وظائف التنقل بين الصفحات
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById('dynamic-content').innerHTML = '';
    
    if (pageId === 'publish') {
        loadPublishPage();
    } else {
        document.getElementById(`${pageId}-page`).classList.add('active');
        
        // إذا كانت صفحة الملف الشخصي وتحقق من حالة تسجيل الدخول
        if (pageId === 'profile') {
            if (!currentUser) {
                document.getElementById('profile-content').style.display = 'none';
                document.getElementById('login-required-profile').style.display = 'block';
            } else {
                document.getElementById('profile-content').style.display = 'block';
                document.getElementById('login-required-profile').style.display = 'none';
                loadProfileData();
            }
        }
        
        // إذا كانت الصفحة الرئيسية، تحميل المنشورات
        if (pageId === 'home') {
            loadPosts();
        }
    }
    
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
        document.getElementById('profile-name').textContent = currentUser.user_metadata.full_name || 'غير محدد';
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('profile-phone').textContent = currentUser.user_metadata.phone || 'غير محدد';
        document.getElementById('profile-address').textContent = currentUser.user_metadata.address || 'غير محدد';
        document.getElementById('profile-created').textContent = new Date(currentUser.created_at).toLocaleString('ar-SA');
    }
}

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

// تحميل المنشورات عند فتح الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    // اختبار الاتصال أولاً
    await testConnection();
    
    // ثم التحقق من المصادقة
    await checkAuth();
    
    // ثم تحميل المنشورات
    loadPosts();
    
    // إعداد نموذج تسجيل الدخول
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
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
            document.getElementById('login-status').textContent = `فشل تسجيل الدخول: ${error.message}`;
            document.getElementById('login-status').className = 'upload-status error';
            document.getElementById('login-status').style.display = 'block';
        }
    });
    
    // إعداد نموذج إنشاء حساب
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const phone = document.getElementById('register-phone').value;
        const address = document.getElementById('register-address').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // التحقق من تطابق كلمة المرور
        if (password !== confirmPassword) {
            document.getElementById('register-status').textContent = 'كلمة المرور غير متطابقة';
            document.getElementById('register-status').className = 'upload-status error';
            document.getElementById('register-status').style.display = 'block';
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
            
            document.getElementById('register-status').textContent = 'تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول';
            document.getElementById('register-status').className = 'upload-status success';
            document.getElementById('register-status').style.display = 'block';
            
            // إعادة تعيين النموذج
            document.getElementById('register-form').reset();
            
            // الانتظار قليلاً ثم الانتقال إلى صفحة تسجيل الدخول
            setTimeout(() => {
                showPage('login');
            }, 2000);
        } catch (error) {
            console.error('Error signing up:', error.message);
            document.getElementById('register-status').textContent = `فشل في إنشاء الحساب: ${error.message}`;
            document.getElementById('register-status').className = 'upload-status error';
            document.getElementById('register-status').style.display = 'block';
        }
    });
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
            document.getElementById('connection-status').textContent = `خطأ في تحميل المنشورات: ${error.message}`;
            document.getElementById('connection-status').className = 'connection-status connection-error';
            
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
        document.getElementById('connection-status').textContent = `خطأ في تحميل المنشورات: ${error.message}`;
        document.getElementById('connection-status').className = 'connection-status connection-error';
        
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
    if (!postsContainer) return;
    
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
