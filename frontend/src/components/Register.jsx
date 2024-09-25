import React, { useContext } from "react";
import { AuthContext } from "./AuthContext";

function Register() {
    const { registerInfo, updateRegisterInfo,registerError , registerUser} = useContext(AuthContext);
    return <div className="formBlock">
        <div className="formTitle">Register Form</div>
        <div className="registerForm">
            <div className="form-left"><img src="./chat2.png" alt="" /></div>
            <div className="form-right">
                <form action="">
                    <li>
                        <input type="text" name="username" onChange={(event) => { updateRegisterInfo({ ...registerInfo, name: event.target.value }) }} placeholder="Enter your name" value={registerInfo.name} />
                    </li>
                    <li>
                        <input type="text" name="email" onChange={(event) => { updateRegisterInfo({ ...registerInfo, email: event.target.value }) }} placeholder="Enter your email" value={registerInfo.email} />
                    </li>
                    <li>
                        <input type="password" name="password" onChange={(event) => { updateRegisterInfo({ ...registerInfo, password: event.target.value }) }} placeholder="Enter password" value={registerInfo.password} />
                    </li>
                    <li>
                        <input type="password" name="confirmPassword" onChange={(event) => { updateRegisterInfo({ ...registerInfo, confirmPassword: event.target.value }) }} placeholder="Enter Confirm password" value={registerInfo.confirmPassword} />
                    </li>
                    <li className="formButton">
                        <div >
                            <button onClick={(event)=>{event.preventDefault(); registerUser();}}>Register</button>
                        </div>
                    </li>
                </form>
                {(registerError)&& <div className="dialog">{registerError.message}</div>}
                
            </div>
        </div>

    </div>
}

export default Register;