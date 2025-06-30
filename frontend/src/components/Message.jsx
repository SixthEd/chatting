
import React from "react";
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
function Message(props) {
    let h = null;
    if ((props.img && props.text) || (props.vid && props.text)) {
        h = "28vh";
    }
    else if (props.img || props.vid) {
        h = "25vh";
    }
    else if ((props.aud && props.text) || (props.doc && props.text)) {
        h = "8vh";
    }
    else if (props.aud || props.doc) {
        h = "6vh";
    }
    else {
        h = "10vh"
    }
    return <div className="chat-box" >
        <div className="chat-message" >
            {props.img && <div>
                <img src={props.img} alt=""></img>
            </div>}
            {props.vid && <div>
                <video src={props.vid} controls width="400" height="400" autoplay loop muted preload="auto"></video>
            </div>}
            {props.aud && <div>
                <audio src={props.aud} controls ></audio>
            </div>}
            {props.doc && <div className="docChatBox">
                {props.docName}
                <a href={props.doc} download={props.docName}>
                    <DownloadRoundedIcon />
                </a>
            </div>}
            {props.text && <div className="chat-m">
                {props.text}
            </div>}
            

        </div>
        <div className="time-text">{props.time}</div>
    </div>
}

export default Message;