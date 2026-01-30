const loginCard = document.getElementById('loginCard');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('adminPassword');
const logoutBtn = document.getElementById('logoutBtn');
const eventFilter = document.getElementById('eventFilter');
const refreshBtn = document.getElementById('refreshBtn');

const summaryTotal = document.getElementById('summaryTotal');
const summaryShortlisted = document.getElementById('summaryShortlisted');
const summarySelected = document.getElementById('summarySelected');
const summaryPaid = document.getElementById('summaryPaid');
const basketballTable = document.getElementById('basketballTable');
const footballTable = document.getElementById('footballTable');
const basketballApplicationsBody = document.getElementById('basketballApplicationsBody');
const footballApplicationsBody = document.getElementById('footballApplicationsBody');

const STATUS_OPTIONS = [
    { value: 'applied', label: 'Applied' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'selected', label: 'Selected' },
    { value: 'paid', label: 'Paid' }
];

const state = {
    token: localStorage.getItem('msaAdminToken') || ''
};

const setAuthUI = (isAuthenticated) => {
    loginCard.classList.toggle('hidden', isAuthenticated);
    dashboard.classList.toggle('hidden', !isAuthenticated);
    logoutBtn.classList.toggle('hidden', !isAuthenticated);
};

const setStatusStyle = (select, status) => {
    if (!select) return;
    select.dataset.status = status || 'applied';
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
    button.textContent = 'Send';

    button.addEventListener('click', async () => {
        const previous = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending...';

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/admin/send-acceptance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${state.token}`
                },
                body: JSON.stringify({
                    email,
                    name: application.playerFullName || application.parentFirstName || 'Athlete',
                    eventType: eventType
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send email');
            }

            button.textContent = 'Sent';
            setTimeout(() => {
                button.textContent = previous;
                button.disabled = false;
            }, 1500);
        } catch (error) {
            console.error(error);
            button.textContent = previous;
            button.disabled = false;
            alert('Unable to send acceptance email.');
        }
    });

    cell.appendChild(button);
    return cell;
};

const sortApplicationsByStatus = (applications) => {
    const statusRank = {
        selected: 0,
        shortlisted: 1,
        paid: 2,
        applied: 3
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
        row.innerHTML = '<td colspan="10" class="empty-state">No applications yet.</td>';
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

        basketballApplicationsBody.appendChild(row);
    });
};

const renderFootballTable = (applications) => {
    footballApplicationsBody.innerHTML = '';

    if (!applications.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="10" class="empty-state">No applications yet.</td>';
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
    summaryTotal.textContent = data.summary.total;
    summaryShortlisted.textContent = data.summary.shortlisted;
    summarySelected.textContent = data.summary.selected;
    summaryPaid.textContent = data.summary.paid;
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
