// src/components/Login.jsx
import React, { useState } from 'react';
import { auth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../../Firebase';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // Estado para saber si es registro o inicio de sesión
  const navigate = useNavigate();

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        // Registro con email y contraseña
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // Inicio de sesión con email y contraseña
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/files'); // Redirige al componente de carpetas
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verifica si el usuario está registrado en la base de datos
      if (user) {
        // Redirige al componente de carpetas si el usuario está registrado
        navigate('/files');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">{isRegistering ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleEmailPasswordSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
            >
              {isRegistering ? 'Register' : 'Login'}
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={handleGoogleSignIn}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Sign in with Google
          </button>
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            {isRegistering ? 'Already have an account? Login' : 'Don’t have an account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;
