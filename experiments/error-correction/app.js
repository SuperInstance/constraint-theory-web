// Error-Correcting Codes Simulator
// Constraint Theory Research Project

class ErrorCorrectionSimulator {
    constructor() {
        this.currentCode = 'hamming74';
        this.message = '';
        this.codeWord = '';
        this.receivedWord = '';
        this.correctedWord = '';
        this.decodedMessage = '';
        this.syndrome = '';
        this.errorPosition = -1;
        this.errorsDetected = 0;
        this.errorsCorrected = 0;
        this.totalBits = 0;
        this.errorBits = 0;
        this.animationSpeed = 1000;
        this.stepIndex = 0;

        this.initializeElements();
        this.initializeEventListeners();
        this.updateCodeInfo();
        this.initializeVisualizations();
    }

    initializeElements() {
        this.elements = {
            codeType: document.getElementById('codeType'),
            messageInput: document.getElementById('messageInput'),
            noiseSlider: document.getElementById('noiseSlider'),
            noiseValue: document.getElementById('noiseValue'),
            encodeBtn: document.getElementById('encodeBtn'),
            transmitBtn: document.getElementById('transmitBtn'),
            decodeBtn: document.getElementById('decodeBtn'),
            resetBtn: document.getElementById('resetBtn'),
            stepEncodeBtn: document.getElementById('stepEncodeBtn'),
            stepDecodeBtn: document.getElementById('stepDecodeBtn'),
            animateBtn: document.getElementById('animateBtn'),
            messageLength: document.getElementById('messageLength'),
            codeWordLength: document.getElementById('codeWordLength'),
            overhead: document.getElementById('overhead'),
            errorsDetected: document.getElementById('errorsDetected'),
            errorsCorrected: document.getElementById('errorsCorrected'),
            ber: document.getElementById('ber'),
            messageBits: document.getElementById('messageBits'),
            parityBits: document.getElementById('parityBits'),
            codeWord: document.getElementById('codeWord'),
            encodingExplanation: document.getElementById('encodingExplanation'),
            sentBits: document.getElementById('sentBits'),
            receivedBits: document.getElementById('receivedBits'),
            errorBits: document.getElementById('errorBits'),
            channelExplanation: document.getElementById('channelExplanation'),
            syndromeBits: document.getElementById('syndromeBits'),
            errorPosition: document.getElementById('errorPosition'),
            correctedBits: document.getElementById('correctedBits'),
            decodedMessage: document.getElementById('decodedMessage'),
            decodingExplanation: document.getElementById('decodingExplanation')
        };
    }

    initializeEventListeners() {
        this.elements.codeType.addEventListener('change', () => {
            this.currentCode = this.elements.codeType.value;
            this.updateCodeInfo();
            this.reset();
        });

        this.elements.noiseSlider.addEventListener('input', (e) => {
            this.elements.noiseValue.textContent = e.target.value;
        });

        this.elements.encodeBtn.addEventListener('click', () => this.encode());
        this.elements.transmitBtn.addEventListener('click', () => this.transmit());
        this.elements.decodeBtn.addEventListener('click', () => this.decode());
        this.elements.resetBtn.addEventListener('click', () => this.reset());

        this.elements.stepEncodeBtn.addEventListener('click', () => this.stepEncode());
        this.elements.stepDecodeBtn.addEventListener('click', () => this.stepDecode());
        this.elements.animateBtn.addEventListener('click', () => this.animateAll());

        this.elements.messageInput.addEventListener('input', () => this.validateMessage());
    }

    initializeVisualizations() {
        this.encodingCanvas = document.getElementById('encodingCanvas');
        this.encodingCtx = this.encodingCanvas.getContext('2d');
        this.codeSpaceCanvas = document.getElementById('codeSpaceCanvas');
        this.codeSpaceCtx = this.codeSpaceCanvas.getContext('2d');
        this.channelCanvas = document.getElementById('channelCanvas');
        this.channelCtx = this.channelCanvas.getContext('2d');
        this.decodingCanvas = document.getElementById('decodingCanvas');
        this.decodingCtx = this.decodingCanvas.getContext('2d');

        this.drawInitialStates();
    }

    drawInitialStates() {
        this.drawEncodingVisualization();
        this.drawCodeSpace();
        this.drawChannelVisualization();
        this.drawDecodingVisualization();
    }

    updateCodeInfo() {
        const codeInfo = this.getCodeInfo();
        this.elements.messageLength.textContent = codeInfo.messageLength;
        this.elements.codeWordLength.textContent = codeInfo.codeWordLength;
        this.elements.overhead.textContent = codeInfo.overhead + '%';

        // Update message input max length
        this.elements.messageInput.maxLength = codeInfo.messageLength;
        this.elements.messageInput.value = this.elements.messageInput.value.padEnd(codeInfo.messageLength, '0').substring(0, codeInfo.messageLength);
    }

