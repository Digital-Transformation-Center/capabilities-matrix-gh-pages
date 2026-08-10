/* DTC Matrix Interactive & Header CMS Login Link Injector */

document.addEventListener("DOMContentLoaded", function () {
  // Inject simple text CMS Login link pointing directly to Netlify /admin portal
  const headerInner = document.querySelector(".md-header__inner");
  if (headerInner && !document.querySelector(".header-cms-login")) {
    const netlifyAdminUrl = (window.SITE_CONFIG && window.SITE_CONFIG.netlifyUrl)
      ? window.SITE_CONFIG.netlifyUrl.replace(/\/$/, '') + '/admin/'
      : 'https://dtc-modelshop-capabilities.netlify.app/admin/';

    const loginBtn = document.createElement("a");
    loginBtn.href = netlifyAdminUrl;
    loginBtn.className = "header-cms-login";
    loginBtn.innerHTML = "Login";
    loginBtn.title = "Login to DTC Model Shop CMS";

    // Insert right before search or at the end of header items
    const searchContainer = headerInner.querySelector(".md-search");
    if (searchContainer) {
      headerInner.insertBefore(loginBtn, searchContainer);
    } else {
      headerInner.appendChild(loginBtn);
    }
  }
});
