import pg from "pg";
import bodyParser from "body-parser";
import env from "dotenv";
import express from "express";
import router from "./routes.js";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import http from "http";
import { parse } from "url";
import { generate } from "random-words";
import { type } from "os";

const userSockets = {};

const roomMessageType = {
    UserConnected: 1,
    UserDisconnected: 2,
    ConnectedUserList: 3,
    Status: 4,
    ReceivedMessage: 5,
    password: 6,
    roomNotFound: 7,
    gameStart: 8,
    clockTime: 9,
    chooseCreator: 10,
    choosePlayer: 11,
    randomWord: 12,
    winner: 13,
    Drawing: 14,
    ClearDrawing: 15,
};

const MessageType = {
    UserConnected: 1,
    UserDisconnected: 2,
    ConnectedUserList: 3,
    Status: 4,
    ReceivedMessage: 5,
    ReceivedImage: 6,
    ReceivedImageChunk: 7,
    ReceivedVideo: 8,
    ReceivedVideoChunk: 9,
    ReceivedAudio: 10,
    ReceivedAudioChunk: 11,
    ReceivedDoc: 12,
    ReceivedDocChunk: 13,
    Offer: 14,
    Answer: 15,
    IceCandidate: 16,
    DisConnectCall: 17,
};

let base64Data;
const chunkSize = 10000000;
let totalChunks;

const classRoomPasswords = {};

const creators = {};

const intervals = {};

const randomWords = {};

const port = 4000;

const cors = (req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    //
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers",
    );
    if (req.method.toLowerCase() === "options") return res.sendStatus(204);
    next();
};

env.config();

let db;

try {
    // database config
    db = new pg.Client({
        user: "postgres",
        host: "localhost",
        database: "chattwo",
        password: '1234',
        port: 5432,
    });
} catch (e) {
    console.log("fucked", e);
}

//database connect
db.connect();

const app = express();

//custom middleware
app.use(cors);

//middleware for json bodyparser
app.use(bodyParser.json({ limit: "50mb" }));

//middleware for parsing data from cookies
app.use(cookieParser());

//middleware for routes
app.use("/", router);

//websocket
const server = http.createServer(app);

const web = new WebSocketServer({
    noServer: true,
});

const webroom = new WebSocketServer({
    noServer: true,
});

