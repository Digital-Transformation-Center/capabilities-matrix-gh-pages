/* DTC Matrix Interactive & Header CRM Login Button Injector */

document.addEventListener("DOMContentLoaded", function () {
  // Inject CRM Login button into MkDocs top header nav
  const headerInner = document.querySelector(".md-header__inner");
  if (headerInner && !document.querySelector(".header-crm-login")) {
    const loginBtn = document.createElement("a");
    loginBtn.href = "admin/";
    loginBtn.className = "header-crm-login md-button";
    loginBtn.innerHTML = "CRM Login";
    loginBtn.title = "Login to DTC Model Shop CRM";

    // Insert right before search or at the end of header items
    const searchContainer = headerInner.querySelector(".md-search");
    if (searchContainer) {
      headerInner.insertBefore(loginBtn, searchContainer);
    } else {
      headerInner.appendChild(loginBtn);
    }
  }
});
