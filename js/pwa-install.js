/**
 * PWA Install & Service Worker Registration Module
 * Đồng bộ chuẩn Theme Trang Chủ (Xanh Royal #2563EB & Trắng hiện đại)
 * Nút "Tải App" tích hợp trực tiếp trên thanh Header (Navbar)
 */
(function() {
  // 1. Đăng ký Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js')
        .then(function(reg) {
          // Tự động kiểm tra bản cập nhật mới ngay khi mở app
          reg.update();
        })
        .catch(function(err) {
          console.warn('[PWA] Lỗi đăng ký Service Worker:', err);
        });
    });
  }

  // 2. Kiểm tra xem người dùng đã mở dưới dạng App Standalone chưa
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator.standalone === true);
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var isAndroid = /Android/i.test(navigator.userAgent);

  if (isStandalone) {
    document.documentElement.classList.add('is-pwa-standalone');
  }
  if (isIOS) {
    document.documentElement.classList.add('is-ios-device');
  }

  var deferredPrompt = null;

  // Lắng nghe sự kiện cài đặt trên Android / Chrome
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
  });

  // 3. Hàm tạo/kết nối nút "Tải App" trên Header
  function setupHeaderInstallButton() {
    // Nếu đang chạy trong app standalone thì ẩn nút cài đặt
    if (isStandalone) {
      var existingBtn = document.getElementById('btnHeaderInstallApp');
      if (existingBtn) existingBtn.style.display = 'none';
      return;
    }

    var btn = document.getElementById('btnHeaderInstallApp');
    if (!btn) {
      // Tìm container navbar
      var navContainer = document.querySelector('.header .nav-container');
      if (navContainer) {
        btn = document.createElement('button');
        btn.id = 'btnHeaderInstallApp';
        btn.className = 'nav-install-btn';
        btn.type = 'button';
        btn.title = 'Cài đặt App Tra cứu học tập';
        btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> <span>Tải App</span>';
        navContainer.appendChild(btn);
      }
    }

    if (btn && !btn.dataset.pwaBound) {
      btn.dataset.pwaBound = 'true';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        if (deferredPrompt) {
          // Android / Chrome hỗ trợ native prompt
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function(choiceResult) {
            if (choiceResult.outcome === 'accepted') {
              if (btn) btn.style.display = 'none';
            }
            deferredPrompt = null;
          });
        } else if (isIOS) {
          // iPhone / iPad -> Modal hướng dẫn chuẩn theme trang chủ
          showIOSInstallModal();
        } else if (isAndroid) {
          // Android chưa kịp bắt beforeinstallprompt hoặc trình duyệt khác
          showAndroidInstallModal();
        } else {
          // Máy tính Desktop Chrome/Edge
          showDesktopInstallModal();
        }
      });
    }
  }

  // 4. Modal Hướng dẫn cài đặt cho iPhone (iOS Safari) - Theme Trang Chủ Chuẩn
  function showIOSInstallModal() {
    var modalId = 'pwaGuideModal';
    var oldModal = document.getElementById(modalId);
    if (oldModal) oldModal.remove();

    var modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = [
      'position: fixed',
      'inset: 0',
      'background: rgba(15, 23, 42, 0.65)',
      'backdrop-filter: blur(6px)',
      '-webkit-backdrop-filter: blur(6px)',
      'z-index: 999999',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 16px',
      'box-sizing: border-box',
      'font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'animation: pwaFadeIn 0.25s ease'
    ].join(';');

    modal.innerHTML = [
      '<div style="background: #FFFFFF; border-radius: 24px; max-width: 390px; width: 100%; padding: 26px 22px 22px; text-align: center; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); position: relative; border: 1px solid #E2E8F0; box-sizing: border-box;">',
      '  <button id="pwaModalCloseBtn" style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: #F1F5F9; border: none; color: #64748B; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"><i class="fa-solid fa-xmark"></i></button>',
      '  <div style="display: inline-flex; padding: 10px; background: #EFF6FF; border-radius: 20px; margin-bottom: 14px;">',
      '    <img src="https://i.postimg.cc/66rKbPmb/trinh-duyet.png" alt="Logo" style="width: 52px; height: 52px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 12px rgba(37,99,235,0.18);">',
      '  </div>',
      '  <h3 style="color: #0F172A; margin: 0 0 6px; font-size: 18px; font-weight: 800;">Cài đặt App trên iPhone</h3>',
      '  <p style="color: #64748B; font-size: 13px; margin: 0 0 18px; line-height: 1.45;">Mở trực tiếp từ màn hình chính để theo dõi bài tập & điểm danh nhanh nhất</p>',
      '  <div style="text-align: left; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 14px 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: #334155;">',
      '    <div style="display: flex; align-items: flex-start; gap: 12px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563EB; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; margin-top: 1px;">1</div>',
      '      <div>Nhấn nút <strong>Chia sẻ</strong> <i class="fa-solid fa-arrow-up-from-bracket" style="color: #2563EB; margin: 0 2px;"></i> ở thanh công cụ dưới Safari.</div>',
      '    </div>',
      '    <div style="display: flex; align-items: flex-start; gap: 12px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563EB; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; margin-top: 1px;">2</div>',
      '      <div>Cuộn xuống chọn <strong>"Thêm vào Màn hình chính"</strong> <i class="fa-regular fa-square-plus" style="color: #2563EB; margin-left: 2px;"></i></div>',
      '    </div>',
      '    <div style="display: flex; align-items: flex-start; gap: 12px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #10B981; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; margin-top: 1px;">3</div>',
      '      <div>Nhấn <strong>Thêm</strong> ở góc trên bên phải màn hình để hoàn tất!</div>',
      '    </div>',
      '  </div>',
      '  <button id="pwaModalOkBtn" style="background: linear-gradient(135deg, #2563EB, #1D4ED8); border: none; color: #FFF; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 14px; cursor: pointer; width: 100%; box-shadow: 0 6px 18px rgba(37,99,235,0.3); transition: all 0.2s;">Đã hiểu</button>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);
    bindModalDismiss(modal);
  }

  // 5. Modal Hướng dẫn cài đặt cho Android (khi không kích hoạt được native prompt)
  function showAndroidInstallModal() {
    var modalId = 'pwaGuideModal';
    var oldModal = document.getElementById(modalId);
    if (oldModal) oldModal.remove();

    var modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = [
      'position: fixed',
      'inset: 0',
      'background: rgba(15, 23, 42, 0.65)',
      'backdrop-filter: blur(6px)',
      '-webkit-backdrop-filter: blur(6px)',
      'z-index: 999999',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 16px',
      'box-sizing: border-box',
      'font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'animation: pwaFadeIn 0.25s ease'
    ].join(';');

    modal.innerHTML = [
      '<div style="background: #FFFFFF; border-radius: 24px; max-width: 390px; width: 100%; padding: 26px 22px 22px; text-align: center; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); position: relative; border: 1px solid #E2E8F0; box-sizing: border-box;">',
      '  <button id="pwaModalCloseBtn" style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: #F1F5F9; border: none; color: #64748B; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-xmark"></i></button>',
      '  <div style="display: inline-flex; padding: 10px; background: #EFF6FF; border-radius: 20px; margin-bottom: 14px;">',
      '    <img src="https://i.postimg.cc/66rKbPmb/trinh-duyet.png" alt="Logo" style="width: 52px; height: 52px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 12px rgba(37,99,235,0.18);">',
      '  </div>',
      '  <h3 style="color: #0F172A; margin: 0 0 6px; font-size: 18px; font-weight: 800;">Cài đặt App trên Android</h3>',
      '  <p style="color: #64748B; font-size: 13px; margin: 0 0 18px; line-height: 1.45;">Cài đặt biểu tượng Tra cứu học tập trực tiếp vào điện thoại</p>',
      '  <div style="text-align: left; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 14px 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: #334155;">',
      '    <div style="display: flex; align-items: flex-start; gap: 12px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563EB; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; margin-top: 1px;">1</div>',
      '      <div>Nhấn nút <strong>Menu 3 chấm</strong> <i class="fa-solid fa-ellipsis-vertical" style="color: #2563EB; margin: 0 2px;"></i> ở góc phải trên trình duyệt Chrome.</div>',
      '    </div>',
      '    <div style="display: flex; align-items: flex-start; gap: 12px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563EB; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; margin-top: 1px;">2</div>',
      '      <div>Chọn dòng <strong>"Cài đặt ứng dụng"</strong> (hoặc "Thêm vào Màn hình chính").</div>',
      '    </div>',
      '    <div style="display: flex; align-items: flex-start; gap: 12px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #10B981; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; margin-top: 1px;">3</div>',
      '      <div>Nhấn <strong>Cài đặt</strong> để hoàn tất!</div>',
      '    </div>',
      '  </div>',
      '  <button id="pwaModalOkBtn" style="background: linear-gradient(135deg, #2563EB, #1D4ED8); border: none; color: #FFF; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 14px; cursor: pointer; width: 100%; box-shadow: 0 6px 18px rgba(37,99,235,0.3); transition: all 0.2s;">Đã hiểu</button>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);
    bindModalDismiss(modal);
  }

  // 6. Modal Hướng dẫn cài đặt trên Máy tính Desktop
  function showDesktopInstallModal() {
    var modalId = 'pwaGuideModal';
    var oldModal = document.getElementById(modalId);
    if (oldModal) oldModal.remove();

    var modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = [
      'position: fixed',
      'inset: 0',
      'background: rgba(15, 23, 42, 0.65)',
      'backdrop-filter: blur(6px)',
      '-webkit-backdrop-filter: blur(6px)',
      'z-index: 999999',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 16px',
      'box-sizing: border-box',
      'font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'animation: pwaFadeIn 0.25s ease'
    ].join(';');

    modal.innerHTML = [
      '<div style="background: #FFFFFF; border-radius: 24px; max-width: 420px; width: 100%; padding: 26px 24px 22px; text-align: center; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); position: relative; border: 1px solid #E2E8F0; box-sizing: border-box;">',
      '  <button id="pwaModalCloseBtn" style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; border-radius: 50%; background: #F1F5F9; border: none; color: #64748B; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-xmark"></i></button>',
      '  <div style="display: inline-flex; padding: 10px; background: #EFF6FF; border-radius: 20px; margin-bottom: 14px;">',
      '    <img src="https://i.postimg.cc/66rKbPmb/trinh-duyet.png" alt="Logo" style="width: 52px; height: 52px; border-radius: 12px; object-fit: cover; box-shadow: 0 4px 12px rgba(37,99,235,0.18);">',
      '  </div>',
      '  <h3 style="color: #0F172A; margin: 0 0 6px; font-size: 18px; font-weight: 800;">Cài đặt App trên Máy tính</h3>',
      '  <p style="color: #64748B; font-size: 13px; margin: 0 0 18px; line-height: 1.45;">Mở trong cửa sổ riêng, chạy độc lập như phần mềm máy tính</p>',
      '  <div style="text-align: left; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 14px 16px; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: #334155;">',
      '    <div style="display: flex; align-items: flex-start; gap: 12px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563EB; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; margin-top: 1px;">1</div>',
      '      <div>Nhìn lên <strong>thanh địa chỉ URL</strong> ở trên cùng của trình duyệt Chrome hoặc Microsoft Edge.</div>',
      '    </div>',
      '    <div style="display: flex; align-items: flex-start; gap: 12px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563EB; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; margin-top: 1px;">2</div>',
      '      <div>Nhấn vào biểu tượng <strong>Cài đặt ứng dụng</strong> <i class="fa-solid fa-desktop" style="color: #2563EB; margin: 0 2px;"></i> (máy tính hoặc icon mũi tên tải xuống ở góc phải thanh URL).</div>',
      '    </div>',
      '    <div style="display: flex; align-items: flex-start; gap: 12px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #10B981; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; margin-top: 1px;">3</div>',
      '      <div>Chọn <strong>Cài đặt</strong> để đưa biểu tượng App ra màn hình Desktop.</div>',
      '    </div>',
      '  </div>',
      '  <button id="pwaModalOkBtn" style="background: linear-gradient(135deg, #2563EB, #1D4ED8); border: none; color: #FFF; font-weight: 700; font-size: 14px; padding: 12px 24px; border-radius: 14px; cursor: pointer; width: 100%; box-shadow: 0 6px 18px rgba(37,99,235,0.3); transition: all 0.2s;">Đã hiểu</button>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);
    bindModalDismiss(modal);
  }

  // Tiện ích đóng modal
  function bindModalDismiss(modal) {
    var closeBtn = document.getElementById('pwaModalCloseBtn');
    var okBtn = document.getElementById('pwaModalOkBtn');
    function closeModal() {
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.2s ease';
      setTimeout(function() {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      }, 200);
    }
    if (closeBtn) closeBtn.onclick = closeModal;
    if (okBtn) okBtn.onclick = closeModal;
    modal.onclick = function(e) {
      if (e.target === modal) closeModal();
    };
    function onEsc(e) {
      if (e.key === 'Escape') {
        closeModal();
        window.removeEventListener('keydown', onEsc);
      }
    }
    window.addEventListener('keydown', onEsc);
  }

  // Khởi tạo khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHeaderInstallButton);
  } else {
    setupHeaderInstallButton();
  }
})();
