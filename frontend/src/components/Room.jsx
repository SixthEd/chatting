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
        choosePlayer: 11,
        randomWord: 12,
        winner: 13,
        Drawing: 14,
        ClearDrawing: 15
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
    const [randomWord, setRandomWord] = useState(null);
    const [winner, setWinner] = useState(null)
    const [winnerMessage, setWinnerMessage] = useState(null);
    const clearFuncRef = useRef(null);


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
            const user = JSON.parse(localStorage.getItem("user"))

            switch (parsedMessage.type) {
                case roomMessageType.ReceivedMessage:

                    setMessageList((old) => [...old, { message: parsedMessage.message, from: parsedMessage.from, password: classRoomPassword }])

                    break;

                case roomMessageType.Drawing:

                    setPixelData(parsedMessage)

                    break;

                case roomMessageType.roomNotFound:

                    // const user = JSON.parse(localStorage.getItem("user"))
                    setClassRoomPassword(null)
                    ws.current.send(JSON.stringify({ type: roomMessageType.roomNotFound, message, id: user.id, fromName: user.name, password: classRoomPassword }));
                    ws.current.close()

                    break;

                case roomMessageType.gameStart:

                    setStart(0)

                    break;

                case roomMessageType.clockTime:

                    setClock(parsedMessage.clockTime)
                    setStart(1)
                    if (parsedMessage.clockTime === 0) {
                        setStart(0)
                    }

                    break;

                case roomMessageType.chooseCreator:

                    setStart(0);
                    setClock(30);
                    setRole("creator")
                    setRandomWord(parsedMessage.word);
                    setWinner(0);
                    setWinnerMessage(null);
                    clearBoard()
                    break;

                case roomMessageType.choosePlayer:

                    setStart(0);
                    setClock(30);
                    setRole("player")
                    setRandomWord(null);
                    setWinner(0);
                    setWinnerMessage(null);
                    clearBoard()
                    break;

                case roomMessageType.UserConnected:

                    setMessageList((old) => [...old, { message: `${parsedMessage.name} joined the room`, from: "centre", password: classRoomPassword }])

                    break;

                case roomMessageType.UserDisconnected:

                    setMessageList((old) => [...old, { message: `${parsedMessage.name} left the room`, from: "centre", password: classRoomPassword }])

                    break;

                case roomMessageType.randomWord:

                    setRandomWord(parsedMessage.word)

                    break;

                case roomMessageType.winner:

                    // const user = JSON.parse(localStorage.getItem("user"))
                    if (user.id === parsedMessage.id) {
                        setWinnerMessage("You won the game")
                    }
                    else {
                        setWinnerMessage(`${parsedMessage.name} won the game`)
                    }
                    setWinner(1)

                    break;

                case roomMessageType.ClearDrawing:

                    clearBoard()

                    break;

            }
            // if (parsedMessage.type === roomMessageType.ReceivedMessage) {
            // setMessageList((old) => [...old, { message: parsedMessage.message, from: parsedMessage.from, password: classRoomPassword }])

            // }
            // else if (parsedMessage.type === "Drawing") {
            // setPixelData(parsedMessage)

            // }
            // else if (parsedMessage.type === roomMessageType.roomNotFound) {
            // const user = JSON.parse(localStorage.getItem("user"))
            // setClassRoomPassword(null)
            // ws.current.send(JSON.stringify({ type: roomMessageType.roomNotFound, message, id: user.id, fromName: user.name, password: classRoomPassword }));
            // ws.current.close()
            // }
            // else if (parsedMessage.type === roomMessageType.gameStart) {
            // setStart(1)
            // }
            // else if (parsedMessage.type === roomMessageType.clockTime) {
            // setClock(parsedMessage.clockTime)
            // }
            // else if (parsedMessage.type === roomMessageType.chooseCreator) {
            // setStart(0);
            // setClock(30);
            // setRole("creator")
            // setRandomWord(parsedMessage.word);
            // setWinner(0);
            // setWinnerMessage(null)
            // }
            // else if (parsedMessage.type === roomMessageType.choosePlayer) {
            // setStart(0);
            // setClock(30);
            // setRole("player")
            // setRandomWord(null);
            // setWinner(0);
            // setWinnerMessage(null);
            // }
            // else if (parsedMessage.type === roomMessageType.UserConnected) {

            // setMessageList((old) => [...old, { message: `${parsedMessage.name} joined the room`, from: "centre", password: classRoomPassword }])
            // }
            // else if (parsedMessage.type === roomMessageType.UserDisconnected) {
            // setMessageList((old) => [...old, { message: `${parsedMessage.name} left the room`, from: "centre", password: classRoomPassword }])
            // }
            // else if (parsedMessage.type === roomMessageType.randomWord) {
            // setRandomWord(parsedMessage.word)
            // }
            // else if (parsedMessage.type === roomMessageType.winner) {
            // const user = JSON.parse(localStorage.getItem("user"))
            // if (user.id === parsedMessage.id) {
            //     setWinnerMessage("You won the game")
            // }
            // else {
            //     setWinnerMessage(`${parsedMessage.name} won the game`)
            // }
            // setWinner(1)

            // }
        }

        ws.current.onopen = () => {
            ws.current.send(JSON.stringify({ type: roomMessageType.password, password: classRoomPassword, id: user.id, role, name: user.name }))
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

    const clearBoard = () => {
        if (clearFuncRef.current) {
            console.log("clearRef is working")
            clearFuncRef.current()
        }
    }

    const sendClearDrawing = () => {
        ws.current.send(JSON.stringify({type: roomMessageType.ClearDrawing, password: classRoomPassword}));
    }


    return <div className="classRoom">
        <div className="room-container">
            <div className="room-board-container">
                <div>
                    <div className="password-clock">
                        <p>Room Password : {classRoomPassword}</p>{randomWord && <div className="randomWord">{randomWord.split("").map((w, i) => <p key={i}>{w}</p>)}</div>}<p> Clock : {clock}</p>
                    </div>
                    {start === 0 && <div className="start-game">
                        {role === "player" ? <p>Wait game starts when host is ready ...</p> : <button onClick={() => { gameStart() }}>Start</button>}
                    </div>}
                    {winner === 1 && <div className="start-game"><p>{winnerMessage}  <br></br>Choosing new host...</p></div>}
                    <div className={role === "player" ? "board-block" : ""}>
                        <Canvas sendCanvas={sendCanvasPositions} pixel={pixeData} sendClearDraw={sendClearDrawing} setExposeFunction={(fn) => (clearFuncRef.current = fn)} />
                    </div>
                </div>
            </div>
            <div className="room-chatBox-container">
                <button onClick={() => { closing() }}>Leave the room</button>

                <div className="top">
                    <div className="message">
                        {messageList.map((m, i) => {
                            return <div className={m.from === "me" ? "right-message" : m.from === "centre" && "centre-message"} key={i}>{m.from !== "me" && m.from !== "centre" && <div className="from">{m.from}</div>}<p className={m.from === "centre" ? "join-text" : "message-text"}> {m.message}</p></div>
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