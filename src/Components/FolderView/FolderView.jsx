import React, { useEffect, useState, useCallback } from 'react';
import { firestore, storage } from '../../Firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUpload, FaTrash } from 'react-icons/fa';

// Modal Component
const Modal = ({ imgSrc, onClose }) => {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
            <div className="relative bg-white p-4 rounded-lg">
                <img src={imgSrc} alt="Preview" className="max-w-full max-h-screen" />
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"
                >
                    X
                </button>
                <a
                    href={imgSrc}
                    download
                    className="absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full"
                    title="Download Image"
                >
                    Download
                </a>
            </div>
        </div>
    );
};

// PdfPreview Component
const PdfPreview = ({ url, onClose }) => {
    return (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
            <iframe src={url} className="w-full h-full" />
            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"
            >
                X
            </button>
        </div>
    );
};

function FolderView() {
    const { folderId } = useParams();
    const navigate = useNavigate(); // Hook para redirigir
    const [folder, setFolder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalImg, setModalImg] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [fileInput, setFileInput] = useState(null); // Reference to file input
    const [uploading, setUploading] = useState(false);
    const [notification, setNotification] = useState(null); // State for notifications

    useEffect(() => {
        const fetchFolder = async () => {
            setLoading(true);
            setNotification('Loading folder...'); // Show loading notification
            try {
                const folderDocRef = doc(firestore, 'folders', folderId);
                const folderDoc = await getDoc(folderDocRef);
                const folderData = folderDoc.data();

                // Get files in the folder
                const folderRef = ref(storage, `folders/${folderId}`);
                const fileList = await listAll(folderRef);
                const files = await Promise.all(
                    fileList.items.map(async (item) => ({
                        name: item.name,
                        url: await getDownloadURL(item),
                    }))
                );

                setFolder({ ...folderData, files });
                setNotification('Folder loaded successfully!'); // Success notification
            } catch (error) {
                console.error('Error fetching folder data: ', error);
                setNotification('Error loading folder'); // Error notification
            } finally {
                setLoading(false);
                setTimeout(() => setNotification(null), 3000); // Hide notification after 3 seconds
            }
        };

        fetchFolder();
    }, [folderId]);

    const handleFileClick = (url, name) => {
        if (name.endsWith('.pdf')) {
            setPdfUrl(url); // Set the clicked PDF URL to show in PdfPreview
        } else {
            setModalImg(url); // Set the clicked image URL to show in the modal
        }
    };

    const handleCloseModal = () => {
        setModalImg(null); // Close the modal
        setPdfUrl(null); // Close the PDF preview
    };

    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        setUploading(true);
        setNotification('Uploading files...'); // Show notification

        try {
            const folderRef = ref(storage, `folders/${folderId}`);
            const newFiles = Array.from(files);
            const filePromises = newFiles.map(async (file) => {
                const fileRef = ref(folderRef, file.name);
                await uploadBytes(fileRef, file);
                return { name: file.name, url: await getDownloadURL(fileRef) };
            });

            const uploadedFiles = await Promise.all(filePromises);

            // Update Firestore with the new files
            await updateDoc(doc(firestore, 'folders', folderId), {
                files: [...folder.files, ...uploadedFiles],
            });

            setFolder((prevFolder) => ({
                ...prevFolder,
                files: [...prevFolder.files, ...uploadedFiles],
            }));
            setNotification('Files uploaded successfully!'); // Success notification
        } catch (error) {
            console.error('Error uploading files: ', error);
            setNotification('Error uploading files'); // Error notification
        } finally {
            setUploading(false);
            setFileInput(null); // Clear file input
            setTimeout(() => setNotification(null), 3000); // Hide notification after 3 seconds
        }
    };

    const handleDeleteFile = async (fileName) => {
        if (window.confirm('Are you sure you want to delete this file?')) {
            setUploading(true);
            setNotification('Deleting file...'); // Show notification

            try {
                // Delete from storage
                const fileRef = ref(storage, `folders/${folderId}/${fileName}`);
                await deleteObject(fileRef);

                // Remove file from Firestore
                const updatedFiles = folder.files.filter(file => file.name !== fileName);
                await updateDoc(doc(firestore, 'folders', folderId), {
                    files: updatedFiles,
                });

                setFolder((prevFolder) => ({
                    ...prevFolder,
                    files: updatedFiles,
                }));
                setNotification('File deleted successfully!'); // Success notification
            } catch (error) {
                console.error('Error deleting file: ', error);
                setNotification('Error deleting file'); // Error notification
            } finally {
                setUploading(false);
                setTimeout(() => setNotification(null), 3000); // Hide notification after 3 seconds
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            {/* Botón para volver a las carpetas */}
            <button
                onClick={() => navigate('/files')}
                className="mb-6 text-blue-500 hover:text-blue-300"
            >
                &larr; Back to Files
            </button>

            <h2 className="text-3xl font-bold text-center mb-6">{folder?.name || 'Folder'}</h2>
            
            {/* File Upload Section */}
            <div className="flex justify-end mb-6">
                <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center cursor-pointer">
                    <FaUpload className="mr-2" /> Upload Files
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        ref={(input) => setFileInput(input)}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Notification */}
            {notification && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                    <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
                        <p>{notification}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {folder?.files.map((file, index) => (
                    <div
                        key={index}
                        className="relative w-full h-40 object-cover rounded-md cursor-pointer"
                        onClick={() => handleFileClick(file.url, file.name)}
                    >
                        {file.name.endsWith('.pdf') ? (
                            <div className="pdf-thumbnail">
                                <p>PDF Preview</p>
                            </div>
                        ) : (
                            <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-full object-cover"
                            />
                        )}
                        {/* Delete Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering file click
                                handleDeleteFile(file.name);
                            }}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>

            {modalImg && <Modal imgSrc={modalImg} onClose={handleCloseModal} />}
            {pdfUrl && <PdfPreview url={pdfUrl} onClose={handleCloseModal} />}
        </div>
    );
}

export default FolderView;
