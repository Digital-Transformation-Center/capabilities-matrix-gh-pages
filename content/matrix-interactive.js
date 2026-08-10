/* DTC Matrix Interactive & Lucide Icons Loader */

document.addEventListener("DOMContentLoaded", function () {
  // Initialize Lucide Icons across the page
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  // Inject simple text CMS Login link opening the admin portal in a new tab
  const headerInner = document.querySelector(".md-header__inner");
  if (headerInner && !document.querySelector(".header-cms-login")) {
    const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
    const netlifyAdminUrl = isLocal 
      ? "admin/index.html"
      : ((window.SITE_CONFIG && window.SITE_CONFIG.netlifyUrl)
          ? window.SITE_CONFIG.netlifyUrl.replace(/\/$/, '') + '/admin/'
          : 'https://dtc-modelshop-capabilities.netlify.app/admin/');

    const loginBtn = document.createElement("a");
    loginBtn.href = netlifyAdminUrl;
    loginBtn.target = "_blank";
    loginBtn.rel = "noopener noreferrer";
    loginBtn.className = "header-cms-login";
    loginBtn.innerHTML = "Login";
    loginBtn.title = "Open DTC Model Shop CMS in a new tab";

    // Insert right before search or at the end of header items
    const searchContainer = headerInner.querySelector(".md-search");
    if (searchContainer) {
      headerInner.insertBefore(loginBtn, searchContainer);
    } else {
      headerInner.appendChild(loginBtn);
    }
  }
});
