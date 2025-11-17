import supabase from './supabase.js';

// DOM Elements
const authSection = document.getElementById('auth-section');
const adminDashboard = document.getElementById('admin-dashboard');
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const authError = document.getElementById('auth-error');
const logoutButton = document.getElementById('logout-button');

const createTeamForm = document.getElementById('create-team-form');
const teamNameInput = document.getElementById('team-name');
const teamsList = document.getElementById('teams-list');
const exportCsvButton = document.getElementById('export-csv-button');

const createClueForm = document.getElementById('create-clue-form');
const clueOrderInput = document.getElementById('clue-order');
const clueTypeInput = document.getElementById('clue-type');
const clueTranscriptInput = document.getElementById('clue-transcript');
const clueUrlInput = document.getElementById('clue-url');
const clueAnswerInput = document.getElementById('clue-answer');
const clueDigitInput = document.getElementById('clue-digit');
const cluesList = document.getElementById('clues-list');

const leaderboardContent = document.getElementById('leaderboard-content');

const qrModal = document.getElementById('qr-modal');
const qrModalTitle = document.getElementById('qr-modal-title');
const qrCodeContainer = document.getElementById('qr-code');
const qrDownloadLink = document.getElementById('qr-download-link');
const progressModal = document.getElementById('progress-modal');
const progressModalTitle = document.getElementById('progress-modal-title');
const progressDetails = document.getElementById('progress-details');
const closeButtons = document.querySelectorAll('.close-button');


// --- UTILITY FUNCTIONS ---
function showDashboard() {
    authSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
}

function showAuth() {
    authSection.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
}

function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

// --- AUTHENTICATION ---
async function handleLogin(e) {
    e.preventDefault();
    authError.textContent = '';
    const { error } = await supabase.auth.signInWithPassword({
        email: loginEmailInput.value,
        password: loginPasswordInput.value,
    });
    if (error) {
        authError.textContent = error.message;
    } else {
        showDashboard();
        fetchAllData();
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    showAuth();
    // Clear all dynamic content
    teamsList.innerHTML = '';
    cluesList.innerHTML = '';
    leaderboardContent.innerHTML = '';
}

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        showDashboard();
        fetchAllData();
    } else {
        showAuth();
    }
}

// --- DATA FETCHING ---
async function fetchTeams() {
    const { data: teams, error } = await supabase.from('teams').select('*').order('name');
    if (error) {
        console.error('Error fetching teams:', error);
        return;
    }
    renderTeams(teams);
}

async function fetchClues() {
    const { data: clues, error } = await supabase.from('master_clues').select('*').order('clue_order');
    if (error) {
        console.error('Error fetching clues:', error);
        return;
    }
    renderClues(clues);
}

async function fetchLeaderboard() {
    const { data: teams, error } = await supabase
        .from('teams')
        .select('name, solved_count, last_updated')
        .order('solved_count', { ascending: false })
        .order('last_updated', { ascending: true });

    if (error) {
        console.error('Error fetching leaderboard:', error);
        return;
    }
    renderLeaderboard(teams);
}

function fetchAllData() {
    fetchTeams();
    fetchClues();
    fetchLeaderboard();
}

// --- DATA RENDERING ---
function renderTeams(teams) {
    teamsList.innerHTML = '';
    teams.forEach(team => {
        const teamEl = document.createElement('div');
        teamEl.classList.add('list-item');
        teamEl.innerHTML = `
            <span>${team.name} (Solved: ${team.solved_count})</span>
            <div>
                <button data-id="${team.id}" class="login-qr-btn">Login QR</button>
                <button data-id="${team.id}" data-name="${team.name}" class="view-progress-btn">View Progress</button>
                <button data-id="${team.id}" class="reset-team-btn">Reset</button>
                <button data-id="${team.id}" class="delete-team-btn">Delete</button>
            </div>
        `;
        teamsList.appendChild(teamEl);
    });
}

function renderClues(clues) {
    cluesList.innerHTML = '';
    clues.forEach(clue => {
        const clueEl = document.createElement('div');
        clueEl.classList.add('list-item');
        clueEl.innerHTML = `
            <span>Order: ${clue.clue_order} - ${clue.transcript.substring(0, 30)}...</span>
            <div>
                <button data-id="${clue.id}" data-order="${clue.clue_order}" class="clue-qr-btn">Clue QR</button>
                <button data-id="${clue.id}" class="delete-clue-btn">Delete</button>
            </div>
        `;
        cluesList.appendChild(clueEl);
    });
}

function renderLeaderboard(teams) {
    leaderboardContent.innerHTML = '';
    teams.forEach((team, index) => {
        const leadEl = document.createElement('div');
        leadEl.classList.add('list-item');
        leadEl.innerHTML = `
            <span>#${index + 1} - ${team.name}</span>
            <span>${team.solved_count} solved</span>
        `;
        leaderboardContent.appendChild(leadEl);
    });
}

// --- TEAM MANAGEMENT ---
async function createTeam(e) {
    e.preventDefault();
    const name = teamNameInput.value;
    const { error } = await supabase.from('teams').insert([{ name: name, solved_clues: [] }]);
    if (error) {
        alert(`Error creating team: ${error.message}`);
    } else {
        teamNameInput.value = '';
        // No need to call fetchTeams() here, realtime subscription will handle it.
    }
}

async function deleteTeam(teamId) {
    if (!confirm('Are you sure you want to delete this team? This is irreversible.')) return;
    const { error } = await supabase.from('teams').delete().eq('id', teamId);
    if (error) alert(`Error deleting team: ${error.message}`);
}

