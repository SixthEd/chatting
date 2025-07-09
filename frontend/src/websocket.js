class MyWebsocket {
    constructor(onMessage) {
        this.onMessage = onMessage;
        this.ws = null;
    }

    newMessageHandler = (onMessage) => {
        this.onMessage = onMessage;
    };

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

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