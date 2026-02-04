document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('adminLoginForm');
    const warningBox = document.getElementById('gmailWarningBox');
    const formContainer = document.getElementById('loginFormContainer');
    const passwordInput = document.getElementById('adminLoginPassword');
    const connectGmailLink = document.getElementById('connectGmailLink');

    /**
     * PHASE 1: Check Gmail Status
     */
    async function checkGmailStatus() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/api/admin/auth/status`);
            const status = await response.json();

            if (!status.connected || status.expired) {
                // Show the "Link Gmail" button
                warningBox.style.display = 'block';
                
                // Optional: Dim the password form to prioritize Gmail linking
                formContainer.style.opacity = '0.6';
                passwordInput.disabled = true;
            } else {
                // Everything is fine, hide warning and enable login
                warningBox.style.display = 'none';
                formContainer.style.opacity = '1';
                passwordInput.disabled = false;
            }
        } catch (err) {
            console.error("Could not verify Gmail status:", err);
        }
    }

    // Run the check immediately
    checkGmailStatus();

    if (connectGmailLink) {
        connectGmailLink.href = `${window.API_BASE_URL}/api/admin/auth/google`;
    }

    /**
     * PHASE 2: Handle Admin Login
     */
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = passwordInput.value;

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.token) {
                // Store the token for future admin requests
                localStorage.setItem('msaAdminToken', data.token);
                // Redirect to the dashboard
                window.location.href = '/admin/dashboard';
            } else {
                alert(data.error || 'Invalid admin password');
            }
        } catch (err) {
            console.error('Login error:', err);
            alert('An error occurred during login.');
        }
    });
});
