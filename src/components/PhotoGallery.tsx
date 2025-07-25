import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoProvider, usePhoto } from '@/context/PhotoContext';
import { GalleryHeader } from './GalleryHeader';
import { PhotoUpload } from './PhotoUpload';
import { PhotoGrid } from './PhotoGrid';
import { PhotoModal } from './PhotoModal';
import { CameraCapture } from './CameraCapture';
import { Trash2, Camera } from 'lucide-react';

function GalleryContent() {
  const [currentView, setCurrentView] = useState<'gallery' | 'trash' | 'camera'>('gallery');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const { state, setSelectedPhoto, getActivePhotos, getDeletedPhotos, getCameraPhotos, getUploadedPhotos } = usePhoto();

  const activePhotos = getActivePhotos();
  const deletedPhotos = getDeletedPhotos();
  const cameraPhotos = getCameraPhotos();
  const uploadedPhotos = getUploadedPhotos();

  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  const handleCameraClick = () => {
    setIsCameraOpen(true);
  };

  const handleCloseCameraCapture = () => {
    setIsCameraOpen(false);
  };

  return (
    <div className="min-h-screen bg-gallery-bg">
      <GalleryHeader 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onCameraClick={handleCameraClick}
      />
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentView === 'gallery' ? (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <PhotoUpload />
              
              {uploadedPhotos.length > 0 ? (
                <PhotoGrid
                  photos={uploadedPhotos}
                  emptyMessage="No uploaded photos yet. Upload some to get started!"
                />
              ) : !state.loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No uploaded photos yet
                  </h3>
                  <p className="text-muted-foreground">
                    Upload your first photos to start building your collection
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : currentView === 'camera' ? (
            <motion.div
              key="camera"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Camera Photos</h2>
                  <p className="text-muted-foreground">
                    Photos captured using your device camera
                  </p>
                </div>
              </div>

              {cameraPhotos.length > 0 ? (
                <PhotoGrid
                  photos={cameraPhotos}
                  emptyMessage="No camera photos yet"
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No camera photos yet
                  </h3>
                  <p className="text-muted-foreground">
                    Click the camera icon in the header to take your first photo
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="trash"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Trash</h2>
                  <p className="text-muted-foreground">
                    Photos here will be permanently deleted after 10 days
                  </p>
                </div>
                
                {deletedPhotos.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Trash2 className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          {deletedPhotos.length} photo{deletedPhotos.length > 1 ? 's' : ''} in trash
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400">
                          Restore them before they're permanently deleted
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {deletedPhotos.length > 0 ? (
                <PhotoGrid
                  photos={deletedPhotos}
                  emptyMessage="No photos in trash"
                  showRestoreAction={true}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <Trash2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Trash is empty
                  </h3>
                  <p className="text-muted-foreground">
                    Deleted photos will appear here and be automatically removed after 10 days
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Photo modal */}
      <PhotoModal
        photo={state.selectedPhoto}
        isOpen={!!state.selectedPhoto}
        onClose={handleCloseModal}
      />

      {/* Camera capture */}
      <CameraCapture
        isOpen={isCameraOpen}
        onClose={handleCloseCameraCapture}
      />
    </div>
  );
}

export function PhotoGallery() {
  return (
    <PhotoProvider>
      <GalleryContent />
    </PhotoProvider>
  );
}