import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import RoutesConfig from './Routes'; 
import 'react-toastify/dist/ReactToastify.css';


function App() {
  return (
    <Router>
      <RoutesConfig />
    </Router>
  );
}

export default App;
