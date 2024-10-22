import React from "react";

function Message(props) {
    return <div className="chat-box">
        <div className="chat-message">
            <div className="chat-m">
                {props.text}
            </div>
        </div>
        <div>{props.time}</div>
    </div>
}

export default Message;