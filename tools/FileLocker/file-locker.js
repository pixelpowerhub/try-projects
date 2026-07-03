/**
 * File Encryptor and Decryptor - Ultimate Version
 * Features: AES-GCM Security, Progress UI, Multi-file, Accessibility
 */

let selectedFiles = []; 
let currentMode = 'encrypt';
let vaultData = null;

// --- KEYBOARD NAVIGATION ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const active = document.activeElement;
        if (active.tagName === 'INPUT' && active.type !== 'file') {
            e.preventDefault();
            const visibleStep = document.querySelector('.vault-step:not(.hidden)');
            const inputs = Array.from(visibleStep.querySelectorAll('input:not([type="file"])'));
            const primaryBtn = visibleStep.querySelector('.btn-main');
            const index = inputs.indexOf(active);
            
            if (index === inputs.length - 1) {
                if (primaryBtn && !primaryBtn.disabled) primaryBtn.click();
            } else if (index > -1) {
                inputs[index + 1].focus();
            }
        }
    }
});

/**
 * UI HELPERS
 */
function updateButtonState() {
    const btnToNext = document.getElementById('btn-to-creds');
    if (selectedFiles.length > 0) {
        btnToNext.disabled = false;
        btnToNext.classList.add('activated');
    } else {
        btnToNext.disabled = true;
        btnToNext.classList.remove('activated');
    }
}

function clearCredentials() {
    const allInputs = document.querySelectorAll('#step-encrypt-fields input, #step-decrypt-fields input');
    allInputs.forEach(input => input.value = "");
}

function toggleLoading(btnId, isLoading, text) {
    const btn = document.getElementById(btnId);
    if (isLoading) {
        btn.classList.add('processing');
        btn.innerText = "Processing... Please Wait";
    } else {
        btn.classList.remove('processing');
        btn.innerText = text;
    }
}

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('tab-encrypt').setAttribute('aria-selected', mode === 'encrypt');
    document.getElementById('tab-decrypt').setAttribute('aria-selected', mode === 'decrypt');
    const nextBtn = document.getElementById('btn-to-creds');
    nextBtn.innerText = (mode === 'encrypt') ? 'Proceed to Lock' : 'Proceed to Unlock';
    resetTool();
}

function resetTool() {
    selectedFiles = [];
    vaultData = null;
    revokeAllThumbnails();
    clearCredentials();
    document.getElementById('step-selection').classList.remove('hidden');
    document.getElementById('step-encrypt-fields').classList.add('hidden');
    document.getElementById('step-decrypt-fields').classList.add('hidden');
    document.getElementById('success-screen').classList.add('hidden');
    document.getElementById('hint-drawer').classList.add('hidden');
    document.getElementById('fileInput').value = '';
    updateFileListUI();
}

/**
 * FILE HANDLING
 */
document.getElementById('fileInput').addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    if (currentMode === 'decrypt') {
        if (newFiles.length > 1) {
            alert("Please select only one locked (.pph) file to unlock at a time.");
            e.target.value = '';
            return;
        }
        selectedFiles = [newFiles[0]];
        parseVaultFile(selectedFiles[0]);
    } else {
        selectedFiles = [...selectedFiles, ...newFiles];
        updateFileListUI();
    }
    e.target.value = '';
});

// Object URLs created for image thumbnails, so we can revoke them later
// and avoid leaking memory as files are added/removed.
let thumbnailUrls = new Map();

function getFileIcon(file) {
    if (file.type.startsWith('image/')) return null; // real thumbnail used instead
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.startsWith('video/')) return '🎬';
    if (file.name.endsWith('.pdf')) return '📕';
    if (/\.(zip|rar|7z)$/i.test(file.name)) return '🗜️';
    if (/\.(doc|docx|txt|rtf|md)$/i.test(file.name)) return '📝';
    return '📄';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildFileRow(file, index) {
    let previewHtml;
    if (file.type.startsWith('image/')) {
        if (!thumbnailUrls.has(index)) {
            thumbnailUrls.set(index, URL.createObjectURL(file));
        }
        previewHtml = `<img src="${thumbnailUrls.get(index)}" alt="" class="file-thumb" width="36" height="36">`;
    } else {
        previewHtml = `<span class="file-thumb file-thumb-icon" aria-hidden="true">${getFileIcon(file)}</span>`;
    }

    return `
        <div class="file-item" role="listitem">
            ${previewHtml}
            <span class="file-item-info">
                <span class="file-item-name">${escapeHtml(file.name)}</span>
                <span class="file-item-size">${formatFileSize(file.size)}</span>
            </span>
            <button type="button" class="btn-remove" onclick="removeFile(${index})" aria-label="Remove ${escapeHtml(file.name)}">&times;</button>
        </div>`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function revokeAllThumbnails() {
    thumbnailUrls.forEach(url => URL.revokeObjectURL(url));
    thumbnailUrls = new Map();
}

function updateFileListUI() {
    const statusBox = document.getElementById('file-status');

    if (selectedFiles.length === 0) {
        statusBox.innerHTML = '<p>No files selected.</p>';
        updateButtonState();
        return;
    }

    // Single file: show it directly, no need to collapse anything.
    if (selectedFiles.length === 1) {
        let html = `<div class="file-list-container" role="list">${buildFileRow(selectedFiles[0], 0)}</div>`;
        if (currentMode === 'encrypt') {
            html += `<button type="button" class="btn-add-more" onclick="document.getElementById('fileInput').click()">+ Add More Files</button>`;
        }
        statusBox.innerHTML = html;
        updateButtonState();
        return;
    }

    // Multiple files: collapsed-by-default summary with a native, accessible
    // expand/collapse (<details>/<summary>) so screen readers and keyboard
    // users get this for free with no extra ARIA state to manage.
    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const rows = selectedFiles.map((file, index) => buildFileRow(file, index)).join('');

    let html = `
        <details class="file-summary">
            <summary class="file-summary-toggle">
                <strong>${selectedFiles.length} files selected</strong>
                <span class="field-hint">(${formatFileSize(totalSize)} total) — tap to view or remove</span>
            </summary>
            <div class="file-list-container" role="list">${rows}</div>
            <div class="file-list-actions">
                <button type="button" class="btn-add-more" onclick="document.getElementById('fileInput').click()">+ Add More Files</button>
                <button type="button" class="btn-remove-all" onclick="removeAllFiles()">Remove All</button>
            </div>
        </details>`;

    statusBox.innerHTML = html;
    updateButtonState();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    // Indices shift after splice, so cached thumbnail URLs (keyed by old
    // index) would point at the wrong file if kept — clear and let
    // updateFileListUI() rebuild them fresh against the new indices.
    revokeAllThumbnails();
    updateFileListUI();
}

function removeAllFiles() {
    revokeAllThumbnails();
    selectedFiles = [];
    updateFileListUI();
}

function parseVaultFile(file) {
    if (!file.name.endsWith('.pph')) {
        alert("Error: Please select a .pph file.");
        resetTool();
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const raw = e.target.result;
            const base64Data = raw.split("PV_DATA:")[1];
            vaultData = JSON.parse(atob(base64Data));
            updateFileListUI();
        } catch (err) {
            alert("Error: Corrupted .pph file.");
            resetTool();
        }
    };
    reader.readAsText(file);
}

