import React, { useState } from 'react';
import { auth, firestore, storage, collection, addDoc, ref, uploadBytes } from '../../Firebase';
import { useNavigate } from 'react-router-dom';

function UploadFolder() {
  const [folderName, setFolderName] = useState('');
  const [date, setDate] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFolderSubmit = async (e) => {
    e.preventDefault();

    if (!folderName || !date || files.length === 0) {
      alert('Please fill in all fields and select at least one file.');
      return;
    }

    if (!auth.currentUser) {
      alert('User must be logged in to upload files.');
      return;
    }

    setUploading(true);

    try {
      const folderRef = await addDoc(collection(firestore, 'folders'), {
        name: folderName,
        date: date,
        userId: auth.currentUser.uid,
      });

      const uploadPromises = Array.from(files).map(file => {
        const fileRef = ref(storage, `folders/${folderRef.id}/${file.name}`);
        return uploadBytes(fileRef, file);
      });

      await Promise.all(uploadPromises);

      navigate('/files');
    } catch (error) {
      alert('Error uploading files: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg relative">
        {uploading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white py-2 px-4 rounded-md">
            Subiendo archivos, por favor espere...
          </div>
        )}
        <h2 className="text-3xl font-bold text-center mb-6">Upload Folder</h2>
        <form onSubmit={handleFolderSubmit} className="space-y-6">
          <div>
            <label htmlFor="folderName" className="block text-sm font-medium">Folder Name</label>
            <input
              type="text"
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter folder name"
              required
            />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="files" className="block text-sm font-medium">Files</label>
            <input
              type="file"
              id="files"
              multiple
              onChange={handleFileChange}
              className="w-full px-4 py-2 mt-1 bg-gray-700 rounded-md"
              required
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadFolder;
