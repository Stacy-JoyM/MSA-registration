const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('adminPassword');
const logoutBtn = document.getElementById('logoutBtn');
const eventFilter = document.getElementById('eventFilter');
const refreshBtn = document.getElementById('refreshBtn');
const reconnectGmailBtn = document.getElementById('reconnectGmailBtn');
const gmailStatus = document.getElementById('gmailStatus');

const summaryApplied = document.getElementById('summaryApplied');
const summaryShortlisted = document.getElementById('summaryShortlisted');
const summarySelected = document.getElementById('summarySelected');
const summaryPaid = document.getElementById('summaryPaid');
const summaryRejected = document.getElementById('summaryRejected');
const basketballTable = document.getElementById('basketballTable');
const footballTable = document.getElementById('footballTable');
const basketballApplicationsBody = document.getElementById('basketballApplicationsBody');
const footballApplicationsBody = document.getElementById('footballApplicationsBody');

const STATUS_OPTIONS = [
    { value: 'applied', label: 'Applied' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'selected', label: 'Accepted' },
    { value: 'paid', label: 'Paid' },
    { value: 'rejected', label: 'Rejected' }
];

const state = {
    token: localStorage.getItem('msaAdminToken') || ''
};

const setAuthUI = (isAuthenticated) => {
    loginCard.classList.toggle('hidden', isAuthenticated);
    dashboard.classList.toggle('hidden', !isAuthenticated);
    logoutBtn.classList.toggle('hidden', !isAuthenticated);
};

const setGmailStatus = (status) => {
    if (!gmailStatus) return;
    gmailStatus.classList.remove('hidden', 'connected', 'disconnected');
    if (status === 'connected') {
        gmailStatus.textContent = 'Gmail connected';
        gmailStatus.classList.add('connected');
    } else if (status === 'expired') {
        gmailStatus.textContent = 'Gmail expired';
        gmailStatus.classList.add('disconnected');
    } else {
        gmailStatus.textContent = 'Gmail not connected';
        gmailStatus.classList.add('disconnected');
    }
};

const checkApiHealth = async () => {
    try {
        const response = await fetch(`${window.API_BASE_URL}/health`);
        return response.ok;
    } catch (error) {
        return false;
    }
};

const checkGmailStatus = async () => {
    if (!gmailStatus || !reconnectGmailBtn) return;
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/admin/auth/status`);
        const status = await response.json();
        if (status.connected && !status.expired) {
            setGmailStatus('connected');
            reconnectGmailBtn.classList.add('hidden');
        } else if (status.connected && status.expired) {
            setGmailStatus('expired');
            reconnectGmailBtn.classList.remove('hidden');
        } else {
            setGmailStatus('disconnected');
            reconnectGmailBtn.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Failed to check Gmail status:', error);
        setGmailStatus('disconnected');
        reconnectGmailBtn.classList.remove('hidden');
    }
};

const setStatusStyle = (select, status) => {
    if (!select) return;
    select.dataset.status = status || 'applied';
};

const getEmailSentKey = (type, application, eventType) => {
    const id = application?.id || application?._id;
    if (id) {
        return `msaAdminEmailSent:${type}:${id}`;
    }
    const email = getRecipientEmail(application, eventType) || 'unknown';
    const name = application?.playerFullName || application?.parentFirstName || 'unknown';
    return `msaAdminEmailSent:${type}:${eventType || 'event'}:${email}:${name}`;
};

const isEmailSent = (type, application, eventType) => {
    if (type === 'acceptance' && application?.emailSentAcceptance) return true;
    if (type === 'rejection' && application?.emailSentRejection) return true;
    const key = getEmailSentKey(type, application, eventType);
    return localStorage.getItem(key) === 'true';
};

const markEmailSent = (type, application, eventType) => {
    const key = getEmailSentKey(type, application, eventType);
    localStorage.setItem(key, 'true');
};

const buildStatusSelect = (application) => {
    const select = document.createElement('select');
    select.classList.add('status-select');
    const currentStatus = application.status || 'applied';
    STATUS_OPTIONS.forEach((option) => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        if (currentStatus === option.value) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
    setStatusStyle(select, currentStatus);

    select.addEventListener('change', async () => {
        const previousStatus = select.dataset.status || currentStatus;
        setStatusStyle(select, select.value);
        try {
        const response = await fetch(`${window.API_BASE_URL}/api/admin/applications/${application.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.token}`
                },
                body: JSON.stringify({ status: select.value })
            });
            if (!response.ok) {
                throw new Error('Failed to update status');
            }
            await refreshData();
        } catch (error) {
            console.error(error);
            setStatusStyle(select, previousStatus);
            select.value = previousStatus;
            alert('Unable to update status.');
        }
    });

    return select;
};

const buildVideosCell = (videos) => {
    const cell = document.createElement('td');
    const list = Array.isArray(videos) ? videos : videos ? [videos] : [];

    if (!list.length) {
        cell.textContent = '—';
        return cell;
    }

    list.forEach((video, index) => {
        if (typeof video !== 'string' || !video) {
            return;
        }
        const isAbsolute = video.startsWith('http');
        const isUploadPath = video.startsWith('/uploads');
        if (isAbsolute || isUploadPath) {
            const link = document.createElement('a');
            link.href = isAbsolute ? video : `${window.API_BASE_URL}${video}`;
            link.textContent = `Video ${index + 1}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            cell.appendChild(link);
        } else {
            const text = document.createElement('span');
            text.textContent = video;
            cell.appendChild(text);
        }
        if (index < list.length - 1) {
            cell.appendChild(document.createElement('br'));
        }
    });

    if (!cell.childNodes.length) {
        cell.textContent = '—';
    }

    return cell;
};

