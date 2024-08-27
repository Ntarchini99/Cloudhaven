import React from 'react';

function ConfirmationModal({ isOpen, onClose, onConfirm, message }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                <h3 className="text-lg font-semibold mb-4 text-center text-black">{message}</h3>
                <div className="flex justify-end">
                    <button
                        onClick={onConfirm}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md mr-2"
                    >
                        Confirmar
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-2 px-4 rounded-md"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;
