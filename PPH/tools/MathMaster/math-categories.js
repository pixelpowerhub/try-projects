/* ======================================================
   MATH-CATEGORIES.JS – THE 50-LEVEL BRAIN
   v2: accuracy fixes, exposed operands (n1/n2) for the
   tutor/explanation engine, and full speech text for
   screen-reader / talking-tutor accessibility.
====================================================== */

// Round to a safe number of decimals and strip floating-point noise
// (e.g. 0.1 + 0.2 -> 0.30000000000000004 becomes 0.3)
function roundSafe(num, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

function generateMathQuestion(category, level) {
    let qData = { display: '', answer: 0, speech: '', n1: null, n2: null };

    // Common random number generator based on difficulty
    const getNum = (lvl) => {
        const min = lvl === 1 ? 1 : Math.pow(10, Math.floor((lvl - 1) / 10));
        const max = Math.pow(10, Math.floor(lvl / 10) + 1) - 1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    switch (category) {
        case 'addition': {
            let a1 = getNum(level), a2 = getNum(level);
            qData.answer = a1 + a2;
            qData.display = `${a1} + ${a2}`;
            qData.speech = `${a1} plus ${a2}`;
            qData.n1 = a1; qData.n2 = a2;
            break;
        }

        case 'subtraction': {
            let s1 = getNum(level), s2 = getNum(level);
            if (s1 < s2) [s1, s2] = [s2, s1];
            qData.answer = s1 - s2;
            qData.display = `${s1} - ${s2}`;
            qData.speech = `${s1} minus ${s2}`;
            qData.n1 = s1; qData.n2 = s2;
            break;
        }

        case 'multiplication': {
            let m1 = getNum(level);
            let m2 = (level < 15) ? Math.floor(Math.random() * 10) + 2 : Math.floor(Math.random() * level) + 2;
            qData.answer = m1 * m2;
            qData.display = `${m1} × ${m2}`;
            qData.speech = `${m1} times ${m2}`;
            qData.n1 = m1; qData.n2 = m2;
            break;
        }

        case 'division': {
            // Build from a whole-number answer so the division is always exact.
            let divAns = Math.floor(Math.random() * 10) + 2;
            let divisor = (level < 20) ? Math.floor(Math.random() * 9) + 2 : Math.floor(Math.random() * level) + 2;
            let dividend = divAns * divisor;
            qData.answer = divAns;
            qData.display = `${dividend} ÷ ${divisor}`;
            qData.speech = `${dividend} divided by ${divisor}`;
            qData.n1 = dividend; qData.n2 = divisor;
            break;
        }

        case 'bodmas':
            qData = generateBODMAS(level);
            break;

        case 'decimals':
            qData = generateDecimals(level);
            break;

        case 'fractions':
            qData = generateFractions(level);
            break;

        case 'squares': {
            let sq = level + 5;
            if (level > 25) sq = Math.min(getNum(level - 20) % 90 + 9, 99); // keep roots friendly (<=99)
            qData.answer = sq * sq;
            qData.display = `${sq}²`;
            qData.speech = `${sq} squared, which means ${sq} times ${sq}`;
            qData.n1 = sq; qData.n2 = sq;
            break;
        }

        case 'percentages': {
            let base = (Math.floor(Math.random() * 50) + 1) * 10;
            let pcts = [5, 10, 20, 25, 50, 75];
            let p = pcts[Math.floor(Math.random() * pcts.length)];
            if (level > 25) p = Math.floor(Math.random() * 95) + 1;
            // Round to remove floating-point artefacts (e.g. 10% of 30 must
            // equal exactly 3, not 2.9999999999999996).
            qData.answer = roundSafe((p / 100) * base, 2);
            qData.display = `${p}% of ${base}`;
            qData.speech = `${p} percent of ${base}`;
            qData.n1 = p; qData.n2 = base;
            break;
        }
    }
    return qData;
}

// --- Specialized BODMAS Generator ---
function generateBODMAS(level) {
    let numItems = level < 15 ? 3 : (level < 35 ? 4 : 5);
    let nums = [];
    for (let i = 0; i < numItems; i++) nums.push(Math.floor(Math.random() * (level + 5)) + 2);

    if (level <= 10) {
        // a + b × c  (tests operator precedence, no brackets)
        const display = `${nums[0]} + ${nums[1]} × ${nums[2]}`;
        const answer = nums[0] + (nums[1] * nums[2]);
        const speech = `${nums[0]} plus ${nums[1]} times ${nums[2]}. Remember: multiplication before addition.`;
        return { display, answer, speech, n1: nums[0], n2: nums[1] };
    }

    if (level <= 25) {
        // (a + b) × c
        const display = `(${nums[0]} + ${nums[1]}) × ${nums[2]}`;
        const answer = (nums[0] + nums[1]) * nums[2];
        const speech = `Open bracket, ${nums[0]} plus ${nums[1]}, close bracket, times ${nums[2]}.`;
        return { display, answer, speech, n1: nums[0], n2: nums[1] };
    }

    if (level <= 40) {
        // (a + b) × c - d
        const display = `(${nums[0]} + ${nums[1]}) × ${nums[2]} - ${nums[3]}`;
        const answer = (nums[0] + nums[1]) * nums[2] - nums[3];
        const speech = `Open bracket, ${nums[0]} plus ${nums[1]}, close bracket, times ${nums[2]}, minus ${nums[3]}.`;
        return { display, answer, speech, n1: nums[0], n2: nums[1] };
    }

    // ((a + b) × c - d) ÷ e — engineered so the division is always exact.
    let e = nums[4] || 2;
    if (e === 0) e = 2;
    let innerBeforeDivide = (nums[0] + nums[1]) * nums[2] - nums[3];
    let answer = Math.trunc(innerBeforeDivide / e);
    if (answer === 0) answer = 1;
    let exactInner = answer * e; // adjust "d" implicitly so the maths stays exact
    let dAdjusted = (nums[0] + nums[1]) * nums[2] - exactInner;
    const display = `((${nums[0]} + ${nums[1]}) × ${nums[2]} - ${dAdjusted}) ÷ ${e}`;
    const speech = `Open bracket, open bracket, ${nums[0]} plus ${nums[1]}, close bracket, times ${nums[2]}, minus ${dAdjusted}, close bracket, divided by ${e}.`;
    return { display, answer, speech, n1: nums[0], n2: nums[1] };
}

// --- Specialized Decimals Generator ---
function generateDecimals(level) {
    let factor = level < 25 ? 10 : 100;
    let d1 = roundSafe((Math.floor(Math.random() * 100) + 1) / factor, 2);
    let d2 = roundSafe((Math.floor(Math.random() * 100) + 1) / factor, 2);

    // Level 1-25: Addition, 26-50: Multiplication
    if (level <= 25) {
        return {
            display: `${d1} + ${d2}`,
            answer: roundSafe(d1 + d2, 2),
            speech: `${d1} plus ${d2}. Round your answer to two decimal places.`,
            n1: d1, n2: d2
        };
    } else {
        return {
            display: `${d1} × ${d2}`,
            answer: roundSafe(d1 * d2, 2),
            speech: `${d1} times ${d2}. Round your answer to two decimal places.`,
            n1: d1, n2: d2
        };
    }
}

// --- Specialized Fractions Generator ---
// All fraction answers are rounded to 2 decimal places so they always have
// an exact, checkable value (e.g. 1/3 + 1/3 -> 0.67, not an unanswerable
// repeating decimal).
function generateFractions(level) {
    let den = Math.floor(Math.random() * 8) + 2;
    let n1 = Math.floor(Math.random() * den) + 1;
    let n2 = Math.floor(Math.random() * den) + 1;

    if (level <= 25) {
        // Same denominator
        const rawAnswer = (n1 + n2) / den;
        return {
            display: `${n1}/${den} + ${n2}/${den}`,
            answer: roundSafe(rawAnswer, 2),
            speech: `${n1} over ${den}, plus ${n2} over ${den}. Give your answer as a decimal, rounded to two decimal places.`,
            n1, n2: den
        };
    } else {
        // Different denominators
        let den2 = Math.floor(Math.random() * 5) + 2;
        const rawAnswer = (n1 / den) + (n2 / den2);
        return {
            display: `${n1}/${den} + ${n2}/${den2}`,
            answer: roundSafe(rawAnswer, 2),
            speech: `${n1} over ${den}, plus ${n2} over ${den2}. Give your answer as a decimal, rounded to two decimal places.`,
            n1, n2: den
        };
    }
}
