import React, { useContext } from "react";
import { AuthContext } from "./AuthContext";

function Register() {
    const { loginInfo, updateLoginInfo, loginError, loginUser} = useContext(AuthContext);
    return <div className="formBlock">
        <div className="formTitle">Login Form</div>
        <div className="registerForm">
            <div className="form-left"><img src="./chat2.png" alt="" /></div>
            <div className="form-right">
                <form action="">
                    <li>
                        <input type="text" name="email" onChange={(event) => { updateLoginInfo({ ...loginInfo, email: event.target.value }) }} placeholder="Enter your email" value={loginInfo.email} />
                    </li>
                    <li>
                        <input type="text" name="password" onChange={(event) => { updateLoginInfo({ ...loginInfo, password: event.target.value }) }} placeholder="Enter your password" value={loginInfo.password} />
                    </li>
                    <li className="formButton">
                        <div >
                            <button onClick={(event)=>{event.preventDefault(); loginUser();}}>Login</button>
                        </div>
                    </li>
                </form>
                {(loginError)&& <div className="dialog">{loginError.message}</div>}
            </div>
            
        </div>

    </div>
}

export default Register;