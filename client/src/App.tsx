import './App.css'
import { WhiteboardProvider } from './components/Context/WhiteboardContext';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard/Dashboard';
import Register from './components/Auth/Register';
import Whiteboard from './components/Whiteboard/Whiteboard';
import { useEffect, useState } from 'react';

function App() {
  const [isAuthenticated,setIsAuthenticated] = useState(false);
  const validateAuth = () => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(token ? true : false)
  }
  
  useEffect(() => {
    validateAuth();
  },[])

  return (
    <WhiteboardProvider>
      <Router>
        <Routes>
          <Route path='/' element={isAuthenticated ? <Navigate to={'/dashboard'}/> : <Navigate to={'/login'}/>}/>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/register' element={<Register />}></Route>
          <Route path='/dashboard' element={<Dashboard />}></Route>
          <Route path='/boards/:boardId' element={<Whiteboard />}></Route>
        </Routes>
      </Router>
    </WhiteboardProvider>
  );
}

export default App
