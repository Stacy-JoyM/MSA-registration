const form = document.getElementById('registrationForm');

const setButtonState = (isLoading) => {
    const submitButton = form?.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = isLoading;
        submitButton.textContent = isLoading ? 'Submitting...' : 'Finish Application';
    }
};

const setFormMessage = (message) => {
    const messageEl = document.querySelector('.form-message');
    if (!messageEl) return;
    messageEl.textContent = message || '';
    if (message) {
        messageEl.classList.add('is-visible');
        messageEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        messageEl.classList.remove('is-visible');
    }
};

const STORAGE_KEY = 'msa-registration-draft';

const saveDraft = () => {
    if (!form) return;
    const data = {};
    const elements = Array.from(form.querySelectorAll('input, select, textarea'));

    elements.forEach((el) => {
        if (!el.name || el.disabled) return;
        const type = (el.type || '').toLowerCase();
        if (type === 'file' || type === 'submit' || type === 'button') return;

        if (type === 'checkbox' || type === 'radio') {
            data[el.name] = data[el.name] || [];
            if (el.checked) {
                data[el.name].push(el.value || 'on');
            }
            return;
        }

        data[el.name] = el.value;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadDraft = () => {
    if (!form) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    let data;
    try {
        data = JSON.parse(raw);
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        return;
    }

    const elements = Array.from(form.querySelectorAll('input, select, textarea'));
    elements.forEach((el) => {
        if (!el.name || el.disabled) return;
        const type = (el.type || '').toLowerCase();
        if (type === 'file' || type === 'submit' || type === 'button') return;

        if (type === 'checkbox' || type === 'radio') {
            const saved = data[el.name];
            if (Array.isArray(saved)) {
                el.checked = saved.includes(el.value || 'on');
            }
            return;
        }

        if (Object.prototype.hasOwnProperty.call(data, el.name)) {
            el.value = data[el.name];
        }
    });
};

const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
    }
    return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const updateUploadStatus = () => {
    if (!form) return;
    const input = form.querySelector('input[type="file"][name="playerVideo"]');
    const status = form.querySelector('.upload-status');
    const title = form.querySelector('.upload-status-title');
    const list = form.querySelector('.upload-file-list');
    if (!input || !status || !title || !list) return;

    list.innerHTML = '';
    const files = Array.from(input.files || []);
    if (!files.length) {
        status.classList.remove('has-files');
        title.textContent = 'No files selected';
        return;
    }

    status.classList.add('has-files');
    title.textContent = `${files.length} file${files.length > 1 ? 's' : ''} selected`;
    files.forEach((file) => {
        const item = document.createElement('li');
        const sizeText = formatFileSize(file.size);
        item.textContent = sizeText ? `${file.name} (${sizeText})` : file.name;
        list.appendChild(item);
    });
};

const clearFieldErrors = () => {
    form?.querySelectorAll('.field-error').forEach((el) => {
        el.classList.remove('field-error');
    });
    setFormMessage('');
};

const addFieldError = (element) => {
    if (!element) return;
    element.classList.add('field-error');
    const checkboxLabel = element.closest('.checkbox');
    if (checkboxLabel) {
        checkboxLabel.classList.add('field-error');
    }
    const uploadBox = element.closest('.upload-box');
    if (uploadBox) {
        uploadBox.classList.add('field-error');
    }
};

const validateForm = () => {
    if (!form) return false;
    clearFieldErrors();

    const elements = Array.from(form.querySelectorAll('input, select, textarea'));
    const groupedInputs = new Map();
    const invalidElements = [];

    elements.forEach((el) => {
        if (el.disabled) return;
        const type = (el.type || '').toLowerCase();
        if (type === 'button' || type === 'submit') return;

        if (type === 'checkbox' || type === 'radio') {
            if (!el.name) return;
            if (!el.required) return;
            if (!groupedInputs.has(el.name)) {
                groupedInputs.set(el.name, []);
            }
            groupedInputs.get(el.name).push(el);
            return;
        }

        if (type === 'file') {
            if (!el.required) return;
            if (!el.files || el.files.length === 0) {
                invalidElements.push(el);
            }
            return;
        }

        if (!el.required) return;
        if (el.value.trim() === '') {
            invalidElements.push(el);
        }
    });

    groupedInputs.forEach((group) => {
        const hasSelection = group.some((el) => el.checked);
        if (!hasSelection) {
            group.forEach((el) => invalidElements.push(el));
        }
    });

    invalidElements.forEach((el) => addFieldError(el));

    const uploadInput = form?.querySelector('input[type="file"][name="playerVideo"]');
    if (uploadInput && uploadInput.files && uploadInput.files.length === 0) {
        addFieldError(uploadInput);
    }

    if (invalidElements.length > 0) {
        const firstInvalid = invalidElements[0];
        if (firstInvalid && typeof firstInvalid.focus === 'function') {
            firstInvalid.focus();
        }
        return false;
    }

    return true;
};

if (form) {
    loadDraft();
    updateUploadStatus();

    const uploadInput = form.querySelector('input[type="file"][name="playerVideo"]');
    if (uploadInput) {
        uploadInput.addEventListener('change', updateUploadStatus);
    }

    const saveButton = form.querySelector('.secondary-btn');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            saveDraft();
            const eventType = (form.querySelector('input[name="eventType"]')?.value || 'basketball').toLowerCase();
            window.location.href = `/description/${encodeURIComponent(eventType)}`;
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!validateForm()) {
            setFormMessage('Please complete all required fields highlighted in red before submitting the form.');
            return;
        }
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
            localStorage.removeItem(STORAGE_KEY);
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
