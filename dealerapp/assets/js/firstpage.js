console.log("FIRSTPAGE JS LOADED");

// Your existing login logic
document.addEventListener('DOMContentLoaded', function () {
  const uploadBtn = document.getElementById('uploadProductsBtn');
  const logoutNavItem = document.getElementById('logoutNavItem');
  const adminLoginLink = document.getElementById('adminLoginLink');
  const userLoginLink = document.getElementById('userLoginLink');
  const protectedContent = document.getElementById('protectedContent');

  const authInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem('gstech_auth') || 'null');
    } catch (e) {
      return null;
    }
  })();

  if (!authInfo || !authInfo.username) {
    protectedContent.classList.add('d-none');
    logoutNavItem.classList.add('d-none');
    adminLoginLink.classList.remove('d-none');
    userLoginLink.classList.remove('d-none');
    return;
  }

  protectedContent.classList.remove('d-none');
  logoutNavItem.classList.remove('d-none');
  adminLoginLink.classList.add('d-none');
  userLoginLink.classList.add('d-none');

  if (authInfo.role === 'ADMIN' && uploadBtn) {
    uploadBtn.classList.remove('d-none');
  }
});