async function resetTeam(teamId) {
    if (!confirm('Are you sure you want to reset this team\'s progress?')) return;
    const { error } = await supabase
        .from('teams')
        .update({ solved_count: 0, solved_clues: [], last_updated: new Date().toISOString() })
        .eq('id', teamId);
    if (error) alert(`Error resetting team: ${error.message}`);
}

async function viewTeamProgress(teamId, teamName) {
    const { data, error } = await supabase.from('teams').select('solved_clues').eq('id', teamId).single();
    if (error) {
        alert(`Error fetching progress: ${error.message}`);
        return;
    }

    progressModalTitle.textContent = `Progress for ${teamName}`;
    let html = '<table><tr><th>Clue ID</th><th>Team Answer</th><th>Status</th><th>Answer Time (IST)</th><th>Clue Transcript</th></tr>';

    const cluesMap = await getCluesMap();

    if (data.solved_clues && data.solved_clues.length > 0) {
        data.solved_clues.forEach(clue => {
            const masterClue = cluesMap[clue.clueId] || { transcript: 'N/A', answer: 'N/A' };
            const isCorrect = (clue.answer || '').toLowerCase() === (masterClue.answer || '').toLowerCase();
            const status = isCorrect ? 'Correct' : 'Wrong';
            const answerTime = new Date(clue.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

            html += `
                <tr>
                    <td>${clue.clueId}</td>
                    <td>${clue.answer}</td>
                    <td>${status}</td>
                    <td>${answerTime}</td>
                    <td>${masterClue.transcript}</td>
                </tr>
            `;
        });
    } else {
        html += '<tr><td colspan="5">No clues solved yet.</td></tr>';
    }
    html += '</table>';
    progressDetails.innerHTML = html;
    openModal(progressModal);
}

async function getCluesMap() {
    const { data, error } = await supabase.from('master_clues').select('id, transcript, answer');
    if (error) return {};
    return data.reduce((map, clue) => {
        map[clue.id] = clue;
        return map;
    }, {});
}


// --- CLUE MANAGEMENT ---
async function createClue(e) {
    e.preventDefault();
    const newClue = {
        clue_order: parseInt(clueOrderInput.value),
        type: clueTypeInput.value,
        transcript: clueTranscriptInput.value,
        url: clueUrlInput.value || null,
        answer: clueAnswerInput.value,
        digit: parseInt(clueDigitInput.value)
    };
    const { error } = await supabase.from('master_clues').insert([newClue]);
    if (error) {
        alert(`Error creating clue: ${error.message}`);
    } else {
        createClueForm.reset();
    }
}

async function deleteClue(clueId) {
    if (!confirm('Are you sure you want to delete this clue?')) return;
    const { error } = await supabase.from('master_clues').delete().eq('id', clueId);
    if (error) alert(`Error deleting clue: ${error.message}`);
}

// --- QR CODE GENERATION ---
function generateQrCode(type, id, title) {
    const data = JSON.stringify({ type, id });
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

    qrModalTitle.textContent = title;
    qrCodeContainer.innerHTML = `<img src="${qrUrl}" alt="QR Code">`;
    qrDownloadLink.href = qrUrl;
    qrDownloadLink.download = `${type}_${id}_qrcode.png`;
    openModal(qrModal);
}

// --- CSV EXPORT ---
async function exportToCsv() {
    const { data: teams, error } = await supabase.from('teams').select('*');
    if (error) {
        alert('Error fetching data for CSV export.');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Team Name,Solved Count,Last Updated,Solved Clues\r\n";

    teams.forEach(team => {
        const solvedCluesStr = JSON.stringify(team.solved_clues).replace(/"/g, '""');
        csvContent += `${team.name},${team.solved_count},${team.last_updated},"${solvedCluesStr}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "teams_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- REALTIME SUBSCRIPTIONS ---
function subscribeToChanges() {
    supabase.channel('public:teams')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, payload => {
            console.log('Team change received!', payload);
            fetchAllData();
        })
        .subscribe();

    supabase.channel('public:master_clues')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'master_clues' }, payload => {
            console.log('Clue change received!', payload);
            fetchClues();
        })
        .subscribe();
}


// --- EVENT LISTENERS ---
loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);
createTeamForm.addEventListener('submit', createTeam);
createClueForm.addEventListener('submit', createClue);
exportCsvButton.addEventListener('click', exportToCsv);

teamsList.addEventListener('click', e => {
    const target = e.target;
    const teamId = target.dataset.id;
    if (target.classList.contains('delete-team-btn')) deleteTeam(teamId);
    if (target.classList.contains('reset-team-btn')) resetTeam(teamId);
    if (target.classList.contains('login-qr-btn')) generateQrCode('login', teamId, 'Team Login QR Code');
    if (target.classList.contains('view-progress-btn')) viewTeamProgress(teamId, target.dataset.name);
});

cluesList.addEventListener('click', e => {
    const target = e.target;
    const clueId = target.dataset.id;
    if (target.classList.contains('delete-clue-btn')) deleteClue(clueId);
    if (target.classList.contains('clue-qr-btn')) generateQrCode('clue', clueId, `Clue #${target.dataset.order} QR Code`);
});

closeButtons.forEach(btn => btn.addEventListener('click', () => {
    closeModal(qrModal);
    closeModal(progressModal);
}));


// --- INITIALIZATION ---
checkUser();
subscribeToChanges();
