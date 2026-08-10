/* DTC Matrix Interactive & Header CMS Login Link Injector */

document.addEventListener("DOMContentLoaded", function () {
  // Inject simple text CMS Login link into MkDocs top header nav
  const headerInner = document.querySelector(".md-header__inner");
  if (headerInner && !document.querySelector(".header-cms-login")) {
    const loginBtn = document.createElement("a");
    loginBtn.href = "admin/";
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
