function init() {
    (document.getElementById('playButton') as HTMLButtonElement).addEventListener('click',
            _ => window.location.href = 'main.html');
}

document.addEventListener('DOMContentLoaded', init);