/* ======================================================
   MATH-CATEGORIES.JS – THE 50-LEVEL BRAIN (v3)

   BUG FIX (v3): every category previously locked its number range
   for long stretches of levels (e.g. multiplication's second factor
   was IDENTICAL for levels 1-14; division's divisor was IDENTICAL
   for levels 1-19; fraction denominators never changed with level
   at all). That made "increase the difficulty" feel like it did
   nothing most of the time. Every category below now scales
   continuously with level, so level 12 is reliably harder than
   level 11, not just "harder than level 10 was 10 levels ago".

   Carried over from v2: exposed operands (n1/n2) for the tutor,
   full speech text, and floating-point-safe rounding so answers are
   always exact and checkable.
====================================================== */

// Round to a safe number of decimals and strip floating-point noise
// (e.g. 0.1 + 0.2 -> 0.30000000000000004 becomes 0.3)
function roundSafe(num, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * factor) / factor;
}

// Named difficulty bands, used for display and to gate question shape.
function getDifficultyBand(level) {
    if (level <= 10) return 'Beginner';
    if (level <= 20) return 'Easy';
    if (level <= 30) return 'Medium';
    if (level <= 40) return 'Hard';
    return 'Expert';
}

// Smooth exponential growth for "big number" categories (addition/
// subtraction): each level is distinguishably bigger than the last.
function bigRange(level) {
    const upper = Math.max(9, Math.round(9 * Math.pow(1.135, level)));
    const lowerLevel = Math.max(0, level - 3);
    const lower = Math.max(1, Math.round(9 * Math.pow(1.135, lowerLevel)));
    return { lower, upper };
}

