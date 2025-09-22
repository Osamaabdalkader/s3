let debugMode = false;

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

// وظائف التنقل بين الصفحات
function showPage(pageId) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // إظهار الصفحة المطلوبة
    document.getElementById(`${pageId}-page`).classList.add('active');
    
    // إذا كانت صفحة النشر وتحقق من حالة تسجيل الدخول
    if (pageId === 'publish') {
        if (!currentUser) {
            document.getElementById('publish-content').style.display = 'none';
            document.getElementById('login-required-publish').style.display = 'block';
        } else {
            document.getElementById('publish-content').style.display = 'block';
            document.getElementById('login-required-publish').style.display = 'none';
        }
    }
    
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
    
    return false;
}

// تحميل صفحة النشر
async function loadPublishPage() {
    const response = await fetch('publish.html');
    const content = await response.text();
    document.getElementById('app-content').innerHTML = content;
    setupPublishForm();
}

// إعداد نموذج النشر
function setupPublishForm() {
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
            }
        });
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

// عرض حالة الرفع
function showStatus(message, type) {
    const statusEl = document.getElementById('upload-status');
    statusEl.textContent = message;
    statusEl.className = 'upload-status';
    statusEl.classList.add(type);
    statusEl.style.display = 'block';
}

// إعداد التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    // اختبار الاتصال أولاً
    await testConnection();
    
    // ثم التحقق من المصادقة
    await checkAuth();
    
    // ثم تحميل المنشورات
    loadPosts();
    
    // إعداد أحداث التنقل
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('href').substring(1);
            if (pageId === 'publish') {
                loadPublishPage();
            } else {
                showPage(pageId);
            }
        });
    });
    
    // إعداد زر تسجيل الخروج
    document.getElementById('logout-button').addEventListener('click', logout);
    
    // إظهار الصفحة الرئيسية افتراضيًا
    showPage('home');
});