    let audioBuffer = null;
    let trimmedBlob = null;
    let start = 0;
    let end = 0;

    const mainAudio = document.getElementById('mainAudio');
    const previewAudio = document.getElementById('previewAudio');
    const status = document.getElementById('status');

    // File Import
    document.getElementById('audioFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        mainAudio.src = url;
        
        status.innerText = "Loading audio data...";
        
        const arrayBuffer = await file.arrayBuffer();
        const ctx = new AudioContext();
        audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        ctx.close();

        document.getElementById('editor').style.display = 'block';
        status.innerText = "Audio loaded. Use buttons to set trim points.";
    });

    mainAudio.onloadedmetadata = () => {
        end = mainAudio.duration;
        document.getElementById('endTime').innerText = end.toFixed(2);
        updateTimeDisplay();
    };

    mainAudio.ontimeupdate = updateTimeDisplay;

    function updateTimeDisplay() {
        document.getElementById('timeInfo').innerText = 
            `Time: ${mainAudio.currentTime.toFixed(2)} / ${mainAudio.duration.toFixed(2)} seconds`;
    }

    function setPoint(type) {
        if (type === 'start') {
            start = mainAudio.currentTime;
            document.getElementById('startTime').innerText = start.toFixed(2);
        } else {
            end = mainAudio.currentTime;
            document.getElementById('endTime').innerText = end.toFixed(2);
        }
        document.getElementById('trimBtn').disabled = (start >= end);
    }

    // Trimming Logic
    async function handleTrim() {
        if (start >= end) return;
        status.innerText = "Trimming... please wait.";

        const sr = audioBuffer.sampleRate;
        const frameCount = Math.floor((end - start) * sr);
        const ctx = new AudioContext();
        const outBuffer = ctx.createBuffer(audioBuffer.numberOfChannels, frameCount, sr);

        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
            const data = audioBuffer.getChannelData(ch);
            outBuffer.copyToChannel(data.subarray(Math.floor(start * sr), Math.floor(end * sr)), ch);
        }

        trimmedBlob = bufferToWav(outBuffer);
        previewAudio.src = URL.createObjectURL(trimmedBlob);
        document.getElementById('previewSection').style.display = 'block';
        status.innerText = "Trimmed! Preview and save below.";
        ctx.close();
    }

    async function handleSave() {
        const format = document.getElementById('exportFormat').value;
        let finalBlob = trimmedBlob;

        if (format === 'mp3') {
            status.innerText = "Converting to MP3... this may take a moment.";
            const ctx = new AudioContext();
            const arrayBuffer = await trimmedBlob.arrayBuffer();
            const decoded = await ctx.decodeAudioData(arrayBuffer);
            finalBlob = await bufferToMp3(decoded);
            ctx.close();
        }

        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trimmed_pixelpower.${format}`;
        a.click();
        status.innerText = "File saved successfully!";
    }

    // Helpers (WAV & MP3 Converters)
    function bufferToWav(buffer) {
        const num = buffer.numberOfChannels;
        const len = buffer.length * num * 2 + 44;
        const view = new DataView(new ArrayBuffer(len));
        let pos = 0;
        const write = s => { for (let i = 0; i < s.length; i++) view.setUint8(pos++, s.charCodeAt(i)); };
        write("RIFF"); view.setUint32(pos, len - 8, true); pos += 4;
        write("WAVEfmt "); view.setUint32(pos, 16, true); pos += 4;
        view.setUint16(pos, 1, true); pos += 2;
        view.setUint16(pos, num, true); pos += 2;
        view.setUint32(pos, buffer.sampleRate, true); pos += 4;
        view.setUint32(pos, buffer.sampleRate * num * 2, true); pos += 4;
        view.setUint16(pos, num * 2, true); pos += 2;
        view.setUint16(pos, 16, true); pos += 2;
        write("data"); view.setUint32(pos, len - pos - 4, true); pos += 4;
        for (let i = 0; i < buffer.length; i++) {
            for (let c = 0; c < num; c++) {
                const s = Math.max(-1, Math.min(1, buffer.getChannelData(c)[i]));
                view.setInt16(pos, s * 32767, true); pos += 2;
            }
        }
        return new Blob([view], { type: "audio/wav" });
    }

    async function bufferToMp3(audioBuffer) {
        const encoder = new lamejs.Mp3Encoder(audioBuffer.numberOfChannels, audioBuffer.sampleRate, 128);
        const samples = audioBuffer.getChannelData(0);
        const mp3 = [];
        for (let i = 0; i < samples.length; i += 1152) {
            const chunk = samples.subarray(i, i + 1152);
            const pcm = new Int16Array(chunk.length);
            for (let j = 0; j < chunk.length; j++) pcm[j] = Math.max(-1, Math.min(1, chunk[j])) * 32767;
            const buf = encoder.encodeBuffer(pcm);
            if (buf.length) mp3.push(buf);
        }
        const endBuf = encoder.flush();
        if (endBuf.length) mp3.push(endBuf);
        return new Blob(mp3, { type: "audio/mp3" });
    }
