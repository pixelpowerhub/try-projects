        let currentPassword = "";
        let isHidden = false;

        // Cryptographically secure random integer in [0, max)
        function secureRandomInt(max) {
            const array = new Uint32Array(1);
            crypto.getRandomValues(array);
            return array[0] % max;
        }

        function generatePassword() {
            const length = parseInt(document.getElementById('length').value, 10);
            const upper = document.getElementById('upper').checked;
            const lower = document.getElementById('lower').checked;
            const numbers = document.getElementById('numbers').checked;
            const special = document.getElementById('special').checked;
            const msgEl = document.getElementById('message');
            const passDisplay = document.getElementById('passwordResult');
            const actionBtns = document.getElementById('actionButtons');

            msgEl.innerText = "";

            if (isNaN(length) || length < 4 || length > 128) {
                showMessage("Password length must be between 4 and 128.", "error");
                return;
            }

            const sets = [];
            if (upper) sets.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
            if (lower) sets.push("abcdefghijklmnopqrstuvwxyz");
            if (numbers) sets.push("0123456789");
            if (special) sets.push("!@#$%^&*()_+-=[]{}|;':\",./<>?");

            if (sets.length === 0) {
                showMessage("Please select at least one character type.", "error");
                return;
            }

            if (length < sets.length) {
                showMessage(`Password length must be at least ${sets.length} to include one of every selected character type.`, "error");
                return;
            }

            let chars = [];
            // Ensure at least one char from each selected set
            sets.forEach(set => {
                chars.push(set[secureRandomInt(set.length)]);
            });

            const pool = sets.join("");
            while (chars.length < length) {
                chars.push(pool[secureRandomInt(pool.length)]);
            }

            // Unbiased Fisher–Yates shuffle (the previous sort-based shuffle
            // produces a statistically biased ordering, not a true random one)
            for (let i = chars.length - 1; i > 0; i--) {
                const j = secureRandomInt(i + 1);
                [chars[i], chars[j]] = [chars[j], chars[i]];
            }
            currentPassword = chars.join("");

            isHidden = false;
            updateDisplay();

            passDisplay.style.display = "block";
            actionBtns.style.display = "flex";
            document.getElementById('toggleBtn').innerText = "Hide";
        }

        function updateDisplay() {
            const passDisplay = document.getElementById('passwordResult');
            passDisplay.innerText = isHidden ? "••••••••••••" : currentPassword;
        }

        function toggleVisibility() {
            isHidden = !isHidden;
            updateDisplay();
            document.getElementById('toggleBtn').innerText = isHidden ? "Show" : "Hide";
        }

        async function copyToClipboard() {
            try {
                await navigator.clipboard.writeText(currentPassword);
                showMessage("Password copied to clipboard!", "success");
            } catch {
                showMessage("Copy failed. Please copy manually.", "error");
            }
        }

        function showMessage(text, type) {
            const msgEl = document.getElementById('message');
            msgEl.innerText = text;
            msgEl.style.color = type === "error" ? "var(--error-color)" : "var(--success-color)";
        }
