import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";

function Nav() {
    const {user, logoutUser}= useContext(AuthContext);
    return <div className="navbar">
        <ul className="nav-left">
            <li>{user?`Welcome ${user.name}`:"Let's Chat"}</li>
        </ul>
        <ul className="nav-right">
            {!user&&<li>
                <Link to="/">Home</Link>
            </li>}
            {!user&&<li>
                <Link to="/login">Login</Link>
            </li>}
            {user?<Link onClick={()=>{logoutUser()}}>Logout</Link>:<li>
                <Link to="/register">Register</Link>
            </li>}
        </ul>

    </div>
}

export default Nav;