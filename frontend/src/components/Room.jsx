import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import { Canvas } from "./Canvas";

function Room(props) {


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
        choosePlayer: 11
    };

    const ws = useRef(null);
    const { classRoomPassword, setClassRoomPassword, role, setRole } = useContext(AuthContext);
    // const user =localStorage.getItem("user")
    const [pixeData, setPixelData] = useState({});
    // const [currentPosition, setCurrentPosition] = useState({x:0, y:0});
    const [start, setStart] = useState(0);

    const [message, setMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const url = `ws://localhost:4000/wsroom`;
    const [clock, setClock] = useState(30);
    const myInterval = useRef(null);

    useEffect(() => {
        //     const windowUrl =window.location.href;
        const user = JSON.parse(localStorage.getItem("user"))
        // console.log(user.id)
        // console.log(window.location.href.split("?")[1])
        if (ws.current) return
        const web = new WebSocket(`${url}?id=${user.id}&password=${classRoomPassword}`);
        ws.current = web

        ws.current.onmessage = (message) => {
            const parsedMessage = (JSON.parse(message.data))
            // console.log(JSON.parse(message.data))
            if (parsedMessage.type === roomMessageType.ReceivedMessage) {
                setMessageList((old) => [...old, { message: parsedMessage.message, from: parsedMessage.from, password: classRoomPassword }])

            }
            else if (parsedMessage.type === "Drawing") {
                setPixelData(parsedMessage)

            }
            else if (parsedMessage.type === roomMessageType.roomNotFound) {
                const user = JSON.parse(localStorage.getItem("user"))
                setClassRoomPassword(null)
                ws.current.send(JSON.stringify({ type: roomMessageType.roomNotFound, message, id: user.id, fromName: user.name, password: classRoomPassword }));
                ws.current.close()
            }
            else if (parsedMessage.type === roomMessageType.gameStart) {
                setStart(1)
            }
            else if (parsedMessage.type === roomMessageType.clockTime) {
                setClock(parsedMessage.clockTime)
            }
            else if (parsedMessage.type === roomMessageType.chooseCreator) {
                setStart(0);
                setClock(30);
                setRole("creator")
            }
            else if (parsedMessage.type === roomMessageType.choosePlayer) {
                setStart(0);
                setClock(30);

                setRole("player")
            }
        }

        ws.current.onopen = () => {
            ws.current.send(JSON.stringify({ type: roomMessageType.password, password: classRoomPassword, id: user.id, role }))
        }

        ws.current.onclose = () => {
            console.log("working")
            ws.current.send(JSON.stringify({ type: roomMessageType.UserDisconnected, id: user.id, password: classRoomPassword }))
        }


    })

    const sendMessage = () => {
        const user = JSON.parse(localStorage.getItem("user"))
        ws.current.send(JSON.stringify({ type: roomMessageType.ReceivedMessage, message, id: user.id, fromName: user.name, password: classRoomPassword }));
        setMessageList((old) => [...old, { message, from: "me" }])
        setMessage("")
    }

    const sendCanvasPositions = (position) => {
        const user = JSON.parse(localStorage.getItem("user"));
        ws.current.send(JSON.stringify(position))
    }

    const closing = () => {
        const user = JSON.parse(localStorage.getItem("user"))
        setClassRoomPassword(null)
        ws.current.send(JSON.stringify({ type: roomMessageType.UserDisconnected, message, id: user.id, fromName: user.name, password: classRoomPassword }));
        ws.current.close()
    }

    const gameStart = () => {
        setStart(1);
        // setClock(5);


        ws.current.send(JSON.stringify({ type: roomMessageType.gameStart, message: "start", password: classRoomPassword }))

    }


    return <div className="classRoom">
        <div className="room-container">
            <div className="room-board-container">
                <div>
                    <div className="password-clock">
                        <p>Room Password : {classRoomPassword}</p><p> Clock : {clock}</p>
                    </div>
                    {start === 0 && <div className="start-game">
                        {role === "player" ? <p>Wait game starts when host is ready ...</p> : <button onClick={() => { gameStart() }}>Start</button>}
                    </div>}
                    <div className={role === "player" ? "board-block" : ""}>
                        <Canvas sendCanvas={sendCanvasPositions} pixel={pixeData} />
                    </div>
                </div>
            </div>
            <div className="room-chatBox-container">
                <button onClick={() => { closing() }}>Leave the room</button>

                <div className="top">
                    <div className="message">
                        {messageList.map((m, i) => {
                            return <div className={m.from === "me" && "right-message"} key={i}><div className="from">{m.from}</div><p> {m.message}</p></div>
                        })}
                    </div>
                </div>
                <div className="down">
                    <div className="down-input-button">
                        <input type="text" onChange={(e) => { setMessage(e.target.value) }} placeholder="Type your message" value={message} />
                        <button onClick={() => { sendMessage() }}>Send</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

}

export default Room;