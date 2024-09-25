import React, { useContext } from "react";
import { AuthContext } from "./AuthContext";

function Chat() {

    const { updateSelectedUser, selectedUser, friends, sendMessage, updateMessage, message } = useContext(AuthContext);
    return <div className="chat">
        <div className="friendblock">
            <div className="friends">{friends.map((f)=>{return <button onClick={()=>(updateSelectedUser(f))}>{f.name}</button>})}</div>
            <div className="frequest">
                <form action="">
                    <input type="text" />
                    <button>Add</button>
                </form>
            </div>
        </div>
        <div className="chatblock">
            <div className="messages">{selectedUser && `Connecting to ${selectedUser.name}`}
                <div className="chats"></div>

            </div>
            <div className="sendmessage">
                <form action="">
                    <input type="text" name="message" onChange={(event) => { updateMessage(event.target.value) }} />
                    <button onClick={(event) => { event.preventDefault(); sendMessage(message); }}>send
                    </button>
                </form>
            </div>
        </div>
    </div>
}



export default Chat;
// 