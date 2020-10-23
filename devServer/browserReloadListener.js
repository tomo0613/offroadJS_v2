const eventSource = new EventSource('sse');

eventSource.addEventListener('message', onMessage);
eventSource.addEventListener('error', reload);

function onMessage(e) {
    console.info('dev-server ', e.data);

    if (e.data === 'reload') {
        reload();
    }
}

function reload() {
    eventSource.removeEventListener('message', onMessage);
    eventSource.removeEventListener('error', reload);
    eventSource.close();
    document.location.reload();
}
