import React from 'react';
import backgroundImage from '../../assets/img/fondo.jpg';

function Home() {
    return (
        <div
            className="relative min-h-screen bg-cover bg-center bg-no-repeat text-white flex items-center justify-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <div className="absolute inset-0 bg-gray-800 bg-opacity-70"></div>
            <div className="relative w-full max-w-4xl text-center p-8 bg-opacity-70  rounded-lg">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">Tu espacio personal de salud</h1>
                <p className="text-base md:text-lg mb-6">
                    Aquí puedes almacenar y acceder a todas tus recetas y estudios médicos
                    en un solo lugar seguro, organizado y accesible cuando lo necesites. Tu salud en tus manos.
                </p>
            </div>
        </div>
    );
}

export default Home;
