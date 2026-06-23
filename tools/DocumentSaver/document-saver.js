        const mimeTypes = {
            md: "text/markdown",
            html: "text/html",
            rtf: "application/rtf",
            txt: "text/plain",
            json: "application/json",
            xml: "application/xml",
            css: "text/css",
            js: "application/javascript",
            csv: "text/csv"
        };

        const forbiddenNames = ["CON", "PRN", "AUX", "NUL", "COM1", "LPT1"];

        function announce(msg, isError = false) {
            const statusDiv = document.getElementById('status');
            statusDiv.innerText = msg;
            statusDiv.style.color = isError ? "var(--error-red)" : "var(--success-green)";
        }

        function saveFile() {
            const name = document.getElementById('fileName').value.trim();
            const body = document.getElementById('fileBody').value.trim();
            const format = document.getElementById('fileFormat').value;

            // 1. Validations
            if (!name || !body) {
                announce("Please enter both file name and content.", true);
                return;
            }

            if (body.length > 500000) {
                announce("Content is very large and may freeze your browser.", true);
                return;
            }

            if (name.length > 100) {
                announce("File name is too long.", true);
                return;
            }

            if (forbiddenNames.includes(name.toUpperCase())) {
                announce("This filename is reserved by the system.", true);
                return;
            }

            // 2. Format Specific Checks
            if (format === "json") {
                try { JSON.parse(body); } 
                catch (e) { announce("Invalid JSON content.", true); return; }
            }

            if (format === "xml") {
                const parser = new DOMParser();
                const doc = parser.parseFromString(body, "application/xml");
                if (doc.getElementsByTagName("parsererror").length) {
                    announce("Invalid XML content.", true);
                    return;
                }
            }

            // 3. Sanitization & Naming
            const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
            const finalFileName = `${sanitizedName}.pixelpowerhub.in.${format}`;

            // 4. Content Processing
            let content = body;
            let blobType = mimeTypes[format] || "text/plain";

            if (format === "rtf") {
                const escaped = body
                    .replace(/\\/g, "\\\\")
                    .replace(/{/g, "\\{")
                    .replace(/}/g, "\\}")
                    .replace(/\n/g, "\\par ");
                content = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Courier New;}}\\f0\\fs22 ${escaped}}`;
            }

            // 5. Download Logic
            try {
                const blob = new Blob([content], { type: blobType });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = finalFileName;
                document.body.appendChild(a);
                a.click();

                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);

                announce(`Saved as ${finalFileName}`, false);
            } catch (err) {
                announce("Failed to save file. Check permissions.", true);
            }
        }
