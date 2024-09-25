import pg from "pg";
import bodyParser from "body-parser";
import env from "dotenv";
import express from "express";
import router from "./routes.js";
import cookieParser from "cookie-parser";
import {WebSocketServer} from "ws";


const port = 4000;

const cors = (req, res, next) => {
    res.header("Access-Control-Allow-Headers" , "Content-Type");
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Methods","GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true")
    //
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    if (req.method.toLowerCase() === "options") return res.sendStatus(204);
    next();
}

env.config();

// database config
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "chattwo",
    password: "1234",
    port: 5432

})

//database connect
db.connect();


const app = express();

//custom middleware
app.use(cors);

//middleware for json bodyparser
app.use(bodyParser.json());

//middleware for parsing data from cookies
app.use(cookieParser());

//middleware for routes
app.use("/", router);

//websocket
const web = new WebSocketServer({
    noServer: true
});


// create server 
app.listen(port, () => {
    console.log(`Server is running on ${port}`);
})

export { db, env ,web};