        const birthInput = document.getElementById('birthdate');
        const resultBox = document.getElementById('resultBox');
        const errorBox = document.getElementById('errorMessage');

        function calculateAge() {
            const birthdate = birthInput.value;
            
            // Validation
            if (!birthdate) {
                showError("Please select your birth date.");
                return;
            }

            const birth = new Date(birthdate + "T12:00:00");
            const now = new Date();
            now.setHours(12, 0, 0, 0);

            if (isNaN(birth.getTime())) {
                showError("Please enter a valid date.");
                return;
            }

            if (birth > now) {
                showError("Birth date cannot be in the future.");
                return;
            }

            // Calculations
            let years = now.getFullYear() - birth.getFullYear();
            let months = now.getMonth() - birth.getMonth();
            let days = now.getDate() - birth.getDate();

            if (days < 0) {
                months--;
                const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
                days += prevMonthDays;
            }

            if (months < 0) {
                years--;
                months += 12;
            }

            // Next Birthday Calculation. We build this at the same time-of-day
            // (12:00) as `now` so that a birthday falling on today's date
            // compares as "today" (0 days away) instead of being pushed a
            // full year ahead by a midnight-vs-noon mismatch.
            let nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate(), 12, 0, 0, 0);

            // Leap year handling (Feb 29)
            if (birth.getMonth() === 1 && birth.getDate() === 29 && nextBirthday.getMonth() !== 1) {
                nextBirthday = new Date(now.getFullYear(), 2, 1, 12, 0, 0, 0);
            }

            if (nextBirthday < now) {
                nextBirthday.setFullYear(now.getFullYear() + 1);
            }

            const diffTime = nextBirthday - now;
            const daysToBirthday = Math.round(diffTime / (1000 * 60 * 60 * 24));

            // UI Update
            errorBox.style.display = "none";
            const birthdayLine = daysToBirthday === 0
                ? "🎉 Today is your birthday!"
                : `Your next birthday is in ${daysToBirthday} day${daysToBirthday === 1 ? '' : 's'}.`;
            resultBox.innerText = `You are ${years} years, ${months} months, and ${days} days old. ${birthdayLine}`;
            resultBox.style.display = "block";
            resultBox.focus();
        }

        function resetForm() {
            birthInput.value = "";
            resultBox.style.display = "none";
            errorBox.style.display = "none";
            birthInput.focus();
        }

        function showError(msg) {
            resultBox.style.display = "none";
            errorBox.innerText = msg;
            errorBox.style.display = "block";
        }
