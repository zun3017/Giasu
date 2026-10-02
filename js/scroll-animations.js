/* ============================================================
 * js/scroll-animations.js — Scroll Reveal Engine 5.0
 * Phase 19 — Cuộn đến đâu hiện đến đó, siêu mượt & an toàn 100%
 * Hoạt động hoàn hảo cho cả nội dung tĩnh & động (Tabs, JS Render, Modals, Login)
 * ============================================================ */
(function() {
  'use strict';

  var SELECTOR = '.reveal, .reveal-stagger, .reveal-left, .reveal-right, .reveal-scale';
  var observer = null;

  // Kiểm tra element có thực sự đang render trên layout không (tránh element bị ẩn trong display:none)
  function isElementRendered(el) {
    if (!el || !el.isConnected) return false;
    // getClientRects().length === 0 khi element hoặc bất kỳ cha nào có display: none
    if (el.getClientRects().length === 0) return false;
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  }

  // Kiểm tra element đã cuộn vào vùng nhìn thấy (viewport) chưa
  function isElementInView(el) {
    if (!isElementRendered(el)) return false;
    try {
      var rect = el.getBoundingClientRect();
      var windowHeight = window.innerHeight || document.documentElement.clientHeight;
      // Element được coi là đã cuộn tới khi:
      // - Đỉnh của element đã vượt qua đáy màn hình (cách đáy 35px)
      // - Đáy của element chưa cuộn trôi hẳn lên phía trên đỉnh màn hình (rect.bottom >= 0)
      return rect.top <= (windowHeight - 35) && rect.bottom >= 0;
    } catch(e) {
      return false;
    }
  }

  function revealElement(el) {
    if (!el || el.classList.contains('visible')) return;
    el.classList.add('visible');
    if (observer) {
      try { observer.unobserve(el); } catch(e) {}
    }
  }

  // Quét toàn bộ DOM để kiểm tra các phần tử đã cuộn vào viewport
  function checkAllElements() {
    var elements = document.querySelectorAll(SELECTOR);
    if (!elements || elements.length === 0) return;

    elements.forEach(function(el) {
      if (el.classList.contains('visible')) return;
      if (!isElementRendered(el)) return;

      if (isElementInView(el)) {
        revealElement(el);
      } else if (observer) {
        try { observer.observe(el); } catch(e) {}
      }
    });
  }

  function initObserver() {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            if (isElementRendered(entry.target)) {
              revealElement(entry.target);
            }
          }
        });
      }, {
        threshold: 0.05,
        rootMargin: '0px 0px -35px 0px'
      });
    }
  }

  function observeElements() {
    var elements = document.querySelectorAll(SELECTOR);
    if (!elements || elements.length === 0) return;

    elements.forEach(function(el) {
      if (el.classList.contains('visible')) return;
      if (!isElementRendered(el)) return;

      if (isElementInView(el)) {
        // Element đã nằm trong viewport ngay khi load: kích hoạt hiệu ứng nhẹ sau 80ms
        setTimeout(function() {
          if (isElementRendered(el) && isElementInView(el)) {
            revealElement(el);
          }
        }, 80);
      } else if (observer) {
        try { observer.observe(el); } catch(e) {}
      }
    });
  }

  initObserver();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeElements);
  } else {
    observeElements();
  }

  window.addEventListener('load', function() {
    observeElements();
    setTimeout(checkAllElements, 120);
  });

  // Sự kiện cuộn mượt mà
  var scrollThrottle = null;
  window.addEventListener('scroll', function() {
    if (!scrollThrottle) {
      scrollThrottle = requestAnimationFrame(function() {
        checkAllElements();
        scrollThrottle = null;
      });
    }
  }, { passive: true });

  window.addEventListener('resize', checkAllElements, { passive: true });

  // Tự động phát hiện khi DOM thay đổi hoặc chuyển tab (MutationObserver)
  if ('MutationObserver' in window) {
    window.addEventListener('DOMContentLoaded', function() {
      if (document.body) {
        var domObserver = new MutationObserver(function(mutations) {
          var needCheck = false;
          for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.addedNodes.length > 0 || m.attributeName === 'style' || m.attributeName === 'class') {
              needCheck = true;
              break;
            }
          }
          if (needCheck) {
            observeElements();
            setTimeout(checkAllElements, 80);
          }
        });
        domObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
      }
    });
  }

  // Hàm toàn cục cho phép bất kỳ mã JS nào gọi trực tiếp
  window.refreshScrollAnimations = function() {
    observeElements();
    setTimeout(checkAllElements, 50);
  };
})();