    getCodeInfo() {
        switch (this.currentCode) {
            case 'hamming74':
                return { messageLength: 4, codeWordLength: 7, overhead: 75 };
            case 'hamming1511':
                return { messageLength: 11, codeWordLength: 15, overhead: 36 };
            case 'repetition31':
                return { messageLength: 1, codeWordLength: 3, overhead: 200 };
            case 'parity':
                return { messageLength: 4, codeWordLength: 5, overhead: 25 };
            default:
                return { messageLength: 4, codeWordLength: 7, overhead: 75 };
        }
    }

    validateMessage() {
        const input = this.elements.messageInput.value;
        const codeInfo = this.getCodeInfo();

        // Only allow 0s and 1s
        const validated = input.replace(/[^01]/g, '').substring(0, codeInfo.messageLength);
        this.elements.messageInput.value = validated;
    }

    encode() {
        this.message = this.elements.messageInput.value;

        if (this.message.length === 0) {
            this.elements.encodingExplanation.textContent = 'Please enter a message first.';
            return;
        }

        switch (this.currentCode) {
            case 'hamming74':
                this.codeWord = this.hamming74Encode(this.message);
                break;
            case 'hamming1511':
                this.codeWord = this.hamming1511Encode(this.message);
                break;
            case 'repetition31':
                this.codeWord = this.repetition31Encode(this.message);
                break;
            case 'parity':
                this.codeWord = this.parityEncode(this.message);
                break;
        }

        this.updateEncodingDisplay();
        this.drawEncodingVisualization();
        this.drawCodeSpace();
    }

    hamming74Encode(message) {
        // Hamming(7,4) encoding
        // Positions: 1 2 3 4 5 6 7
        // Parity:     p p d p d d d
        //             1 2   4

        const d = message.padEnd(4, '0').split('').map(b => parseInt(b));
        const encoded = new Array(7).fill(0);

        // Data bits at positions 3, 5, 6, 7 (1-indexed)
        encoded[2] = d[0]; // position 3
        encoded[4] = d[1]; // position 5
        encoded[5] = d[2]; // position 6
        encoded[6] = d[3]; // position 7

        // Parity bit 1 (positions 1, 3, 5, 7)
        encoded[0] = (encoded[2] + encoded[4] + encoded[6]) % 2;

        // Parity bit 2 (positions 2, 3, 6, 7)
        encoded[1] = (encoded[2] + encoded[5] + encoded[6]) % 2;

        // Parity bit 4 (positions 4, 5, 6, 7)
        encoded[3] = (encoded[4] + encoded[5] + encoded[6]) % 2;

        return encoded.join('');
    }

    hamming1511Encode(message) {
        // Hamming(15,11) encoding
        const d = message.padEnd(11, '0').split('').map(b => parseInt(b));
        const encoded = new Array(15).fill(0);

        // Data bits at non-power-of-2 positions
        let dataIndex = 0;
        for (let i = 1; i <= 15; i++) {
            if (!this.isPowerOfTwo(i)) {
                encoded[i - 1] = d[dataIndex++];
            }
        }

        // Parity bits at power-of-2 positions
        for (let p = 1; p <= 8; p *= 2) {
            let parity = 0;
            for (let i = 1; i <= 15; i++) {
                if (i & p) {
                    parity ^= encoded[i - 1];
                }
            }
            encoded[p - 1] = parity;
        }

        return encoded.join('');
    }

    repetition31Encode(message) {
        // Repetition(3,1) encoding - repeat bit 3 times
        const bit = message.padEnd(1, '0')[0];
        return bit + bit + bit;
    }

    parityEncode(message) {
        // Simple parity encoding
        const bits = message.padEnd(4, '0').split('');
        const parity = bits.reduce((sum, bit) => sum + parseInt(bit), 0) % 2;
        return message + parity;
    }

    isPowerOfTwo(n) {
        return n > 0 && (n & (n - 1)) === 0;
    }

    updateEncodingDisplay() {
        const codeInfo = this.getCodeInfo();

        if (this.currentCode === 'hamming74') {
            // Extract parity bits
            const parityBits = [
                this.codeWord[0],
                this.codeWord[1],
                this.codeWord[3]
            ].join(' ');

            this.elements.messageBits.innerHTML = this.message.split('').join(' ');
            this.elements.parityBits.innerHTML = parityBits;
            this.elements.codeWord.innerHTML = this.codeWord.split('').join(' ');

            this.elements.encodingExplanation.innerHTML = `
                <strong>Hamming(7,4) Encoding:</strong><br>
                Message bits placed at positions 3,5,6,7<br>
                Parity bit 1 (pos 1): covers bits 1,3,5,7 = ${this.codeWord[0]}<br>
                Parity bit 2 (pos 2): covers bits 2,3,6,7 = ${this.codeWord[1]}<br>
                Parity bit 4 (pos 4): covers bits 4,5,6,7 = ${this.codeWord[3]}<br>
                Each parity bit ensures even parity for its coverage group.
            `;
        } else if (this.currentCode === 'hamming1511') {
            this.elements.messageBits.innerHTML = this.message.split('').join(' ');
            this.elements.parityBits.innerHTML = this.codeWord.split('').filter((_, i) => this.isPowerOfTwo(i + 1)).join(' ');
            this.elements.codeWord.innerHTML = this.codeWord.split('').join(' ');

            this.elements.encodingExplanation.innerHTML = `
                <strong>Hamming(15,11) Encoding:</strong><br>
                11 message bits + 4 parity bits<br>
                Parity bits at positions 1,2,4,8<br>
                Each parity bit covers positions where its index has that bit set.
            `;
        } else if (this.currentCode === 'repetition31') {
            this.elements.messageBits.innerHTML = this.message;
            this.elements.parityBits.innerHTML = 'N/A (repetition)';
            this.elements.codeWord.innerHTML = this.codeWord.split('').join(' ');

            this.elements.encodingExplanation.innerHTML = `
                <strong>Repetition(3,1) Encoding:</strong><br>
                Message bit "${this.message}" repeated 3 times<br>
                Decoding uses majority vote.
            `;
        } else if (this.currentCode === 'parity') {
            this.elements.messageBits.innerHTML = this.message.split('').join(' ');
            this.elements.parityBits.innerHTML = this.codeWord[4];
            this.elements.codeWord.innerHTML = this.codeWord.split('').join(' ');

            this.elements.encodingExplanation.innerHTML = `
                <strong>Simple Parity Encoding:</strong><br>
                Parity bit = ${this.codeWord[4]} (sum of message bits mod 2)<br>
                Can detect single-bit errors, but cannot correct.
            `;
        }
    }

