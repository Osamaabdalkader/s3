// app.js
class App {
    // تهيئة التطبيق
    static async init() {
        console.log('تهيئة التطبيق...');
        
        // اختبار الاتصال
        await this.testConnection();
        
        // التحقق من المصادقة
        await Auth.checkAuth();
        
        // تهيئة مستمع المصادقة
        Auth.initAuthListener();
        
        // تحميل الصفحة الرئيسية
        Navigation.showPage('home');
        
        console.log('تم تهيئة التطبيق بنجاح');
    }

    // اختبار اتصال Supabase
    static async testConnection() {
        try {
            const { data, error } = await supabase.from('marketing').select('count');
            
            if (error) {
                throw error;
            } else {
                Utils.showStatus('الاتصال مع قاعدة البيانات ناجح', 'success', 'connection-status');
            }
        } catch (error) {
            Utils.showStatus(`خطأ في الاتصال: ${error.message}`, 'error', 'connection-status');
        }
    }

    // معالجة النماذج (Event Delegation)
    static handleFormSubmit(formId, formData) {
        switch (formId) {
            case 'publish-form':
                this.handlePublishForm(formData);
                break;
            case 'login-form':
                this.handleLoginForm(formData);
                break;
            case 'register-form':
                this.handleRegisterForm(formData);
                break;
        }
    }

    // معالجة نموذج النشر
    static async handlePublishForm(formData) {
        if (!currentUser) {
            Utils.showStatus('يجب تسجيل الدخول لنشر منشور', 'error');
            Navigation.showPage('login');
            return;
        }

        try {
            let imageUrl = null;
            
            if (formData.imageFile) {
                Utils.showStatus('جاري رفع الصورة...', 'success');
                imageUrl = await Posts.uploadImage(formData.imageFile);
            }

            Utils.showStatus('جاري نشر المنشور...', 'success');
            await Posts.addPost({ ...formData, imageUrl });
            
            Utils.showStatus('تم نشر المنشور بنجاح!', 'success');
            setTimeout(() => Navigation.showPage('home'), 1500);
            
        } catch (error) {
            Utils.showStatus(`فشل في النشر: ${error.message}`, 'error');
        }
    }

    // معالجة نموذج تسجيل الدخول
    static async handleLoginForm(formData) {
        await Auth.login(formData.email, formData.password);
    }

    // معالجة نموذج إنشاء حساب
    static async handleRegisterForm(formData) {
        if (formData.password !== formData.confirmPassword) {
            Utils.showStatus('كلمة المرور غير متطابقة', 'error', 'register-status');
            return;
        }

        const success = await Auth.register(formData);
        if (success) {
            setTimeout(() => Navigation.showPage('login'), 2000);
        }
    }

    // تبديل وضع التصحيح
    static toggleDebug() {
        debugMode = !debugMode;
        const debugInfo = Utils.getElement('debug-info');
        if (debugInfo) {
            debugInfo.style.display = debugMode ? 'block' : 'none';
            if (debugMode) {
                Utils.loadDebugInfo();
            }
        }
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// event delegation للمحتوى الديناميكي
document.getElementById('dynamic-content').addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.type === 'submit') {
        event.preventDefault();
        const form = event.target.closest('form');
        if (form) {
            const formData = new FormData(form);
            App.handleFormSubmit(form.id, Object.fromEntries(formData));
        }
    }
});