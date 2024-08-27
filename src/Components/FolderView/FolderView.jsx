import React, { useEffect, useState, useCallback } from 'react';
import { firestore, storage } from '../../Firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { useParams, useNavigate } from 'react-router-dom';
import { FaUpload, FaTrash, FaCloudUploadAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

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
    const [confirmDelete, setConfirmDelete] = useState(null);

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
        setConfirmDelete(fileName);
    };

    const confirmDeleteFile = async () => {
        if (!confirmDelete) return;

        setUploading(true);
        setNotification('Deleting file...');

        try {
            const fileRef = ref(storage, `folders/${folderId}/${confirmDelete}`);
            await deleteObject(fileRef);

            const updatedFiles = folder.files.filter(file => file.name !== confirmDelete);
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
            setConfirmDelete(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const cancelDelete = () => {
        setConfirmDelete(null);
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
            className={`min-h-screen bg-gray-900 text-white p-8 ${dragging ? 'border-4 border-dashed border-blue-500' : ''}`}
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

            <div className="relative">
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
                        <div className="flex items-center justify-center">
                            <span className="text-xl">{folder?.name}</span>
                            <button onClick={handleEditName} className="ml-4 text-yellow-500">
                                <FaEdit />
                            </button>
                        </div>
                    )}
                </h2>

                {notification && (
                    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white p-4 rounded-lg">
                        {notification}
                    </div>
                )}

                {folder?.files && folder.files.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {folder.files.map((file) => (
                            <div
                                key={file.name}
                                className="bg-gray-800 p-4 rounded-lg cursor-pointer"
                                onClick={() => handleFileClick(file.url, file.name)}
                            >
                                {file.name.endsWith('.pdf') ? (
                                    <div className="flex items-center justify-center">
                                        <FaUpload className="text-3xl text-blue-500" />
                                    </div>
                                ) : (
                                    <img src={file.url} alt={file.name} className="w-full h-32 object-cover rounded-lg" />
                                )}
                                <div className="mt-2 text-center text-sm">{file.name}</div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFile(file.name);
                                    }}
                                    className="mt-2 text-red-500 hover:text-red-300"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-lg">No files found.</div>
                )}

                {uploading && (
                    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
                        <div className="text-white p-4 bg-gray-800 rounded-lg">Uploading...</div>
                    </div>
                )}

                {modalImg && <Modal imgSrc={modalImg} onClose={handleCloseModal} />}
                {pdfUrl && <PdfPreview url={pdfUrl} onClose={handleCloseModal} />}

                <input
                    type="file"
                    ref={(ref) => setFileInput(ref)}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                />
                <button
                    onClick={() => fileInput?.click()}
                    className="absolute right-4 top-4 bg-blue-500 text-white p-2 rounded-lg flex items-center"
                >
                    <FaCloudUploadAlt className="mr-2" />
                    Upload Files
                </button>

                {confirmDelete && (
                    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-75 z-50">
                        <div className="bg-white p-4 rounded-lg text-center text-black">
                            <p>Are you sure you want to delete this file?</p>
                            <div className="mt-4 flex justify-center">
                                <button
                                    onClick={confirmDeleteFile}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg mr-2"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={cancelDelete}
                                    className="bg-gray-500 text-white px-4 py-2 rounded-lg"
                                >
                                    No
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FolderView;
