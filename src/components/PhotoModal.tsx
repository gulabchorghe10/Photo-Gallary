import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Trash2, RotateCcw, Calendar, HardDrive, RotateCw, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Photo, usePhoto } from '@/context/PhotoContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PhotoModalProps {
  photo: Photo | null;
  isOpen: boolean;
  onClose: () => void;
  photoList?: Photo[];
  setSelectedPhoto?: (photo: Photo) => void;
}

export function PhotoModal({ photo, isOpen, onClose, photoList, setSelectedPhoto }: PhotoModalProps) {
  const { deletePhoto, restorePhoto, getPhotoTimeInfo } = usePhoto();
  const { toast } = useToast();
  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState<'center' | { x: number; y: number }>('center');
  const [imgRect, setImgRect] = useState<DOMRect | null>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [showDetails, setShowDetails] = useState(false);
  // Remove rotation state and button

  // Reset zoom when modal closes or photo changes
  useEffect(() => {
    if (!isOpen) setZoom(1);
    setOrigin('center');
  }, [isOpen]);
  useEffect(() => {
    setZoom(1);
    setOrigin('center');
  }, [photo]);

  // Helper to get relative position in percent
  const getRelativePos = (clientX: number, clientY: number) => {
    if (!imgRect) return { x: 50, y: 50 };
    const x = ((clientX - imgRect.left) / imgRect.width) * 100;
    const y = ((clientY - imgRect.top) / imgRect.height) * 100;
    return { x, y };
  };

  // Mouse move/touch move handler
  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imgRect) return;
    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    setOrigin(getRelativePos(clientX, clientY));
  };

  // Update imgRect on mount/resize
  useEffect(() => {
    const updateRect = () => {
      if (imgRef.current) setImgRect(imgRef.current.getBoundingClientRect());
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [isOpen, photo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (photoList && setSelectedPhoto && photo) {
        const idx = photoList.findIndex(p => p.id === photo.id);
        if (e.key === 'ArrowLeft') {
          if (idx > 0) setSelectedPhoto(photoList[idx - 1]);
        }
        if (e.key === 'ArrowRight') {
          if (idx < photoList.length - 1) setSelectedPhoto(photoList[idx + 1]);
        }
      }
      if (e.key === '+') {
        setZoom(z => Math.min(z + 0.2, 3));
        setOrigin('center');
      }
      if (e.key === '-') {
        setZoom(z => Math.max(z - 0.2, 0.5));
        setOrigin('center');
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, photo, photoList, setSelectedPhoto]);

  // Navigation handlers
  const currentIdx = photoList && photo ? photoList.findIndex(p => p.id === photo.id) : -1;
  const hasPrev = photoList && currentIdx > 0;
  const hasNext = photoList && currentIdx < photoList.length - 1;
  const goPrev = () => setSelectedPhoto && photoList && hasPrev && setSelectedPhoto(photoList[currentIdx - 1]);
  const goNext = () => setSelectedPhoto && photoList && hasNext && setSelectedPhoto(photoList[currentIdx + 1]);

  // Remove handleZoom and sticky nav panel, restore previous image and nav button layout

  if (!photo) return null;

  const { addedText, deletedText } = getPhotoTimeInfo(photo);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `Downloading ${photo.name}`,
    });
  };

  const handleDelete = () => {
    deletePhoto(photo.id);
    onClose();
    toast({
      title: "Photo moved to trash",
      description: "You can restore it from the trash within 10 days.",
    });
  };

  const handleRestore = () => {
    restorePhoto(photo.id);
    onClose();
    toast({
      title: "Photo restored",
      description: "The photo has been moved back to your gallery.",
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative max-w-[90vw] max-h-[90vh] mx-2 sm:mx-4 bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <h2 className="font-semibold text-foreground truncate max-w-xs">
                  {photo.name}
                </h2>
                {photo.status === 'deleted' && (
                  <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                    Deleted
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(v => !v)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info className="w-4 h-4" />
                  <span className="ml-1 hidden sm:inline">Details</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Download className="w-4 h-4" />
                </Button>
                {photo.status === 'deleted' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRestore}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {/* Main content row: nav btn | image | nav btn | details */}
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-center relative w-full h-full">
              {/* Left nav button (mobile: absolute, desktop: relative) */}
              {hasPrev && (
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow border border-gray-200"
                  onClick={goPrev}
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              )}
              {/* Image */}
              <div className="flex-1 flex items-center justify-center relative w-full">
                <motion.img
                  ref={imgRef}
                  initial={{ opacity: 0, scale: 0.95, rotate: 0 }}
                  animate={{ opacity: 1, scale: zoom, rotate: 0 }}
                  transition={{ delay: 0.1 }}
                  src={photo.url}
                  alt={photo.name}
                  className="rounded-2xl shadow-lg object-cover"
                  style={{
                    height: '80vh',
                    width: '80vh',
                    maxWidth: '90vw',
                    aspectRatio: '1/1',
                    transformOrigin: '50% 50%'
                  }}
                  onMouseMove={handlePointerMove}
                  onWheel={e => setZoom(z => Math.max(0.5, Math.min(z + (e.deltaY < 0 ? 0.2 : -0.2), 3)))}
                  onMouseDown={e => {
                    if (imgRef.current) setImgRect(imgRef.current.getBoundingClientRect());
                  }}
                  onTouchStart={e => {
                    if (imgRef.current) setImgRect(imgRef.current.getBoundingClientRect());
                  }}
                />
                {/* Zoom controls: bottom left, larger on mobile */}
                <div className="absolute left-2 bottom-2 z-10 flex flex-col gap-2">
                  <button
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white text-2xl font-bold shadow border border-gray-200"
                    onClick={e => setZoom(z => Math.min(z + 0.2, 3))}
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                  <button
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white text-2xl font-bold shadow border border-gray-200"
                    onClick={e => setZoom(z => Math.max(z - 0.2, 0.5))}
                    aria-label="Zoom out"
                  >
                    –
                  </button>
                </div>
              </div>
              {/* Right nav button */}
              {hasNext && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow border border-gray-200"
                  onClick={goNext}
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              )}
              {/* Details panel: below image on mobile, sidebar on desktop */}
              {showDetails && (
                <div className="w-full sm:w-80 bg-card border-t sm:border-t-0 sm:border-l p-4 sm:p-6 space-y-6 max-h-[40vh] sm:max-h-[80vh] overflow-y-auto absolute sm:static left-0 bottom-0 sm:right-0 sm:top-0 z-10 rounded-b-2xl sm:rounded-l-2xl">
                  <div>
                    <h3 className="font-semibold text-foreground mb-4">Photo Details</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Added</p>
                          <p className="font-medium text-foreground">{addedText}</p>
                          <p className="text-xs text-muted-foreground">
                            {photo.addedAt.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {deletedText && (
                        <div className="flex items-start space-x-3">
                          <Trash2 className="w-5 h-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-muted-foreground">Deleted</p>
                            <p className="font-medium text-red-600">{deletedText}</p>
                            {photo.deletedAt && (
                              <p className="text-xs text-muted-foreground">
                                {photo.deletedAt.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <HardDrive className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">File size</p>
                          <p className="font-medium text-foreground">{formatFileSize(photo.size)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex flex-col space-y-3">
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      
                      {photo.status === 'deleted' ? (
                        <Button
                          onClick={handleRestore}
                          variant="outline"
                          className="w-full text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore Photo
                        </Button>
                      ) : (
                        <Button
                          onClick={handleDelete}
                          variant="outline"
                          className="w-full text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Move to Trash
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}