/**
 * PWA Install & Service Worker Registration Module
 * Tự động đăng ký Service Worker và hiển thị nút/banner Cài đặt Ứng dụng thông minh trên iOS & Android
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
  if (isStandalone) {
    document.documentElement.classList.add('is-pwa-standalone');
  }
  if (isIOS) {
    document.documentElement.classList.add('is-ios-device');
  }
  if (isStandalone) {
    // Đang chạy trong App native -> Không hiển thị nút cài đặt
    return;
  }

  // 3. CHỈ HIỂN THỊ TRÊN ĐIỆN THOẠI (Mobile / Tablet / Màn hình nhỏ <= 768px), ẨN HOÀN TOÀN TRÊN MÁY TÍNH
  var isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
  if (!isMobileDevice) {
    return;
  }

  // 4. CHỈ HIỂN THỊ BANNER Ở TRANG CHỦ (index.html), TUYỆT ĐỐI KHÔNG HIỂN THỊ Ở CÁC TRANG DASHBOARD, LOGIN, BÀI TẬP, LỊCH
  var currentPath = (window.location.pathname || '').toLowerCase();
  var isExcludedPage = currentPath.indexOf('dashboard') !== -1 || 
                       currentPath.indexOf('login') !== -1 || 
                       currentPath.indexOf('homework') !== -1 || 
                       currentPath.indexOf('calendar') !== -1;

  var isHomePage = !isExcludedPage && (
    currentPath.endsWith('index.html') || 
    currentPath.endsWith('/') || 
    currentPath === '' || 
    currentPath.slice(-1) === '/' ||
    currentPath.indexOf('index') !== -1
  );

  if (!isHomePage) {
    return;
  }

  // Kiểm tra nếu người dùng vừa mới bấm tắt thông báo gần đây (3 ngày)
  var dismissedTime = localStorage.getItem('giasu_pwa_dismissed');
  if (dismissedTime && (Date.now() - parseInt(dismissedTime, 10) < 3 * 24 * 60 * 60 * 1000)) {
    return;
  }

  var deferredPrompt = null;
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // 4. Xây dựng giao diện Banner Cài đặt
  function createInstallBanner() {
    if (document.getElementById('pwaInstallBanner')) return;

    var banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.style.cssText = [
      'position: fixed',
      'bottom: 20px',
      'left: 50%',
      'transform: translateX(-50%) translateY(120%)',
      'width: 90%',
      'max-width: 480px',
      'background: rgba(19, 9, 36, 0.95)',
      'border: 1px solid rgba(142, 77, 255, 0.5)',
      'border-radius: 16px',
      'padding: 12px 16px',
      'display: flex',
      'align-items: center',
      'justify-content: space-between',
      'gap: 12px',
      'box-shadow: 0 10px 35px rgba(0, 0, 0, 0.8), 0 0 15px rgba(142, 77, 255, 0.3)',
      'z-index: 99998',
      'backdrop-filter: blur(10px)',
      '-webkit-backdrop-filter: blur(10px)',
      'transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      'font-family: "Inter", sans-serif'
    ].join(';');

    banner.innerHTML = [
      '<div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">',
      '  <img src="https://i.postimg.cc/66rKbPmb/trinh-duyet.png" alt="App Icon" style="width: 42px; height: 42px; border-radius: 10px; border: 1px solid rgba(255,210,63,0.4); flex-shrink: 0; object-fit: cover;">',
      '  <div style="min-width: 0;">',
      '    <div style="color: #FFF; font-weight: 700; font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Cài đặt App Gia Sư</div>',
      '    <div style="color: #A6ADCE; font-size: 11.5px; line-height: 1.3;">Truy cập nhanh & nộp bài không cần mở web</div>',
      '  </div>',
      '</div>',
      '<div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">',
      '  <button id="pwaInstallActionBtn" style="background: linear-gradient(135deg, #8E4DFF, #5B21B6); border: 1px solid #A870FF; color: #FFF; font-weight: 700; font-size: 12px; padding: 8px 14px; border-radius: 20px; cursor: pointer; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(142,77,255,0.4); transition: transform 0.2s;">',
      '    <i class="fa-solid fa-download"></i> Cài đặt',
      '  </button>',
      '  <button id="pwaInstallCloseBtn" style="background: none; border: none; color: #6A6E8D; font-size: 16px; cursor: pointer; padding: 6px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;">',
      '    <i class="fa-solid fa-xmark"></i>',
      '  </button>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);

    // Kích hoạt animation trượt lên
    setTimeout(function() {
      banner.style.transform = 'translateX(-50%) translateY(0)';
    }, 1500);

    // Bắt sự kiện nút Đóng
    var closeBtn = document.getElementById('pwaInstallCloseBtn');
    if (closeBtn) {
      closeBtn.onclick = function() {
        banner.style.transform = 'translateX(-50%) translateY(140%)';
        localStorage.setItem('giasu_pwa_dismissed', Date.now().toString());
        setTimeout(function() {
          banner.remove();
        }, 400);
      };
    }

    // Bắt sự kiện nút Cài đặt
    var actionBtn = document.getElementById('pwaInstallActionBtn');
    if (actionBtn) {
      actionBtn.onclick = function() {
        if (deferredPrompt) {
          // Android / Chrome
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function(choiceResult) {
            if (choiceResult.outcome === 'accepted') {
              banner.style.transform = 'translateX(-50%) translateY(140%)';
            }
            deferredPrompt = null;
          });
        } else if (isIOS) {
          // iPhone / iPad -> Hiện modal hướng dẫn
          showIOSInstallModal();
        } else {
          // Trình duyệt khác
          showDesktopInstallGuide();
        }
      };
    }
  }

  // 4. Modal Hướng dẫn cài đặt cho iPhone (iOS Safari)
  function showIOSInstallModal() {
    var modalId = 'pwaIosModal';
    if (document.getElementById(modalId)) return;

    var modal = document.createElement('div');
    modal.id = modalId;
    modal.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100%',
      'height: 100%',
      'background: rgba(3, 8, 29, 0.85)',
      'backdrop-filter: blur(8px)',
      '-webkit-backdrop-filter: blur(8px)',
      'z-index: 99999',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 20px',
      'box-sizing: border-box',
      'font-family: "Inter", sans-serif'
    ].join(';');

    modal.innerHTML = [
      '<div style="background: #130924; border: 1px solid #8E4DFF; border-radius: 18px; max-width: 380px; width: 100%; padding: 24px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.8); position: relative;">',
      '  <button onclick="document.getElementById(\'pwaIosModal\').remove()" style="position: absolute; top: 12px; right: 14px; background: none; border: none; color: #A6ADCE; font-size: 20px; cursor: pointer;"><i class="fa-solid fa-xmark"></i></button>',
      '  <img src="https://i.postimg.cc/66rKbPmb/trinh-duyet.png" style="width: 55px; height: 55px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(255,210,63,0.4);">',
      '  <h3 style="color: #FFF; margin: 0 0 8px; font-size: 17px; font-weight: 700;">Cài đặt App trên Điện Thoại</h3>',
      '  <p style="color: #A6ADCE; font-size: 13px; margin: 0 0 18px; line-height: 1.4;">Thực hiện 3 bước đơn giản để thêm biểu tượng Gia Sư vào màn hình chính:</p>',
      '  <div style="text-align: left; background: rgba(255,255,255,0.04); border-radius: 12px; padding: 14px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 12px; font-size: 13px; color: #E2E8F0;">',
      '    <div style="display: flex; align-items: center; gap: 10px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #8E4DFF; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">1</div>',
      '      <div>Nhấn vào nút <strong>Chia sẻ</strong> <i class="fa-solid fa-arrow-up-from-bracket" style="color: #3B82F6; margin: 0 2px;"></i> ở thanh công cụ dưới Safari / Chrome.</div>',
      '    </div>',
      '    <div style="display: flex; align-items: center; gap: 10px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #8E4DFF; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">2</div>',
      '      <div>Cuộn xuống nhấn vào <strong>"Xem thêm"</strong> (hoặc cuộn xuống danh sách tùy chọn).</div>',
      '    </div>',
      '    <div style="display: flex; align-items: center; gap: 10px;">',
      '      <div style="width: 24px; height: 24px; border-radius: 50%; background: #10B981; color: #FFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 11px; flex-shrink: 0;">3</div>',
      '      <div>Nhấn vào <strong>"Thêm vào Màn hình chính"</strong> <i class="fa-regular fa-square-plus" style="color: #FFD23F; margin-left: 2px;"></i> ➔ Nhấn <strong>Thêm</strong> là hoàn tất!</div>',
      '    </div>',
      '  </div>',
      '  <button onclick="document.getElementById(\'pwaIosModal\').remove()" style="background: linear-gradient(135deg, #8E4DFF, #5B21B6); border: none; color: #FFF; font-weight: 700; font-size: 13px; padding: 10px 24px; border-radius: 20px; cursor: pointer; width: 100%;">Đã hiểu</button>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);
  }

  // 5. Hướng dẫn cho trình duyệt Desktop
  function showDesktopInstallGuide() {
    alert('Để cài đặt App trên máy tính: Bạn vui lòng nhấn vào biểu tượng [Cài đặt ứng dụng] trên thanh địa chỉ của trình duyệt Chrome/Edge (ở góc phải thanh URL).');
  }

  // 6. Lắng nghe sự kiện cài đặt trên Android / Chrome
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    createInstallBanner();
  });

  // 7. Tự động hiển thị banner trên iOS nếu chưa cài đặt
  if (isIOS) {
    window.addEventListener('DOMContentLoaded', function() {
      createInstallBanner();
    });
  }
})();