    drawEncodingVisualization() {
        const ctx = this.encodingCtx;
        const width = this.encodingCanvas.width;
        const height = this.encodingCanvas.height;

        ctx.clearRect(0, 0, width, height);

        if (this.codeWord) {
            // Draw parity constraint circles
            if (this.currentCode === 'hamming74') {
                this.drawParityConstraints(ctx, width, height);
            } else if (this.currentCode === 'hamming1511') {
                this.drawHamming15Constraints(ctx, width, height);
            } else if (this.currentCode === 'repetition31') {
                this.drawRepetitionVisualization(ctx, width, height);
            } else if (this.currentCode === 'parity') {
                this.drawParityVisualization(ctx, width, height);
            }
        } else {
            // Draw placeholder
            ctx.fillStyle = '#666';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Encode a message to see visualization', width / 2, height / 2);
        }
    }

    drawParityConstraints(ctx, width, height) {
        const bitPositions = [
            { x: 80, y: 80, label: 'p1', bit: this.codeWord[0] },
            { x: 200, y: 80, label: 'p2', bit: this.codeWord[1] },
            { x: 320, y: 80, label: 'd1', bit: this.codeWord[2] },
            { x: 80, y: 180, label: 'p4', bit: this.codeWord[3] },
            { x: 200, y: 180, label: 'd2', bit: this.codeWord[4] },
            { x: 320, y: 180, label: 'd3', bit: this.codeWord[5] },
            { x: 200, y: 260, label: 'd4', bit: this.codeWord[6] }
        ];

        // Draw parity constraint circles
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;

        // p1 constraint circle (positions 1,3,5,7)
        ctx.beginPath();
        ctx.ellipse(200, 150, 150, 100, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#4a9eff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('p1 constraint', 200, 50);

        // p2 constraint circle (positions 2,3,6,7)
        ctx.strokeStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.ellipse(250, 180, 100, 130, 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('p2 constraint', 340, 120);

        // p4 constraint circle (positions 4,5,6,7)
        ctx.strokeStyle = '#51cf66';
        ctx.beginPath();
        ctx.ellipse(200, 220, 150, 60, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#51cf66';
        ctx.fillText('p4 constraint', 200, 295);

        // Draw bit circles
        bitPositions.forEach((pos, i) => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
            ctx.fillStyle = pos.bit === '1' ? '#ffd43b' : '#495057';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pos.bit, pos.x, pos.y);

            ctx.fillStyle = '#adb5bd';
            ctx.font = '10px sans-serif';
            ctx.fillText(pos.label, pos.x, pos.y + 30);
        });
    }

    drawHamming15Constraints(ctx, width, height) {
        const positions = [];
        const radius = 100;
        const centerX = width / 2;
        const centerY = height / 2;

        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2 - Math.PI / 2;
            positions.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
                label: this.isPowerOfTwo(i + 1) ? `p${i + 1}` : `d${i + 1}`,
                bit: this.codeWord[i],
                isParity: this.isPowerOfTwo(i + 1)
            });
        }

        // Draw connections for p1 (odd positions)
        ctx.strokeStyle = 'rgba(74, 158, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        positions.filter((_, i) => (i + 1) & 1).forEach((pos, i, arr) => {
            if (i === 0) ctx.moveTo(pos.x, pos.y);
            else ctx.lineTo(pos.x, pos.y);
        });
        ctx.stroke();

        // Draw bit circles
        positions.forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = pos.bit === '1' ? '#ffd43b' : '#495057';
            ctx.fill();
            ctx.strokeStyle = pos.isParity ? '#4a9eff' : '#adb5bd';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pos.bit, pos.x, pos.y);
        });
    }

    drawRepetitionVisualization(ctx, width, height) {
        const positions = [
            { x: 100, y: height / 2, label: 'Copy 1' },
            { x: 200, y: height / 2, label: 'Copy 2' },
            { x: 300, y: height / 2, label: 'Copy 3' }
        ];

        positions.forEach((pos, i) => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
            ctx.fillStyle = this.codeWord[i] === '1' ? '#ffd43b' : '#495057';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.codeWord[i], pos.x, pos.y);

            ctx.fillStyle = '#adb5bd';
            ctx.font = '12px sans-serif';
            ctx.fillText(pos.label, pos.x, pos.y + 45);
        });

        // Draw majority vote indicator
        ctx.fillStyle = '#51cf66';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Majority Vote', width / 2, 30);
    }

    drawParityVisualization(ctx, width, height) {
        const positions = [];
        const startX = 50;
        const spacing = 80;

        for (let i = 0; i < 5; i++) {
            positions.push({
                x: startX + i * spacing,
                y: height / 2,
                label: i < 4 ? `d${i + 1}` : 'p'
            });
        }

        // Draw parity check circle
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(startX + 2 * spacing, height / 2, 180, 60, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#4a9eff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Parity Check (sum mod 2 = 0)', startX + 2 * spacing, height / 2 - 80);

        positions.forEach((pos, i) => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            ctx.fillStyle = this.codeWord[i] === '1' ? '#ffd43b' : '#495057';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.codeWord[i], pos.x, pos.y);

            ctx.fillStyle = '#adb5bd';
            ctx.font = '10px sans-serif';
            ctx.fillText(pos.label, pos.x, pos.y + 35);
        });
    }

    transmit() {
        if (!this.codeWord) {
            this.elements.channelExplanation.textContent = 'Please encode a message first.';
            return;
        }

        const noise = parseInt(this.elements.noiseSlider.value) / 100;
        this.receivedWord = '';
        this.errorBits = '';

        for (let i = 0; i < this.codeWord.length; i++) {
            if (Math.random() < noise) {
                this.receivedWord += this.codeWord[i] === '0' ? '1' : '0';
                this.errorBits += '↑';
                this.errorBits++;
            } else {
                this.receivedWord += this.codeWord[i];
                this.errorBits += ' ';
            }
        }

        this.totalBits += this.codeWord.length;
        this.errorsDetected = this.errorBits;

        this.updateChannelDisplay();
        this.drawChannelVisualization();
        this.drawCodeSpace();
    }

    updateChannelDisplay() {
        this.elements.sentBits.innerHTML = this.codeWord.split('').join(' ');
        this.elements.receivedBits.innerHTML = this.receivedWord.split('').join(' ');
        this.elements.errorBits.innerHTML = this.errorBits.split('').join(' ');

        const errorCount = (this.errorBits.match(/↑/g) || []).length;
        this.elements.channelExplanation.innerHTML = `
            <strong>Channel Transmission:</strong><br>
            Noise level: ${this.elements.noiseSlider.value}%<br>
            Bits flipped: ${errorCount} of ${this.codeWord.length}<br>
            ${errorCount > 0 ? `<span style="color: #ff6b6b;">Error injected!</span>` : '<span style="color: #51cf66;">Clean transmission</span>'}
        `;

        this.updateBER();
    }

    updateBER() {
        if (this.totalBits > 0) {
            const ber = this.errorBits / this.totalBits;
            this.elements.ber.textContent = ber.toFixed(3);
        }
    }

    drawChannelVisualization() {
        const ctx = this.channelCtx;
        const width = this.channelCanvas.width;
        const height = this.channelCanvas.height;

        ctx.clearRect(0, 0, width, height);

        if (!this.receivedWord) {
            ctx.fillStyle = '#666';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Transmit to see channel effects', width / 2, height / 2);
            return;
        }

        // Draw sent and received bits
        const bitWidth = Math.min(40, width / this.codeWord.length);
        const startX = (width - bitWidth * this.codeWord.length) / 2;

        // Draw sent bits
        ctx.fillStyle = '#adb5bd';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sent', width / 2, 20);

        for (let i = 0; i < this.codeWord.length; i++) {
            const x = startX + i * bitWidth;
            const y = 50;

            ctx.beginPath();
            ctx.rect(x + 2, y, bitWidth - 4, 30);
            ctx.fillStyle = this.codeWord[i] === '1' ? '#4a9eff' : '#495057';
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.codeWord[i], x + bitWidth / 2, y + 15);
        }

        // Draw arrow
        ctx.strokeStyle = '#adb5bd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 90);
        ctx.lineTo(width / 2, 110);
        ctx.stroke();

        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(width / 2 - 5, 105);
        ctx.lineTo(width / 2, 110);
        ctx.lineTo(width / 2 + 5, 105);
        ctx.stroke();

        // Draw noise indicator
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Noise: ${this.elements.noiseSlider.value}%`, width / 2, 100);

        // Draw received bits
        ctx.fillStyle = '#adb5bd';
        ctx.fillText('Received', width / 2, 130);

        for (let i = 0; i < this.receivedWord.length; i++) {
            const x = startX + i * bitWidth;
            const y = 140;

            ctx.beginPath();
            ctx.rect(x + 2, y, bitWidth - 4, 30);

            const hasError = this.codeWord[i] !== this.receivedWord[i];
            ctx.fillStyle = hasError ? '#ff6b6b' : (this.receivedWord[i] === '1' ? '#51cf66' : '#495057');
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.receivedWord[i], x + bitWidth / 2, y + 15);

            if (hasError) {
                ctx.fillStyle = '#ff6b6b';
                ctx.font = '10px sans-serif';
                ctx.fillText('✗', x + bitWidth / 2, y - 5);
            }
        }
    }

    decode() {
        if (!this.receivedWord) {
            this.elements.decodingExplanation.textContent = 'Please transmit through channel first.';
            return;
        }

        switch (this.currentCode) {
            case 'hamming74':
                this.hamming74Decode();
                break;
            case 'hamming1511':
                this.hamming1511Decode();
                break;
            case 'repetition31':
                this.repetition31Decode();
                break;
            case 'parity':
                this.parityDecode();
                break;
        }

        this.updateDecodingDisplay();
        this.drawDecodingVisualization();
        this.drawCodeSpace();
    }

    hamming74Decode() {
        const received = this.receivedWord.split('').map(b => parseInt(b));

        // Calculate syndrome
        let s1 = (received[0] + received[2] + received[4] + received[6]) % 2;
        let s2 = (received[1] + received[2] + received[5] + received[6]) % 2;
        let s4 = (received[3] + received[4] + received[5] + received[6]) % 2;

        this.syndrome = `${s1}${s2}${s4}`.split('').reverse().join('');
        this.errorPosition = parseInt(this.syndrome, 2);

        // Correct error if syndrome is non-zero
        if (this.errorPosition > 0) {
            this.correctedWord = this.receivedWord.split('');
            this.correctedWord[this.errorPosition - 1] = this.correctedWord[this.errorPosition - 1] === '0' ? '1' : '0';
            this.correctedWord = this.correctedWord.join('');
            this.errorsCorrected++;
        } else {
            this.correctedWord = this.receivedWord;
        }

        // Extract message (positions 3,5,6,7)
        this.decodedMessage = this.correctedWord[2] + this.correctedWord[4] + this.correctedWord[5] + this.correctedWord[6];
    }

    hamming1511Decode() {
        const received = this.receivedWord.split('').map(b => parseInt(b));
        let syndrome = 0;

        // Calculate syndrome
        for (let p = 1; p <= 8; p *= 2) {
            let parity = 0;
            for (let i = 1; i <= 15; i++) {
                if (i & p) {
                    parity ^= received[i - 1];
                }
            }
            if (parity) {
                syndrome += p;
            }
        }

        this.syndrome = syndrome.toString(2).padStart(4, '0');
        this.errorPosition = syndrome;

        // Correct error if syndrome is non-zero
        if (this.errorPosition > 0) {
            this.correctedWord = this.receivedWord.split('');
            this.correctedWord[this.errorPosition - 1] = this.correctedWord[this.errorPosition - 1] === '0' ? '1' : '0';
            this.correctedWord = this.correctedWord.join('');
            this.errorsCorrected++;
        } else {
            this.correctedWord = this.receivedWord;
        }

        // Extract message (non-power-of-2 positions)
        this.decodedMessage = '';
        for (let i = 1; i <= 15; i++) {
            if (!this.isPowerOfTwo(i)) {
                this.decodedMessage += this.correctedWord[i - 1];
            }
        }
    }

    repetition31Decode() {
        // Majority vote decoding
        const zeros = (this.receivedWord.match(/0/g) || []).length;
        const ones = (this.receivedWord.match(/1/g) || []).length;

        this.syndrome = 'N/A';
        this.errorPosition = zeros === ones ? 'tie' : -1;

        if (zeros > ones) {
            this.decodedMessage = '0';
            this.correctedWord = '000';
        } else if (ones > zeros) {
            this.decodedMessage = '1';
            this.correctedWord = '111';
        } else {
            this.decodedMessage = this.receivedWord[0];
            this.correctedWord = this.receivedWord;
        }

        if (this.correctedWord !== this.receivedWord) {
            this.errorsCorrected++;
        }
    }

    parityDecode() {
        const received = this.receivedWord.split('').map(b => parseInt(b));
        const parity = received.slice(0, 4).reduce((sum, bit) => sum + bit, 0) % 2;

        this.syndrome = parity === received[4] ? '0' : '1';
        this.errorPosition = parity === received[4] ? -1 : 0;

        if (parity !== received[4]) {
            // Error detected but cannot correct
            this.correctedWord = this.receivedWord;
            this.decodedMessage = this.receivedWord.slice(0, 4) + '?';
        } else {
            this.correctedWord = this.receivedWord;
            this.decodedMessage = this.receivedWord.slice(0, 4);
        }
    }

    updateDecodingDisplay() {
        this.elements.syndromeBits.innerHTML = this.syndrome.split('').join(' ');
        this.elements.errorPosition.textContent = this.errorPosition > 0 ? `Bit ${this.errorPosition}` :
                                                    (this.errorPosition === 0 ? 'Detected (uncorrectable)' : 'No error');
        this.elements.correctedBits.innerHTML = this.correctedWord.split('').join(' ');
        this.elements.decodedMessage.innerHTML = this.decodedMessage.split('').join(' ');

        const hasError = this.errorPosition > 0 || (this.errorPosition === 0 && this.currentCode === 'parity');

        this.elements.decodingExplanation.innerHTML = `
            <strong>Decoding Process:</strong><br>
            Syndrome: ${this.syndrome}${this.syndrome !== 'N/A' ? ` (binary: ${parseInt(this.syndrome, 2)})` : ''}<br>
            ${hasError ?
                `<span style="color: ${this.errorPosition > 0 ? '#51cf66' : '#ff6b6b'};">
                ${this.errorPosition > 0 ? `Error at bit ${this.errorPosition} - Corrected!` : 'Error detected but cannot be corrected'}
                </span>` :
                '<span style="color: #51cf66;">No errors detected</span>'}<br>
            Original message: ${this.message}<br>
            Decoded message: ${this.decodedMessage}<br>
            ${this.decodedMessage === this.message ?
                '<span style="color: #51cf66;">✓ Message recovered correctly</span>' :
                '<span style="color: #ff6b6b;">✗ Message corruption</span>'}
        `;

        this.elements.errorsCorrected.textContent = this.errorsCorrected;
    }

    drawDecodingVisualization() {
        const ctx = this.decodingCtx;
        const width = this.decodingCanvas.width;
        const height = this.decodingCanvas.height;

        ctx.clearRect(0, 0, width, height);

        if (!this.receivedWord) {
            ctx.fillStyle = '#666';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Decode to see error correction', width / 2, height / 2);
            return;
        }

        if (this.currentCode === 'hamming74' || this.currentCode === 'hamming1511') {
            this.drawSyndromeVisualization(ctx, width, height);
        } else if (this.currentCode === 'repetition31') {
            this.drawMajorityVoteVisualization(ctx, width, height);
        } else if (this.currentCode === 'parity') {
            this.drawParityCheckVisualization(ctx, width, height);
        }
    }

    drawSyndromeVisualization(ctx, width, height) {
        const syndromeValue = parseInt(this.syndrome, 2);

        // Draw syndrome calculation
        ctx.fillStyle = '#adb5bd';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Syndrome Calculation', width / 2, 30);

        // Draw syndrome bits
        const syndromeBits = this.syndrome.split('').reverse();
        const bitWidth = 60;
        const startX = (width - syndromeBits.length * bitWidth) / 2;

        syndromeBits.forEach((bit, i) => {
            const x = startX + i * bitWidth;
            const y = 80;

            ctx.beginPath();
            ctx.rect(x, y, bitWidth - 10, 40);
            ctx.fillStyle = bit === '1' ? '#ff6b6b' : '#495057';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bit, x + (bitWidth - 10) / 2, y + 20);

            ctx.fillStyle = '#adb5bd';
            ctx.font = '12px sans-serif';
            ctx.fillText(`2^${i}`, x + (bitWidth - 10) / 2, y + 55);
        });

        // Draw arrow to result
        ctx.strokeStyle = '#adb5bd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width / 2, 130);
        ctx.lineTo(width / 2, 150);
        ctx.stroke();

        // Draw error position
        ctx.fillStyle = this.errorPosition > 0 ? '#ff6b6b' : '#51cf66';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Error Position: ${this.errorPosition > 0 ? this.errorPosition : 'None'}`, width / 2, 175);

        // Draw correction visualization if error
        if (this.errorPosition > 0) {
            const codeWordLength = this.codeWord.length;
            const bitWidth = Math.min(40, (width - 40) / codeWordLength);
            const startX = (width - bitWidth * codeWordLength) / 2;
            const y = 220;

            ctx.fillStyle = '#adb5bd';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Before Correction', width / 2, y - 10);

            for (let i = 0; i < this.receivedWord.length; i++) {
                const x = startX + i * bitWidth;

                ctx.beginPath();
                ctx.rect(x + 2, y, bitWidth - 4, 30);
                ctx.fillStyle = (i + 1) === this.errorPosition ? '#ff6b6b' :
                               (this.receivedWord[i] === '1' ? '#4a9eff' : '#495057');
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.receivedWord[i], x + bitWidth / 2, y + 15);
            }

            // Draw arrow
            ctx.strokeStyle = '#51cf66';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(width / 2, y + 40);
            ctx.lineTo(width / 2, y + 55);
            ctx.stroke();

            // Draw corrected word
            ctx.fillStyle = '#51cf66';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('After Correction', width / 2, y + 70);

            const correctedY = y + 80;
            for (let i = 0; i < this.correctedWord.length; i++) {
                const x = startX + i * bitWidth;

                ctx.beginPath();
                ctx.rect(x + 2, correctedY, bitWidth - 4, 30);
                ctx.fillStyle = (i + 1) === this.errorPosition ? '#51cf66' :
                               (this.correctedWord[i] === '1' ? '#4a9eff' : '#495057');
                ctx.fill();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.correctedWord[i], x + bitWidth / 2, correctedY + 15);
            }
        }
    }

    drawMajorityVoteVisualization(ctx, width, height) {
        const positions = [
            { x: 100, y: height / 2 - 40, bit: this.receivedWord[0] },
            { x: 200, y: height / 2 - 40, bit: this.receivedWord[1] },
            { x: 300, y: height / 2 - 40, bit: this.receivedWord[2] }
        ];

        const zeros = (this.receivedWord.match(/0/g) || []).length;
        const ones = (this.receivedWord.match(/1/g) || []).length;
        const winner = zeros > ones ? '0' : (ones > zeros ? '1' : '?');

        ctx.fillStyle = '#adb5bd';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Majority Vote Decoding', width / 2, 30);

        // Show vote counts
        ctx.fillStyle = '#495057';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Zeros: ${zeros}`, 80, 60);
        ctx.fillText(`Ones: ${ones}`, 220, 60);

        // Draw received bits
        positions.forEach((pos, i) => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
            ctx.fillStyle = pos.bit === winner ? '#51cf66' : '#495057';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pos.bit, pos.x, pos.y);
        });

        // Draw result
        ctx.fillStyle = winner === '?' ? '#ff6b6b' : '#51cf66';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Result: ${winner}`, width / 2, height - 30);
    }

    drawParityCheckVisualization(ctx, width, height) {
        const received = this.receivedWord.split('');
        const parity = received.slice(0, 4).reduce((sum, bit) => sum + parseInt(bit), 0) % 2;
        const hasError = parity !== parseInt(received[4]);

        ctx.fillStyle = '#adb5bd';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Parity Check', width / 2, 30);

        // Draw received bits
        const bitWidth = 60;
        const startX = (width - 5 * bitWidth) / 2;

        received.forEach((bit, i) => {
            const x = startX + i * bitWidth;
            const y = 80;

            ctx.beginPath();
            ctx.rect(x, y, bitWidth - 10, 40);
            ctx.fillStyle = bit === '1' ? '#4a9eff' : '#495057';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bit, x + (bitWidth - 10) / 2, y + 20);
        });

        // Draw parity check
        ctx.fillStyle = '#adb5bd';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Calculated parity: ${parity}`, width / 2, 150);
        ctx.fillText(`Received parity: ${received[4]}`, width / 2, 170);

        // Draw result
        ctx.fillStyle = hasError ? '#ff6b6b' : '#51cf66';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(hasError ? 'Error Detected!' : 'No Error', width / 2, 210);

        if (hasError) {
            ctx.fillStyle = '#ff6b6b';
            ctx.font = '12px sans-serif';
            ctx.fillText('(Cannot correct - simple parity only detects)', width / 2, 240);
        }
    }

    drawCodeSpace() {
        const ctx = this.codeSpaceCtx;
        const width = this.codeSpaceCanvas.width;
        const height = this.codeSpaceCanvas.height;

        ctx.clearRect(0, 0, width, height);

        if (this.currentCode === 'hamming74') {
            this.draw3DCube(ctx, width, height);
        } else if (this.currentCode === 'repetition31') {
            this.drawLineCodeSpace(ctx, width, height);
        } else {
            this.drawHypercubeProjection(ctx, width, height);
        }
    }

    draw3DCube(ctx, width, height) {
        // Draw 3D cube representing code space
        // For simplicity, we'll show a 2D projection with valid code words highlighted

        const centerX = width / 2;
        const centerY = height / 2;
        const size = 100;

        // Define cube vertices
        const vertices = [
            { x: centerX - size, y: centerY - size, label: '000' },
            { x: centerX + size, y: centerY - size, label: '001' },
            { x: centerX - size, y: centerY + size, label: '010' },
            { x: centerX + size, y: centerY + size, label: '011' },
            { x: centerX - size/2, y: centerY - size - size/2, label: '100' },
            { x: centerX + size + size/2, y: centerY - size - size/2, label: '101' },
            { x: centerX - size/2, y: centerY + size + size/2, label: '110' },
            { x: centerX + size + size/2, y: centerY + size + size/2, label: '111' }
        ];

        // Draw edges
        ctx.strokeStyle = '#343a40';
        ctx.lineWidth = 1;

        // Bottom face
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        ctx.lineTo(vertices[1].x, vertices[1].y);
        ctx.lineTo(vertices[3].x, vertices[3].y);
        ctx.lineTo(vertices[2].x, vertices[2].y);
        ctx.closePath();
        ctx.stroke();

        // Top face
        ctx.beginPath();
        ctx.moveTo(vertices[4].x, vertices[4].y);
        ctx.lineTo(vertices[5].x, vertices[5].y);
        ctx.lineTo(vertices[7].x, vertices[7].y);
        ctx.lineTo(vertices[6].x, vertices[6].y);
        ctx.closePath();
        ctx.stroke();

        // Connecting edges
        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        ctx.lineTo(vertices[4].x, vertices[4].y);
        ctx.moveTo(vertices[1].x, vertices[1].y);
        ctx.lineTo(vertices[5].x, vertices[5].y);
        ctx.moveTo(vertices[2].x, vertices[2].y);
        ctx.lineTo(vertices[6].x, vertices[6].y);
        ctx.moveTo(vertices[3].x, vertices[3].y);
        ctx.lineTo(vertices[7].x, vertices[7].y);
        ctx.stroke();

        // Highlight valid code words (example subset)
        const validCodes = ['0000000', '0001111', '1110000', '1111111'];

        vertices.forEach((v, i) => {
            // For visualization, we'll just highlight some vertices as "valid"
            const isValid = i % 2 === 0; // Simplified

            ctx.beginPath();
            ctx.arc(v.x, v.y, isValid ? 8 : 5, 0, Math.PI * 2);

            if (this.receivedWord) {
                // Show received word position (simplified)
                ctx.fillStyle = '#ffd43b';
            } else if (isValid) {
                ctx.fillStyle = '#51cf66';
            } else {
                ctx.fillStyle = '#495057';
            }

            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Draw title
        ctx.fillStyle = '#adb5bd';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('3D Code Space (simplified projection)', width / 2, 20);
        ctx.fillText('Green = Valid code words', width / 2, height - 10);
    }

    drawLineCodeSpace(ctx, width, height) {
        // Draw 1D code space for repetition code
        const centerX = width / 2;
        const centerY = height / 2;

        // Draw line
        ctx.strokeStyle = '#343a40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, centerY);
        ctx.lineTo(width - 50, centerY);
        ctx.stroke();

        // Draw valid code words (000 and 111)
        ctx.beginPath();
        ctx.arc(100, centerY, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#51cf66';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('000', 100, centerY);

        ctx.beginPath();
        ctx.arc(width - 100, centerY, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#51cf66';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('111', width - 100, centerY);

        // Show received word if available
        if (this.receivedWord) {
            const value = parseInt(this.receivedWord, 2);
            const x = 100 + (value / 3) * (width - 200);

            ctx.beginPath();
            ctx.arc(x, centerY, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd43b';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.fillStyle = '#adb5bd';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('1D Code Space (Repetition Code)', width / 2, 20);
    }

    drawHypercubeProjection(ctx, width, height) {
        // Draw hypercube projection for larger codes
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 80;

        // Draw circle representing code space
        ctx.strokeStyle = '#343a40';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw some sample code words
        const numSamples = Math.min(16, Math.pow(2, this.getCodeInfo().messageLength));
        for (let i = 0; i < numSamples; i++) {
            const angle = (i / numSamples) * Math.PI * 2;
            const x = centerX + radius * 0.7 * Math.cos(angle);
            const y = centerY + radius * 0.7 * Math.sin(angle);

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);

            // Alternate between valid and invalid for visualization
            const isValid = i % 3 === 0;
            ctx.fillStyle = isValid ? '#51cf66' : '#495057';
            ctx.fill();
        }

        // Show received word
        if (this.receivedWord) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#ffd43b';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        ctx.fillStyle = '#adb5bd';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Code Space (Hypercube Projection)', width / 2, 20);
        ctx.fillText('Green = Valid, Gray = Invalid, Yellow = Received', width / 2, height - 10);
    }

    stepEncode() {
        this.stepIndex = 0;
        this.animateEncoding();
    }

    animateEncoding() {
        if (this.stepIndex === 0) {
            this.encode();
            this.stepIndex++;
            setTimeout(() => this.animateEncoding(), this.animationSpeed);
        } else {
            this.stepIndex = 0;
        }
    }

    stepDecode() {
        this.stepIndex = 0;
        this.animateDecoding();
    }

    animateDecoding() {
        if (this.stepIndex === 0) {
            this.decode();
            this.stepIndex++;
            setTimeout(() => this.animateDecoding(), this.animationSpeed);
        } else {
            this.stepIndex = 0;
        }
    }

    animateAll() {
        this.reset();
        setTimeout(() => {
            this.encode();
            setTimeout(() => {
                this.transmit();
                setTimeout(() => {
                    this.decode();
                }, this.animationSpeed);
            }, this.animationSpeed);
        }, 500);
    }

    reset() {
        this.message = '';
        this.codeWord = '';
        this.receivedWord = '';
        this.correctedWord = '';
        this.decodedMessage = '';
        this.syndrome = '';
        this.errorPosition = -1;

        this.elements.messageBits.innerHTML = '_ _ _ _';
        this.elements.parityBits.innerHTML = '_ _ _';
        this.elements.codeWord.innerHTML = '_ _ _ _ _ _ _';
        this.elements.sentBits.innerHTML = '_ _ _ _ _ _ _';
        this.elements.receivedBits.innerHTML = '_ _ _ _ _ _ _';
        this.elements.errorBits.innerHTML = '_ _ _ _ _ _ _';
        this.elements.syndromeBits.innerHTML = '_ _ _';
        this.elements.errorPosition.textContent = '-';
        this.elements.correctedBits.innerHTML = '_ _ _ _ _ _ _';
        this.elements.decodedMessage.innerHTML = '_ _ _ _';

        this.elements.encodingExplanation.textContent = 'Enter a message and click "Encode" to see how parity bits are calculated.';
        this.elements.channelExplanation.textContent = 'Click "Transmit" to simulate channel noise and bit flips.';
        this.elements.decodingExplanation.textContent = 'Click "Decode" to see how errors are detected and corrected using syndrome calculation.';

        this.drawInitialStates();
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ErrorCorrectionSimulator();
});
