// app.js - الكود الرئيسي (محدث بالكامل)
class App {
    static async init() {
        console.log('تهيئة التطبيق...');
        
        await this.testConnection();
        await Auth.checkAuth();
        Auth.initAuthListener();
        Navigation.showPage('home');
        
        // إعداد معالجة الأحداث العالمية
        this.setupGlobalEventHandlers();
        
        console.log('تم تهيئة التطبيق بنجاح');
    }

    static async testConnection() {
        try {
            const { data, error } = await supabase.from('marketing').select('count');
            if (error) throw error;
            Utils.showStatus('الاتصال مع قاعدة البيانات ناجح', 'success', 'connection-status');
        } catch (error) {
            Utils.showStatus(`خطأ في الاتصال: ${error.message}`, 'error', 'connection-status');
        }
    }

    // إعداد معالجات الأحداث العالمية
    static setupGlobalEventHandlers() {
        // معالجة النقر على المحتوى الديناميكي
        document.addEventListener('click', (event) => {
            this.handleGlobalClick(event);
        });

        // معالجة تقديم النماذج
        document.addEventListener('submit', (event) => {
            this.handleGlobalSubmit(event);
        });
    }

    // معالجة النقر العالمية
    static handleGlobalClick(event) {
        const target = event.target;
        
        // النقر على أزرار التنقل
        if (target.closest('a[onclick]')) {
            const onclick = target.closest('a[onclick]').getAttribute('onclick');
            if (onclick.includes('showPage')) {
                event.preventDefault();
                return;
            }
        }

        // النقر على أزرار داخل المحتوى الديناميكي
        if (target.closest('#dynamic-content')) {
            this.handleDynamicContentClick(event);
        }
    }

    // معالجة التقديم العالمية
    static handleGlobalSubmit(event) {
        if (event.target.tagName === 'FORM') {
            event.preventDefault();
            this.handleFormSubmit(event.target);
        }
    }

    // معالجة النماذج
    static async handleFormSubmit(form) {
        const formId = form.id;
        const formData = new FormData(form);
        
        console.log('معالجة النموذج:', formId);

        switch (formId) {
            case 'login-form':
                await this.handleLoginForm(formData);
                break;
            case 'register-form':
                await this.handleRegisterForm(formData);
                break;
            case 'publish-form':
                await this.handlePublishForm(formData);
                break;
            default:
                console.warn('نموذج غير معروف:', formId);
        }
    }

    // معالجة نموذج تسجيل الدخول
    static async handleLoginForm(formData) {
        const email = formData.get('email');
        const password = formData.get('password');

        if (!email || !password) {
            Utils.showStatus('يرجى ملء جميع الحقول', 'error', 'login-status');
            return;
        }

        try {
            Utils.showStatus('جاري تسجيل الدخول...', 'success', 'login-status');
            await Auth.login(email, password);
        } catch (error) {
            Utils.showStatus(`فشل تسجيل الدخول: ${error.message}`, 'error', 'login-status');
        }
    }

    // معالجة نموذج إنشاء حساب
    static async handleRegisterForm(formData) {
        const userData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirm-password')
        };

        // التحقق من البيانات
        if (!userData.name || !userData.phone || !userData.address || !userData.email || !userData.password) {
            Utils.showStatus('يرجى ملء جميع الحقول', 'error', 'register-status');
            return;
        }

        if (userData.password !== userData.confirmPassword) {
            Utils.showStatus('كلمة المرور غير متطابقة', 'error', 'register-status');
            return;
        }

        try {
            Utils.showStatus('جاري إنشاء الحساب...', 'success', 'register-status');
            await Auth.register(userData);
        } catch (error) {
            Utils.showStatus(`فشل في إنشاء الحساب: ${error.message}`, 'error', 'register-status');
        }
    }

    // معالجة نموذج النشر
    static async handlePublishForm(formData) {
        if (!currentUser) {
            Utils.showStatus('يجب تسجيل الدخول لنشر منشور', 'error');
            Navigation.showPage('login');
            return;
        }

        const postData = {
            name: formData.get('name'),
            description: formData.get('description'),
            location: formData.get('location'),
            category: formData.get('category'),
            price: formData.get('price'),
            imageFile: formData.get('image')
        };

        if (!postData.name || !postData.description || !postData.location || !postData.category || !postData.price) {
            Utils.showStatus('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        try {
            Utils.showStatus('جاري نشر المنشور...', 'success');
            await Posts.publishPost(postData);
            Utils.showStatus('تم نشر المنشور بنجاح!', 'success');
            
            setTimeout(() => {
                Navigation.showPage('home');
            }, 1500);
        } catch (error) {
            Utils.showStatus(`فشل في النشر: ${error.message}`, 'error');
        }
    }

    // معالجة النقر على المحتوى الديناميكي
    static handleDynamicContentClick(event) {
        const target = event.target;
        
        // معالجة أزرار التنقل داخل المحتوى الديناميكي
        if (target.tagName === 'BUTTON' && target.onclick) {
            const onclick = target.getAttribute('onclick');
            if (onclick && onclick.includes('showPage')) {
                event.preventDefault();
                return false;
            }
        }
    }

    static toggleDebug() {
        debugMode = !debugMode;
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.style.display = debugMode ? 'block' : 'none';
            if (debugMode) Utils.loadDebugInfo();
        }
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
