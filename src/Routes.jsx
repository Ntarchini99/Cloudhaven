// routes.jsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './Components/NavBar/NavBar';
import Home from './Components/Home/Home';
import Login from './Components/Login/Login';
import Register from './Components/Register/Register';
import UploadFolder from './Components/UploadFolder/UploadFolder';
import Files from './Components/Files/Files';
import FolderView from './Components/FolderView/FolderView'; 

const RoutesConfig = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/upload" element={<UploadFolder />} />
      <Route path="/files" element={<Files />} />
      <Route path="/folders/:folderId" element={<FolderView />} /> 
    </Routes>
  </>
);

export default RoutesConfig;