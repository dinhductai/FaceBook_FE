document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  try {
    // Lấy fullName và profileUrl
    const res = await fetch('http://localhost:8080/api/user-name-profile', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    // Kiểm tra nếu bị lỗi 401 (Unauthorized)
  if (res.status === 401) {
    alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
    return;
  }

    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      // Thay avatar lớn
      const avatarEl = document.getElementById('profile-avatar');
      if (avatarEl) avatarEl.src = d.profileUrl || '';
      // Thay avatar nhỏ trên topbar
      const fbAvatar = document.querySelector('.fb-avatar');
      if (fbAvatar) fbAvatar.src = d.profileUrl || '';
      // Thay tên nếu muốn
      const nameEl = document.getElementById('profile-fullname');
      if (nameEl) nameEl.textContent = d.fullName || '';
    }
  } catch (err) {
    console.error('Lỗi lấy avatar:', err);
  }

  try {
    const res = await fetch('http://localhost:8080/api/user-profile', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      // Cập nhật tên user vào profile
      const nameEl = document.getElementById('profile-fullname');
      if (nameEl) nameEl.textContent = d.fullName || '';
      const profileBioEl = document.getElementById('profile-bio');
      if (profileBioEl) {profileBioEl.innerHTML = `<i class="fas fa-quote-left"></i> ${d.bio || ''}`; }
      // Xử lý dữ liệu trả về
      const userDetail = document.querySelector('.user-details');
      if (userDetail) {
        userDetail.innerHTML = `
          <p><strong><i class="fas fa-user"></i> Họ tên:</strong> ${d.fullName || ''}</p>
          <p><strong><i class="fas fa-phone"></i> Số điện thoại:</strong> ${d.phoneNumber || ''}</p>
          <p><strong><i class="fas fa-birthday-cake"></i> Ngày sinh:</strong> ${d.birthDate ? new Date(d.birthDate).toLocaleDateString('vi-VN') : ''}</p>
          <p><strong><i class="fas fa-mars"></i> Giới tính:</strong> ${d.gender || ''}</p>
          <p><strong><i class="fas fa-search"></i> Đang tìm kiếm:</strong> ${d.lookingFor || ''}</p>
          <p><strong><i class="fas fa-ruler-vertical"></i> Chiều cao:</strong> ${d.height || ''}</p>
          <p><strong><i class="fas fa-weight"></i> Cân nặng:</strong> ${d.weight || ''}</p>
          <p><strong><i class="fas fa-map-marker-alt"></i> Địa chỉ:</strong> ${d.location || ''}</p>
          <p><strong><i class="fas fa-briefcase"></i> Vị trí:</strong> ${d.jobTitle || ''}</p>
          <p><strong><i class="fas fa-building"></i> Công ty:</strong> ${d.company || ''}</p>
          <p><strong><i class="fas fa-graduation-cap"></i> Học vấn:</strong> ${d.education || ''}</p>
          <p><strong><i class="fas fa-info-circle"></i> Mô tả:</strong> ${d.description || ''}</p>
          <p><strong><i class="fas fa-star"></i> Sở thích:</strong> ${Array.isArray(d.interestName) && d.interestName.length > 0 ? d.interestName.join(', ') : ''}</p>
        `;
      }
    }
  } catch (err) {
    console.error('Lỗi lấy thông tin người dùng:', err);
  }

  // --- PHÂN TRANG ẢNH TAB PHOTO ---
  const PHOTO_PAGE_SIZE = 5;
  async function loadPhotos(page = 0, size = PHOTO_PAGE_SIZE) {
    try {
      const res = await fetch(`http://localhost:8080/api/photo?page=${page}&size=${size}`, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.content)) {
        // Lưu lại danh sách ảnh và thông tin phân trang để dùng lại khi cần
        window.lastPhotoUrls = json.data.content;
        window.lastPhotoPageInfo = json.data.page;
        renderPhotos(json.data.content);
        renderPhotoPagination(json.data.page, size);
      } else {
        window.lastPhotoUrls = [];
        document.getElementById('photo-row').innerHTML = '<p>Không có ảnh.</p>';
        document.getElementById('photo-pagination').innerHTML = '';
      }
    } catch (err) {
      window.lastPhotoUrls = [];
      document.getElementById('photo-row').innerHTML = '<p style="color:red">Không tải được ảnh!</p>';
      document.getElementById('photo-pagination').innerHTML = '';
    }
  }

  function renderPhotos(photoUrls) {
    const row = document.getElementById('photo-row');
    const isDeleteMode = window.isPhotoDeleteMode;
    // Sắp xếp ngược lại: mới nhất lên trước
    const reversed = [...photoUrls].reverse();
    row.innerHTML = reversed.map(url =>
      `<div class="photo-item" style="position:relative;">
        <img src="${url}" alt="Ảnh" data-url="${url}" 
          ${isDeleteMode ? 'style="opacity:0.7;cursor:pointer;border:2px solid #ff4d4f;"' : ''}
          onclick="${isDeleteMode ? 'toggleSelectPhoto(this)' : `openModal('${url}')`}">
      </div>`
    ).join('');
    if (isDeleteMode) {
      // Chỉ làm nổi bật các ảnh đã chọn (không còn tick)
      (window.selectedPhotoUrls || []).forEach(url => {
        const img = row.querySelector(`img[data-url="${url}"]`);
        if (img) {
          img.style.opacity = "1";
          img.style.border = "2px solid #1877F2";
        }
      });
    }
  }

  function renderPhotoPagination(pageInfo, size) {
    const pag = document.getElementById('photo-pagination');
    let html = '';
    for (let i = 0; i < pageInfo.totalPages; i++) {
      html += `<button onclick="loadPhotos(${i},${size})" ${i === pageInfo.number ? 'style="background:#1877F2;color:#fff;"' : ''}>${i + 1}</button> `;
    }
    pag.innerHTML = html;
  }

  // Tải ảnh khi chuyển sang tab "Ảnh"
  document.getElementById('tab-photo').addEventListener('click', function() {
    loadPhotos();
  });

  // Thêm biến flag để phân biệt upload ảnh profile
  let isProfilePhotoUpload = false;

  // Sử dụng nút "Thêm ảnh profile" để mở modal upload profile photo
  const btnAddProfilePhoto = document.getElementById('btn-add-profile-photo');
  if (btnAddProfilePhoto) {
    btnAddProfilePhoto.onclick = function() {
      isProfilePhotoUpload = true;
      document.getElementById('upload-photo-modal').style.display = 'flex';
    };
  }

  // Sử dụng nút "Thêm ảnh" trong .post-box để mở modal upload ảnh thường
  // (giữ nguyên logic cũ, nhưng set flag false)
  document.querySelector('.post-box button i.fas.fa-image').parentElement.onclick = function() {
    isProfilePhotoUpload = false;
    document.getElementById('upload-photo-modal').style.display = 'flex';
  };

  // Đóng modal khi bấm nút đóng hoặc "Hủy"
  document.getElementById('close-upload-modal').onclick = function() {
    document.getElementById('form-upload-photo-modal').reset();
    document.getElementById('upload-photo-modal').style.display = 'none';
    isProfilePhotoUpload = false;
  };
  document.getElementById('btn-cancel-upload-modal').onclick = function() {
    document.getElementById('form-upload-photo-modal').reset();
    document.getElementById('upload-photo-modal').style.display = 'none';
    isProfilePhotoUpload = false;
  };

  // Xử lý submit form upload trong modal
  // Nếu là upload profile photo thì gọi API /api/profile-photo/upload, ngược lại gọi API upload ảnh thường
  document.getElementById('form-upload-photo-modal').onsubmit = async function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('input-photo-file-modal');
    const loading = document.getElementById('upload-loading');
    if (!fileInput.files[0]) return alert('Vui lòng chọn ảnh!');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    loading.style.display = 'flex';
    try {
      const apiUrl = isProfilePhotoUpload
        ? 'http://localhost:8080/api/profile-photo/upload'
        : 'http://localhost:8080/api/photo/upload';
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });
      const json = await res.json();
      loading.style.display = 'none';
      if (json.success) {
        alert('Tải ảnh thành công!');
        document.getElementById('form-upload-photo-modal').reset();
        document.getElementById('upload-photo-modal').style.display = 'none';
        isProfilePhotoUpload = false;
        loadPhotos();
      } else {
        alert('Tải ảnh thất bại!');
      }
    } catch (err) {
      loading.style.display = 'none';
      alert('Lỗi khi tải ảnh!');
    }
  };

  window.isPhotoDeleteMode = false;
  window.selectedPhotoUrls = [];

  document.getElementById('btn-delete-photo').onclick = function() {
    window.isPhotoDeleteMode = true;
    window.selectedPhotoUrls = []; // Không chọn ảnh nào mặc định
    document.getElementById('btn-confirm-delete-photo').style.display = 'inline-block';
    document.getElementById('btn-cancel-delete-photo').style.display = 'inline-block';
    renderPhotos(window.lastPhotoUrls || []);
  };

  document.getElementById('btn-cancel-delete-photo').onclick = function() {
    window.isPhotoDeleteMode = false;
    window.selectedPhotoUrls = [];
    document.getElementById('btn-confirm-delete-photo').style.display = 'none';
    document.getElementById('btn-cancel-delete-photo').style.display = 'none';
    renderPhotos(window.lastPhotoUrls || []);
  };

  document.getElementById('btn-confirm-delete-photo').onclick = async function() {
    if (window.selectedPhotoUrls.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ảnh để xóa!');
      return;
    }
    if (!confirm('Bạn có chắc chắn muốn xóa các ảnh đã chọn?')) return;
    
    let successCount = 0;
    for (const url of window.selectedPhotoUrls) {
      try {
        const res = await fetch('http://localhost:8080/api/photo/delete?photoUrl=' + encodeURIComponent(url), {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token }
        });
        const json = await res.json();
        if (json.success) successCount++;
      } catch {}
    }
    alert(`Đã xóa ${successCount} ảnh!`);
    window.isPhotoDeleteMode = false;
    window.selectedPhotoUrls = [];
    document.getElementById('btn-confirm-delete-photo').style.display = 'none';
    document.getElementById('btn-cancel-delete-photo').style.display = 'none';
    loadPhotos();
  };

  window.toggleSelectPhoto = function(imgEl) {
    const url = imgEl.getAttribute('data-url');
    const idx = window.selectedPhotoUrls.indexOf(url);
    if (idx === -1) {
      window.selectedPhotoUrls.push(url);
      imgEl.style.opacity = "1";
      imgEl.style.border = "2px solid #1877F2";
      imgEl.nextElementSibling.style.display = "flex";
    } else {
      window.selectedPhotoUrls.splice(idx, 1);
      imgEl.style.opacity = "0.7";
      imgEl.style.border = "2px solid #ff4d4f";
      imgEl.nextElementSibling.style.display = "none";
    }
  };

  // Sử dụng nút "Thêm Video" trong .post-box để mở modal
  document.querySelector('.post-box button i.fas.fa-video').parentElement.onclick = function() {
    document.getElementById('upload-video-modal').style.display = 'flex';
  };

  // Đóng modal khi bấm nút đóng hoặc "Hủy"
  document.getElementById('close-upload-video-modal').onclick = function() {
    document.getElementById('form-upload-video-modal').reset();
    document.getElementById('upload-video-modal').style.display = 'none';
  };
  document.getElementById('btn-cancel-upload-video-modal').onclick = function() {
    document.getElementById('form-upload-video-modal').reset();
    document.getElementById('upload-video-modal').style.display = 'none';
  };

  // Xử lý nút "Tạo story"
  document.getElementById('btn-create-story').onclick = function() {
    document.getElementById('form-create-story-modal').reset();
    document.getElementById('create-story-modal').style.display = 'flex';
  };
  document.getElementById('close-create-story-modal').onclick =
  document.getElementById('btn-cancel-create-story-modal').onclick = function() {
    document.getElementById('form-create-story-modal').reset();
    document.getElementById('create-story-modal').style.display = 'none';
  };
  document.getElementById('form-create-story-modal').onsubmit = async function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('input-story-file-modal');
    const loading = document.getElementById('create-story-loading');
    if (!fileInput.files[0]) return alert('Vui lòng chọn ảnh hoặc video!');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    loading.style.display = 'flex';
    try {
      const res = await fetch('http://localhost:8080/api/story/create', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });
      const json = await res.json();
      loading.style.display = 'none';
      if (json.success) {
        alert('Tạo story thành công!');
        document.getElementById('form-create-story-modal').reset();
        document.getElementById('create-story-modal').style.display = 'none';
      } else {
        alert('Tạo story thất bại!');
      }
    } catch (err) {
      loading.style.display = 'none';
      alert('Lỗi khi tạo story!');
    }
  };

  // --- PHÂN TRANG STORY TAB STORY ---
  const STORY_PAGE_SIZE = 4;
  async function loadStories(page = 0, size = STORY_PAGE_SIZE) {
    try {
      const res = await fetch(`http://localhost:8080/api/story?page=${page}&size=${size}`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      if (json.success && json.data && Array.isArray(json.data.content)) {
        renderStories(json.data.content);
        renderStoryPagination(json.data, size);
      } else {
        document.getElementById('story-row').innerHTML = '<p>Không có story.</p>';
        document.getElementById('story-pagination').innerHTML = '';
      }
    } catch (err) {
      document.getElementById('story-row').innerHTML = '<p style="color:red">Không tải được story!</p>';
      document.getElementById('story-pagination').innerHTML = '';
    }
  }
  function renderStories(storyList) {
    const row = document.getElementById('story-row');
    row.innerHTML = storyList.reverse().map(story => {
      if (story.videoUrl && (story.videoUrl.endsWith('.mp4') || story.videoUrl.endsWith('.webm') || story.videoUrl.endsWith('.mov')))
        return `<div class="video-item"><video src="${story.videoUrl}" controls style="width:100%;height:320px;object-fit:cover;border-radius:10px;"></video><p>Ngày đăng: ${new Date(story.uploadDate).toLocaleDateString('vi-VN')}</p></div>`;
      else
        return `<div class="photo-item"><img src="${story.videoUrl}" alt="Story" style="width:240px;height:240px;object-fit:cover;border-radius:12px;"><p>Ngày đăng: ${new Date(story.uploadDate).toLocaleDateString('vi-VN')}</p></div>`;
    }).join('');
  }
  function renderStoryPagination(pageInfo, size) {
    const pag = document.getElementById('story-pagination');
    let html = '';
    for (let i = 0; i < pageInfo.totalPages; i++) {
      html += `<button onclick="loadStories(${i},${size})" ${i === pageInfo.number ? 'style=\"background:#1877F2;color:#fff;\"' : ''}>${i + 1}</button> `;
    }
    pag.innerHTML = html;
  }
  document.getElementById('tab-story').addEventListener('click', function () {
    loadStories();
  });

  // Xử lý nút "Tạo bài viết"
document.getElementById('btn-create-post').onclick = function() {
  document.getElementById('form-create-post-modal').reset();
  document.getElementById('create-post-modal').style.display = 'flex';
};
document.getElementById('close-create-post-modal').onclick =
document.getElementById('btn-cancel-create-post-modal').onclick = function() {
  document.getElementById('form-create-post-modal').reset();
  document.getElementById('create-post-modal').style.display = 'none';
};
document.getElementById('form-create-post-modal').onsubmit = async function (e) {
  e.preventDefault();

  const content = document.getElementById('post-content').value.trim();
  const images = document.getElementById('post-images').files;
  const videos = document.getElementById('post-videos').files;
  const isPublic = document.getElementById('post-public').checked;
  const email = document.getElementById('post-email').value.trim(); // 👈 thêm lại dòng này
  const loading = document.getElementById('create-post-loading');

  // Kiểm tra hợp lệ
  if (!email) {
    alert('Vui lòng nhập email!');
    return;
  }

  if (!content && images.length === 0 && videos.length === 0) {
    alert('Bài viết phải có nội dung hoặc ảnh/video!');
    return;
  }

  // Tạo FormData
  const formData = new FormData();
  formData.append('content', content);
  formData.append('isPublic', isPublic.toString()); // "true" hoặc "false"
  formData.append('userEmail', email); // 👈 thêm để backend không lỗi

  for (let i = 0; i < images.length; i++) {
    formData.append('listImage', images[i]);
  }

  for (let i = 0; i < videos.length; i++) {
    formData.append('listVideo', videos[i]);
  }

  const token = localStorage.getItem('token');
  if (!token) {
    alert('Không tìm thấy token đăng nhập!');
    return;
  }

  loading.style.display = 'flex';

  try {
    const res = await fetch('http://localhost:8080/api/post/create', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
        // KHÔNG thêm Content-Type khi dùng FormData
      },
      body: formData
    });

    const text = await res.text();
    console.log('Raw response:', text); // debug

    let json;
    try {
      json = JSON.parse(text);
    } catch (err) {
      throw new Error('Server không trả về JSON hợp lệ');
    }

    loading.style.display = 'none';

    if (json.success) {
      alert('Tạo bài viết thành công!');
      document.getElementById('form-create-post-modal').reset();
      document.getElementById('create-post-modal').style.display = 'none';
    } else {
      alert('Tạo bài viết thất bại: ' + (json.message || 'Không rõ lý do'));
      console.log(json);
    }
  } catch (err) {
    loading.style.display = 'none';
    console.error(err);
    alert('Lỗi kết nối hoặc xử lý phía client!');
  }
};






  // Khi ấn nút "Chỉnh sửa thông tin cá nhân"
