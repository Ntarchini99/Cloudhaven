import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firestore, storage } from '../../Firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';

function FolderDetails() {
    const { folderId } = useParams();
    const [folder, setFolder] = useState(null);
    const [images, setImages] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFolderDetails = async () => {
            try {
                // Fetch folder metadata
                const folderDoc = await getDoc(doc(firestore, 'folders', folderId));
                if (folderDoc.exists()) {
                    setFolder(folderDoc.data());

                    // Fetch images in the folder
                    const folderRef = ref(storage, `folders/${folderId}`);
                    const fileList = await listAll(folderRef);
                    const imageUrls = await Promise.all(
                        fileList.items.map(async (item) => ({
                            name: item.name,
                            url: await getDownloadURL(item),
                        }))
                    );
                    setImages(imageUrls);
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error('Error fetching folder details:', error);
            }
        };

        fetchFolderDetails();
    }, [folderId]);

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
                <button
                    onClick={() => navigate('/files')}
                    className="text-blue-400 hover:underline mb-4"
                >
                    Back to Files
                </button>
                {folder && (
                    <>
                        <h2 className="text-3xl font-bold text-center mb-6">{folder.name}</h2>
                        <p className="text-sm mb-4">Date: {folder.date}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {images.map((image) => (
                                <div key={image.name} className="bg-gray-800 p-4 rounded-lg shadow-md">
                                    <img
                                        src={image.url}
                                        alt={image.name}
                                        className="w-full h-40 object-cover rounded-md"
                                    />
                                    <p className="text-sm text-center mt-2">{image.name}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default FolderDetails;