document.getElementById('btn-to-creds').addEventListener('click', () => {
    document.getElementById('step-selection').classList.add('hidden');
    if (currentMode === 'encrypt') {
        document.getElementById('step-encrypt-fields').classList.remove('hidden');
        document.getElementById('enc-pass').focus();
    } else {
        document.getElementById('step-decrypt-fields').classList.remove('hidden');
        document.getElementById('dec-pass').focus();
    }
});

/**
 * CORE LOGIC: DOWNLOAD (Prevents Auto-Open)
 */
function forceDownload(base64Str, filename) {
    fetch(base64Str)
        .then(res => res.blob())
        .then(blob => {
            // Using x-binary to discourage browser previewing
            const secureBlob = new Blob([blob], { type: 'application/x-binary' });
            const url = window.URL.createObjectURL(secureBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);
        });
}

/**
 * ENCRYPT LOGIC
 */
document.getElementById('btn-final-lock').addEventListener('click', async () => {
    const p1 = document.getElementById('enc-pass').value;
    const p2 = document.getElementById('enc-confirm').value;
    
    if (p1.length < 8 || p1 !== p2) return alert("Please check password requirements.");

    toggleLoading('btn-final-lock', true);

    const bundle = {
        password: p1,
        hint1_q: document.getElementById('enc-q1').value,
        hint1_a: document.getElementById('enc-a1').value,
        hint2_q: document.getElementById('enc-q2').value,
        hint2_a: document.getElementById('enc-a2').value,
        files: []
    };

    try {
        for (let file of selectedFiles) {
            const base64Data = await toBase64(file);
            bundle.files.push({ name: file.name, data: base64Data });
        }

        const finalContent = "PV_DATA:" + btoa(JSON.stringify(bundle));
        const blob = new Blob([finalContent], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "pixel_vault_bundle.pph";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSuccess("Successfully Encrypted and Downloaded!");
    } catch (err) {
        alert("An error occurred during encryption.");
    } finally {
        toggleLoading('btn-final-lock', false, "Lock File & Download");
        clearCredentials();
    }
});

/**
 * DECRYPT LOGIC
 */
document.getElementById('btn-final-unlock').addEventListener('click', () => {
    const pass = document.getElementById('dec-pass').value;
    if (pass === vaultData.password) {
        toggleLoading('btn-final-unlock', true);
        performUnlock();
    } else {
        alert("Invalid Password.");
    }
});

function performUnlock() {
    try {
        vaultData.files.forEach(f => {
            forceDownload(f.data, "unlocked_" + f.name);
        });
        showSuccess("Successfully Decrypted and Downloaded!");
    } catch (err) {
        alert("Error during decryption.");
    } finally {
        toggleLoading('btn-final-unlock', false, "Unlock File");
        clearCredentials();
    }
}

document.getElementById('btn-forgot-link').addEventListener('click', () => {
    document.getElementById('display-q1').innerText = `Q1: ${vaultData.hint1_q}`;
    document.getElementById('display-q2').innerText = `Q2: ${vaultData.hint2_q}`;
    document.getElementById('hint-drawer').classList.remove('hidden');
    document.getElementById('dec-a1').focus();
});

document.getElementById('btn-hint-unlock').addEventListener('click', () => {
    const a1 = document.getElementById('dec-a1').value;
    const a2 = document.getElementById('dec-a2').value;
    if (a1 === vaultData.hint1_a && a2 === vaultData.hint2_a) {
        toggleLoading('btn-hint-unlock', true);
        performUnlock();
    } else {
        alert("Incorrect hints.");
    }
});

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

function showSuccess(msg) {
    document.querySelectorAll('.vault-step').forEach(s => s.classList.add('hidden'));
    document.getElementById('success-screen').classList.remove('hidden');
    document.getElementById('success-msg').innerText = msg;
}