//chat socket connection
web.on("connection", (socket, request) => {
    socket.send(JSON.stringify({ working: "working chat" }));
    const parsedUrl = parse(request.url, true);
    console.log(parsedUrl.query.id);
    const id = parsedUrl.query.id;

    userSockets[id] = socket;
    // send a list of all connected users to this user
    socket.send(
        JSON.stringify({
            type: MessageType.ConnectedUserList,
            connectedUsers: Object.keys(userSockets),
        }),
    );

    Object.entries(userSockets).forEach(([id, client]) => {
        if (client !== socket && client.readyState === socket.OPEN) {
            client.send(
                JSON.stringify({
                    type: MessageType.UserConnected,
                    id,
                }),
            );
        }
    });

    socket.on("close", () => {
        Object.entries(userSockets).forEach(([id, client]) => {
            if (client !== socket && client.readyState === socket.OPEN) {
                client.send(
                    JSON.stringify({
                        type: MessageType.UserDisconnected,
                        id,
                    }),
                );
            }
        });
    });

    socket.on("message", (message) => {
        const parsedMessage = JSON.parse(message.toString());
        const senderSocket = userSockets[parsedMessage.to];
        const senderMessage = parsedMessage.message;

        console.log(parsedMessage);
        if (senderSocket) {
            switch (parsedMessage.type) {
                case MessageType.ReceivedMessage:
                    console.log(parsedMessage);

                    senderSocket.send(
                        JSON.stringify({
                            type: MessageType.ReceivedMessage,
                            from: parsedMessage.from,
                            message: senderMessage,
                            send_at: parsedMessage.send_at,
                            date: parsedMessage.date,
                        }),
                    );
                    break;
                case MessageType.ReceivedImage:
                    console.log("imagesending");
                    base64Data = parsedMessage.image;
                    totalChunks = Math.ceil(base64Data.length / chunkSize);
                    for (let i = 0; i < totalChunks; i++) {
                        const chunk = base64Data.slice(
                            i * chunkSize,
                            (i + 1) * chunkSize,
                        );
                        senderSocket.send(
                            JSON.stringify({
                                type: MessageType.ReceivedImageChunk,
                                totalChunks,
                                partNumber: i,
                                chunk,
                                from: parsedMessage.from,
                                message: senderMessage,
                                send_at: parsedMessage.send_at,
                                date: parsedMessage.date,
                            }),
                        );
                    }
                    break;
                case MessageType.ReceivedVideo:
                    console.log("videosending");
                    base64Data = parsedMessage.video;
                    totalChunks = Math.ceil(base64Data.length / chunkSize);
                    for (let i = 0; i < totalChunks; i++) {
                        const chunk = base64Data.slice(
                            i * chunkSize,
                            (i + 1) * chunkSize,
                        );
                        senderSocket.send(
                            JSON.stringify({
                                type: MessageType.ReceivedVideoChunk,
                                totalChunks,
                                partNumber: i,
                                chunk,
                                from: parsedMessage.from,
                                message: senderMessage,
                                send_at: parsedMessage.send_at,
                                date: parsedMessage.date,
                            }),
                        );
                    }

                case MessageType.ReceivedAudio:
                    console.log("audiosending");
                    base64Data = parsedMessage.audio;
                    totalChunks = Math.ceil(base64Data.length / chunkSize);
                    for (let i = 0; i < totalChunks; i++) {
                        const chunk = base64Data.slice(
                            i * chunkSize,
                            (i + 1) * chunkSize,
                        );
                        senderSocket.send(
                            JSON.stringify({
                                type: MessageType.ReceivedAudioChunk,
                                totalChunks,
                                partNumber: i,
                                chunk,
                                from: parsedMessage.from,
                                message: senderMessage,
                                send_at: parsedMessage.send_at,
                                date: parsedMessage.date,
                            }),
                        );
                    }
                    break;
                case MessageType.ReceivedDoc:
                    console.log("documentsending");
                    base64Data = parsedMessage.doc;
                    totalChunks = Math.ceil(base64Data.length / chunkSize);
                    for (let i = 0; i < totalChunks; i++) {
                        const chunk = base64Data.slice(
                            i * chunkSize,
                            (i + 1) * chunkSize,
                        );
                        senderSocket.send(
                            JSON.stringify({
                                type: MessageType.ReceivedDocChunk,
                                totalChunks,
                                partNumber: i,
                                chunk,
                                from: parsedMessage.from,
                                message: senderMessage,
                                send_at: parsedMessage.send_at,
                                date: parsedMessage.date,
                                docName: parsedMessage.docName,
                            }),
                        );
                    }
                    break;
                case MessageType.Offer:
                    senderSocket.send(
                        JSON.stringify({
                            type: MessageType.Offer,
                            offer: parsedMessage.offer,
                            to: parsedMessage.to,
                        }),
                    );
                    console.log("offer");
                    break;
                case MessageType.Answer:
                    senderSocket.send(
                        JSON.stringify({
                            type: MessageType.Answer,
                            answer: parsedMessage.answer,
                        }),
                    );
                    break;
                case MessageType.IceCandidate:
                    senderSocket.send(
                        JSON.stringify({
                            type: MessageType.IceCandidate,
                            candidate: parsedMessage.candidate,
                        }),
                    );
                    break;
                case MessageType.DisConnectCall:
                    senderSocket.send(
                        JSON.stringify({ type: MessageType.DisConnectCall }),
                    );
            }
        }

        // web.clients.forEach((client)=>{
        //     if (client !== socket && client.readyState === socket.OPEN)
        //         {
        //            client.send(message.toString());
        //         }
        // })
    });
});

