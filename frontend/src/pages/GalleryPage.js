import React, { useState, useEffect } from 'react';
import { albumsAPI as albumsApi, uploadAPI as uploadApi } from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  FolderPlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const GalleryPage = () => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newAlbumName, setNewAlbumName] = useState('');

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (selectedAlbum) {
      fetchAlbumImages(selectedAlbum.id);
    }
  }, [selectedAlbum]);

  const fetchAlbums = async () => {
    try {
      const response = await albumsApi.getAlbums();
      setAlbums(response.data || []);
      if (response.data && response.data.length > 0 && !selectedAlbum) {
        setSelectedAlbum(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumImages = async (albumId) => {
    try {
      const response = await albumsApi.getAlbumImages(albumId);
      setImages(response.data || []);
    } catch (error) {
      console.error('Error fetching album images:', error);
      setImages([]);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      const response = await albumsApi.createAlbum({
        name: newAlbumName,
        description: `Album for ${newAlbumName}`
      });
      setAlbums(prev => [...prev, response.data]);
      setNewAlbumName('');
      setShowCreateAlbum(false);
    } catch (error) {
      console.error('Error creating album:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedAlbum) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('albumId', selectedAlbum.id);
        
        await uploadApi.uploadImage(formData);
      }
      fetchAlbumImages(selectedAlbum.id);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (!window.confirm('Are you sure you want to delete this album? This will also delete all images in it.')) {
      return;
    }
    
    try {
      await albumsApi.deleteAlbum(albumId);
      setAlbums(prev => prev.filter(album => album.id !== albumId));
      if (selectedAlbum?.id === albumId) {
        setSelectedAlbum(albums.find(album => album.id !== albumId) || null);
      }
    } catch (error) {
      console.error('Error deleting album:', error);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }
    
    try {
      await albumsApi.deleteImage(imageId);
      setImages(prev => prev.filter(image => image.id !== imageId));
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
        <button
          onClick={() => setShowCreateAlbum(true)}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <FolderPlusIcon className="h-5 w-5 mr-2" />
          New Album
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Albums Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Albums</h3>
            </div>
            <div className="p-6">
              {albums.length > 0 ? (
                <div className="space-y-2">
                  {albums.map((album) => (
                    <div
                      key={album.id}
                      className={`p-3 rounded-lg cursor-pointer flex items-center justify-between ${
                        selectedAlbum?.id === album.id
                          ? 'bg-green-100 border border-green-300'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedAlbum(album)}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{album.name}</p>
                        <p className="text-xs text-gray-500">
                          {album.images?.length || 0} images
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAlbum(album.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No albums yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Images Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedAlbum ? selectedAlbum.name : 'Select an Album'}
              </h3>
              {selectedAlbum && (
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Upload
                  </label>
                </div>
              )}
            </div>
            <div className="p-6">
              {uploading && (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                  <span className="ml-2">Uploading images...</span>
                </div>
              )}
              
              {selectedAlbum ? (
                images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-32 object-cover rounded-lg shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedImage(image);
                                setShowImageModal(true);
                              }}
                              className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(image.id)}
                              className="p-2 bg-white rounded-full text-red-600 hover:bg-gray-100"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 truncate">{image.filename}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by uploading some images.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <FolderPlusIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No album selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select an album to view its images.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Album Modal */}
      {showCreateAlbum && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Album</h3>
                <button
                  onClick={() => setShowCreateAlbum(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleCreateAlbum}>
                <div className="mb-4">
                  <label htmlFor="albumName" className="block text-sm font-medium text-gray-700 mb-2">
                    Album Name
                  </label>
                  <input
                    type="text"
                    id="albumName"
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateAlbum(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create Album
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border shadow-lg rounded-md bg-white max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{selectedImage.filename}</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-4">
              <img
                src={selectedImage.url}
                alt={selectedImage.filename}
                className="w-full max-h-96 object-contain rounded-lg"
              />
            </div>
            <div className="text-sm text-gray-500">
              <p>Uploaded: {new Date(selectedImage.createdAt).toLocaleDateString()}</p>
              <p>Size: {selectedImage.size ? (selectedImage.size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