document.querySelector('.intro-box button').onclick = async function () {
  const modal = document.getElementById('edit-profile-modal');
  const form = document.getElementById('form-edit-profile');
  const token = localStorage.getItem('token');

  try {
    const res = await fetch('http://localhost:8080/api/user-profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      form.fullName.value = d.fullName || '';
      form.email.value = d.email || '';
      form.phoneNumber.value = d.phoneNumber || '';
      form.birthDate.value = d.birthDate ? d.birthDate.substring(0, 10) : '';
      form.gender.value = d.gender || 'OTHER';
      form.lookingFor.value = d.lookingFor || 'OTHER';
      form.bio.value = d.bio || '';
      form.height.value = d.height || '';
      form.weight.value = d.weight || '';
      form.location.value = d.location || '';
      form.jobTitle.value = d.jobTitle || '';
      form.company.value = d.company || '';
      form.education.value = d.education || '';
      form.description.value = d.description || '';
      form.interestName.value = (d.interestName || []).join(', ');
      modal.style.display = 'flex';
    } else {
      alert('Không thể tải thông tin người dùng!');
    }
  } catch (err) {
    alert('Lỗi kết nối server!');
  }
};

// Nút đóng modal và Hủy bỏ
document.getElementById('close-edit-profile-modal').onclick =
document.getElementById('btn-cancel-edit-profile').onclick = function () {
  document.getElementById('edit-profile-modal').style.display = 'none';
};

