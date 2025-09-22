// posts.js
class Posts {
    // تحميل المنشورات
    static async loadPosts() {
        try {
            const { data: posts, error } = await supabase
                .from('marketing')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.displayPosts(posts);
        } catch (error) {
            console.error('Error loading posts:', error);
            Utils.showStatus(`خطأ في تحميل المنشورات: ${error.message}`, 'error', 'connection-status');
        }
    }

    // عرض المنشورات
    static displayPosts(posts) {
        const postsContainer = Utils.getElement('posts-container');
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
            
            postElement.innerHTML = `
                ${imageHtml}
                <h3 class="post-title">${post.name}</h3>
                <p class="post-description">${post.description}</p>
                <div class="post-details">
                    <span class="post-detail post-price"><i class="fas fa-money-bill-wave"></i> ${Utils.formatPrice(post.price)}</span>
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

    // إضافة منشور جديد
    static async addPost(postData) {
        try {
            const { data, error } = await supabase
                .from('marketing')
                .insert([{ 
                    name: postData.name,
                    description: postData.description, 
                    location: postData.location,
                    category: postData.category,
                    price: postData.price,
                    image_url: postData.imageUrl,
                    user_id: currentUser.email
                }]);
            
            if (error) throw error;
            
            this.loadPosts();
            return true;
        } catch (error) {
            console.error('Error adding post:', error);
            throw error;
        }
    }

    // رفع صورة
    static async uploadImage(file) {
        try {
            if (file.size > CONFIG.MAX_IMAGE_SIZE) {
                throw new Error('حجم الصورة كبير جداً');
            }
            
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
}