//room socket connection
webroom.on("connection", async (socket, request) => {
    socket.send(JSON.stringify({ working: "working room" }));
    const parsedUrl = parse(request.url, true);
    console.log(parsedUrl.query.id);
    const id = parsedUrl.query.id;

    const response = await db.query(`Select * from users where id =$1`, [id]);
    const name = response.rows[0].name;

    socket.on("close", () => {
        if (classRoomPasswords.hasOwnProperty(parsedUrl.password)) {
            Object.entries(classRoomPasswords[parsedUrl.password]).forEach(
                ([id, client]) => {
                    if (
                        client !== socket &&
                        client.readyState === socket.OPEN
                    ) {
                        client.send(
                            JSON.stringify({
                                type: roomMessageType.UserDisconnected,
                                id,
                                name,
                            }),
                        );
                    }
                },
            );
            delete classRoomPasswords[parsedUrl.password][id];
        } else {
            return;
        }

        if (Object.keys(classRoomPasswords[parsedUrl.password]).length === 0) {
            delete classRoomPasswords[parsedUrl.password];
            delete creators[parsedUrl.password];
            delete randomWords[parsedUrl.password];
            clearInterval(intervals[parsedUrl.password]);
            console.log("classLength", classRoomPasswords);
        } else if (creators[parsedUrl.password] == id) {
            clearInterval(intervals[parsedUrl.password]);

            const passwordArray = Object.keys(
                classRoomPasswords[parsedUrl.password],
            );
            const randomNumber = Math.floor(
                Math.random() * passwordArray.length,
            );
            const creator = passwordArray[randomNumber];
            creators[parsedUrl.password] = creator;
            console.log(passwordArray, randomNumber, creator);
            const word = generate({ minLength: 3, maxLength: 8 });
            randomWords[req.query.password] = word;
            Object.entries(classRoomPasswords[parsedUrl.password]).forEach(
                ([id, client]) => {
                    if (id === creator) {
                        client.send(
                            JSON.stringify({
                                type: roomMessageType.chooseCreator,
                                word,
                            }),
                        );
                    } else {
                        client.send(
                            JSON.stringify({
                                type: roomMessageType.choosePlayer,
                            }),
                        );
                    }
                },
            );
            console.log(creators[parsedUrl.password]);
        }
    });

    socket.on("message", (message) => {
        const parsedMessage = JSON.parse(message.toString());
        // const senderSocket = roomUserSockets[parsedMessage.to];
        // const senderMessage = parsedMessage.message;

        console.log(parsedMessage);
        const id = parsedMessage.id;

        switch (parsedMessage.type) {
            case roomMessageType.password:
                if (
                    !classRoomPasswords.hasOwnProperty(
                        parsedMessage.password,
                    ) &&
                    parsedMessage.role === "creator"
                ) {
                    creators[parsedMessage.password] = id;
                    classRoomPasswords[parsedMessage.password] = {
                        [id]: socket,
                    };
                    const word = generate({ minLength: 3, maxLength: 8 });
                    randomWords[parsedMessage.password] = word;
                    socket.send(
                        JSON.stringify({
                            type: roomMessageType.randomWord,
                            word,
                        }),
                    );
                } else if (
                    classRoomPasswords.hasOwnProperty(parsedMessage.password) &&
                    parsedMessage.role === "player"
                ) {
                    classRoomPasswords[parsedMessage.password] = {
                        ...classRoomPasswords[parsedMessage.password],
                        [id]: socket,
                    };
                } else {
                    socket.send(
                        JSON.stringify({
                            type: roomMessageType.roomNotFound,
                            message: "room not found",
                        }),
                    );
                }

                if (classRoomPasswords.hasOwnProperty(parsedMessage.password)) {
                    Object.entries(
                        classRoomPasswords[parsedMessage.password],
                    ).forEach(([id, client]) => {
                        if (
                            client !== socket &&
                            client.readyState === socket.OPEN
                        ) {
                            client.send(
                                JSON.stringify({
                                    type: roomMessageType.UserConnected,
                                    name: parsedMessage.name,
                                }),
                            );
                        }
                    });
                }
                break;

            case roomMessageType.ReceivedMessage:
                if (classRoomPasswords.hasOwnProperty(parsedMessage.password)) {
                    if (
                        parsedMessage.message.toLowerCase() ===
                            randomWords[parsedMessage.password].toLowerCase() &&
                        parsedMessage.role === "player"
                    ) {
                        clearInterval(intervals[parsedMessage.password]);
                        if (
                            classRoomPasswords[
                                parsedMessage.password
                            ].hasOwnProperty(parsedMessage.id)
                        ) {
                            Object.entries(
                                classRoomPasswords[parsedMessage.password],
                            ).forEach(([id, client]) => {
                                client.send(
                                    JSON.stringify({
                                        type: roomMessageType.winner,
                                        id: parsedMessage.id,
                                        name: parsedMessage.fromName,
                                    }),
                                );
                            });

                            setTimeout(() => {
                                if (
                                    classRoomPasswords.hasOwnProperty(
                                        parsedMessage.password,
                                    )
                                ) {
                                    const passwordArray = Object.keys(
                                        classRoomPasswords[
                                            parsedMessage.password
                                        ],
                                    );
                                    const randomNumber = Math.floor(
                                        Math.random() * passwordArray.length,
                                    );
                                    const creator = passwordArray[randomNumber];
                                    creators[parsedMessage.password] = creator;
                                    // console.log(passwordArray, randomNumber, creator)
                                    const word = generate({
                                        minLength: 3,
                                        maxLength: 8,
                                    });
                                    randomWords[parsedMessage.password] = word;
                                    Object.entries(
                                        classRoomPasswords[
                                            parsedMessage.password
                                        ],
                                    ).forEach(([id, client]) => {
                                        if (id === creator) {
                                            client.send(
                                                JSON.stringify({
                                                    type: roomMessageType.chooseCreator,
                                                    word,
                                                }),
                                            );
                                        } else {
                                            client.send(
                                                JSON.stringify({
                                                    type: roomMessageType.choosePlayer,
                                                }),
                                            );
                                        }
                                    });
                                }
                            }, 15000);
                        }
                    }
                    Object.entries(
                        classRoomPasswords[parsedMessage.password],
                    ).forEach(([id, client]) => {
                        if (
                            client !== socket &&
                            client.readyState === socket.OPEN
                        ) {
                            client.send(
                                JSON.stringify({
                                    type: roomMessageType.ReceivedMessage,
                                    from: parsedMessage.fromName,
                                    message: parsedMessage.message,
                                }),
                            );
                        }
                    });
                }

                break;

            case roomMessageType.UserDisconnected:
                delete classRoomPasswords[parsedMessage.password].id;
                console.log(classRoomPasswords[parsedMessage.password]);

                break;

            case roomMessageType.gameStart:
                Object.entries(
                    classRoomPasswords[parsedMessage.password],
                ).forEach(([id, client]) => {
                    if (
                        client !== socket &&
                        client.readyState === socket.OPEN
                    ) {
                        client.send(
                            JSON.stringify({
                                type: roomMessageType.gameStart,
                                message: parsedMessage.message,
                            }),
                        );
                    }
                });

                let time = 360;
                intervals[parsedMessage.password] = setInterval(() => {
                    if (time === 0) {
                        chooseCreator();
                        clearInterval(intervals[parsedMessage.password]);
                    }

                    if (
                        classRoomPasswords.hasOwnProperty(
                            parsedMessage.password,
                        )
                    ) {
                        Object.entries(
                            classRoomPasswords[parsedMessage.password],
                        ).forEach(([id, client]) => {
                            if (client.readyState === socket.OPEN) {
                                client.send(
                                    JSON.stringify({
                                        type: roomMessageType.clockTime,
                                        clockTime: time,
                                    }),
                                );
                            }
                        });
                    }

                    time--;
                }, 1000);

                const chooseCreator = () => {
                    if (
                        classRoomPasswords.hasOwnProperty(
                            parsedMessage.password,
                        )
                    ) {
                        const passwordArray = Object.keys(
                            classRoomPasswords[parsedMessage.password],
                        );
                        const randomNumber = Math.floor(
                            Math.random() * passwordArray.length,
                        );
                        const creator = passwordArray[randomNumber];
                        creators[parsedMessage.password] = creator;
                        // console.log(passwordArray, randomNumber, creator)
                        const word = generate({ minLength: 3, maxLength: 8 });
                        randomWords[parsedMessage.password] = word;
                        Object.entries(
                            classRoomPasswords[parsedMessage.password],
                        ).forEach(([id, client]) => {
                            if (id === creator) {
                                client.send(
                                    JSON.stringify({
                                        type: roomMessageType.chooseCreator,
                                        word,
                                    }),
                                );
                            } else {
                                client.send(
                                    JSON.stringify({
                                        type: roomMessageType.choosePlayer,
                                    }),
                                );
                            }
                        });
                    }
                };

                break;

            case roomMessageType.Drawing:
                if (
                    classRoomPasswords.hasOwnProperty(parsedMessage.password) &&
                    parsedMessage.isDrawing === 1
                ) {
                    Object.entries(
                        classRoomPasswords[parsedMessage.password],
                    ).forEach(([id, client]) => {
                        if (
                            client !== socket &&
                            client.readyState === socket.OPEN
                        ) {
                            client.send(
                                JSON.stringify({
                                    type: parsedMessage.type,
                                    isDrawing: parsedMessage.isDrawing,
                                    color: parsedMessage.color,
                                    message: parsedMessage.message,
                                    lastPosition: parsedMessage.lastPosition,
                                    currentPosition:
                                        parsedMessage.currentPosition,
                                }),
                            );
                        }
                    });
                } else if (
                    classRoomPasswords.hasOwnProperty(parsedMessage.password) &&
                    parsedMessage.isDrawing === 2
                ) {
                    Object.entries(
                        classRoomPasswords[parsedMessage.password],
                    ).forEach(([id, client]) => {
                        if (
                            client !== socket &&
                            client.readyState === socket.OPEN
                        ) {
                            client.send(
                                JSON.stringify({
                                    type: parsedMessage.type,
                                    isDrawing: parsedMessage.isDrawing,
                                    x: parsedMessage.x,
                                    y: parsedMessage.y,
                                }),
                            );
                        }
                    });
                }

                break;

            case roomMessageType.ClearDrawing:
                if (classRoomPasswords.hasOwnProperty(parsedMessage.password)) {
                    Object.entries(
                        classRoomPasswords[parsedMessage.password],
                    ).forEach(([id, client]) => {
                        if (
                            client !== socket &&
                            client.readyState === socket.OPEN
                        ) {
                            client.send(
                                JSON.stringify({
                                    type: roomMessageType.ClearDrawing,
                                }),
                            );
                        }
                    });
                }

                break;
        }
    });
});

server.on("upgrade", (request, sock, head) => {
    const url = new URL(request.url, "ws://localhost:4000");
    if (url.pathname === "/ws") {
        web.handleUpgrade(request, sock, head, (socket) => {
            web.emit("connection", socket, request);
        });
    } else if (url.pathname === "/wsroom") {
        webroom.handleUpgrade(request, sock, head, (socket) => {
            webroom.emit("connection", socket, request);
        });
    } else {
        sock.destroy();
    }
});

// create server
server.listen(port, () => {
    console.log(`Server is running on ${port}`);
});

export { db, env, web };
