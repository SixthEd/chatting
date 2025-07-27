import express from "express";
import validator from "validator";
import { db } from "./index.js";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "./index.js";
import { web } from "./index.js";
import e from "express";

const saltRounds = 10;

//initialize router
const router = express.Router();

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
        if (!validator.isEmail(email)) {
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

    console.log("Line 170:", req.body);
    const { user, friend, message } = req.body;
    console.log("line 172:",req.body);
    if (user.id && message.from) {
        const response = await db.query(`INSERT INTO userchat ("from","to",message,send_at,date,image,video,audio, doc, docname) VALUES($1, $2, $3, now(),now()::date,$4,$5,$6, $7, $8)`, [message.from, message.to, message.message, message.image, message.video, message.audio, message.doc, message.docName]);
    }
    res.json("");
});

router.post("/chat", async (req, res) => {
    const { user, info } = req.body;
    console.log(user.id, info.id);
    const response = await db.query(
        `SELECT "from", "to" , message, image, video, audio, doc, docname AS "docName" ,TO_CHAR(send_at,'HH24:MI') AS send_at, To_CHAR(date,'YYYY-MM-DD') AS date FROM userchat WHERE ("from" = $1 AND "to" = $2) OR ("from" = $2 AND "to" = $1) order by date, send_at `, [user.id, info.id]
    );
    console.log("chat rows", response.rows);
    if (response.rows.length > 0) {
        return res.json(response.rows);
    }
    //    INSERT INTO userchat ("from", "to", chat, send_at) VALUES(5, 1, ARRAY['hello'],now());

    // return res.json([
    //     { from: user.id, to: info.id, message: "this is hardcooded" },
    //     { from: info.id, to: user.id, message: "this is hardcooded send" },
    //     { from: user.id, to: info.id, message: "hi" },
    //     { from: info.id, to: user.id, message: "hello" },
    //     { from: user.id, to: info.id, message: "this " },
    //     { from: user.id, to: info.id, message: "this is " },
    // ]);
});

router.get("/getAllUsers", async (req, res) => {
    const value = req.query.value;
    const response = await db.query(`Select id, name, email from users where name ILIKE $1`, [`${value}%`]);
    console.log("line 204: ", response.rows)
    res.status(200).json(response.rows);
})

router.post("/sendRequest", async (req, res) => {
    const { userId, requestId } = req.body;
    await db.query("Insert into frequest (user_id, request_id) Values ($1, $2)", [userId, requestId])
    res.json(200);
})

router.get("/getRequest", async (req, res) => {
    const userId = req.query.userId;
    console.log("Line 217", req.query)
    const response = await db.query("Select request_id from frequest where user_id=$1", [userId])
    res.status(200).json(response.rows)
})

router.get("/getAllConfirmRequest", async (req, res) => {
    const user_id = req.query.userid;
    console.log(user_id)
    const response = await db.query(`Select u1.id, u1.name, u1.email from frequest f JOIN users u1 ON f.user_id=u1.id where f.request_id=$1`, [user_id]);
    // console.log(response.rows)
    res.status(200).json(response.rows)
})

router.delete("/deleteConfirmRequest", async (req, res) => {
    const { userId, requestId } = req.query
    console.log("Line 231:", userId, requestId)

    await db.query(`Delete from frequest where user_id=$1 and request_id=$2`, [userId, requestId]);
    res.status(200);
})

router.post("/addfriend", async (req, res) => {
    const { user_id, friend_id } = req.body;
    console.log("line 232", user_id, friend_id)
    await db.query("Insert into userfriends (user_id, friend_id) Values ($1, $2)", [user_id, friend_id])
    await db.query("Insert into userfriends (user_id, friend_id) Values ($1, $2)", [friend_id, user_id])

    res.status(200).json({ message: "added" })
})

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
