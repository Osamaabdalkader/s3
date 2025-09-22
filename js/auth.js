// auth.js
class Auth {
    // تسجيل الدخول
    static async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            currentUser = data.user;
            this.onAuthStateChange();
            Navigation.showPage('home');
            return true;
        } catch (error) {
            console.error('Error signing in:', error.message);
            Utils.showStatus(`فشل تسجيل الدخول: ${error.message}`, 'error', 'login-status');
            return false;
        }
    }

    // إنشاء حساب جديد
    static async register(userData) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: userData.email,
                password: userData.password,
                options: {
                    data: {
                        full_name: userData.name,
                        phone: userData.phone,
                        address: userData.address
                    }
                }
            });
            
            if (error) throw error;
            
            Utils.showStatus('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول', 'success', 'register-status');
            return true;
        } catch (error) {
            console.error('Error signing up:', error.message);
            Utils.showStatus(`فشل في إنشاء الحساب: ${error.message}`, 'error', 'register-status');
            return false;
        }
    }

    // تسجيل الخروج
    static async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            currentUser = null;
            this.onAuthStateChange();
            Navigation.showPage('home');
        } catch (error) {
            console.error('Error signing out:', error.message);
            alert(`خطأ في تسجيل الخروج: ${error.message}`);
        }
    }

    // التحقق من حالة المصادقة
    static async checkAuth() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            if (session?.user) {
                currentUser = session.user;
                this.onAuthStateChange();
            }
        } catch (error) {
            console.error('Error checking auth:', error.message);
            Utils.showStatus(`خطأ في المصادقة: ${error.message}`, 'error', 'connection-status');
        }
    }

    // معالجة تغيير حالة المصادقة
    static onAuthStateChange() {
        Navigation.updateNavigation();
        
        const connectionStatus = Utils.getElement('connection-status');
        if (currentUser && connectionStatus) {
            connectionStatus.textContent = 'تم تسجيل الدخول بنجاح';
            connectionStatus.className = 'connection-status connection-success';
            connectionStatus.style.display = 'block';
            
            setTimeout(() => {
                connectionStatus.style.display = 'none';
            }, CONFIG.SUCCESS_MESSAGE_DURATION);
        }
    }

    // الاستماع لتغيرات حالة المصادقة
    static initAuthListener() {
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                currentUser = session.user;
                this.onAuthStateChange();
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                this.onAuthStateChange();
            }
        });
    }
}