// Submit form cập nhật
document.getElementById('form-edit-profile').onsubmit = async function (e) {
  e.preventDefault();
  const form = e.target;
  const token = localStorage.getItem('token');

  const data = {
    fullName: form.fullName.value,
    email: form.email.value,
    phoneNumber: form.phoneNumber.value,
    birthDate: form.birthDate.value ? new Date(form.birthDate.value).toISOString() : null,
    gender: form.gender.value,
    lookingFor: form.lookingFor.value,
    bio: form.bio.value,
    height: parseInt(form.height.value) || 0,
    weight: parseInt(form.weight.value) || 0,
    location: form.location.value,
    jobTitle: form.jobTitle.value,
    company: form.company.value,
    education: form.education.value,
    description: form.description.value,
    interestName: form.interestName.value.split(',').map(s => s.trim()).filter(s => s)
  };

  try {
    const res = await fetch('http://localhost:8080/api/user-profile/update', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (json.success) {
      alert('Cập nhật thông tin thành công!');
      document.getElementById('edit-profile-modal').style.display = 'none';
      location.reload(); // hoặc gọi lại loadUserProfile() nếu bạn tách hàm
    } else {
      alert('Cập nhật thất bại!');
    }
  } catch (err) {
    alert('Lỗi khi cập nhật!');
  }
};


  // Xử lý submit form upload video trong modal
  document.getElementById('form-upload-video-modal').onsubmit = async function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('input-video-file-modal');
    const loading = document.getElementById('upload-video-loading');
    if (!fileInput.files[0]) return alert('Vui lòng chọn video!');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    loading.style.display = 'flex';
    try {
      const res = await fetch('http://localhost:8080/api/video/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });
      const json = await res.json();
      loading.style.display = 'none';
      if (json.success) {
        alert('Tải video thành công!');
        document.getElementById('form-upload-video-modal').reset();
        document.getElementById('upload-video-modal').style.display = 'none';
        // TODO: loadVideos(); nếu bạn có hàm hiển thị video
      } else {
        alert('Tải video thất bại!');
      }
    } catch (err) {
      loading.style.display = 'none';
      alert('Lỗi khi tải video!');
    }
  };

  // Hàm load video 
  const VIDEO_PAGE_SIZE = 10;

async function loadVideos(page = 0, size = VIDEO_PAGE_SIZE) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`http://localhost:8080/api/video?page=${page}&size=${size}`, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const json = await res.json();
    if (json.success && json.data && Array.isArray(json.data.content)) {
      const videos = json.data.content;
      renderVideos(videos);
      renderVideoPagination(json.data.page, size);
    } else {
      document.getElementById('video-row').innerHTML = '<p>Không có video.</p>';
      document.getElementById('video-pagination').innerHTML = '';
    }
  } catch (err) {
    console.error('Lỗi tải video:', err);
    document.getElementById('video-row').innerHTML = '<p style="color:red;">Không thể tải video!</p>';
    document.getElementById('video-pagination').innerHTML = '';
  }
}