const formatHighestLevel = (value) => {
    if (!value) return '—';
    const rawValue = Array.isArray(value) ? value[0] : value;
    const normalized = String(rawValue).trim().toLowerCase();
    const labels = {
        school: 'School',
        club: 'Club',
        regional: 'Regional',
        national: 'National'
    };
    return labels[normalized] || rawValue;
};

const getRecipientEmail = (application, eventType) => {
    if (eventType === 'basketball') {
        return application.parentEmail || '';
    }
    return application.playerEmail || '';
};

const buildAcceptanceCell = (application, eventType) => {
    const cell = document.createElement('td');
    const email = getRecipientEmail(application, eventType);

    if (!email) {
        cell.textContent = '—';
        return cell;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'admin-btn ghost';
    if (isEmailSent('acceptance', application, eventType)) {
        button.textContent = 'Sent';
        button.disabled = true;
    } else {
        button.textContent = 'Send';
    }

    button.addEventListener('click', async () => {
        const previous = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending...';

        try {
            const apiOk = await checkApiHealth();
            if (!apiOk) {
                throw new Error(`API server unreachable at ${window.API_BASE_URL}`);
            }
            const response = await fetch(`${window.API_BASE_URL}/api/admin/send-acceptance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.token}`
                },
                body: JSON.stringify({
                    email,
                    name: application.playerFullName || application.parentFirstName || 'Athlete',
                    eventType: eventType,
                    applicationId: application.id
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.detail || errorPayload.error || 'Failed to send email');
            }

            markEmailSent('acceptance', application, eventType);
            button.textContent = 'Sent';
            button.disabled = true;
        } catch (error) {
            console.error(error);
            button.textContent = previous;
            button.disabled = false;
            alert(error.message || 'Unable to send acceptance email.');
        }
    });

    cell.appendChild(button);
    return cell;
};

const buildRejectionCell = (application, eventType) => {
    const cell = document.createElement('td');
    const email = getRecipientEmail(application, eventType);

    if (!email) {
        cell.textContent = '—';
        return cell;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'admin-btn ghost';
    if (isEmailSent('rejection', application, eventType)) {
        button.textContent = 'Sent';
        button.disabled = true;
    } else {
        button.textContent = 'Send';
    }

    button.addEventListener('click', async () => {
        const previous = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending...';

        try {
            const apiOk = await checkApiHealth();
            if (!apiOk) {
                throw new Error(`API server unreachable at ${window.API_BASE_URL}`);
            }
            const response = await fetch(`${window.API_BASE_URL}/api/admin/send-rejection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.token}`
                },
                body: JSON.stringify({
                    email,
                    name: application.playerFullName || application.parentFirstName || 'Athlete',
                    eventType: eventType,
                    applicationId: application.id
                })
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.detail || errorPayload.error || 'Failed to send email');
            }

            markEmailSent('rejection', application, eventType);
            button.textContent = 'Sent';
            button.disabled = true;
        } catch (error) {
            console.error(error);
            button.textContent = previous;
            button.disabled = false;
            alert(error.message || 'Unable to send rejection email.');
        }
    });

    cell.appendChild(button);
    return cell;
};

const sortApplicationsByStatus = (applications) => {
    const statusRank = {
        paid: 0,
        selected: 1,
        shortlisted: 2,
        applied: 3,
        rejected: 4
    };

    return [...applications].sort((a, b) => {
        const rankA = statusRank[a.status] ?? 99;
        const rankB = statusRank[b.status] ?? 99;
        if (rankA !== rankB) {
            return rankA - rankB;
        }
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
    });
};

