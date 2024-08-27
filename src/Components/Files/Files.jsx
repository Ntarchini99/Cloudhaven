import React, { useEffect, useState } from 'react';
import { firestore, storage, auth } from '../../Firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle } from 'react-icons/fa';

function Files() {
    const [folders, setFolders] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newFolder, setNewFolder] = useState({ name: '', date: '', files: [] });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loadingFolders, setLoadingFolders] = useState(false);
    const [loadingFolder, setLoadingFolder] = useState(false); // Estado para la notificación de carga
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchFolders();
            } else {
                navigate('/login');
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [navigate]);

    // Fetch folders from Firestore
    const fetchFolders = async () => {
        setLoadingFolders(true);
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            const q = query(collection(firestore, 'folders'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const foldersData = [];
            for (const doc of querySnapshot.docs) {
                const folderId = doc.id;
                const folderData = doc.data();

                // Get files in the folder
                const folderRef = ref(storage, `folders/${folderId}`);
                const fileList = await listAll(folderRef);
                const files = await Promise.all(
                    fileList.items.map(async (item) => {
                        const url = await getDownloadURL(item);
                        const type = item.name.split('.').pop(); // Extract file extension
                        return { name: item.name, url, type };
                    })
                );

                foldersData.push({ id: folderId, ...folderData, files });
            }
            setFolders(foldersData);
        } catch (error) {
            console.error("Error fetching folders: ", error);
        } finally {
            setLoading(false);
            setLoadingFolders(false);
        }
    };

    // Handle folder creation
    const handleCreateFolder = async () => {
        if (!newFolder.name || !newFolder.date) {
            alert('Folder name and date are required');
            return;
        }

        setUploading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Create folder document
            const folderRef = await addDoc(collection(firestore, 'folders'), {
                name: newFolder.name,
                userId: user.uid,
                date: newFolder.date,
            });

            // Upload files
            for (const file of newFolder.files) {
                const fileRef = ref(storage, `folders/${folderRef.id}/${file.name}`);
                await uploadBytes(fileRef, file);
            }

            setNewFolder({ name: '', date: '', files: [] });
            setShowCreateForm(false);
            await fetchFolders();
        } catch (error) {
            console.error('Error creating folder: ', error);
        } finally {
            setUploading(false);
        }
    };

    // Handle file input change
    const handleFileChange = (e) => {
        setNewFolder({ ...newFolder, files: Array.from(e.target.files) });
    };

    // Handle folder delete
    const handleDeleteFolder = async (folderId) => {
        const confirm = window.confirm('Are you sure you want to delete this folder?');
        if (!confirm) return;

        try {
            // Delete files in the folder
            const folderRef = ref(storage, `folders/${folderId}`);
            const fileList = await listAll(folderRef);
            const deletePromises = fileList.items.map(item => deleteObject(item));
            await Promise.all(deletePromises);

            // Delete folder metadata
            await deleteDoc(doc(firestore, 'folders', folderId));
            await fetchFolders();
        } catch (error) {
            console.error('Error deleting folder: ', error);
        }
    };

    // Handle folder click
    const handleFolderClick = async (folderId) => {
        setLoadingFolder(true); // Show loading notification

        // Navigate to FolderView
        navigate(`/folders/${folderId}`);

        // Hide the notification after navigating
        setTimeout(() => {
            setLoadingFolder(false);
        }, 500); // Adjust timeout as needed
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h2 className="text-3xl font-bold text-center mb-6">Mis Archivos</h2>
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center"
                >
                    <FaPlusCircle className="mr-2" /> Nueva Carpeta
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-gray-700 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-bold mb-4">New Folder</h3>
                    <div className="mb-4">
                        <input
                            type="text"
                            value={newFolder.name}
                            onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-600 rounded-md"
                            placeholder="Folder Name"
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="date"
                            value={newFolder.date}
                            onChange={(e) => setNewFolder({ ...newFolder, date: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-600 rounded-md"
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="w-full px-4 py-2 bg-gray-600 rounded-md"
                        />
                    </div>
                    <button
                        onClick={handleCreateFolder}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md"
                    >
                        Create Folder
                    </button>
                    <button
                        onClick={() => setShowCreateForm(false)}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md ml-4"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {uploading && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
                    <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
                        <p>Uploading files...</p>
                    </div>
                </div>
            )}

            {loadingFolders && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
                    <div className="bg-yellow-600 text-white p-4 rounded-lg shadow-lg">
                        <p>Loading folders...</p>
                    </div>
                </div>
            )}

            {loadingFolder && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
                    <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
                        <p>Loading folder view...</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {folders.map((folder) => (
                    <div
                        key={folder.id}
                        className="bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer"
                        onClick={() => handleFolderClick(folder.id)}
                    >
                        {folder.files.length > 0 && folder.files[0].type === 'pdf' ? (
                            <div className="w-full h-40 bg-gray-600 flex items-center justify-center rounded-md mb-4">
                                <a
                                    href={folder.files[0]?.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline"
                                >
                                    {folder.files[0]?.name}
                                </a>
                            </div>
                        ) : (
                            <img
                                src={folder.files[0]?.url || 'default-image-url'}
                                alt={folder.name}
                                className="w-full h-40 object-cover rounded-md mb-4"
                            />
                        )}
                        <h3 className="text-xl font-semibold">{folder.name}</h3>
                        <p className="text-gray-400">{folder.date}</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id);
                            }}
                            className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Files;
