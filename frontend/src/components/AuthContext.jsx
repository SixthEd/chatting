import React, { useCallback, useEffect, useState } from "react";
import { createContext } from "react";
import axioInst from "../utils";
const AuthContext = createContext();


function AuthContextProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [registerInfo, setRegisterInfo] = React.useState({ name: "", email: "", password: "", confirmPassword: "" });
    const [loginInfo, setLoginInfo] = React.useState({ email: "", password: "" });
    const [registerError, setRegisterError] = React.useState(null);
    const [loginError, setLoginError] = React.useState(null);
    const [friends, setFriends] = React.useState([]);
    const [classRoomPassword, setClassRoomPassword] = React.useState(null);
    const [role, setRole] = useState(null);

    const updateRegisterInfo = useCallback((info) => {
        setRegisterInfo(info);
    }, []);

    const updateLoginInfo = useCallback((info) => {
        setLoginInfo(info);
    }, []);

    // const updateFriends = useCallback((info) => {
        // setFriends(...friends,info);
    //     setFriends(friends)
    // }, [friends]);


    // const updateSelectedUser = useCallback((info) => {
    //     setSelectedUser(info);
    // }, []);

    const registerUser = useCallback((event) => {
        setRegisterError(null);
        axioInst.post("/register", registerInfo).then((res) => { setUser(res.data); localStorage.setItem("user", JSON.stringify(res.data)) }).catch((err) => {
            setRegisterError({ message: err.response.data.message })
        })
    }, [registerInfo]);


    const loginUser = useCallback((event) => {
        setLoginError(null);
        axioInst.post("/login", loginInfo).then((res) => {
            setUser(res.data); 
            localStorage.setItem("user", JSON.stringify(res.data));
            getfri();
        }).catch((err) => { setLoginError({ message: err.response.data.message }) })
    }, [loginInfo])

    // useEffect(() => {

    // }, []);

    const logoutUser = useCallback(() => {
        localStorage.removeItem("user");
        setFriends([]);
        setUser(null);
        axioInst.get("/logout").then((res) => { return }).catch((err) => console.log(err.response));

    }, []);

    // const updateMessage = useCallback((info) => {
    //     setMessage(info);
       
    // }, [])

    function getfri()
    {
        const currentUser =JSON.parse(localStorage.getItem("user"));
        // console.log(currentUser)
        if(currentUser)
        {
            axioInst.post("/getFriends",{currentUser}).then((res) => { 
                setFriends(res.data.friends); 
            }).catch((err) => { })
        }
        
    }


    useEffect(() => {
        if(!user)
        {   
            setUser(JSON.parse(localStorage.getItem("user")));
            getfri();
        }
            
    }, [user])


    // const sendMessage = useCallback((info) => {
        
    //     ws.send(info);
    // }, [])
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
        friends,
        setFriends,
        classRoomPassword,
        setClassRoomPassword,
        role,
        setRole
     
    }}>
        {children}
    </AuthContext.Provider>
}

export default AuthContextProvider;
export { AuthContext };