function randBetween(lower, upper) {
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

function generateMathQuestion(category, level) {
    let qData = { display: '', answer: 0, speech: '', n1: null, n2: null, band: getDifficultyBand(level) };

    switch (category) {
        case 'addition': {
            const { lower, upper } = bigRange(level);
            let a1 = randBetween(lower, upper), a2 = randBetween(lower, upper);
            qData.answer = a1 + a2;
            qData.display = `${a1} + ${a2}`;
            qData.speech = `${a1} plus ${a2}`;
            qData.n1 = a1; qData.n2 = a2;
            break;
        }

        case 'subtraction': {
            const { lower, upper } = bigRange(level);
            let s1 = randBetween(lower, upper), s2 = randBetween(lower, upper);
            if (s1 < s2) [s1, s2] = [s2, s1];
            qData.answer = s1 - s2;
            qData.display = `${s1} - ${s2}`;
            qData.speech = `${s1} minus ${s2}`;
            qData.n1 = s1; qData.n2 = s2;
            break;
        }

        case 'multiplication': {
            const { lower, upper } = bigRange(level);
            let m1 = randBetween(lower, upper);
            // Second factor grows every 2 levels instead of jumping once
            // at a single fixed level.
            let m2 = randBetween(2, 4 + Math.floor(level / 2));
            qData.answer = m1 * m2;
            qData.display = `${m1} × ${m2}`;
            qData.speech = `${m1} times ${m2}`;
            qData.n1 = m1; qData.n2 = m2;
            break;
        }

        case 'division': {
            // Build from a whole-number answer so the division is always exact.
            const { lower: ansLower, upper: ansUpper } = bigRange(Math.max(1, level - 5));
            let divAns = randBetween(Math.max(2, ansLower), Math.max(3, Math.min(ansUpper, 9 + level)));
            let divisor = randBetween(2, 4 + Math.floor(level / 2));
            let dividend = divAns * divisor;
            qData.answer = divAns;
            qData.display = `${dividend} ÷ ${divisor}`;
            qData.speech = `${dividend} divided by ${divisor}`;
            qData.n1 = dividend; qData.n2 = divisor;
            break;
        }

        case 'bodmas':
            qData = { ...generateBODMAS(level), band: qData.band };
            break;

        case 'decimals':
            qData = { ...generateDecimals(level), band: qData.band };
            break;

        case 'fractions':
            qData = { ...generateFractions(level), band: qData.band };
            break;

        case 'squares': {
            let sq;
            if (level <= 25) {
                sq = level + 4; // 5..29, one new value per level
            } else {
                // Continue growing smoothly past level 25, capped so the
                // root stays a friendly 2-digit number (<=99).
                const span = Math.min(89, (level - 25) * 3 + 5);
                sq = randBetween(10, 10 + span);
            }
            qData.answer = sq * sq;
            qData.display = `${sq}²`;
            qData.speech = `${sq} squared, which means ${sq} times ${sq}`;
            qData.n1 = sq; qData.n2 = sq;
            break;
        }

        case 'percentages': {
            let base = randBetween(2, 5 + level) * 10;
            let pcts = [5, 10, 20, 25, 50, 75];
            // More levels unlock "odd" percentages (e.g. 37%) as level rises,
            // instead of a single hard switch at level 25.
            const oddChance = Math.min(0.9, level / 30);
            let p = (Math.random() < oddChance)
                ? randBetween(1, 5 + level)
                : pcts[Math.floor(Math.random() * pcts.length)];
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
// The *structure* (brackets, number of steps) is intentionally banded —
// that's the actual difficulty driver for order-of-operations — but the
// numbers feeding each structure now scale every level too.
function generateBODMAS(level) {
    let numItems = level < 15 ? 3 : (level < 35 ? 4 : 5);
    const upperPerNum = 2 + Math.floor(level / 2);
    let nums = [];
    for (let i = 0; i < numItems; i++) nums.push(randBetween(2, upperPerNum));

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
    // Decimal places step up as level rises (1 place -> 2 places -> 3 places)
    // instead of a single hard switch.
    const factor = level <= 15 ? 10 : (level <= 35 ? 100 : 1000);
    // The whole-number magnitude before the decimal point also grows with level.
    const numeratorMax = 20 + level * 8;
    let d1 = roundSafe(randBetween(1, numeratorMax) / factor, 3);
    let d2 = roundSafe(randBetween(1, numeratorMax) / factor, 3);
    const decimalsToShow = factor === 10 ? 1 : (factor === 100 ? 2 : 3);

    // Level 1-25: Addition, 26-50: Multiplication
    if (level <= 25) {
        return {
            display: `${d1} + ${d2}`,
            answer: roundSafe(d1 + d2, decimalsToShow),
            speech: `${d1} plus ${d2}. Round your answer to ${decimalsToShow} decimal place${decimalsToShow === 1 ? '' : 's'}.`,
            n1: d1, n2: d2
        };
    } else {
        return {
            display: `${d1} × ${d2}`,
            answer: roundSafe(d1 * d2, decimalsToShow),
            speech: `${d1} times ${d2}. Round your answer to ${decimalsToShow} decimal place${decimalsToShow === 1 ? '' : 's'}.`,
            n1: d1, n2: d2
        };
    }
}

// --- Specialized Fractions Generator ---
// All fraction answers are rounded to 2 decimal places so they always have
// an exact, checkable value (e.g. 1/3 + 1/3 -> 0.67, not an unanswerable
// repeating decimal). Denominators now grow with level instead of being
// stuck at 2-9 for every single level.
function generateFractions(level) {
    const denMax = Math.min(20, 4 + Math.floor(level / 3));
    let den = randBetween(2, denMax);
    let n1 = randBetween(1, den);
    let n2 = randBetween(1, den);

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
        // Different denominators, also growing with level
        let den2 = randBetween(2, Math.max(3, denMax - 2));
        const rawAnswer = (n1 / den) + (n2 / den2);
        return {
            display: `${n1}/${den} + ${n2}/${den2}`,
            answer: roundSafe(rawAnswer, 2),
            speech: `${n1} over ${den}, plus ${n2} over ${den2}. Give your answer as a decimal, rounded to two decimal places.`,
            n1, n2: den
        };
    }
}
