import supabase from './supabase.js';
import { initializeScanner, stopScanner } from './scanner.js';

// DOM Elements
const playerLoginSection = document.getElementById('player-login');
const playerDashboardSection = document.getElementById('player-dashboard');
const gameOverSection = document.getElementById('game-over-section');
const scanLoginQrButton = document.getElementById('scan-login-qr-button');
const loginQrScannerContainer = document.getElementById('login-qr-scanner');
const teamNameDisplay = document.getElementById('team-name-display');
const progressCountDisplay = document.getElementById('progress-count');
const totalCluesDisplay = document.getElementById('total-clues');
const clueOrderDisplay = document.getElementById('clue-order-display');
const clueContent = document.getElementById('clue-content');
const answerForm = document.getElementById('answer-form');
const answerInput = document.getElementById('answer-input');
const feedbackMessage = document.getElementById('feedback-message');
const scanClueQrButton = document.getElementById('scan-clue-qr-button');
const clueQrScannerContainer = document.getElementById('clue-qr-scanner');
const finalCodeDisplay = document.getElementById('final-code');
const qrReaderLoginEl = 'qr-reader-login';
const qrReaderClueEl = 'qr-reader-clue';


// State
let currentTeam = null;
let masterClues = [];
let loginScanner = null;
let clueScanner = null;

// --- UTILITY FUNCTIONS ---
function showSection(section) {
    playerLoginSection.classList.add('hidden');
    playerDashboardSection.classList.add('hidden');
    gameOverSection.classList.add('hidden');
    section.classList.remove('hidden');
}

// --- PLAYER LOGIN ---
function startLoginScan() {
    loginQrScannerContainer.classList.remove('hidden');
    scanLoginQrButton.classList.add('hidden');
    loginScanner = initializeScanner(qrReaderLoginEl, handleLoginQrScan);
}

async function handleLoginQrScan(decodedText) {
    try {
        const data = JSON.parse(decodedText);
        if (data.type === 'login' && data.id) {
            stopScanner(loginScanner);
            loginQrScannerContainer.classList.add('hidden');
            await loginTeam(data.id);
        }
    } catch (error) {
        console.warn('Scanned QR is not a valid login QR:', error);
        feedbackMessage.textContent = 'Invalid QR Code. Please scan a valid team login QR code.';
    }
}

async function loginTeam(teamId) {
    const { data, error } = await supabase.from('teams').select('*').eq('id', teamId).single();
    if (error || !data) {
        alert('Error: Could not find team. Please try again.');
        showSection(playerLoginSection);
        scanLoginQrButton.classList.remove('hidden');
        return;
    }
    currentTeam = data;
    localStorage.setItem('treasureHuntTeamId', teamId);
    await initializeDashboard();
}

async function checkLoggedIn() {
    const teamId = localStorage.getItem('treasureHuntTeamId');
    if (teamId) {
        await loginTeam(teamId);
    } else {
        showSection(playerLoginSection);
    }
}

// --- DASHBOARD & GAMEPLAY ---
async function initializeDashboard() {
    await fetchMasterClues();
    updateDashboardUI();
    await displayCurrentClue();
    showSection(playerDashboardSection);
}

async function fetchMasterClues() {
    const { data, error } = await supabase.from('master_clues').select('*').order('clue_order');
    if (error) {
        console.error('Failed to fetch clues:', error);
        alert('Error: Could not load clues.');
        return;
    }
    masterClues = data;
    totalCluesDisplay.textContent = masterClues.length;
}

function updateDashboardUI() {
    teamNameDisplay.textContent = currentTeam.name;
    progressCountDisplay.textContent = currentTeam.solved_count;
}

