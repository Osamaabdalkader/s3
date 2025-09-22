// navigation.js
class Navigation {
    // عرض صفحة معينة
    static async showPage(pageId) {
        console.log(`جاري تحميل الصفحة: ${pageId}`);
        
        // إظهار رسالة تحميل
        Utils.getElement('dynamic-content').innerHTML = `
            <div class="loading-page">
                <div class="loading-spinner"></div>
                <p>جاري تحميل الصفحة...</p>
            </div>
        `;
        
        try {
            await Utils.loadPageContent(pageId);
            await this.initializePage(pageId);
            console.log(`تم تحميل الصفحة بنجاح: ${pageId}`);
        } catch (error) {
            console.error(`فشل في تحميل الصفحة: ${pageId}`, error);
            this.showErrorPage(error, pageId);
        }
    }

    // تهيئة الصفحة بعد تحميلها
    static async initializePage(pageId) {
        console.log(`جاري تهيئة الصفحة: ${pageId}`);
        
        // معالجة خاصة لكل صفحة
        switch (pageId) {
            case 'publish':
                this.handlePublishPage();
                break;
            case 'login':
                this.handleLoginPage();
                break;
            case 'register':
                this.handleRegisterPage();
                break;
            case 'profile':
                this.handleProfilePage();
                break;
            case 'home':
                Posts.loadPosts();
                break;
        }
    }

    // معالجة صفحة النشر
    static handlePublishPage() {
        if (!currentUser) {
            Utils.getElement('publish-content').style.display = 'none';
            Utils.getElement('login-required-publish').style.display = 'block';
        } else {
            Utils.getElement('publish-content').style.display = 'block';
            Utils.getElement('login-required-publish').style.display = 'none';
        }
    }

    // معالجة صفحة الملف الشخصي
    static handleProfilePage() {
        if (!currentUser) {
            Utils.getElement('profile-content').style.display = 'none';
            Utils.getElement('login-required-profile').style.display = 'block';
        } else {
            Utils.getElement('profile-content').style.display = 'block';
            Utils.getElement('login-required-profile').style.display = 'none';
            this.loadProfileData();
        }
    }

    // معالجة صفحة تسجيل الدخول
    static handleLoginPage() {
        // إعدادات إضافية إذا لزم الأمر
    }

    // معالجة صفحة إنشاء حساب
    static handleRegisterPage() {
        // إعدادات إضافية إذا لزم الأمر
    }

    // تحميل بيانات الملف الشخصي
    static loadProfileData() {
        if (currentUser) {
            Utils.getElement('profile-name').textContent = currentUser.user_metadata.full_name || 'غير محدد';
            Utils.getElement('profile-email').textContent = currentUser.email;
            Utils.getElement('profile-phone').textContent = currentUser.user_metadata.phone || 'غير محدد';
            Utils.getElement('profile-address').textContent = currentUser.user_metadata.address || 'غير محدد';
            Utils.getElement('profile-created').textContent = new Date(currentUser.created_at).toLocaleString('ar-SA');
        }
    }

    // عرض صفحة الخطأ
    static showErrorPage(error, pageId) {
        Utils.getElement('dynamic-content').innerHTML = `
            <div class="error-page">
                <h1 class="section-title">خطأ في تحميل الصفحة</h1>
                <p>تعذر تحميل الصفحة المطلوبة: ${pageId}</p>
                <p>الخطأ: ${error.message}</p>
                <button onclick="Navigation.showPage('home')">العودة إلى الرئيسية</button>
            </div>
        `;
    }

    // تحديث واجهة التنقل بناءً على حالة المستخدم
    static updateNavigation() {
        const elements = {
            'publish-link': currentUser,
            'profile-link': currentUser,
            'logout-link': currentUser,
            'login-link': !currentUser,
            'register-link': !currentUser
        };

        for (const [id, shouldShow] of Object.entries(elements)) {
            const element = Utils.getElement(id);
            if (element) {
                element.style.display = shouldShow ? 'list-item' : 'none';
            }
        }
    }
}