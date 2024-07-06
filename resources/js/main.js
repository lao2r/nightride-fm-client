Neutralino.init();

Neutralino.window.setDraggableRegion('titlebar');

document.getElementById('minimize-btn').addEventListener('click', () => {
    Neutralino.window.minimize();
});

document.getElementById('close-btn').addEventListener('click', () => {
    Neutralino.app.exit();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' || (event.ctrlKey && event.shiftKey && event.key === 'I') || event.key === ' ' || (event.ctrlKey && event.key === 'R') || (event.ctrlKey && event.shiftKey && event.key === 'R')) {
        event.preventDefault();
    }
});


