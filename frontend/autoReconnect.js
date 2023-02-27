export const autoReconnect = (ws_create, timeBetweenAttempts = 3000) => {
    // src: https://stackoverflow.com/a/73557183/9415337
    let ws = ws_create();
    const startReconnecting = () => {
        let interval = setInterval(()=>{
            console.log('trying to reconnect')
            ws = ws_create();
            ws.onOpen = () => {
                ws.onClose = startReconnecting;
                clearInterval(interval);
            }
        }, timeBetweenAttempts);
    }
    ws.onClose = startReconnecting;
}