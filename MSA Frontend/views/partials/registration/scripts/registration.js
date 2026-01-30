const form = document.getElementById('registrationForm');

const setButtonState = (isLoading) => {
    const submitButton = form?.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? 'Submitting...' : 'Finish Application';
    }
};

if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setButtonState(true);

        try {
            const formData = new FormData(form);
            const eventType = formData.get('eventType') || '';
            const response = await fetch(`${window.API_BASE_URL}/api/applications`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Unable to submit application.');
            }

            form.reset();
            const successUrl = eventType
                ? `/success?event=${encodeURIComponent(eventType)}`
                : '/success';
            window.location.href = successUrl;
        } catch (error) {
            console.error(error);
            alert('We could not submit your application. Please try again.');
        } finally {
            setButtonState(false);
        }
    });
}
