(() => {
  const API_BASE_URL = window.AppConfig.BACKEND_BASE_URL + '/gstechsecurity';
  const AUTH_STORAGE_KEY = 'gstech_auth';

  const LOGIN_ENDPOINTS = {
    ADMIN: `${API_BASE_URL}/admin/login`,
    USER: `${API_BASE_URL}/user/login`,
  };

  const saveAuth = (auth) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } catch (e) {
      console.error('Failed to save auth info', e);
    }
  };

  const getAuth = () => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to parse auth info', e);
      return null;
    }
  };

  const clearAuth = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const redirectAfterLogin = (role) => {
    // Redirect to index.html after successful login
    window.location.href = 'index.html';
  };

  const performLogin = async (role) => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('error-msg');
    const successMsg = document.getElementById('success-msg');

    if (!usernameInput || !passwordInput) {
      console.error('Login inputs not found');
      return;
    }

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      if (errorMsg) {
        errorMsg.textContent = 'Username and password are required';
        errorMsg.style.display = 'block';
      }
      if (successMsg) successMsg.style.display = 'none';
      return;
    }

    const endpoint = LOGIN_ENDPOINTS[role];
    if (!endpoint) {
      console.error('Unknown role for login:', role);
      return;
    }

    try {
      if (errorMsg) errorMsg.style.display = 'none';
      if (successMsg) successMsg.style.display = 'none';

      console.log('Attempting login to:', endpoint);
      console.log('Request payload:', { username, password: '***' });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login error response:', errorText);
        throw new Error(`Login failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Login response data:', data);
      // Expecting something like { token: '...', role: 'ADMIN' | 'USER', username: '...' }
      const authInfo = {
        token: data.token || data.accessToken || '',
        role: (data.role || role || '').toUpperCase(),
        username: data.username || username,
      };

      if (!authInfo.token) {
        console.warn('Login response did not include a token. Update auth.js to match your backend.');
      }

      saveAuth(authInfo);

      if (successMsg) {
        successMsg.textContent = 'Login successful! Redirecting...';
        successMsg.style.display = 'block';
      }
      if (errorMsg) errorMsg.style.display = 'none';

      setTimeout(() => redirectAfterLogin(authInfo.role), 800);
    } catch (error) {
      console.error('Login error:', error);
      if (errorMsg) {
        if (error.message.includes('403')) {
          errorMsg.textContent = '403 Forbidden: Access denied. Check backend CORS settings or credentials.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMsg.textContent = `Cannot connect to server at ${endpoint}. Check if backend is running on port 8080.`;
        } else {
          errorMsg.textContent = `Login failed: ${error.message}`;
        }
        errorMsg.style.display = 'block';
      }
      if (successMsg) successMsg.style.display = 'none';
    }
  };

  const requireAuth = (allowedRoles) => {
    const auth = getAuth();
    if (!auth || !auth.role) {
      // Default to user login if role is not provided
      window.location.href = 'user-login.html';
      return;
    }

    if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      const normalizedRole = auth.role.toUpperCase();
      const allowed = allowedRoles.map((r) => r.toUpperCase());
      if (!allowed.includes(normalizedRole)) {
        // Not authorized for this page; send to appropriate login
        if (normalizedRole === 'ADMIN') {
          window.location.href = 'admin-login.html';
        } else {
          window.location.href = 'user-login.html';
        }
      }
    }
  };

  const isAdmin = () => {
    const auth = getAuth();
    return auth && auth.role && auth.role.toUpperCase() === 'ADMIN';
  };

  const getAuthToken = () => {
    const auth = getAuth();
    return auth && auth.token ? auth.token : null;
  };

  // Expose helpers globally
  window.Auth = {
    loginAsAdmin: () => performLogin('ADMIN'),
    loginAsUser: () => performLogin('USER'),
    requireAuth,
    isAdmin,
    clearAuth,
    getAuthToken,
    getAuth, // Added: expose getAuth for debugging
  };
})();