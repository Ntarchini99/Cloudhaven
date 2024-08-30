import { FaWhatsapp } from 'react-icons/fa';

const WhatsAppButton = () => {
    return (
        <a
            href="https://wa.me/543484365436"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-10 right-10 bg-green-500 text-white rounded-full p-4 shadow-lg hover:bg-green-600 transition duration-300"
        >
            <FaWhatsapp size={34} />
        </a>
    );
};

export default WhatsAppButton;
