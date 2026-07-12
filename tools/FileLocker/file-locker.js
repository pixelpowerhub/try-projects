/**
 * File Encryptor and Decryptor
 *
 * BUG FIX (large files failing): the previous version bundled every
 * selected file's content as a base64 data URL, then wrapped the whole
 * lot in one giant JSON string and ran it through btoa(). JavaScript
 * strings have a hard length ceiling (roughly 512MB-1GB depending on
 * the browser), and base64 already inflates data by about 33% — so
 * selecting more than a couple of GB total would blow past that limit
 * and the file would silently fail to build. It could also throw
 * outright if any filename contained non-Latin characters, since
 * btoa() only accepts Latin1 text.
 *
 * This version builds the .pph file as a real binary container: a
 * small JSON header (just filenames, sizes, salts, and IVs — never
 * bulk file data) followed by each file's AES-GCM-encrypted bytes
 * concatenated directly as binary. Only that tiny header ever touches
 * JSON/base64, so the size of your files no longer matters to the
 * string-length ceiling that caused the bug. Unlocking also now reads
 * only the header first (near-instant regardless of vault size)
 * instead of loading the entire vault into memory just to check a
 * password.
 *
 * This also happens to fix a real security issue: the old format
 * stored your password in plain text inside the vault file. Passwords
 * are never stored now — the vault's real encryption key is instead
 * "wrapped" separately under a key derived from your password, and
 * again under a key derived from your hint answers, so either one can
 * unlock it without either secret ever being written down anywhere.
 */

let selectedFiles = [];
let currentMode = 'encrypt';
let vaultInfo = null; // { file, meta, fileOffsets } for decrypt mode

const PBKDF2_ITERATIONS = 150000;
const HEADER_FIXED_SIZE = 8 + 2 + 4; // magic (8) + version (2) + metadata length (4)

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
    vaultInfo = null;
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

// The label is styled as our file-picker button and works fine with a
// mouse/touch tap on its own (native label-for-input behavior), but a
// <label> isn't natively keyboard-operable like a real <button> — add
// Enter/Space handling so keyboard users can open the file picker too.
document.getElementById('file-picker-label').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.getElementById('fileInput').click();
    }
});

/**
 * FILE HANDLING
 */
