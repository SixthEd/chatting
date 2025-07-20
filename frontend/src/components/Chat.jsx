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
// import AddReactionIcon from "@mui/icons-material/AddReaction";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
// import AddCircleIcon from "@mui/icons-material/AddCircle";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import File from "./File";
import VideoFileIcon from "@mui/icons-material/VideoFile";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AddAPhotoRoundedIcon from "@mui/icons-material/AddAPhotoRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
// import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import Video from "./Video";
import Audio from "./Audio";
import Document from "./Document";
import Call from "./Call";
import MyWebsocket from "../websocket";
import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { emojis } from "../emojis.js";
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';



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
    ConfirmRequest: 18,
    ReceivedRequest: 19

};

let images = [];
let videos = [];
let audios = [];
let docs = [];

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
    const [offer, setOffer] = useState(null);
    const peerConnectionRef = useRef(null);
    const [receiveCall, setReceiveCall] = useState(0);
    const [callStatus, setCallStatus] = useState(0);
    const [caller, setCaller] = useState(null);
    const [callingMessage, setCallingMessage] = useState(null);
    const [allUsers, setAllUsers] = useState(null);
    const [showAllUsers, setShowAllUsers] = useState(0);
    const [showConfirmRequest, setShowConfirmRequest] = useState(0);
    const [confirmRequest, setConfirmRequest] = useState(0);
    const processedUsers = useRef(new Set());


    const url = "ws://localhost:4000/ws";
    // const ws = new WebSocket("ws://localhost:4000/ws");

    const myWebsocket = useRef("");

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

    const sendMessage = useCallback(
        (message) => {
            if (!myWebsocket.current) {
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

            const messageType = message.type;

            switch (messageType) {
                case "imgCaption":
                    image = message.image;
                    console.log(message.caption);
                    if (message.caption) {
                        message = message.caption;
                    } else {
                        message = "";
                    }
                    break;
                case "vCaption":
                    video = message.video;
                    console.log(message.caption);
                    if (message.caption) {
                        message = message.caption;
                    } else {
                        message = "";
                    }
                    break;
                case "audioCaption":
                    audio = message.audio;
                    console.log(message.caption);
                    if (message.caption) {
                        message = message.caption;
                    } else {
                        message = "";
                    }
                    break;
                case "documentCaption":
                    doc = message.document;
                    docName = message.name;
                    console.log(message.caption);
                    if (message.caption) {
                        message = message.caption;
                    } else {
                        message = "";
                    }
                    break;
                default:
                    break;
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
            sendChatBox({
                message,
                send_at,
                date,
                image,
                video,
                audio,
                doc,
                docName,
            });

            let value;
            console.log(messageType);
            switch (messageType) {
                case "imgCaption":
                    value = {
                        to: selectedUser.id,
                        from: user.id,
                        message,
                        send_at,
                        date,
                        image
                    }
                    myWebsocket.current.send(
                        JSON.stringify({
                            to: selectedUser.id,
                            from: user.id,
                            message,
                            send_at,
                            date,
                            image,
                            type: MessageType.ReceivedImage,
                        }),
                    );
                    break;
                case "vCaption":
                    value = {
                        to: selectedUser.id,
                        from: user.id,
                        message,
                        send_at,
                        date,
                        video
                    }
                    myWebsocket.current.send(
                        JSON.stringify({
                            to: selectedUser.id,
                            from: user.id,
                            message,
                            send_at,
                            date,
                            video,
                            type: MessageType.ReceivedVideo,
                        }),
                    );
                    break;
                case "audioCaption":
                    value = {
                        to: selectedUser.id,
                        from: user.id,
                        message,
                        send_at,
                        date,
                        audio
                    }
                    myWebsocket.current.send(
                        JSON.stringify({
                            to: selectedUser.id,
                            from: user.id,
                            message,
                            send_at,
                            date,
                            audio,
                            type: MessageType.ReceivedAudio,
                        }),
                    );
                    break;
                case "documentCaption":
                    value = {
                        to: selectedUser.id,
                        from: user.id,
                        message,
                        send_at,
                        date,
                        doc,
                        docName
                    }
                    myWebsocket.current.send(
                        JSON.stringify({
                            to: selectedUser.id,
                            from: user.id,
                            message,
                            send_at,
                            date,
                            doc,
                            docName,
                            type: MessageType.ReceivedDoc,
                        }),
                    );
                    break;
                default:
                    value = {
                        to: selectedUser.id,
                        from: user.id,
                        message,
                        send_at,
                        date
                    }
                    myWebsocket.current.send(
                        JSON.stringify({
                            to: selectedUser.id,
                            from: user.id,
                            message,
                            send_at,
                            date,
                            type: MessageType.ReceivedMessage,
                        }),
                    );
            }

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
            setMessage("");
        },
        [selectedUser, sendChatBox, user],
    );

    const onMessageHandler = useCallback(
        async (event) => {
            const response = JSON.parse(event.data);

            console.log(response);

            switch (response.type) {
                case MessageType.UserConnected: {
                    setFriends((old) => {
                        return old.map((f) =>
                            f.id === Number(response.id)
                                ? { ...f, status: "online" }
                                : f,
                        );
                    });
                    break;
                }

                case MessageType.UserDisconnected: {
                    setFriends((old) => {
                        return old.map((f) =>
                            f.id === Number(response.id)
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
                                (connUser) => parseInt(connUser) === parseInt(oldFriend.id),
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

                    // axioInst.put("/updatechat", {
                    //     user,
                    //     friend: response.sender,
                    //     message: value,
                    // });

                    // receivedChatBox(response.senderMessage);
                    break;
                }

                case MessageType.ReceivedImageChunk:
                    images[response.partNumber] = response.chunk;
                    if (response.partNumber === response.totalChunks - 1) {
                        const fullImage = images.join("");
                        console.log("fullImage");
                        const value = {
                            from: response.from,
                            to: response.to,
                            message: response.message,
                            send_at: response.send_at,
                            date: response.date,
                            image: fullImage,
                        };
                        images = [];
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

                        // axioInst.put("/updatechat", {
                        //     user,
                        //     friend: response.sender,
                        //     message: value,
                        // });

                        // receivedChatBox(response.senderMessage);
                    }
                    break;
                case MessageType.ReceivedVideoChunk:
                    videos[response.partNumber] = response.chunk;
                    if (response.partNumber === response.totalChunks - 1) {
                        const videoImage = videos.join("");
                        console.log("fullImage");
                        const value = {
                            from: response.from,
                            to: response.to,
                            message: response.message,
                            send_at: response.send_at,
                            date: response.date,
                            video: videoImage,
                        };
                        videos = [];
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

                        // axioInst.put("/updatechat", {
                        //     user,
                        //     friend: response.sender,
                        //     message: value,
                        // });

                        // receivedChatBox(response.senderMessage);
                    }
                    break;
                case MessageType.ReceivedAudioChunk:
                    audios[response.partNumber] = response.chunk;
                    if (response.partNumber === response.totalChunks - 1) {
                        const audioImage = audios.join("");
                        console.log("fullImage");
                        const value = {
                            from: response.from,
                            to: response.to,
                            message: response.message,
                            send_at: response.send_at,
                            date: response.date,
                            audio: audioImage,
                        };
                        audios = [];
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

                        // axioInst.put("/updatechat", {
                        //     user,
                        //     friend: response.sender,
                        //     message: value,
                        // });

                        // receivedChatBox(response.senderMessage);
                    }
                    break;
                case MessageType.ReceivedDocChunk:
                    docs[response.partNumber] = response.chunk;
                    if (response.partNumber === response.totalChunks - 1) {
                        const docImage = docs.join("");
                        console.log("fullImage");
                        const value = {
                            from: response.from,
                            to: response.to,
                            message: response.message,
                            send_at: response.send_at,
                            date: response.date,
                            doc: docImage,
                            docName: response.docName,
                        };
                        audios = [];
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

                        // axioInst.put("/updatechat", {
                        //     user,
                        //     friend: response.sender,
                        //     message: value,
                        // });

                        // receivedChatBox(response.senderMessage);
                    }
                    break;
                case MessageType.Offer:
                    setOffer(response.offer);
                    console.log(friends)
                    const friend = friends.filter((f) => f.id === response.from);
                    setCallStatus(2);
                    setCaller(friend[0])
                    setCallingMessage(`${friend[0].name} is Calling`);
                    console.log("response.offer", response.offer);
                    break;
                case MessageType.IceCandidate:
                    if (peerConnectionRef.current) {
                        await peerConnectionRef.current.addIceCandidate(
                            response.candidate,
                        );
                    }
                    break;

                case MessageType.Answer:
                    if (
                        peerConnectionRef.current &&
                        peerConnectionRef.current.signalingState ===
                        "have-local-offer"
                    ) {
                        await peerConnectionRef.current.setRemoteDescription(
                            new RTCSessionDescription(response.answer),
                        );
                    }
                    setReceiveCall(1);
                    break;

                case MessageType.DisConnectCall:
                    if (peerConnectionRef.current) {
                        peerConnectionRef.current.close();
                        peerConnectionRef.current = null;
                    }
                    setCall(0);
                    setOffer(null);
                    setReceiveCall(0);
                    setCaller(null);
                    setCallStatus(0);
                    console.log("Disconnected");
                    break;
                case MessageType.ConfirmRequest:
                    // console.log(response.id, response.name, response.email)

                    setFriends(prev => { return [...prev, { id: response.from, name: response.name, status: "online" }] })

                    await axioInst.delete("deleteConfirmRequest", { params: { userId: user.id, requestId: response.from } }).then((response) => {
                        console.log(response.data);
                    }).catch((err) => {
                        console.log(err.message);
                    })

                    break;
                case MessageType.ReceivedRequest:
                    console.log(response.id, response.name, response.email)
                    setConfirmRequest(prev => { return [...prev, { id: response.id, name: response.name, email: response.email }] })
                    break;
                default:
                    break;
            }
        },
        [friends, setFriends, user],
    );

    useEffect(() => {
        if (!myWebsocket.current) return;

        myWebsocket.current.newMessageHandler(onMessageHandler);
    }, [onMessageHandler])

    useEffect(() => {
        if (myWebsocket.current) return;

        const mySocket = new MyWebsocket(onMessageHandler);
        mySocket.new(`${url}?id=${user.id}`);
        myWebsocket.current = mySocket;

        console.log(myWebsocket);

        // onMessageHandler(myWebsocket, friends);
    }, [friends, onMessageHandler, user.id]);



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
                    console.log("line 637 :", res.data, info);
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
        [user, showMessage],
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

    const getAllUsers = useCallback(async (value) => {
        console.log(value)

        let list = [];
        let getFrequest = [];

        await axioInst.get(`getAllUsers?value=${value}`).then((response) => {

            const newlist = response.data.filter((searchUser) => !friends.some((f) => f.id === searchUser.id || user.id === searchUser.id))
            list = newlist;
            // setAllUsers(newlist)

        }).catch((err) => {
            console.log(err)
        })

        await axioInst.get(`getRequest?userId=${user.id}`).then((response) => {

            getFrequest = response.data

        }).catch((err) => {
            console.log(err.message)
        });

        console.log(getFrequest, list)

        const newList = list.filter((user) => !getFrequest.some((f) => f.request_id === user.id))

        setAllUsers(newList)

    }, [friends, user.id])

    const sendRequest = useCallback(async (requestId) => {
        console.log("Line 659 :", user.id, requestId)

        setAllUsers(prev => { return prev.filter((u1) => u1.id !== requestId) })

        myWebsocket.current.send(JSON.stringify({ type: MessageType.ReceivedRequest, to: requestId, from: user.id, name: user.name, email: user.email }))

        await axioInst.post("sendRequest", { userId: user.id, requestId }).then((response) => { console.log(response.data) }).catch((err) => {
            console.log(err.message)
        });

    }, [user.email, user.id, user.name])

    const getConfirmRequests = useCallback(async () => {
        await axioInst.get(`/getAllConfirmRequest?userid=${user.id}`).then((response) => {
            setConfirmRequest(response.data);
            console.log("line 691", response.data)
        }).catch((err) => {
            console.log(err.message)
        })
    }, [user.id])

    const addFriend = useCallback(async (friend_id, name, email) => {
        setConfirmRequest(prev => { return prev.filter((old) => old.id !== friend_id) });
        myWebsocket.current.send(JSON.stringify({ type: MessageType.ConfirmRequest, to: friend_id, from: user.id, name: user.name, email: user.email }))
        setFriends(prev => { return [...prev, { id: friend_id, name, status: "online" }] })

        await axioInst.post(`/addfriend`, { user_id: user.id, friend_id }).then((response) => {
            setConfirmRequest(prev => prev.filter((old) => old.id !== friend_id))
        }).catch((err) => {
            console.log(err.message)
        })
    }, [setFriends, user.email, user.id, user.name])

    useEffect(() => {
        getConfirmRequests()

    }, [getConfirmRequests])

    const setPeerConnection = useCallback((pc) => {
        peerConnectionRef.current = pc;
    }, []);

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

    const updateShowDocumentBlock = useCallback(() => {
        setBlock(0);
        setShowDocumentBlock(0);
    }, []);

    useEffect(() => {
        console.log(block);
    }, [block]);

    useEffect(() => {
        friends.forEach(friend => {
            if (!processedUsers.current.has(friend.id)) {
                updateSelectedUser(friend);
                processedUsers.current.add(friend.id);
            }
        });
    }, [friends, updateSelectedUser]);

    return (
        <div className="chat">
            {showAllUsers === 1 && <div className="request-block">
                <div className="container">
                    <div className="close"><button onClick={() => { setShowAllUsers(0); setAllUsers(null); }}><CloseIcon /></button></div>
                    <div className="inside-container">
                        <input type="text" name="" id="" placeholder="Search" onChange={(event) => { getAllUsers(event.target.value) }} />
                        {getAllUsers &&
                            <div className="request-search-ls">
                                {allUsers?.map((user, i) => {
                                    return <div className="list" key={i}><div className="flist"><img src="profile.webp" alt="" />{user.name}</div>
                                        <button onClick={() => { sendRequest(user.id) }}>Send Request</button></div>
                                })}
                            </div>}
                    </div>
                </div>
            </div>}
            {showConfirmRequest === 1 && <div className="request-block">
                <div className="container">
                    <div className="close"><button onClick={() => { setShowConfirmRequest(0); }}><CloseIcon /></button></div>
                    <div className="inside-container">
                        {confirmRequest &&
                            <div className="request-search-ls">
                                {confirmRequest?.map((user, i) => {
                                    return <div className="list" key={i}><div className="flist"><img src="profile.webp" alt="" />{user.name}</div> <button onClick={() => { addFriend(user.id, user.name, user.email); }}>Confirm Request</button></div>
                                })}
                            </div>}
                    </div>
                </div>
            </div>}
            {callStatus === 2 && <div className="call-from">
                <p>{callingMessage}</p>
                <button onClick={() => { updateSelectedUser(caller); setCall(1) }}>
                    <CallIcon sx={{ fontSize: 20, color: "green" }} />
                </button>
                <button onClick={() => {
                    myWebsocket.current.send(JSON.stringify({ type: MessageType.DisConnectCall, to: caller.id }));
                    setCall(0);
                    setCallStatus(0);
                }}>
                    <CallEndIcon sx={{ fontSize: 20, color: "red" }} />

                </button>
            </div>}
            <div className="friendblock">
                <div className="friends">
                    {friends.map((f, i) => {
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
                                                    ].from === user.id
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
                        <button onClick={(event) => { event.preventDefault(); setShowAllUsers(1); }}>
                            <PersonAddIcon />
                        </button>
                        <button onClick={(event) => { event.preventDefault(); setShowConfirmRequest(1); getConfirmRequests() }}><NotificationsIcon /></button>

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
                                    <div>
                                        {selectedUser && `${selectedUser.name}`}
                                    </div>
                                    <div className="calling-icon" onClick={() => setCall(1)}>
                                        <CallRoundedIcon />
                                    </div>
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
                        ) : showDocumentBlock === 1 ? (
                            <Document
                                updateDocument={updateShowDocumentBlock}
                                sendMess={sendMessage}
                            />
                        ) : call === 1 ? (
                            <Call
                                ws={myWebsocket.current.ws}
                                selectedUser={selectedUser}
                                user={user}
                                offer={offer}
                                setCall={setCall}
                                setOffer={setOffer}
                                setPeerConnection={setPeerConnection}
                                peerConnection={peerConnectionRef.current}
                                receiveCall={receiveCall}
                                setReceiveCall={setReceiveCall}
                                callingMessage={callingMessage}
                                callStatus={callStatus}
                                setCallStatus={setCallStatus}
                                setCallingMessage={setCallingMessage}
                            />
                        ) : (
                            <div className="chats">
                                {selectedUser &&
                                    showMessage[selectedUser.id] &&
                                    showMessage[selectedUser.id].map(
                                        (f, index) => {
                                            return (
                                                <div
                                                    className="message-date"
                                                    key={index}
                                                >
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
                                    <div className="emoji-wrapper">
                                        <div className="emojies">{emojis.map((emoji, i) => {
                                            return <button key={i} onClick={() => { setMessage(m => m + emoji) }}>{emoji}</button>
                                        })}</div>
                                        <button className="emoji-icon">
                                            <EmojiEmotionsIcon />
                                        </button>
                                    </div>
                                    {showMenu === 1 ? (
                                        <button
                                            onClick={() => {
                                                setShowMenu(0);
                                            }}
                                        >
                                            <CloseRoundedIcon />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setShowMenu(1);
                                            }}
                                        >
                                            <AddRoundedIcon />
                                        </button>
                                    )}
                                    {showMenu === 1 && (
                                        <div className="drop-down">
                                            <div className="drop-block">
                                                <button
                                                    onClick={() => {
                                                        setShowVideoBlock(1);
                                                    }}
                                                >
                                                    <div>
                                                        <VideoFileIcon />
                                                    </div>
                                                    <div>Video</div>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowAudioBlock(1);
                                                    }}
                                                >
                                                    <div>
                                                        <AudiotrackIcon />
                                                    </div>
                                                    <div>Audio</div>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowFileBlock(1);
                                                    }}
                                                >
                                                    <div>
                                                        <AddAPhotoRoundedIcon />
                                                    </div>
                                                    <div>Photo</div>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowDocumentBlock(1);
                                                    }}
                                                >
                                                    <div>
                                                        <AttachFileRoundedIcon />
                                                    </div>
                                                    <div>Document</div>
                                                </button>
                                            </div>
                                        </div>
                                    )}
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