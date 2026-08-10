/* DTC Matrix Interactive & Pages CMS Login Link Injector */

document.addEventListener("DOMContentLoaded", function () {
  // Inject simple text CMS Login link pointing directly to Pages CMS Dashboard
  const headerInner = document.querySelector(".md-header__inner");
  if (headerInner && !document.querySelector(".header-cms-login")) {
    const pagesCmsUrl = "https://pagescms.org/dashboard/Digital-Transformation-Center/capabilities-matrix-gh-pages/main";

    const loginBtn = document.createElement("a");
    loginBtn.href = pagesCmsUrl;
    loginBtn.target = "_blank";
    loginBtn.rel = "noopener noreferrer";
    loginBtn.className = "header-cms-login";
    loginBtn.innerHTML = "Login";
    loginBtn.title = "Login to Pages CMS Manager";

    // Insert right before search or at the end of header items
    const searchContainer = headerInner.querySelector(".md-search");
    if (searchContainer) {
      headerInner.insertBefore(loginBtn, searchContainer);
    } else {
      headerInner.appendChild(loginBtn);
    }
  }
});
