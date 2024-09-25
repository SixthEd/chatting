import express from "express";
import validator from "validator";
import { db } from "./index.js";
import bcrypt, { hash } from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "./index.js";
import { web} from "./index.js";
const saltRounds = 10;

//initialize router 
const router = express.Router();



//register route
router.post("/register", async (req, res) => {
    const { name, password, email, confirmPassword } = req.body;

    //checking user is already registered or not
    const response = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (response.rows.length > 0) {
        res.status(400).json({ message: "User is already exist" });
    }
    else {
        // all fields are filled
        if (!name || !password || !email || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required" });
        }

        //is passsword strong
        if (!validator.isStrongPassword(password)) {
            return res.status(400).json({ message: "Password should be strong" });
        }

        // is email valid
        if (!validator.isEmail) {
            return res.status(400).json({ message: "Please Enter valid email" });
        }

        //check both password and confirm password are same
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Password and confirm password are not same" });
        }

        //bcrypt password
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) {
                return res.status(400).json({ message: "error in hashing the password" })
            }
            else {

                //store info of new register user
                await db.query("INSERT INTO users (name ,password, email) VALUES($1, $2, $3)", [name, hash, email]);
                const response = await db.query("SELECT id FROM users WHERE email =$1",[email]);
                const id= response.rows[0].id;
                return res.json({ id, name, email });
            }

        })

    }
})


//login user route
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const response = await db.query("SELECT * FROM users WHERE email =$1", [email]);

    if (response.rows.length > 0) {
        const storedHashedPassword = response.rows[0].password;
        const { name, id } = response.rows[0];
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
                return res.status(400).json({ message: err.message });
            }
            else if (valid) {
                const accessToken = jwt.sign({ email, name, exp: Math.floor(Date.now() / 1000) + 1 }, process.env.ACCESS_TOKEN_SECRET);
                const refreshToken = jwt.sign({ email, name, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) }, process.env.REFRESH_TOKEN_SECRET);
                res.cookie("jwt", { accessToken, refreshToken }, { expires: new Date(Date.now() + 1000 * 60 * 60), httpOnly: true, secure: false,overwrite :true });
                res.json({ id, name, email });
            }
            else {
                return res.status(400).json({ message: "email or password is not correct" });
            }
        })
    }
    else {
        return res.status(400).json({ message: "User is not exist" });
    }
})

// to logout user
router.get("/logout", (req, res) => {
    res.clearCookie("jwt");
    return res.json({});
})


// check cookie and verifyToken
router.get("/cookie", verifyRefreshToken, (req, res) => {
    // console.log("cookies ");
    console.log("old",req.cookies.jwt.accessToken);
    return res.json({});


})

//wsocket upgrade
router.get("/ws",( req , res)=>{
    web.handleUpgrade(req,req.socket,new Buffer(""),(socket,incoming)=>{
        
      socket.on("message",((message)=>{
        web.clients.forEach((client)=>{
            if (client !== socket && client.readyState === socket.OPEN)
                {
                   client.send(message.toString()); 
                }
        })
      }))  
    })
})


router.get("/getFriends", async(req,res)=>{
    const response = await db.query("Select id, email, name from users");
    if(response.rows.length>0)
    {
        console.log(response.rows);
        return res.json({friends:response.rows})
    }
})







// router.get("/chat", verifyRefreshToken, (req, res)=>{
//     return res.json({})
// })

function verifyRefreshToken(req, res, next) {
    var { refreshToken, accessToken } = req.cookies.jwt;
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        if (err instanceof jwt.TokenExpiredError) {
            const newAccessToken = generateToken(refreshToken);
            if (newAccessToken) {
                res.cookie("jwt", { accessToken:newAccessToken, refreshToken }, { expires: new Date(Date.now() + 1000 * 60 * 60), httpOnly: true, secure: false , overwrite: true});// overwrite is not working
                console.log("new",newAccessToken)
            }
            else {
                res.clearCookie("jwt");
            }
        }
        else if (err) {
            res.clearCookie("jwt");
        }
    })
    next();

}

function generateToken(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const email = decoded.email;
        const name = decoded.name;
        const id = decoded.id;
        const accessToken = jwt.sign({ email, name, exp: Math.floor(Date.now() / 1000) }, process.env.ACCESS_TOKEN_SECRET);
        return accessToken;
    }
    catch (err) {
        return;
    }
}

export default router;