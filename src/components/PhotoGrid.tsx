import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhotoCard } from './PhotoCard';
import { usePhoto, Photo } from '@/context/PhotoContext';

interface PhotoGridProps {
  photos: Photo[];
  title?: string;
  emptyMessage?: string;
  showRestoreAction?: boolean;
}

export function PhotoGrid({ 
  photos, 
  title, 
  emptyMessage = "No photos here yet",
  showRestoreAction = false 
}: PhotoGridProps) {
  const { setSelectedPhoto } = usePhoto();

  const handlePhotoClick = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  if (photos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-16"
      >
        <div className="text-muted-foreground text-lg">{emptyMessage}</div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {title && (
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          {title}
        </motion.h2>
      )}
      
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        layout
      >
        <AnimatePresence mode="popLayout">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: {
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }
              }}
              exit={{ 
                opacity: 0, 
                scale: 0.8, 
                y: -20,
                transition: { duration: 0.2 }
              }}
              whileHover={{ 
                y: -8,
                transition: { type: "spring", stiffness: 400, damping: 25 }
              }}
            >
              <PhotoCard
                photo={photo}
                onClick={() => handlePhotoClick(photo)}
                showRestoreAction={showRestoreAction}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}