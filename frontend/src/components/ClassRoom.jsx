import React, { useContext } from "react";
import { useState } from "react";
import { useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";

function ClassRoom() {

    const [password, setPassword] = useState(null);
    const { setClassRoomPassword, setRole, classRoomMessage} = useContext(AuthContext);
    const navigate = useNavigate();

    const goTo = useCallback((password) => {
        setClassRoomPassword(password)
        navigate(`/room?password=${password}`)
    }, [navigate, setClassRoomPassword])


    const passwordGenerate = useCallback(() => {

        var randomPassword = Math.random().toString(32).slice(2);
        setRole("creator")
        goTo(randomPassword)
    }, [goTo, setRole])

    return <div className="classRoom">
        <div className="classRoom-container">
            <p className="classRoom-title">Create a Room</p>
            <div><input type="text" placeholder="Enter room password" onChange={(e) => { setPassword(e.target.value) }} /></div>
            <div className="classRoom-button">
                <button onClick={() => { setRole("player"); goTo(password) }}>Join</button>
                <button onClick={() => { passwordGenerate(); }}>Create</button>
            </div>
            {classRoomMessage && <div className="room-not-found"><p>Room is not found</p></div>}
        </div>
    </div>
}

export default ClassRoom;