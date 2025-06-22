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
        password: 6
    };

    const ws = useRef(null);
    const { classRoomPassword , setClassRoomPassword} = useContext(AuthContext);
    // const user =localStorage.getItem("user")
    const [pixeData, setPixelData] = useState({});
    // const [currentPosition, setCurrentPosition] = useState({x:0, y:0});

    const [message, setMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const url = `ws://localhost:4000/wsroom`;



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
            else if(parsedMessage.type === "Drawing")
            {
                setPixelData(parsedMessage)
                
            }
        }

        ws.current.onopen =()=>{
            ws.current.send(JSON.stringify({type: roomMessageType.password, password: classRoomPassword ,id : user.id}))
        }

        ws.current.onclose = ()=>{
            console.log("working")
            ws.current.send(JSON.stringify({type: roomMessageType.UserDisconnected , id: user.id, password: classRoomPassword}))
        }


    })

    const sendMessage = () => {
        const user = JSON.parse(localStorage.getItem("user"))
        ws.current.send(JSON.stringify({ type: roomMessageType.ReceivedMessage, message, id: user.id, fromName: user.name, password: classRoomPassword }));
        setMessageList((old) => [...old, { message, from: "me" }])
        setMessage("")
    }

    const sendCanvasPositions =(position)=>{
        const user = JSON.parse(localStorage.getItem("user"));
        ws.current.send(JSON.stringify(position))
    }

    const closing =()=>{
        const user = JSON.parse(localStorage.getItem("user"))
        setClassRoomPassword(null)
        ws.current.send(JSON.stringify({ type: roomMessageType.UserDisconnected, message, id: user.id, fromName: user.name, password: classRoomPassword }));
        ws.current.close()
    }

    return <div className="classRoom">
        <div className="room-container">
            <div className="room-board-container">Room Password : {classRoomPassword}
                <div>
                    <Canvas sendCanvas={sendCanvasPositions} pixel={pixeData}/>
                </div>
            </div>
            <div className="room-chatBox-container">
                    <button onClick={()=>{closing()}}>Leave the room</button>

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