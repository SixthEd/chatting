import express from "express";
import validator from "validator";
import { db } from "./index.js";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "./index.js";
import { web } from "./index.js";
const saltRounds = 10;

//initialize router
const router = express.Router();

const userSockets = {};
const classRoomPasswords = {};
// const roomSockets = {}

const MessageType = {
    UserConnected: 1,
    UserDisconnected: 2,
    ConnectedUserList: 3,
    Status: 4,
    ReceivedMessage: 5,
};

const roomMessageType = {
    UserConnected: 1,
    UserDisconnected: 2,
    ConnectedUserList: 3,
    Status: 4,
    ReceivedMessage: 5,
    password: 6
};

//register route
// router.post("/register", async (req, res) => {});

//register route
router.post("/register", async (req, res) => {
    const { name, password, email, confirmPassword } = req.body;
    //checking user is already registered or not
    const response = await db.query("SELECT * FROM users WHERE email = $1", [
        email,
    ]);
    if (response.rows.length > 0) {
        res.status(400).json({ message: "User is already exist" });
    } else {
        // all fields are filled
        if (!name || !password || !email || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        //is passsword strong
        if (!validator.isStrongPassword(password)) {
            return res
                .status(400)
                .json({ message: "Password should be strong" });
        }

        // is email valid
        if (!validator.isEmail) {
            return res
                .status(400)
                .json({ message: "Please Enter valid email" });
        }

        //check both password and confirm password are same
        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Password and confirm password are not same",
            });
        }

        //bcrypt password
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
                return res
                    .status(400)
                    .json({ message: "error in hashing the password" });
            } else {
                //store info of new register user
                await db.query(
                    "INSERT INTO users (name ,password, email) VALUES($1, $2, $3)",
                    [name, hash, email],
                );
                const response = await db.query(
                    "SELECT id FROM users WHERE email =$1",
                    [email],
                );
                const id = response.rows[0].id;
                return res.json({ id, name, email });
            }
        });
    }
});

//login user route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const response = await db.query("SELECT * FROM users WHERE email =$1", [
        email,
    ]);

    if (response.rows.length > 0) {
        const storedHashedPassword = response.rows[0].password;
        const { name, id } = response.rows[0];
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            } else if (valid) {
                const accessToken = jwt.sign(
                    { email, name, exp: Math.floor(Date.now() / 1000) + 1 },
                    process.env.ACCESS_TOKEN_SECRET,
                );
                const refreshToken = jwt.sign(
                    {
                        email,
                        name,
                        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
                    },
                    process.env.REFRESH_TOKEN_SECRET,
                );
                res.cookie(
                    "jwt",
                    { accessToken, refreshToken },
                    {
                        expires: new Date(Date.now() + 1000 * 60 * 60),
                        httpOnly: true,
                        secure: false,
                        overwrite: true,
                    },
                );
                res.json({ id, name, email });
            } else {
                return res
                    .status(400)
                    .json({ message: "email or password is not correct" });
            }
        });
    } else {
        return res.status(400).json({ message: "User is not exist" });
    }
});

// to logout user
router.get("/logout", (req, res) => {
    res.clearCookie("jwt");
    return res.json({});
});

// check cookie and verifyToken
router.get("/cookie", verifyRefreshToken, (req, res) => {
    // console.log("cookies ");
    console.log("old", req.cookies.jwt.accessToken);
    return res.json({});
});

