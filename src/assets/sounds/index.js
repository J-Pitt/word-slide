const sounds = {};

function loadSound(name, url) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.addEventListener('canplaythrough', () => {
            sounds[name] = audio;
            resolve();
        });
        audio.addEventListener('error', reject);
        audio.load();
    });
}

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0; // Reset sound to start
        sounds[name].play();
    }
}

export { loadSound, playSound };