import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RotateCcw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhoto } from '@/context/PhotoContext';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CameraCapture({ isOpen, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const { addPhotos } = usePhoto();
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Access Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [facingMode, toast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Flip image if using front camera
    if (facingMode === 'user') {
      context.scale(-1, 1);
      context.translate(-canvas.width, 0);
    }

    context.drawImage(video, 0, 0);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    stopCamera();
  }, [facingMode, stopCamera]);

  const savePhoto = useCallback(async () => {
    if (!capturedImage) return;

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Create file from blob
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([blob], `camera-${timestamp}.jpg`, { type: 'image/jpeg' });
      
      await addPhotos([file]);
      
      toast({
        title: "Photo Saved",
        description: "Your photo has been saved to the camera section."
      });
      
      handleClose();
    } catch (error) {
      console.error('Error saving photo:', error);
      toast({
        title: "Save Error",
        description: "Failed to save photo. Please try again.",
        variant: "destructive"
      });
    }
  }, [capturedImage, addPhotos, toast]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  }, [stopCamera, onClose]);

  React.useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    
    return () => {
      if (!isOpen) {
        stopCamera();
      }
    };
  }, [isOpen, startCamera, stopCamera, capturedImage]);

  React.useEffect(() => {
    if (isStreaming && isOpen) {
      startCamera();
    }
  }, [facingMode, isStreaming, isOpen, startCamera]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <h2 className="text-white font-semibold">Camera</h2>
            
            {isStreaming && (
              <Button
                variant="ghost"
                size="icon"
                onClick={switchCamera}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="w-6 h-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Camera view */}
        <div className="relative w-full h-full flex items-center justify-center">
          {capturedImage ? (
            /* Captured image preview */
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <img
                src={capturedImage}
                alt="Captured"
                className="max-w-full max-h-full object-contain"
              />
              
              {/* Action buttons for captured image */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  Retake
                </Button>
                <Button
                  onClick={savePhoto}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save Photo
                </Button>
              </div>
            </motion.div>
          ) : (
            /* Live camera view */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />
              
              {/* Capture button */}
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
                >
                  <Button
                    size="lg"
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full bg-white hover:bg-gray-100 border-4 border-white/30"
                  >
                    <Camera className="w-8 h-8 text-black" />
                  </Button>
                </motion.div>
              )}
              
              {/* Loading state */}
              {!isStreaming && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-black"
                >
                  <div className="text-center text-white">
                    <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                    <p>Starting camera...</p>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
}