const renderBasketballTable = (applications) => {
    basketballApplicationsBody.innerHTML = '';

    if (!applications.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="12" class="empty-state">No applications yet.</td>';
        basketballApplicationsBody.appendChild(row);
        return;
    }

    sortApplicationsByStatus(applications).forEach((application) => {
        const row = document.createElement('tr');
        const parentName = [application.parentFirstName, application.parentLastName]
            .filter(Boolean)
            .join(' ');
        const parentContact = [application.parentPhone, application.parentSecondaryPhone]
            .filter(Boolean)
            .join(' / ');
        const videos = application.videos || [];

        const cells = [
            application.playerFullName || '—',
            application.playerAge || '—',
            application.playerPosition || application.playerOtherPosition || '—',
            formatHighestLevel(application.playerHighestLevel),
            application.playerGender || '—',
            parentName || '—',
            parentContact || '—',
            application.playerInjury || '—'
        ];

        cells.forEach((value) => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement('td');
        statusCell.appendChild(buildStatusSelect(application));
        row.appendChild(buildVideosCell(videos));
        row.appendChild(statusCell);
        row.appendChild(buildAcceptanceCell(application, 'basketball'));
        row.appendChild(buildRejectionCell(application, 'basketball'));

        basketballApplicationsBody.appendChild(row);
    });
};

const renderFootballTable = (applications) => {
    footballApplicationsBody.innerHTML = '';

    if (!applications.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="11" class="empty-state">No applications yet.</td>';
        footballApplicationsBody.appendChild(row);
        return;
    }

    sortApplicationsByStatus(applications).forEach((application) => {
        const row = document.createElement('tr');
        const teamName = application.playerCurrentTeam || application.playerPreviousTeam || '—';
        const contact = [application.playerPhone, application.playerAltPhone]
            .filter(Boolean)
            .join(' / ');
        const videos = application.videos || [];

        const cells = [
            application.playerFullName || '—',
            application.playerAge || '—',
            application.playerPosition || application.playerOtherPosition || '—',
            application.playerGender || '—',
            teamName,
            contact || '—',
            application.playerInjury || '—'
        ];

        cells.forEach((value) => {
            const cell = document.createElement('td');
            cell.textContent = value;
            row.appendChild(cell);
        });

        const statusCell = document.createElement('td');
        statusCell.appendChild(buildStatusSelect(application));
        row.appendChild(buildVideosCell(videos));
        row.appendChild(statusCell);
        row.appendChild(buildAcceptanceCell(application, 'football'));
        row.appendChild(buildRejectionCell(application, 'football'));

        footballApplicationsBody.appendChild(row);
    });
};

const loadSummary = async () => {
    const response = await fetch(`${window.API_BASE_URL}/api/admin/summary?event=${eventFilter.value}`, {
        headers: { Authorization: `Bearer ${state.token}` }
    });
    if (!response.ok) {
        throw new Error('Failed to load summary');
    }
    const data = await response.json();
    if (summaryApplied) {
        summaryApplied.textContent = data.summary.applied ?? 0;
    }
    summaryShortlisted.textContent = data.summary.shortlisted;
    summarySelected.textContent = data.summary.selected;
    summaryPaid.textContent = data.summary.paid;
    if (summaryRejected) {
        summaryRejected.textContent = data.summary.rejected ?? 0;
    }
};

const loadApplications = async () => {
    const response = await fetch(`${window.API_BASE_URL}/api/admin/applications?event=${eventFilter.value}`, {
        headers: { Authorization: `Bearer ${state.token}` }
    });
    if (!response.ok) {
        throw new Error('Failed to load applications');
    }
    const data = await response.json();
    const applications = data.applications || [];

    if (eventFilter.value === 'football') {
        renderFootballTable(applications);
    } else {
        renderBasketballTable(applications);
    }
};

const refreshData = async () => {
    await Promise.all([loadSummary(), loadApplications()]);
};

const startDashboard = async () => {
    if (!state.token) {
        setAuthUI(false);
        return;
    }

    try {
        await refreshData();
        setAuthUI(true);
        await checkGmailStatus();
    } catch (error) {
        console.error(error);
        state.token = '';
        localStorage.removeItem('msaAdminToken');
        setAuthUI(false);
    }
};

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
            state.token = data.token;
            localStorage.setItem('msaAdminToken', data.token);
            passwordInput.value = '';
            await refreshData();
            setAuthUI(true);
            const isFootball = eventFilter && eventFilter.value === 'football';
            if (footballTable && basketballTable) {
                footballTable.classList.toggle('hidden', !isFootball);
                basketballTable.classList.toggle('hidden', isFootball);
            }
        } catch (error) {
            console.error(error);
            alert('Invalid password.');
        }
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        state.token = '';
        localStorage.removeItem('msaAdminToken');
        setAuthUI(false);
    });
}

if (reconnectGmailBtn) {
    reconnectGmailBtn.addEventListener('click', () => {
        window.location.href = `${window.API_BASE_URL}/api/admin/auth/google`;
    });
}

if (eventFilter) {
    eventFilter.addEventListener('change', () => {
        if (state.token) {
            const isFootball = eventFilter.value === 'football';
            footballTable.classList.toggle('hidden', !isFootball);
            basketballTable.classList.toggle('hidden', isFootball);
            refreshData().catch((error) => console.error(error));
        }
    });
}

if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        if (state.token) {
            refreshData().catch((error) => console.error(error));
        }
    });
}

startDashboard()
    .then(() => {
        const isFootball = eventFilter && eventFilter.value === 'football';
        if (footballTable && basketballTable) {
            footballTable.classList.toggle('hidden', !isFootball);
            basketballTable.classList.toggle('hidden', isFootball);
        }
    })
    .catch((error) => console.error(error));
