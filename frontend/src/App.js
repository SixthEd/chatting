import logo from './logo.svg';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import Chat from './components/Chat';
import { useContext } from 'react';
import { AuthContext } from './components/AuthContext';

function App() {
  const {user} = useContext(AuthContext)
  return <div>
    <BrowserRouter>
    <Nav />
      <Routes>
        <Route path='/' element={user?<Chat /> :<Home />}></Route>
        <Route path='/login' element={user?<Chat /> :<Login />}></Route>
        <Route path='/register' element={user?<Chat /> :<Register />}></Route>
        <Route path="*" element={<Navigate to="/"></Navigate>}></Route>
      </Routes>
    </BrowserRouter>
  </div>
}

export default App;
