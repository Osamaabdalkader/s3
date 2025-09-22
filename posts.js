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
            return;
        }
        
        displayPosts(posts);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('connection-status').textContent = `خطأ في تحميل المنشورات: ${error.message}`;
        document.getElementById('connection-status').className = 'connection-status connection-error';
    }
}

// عرض المنشورات في الصفحة الرئيسية
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts-container');
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
            throw new Error(uploadError.message);
        }
        
        // الحصول على رابط الصورة
        const { data: { publicUrl } } = supabase.storage
            .from('marketing')
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error('Error:', error);
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
            throw new Error(error.message);
        }
        
        // إعادة تحميل المنشورات بعد الإضافة
        loadPosts();
        return true;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}