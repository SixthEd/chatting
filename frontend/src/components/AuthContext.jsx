import React, { useCallback, useEffect } from "react";
import { createContext } from "react";
import axioInst from "../utils";
const AuthContext = createContext();
const ws = new WebSocket("ws://localhost:4000/ws");


function AuthContextProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [registerInfo, setRegisterInfo] = React.useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [loginInfo, setLoginInfo] = React.useState({ email: "", password: "" });
    const [registerError, setRegisterError] = React.useState(null);
    const [loginError, setLoginError] = React.useState(null);
    const [friends, setFriends] = React.useState([]);
    const [selectedUser, setSelectedUser] = React.useState(null);
    const [message, setMessage] = React.useState("");


    const updateRegisterInfo = useCallback((info) => {
        setRegisterInfo(info);
    }, []);

    const updateLoginInfo = useCallback((info) => {
        setLoginInfo(info);
    }, []);

    const updateSelectedUser = useCallback((info) => {
        setSelectedUser(info);
    }, []);

    const registerUser = useCallback((event) => {
        setRegisterError(null);
        axioInst.post("/register", registerInfo).then((res) => { setUser(res.data); localStorage.JSON.stringify(res.data) }).catch((err) => {
            setRegisterError({ message: err.response.data.message })
        })
    }, [registerInfo]);


    const loginUser = useCallback((event) => {
        setLoginError(null);
        axioInst.post("/login", loginInfo).then((res) => {
            console.log(res.data); setUser(res.data); 
            localStorage.setItem("user", JSON.stringify(res.data));
            getfri();
        }).catch((err) => { setLoginError({ message: err.response.data.message }) })
    }, [loginInfo])

    useEffect(() => {

    }, []);

    const logoutUser = useCallback(() => {
        localStorage.removeItem("user");
        setFriends([]);
        setUser(null);
        axioInst.get("/logout").then((res) => { return }).catch((err) => console.log(err.response));

    }, []);

    const updateMessage = useCallback((info) => {
        setMessage(info);
       
    }, [])

    function getfri()
    {
        axioInst.get("/getFriends").then((res) => { 
            setFriends(res.data.friends); 
        }).catch((err) => { })
    }


    useEffect(() => {
        if(!user)
        {   
            setUser(JSON.parse(localStorage.getItem("user")));
            getfri();
        }
            
    }, [])


    const sendMessage = useCallback((info) => {
        
        ws.send(info);
    }, [])
    // useEffect(()=>{
    //     axioInst.get("/cookie").then((res)=>{}).catch((err)=>{})
    // },[])

    return <AuthContext.Provider value={{
        user,
        registerInfo,
        updateRegisterInfo,
        loginInfo,
        updateLoginInfo,
        registerError,
        registerUser,
        loginError,
        loginUser,
        logoutUser,
        updateSelectedUser,
        friends,
        selectedUser,
        sendMessage,
        updateMessage,
        message
    }}>
        {children}
    </AuthContext.Provider>
}

export default AuthContextProvider;
export { AuthContext };