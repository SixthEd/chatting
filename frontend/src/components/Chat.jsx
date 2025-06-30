import React, {
    useCallback,
    useContext,
    useState,
    useRef,
    useEffect,
} from "react";
import { AuthContext } from "./AuthContext";
import Message from "./Message";
import axioInst from "../utils";
import SendSharpIcon from "@mui/icons-material/SendSharp";
import AddReactionIcon from "@mui/icons-material/AddReaction";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import File from "./File";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddAPhotoRoundedIcon from '@mui/icons-material/AddAPhotoRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import Video from "./Video";
import Audio from "./Audio";
import Document from "./Document";
import Call from "./Call";

const MessageType = {
    UserConnected: 1,
    UserDisconnected: 2,
    ConnectedUserList: 3,
    Status: 4,
    ReceivedMessage: 5,
};

function Chat() {
    const { friends, user, setFriends } = useContext(AuthContext);
    const [message, setMessage] = useState("");
    const [showMessage, setShowMessage] = useState({});
    const [selectedUser, setSelectedUser] = useState("");
    const [showFileBlock, setShowFileBlock] = useState(0);
    const [showVideoBlock, setShowVideoBlock] = useState(0);
    const [showAudioBlock, setShowAudioBlock] = useState(0);
    const [showDocumentBlock, setShowDocumentBlock] = useState(0);
    const [block, setBlock] = useState(0);
    const [showMenu, setShowMenu] = useState(0);
    const [call, setCall] = useState(0);
    const url = "ws://localhost:4000/ws";
    // const ws = new WebSocket("ws://localhost:4000/ws");
    const ws = useRef("");

    const sendMessage = useCallback(
        (message) => {
            if (!ws.current) {
                return;
            }
            if (!selectedUser) {
                return;
            }

            let image = "";

            let video = "";

            let audio = "";

            let doc = "";
            let docName = "";

            if (message.type) {
                if (message.type === "imgCaption") {
                    image = message.image;
                    console.log(message.caption);
                    if (message.caption) {
                        message = message.caption;
                    } else {
                        message = "";
                    }
                } else if (message.type === "vCaption") {
                    video = message.video;
                    console.log(message.caption);
                    if (message.caption) {
                        message = message.caption;
                    } else {
                        message = "";
                    }
                } else if (message.type === "audioCaption") {
                    audio = message.audio;
                    console.log(message.caption);
                    if (message.caption) {
                        message = message.caption;
                    } else {
                        message = "";
                    }
                } else if(message.type === "documentCaption")
                {
                    doc = message.document;
                    docName = message.name;
                    console.log(message.caption);
                    if(message.caption)
                    {
                        message= message.caption;
                    }
                    else
                    {
                        message="";
                    }

                }
            }
            console.log(docName);
            if (!message && !video && !image && !audio && !doc) {
                return;
            }

            const dateTime = new Date();
            const hours = String(dateTime.getHours()).padStart(2, "0");
            const minutes = String(dateTime.getMinutes()).padStart(2, "0");
            const date = dateTime.toISOString().split("T")[0];
            console.log(date);
            const send_at = `${hours}:${minutes}`;
            sendChatBox({ message, send_at, date, image, video, audio, doc , docName});
            const value = message;
            ws.current.send(
                JSON.stringify({
                    to: selectedUser.id,
                    from: user.id,
                    message,
                    send_at,
                    date,
                }),
            );
            axioInst
                .put("/updatechat", {
                    user,
                    friend: selectedUser,
                    message: value,
                })
                .then((res) => {
                    return;
                })
                .catch((err) => {
                    return;
                });
            setMessage("")
        },
        [selectedUser, user],
    );

    useEffect(() => {
        if (ws.current) return;

        const web = new WebSocket(`${url}?id=${user.id}`);
        ws.current = web;
        console.log(ws);

        ws.current.onmessage = (event) => {
            const response = JSON.parse(event.data);

            console.log(response);

            switch (response.type) {
                case MessageType.UserConnected: {
                    setFriends((old) => {
                        return old.map((f) =>
                            f.id == response.id
                                ? { ...f, status: "online" }
                                : f,
                        );
                    });
                    break;
                }

                case MessageType.UserDisconnected: {
                    setFriends((old) => {
                        return old.map((f) =>
                            f.id == response.id
                                ? { ...f, status: "offline" }
                                : f,
                        );
                    });
                    break;
                }

                case MessageType.ConnectedUserList: {
                    setFriends((old) => {
                        return old.map((oldFriend) =>
                            response.connectedUsers.find(
                                (connUser) => connUser == oldFriend.id,
                            )
                                ? { ...oldFriend, status: "online" }
                                : oldFriend,
                        );
                    });
                    break;
                }

                case MessageType.ReceivedMessage: {
                    const value = {
                        from: response.from,
                        to: response.to,
                        message: response.message,
                        send_at: response.send_at,
                        date: response.date,
                    };

                    setShowMessage((prevValue) => {
                        if (prevValue[response.from]) {
                            return {
                                ...prevValue,
                                [response.from]: [
                                    ...prevValue[response.from],
                                    value,
                                ],
                            };
                        }

                        return {
                            ...prevValue,
                            [response.from]: [value],
                        };
                    });

                    axioInst.put("/updatechat", {
                        user,
                        friend: response.sender,
                        message: value,
                    });

                    // receivedChatBox(response.senderMessage);
                    break;
                }

                default:
                    break;
            }
        };
    }, []);

    const updateSelectedUser = useCallback(
        (info) => {
            setShowFileBlock(0);
            setShowAudioBlock(0);
            setShowVideoBlock(0);
            setShowDocumentBlock(0);
            setCall(0);
            setSelectedUser(info);
            console.log({ user, info });
            if (showMessage[info.id]) {
                return;
            }
            axioInst
                .post("/chat", { user, info })
                .then((res) => {
                    console.log(res.data, info);
                    setShowMessage((old) => {
                        if (old[info.id]) {
                            return {
                                ...old,
                                [info.id]: [...old[info.id], ...res.data],
                            };
                        }

                        return {
                            ...old,
                            [info.id]: res.data,
                        };
                    });
                })
                .catch((err) => { });
        },
        [friends, user, showMessage],
    );

    const updateMessage = useCallback(
        (info) => {
            if (selectedUser === null) {
                console.log("selectedUser is null");
                return;
            }

            setMessage(info);
        },
        [selectedUser],
    );

    const sendChatBox = useCallback(
        (value) => {
            value = {
                from: user.id,
                to: selectedUser.id,
                message: value.message,
                send_at: value.send_at,
                date: value.date,
                image: value.image,
                video: value.video,
                audio: value.audio,
                doc: value.doc,
                docName: value.docName,
            };
            setShowMessage((prevValue) => {
                console.log("user", user);
                if (prevValue[selectedUser.id]) {
                    return {
                        ...prevValue,
                        [selectedUser.id]: [
                            ...prevValue[selectedUser.id],
                            value,
                        ],
                    };
                }

                return {
                    ...prevValue,
                    [selectedUser.id]: [value],
                };
            });
        },
        [selectedUser, user],
    );

    const updateShowFileBlock = useCallback((info) => {
        setBlock(0);
        setShowFileBlock(0);
    }, []);

    const updateShowVideoBlock = useCallback((info) => {
        setBlock(0);
        setShowVideoBlock(0);
    }, []);

    const updateShowAudioBlock = useCallback(() => {
        setBlock(0);
        setShowAudioBlock(0);
    }, []);

    const updateShowDocumentBlock = useCallback(()=> {
        setBlock(0);
        setShowDocumentBlock(0);
    })

    useEffect(() => {
        console.log(block);
    }, [block]);

    return (
        <div className="chat">
            <div className="friendblock">
                <div className="friends">
                    {friends.map((f,i) => {
                        return (
                            user.id !== f.id && (
                                <div key={i}>
                                    <button
                                        onClick={() => updateSelectedUser(f)}
                                    >
                                        <div className="friend-img">
                                            <img src="profile.webp" alt="" />
                                            <div
                                                className={
                                                    f.status === "online"
                                                        ? "online"
                                                        : "offline"
                                                }
                                            ></div>
                                        </div>
                                        <div className="friendname">
                                            <div className="friend-name">
                                                <div>
                                                    {f.name[0].toUpperCase() +
                                                        f.name.slice(1)}
                                                </div>
                                                <div className="friend-lmd">
                                                    {showMessage[f.id] &&
                                                        showMessage[f.id][
                                                            showMessage[f.id]
                                                                .length - 1
                                                        ].send_at}
                                                </div>
                                            </div>
                                            <div className="friend-lm">
                                                {showMessage[f.id] &&
                                                    (showMessage[f.id][
                                                        showMessage[f.id]
                                                            .length - 1
                                                    ].from == user.id
                                                        ? "You: "
                                                        : " ") +
                                                    (showMessage[f.id] &&
                                                        showMessage[f.id][
                                                            showMessage[
                                                                f.id
                                                            ].length - 1
                                                        ].message)}
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )
                        );
                    })}
                </div>
                <div className="frequest">
                    <form action="">
                        <input type="text" />
                        <button>
                            <PersonAddIcon />
                        </button>
                    </form>
                </div>
            </div>
            {selectedUser && (
                <div className="chatblock">
                    <div
                        className="messages"
                        style={{
                            height:
                                showFileBlock ||
                                    showVideoBlock ||
                                    showAudioBlock
                                    ? "95vh"
                                    : "89vh",
                        }}
                    >
                        {selectedUser && (
                            <div className="connecting-user">
                                <div className="connecting-uimg">
                                    <img src="profile.webp" alt="" />
                                </div>
                                <div className="connecting-uleft">
                                    <div>{selectedUser && `${selectedUser.name}`}</div>
                                    <div onClick={()=>setCall(1)}><CallRoundedIcon /></div>
                                </div>
                            </div>
                        )}
                        {showFileBlock === 1 ? (
                            <File
                                updateFile={updateShowFileBlock}
                                sendMess={sendMessage}
                            />
                        ) : showAudioBlock === 1 ? (
                            <Audio
                                updateAudio={updateShowAudioBlock}
                                sendMess={sendMessage}
                            />
                        ) : showVideoBlock === 1 ? (
                            <Video
                                updateVideo={updateShowVideoBlock}
                                sendMess={sendMessage}
                            />
                        ) : showDocumentBlock===1? 
                            <Document 
                                updateDocument={updateShowDocumentBlock}
                                sendMess={sendMessage}    
                            />:(call ===1)?<Call />: (
                            <div className="chats">
                                {selectedUser &&
                                    showMessage[selectedUser.id] &&
                                    showMessage[selectedUser.id].map(
                                        (f, index) => {
                                            return (
                                                <div className="message-date" key={index}>
                                                    <div className="date">
                                                        {index - 1 > 0 &&
                                                            showMessage[
                                                                selectedUser.id
                                                            ][index - 1].date <
                                                            f.date &&
                                                            f.date}
                                                    </div>

                                                    <div
                                                        className={
                                                            f.from === user.id
                                                                ? "send"
                                                                : "received"
                                                        }
                                                    >
                                                        <Message
                                                            text={f.message}
                                                            time={f.send_at}
                                                            img={f.image}
                                                            vid={f.video}
                                                            aud={f.audio}
                                                            doc={f.doc}
                                                            docName={f.docName}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}
                            </div>
                        )}
                    </div>
                    {showFileBlock === 0 &&
                        showAudioBlock === 0 &&
                        showVideoBlock === 0 && (
                            <div className="sendmessage">
                                <div className="emj-file">
                                    <button>
                                        <EmojiEmotionsIcon />
                                    </button>
                                    {showMenu === 1 ? <button onClick={() => { setShowMenu(0) }}><CloseRoundedIcon /></button> : <button onClick={() => { setShowMenu(1) }}><AddRoundedIcon/></button>}
                                    {showMenu === 1 &&
                                        <div class="drop-down">
                                            <div class="drop-block">

                                                <button
                                                    onClick={() => {
                                                        setShowVideoBlock(1);
                                                    }}
                                                >
                                                    <div><VideoFileIcon /></div>
                                                    <div>Video</div>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowAudioBlock(1);
                                                    }}
                                                >
                                                    <div><AudiotrackIcon /></div>
                                                    <div>Audio</div>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowFileBlock(1);
                                                    }}
                                                >
                                                    <div><AddAPhotoRoundedIcon /></div>
                                                    <div>Photo</div>
                                                </button>
                                                <button onClick={()=>{setShowDocumentBlock(1)}}>
                                                    <div><AttachFileRoundedIcon/></div>
                                                    <div>Document</div>
                                                </button>
                                            </div>
                                        </div>
                                    }
                                </div>
                                <form action="">
                                    <input
                                        type="text"
                                        placeholder="Type a message"
                                        name="message"
                                        value={message}
                                        onChange={(event) => {
                                            updateMessage(event.target.value);
                                        }}
                                    />
                                    <button
                                        onClick={(event) => {
                                            event.preventDefault();
                                            sendMessage(message);
                                        }}
                                    >
                                        <SendSharpIcon />
                                    </button>
                                </form>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}

export default Chat;
//
