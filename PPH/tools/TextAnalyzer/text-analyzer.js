        const textArea = document.getElementById('textArea');
        const fileInput = document.getElementById('fileInput');
        const livePreview = document.getElementById('livePreview');
        const errorMessage = document.getElementById('errorMessage');
        const resultBox = document.getElementById('resultBox');

        // Live Preview Logic
        textArea.addEventListener('input', () => {
            const val = textArea.value;
            const chars = val.length;
            const words = val.trim() ? val.trim().split(/\s+/).length : 0;
            livePreview.innerText = `Live: ${chars} characters, ${words} words`;
        });

        // File Upload Logic
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.name.endsWith(".txt")) {
                showError("Only .txt files are supported.");
                return;
            }

            if (file.size > 1024 * 1024) {
                showError("File too large. Please upload under 1MB.");
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                textArea.value = ev.target.result;
                errorMessage.style.display = "none";
                textArea.dispatchEvent(new Event('input')); // Update live counter
            };
            reader.readAsText(file);
        });

        function analyseText() {
            const text = textArea.value;
            errorMessage.style.display = "none";

            if (!text.trim()) {
                showError("Please enter text or upload a file.");
                return;
            }

            // Calculation Logic
            const lines = text.split("\n").filter(l => l.trim() !== "").length;
            const chars = text.length;
            const wordsArray = text.toLowerCase().replace(/[^\w\s\n]/g, " ").split(/\s+/).filter(w => w);
            const words = wordsArray.length;
            const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;

            // Word Frequency
            const count = {};
            let max = 0;
            let most = "None";

            wordsArray.forEach(w => {
                count[w] = (count[w] || 0) + 1;
                if (count[w] > max) {
                    max = count[w];
                    most = w;
                }
            });

            if (max <= 1) most = "No word repeated";
            else most = `"${most}" (${max} times)`;

            const readability = calculateReadability(text, wordsArray);

            // Update UI
            document.getElementById('resLines').innerText = lines;
            document.getElementById('resChars').innerText = chars;
            document.getElementById('resWords').innerText = words;
            document.getElementById('resPara').innerText = paragraphs;
            document.getElementById('resMost').innerText = most;
            document.getElementById('resReadability').innerText = readability;

            resultBox.style.display = "block";
        }

        // Estimates syllables in a word using common English vowel-group
        // heuristics. Not perfectly accurate for every irregular word, but
        // close enough for a reading-ease estimate.
        function countSyllables(word) {
            word = word.toLowerCase().replace(/[^a-z]/g, "");
            if (!word) return 0;
            if (word.length <= 3) return 1;
            word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
            word = word.replace(/^y/, "");
            const matches = word.match(/[aeiouy]{1,2}/g);
            return matches ? matches.length : 1;
        }

        // Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
        // Higher score = easier to read.
        function calculateReadability(text, wordsArray) {
            const sentenceCount = (text.match(/[^.!?]+[.!?]+/g) || [text]).filter(s => s.trim()).length || 1;
            const wordCount = wordsArray.length || 1;
            const syllableCount = wordsArray.reduce((sum, w) => sum + countSyllables(w), 0);

            const score = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllableCount / wordCount);
            const rounded = Math.max(0, Math.min(100, Math.round(score)));

            let label;
            if (rounded >= 90) label = "Very easy";
            else if (rounded >= 70) label = "Easy";
            else if (rounded >= 50) label = "Standard";
            else if (rounded >= 30) label = "Difficult";
            else label = "Very difficult";

            return `${rounded}/100 (${label})`;
        }

        function clearAll() {
            textArea.value = "";
            fileInput.value = "";
            resultBox.style.display = "none";
            errorMessage.style.display = "none";
            textArea.dispatchEvent(new Event('input'));
        }

        function showError(msg) {
            errorMessage.innerText = msg;
            errorMessage.style.display = "block";
            resultBox.style.display = "none";
        }
