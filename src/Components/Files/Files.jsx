import React, { useEffect, useState } from 'react';
import { firestore, storage, auth } from '../../Firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaFolderOpen } from 'react-icons/fa';
import ConfirmationModal from '../ConfirmationModal/ConfirmationModal';

function Files() {
    const [folders, setFolders] = useState([]);
    const [newFolder, setNewFolder] = useState({ name: '', date: '', files: [] });
    const [loading, setLoading] = useState({ folders: false, folder: false, uploading: false });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [folderToDelete, setFolderToDelete] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) fetchFolders();
            else navigate('/login');
        });
        return () => unsubscribe();
    }, [navigate]);

    const fetchFolders = async () => {
        setLoading(prev => ({ ...prev, folders: true }));
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const folderQuery = query(collection(firestore, 'folders'), where('userId', '==', user.uid));
            const querySnapshot = await getDocs(folderQuery);
            const foldersData = await Promise.all(querySnapshot.docs.map(async (doc) => {
                const folderData = doc.data();
                const files = await fetchFiles(doc.id);
                return { id: doc.id, ...folderData, files };
            }));
            setFolders(foldersData);
        } catch (error) {
            console.error("Error fetching folders: ", error);
        } finally {
            setLoading(prev => ({ ...prev, folders: false }));
        }
    };

    const fetchFiles = async (folderId) => {
        const folderRef = ref(storage, `folders/${folderId}`);
        const fileList = await listAll(folderRef);
        return Promise.all(fileList.items.map(async (item) => {
            const url = await getDownloadURL(item);
            const type = item.name.split('.').pop();
            return { name: item.name, url, type };
        }));
    };

    const handleCreateFolder = async () => {
        if (!newFolder.name || !newFolder.date) return alert('Folder name and date are required');
        setLoading(prev => ({ ...prev, uploading: true }));

        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const folderRef = await addDoc(collection(firestore, 'folders'), {
                name: newFolder.name,
                userId: user.uid,
                date: newFolder.date,
            });

            await Promise.all(newFolder.files.map(file => {
                const fileRef = ref(storage, `folders/${folderRef.id}/${file.name}`);
                return uploadBytes(fileRef, file);
            }));

            setNewFolder({ name: '', date: '', files: [] });
            setShowCreateForm(false);
            fetchFolders();
        } catch (error) {
            console.error('Error creating folder: ', error);
        } finally {
            setLoading(prev => ({ ...prev, uploading: false }));
        }
    };

    const handleDeleteFolder = async () => {
        if (!folderToDelete) return;
        try {
            const folderRef = ref(storage, `folders/${folderToDelete}`);
            const fileList = await listAll(folderRef);
            await Promise.all(fileList.items.map(deleteObject));
            await deleteDoc(doc(firestore, 'folders', folderToDelete));
            fetchFolders();
        } catch (error) {
            console.error('Error deleting folder: ', error);
        } finally {
            setIsModalOpen(false);
            setFolderToDelete(null);
        }
    };

    const handleFolderClick = (folderId) => {
        setLoading(prev => ({ ...prev, folder: true }));
        navigate(`/folders/${folderId}`);
        setLoading(prev => ({ ...prev, folder: false }));
    };

    return (
        <div className="min-h-screen text-white p-8 min-h-[820px]">
            <h2 className="text-3xl font-bold text-center mb-6">Mis Archivos</h2>
            <div className="flex justify-end mb-6">
                <button onClick={() => setShowCreateForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center">
                    <FaPlusCircle className="mr-2" /> Nueva Carpeta
                </button>
            </div>

            {showCreateForm && (
                <div className="bg-gray-700 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-bold mb-4">Nueva Carpeta</h3>
                    <input
                        type="text"
                        value={newFolder.name}
                        onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-600 rounded-md mb-4"
                        placeholder="Nombre de la Carpeta"
                    />
                    <input
                        type="date"
                        value={newFolder.date}
                        onChange={(e) => setNewFolder({ ...newFolder, date: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-600 rounded-md mb-4"
                    />
                    <input
                        type="file"
                        multiple
                        onChange={(e) => setNewFolder({ ...newFolder, files: Array.from(e.target.files) })}
                        className="w-full px-4 py-2 bg-gray-600 rounded-md mb-4"
                    />
                    <button onClick={handleCreateFolder} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md">
                        Crear Carpeta
                    </button>
                    <button onClick={() => setShowCreateForm(false)} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md ml-4">
                        Cancelar
                    </button>
                </div>
            )}

            {loading.uploading && <LoadingOverlay message="Subiendo archivos..." />}
            {loading.folders && <LoadingOverlay message="Cargando carpetas..." />}
            {loading.folder && <LoadingOverlay message="Cargando vista de la carpeta..." />}

            {folders.length === 0 ? (
                <div className="flex flex-col items-center justify-center mt-12">
                    <FaFolderOpen className="text-gray-600 text-4xl mb-4" />
                    <p className="text-gray-400">No tienes carpetas</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {folders.map(({ id, name, date, files }) => (
                        <div
                            key={id}
                            className="bg-gray-800 p-4 rounded-lg shadow-md cursor-pointer"
                            onClick={() => handleFolderClick(id)}
                        >
                            {files.length > 0 && files[0].type === 'pdf' ? (
                                <div className="w-full h-40 bg-gray-600 flex items-center justify-center rounded-md mb-4">
                                    <a href={files[0]?.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                        {files[0]?.name}
                                    </a>
                                </div>
                            ) : (
                                <img src={files[0]?.url || 'default-image-url'} alt={name} className="w-full h-40 object-cover rounded-md mb-4" />
                            )}
                            <h3 className="text-xl font-semibold">{name}</h3>
                            <p className="text-gray-400">{date}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFolderToDelete(id);
                                    setIsModalOpen(true);
                                }}
                                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md"
                            >
                                Eliminar
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleDeleteFolder}
                message="¿Estás seguro de eliminar esta carpeta?"
            />
        </div>
    );
}

const LoadingOverlay = ({ message }) => (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg">
            <p>{message}</p>
        </div>
    </div>
);

export default Files;
