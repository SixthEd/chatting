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
            const date = new Date();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const send_at= `${hours}:${minutes}`;
            sendChatBox({ message, send_at });
            const value = message;
            ws.current.send(
                JSON.stringify({
                    to: selectedUser.id,
                    from: user.id,
                    message,
                    send_at,
                }),
            );
            axioInst.put("/updatechat", { user, friend: selectedUser, message: value }).then((res) => { return }).catch((err) => { return })
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
                        send_at: response.send_at
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
            setSelectedUser(info);
            console.log({ user, info });
            if (showMessage[info.id]) {
                return
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
            value = { from: user.id, to: selectedUser.id, message: value.message, send_at: value.send_at };
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
        [selectedUser],
    );

    // const receivedChatBox = useCallback((value) => {

    // const messageBox = document.querySelector(".chats");
    // console.log(value)
    // newElement.classList.add("message");
    // newElement.classList.add("right");
    // ws.send(inputValue);
    // messageBox.appendChild(<Message />);

    // })

    return (
        <div className="chat">
            <div className="friendblock">
                <div className="friends">
                    {friends.map((f) => {
                        return (
                            user.id !== f.id && (
                                <div>
                                    <button onClick={() => updateSelectedUser(f)}>
                                        <div className="friend-img">
                                            <img src="profile.webp" alt="" />
                                            <div className={f.status === "online" ? "online" : "offline"}></div>
                                        </div>
                                        <div className="friendname">
                                            <div className="friend-name">
                                                <div>{f.name[0].toUpperCase() + f.name.slice(1)}</div>
                                                <div className="friend-lmd">{showMessage[f.id] && showMessage[f.id][showMessage[f.id].length - 1].send_at}</div>
                                            </div>
                                            <div className="friend-lm">{showMessage[f.id] && (showMessage[f.id][showMessage[f.id].length - 1].from == user.id ? "You: " : " ") + (showMessage[f.id] && showMessage[f.id][showMessage[f.id].length - 1].message)}</div>
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
                        <button>Add</button>
                    </form>
                </div>
            </div>
            <div className="chatblock">
                <div className="messages">
                    {selectedUser && `Connecting to ${selectedUser.name}`}
                    <div className="chats">
                        {selectedUser &&
                            showMessage[selectedUser.id] &&
                            showMessage[selectedUser.id].map((f) => {
                                return (
                                    <div
                                        className={
                                            f.from === user.id
                                                ? "send"
                                                : "received"
                                        }
                                    >
                                        <Message text={f.message} time={f.send_at} />
                                    </div>
                                );
                            })}
                    </div>
                </div>
                <div className="sendmessage">
                    <form action="">
                        <input
                            type="text"
                            placeholder="Type a message"
                            name="message"
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
                            send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Chat;
//