//wsocket upgrade
router.get("/ws", (req, res) => {
    const id = req.query.id;

    web.handleUpgrade(req, req.socket, new Buffer(""), (socket) => {
        userSockets[id] = socket;
        // send a list of all connected users to this user
        socket.send(
            JSON.stringify({
                type: MessageType.ConnectedUserList,
                connectedUsers: Object.keys(userSockets),
            }),
        );

        web.clients.forEach((client) => {
            if (client !== socket && client.readyState === socket.OPEN) {
                client.send(
                    JSON.stringify({
                        type: MessageType.UserConnected,
                        id,
                    }),
                );
            }
        });

        socket.on("close", () => {
            web.clients.forEach((client) => {
                if (client !== socket && client.readyState === socket.OPEN) {
                    client.send(
                        JSON.stringify({
                            type: MessageType.UserDisconnected,
                            id,
                        }),
                    );
                }
            });
        });

        socket.on("message", (message) => {
            const parsedMessage = JSON.parse(message.toString());
            const senderSocket = userSockets[parsedMessage.to];
            const senderMessage = parsedMessage.message;

            console.log(parsedMessage);
            if (senderSocket) {
                senderSocket.send(
                    JSON.stringify({
                        type: MessageType.ReceivedMessage,
                        from: parsedMessage.from,
                        message: senderMessage,
                        send_at: parsedMessage.send_at,
                        date: parsedMessage.date,
                    }),
                );
            }

            // web.clients.forEach((client)=>{
            //     if (client !== socket && client.readyState === socket.OPEN)
            //         {
            //            client.send(message.toString());
            //         }
            // })
        });
    });
});


router.get("/wsroom", (req, res) => {

    // console.log(req.query.id)
    const id = req.query.id
    web.handleUpgrade(req, req.socket, new Buffer(""), (socket) => {
        // send a list of all connected users to this 
        // roomSockets[id] = socket;
        socket.send(
            JSON.stringify({
                type: roomMessageType.ConnectedUserList,
                connectedUsers: id
            }),
        );

        web.clients.forEach((client) => {
            if (client !== socket && client.readyState === socket.OPEN) {
                client.send(
                    JSON.stringify({
                        type: roomMessageType.UserConnected,
                        id
                    }),
                );
            }
        });

        socket.on("close", () => {
            web.clients.forEach((client) => {
                if (client !== socket && client.readyState === socket.OPEN) {
                    client.send(
                        JSON.stringify({
                            type: roomMessageType.UserDisconnected,
                            id
                        }),
                    );
                }
            });
            delete classRoomPasswords[req.query.password][id]

            console.log("closing", classRoomPasswords[req.query.password])
            if(Object.keys(classRoomPasswords[req.query.password]).length===0)
            {
                delete classRoomPasswords[req.query.password]
                console.log("classLength",classRoomPasswords)
            }
        });

        socket.on("message", (message) => {
            const parsedMessage = JSON.parse(message.toString());
            // const senderSocket = roomUserSockets[parsedMessage.to];
            // const senderMessage = parsedMessage.message;

            console.log(parsedMessage);
            const id = parsedMessage.id

            if (parsedMessage.type === roomMessageType.password) {
                if (!classRoomPasswords.hasOwnProperty(parsedMessage.password)) {
                    classRoomPasswords[parsedMessage.password] = { [id]: socket }
                }
                else {
                    classRoomPasswords[parsedMessage.password] = { ...classRoomPasswords[parsedMessage.password], [id]: socket }
                }
                // console.log(classRoomPasswords)

            }
            else if (parsedMessage.type === roomMessageType.ReceivedMessage) {
                if (classRoomPasswords.hasOwnProperty(parsedMessage.password)) {
                    Object.entries(classRoomPasswords[parsedMessage.password]).forEach(([id, client]) => {
                        if (client !== socket && client.readyState === socket.OPEN) {
                            client.send(JSON.stringify({ type: roomMessageType.ReceivedMessage, from: parsedMessage.fromName, message: parsedMessage.message }))
                        }
                    })
                }
            }
            else if(parsedMessage.type === roomMessageType.UserDisconnected)
            {

                delete classRoomPasswords[parsedMessage.password].id
                console.log(classRoomPasswords[parsedMessage.password])
                
            }
            else if(parsedMessage.type === "Drawing")
            {
                if (classRoomPasswords.hasOwnProperty(parsedMessage.password) && parsedMessage.isDrawing ===1) {
                    Object.entries(classRoomPasswords[parsedMessage.password]).forEach(([id, client]) => {
                        if (client !== socket && client.readyState === socket.OPEN) {
                            client.send(JSON.stringify({ type:parsedMessage.type, isDrawing: parsedMessage.isDrawing, color:parsedMessage.color, message: parsedMessage.message, lastPosition: parsedMessage.lastPosition, currentPosition: parsedMessage.currentPosition  }))
                        }
                    })
                }
                else if (classRoomPasswords.hasOwnProperty(parsedMessage.password) && parsedMessage.isDrawing ===2) {
                    Object.entries(classRoomPasswords[parsedMessage.password]).forEach(([id, client]) => {
                        if (client !== socket && client.readyState === socket.OPEN) {
                            client.send(JSON.stringify({ type:parsedMessage.type, isDrawing: parsedMessage.isDrawing, x: parsedMessage.x , y:parsedMessage.y   }))
                        }
                    })
                }
                // console.log(parsedMessage)
            }




        });
    });
});

