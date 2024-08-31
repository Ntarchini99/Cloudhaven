import React, { useEffect, useState, useCallback } from 'react';
import { firestore, storage } from '../../Firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUpload, FaTrash, FaCloudUploadAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal'; 

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
        <div className="fixed inset-0 flex justify-center items-center bg-opacity-75 z-50 min-h-[775px]">
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

const PdfPreview = ({ url, onClose }) => {
    return (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
            <div className="relative w-full h-full bg-white">
                <iframe
                    src={url}
                    className="w-full h-full"
                    title="PDF Preview"
                    style={{ border: 'none' }}
                />
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full"
                >
                    X
                </button>
            </div>
        </div>
    );
};

function FolderView() {
    const { folderId } = useParams();
    const navigate = useNavigate();
    const [folder, setFolder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalImg, setModalImg] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [fileInput, setFileInput] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [editing, setEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);

    useEffect(() => {
        const fetchFolder = async () => {
            setLoading(true);
            setNotification('Loading folder...');
            try {
                const folderDocRef = doc(firestore, 'folders', folderId);
                const folderDoc = await getDoc(folderDocRef);
                const folderData = folderDoc.data();

                const folderRef = ref(storage, `folders/${folderId}`);
                const fileList = await listAll(folderRef);
                const files = await Promise.all(
                    fileList.items.map(async (item) => ({
                        name: item.name,
                        url: await getDownloadURL(item),
                    }))
                );

                setFolder({ ...folderData, files });
                setNewName(folderData.name);
                setNotification('Folder loaded successfully!');
            } catch (error) {
                console.error('Error fetching folder data: ', error);
                setNotification('Error loading folder');
            } finally {
                setLoading(false);
                setTimeout(() => setNotification(null), 3000);
            }
        };

        fetchFolder();
    }, [folderId]);

    const handleFileClick = (url, name) => {
        if (name.endsWith('.pdf')) {
            setPdfUrl(url);
        } else {
            setModalImg(url);
        }
    };

    const handleCloseModal = () => {
        setModalImg(null);
        setPdfUrl(null);
    };

    const handleFileChange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;

        await uploadFiles(files);
    };

    const handleDeleteFile = (fileName) => {
        setFileToDelete(fileName);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!fileToDelete) return;

        setUploading(true);
        setNotification('Deleting file...');
        try {
            const fileRef = ref(storage, `folders/${folderId}/${fileToDelete}`);
            await deleteObject(fileRef);

            const updatedFiles = folder.files.filter(file => file.name !== fileToDelete);
            await updateDoc(doc(firestore, 'folders', folderId), {
                files: updatedFiles,
            });

            setFolder((prevFolder) => ({
                ...prevFolder,
                files: updatedFiles,
            }));
            setNotification('File deleted successfully!');
        } catch (error) {
            console.error('Error deleting file: ', error);
            setNotification('Error deleting file');
        } finally {
            setUploading(false);
            setIsModalOpen(false);
            setFileToDelete(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setDragging(false);
        const files = e.dataTransfer.files;
        if (files.length === 0) return;

        await uploadFiles(files);
    };

    const uploadFiles = async (files) => {
        setUploading(true);
        setNotification('Uploading files...');

        try {
            const folderRef = ref(storage, `folders/${folderId}`);
            const newFiles = Array.from(files);
            const filePromises = newFiles.map(async (file) => {
                const fileRef = ref(folderRef, file.name);
                await uploadBytes(fileRef, file);
                return { name: file.name, url: await getDownloadURL(fileRef) };
            });

            const uploadedFiles = await Promise.all(filePromises);

            await updateDoc(doc(firestore, 'folders', folderId), {
                files: [...folder.files, ...uploadedFiles],
            });

            setFolder((prevFolder) => ({
                ...prevFolder,
                files: [...prevFolder.files, ...uploadedFiles],
            }));
            setNotification('Files uploaded successfully!');
        } catch (error) {
            console.error('Error uploading files: ', error);
            setNotification('Error uploading files');
        } finally {
            setUploading(false);
            setFileInput(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleEditName = () => {
        setEditing(true);
    };

    const handleSaveName = async () => {
        if (newName.trim() === '') return;

        setEditing(false);
        setNotification('Saving folder name...');

        try {
            await updateDoc(doc(firestore, 'folders', folderId), {
                name: newName,
            });
            setFolder((prevFolder) => ({
                ...prevFolder,
                name: newName,
            }));
            setNotification('Folder name updated successfully!');
        } catch (error) {
            console.error('Error updating folder name: ', error);
            setNotification('Error updating folder name');
        } finally {
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setNewName(folder?.name || '');
    };

    return (
        <div
            className={`min-h-screen text-white p-8 ${dragging ? 'border-4 border-dashed border-blue-500' : ''}`}
            onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
        >
            <button
                onClick={() => navigate('/files')}
                className="mb-6 text-blue-500 hover:text-blue-300"
            >
                &larr; Back to Files
            </button>

            <h2 className="text-3xl font-bold text-center mb-6">
                {editing ? (
                    <div className="flex justify-center items-center">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="bg-gray-800 text-white border border-gray-600 p-2 rounded"
                        />
                        <button onClick={handleSaveName} className="ml-2 text-green-500">
                            <FaSave />
                        </button>
                        <button onClick={handleCancelEdit} className="ml-2 text-red-500">
                            <FaTimes />
                        </button>
                    </div>
                ) : (
                    <div className="flex justify-center items-center">
                        <span>{folder?.name || 'Folder'}</span>
                        <button onClick={handleEditName} className="ml-2 text-yellow-500">
                            <FaEdit />
                        </button>
                    </div>
                )}
            </h2>

            <p className="text-center mb-6">
                {folder?.creationDate ? `Created on: ${new Date(folder.creationDate.seconds * 1000).toLocaleDateString()}` : ''}
            </p>

            <div className="flex justify-end mb-6">
                <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center cursor-pointer">
                    <FaUpload className="mr-2" /> Subir Doc
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        ref={(input) => setFileInput(input)}
                        className="hidden"
                    />
                </label>
            </div>

            <div className="flex justify-center items-center mb-6">
                <FaCloudUploadAlt className="text-6xl text-blue-500 mr-4" />
                <p className="text-lg"> O Arrastra un archivo</p>
            </div>

            {notification && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                    <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
                        <p>{notification}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {folder?.files?.map((file) => (
                    <div key={file.name} className="relative">
                        <div
                            onClick={() => handleFileClick(file.url, file.name)}
                            className="cursor-pointer bg-gray-800 rounded-lg overflow-hidden"
                        >
                            {file.name.endsWith('.pdf') ? (
                                <div className="flex items-center justify-center h-64 bg-gray-700">
                                    <p className="text-lg">PDF Document</p>
                                </div>
                            ) : (
                                <img
                                    src={file.url}
                                    alt={file.name}
                                    className="object-cover w-full h-64"
                                />
                            )}
                        </div>
                        <button
                            onClick={() => handleDeleteFile(file.name)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full"
                        >
                            <FaTrash />
                        </button>
                    </div>
                ))}
            </div>

            {modalImg && <Modal imgSrc={modalImg} onClose={handleCloseModal} />}
            {pdfUrl && <PdfPreview url={pdfUrl} onClose={handleCloseModal} />}
            {isModalOpen && (
                <ConfirmationModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    message="¿Estás seguro de eliminar este archivo?"
                />
            )}
        </div>
    );
}

export default FolderView;