async function displayCurrentClue() {
    const nextClueIndex = currentTeam.solved_count;

    if (nextClueIndex >= masterClues.length) {
        await showGameOver();
        return;
    }

    const currentClue = masterClues[nextClueIndex];
    clueOrderDisplay.textContent = `Clue #${currentClue.clue_order}`;

    let contentHtml = '';
    switch (currentClue.type) {
        case 'text':
            contentHtml = `<p>${currentClue.transcript}</p>`;
            break;
        case 'video':
            contentHtml = `<p>${currentClue.transcript}</p><video src="${currentClue.url}" controls width="100%"></video>`;
            break;
        case 'json':
             contentHtml = `<p>${currentClue.transcript}</p><pre><code>${JSON.stringify(JSON.parse(currentClue.url), null, 2)}</code></pre>`;
            break;
    }
    clueContent.innerHTML = contentHtml;

    // Hide scan button until answer is submitted
    scanClueQrButton.classList.add('hidden');
    answerForm.classList.remove('hidden');
    feedbackMessage.textContent = '';
    answerInput.value = '';
}

async function handleAnswerSubmit(e) {
    e.preventDefault();
    const submittedAnswer = answerInput.value.trim().toLowerCase();
    const currentClue = masterClues[currentTeam.solved_count];
    const correctAnswer = currentClue.answer.trim().toLowerCase();

    const isCorrect = submittedAnswer === correctAnswer;

    // Update team progress in Supabase
    const newSolvedClue = {
        clueId: currentClue.id,
        answer: submittedAnswer,
        time: new Date().toISOString()
    };

    let updatedSolvedClues = currentTeam.solved_clues || [];
    updatedSolvedClues.push(newSolvedClue);

    const updatePayload = {
        solved_clues: updatedSolvedClues,
        last_updated: new Date().toISOString()
    };

    if (isCorrect) {
        feedbackMessage.textContent = 'Correct! Well done.';
        feedbackMessage.style.color = '#00ff00';
        updatePayload.solved_count = currentTeam.solved_count + 1;

        // Hide form, show scan button for next clue
        answerForm.classList.add('hidden');
        if (updatePayload.solved_count < masterClues.length) {
             scanClueQrButton.classList.remove('hidden');
        }

    } else {
        feedbackMessage.textContent = 'Incorrect. Please try again.';
        feedbackMessage.style.color = '#ff0000';
    }

    const { data, error } = await supabase
        .from('teams')
        .update(updatePayload)
        .eq('id', currentTeam.id)
        .select()
        .single();

    if (error) {
        alert('Error saving your progress. Please try again.');
        console.error('Update error:', error);
        return;
    }

    currentTeam = data; // Update local state with latest from DB
    updateDashboardUI();

    if (isCorrect) {
       if (currentTeam.solved_count >= masterClues.length) {
           await showGameOver();
       }
    }
}

function startClueScan() {
    clueQrScannerContainer.classList.remove('hidden');
    scanClueQrButton.classList.add('hidden');
    clueScanner = initializeScanner(qrReaderClueEl, handleClueQrScan);
}

async function handleClueQrScan(decodedText) {
    try {
        const data = JSON.parse(decodedText);
        const nextClue = masterClues[currentTeam.solved_count];

        if (data.type === 'clue' && data.id === nextClue.id) {
            stopScanner(clueScanner);
            clueQrScannerContainer.classList.add('hidden');
            await displayCurrentClue();
        } else {
             alert('This is not the correct clue QR code. Keep searching!');
        }
    } catch (error) {
        console.warn('Scanned QR is not a valid clue QR:', error);
    }
}


// --- GAME OVER ---
async function showGameOver() {
    const finalCode = masterClues
        .slice(0, currentTeam.solved_count)
        .sort((a, b) => a.clue_order - b.clue_order)
        .map(clue => clue.digit)
        .join('');

    finalCodeDisplay.textContent = finalCode;
    showSection(gameOverSection);
}

// --- EVENT LISTENERS ---
scanLoginQrButton.addEventListener('click', startLoginScan);
answerForm.addEventListener('submit', handleAnswerSubmit);
scanClueQrButton.addEventListener('click', startClueScan);

// --- INITIALIZATION ---
checkLoggedIn();
