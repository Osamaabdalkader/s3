// auth.js - معدل
class Auth {
    static async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password.trim()
            });

            if (error) {
                // تحسين رسائل الخطأ
                let errorMessage = 'فشل تسجيل الدخول';
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = 'يرجى تأكيد البريد الإلكتروني أولاً';
                }
                throw new Error(errorMessage);
            }

            currentUser = data.user;
            this.onAuthStateChange();
            
            // إظهار رسالة نجاح
            Utils.showStatus('تم تسجيل الدخول بنجاح!', 'success', 'login-status');
            
            // الانتقال إلى الصفحة الرئيسية بعد نجاح التسجيل
            setTimeout(() => {
                Navigation.showPage('home');
            }, 1000);

            return true;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    static async register(userData) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: userData.email.trim(),
                password: userData.password.trim(),
                options: {
                    data: {
                        full_name: userData.name.trim(),
                        phone: userData.phone.trim(),
                        address: userData.address.trim()
                    }
                }
            });

            if (error) {
                let errorMessage = 'فشل في إنشاء الحساب';
                if (error.message.includes('User already registered')) {
                    errorMessage = 'هذا البريد الإلكتروني مسجل مسبقاً';
                } else if (error.message.includes('Password should be at least')) {
                    errorMessage = 'كلمة المرور يجب أن تكون أقوى';
                }
                throw new Error(errorMessage);
            }

            // إعادة تعيين النموذج بعد النجاح
            const form = document.getElementById('register-form');
            if (form) form.reset();

            Utils.showStatus('تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول', 'success', 'register-status');
            
            // الانتقال إلى صفحة تسجيل الدخول بعد إنشاء الحساب
            setTimeout(() => {
                Navigation.showPage('login');
            }, 2000);

            return true;
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    }

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
        }
    }

    static onAuthStateChange() {
        Navigation.updateNavigation();
        
        if (currentUser) {
            Utils.showStatus('تم تسجيل الدخول بنجاح', 'success', 'connection-status');
        }
    }

    static initAuthListener() {
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            
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
