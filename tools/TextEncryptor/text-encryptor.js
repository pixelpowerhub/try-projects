    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const methodSelect = document.getElementById('methodSelect');
    const alertBox = document.getElementById('alertBox');
    const copyBtn = document.getElementById('copyBtn');
    const exportBtn = document.getElementById('exportBtn');

    const methods = {
        caesar: {
            encrypt: (txt, shift = 13) => 
                txt.replace(/[a-zA-Z]/g, c => {
                    const base = c <= "Z" ? 65 : 97;
                    return String.fromCharCode((c.charCodeAt(0) - base + shift) % 26 + base);
                }),
            decrypt: (txt, shift = 13) => methods.caesar.encrypt(txt, 26 - shift)
        },
        rot13: {
            encrypt: txt => methods.caesar.encrypt(txt, 13),
            decrypt: txt => methods.caesar.encrypt(txt, 13)
        },
        atbash: {
            encrypt: txt =>
                txt.replace(/[a-zA-Z]/g, c => {
                    const base = c <= "Z" ? 65 : 97;
                    return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base));
                }),
            decrypt: txt => methods.atbash.encrypt(txt)
        },
        base64: {
            encrypt: txt => btoa(encodeURIComponent(txt).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode("0x" + p))),
            decrypt: txt => {
                try {
                    return decodeURIComponent(atob(txt).split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join(""));
                } catch { throw new Error("Invalid Base64 string"); }
            }
        },
        reverse: {
            encrypt: txt => [...txt].reverse().join(""),
            decrypt: txt => [...txt].reverse().join("")
        }
    };

    function showAlert(msg, type = 'success') {
        alertBox.innerText = msg;
        alertBox.className = `alert ${type}`;
        alertBox.style.display = 'block';
        setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
    }

    function handleProcess(action) {
        const text = inputText.value;
        const method = methodSelect.value;
        
        if (!text.trim()) {
            showAlert("Please enter some text or upload a file", "error");
            return;
        }

        try {
            const result = methods[method][action](text);
            outputText.innerText = result;
            copyBtn.disabled = false;
            exportBtn.disabled = false;
            showAlert(`${action.charAt(0).toUpperCase() + action.slice(1)}ed successfully!`);
        } catch (e) {
            showAlert(e.message, "error");
        }
    }

    async function copyText() {
        try {
            await navigator.clipboard.writeText(outputText.innerText);
            showAlert("Result copied to clipboard!");
        } catch {
            showAlert("Copy failed", "error");
        }
    }

    // File Handling
    document.getElementById('fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.txt')) {
            showAlert("Only .txt files are supported", "error");
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => { inputText.value = ev.target.result; };
        reader.readAsText(file);
    });

    // Modal & Export
    function openModal() { document.getElementById('exportModal').style.display = 'flex'; }
    function closeModal() { document.getElementById('exportModal').style.display = 'none'; }

    function exportTxt() {
        const content = outputText.innerText;
        let fileName = document.getElementById('fileNameInput').value;
        if (!fileName.endsWith('.txt')) fileName += '.txt';

        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        closeModal();
        showAlert("Downloaded successfully!");
    }
