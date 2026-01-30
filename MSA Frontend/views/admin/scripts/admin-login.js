const loginForm = document.getElementById('adminLoginForm');
const passwordInput = document.getElementById('adminLoginPassword');

if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const password = passwordInput.value.trim();
        if (!password) return;

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                throw new Error('Invalid password');
            }

            const data = await response.json();
            localStorage.setItem('msaAdminToken', data.token);
            passwordInput.value = '';
            window.location.href = '/admin';
        } catch (error) {
            console.error(error);
            alert('Invalid password.');
        }
    });
}
