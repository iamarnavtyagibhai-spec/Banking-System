/* ==========================================================================
   NOVA BANK - AUTHENTICATION & ONBOARDING CONTROLLER
   ========================================================================== */

let pendingSignupEmail = '';
let pendingForgotEmail = '';
let resendTimerInterval = null;

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  let text = message;
  if (typeof text === 'object' && text !== null) {
    text = text.message || text.error || JSON.stringify(text);
  }
  text = String(text || 'An error occurred');

  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${text}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Handle Login Form Submit
 */
async function handleLogin(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('login-btn');
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Signing In... ⏳';

    const token = await BankAPI.login({ email, password });
    
    // Save JWT token
    API_CONFIG.setToken(token);
    API_CONFIG.setUser(email, email.includes('admin') ? 'ADMIN' : 'USER');

    showToast('Login successful! Welcome to Nova Bank.', 'success');
    
    setTimeout(() => {
      window.location.hash = '#dashboard';
      AppRouter.route();
    }, 600);
  } catch (error) {
    showToast(error.message || 'Login failed. Check credentials.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Sign In to Account →';
  }
}

/**
 * Handle Signup Form Submit
 */
async function handleSignup(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('signup-btn');
  
  const payload = {
    firstName: document.getElementById('signup-firstname').value.trim(),
    lastName: document.getElementById('signup-lastname').value.trim(),
    email: document.getElementById('signup-email').value.trim(),
    password: document.getElementById('signup-password').value,
    phoneNumber: document.getElementById('signup-phone').value.trim(),
    dateOfBirth: document.getElementById('signup-dob').value
  };

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending OTP... ⏳';

    const response = await BankAPI.signup(payload);
    pendingSignupEmail = payload.email;

    showToast(response || 'OTP sent to your email!', 'success');
    openOtpModal('SIGNUP');
  } catch (error) {
    showToast(error.message || 'Signup failed.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Create Account & Send OTP →';
  }
}

/**
 * OTP Verification (Signup)
 */
async function handleVerifySignupOtp() {
  const otp = getEnteredOtp('signup-otp');
  if (otp.length !== 6) {
    showToast('Please enter complete 6-digit OTP', 'warning');
    return;
  }

  const verifyBtn = document.getElementById('verify-signup-otp-btn');
  try {
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = 'Verifying... ⏳';

    const response = await BankAPI.verifyOtp({
      email: pendingSignupEmail,
      otp: otp
    });

    showToast(response || 'Account verified and created successfully!', 'success');
    closeModal('signup-otp-modal');
    
    // Switch to login view
    window.location.hash = '#login';
    AppRouter.route();
  } catch (error) {
    showToast(error.message || 'Invalid or expired OTP', 'error');
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = 'Verify & Activate Account';
  }
}

/**
 * Resend Signup OTP
 */
async function handleResendSignupOtp() {
  const resendBtn = document.getElementById('resend-signup-otp-btn');
  try {
    resendBtn.disabled = true;
    const response = await BankAPI.resendOtp({ email: pendingSignupEmail });
    showToast(response || 'New OTP sent to email!', 'success');
    startResendTimer('signup-resend-timer', resendBtn);
  } catch (error) {
    showToast(error.message || 'Failed to resend OTP', 'error');
    resendBtn.disabled = false;
  }
}

/**
 * Forgot Password Flow
 */
async function handleForgotPasswordRequest(event) {
  event.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();
  const submitBtn = document.getElementById('forgot-submit-btn');

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Sending OTP... ⏳';

    const response = await BankAPI.forgotPassword({ email });
    pendingForgotEmail = email;

    showToast(response || 'Password reset OTP sent to email!', 'success');
    closeModal('forgot-modal');
    openOtpModal('FORGOT');
  } catch (error) {
    showToast(error.message || 'Failed to request OTP', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Send Reset OTP';
  }
}

/**
 * Verify Forgot OTP & Open Reset Password Modal
 */
async function handleVerifyForgotOtp() {
  const otp = getEnteredOtp('forgot-otp');
  if (otp.length !== 6) {
    showToast('Please enter complete 6-digit OTP', 'warning');
    return;
  }

  const verifyBtn = document.getElementById('verify-forgot-otp-btn');
  try {
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = 'Verifying... ⏳';

    const response = await BankAPI.verifyForgotOtp({
      email: pendingForgotEmail,
      otp: otp
    });

    showToast(response || 'OTP verified! Now enter new password.', 'success');
    closeModal('forgot-otp-modal');
    openModal('reset-password-modal');
  } catch (error) {
    showToast(error.message || 'Invalid or expired OTP', 'error');
  } finally {
    verifyBtn.disabled = false;
    verifyBtn.innerHTML = 'Verify OTP';
  }
}

/**
 * Reset Password Submit
 */
async function handleResetPassword(event) {
  event.preventDefault();
  const newPassword = document.getElementById('reset-new-password').value;
  const confirmPassword = document.getElementById('reset-confirm-password').value;
  const submitBtn = document.getElementById('reset-submit-btn');

  if (newPassword !== confirmPassword) {
    showToast('Passwords do not match!', 'warning');
    return;
  }

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Updating Password... ⏳';

    const response = await BankAPI.resetPassword({
      email: pendingForgotEmail,
      newPassword: newPassword
    });

    showToast(response || 'Password changed successfully! Please login.', 'success');
    closeModal('reset-password-modal');
    window.location.hash = '#login';
    AppRouter.route();
  } catch (error) {
    showToast(error.message || 'Failed to reset password', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Update Password';
  }
}

/**
 * Helpers for OTP & Modals
 */
function getEnteredOtp(prefix) {
  let otp = '';
  for (let i = 1; i <= 6; i++) {
    const box = document.getElementById(`${prefix}-${i}`);
    if (box) otp += box.value;
  }
  return otp;
}

function setupOtpAutoTab(prefix) {
  for (let i = 1; i <= 6; i++) {
    const box = document.getElementById(`${prefix}-${i}`);
    if (!box) continue;

    box.addEventListener('input', (e) => {
      if (box.value.length === 1 && i < 6) {
        document.getElementById(`${prefix}-${i + 1}`)?.focus();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && box.value.length === 0 && i > 1) {
        document.getElementById(`${prefix}-${i - 1}`)?.focus();
      }
    });
  }
}

function openOtpModal(type) {
  if (type === 'SIGNUP') {
    document.getElementById('signup-otp-email-label').innerText = pendingSignupEmail;
    openModal('signup-otp-modal');
    setupOtpAutoTab('signup-otp');
    document.getElementById('signup-otp-1')?.focus();
    startResendTimer('signup-resend-timer', document.getElementById('resend-signup-otp-btn'));
  } else {
    document.getElementById('forgot-otp-email-label').innerText = pendingForgotEmail;
    openModal('forgot-otp-modal');
    setupOtpAutoTab('forgot-otp');
    document.getElementById('forgot-otp-1')?.focus();
  }
}

function startResendTimer(timerElementId, buttonElement) {
  let seconds = 60;
  clearInterval(resendTimerInterval);
  if (buttonElement) buttonElement.disabled = true;

  resendTimerInterval = setInterval(() => {
    seconds--;
    const el = document.getElementById(timerElementId);
    if (el) el.innerText = `(${seconds}s)`;

    if (seconds <= 0) {
      clearInterval(resendTimerInterval);
      if (el) el.innerText = '';
      if (buttonElement) buttonElement.disabled = false;
    }
  }, 1000);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerText = '🙈';
  } else {
    input.type = 'password';
    btn.innerText = '👁️';
  }
}
