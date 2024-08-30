import React, { useState } from 'react';
import { auth } from '../../Firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Email de restablecimiento de contraseña enviado. Revisa tu bandeja de entrada.');
      setTimeout(() => navigate('/login'), 5000);
    } catch (error) {
      setError('Error al enviar el email. Asegúrate de que el email esté registrado.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-white">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6">Restablecer Contraseña</h2>
        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Introduce tu email"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-400 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-md"
          >
            Enviar Email
          </button>
          {message && <p className="mt-4 text-green-400">{message}</p>}
          {error && <p className="mt-4 text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
