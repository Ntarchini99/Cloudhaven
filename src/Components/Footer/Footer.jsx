import React from 'react';
import { FaFacebook, FaInstagram, FaLinkedin, FaGlobe } from 'react-icons/fa';

function Footer() {
    return (
        <footer className="text-white py-6 mt-auto">
            <div className="container mx-auto flex flex-col items-center">
                <div className="flex space-x-4 mb-4">
                    <a
                        href="https://www.facebook.com/ntarchini/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                    >
                        <FaFacebook size={24} />
                    </a>
                    <a
                        href="https://www.instagram.com/nazatarchini/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700"
                    >
                        <FaInstagram size={24} />
                    </a>
                    <a
                        href="https://www.linkedin.com/in/nazareno-tarchini/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-800"
                    >
                        <FaLinkedin size={24} />
                    </a>
                    <a
                        href="https://www.nazatarchini.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:text-blue-800"
                    >
                        <FaGlobe size={20} />
                    </a>

                </div>
                <div className="text-center text-gray-400">
                    <p>&copy; {new Date().getFullYear()}. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
