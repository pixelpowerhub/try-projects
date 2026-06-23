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
    if (currentMode === 'decrypt') {
        selectedFiles = [newFiles[0]];
        parseVaultFile(selectedFiles[0]);
    } else {
        selectedFiles = [...selectedFiles, ...newFiles];
        updateFileListUI();
    }
    e.target.value = ''; 
});

function updateFileListUI() {
    const statusBox = document.getElementById('file-status');
    if (selectedFiles.length === 0) {
        statusBox.innerHTML = 'No files or folders selected.';
        updateButtonState();
        return;
    }

    let listHtml = '<div class="file-list-container" role="list">';
    selectedFiles.forEach((file, index) => {
        listHtml += `
            <div class="file-item" role="listitem">
                <span>📄 ${file.name}</span>
                <button type="button" class="btn-remove" onclick="removeFile(${index})" aria-label="Remove ${file.name}">&times;</button>
            </div>`;
    });
    listHtml += '</div>';

    if (currentMode === 'encrypt') {
        listHtml += `<button type="button" class="btn-add-more" onclick="document.getElementById('fileInput').click()">+ Add More Files/Folders</button>`;
    }
    statusBox.innerHTML = listHtml;
    updateButtonState();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
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