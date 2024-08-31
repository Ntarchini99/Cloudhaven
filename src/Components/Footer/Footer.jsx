import React from 'react';

function Footer() {
    return (
        <footer className="text-white py-6 mt-auto text-gray-100 font-sans">
            <div className="container mx-auto flex flex-col items-center">
                
                <div className="text-center text-gray-400">
                    <p>&copy; {new Date().getFullYear()}. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
