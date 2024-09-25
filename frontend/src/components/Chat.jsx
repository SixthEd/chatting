import React, {
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";
import { AuthContext } from "./AuthContext";

const url = "http://localhost:4000/ws";

/**
 * @typedef {Object} selectedUser
 * @property {number} id - The user's ID.
 * @property {string} email - The user's email address.
 * @property {string} name - The user's name.
 */

function Chat() {
    const { friends, updateMessage, message } = useContext(AuthContext);

    /** @type [selectedUser, any] */
    const [selectedUser, setSelectedUser] = useState(null);

    const [myName, setMyName] = useState("");

    /** @type {React.MutableRefObject<Record<string, WebSocket>>} */

    // can remove this, this can be a single weboscket conn instead of an object
    // this can simply be either null or a WebSocket connection
    // const ws = useRef(null);
    
    const ws = useRef({});

    useEffect(() => {
        const url = new URL(window.location.href);
        const search = url.searchParams.get("name");
        setMyName(search);
    }, []);

    const createNewWebsocketConn = useCallback(
        (f) => () => {
            setSelectedUser(f);

            if (ws.current[f.name]) {
                console.log("Already create ws conn for", f.name);
                return;
            }

            const newWs = new WebSocket(`${url}?username=${myName}`);
            ws.current[f.name] = newWs;
        },
        [myName],
    );

    const sendMessage = useCallback(
        (info) => {
            if (selectedUser === null) {
                console.log("selectedUser is null");
                return;
            }

            if (!ws.current[selectedUser.name]) {
                console.log(selectedUser.name, "has no WebSocket Connecting");
                return;
            }

            // can remove this, this can be a single weboscket conn instead of an object
            const wsConn = ws.current[selectedUser.name];

            if (wsConn.readyState !== WebSocket.OPEN) {
                console.log(selectedUser.name, "ws conn is not open");
                return;
            }

            console.log({ username: selectedUser.name, info });

            wsConn.send(JSON.stringify({ username: selectedUser.name, info }));
        },
        [selectedUser],
    );

    return (
        <div className="chat">
            <div className="friendblock">
                <div className="friends">
                    {friends.map((f) => {
                        return (
                            <button onClick={createNewWebsocketConn(f)}>
                                {f.name}
                            </button>
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
                    <div className="chats"></div>
                </div>
                <div className="sendmessage">
                    <form action="">
                        <input
                            type="text"
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
