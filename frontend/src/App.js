import logo from './logo.svg';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Nav from "./components/Nav";
import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import Chat from './components/Chat';
import { useContext } from 'react';
import { AuthContext } from './components/AuthContext';
import ClassRoom from './components/ClassRoom';
import Room from './components/Room';
function App() {
  const { user, classRoomPassword } = useContext(AuthContext)

  return <div>
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path='/' element={user ? <Chat /> : <Home />}></Route>
        <Route path='/login' element={user ? <Chat /> : <Login />}></Route>
        <Route path='/register' element={user ? <Chat /> : <Register />}></Route>
        <Route path='/classRoom' element={user && <ClassRoom />}></Route>
        <Route path='/chat' element={user && <Chat />}></Route>
        <Route path='/room' element={(user && classRoomPassword) ? <Room />: user && <ClassRoom />}></Route>
        <Route path="*" element={<Navigate to="/"></Navigate>}></Route>
      </Routes>
    </BrowserRouter>
  </div>
}

export default App;