router.post("/getFriends", async (req, res) => {
    const { name, id, email } = req.body.currentUser;
    //    console.log(name)
    const response = await db.query(
        `SELECT 
            uf.friend_id as id,
            u2.name AS name
        FROM 
            userfriends uf
        JOIN 
        users u2 ON uf.friend_id = u2.id
where user_id = $1;`,
        [id],
    );

    console.log({ rows: response.rows, name });

    if (response.rows.length > 0) {
        const friendsList = response.rows.map((f) => {
            return { ...f, status: "offline" };
        });
        return res.json({ friends: friendsList });
    }
});

router.put("/updatechat", async (req, res) => {

    // console.log(req.body);
    // const {user, friend , message} = req.body;
    // console.log("updatechat", user, friend, message);
    // if(message && friend)
    // {
    //     const response = await db.query(`INSERT INTO userchat ("from","to",message,send_at,date) VALUES($1, $2, $3, now(),now()::date)`,[user.id, friend.id, message]);
    // }
    res.json("");
});

router.post("/chat", async (req, res) => {
    const { user, info } = req.body;
    console.log(user.id, info.id);
    const response = await db.query(
        `SELECT "from", "to" , message, TO_CHAR(send_at,'HH24:MI') AS send_at, To_CHAR(date,'YYYY-MM-DD') AS date FROM userchat WHERE ("from" = $1 AND "to" = $2) OR ("from" = $2 AND "to" = $1) order by date, send_at `, [user.id, info.id]
    );
    console.log("chat rows", response.rows);
    if (response.rows.length > 0) {
        return res.json(response.rows);
    }
    //    INSERT INTO userchat ("from", "to", chat, send_at) VALUES(5, 1, ARRAY['hello'],now());

    return res.json([
        { from: user.id, to: info.id, message: "this is hardcooded" },
        { from: info.id, to: user.id, message: "this is hardcooded send" },
        { from: user.id, to: info.id, message: "hi" },
        { from: info.id, to: user.id, message: "hello" },
        { from: user.id, to: info.id, message: "this " },
        { from: user.id, to: info.id, message: "this is " },
    ]);
});

function verifyRefreshToken(req, res, next) {
    var { refreshToken, accessToken } = req.cookies.jwt;
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        if (err instanceof jwt.TokenExpiredError) {
            const newAccessToken = generateToken(refreshToken);
            if (newAccessToken) {
                res.cookie(
                    "jwt",
                    { accessToken: newAccessToken, refreshToken },
                    {
                        expires: new Date(Date.now() + 1000 * 60 * 60),
                        httpOnly: true,
                        secure: false,
                        overwrite: true,
                    },
                ); // overwrite is not working
                console.log("new", newAccessToken);
            } else {
                res.clearCookie("jwt");
            }
        } else if (err) {
            res.clearCookie("jwt");
        }
    });
    next();
}

function generateToken(refreshToken) {
    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );
        const email = decoded.email;
        const name = decoded.name;
        const id = decoded.id;
        const accessToken = jwt.sign(
            { email, name, exp: Math.floor(Date.now() / 1000) },
            process.env.ACCESS_TOKEN_SECRET,
        );
        return accessToken;
    } catch (err) {
        return;
    }
}

export default router;