document.getElementById('fileInput').addEventListener('change', (e) => {
    const newFiles = Array.from(e.target.files);
    const statusBox = document.getElementById('file-status');

    // Reset the input's own value so the SAME file(s) can be re-selected
    // later (e.g. after removing one and re-adding it). We do this last,
    // after reading e.target.files above, so it never affects the files
    // we just received.
    if (newFiles.length === 0) {
        e.target.value = '';
        return;
    }

    if (currentMode === 'decrypt') {
        if (newFiles.length > 1) {
            statusBox.innerHTML = '<p class="file-error">Please select only one locked (.pph) file to unlock at a time.</p>';
            e.target.value = '';
            return;
        }
        loadVaultFile(newFiles[0]);
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
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function buildFileRow(file, index, removable) {
    let previewHtml;
    if (file.type && file.type.startsWith('image/')) {
        if (!thumbnailUrls.has(index)) {
            thumbnailUrls.set(index, URL.createObjectURL(file));
        }
        previewHtml = `<img src="${thumbnailUrls.get(index)}" alt="" class="file-thumb" width="36" height="36">`;
    } else {
        previewHtml = `<span class="file-thumb file-thumb-icon" aria-hidden="true">${getFileIcon(file)}</span>`;
    }

    const removeBtn = removable
        ? `<button type="button" class="btn-remove" onclick="removeFile(${index})" aria-label="Remove ${escapeHtml(file.name)}">&times;</button>`
        : '';

    return `
        <div class="file-item" role="listitem">
            ${previewHtml}
            <span class="file-item-info">
                <span class="file-item-name">${escapeHtml(file.name)}</span>
                <span class="file-item-size">${formatFileSize(file.size)}</span>
            </span>
            ${removeBtn}
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
        statusBox.innerHTML = '<p>No files selected yet.</p>';
        updateButtonState();
        return;
    }

    // Single file: show it directly, no need to collapse anything.
    if (selectedFiles.length === 1) {
        let html = `<div class="file-list-container" role="list">${buildFileRow(selectedFiles[0], 0, true)}</div>`;
        html += `<button type="button" class="btn-add-more" onclick="document.getElementById('fileInput').click()">+ Add More Files</button>`;
        statusBox.innerHTML = html;
        updateButtonState();
        return;
    }

    // Multiple files: collapsed-by-default summary with a native, accessible
    // expand/collapse (<details>/<summary>) so screen readers and keyboard
    // users get this for free with no extra ARIA state to manage.
    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    const rows = selectedFiles.map((file, index) => buildFileRow(file, index, true)).join('');

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

/**
 * CRYPTO HELPERS (Web Crypto / SubtleCrypto — runs natively in the browser,
 * no external libraries needed)
 */
async function deriveKey(secretString, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(secretString), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

function randomBytes(len) {
    return crypto.getRandomValues(new Uint8Array(len));
}

// Base64 helpers — used ONLY for small values (salts, IVs, wrapped keys,
// a few dozen bytes each), never for bulk file content, which is what
// caused the original size-limit bug.
function toB64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}
function fromB64(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

async function generateContentKey() {
    return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function wrapCEK(cekRawBytes, kek, iv) {
    return crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, cekRawBytes);
}
async function unwrapCEK(wrappedBytes, kek, iv) {
    // Throws automatically if the key is wrong — AES-GCM's built-in
    // authentication tag check does password validation for us, so we
    // never need to store the password anywhere to check it later.
    const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, kek, wrappedBytes);
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function encryptFileBuf(plainBuf, cek) {
    const iv = randomBytes(12);
    const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cek, plainBuf);
    return { iv, cipherBuf };
}
async function decryptFileBuf(cipherBuf, iv, cek) {
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cek, cipherBuf);
}

/**
 * BINARY VAULT FORMAT
 * [8 bytes magic "PPHVAULT"][2 bytes version][4 bytes metadata length]
 * [metadata JSON, UTF-8][file 1 ciphertext][file 2 ciphertext]...
 */
function buildHeader(metaByteLength) {
    const header = new Uint8Array(HEADER_FIXED_SIZE);
    header.set(new TextEncoder().encode("PPHVAULT"), 0);
    const dv = new DataView(header.buffer);
    dv.setUint16(8, 2, false);
    dv.setUint32(10, metaByteLength, false);
    return header;
}

async function buildVaultBlob(metaObj, cipherParts) {
    const metaBytes = new TextEncoder().encode(JSON.stringify(metaObj));
    const header = buildHeader(metaBytes.byteLength);
    // Passing the encrypted ArrayBuffers straight into Blob() lets the
    // browser assemble the final file without ever holding one giant
    // string in memory — this is what actually removes the size ceiling.
    return new Blob([header, metaBytes, ...cipherParts], { type: 'application/octet-stream' });
}

async function readVaultHeader(file) {
    const headerBuf = await file.slice(0, HEADER_FIXED_SIZE).arrayBuffer();
    const dv = new DataView(headerBuf);
    const magic = new TextDecoder().decode(new Uint8Array(headerBuf, 0, 8));
    if (magic !== "PPHVAULT") throw new Error("not-a-vault");
    const version = dv.getUint16(8, false);
    const metaLength = dv.getUint32(10, false);

    // Only the small metadata header is read here — never the bulk file
    // data — so this stays fast even for a multi-gigabyte vault.
    const metaBuf = await file.slice(HEADER_FIXED_SIZE, HEADER_FIXED_SIZE + metaLength).arrayBuffer();
    const meta = JSON.parse(new TextDecoder().decode(metaBuf));

    let offset = HEADER_FIXED_SIZE + metaLength;
    const fileOffsets = meta.files.map(f => {
        const start = offset;
        offset += f.size;
        return { ...f, start, end: offset };
    });

    return { meta, fileOffsets, version };
}

async function tryUnlockWithSecret(meta, secretString, saltKey, ivKey, wrappedKey) {
    const salt = fromB64(meta[saltKey]);
    const iv = fromB64(meta[ivKey]);
    const wrapped = fromB64(meta[wrappedKey]);
    const kek = await deriveKey(secretString, salt);
    return unwrapCEK(wrapped, kek, iv); // throws if the secret is wrong
}

/**
 * DECRYPT MODE: load a vault file (reads header + metadata only — fast
 * even for very large vaults) and show what's inside before unlocking.
 */
async function loadVaultFile(file) {
    const statusBox = document.getElementById('file-status');
    statusBox.innerHTML = '<p>Reading vault file…</p>';
    try {
        const { meta, fileOffsets } = await readVaultHeader(file);
        vaultInfo = { file, meta, fileOffsets };

        const rows = fileOffsets.map((f, i) => buildFileRow({ name: f.name, size: f.size, type: '' }, i, false)).join('');
        statusBox.innerHTML = `<div class="file-list-container" role="list">${rows}</div>`;

        // Hide the "Forgot Password?" recovery path entirely if this vault
        // was locked without hint answers — offering it would be misleading.
        const forgotBtn = document.getElementById('btn-forgot-link');
        forgotBtn.style.display = meta.hasHintRecovery ? '' : 'none';

        selectedFiles = [file]; // enables the "Proceed to Unlock" button
        updateButtonState();
    } catch (err) {
        statusBox.innerHTML = '<p class="file-error">This doesn\'t look like a valid Pixel Power Hub vault (.pph) file.</p>';
        selectedFiles = [];
        vaultInfo = null;
        updateButtonState();
    }
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
 * ENCRYPT LOGIC
 */
document.getElementById('btn-final-lock').addEventListener('click', async () => {
    const p1 = document.getElementById('enc-pass').value;
    const p2 = document.getElementById('enc-confirm').value;
    const q1 = document.getElementById('enc-q1').value.trim();
    const a1 = document.getElementById('enc-a1').value.trim();
    const q2 = document.getElementById('enc-q2').value.trim();
    const a2 = document.getElementById('enc-a2').value.trim();

    if (p1.length < 8 || p1 !== p2) return alert("Please check password requirements: at least 8 characters, and both fields must match.");

    toggleLoading('btn-final-lock', true);

    try {
        const cek = await generateContentKey();
        const cekRaw = new Uint8Array(await crypto.subtle.exportKey('raw', cek));

        const cipherParts = [];
        const fileMeta = [];
        for (const file of selectedFiles) {
            const plainBuf = await file.arrayBuffer();
            const { iv, cipherBuf } = await encryptFileBuf(plainBuf, cek);
            fileMeta.push({ name: file.name, size: cipherBuf.byteLength, iv: toB64(iv) });
            cipherParts.push(cipherBuf);
        }

        const saltPass = randomBytes(16), ivWrapPass = randomBytes(12);
        const kekPass = await deriveKey(p1, saltPass);
        const wrappedCekPass = new Uint8Array(await wrapCEK(cekRaw, kekPass, ivWrapPass));

        const hasHintRecovery = Boolean(q1 && a1 && q2 && a2);
        const metaObj = {
            version: 2,
            hint1_q: q1,
            hint2_q: q2,
            hasHintRecovery,
            salt_pass: toB64(saltPass),
            iv_wrap_pass: toB64(ivWrapPass),
            wrapped_cek_pass: toB64(wrappedCekPass),
            files: fileMeta
        };

        if (hasHintRecovery) {
            const hintSecret = a1.toLowerCase() + "||" + a2.toLowerCase();
            const saltHint = randomBytes(16), ivWrapHint = randomBytes(12);
            const kekHint = await deriveKey(hintSecret, saltHint);
            const wrappedCekHint = new Uint8Array(await wrapCEK(cekRaw, kekHint, ivWrapHint));
            metaObj.salt_hint = toB64(saltHint);
            metaObj.iv_wrap_hint = toB64(ivWrapHint);
            metaObj.wrapped_cek_hint = toB64(wrappedCekHint);
        }

        const vaultBlob = await buildVaultBlob(metaObj, cipherParts);
        const url = URL.createObjectURL(vaultBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "pixel_vault_bundle.pph";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSuccess("Successfully Encrypted and Downloaded!");
    } catch (err) {
        console.error(err);
        alert("Something went wrong while locking your files. If you selected a very large file, your device may have run out of available memory — try locking fewer files at once.");
    } finally {
        toggleLoading('btn-final-lock', false, "Lock File & Download");
        clearCredentials();
    }
});

/**
 * DECRYPT LOGIC
 */
document.getElementById('btn-final-unlock').addEventListener('click', async () => {
    if (!vaultInfo) return;
    const pass = document.getElementById('dec-pass').value;
    toggleLoading('btn-final-unlock', true);
    try {
        const cek = await tryUnlockWithSecret(vaultInfo.meta, pass, 'salt_pass', 'iv_wrap_pass', 'wrapped_cek_pass');
        await performUnlock(cek);
        showSuccess("Successfully Decrypted and Downloaded!");
    } catch (err) {
        alert("Invalid Password.");
    } finally {
        toggleLoading('btn-final-unlock', false, "Unlock File");
        clearCredentials();
    }
});

async function performUnlock(cek) {
    const { file, fileOffsets } = vaultInfo;
    for (const f of fileOffsets) {
        const cipherBuf = await file.slice(f.start, f.end).arrayBuffer();
        const iv = fromB64(f.iv);
        const plainBuf = await decryptFileBuf(cipherBuf, iv, cek);
        const blob = new Blob([plainBuf], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        // Defer cleanup slightly so the browser has time to start the
        // download before we revoke the object URL backing it.
        await new Promise(resolve => setTimeout(() => {
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
            resolve();
        }, 100));
    }
}

document.getElementById('btn-forgot-link').addEventListener('click', () => {
    document.getElementById('display-q1').innerText = `Q1: ${vaultInfo.meta.hint1_q}`;
    document.getElementById('display-q2').innerText = `Q2: ${vaultInfo.meta.hint2_q}`;
    document.getElementById('hint-drawer').classList.remove('hidden');
    document.getElementById('dec-a1').focus();
});

document.getElementById('btn-hint-unlock').addEventListener('click', async () => {
    if (!vaultInfo) return;
    const a1 = document.getElementById('dec-a1').value.trim().toLowerCase();
    const a2 = document.getElementById('dec-a2').value.trim().toLowerCase();
    toggleLoading('btn-hint-unlock', true);
    try {
        const cek = await tryUnlockWithSecret(vaultInfo.meta, `${a1}||${a2}`, 'salt_hint', 'iv_wrap_hint', 'wrapped_cek_hint');
        await performUnlock(cek);
        showSuccess("Successfully Decrypted and Downloaded!");
    } catch (err) {
        alert("Incorrect hints.");
    } finally {
        toggleLoading('btn-hint-unlock', false, "Unlock via Hints");
        clearCredentials();
    }
});

function showSuccess(msg) {
    document.querySelectorAll('.vault-step').forEach(s => s.classList.add('hidden'));
    document.getElementById('success-screen').classList.remove('hidden');
    document.getElementById('success-msg').innerText = msg;
}