function renderVideos(videoList) {
  const row = document.getElementById('video-row');
  if (!row) {
    console.warn('Không tìm thấy phần tử video-row!');
    return;
  }
  row.innerHTML = videoList.reverse().map(v => `
    <div class="video-item">
      <video src="${v.videoUrl}" controls style="max-width:100%;height:auto;"></video>
      <p>Ngày đăng: ${new Date(v.uploadDate).toLocaleDateString('vi-VN')}</p>
    </div>
  `).join('');
}

function renderVideoPagination(pageInfo, size) {
  const pag = document.getElementById('video-pagination');
  if (!pag) {
    console.warn('Không tìm thấy phần tử video-pagination!');
    return;
  }
  let html = '';
  for (let i = 0; i < pageInfo.totalPages; i++) {
    html += `<button onclick="loadVideos(${i}, ${size})" ${i === pageInfo.number ? 'style="background:#1877F2;color:#fff;"' : ''}>${i + 1}</button> `;
  }
  pag.innerHTML = html;
}

document.getElementById('tab-video').addEventListener('click', function () {
  loadVideos(); // tải trang đầu tiên
});

// --- HIỂN THỊ DANH SÁCH BÀI ĐĂNG Ở TAB BÀI VIẾT ---
async function loadOwnPosts() {
  const listPost = document.getElementById('list-post');
  if (!listPost) return;
  listPost.innerHTML = '<div style="text-align:center;color:#aaa;">Đang tải bài viết...</div>';
  try {
    const res = await fetch('http://localhost:8080/api/post/owner', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await res.json();
    if (json.success && json.data && Array.isArray(json.data.content)) {
      if (json.data.content.length === 0) {
        listPost.innerHTML = '<div style="text-align:center;color:#aaa;">Chưa có bài viết nào.</div>';
        return;
      }
      listPost.innerHTML = json.data.content.map(post => renderPostItem(post)).join('');
    } else {
      listPost.innerHTML = '<div style="color:red;">Không tải được bài viết!</div>';
    }
  } catch (err) {
    listPost.innerHTML = '<div style="color:red;">Lỗi khi tải bài viết!</div>';
  }
}
function renderPostItem(post) {
  // Xử lý ngày đăng
  const date = new Date(post.uploadDate).toLocaleString('vi-VN');
  // Ảnh/video
  let mediaHtml = '';
  if (post.photosUrl && post.photosUrl.length > 0) {
    mediaHtml += '<div class="post-media-row">' + post.photosUrl.map(url => `<img src="${url}" alt="Ảnh bài viết" class="post-media-img">`).join('') + '</div>';
  }
  if (post.videosUrl && post.videosUrl.length > 0) {
    mediaHtml += '<div class="post-media-row">' + post.videosUrl.map(url => `<video src="${url}" controls class="post-media-video"></video>`).join('') + '</div>';
  }
  return `
    <div class="post-item">
      <div class="post-header">
        <img src="${post.profilePicture || ''}" class="post-avatar" alt="avatar">
        <div>
          <div class="post-author">${post.fullName || ''}</div>
          <div class="post-date">${date}</div>
        </div>
      </div>
      <div class="post-content">${post.content || ''}</div>
      ${mediaHtml}
    </div>
  `;
}
// Hiển thị thông tin rút gọn ở tab Bài viết
async function loadMiniUserInfo() {
  const el = document.getElementById('mini-user-info');
  if (!el) return;
  try {
    const res = await fetch('http://localhost:8080/api/user-profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      el.innerHTML = `
        <div style="margin-bottom:12px;">
          <strong>Ngày sinh:</strong> ${d.birthDate ? new Date(d.birthDate).toLocaleDateString('vi-VN') : ''}<br>
          <strong>SĐT:</strong> ${d.phoneNumber || ''}<br>
          <strong>Giới tính:</strong> ${d.gender || ''}<br>
          <strong>Đang tìm kiếm:</strong> ${d.lookingFor || ''}<br>
          <strong>Chiều cao:</strong> ${d.height || ''} cm<br>
          <strong>Cân nặng:</strong> ${d.weight || ''} kg
        </div>
      `;
    } else {
      el.innerHTML = '';
    }
  } catch (err) {
    el.innerHTML = '';
  }
}
// Gọi khi vào tab Bài viết
const tabPost = document.getElementById('tab-post');
if (tabPost) {
  tabPost.addEventListener('click', function() {
    loadMiniUserInfo();
    loadOwnPosts();
  });
}

// Gọi khi vào tab Giới thiệu
const tabInfo = document.getElementById('tab-info');
if (tabInfo) {
  tabInfo.addEventListener('click', function() {
    loadOwnPosts();
  });
}
// Gọi khi load trang nếu đang ở tab info
if (document.getElementById('section-info') && document.getElementById('section-info').style.display !== 'none') {
  loadOwnPosts();
}

// --- HIỂN THỊ DANH SÁCH BẠN BÈ Ở TAB BẠN BÈ ---
async function loadFriends() {
  const listEl = document.getElementById('friend-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;color:#aaa;">Đang tải danh sách bạn bè...</div>';
  try {
    const res = await fetch('http://localhost:8080/api/user/friends', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await res.json();
    if (json.success && json.data && Array.isArray(json.data.content)) {
      if (json.data.content.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;color:#aaa;">Bạn chưa có bạn bè nào.</div>';
        return;
      }
      listEl.innerHTML = json.data.content.map(friend => renderFriendItem(friend)).join('');
    } else {
      listEl.innerHTML = '<div style="color:red;">Không tải được danh sách bạn bè!</div>';
    }
  } catch (err) {
    listEl.innerHTML = '<div style="color:red;">Lỗi khi tải danh sách bạn bè!</div>';
  }
}
function renderFriendItem(friend) {
  return `
    <div class="friend-item">
      <img src="${friend.photoProfile || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(friend.fullName)}" alt="avatar" class="post-avatar" style="width:56px;height:56px;">
      <div>
        <div class="post-author">${friend.fullName || ''}</div>
        <div class="post-date">${friend.phoneNumber || ''}</div>
        <div class="post-content" style="font-size:14px;color:#b0b3b8;">${friend.bio || ''}</div>
      </div>
    </div>
  `;
}
const tabFriends = document.getElementById('tab-friends');
if (tabFriends) {
  tabFriends.addEventListener('click', function() {
    loadFriends();
  });
}


});