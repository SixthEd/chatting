class MyWebsocket {
    constructor(onMessage) {
        this.onMessage = onMessage;
        this.ws = null;
    }

    newMessageHandler = (onMessage) => {
        this.onMessage = onMessage;
    };

    new(url) {
        let ws = new WebSocket(url);
        ws.addEventListener("message", (event) => {
            this.onMessage(event);
        });
        this.ws = ws;
        return ws;
    }
}

export default MyWebsocket;
