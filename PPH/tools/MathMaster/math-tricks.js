/* ======================================================
   MATH-TRICKS.JS – DYNAMIC TEACHER ENGINE (v2)
   Fixed: now reads the real operands stored on sessionData
   (n1/n2) instead of undefined fields, so hints/explanations
   always describe the actual numbers on screen.
====================================================== */

/**
 * Generates a step-by-step explanation based on the specific numbers
 * for the question currently on screen.
 */
function getExplanation(category, n1, n2, display, answer) {
    switch (category) {
        case 'addition':
            return `Step 1: Add the ones place of ${n1} and ${n2}. Step 2: Add the remaining place values, carrying over where needed. The total sum is ${answer}.`;

        case 'subtraction':
            return `To solve ${n1} minus ${n2}, line up the digits, start from the right, and borrow from the next column if the top digit is smaller. The difference is ${answer}.`;

        case 'multiplication':
            if (n2 === 11) {
                return `Trick for 11: Take ${n1}, add its digits together, and place that sum in the middle of the original digits. Result: ${answer}.`;
            }
            return `Think of ${n1} × ${n2} as adding ${n1} to itself ${n2} times, or break ${n1} into round parts (tens and units) and multiply each part by ${n2}, then add the results. Answer: ${answer}.`;

        case 'division':
            return `Ask yourself: how many times does ${n2} fit into ${n1}? Since ${n2} × ${answer} = ${n1}, the answer is ${answer}.`;

        case 'decimals':
            return `Crucial step: line up the decimal points first, work with the numbers as if they were whole numbers, then place the decimal point back in the same position. Result: ${answer}.`;

        case 'fractions':
            if (display.includes('+')) {
                return `To add ${display}: 1. Find a common denominator. 2. Convert each fraction to that denominator. 3. Add the numerators and divide by the common denominator. As a decimal, that's ${answer}.`;
            }
            return `Follow the numerator and denominator rules, then convert the result to a decimal. Answer: ${answer}.`;

        case 'bodmas':
            return `Follow the Order of Operations (BODMAS): Brackets first, then Orders (powers/roots), then Division and Multiplication left to right, and finally Addition and Subtraction left to right. Working through ${display} this way gives ${answer}.`;

        case 'squares':
            if (n1 % 10 === 5) {
                let first = Math.floor(n1 / 10);
                return `Ending in 5 trick: multiply ${first} by ${first + 1} (giving ${first * (first + 1)}), then attach "25" to the end. Result: ${answer}.`;
            }
            return `Squaring means multiplying a number by itself: ${n1} × ${n1} = ${answer}.`;

        case 'percentages':
            return `Tip: to find ${n1}% of ${n2}, multiply ${n2} by ${n1} and divide by 100. For round percentages like 10%, just move the decimal point one place left. Answer: ${answer}.`;

        default:
            return `Break the numbers into smaller, friendlier chunks and work through them one step at a time. The answer is ${answer}.`;
    }
}

/**
 * Triggered by the "Hint" button — a short, general mental shortcut that
 * doesn't give away the answer.
 */
function showTrick() {
    const hints = {
        addition: 'Mental shortcut: add the tens and units separately, then combine them.',
        subtraction: 'Mental shortcut: round the number you are subtracting, subtract, then adjust your answer back.',
        multiplication: 'Mental shortcut: break one number into tens and units, multiply each part, then add the results.',
        division: 'Mental shortcut: think in multiplication — what do you multiply the divisor by to reach the first number?',
        decimals: 'Mental shortcut: line up the decimal points before you add, subtract, or multiply.',
        fractions: 'Mental shortcut: find a common denominator before adding or subtracting fractions.',
        squares: 'Mental shortcut: numbers ending in 5 have an easy squaring trick — ask for the full explanation to see it.',
        percentages: 'Mental shortcut: 10% is just moving the decimal point one place left; build other percentages from that.',
        bodmas: 'Mental shortcut: solve brackets first, then powers, then × and ÷, then + and − — always left to right.'
    };
    const trick = hints[sessionData.category] || 'Try breaking the numbers into tens and units to solve faster in your head!';

    const feedback = document.getElementById('feedback-message');
    feedback.innerText = trick;
    feedback.style.color = 'var(--primary)';
    speak(trick);
}

/**
 * Triggered by the "Explain" button — detailed, per-question walkthrough
 * using the actual numbers from the current question.
 */
function showExplanation() {
    const expl = getExplanation(
        sessionData.category,
        sessionData.n1,
        sessionData.n2,
        sessionData.display,
        sessionData.currentAnswer
    );

    const feedback = document.getElementById('feedback-message');
    feedback.innerText = expl;
    feedback.style.color = 'var(--text-main)';

    // The Talking Tutor reads the explanation aloud
    speak(expl);
}
