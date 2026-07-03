const textArea = document.getElementById('textArea');
const fileInput = document.getElementById('fileInput');
const livePreview = document.getElementById('livePreview');
const errorMessage = document.getElementById('errorMessage');
const resultBox = document.getElementById('resultBox');

// Live Preview Logic
textArea.addEventListener('input', () => {
    const val = textArea.value;
    const chars = [...val].length; // counts actual characters, not UTF-16 code units
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
    const chars = [...text].length; // Array.from-style spread counts real characters
    // BUG FIX: the previous regex used /[^\w\s\n]/ to strip punctuation before
    // splitting into words. JavaScript's \w matches ONLY [A-Za-z0-9_] — every
    // other letter (Hindi, Punjabi, Arabic, Chinese, accented Latin, etc.) was
    // being treated as punctuation and replaced with a space, which silently
    // shredded non-English text into nothing.
    //
    // Using \p{L} (any letter) and \p{N} (any number) fixes most of that, but
    // scripts like Devanagari and Gurmukhi also use combining vowel signs
    // (matras) that Unicode classifies as "Mark" (\p{M}), not "Letter" — so
    // without also keeping \p{M}, words like "परीक्षण" get chopped into
    // fragments at every vowel sign. Keeping \p{L}, \p{N}, and \p{M} together
    // (with the "u" flag) correctly handles every language and script.
    const wordsArray = text.toLowerCase().replace(/[^\p{L}\p{N}\p{M}\s\n]/gu, " ").split(/\s+/).filter(w => w);
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
    const readingTime = calculateReadingTime(words);

    // Update UI
    document.getElementById('resLines').innerText = lines;
    document.getElementById('resChars').innerText = chars;
    document.getElementById('resWords').innerText = words;
    document.getElementById('resPara').innerText = paragraphs;
    document.getElementById('resMost').innerText = most;
    document.getElementById('resReadability').innerText = readability;
    document.getElementById('resReadingTime').innerText = readingTime;

    resultBox.style.display = "block";
    resultBox.focus();
}

// Estimated reading time, based on an average silent-reading speed of
// roughly 200 words per minute. This word-count-based approach is a
// standard approximation used across languages and scripts, since exact
// words-per-minute norms aren't practical to hardcode per language.
function calculateReadingTime(wordCount) {
    if (wordCount === 0) return "—";
    const minutes = wordCount / 200;
    if (minutes < 1) return "Less than a minute";
    const rounded = Math.round(minutes);
    return `About ${rounded} minute${rounded === 1 ? '' : 's'}`;
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

// Flesch Reading Ease is calibrated specifically for English text — it
// counts Latin vowel groups as a stand-in for syllables, which has no
// meaning in scripts like Devanagari or Gurmukhi. Rather than silently
// showing a bogus score for non-English text, we check how much of the
// text is actually Latin-alphabet and label the score as unavailable
// when it wouldn't be meaningful.
function isMostlyLatinScript(wordsArray) {
    const sample = wordsArray.join('');
    if (!sample) return false;
    const latinLetters = (sample.match(/[a-z]/gi) || []).length;
    const totalLetters = (sample.match(/\p{L}/gu) || []).length;
    if (totalLetters === 0) return false;
    return (latinLetters / totalLetters) > 0.6;
}

// Flesch Reading Ease: 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
// Higher score = easier to read.
function calculateReadability(text, wordsArray) {
    if (!isMostlyLatinScript(wordsArray)) {
        return "Not available for this language";
    }

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
    textArea.focus();
}

function showError(msg) {
    errorMessage.innerText = msg;
    errorMessage.style.display = "block";
    resultBox.style.display = "none";
    errorMessage.focus();
}
