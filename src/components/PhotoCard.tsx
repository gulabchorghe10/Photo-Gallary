import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, RotateCcw, X, Eye } from 'lucide-react';
import { Photo, usePhoto } from '@/context/PhotoContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
  showRestoreAction?: boolean;
}

export function PhotoCard({ photo, onClick, showRestoreAction = false }: PhotoCardProps) {
  const { deletePhoto, restorePhoto, permanentlyDeletePhoto, getPhotoTimeInfo } = usePhoto();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const { addedText, deletedText } = getPhotoTimeInfo(photo);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (photo.status === 'deleted') {
      setShowDeleteDialog(true);
    } else {
      deletePhoto(photo.id);
      toast({
        title: "Photo moved to trash",
        description: "You can restore it from the trash within 10 days.",
      });
    }
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    restorePhoto(photo.id);
    toast({
      title: "Photo restored",
      description: "The photo has been moved back to your gallery.",
    });
  };

  const handlePermanentDelete = () => {
    permanentlyDeletePhoto(photo.id);
    setShowDeleteDialog(false);
    toast({
      title: "Photo permanently deleted",
      description: "This action cannot be undone.",
      variant: "destructive",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <motion.div
        className="group relative aspect-square rounded-2xl overflow-hidden bg-card shadow-lg cursor-pointer"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ 
          scale: 1.05,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Overlay with gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
        
        {/* Action buttons */}
        <motion.div
          className="absolute top-3 right-3 flex space-x-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : -10
          }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-white/20 backdrop-blur-sm border-white/20 hover:bg-white/30"
            onClick={onClick}
          >
            <Eye className="w-4 h-4 text-white" />
          </Button>
          
          {showRestoreAction ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-green-500/20 backdrop-blur-sm border-green-500/20 hover:bg-green-500/30"
              onClick={handleRestore}
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </Button>
          ) : null}
          
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 bg-red-500/20 backdrop-blur-sm border-red-500/20 hover:bg-red-500/30"
            onClick={handleDelete}
          >
            {photo.status === 'deleted' ? (
              <X className="w-4 h-4 text-white" />
            ) : (
              <Trash2 className="w-4 h-4 text-white" />
            )}
          </Button>
        </motion.div>
        
        {/* Photo info */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4 text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 10
          }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <div className="space-y-1">
            <p className="text-sm font-medium truncate">
              {photo.name}
            </p>
            <p className="text-xs text-white/80">
              {formatFileSize(photo.size)}
            </p>
            <p className="text-xs text-white/80">
              Added {addedText}
            </p>
            {deletedText && (
              <p className="text-xs text-red-300">
                Deleted {deletedText}
              </p>
            )}
          </div>
        </motion.div>
        
        {/* Deleted indicator */}
        {photo.status === 'deleted' && (
          <motion.div
            className="absolute top-3 left-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              Deleted
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Permanent delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{photo.name}" from your device. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}