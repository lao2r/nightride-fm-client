let audioElement;
let playing = false;
let audioContext;
let analyser;
let isMuted = false;
let animationId;
let currentStyle = 'chillsynth';
let metaInfo = {};

const playBtn = document.getElementById('playBtn');
const muteBtn = document.getElementById('muteBtn');
const status = document.getElementById('status');
const currentInfo = document.getElementById('currentInfo');
const volumeControl = document.querySelector('.volume-level');
const volumeBar = document.querySelector('.volume-bar');
const frequencyCanvas = document.getElementById('frequencyCanvas');
const barsCanvas = document.getElementById('barsCanvas');
const styleButtons = document.querySelectorAll('.style-btn');



document.addEventListener('keydown', (event) => {
    // Предотвращаем действие для Tab и Ctrl + Shift + I
    if (event.key === 'Tab' || (event.ctrlKey && event.shiftKey && event.key === 'I') || event.key === ' ' || (event.ctrlKey && event.key === 'R') || (event.ctrlKey && event.shiftKey && event.key === 'R')) {
        event.preventDefault();
    }
});

document.addEventListener('contextmenu', event => event.preventDefault());


// Default volume to 50%
let defaultVolume = 0.5;

playBtn.addEventListener('click', togglePlay);
muteBtn.addEventListener('click', toggleMute);

volumeBar.addEventListener('mousedown', startVolumeChange);
document.addEventListener('mousemove', changeVolume);
document.addEventListener('mouseup', stopVolumeChange);

let isChangingVolume = false;

function startVolumeChange(e) {
    isChangingVolume = true;
    changeVolume(e);
}

function changeVolume(e) {
    if (!isChangingVolume) return;

    const rect = volumeBar.getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const volume = x / rect.width;

    setVolume(volume);
}

function stopVolumeChange() {
    isChangingVolume = false;
}

function setVolume(volume) {
    if (audioElement) {
        audioElement.volume = volume;
    }
    defaultVolume = volume;
    volumeControl.style.width = `${volume * 100}%`;
}

styleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const newStyle = e.target.dataset.style;
        if (newStyle !== currentStyle) {
            document.body.className = newStyle;
            currentStyle = newStyle;
            styleButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            updateVisualColors();
            if (playing) {
                stopAudio();
                playAudio();
            }
            updateCurrentInfo();
            updateButtonStyles();
        }
    });
});

const sseUrl = 'https://nightride.fm/meta';
const eventSource = new EventSource(sseUrl);

eventSource.onmessage = (event) => {
    if (event.data !== "keepalive") {
        const data = JSON.parse(event.data);
        data.forEach(item => {
            metaInfo[item.station] = item;
        });
        updateCurrentInfo();
    }
};

function updateCurrentInfo() {
    const currentMeta = metaInfo[currentStyle];
    if (currentMeta) {
        const { artist, title, album } = currentMeta;
        currentInfo.textContent = `${artist} - ${title} (${album})`;
    } else {
        currentInfo.textContent = 'Loading track information...';
    }
}

function togglePlay() {
    if (playing) {
        pauseAudio();
    } else {
        playAudio();
    }
}


// Функция для установки SVG-иконки Play
function setPlayIcon() {
    playBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
        </svg>
    `;
}

// Функция для установки SVG-иконки Pause
function setPauseIcon() {
    playBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M14 19h4V5h-4v14zm-10 0h4V5H4v14z"/>
        </svg>
    `;
}

// Функция для установки SVG-иконки Mute
function setMuteIcon() {
    muteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
    `;
}

// Функция для установки SVG-иконки Unmute
function setUnmuteIcon() {
    muteBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
    `;
}

function playAudio() {
    stopAudio();

    audioElement = new Audio(`https://stream.nightride.fm/${currentStyle}.mp3`);
    audioElement.crossOrigin = "anonymous";
    audioElement.volume = defaultVolume;

    status.textContent = 'Connecting...';
    audioElement.addEventListener('canplay', () => {
        status.textContent = 'Now playing';
        playing = true;
        setPauseIcon();
        setupAudioContext();
    });
    
    audioElement.addEventListener('error', (e) => {
        status.textContent = 'Connecting...';
        playing = false;
        setPlayIcon();
    });
    
    audioElement.play().catch(error => {
        status.textContent = 'Connecting...';
        playing = false;
        setPlayIcon();
    });
}

function pauseAudio() {
    if (audioElement) {
        audioElement.pause();
        status.textContent = 'Paused';
        playing = false;
        setPlayIcon();
    }
}
function stopAudio() {
    if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        audioElement.load();
        audioElement = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(error => {
            console.warn('Error closing AudioContext:', error);
        }).finally(() => {
            audioContext = null;
            analyser = null;
        });
    } else {
        audioContext = null;
        analyser = null;
    }
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    playing = false;
    setPlayIcon();
}

function toggleMute() {
    if (audioElement) {
        audioElement.muted = !audioElement.muted;
        isMuted = audioElement.muted;
        if (isMuted) {
            setMuteIcon();
        } else {
            setUnmuteIcon();
        }
    }
}

function setupAudioContext() {
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(error => {
            console.warn('Error closing existing AudioContext:', error);
        });
    }

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();

    const source = audioContext.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    updateVisualizers();
}

function updateVisualizers() {
    drawFrequency();
    drawBars();
    animationId = requestAnimationFrame(updateVisualizers);
}

function drawFrequency() {
    const WIDTH = frequencyCanvas.width;
    const HEIGHT = frequencyCanvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);
    const ctx = frequencyCanvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.lineWidth = 1;
    ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('color');
    ctx.beginPath();

    const sliceWidth = WIDTH * 1.0 / (bufferLength / 4);
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * HEIGHT / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.lineTo(WIDTH, HEIGHT / 2);
    ctx.stroke();
}

function drawBars() {
    const WIDTH = barsCanvas.width;
    const HEIGHT = barsCanvas.height;
    const bufferLength = analyser.frequencyBinCount / 8;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);
    const ctx = barsCanvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / bufferLength) * 2.5;
    let x = 0;

    const gradient = ctx.createLinearGradient(0, HEIGHT, 0, 0);
    gradient.addColorStop(0, getComputedStyle(document.body).getPropertyValue('color'));
    gradient.addColorStop(1, getComputedStyle(document.querySelector('#currentInfo')).getPropertyValue('color'));

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * HEIGHT;

        ctx.fillStyle = gradient;
        ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }
}

function updateVisualColors() {
    drawFrequency();
    drawBars();
}

function updateButtonStyles() {
    styleButtons.forEach(button => {
        const style = button.dataset.style;
        if (style === currentStyle) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function resizeCanvas() {
    frequencyCanvas.width = frequencyCanvas.offsetWidth;
    frequencyCanvas.height = frequencyCanvas.offsetHeight;
    barsCanvas.width = barsCanvas.offsetWidth;
    barsCanvas.height = barsCanvas.offsetHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();