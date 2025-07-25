import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, Plus, Image } from 'lucide-react';
import { usePhoto } from '@/context/PhotoContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  className?: string;
}

export function PhotoUpload({ className }: PhotoUploadProps) {
  const { addPhotos, state } = usePhoto();
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please select valid image files.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addPhotos(acceptedFiles);
      toast({
        title: "Photos uploaded",
        description: `Successfully added ${acceptedFiles.length} photo${acceptedFiles.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload photos. Please try again.",
        variant: "destructive",
      });
    }
  }, [addPhotos, toast]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg']
    },
    multiple: true,
    noClick: false,
    noKeyboard: false,
  });

  const isEmpty = state.photos.filter(p => p.status === 'active').length === 0;

  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] p-8"
      >
        <div
          {...getRootProps()}
          className={`
            relative w-full max-w-lg mx-auto p-12 
            border-2 border-dashed border-border 
            rounded-3xl cursor-pointer 
            transition-all duration-300 ease-in-out
            hover:border-primary hover:bg-gallery-bg/50
            ${isDragActive ? 'border-primary bg-gallery-bg scale-105' : ''}
            ${className}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="text-center space-y-6">
            <motion.div
              className="mx-auto w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center"
              animate={{ 
                scale: isDragActive ? 1.1 : 1,
                rotate: isDragActive ? 10 : 0 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Image className="w-10 h-10 text-white" />
            </motion.div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-foreground">
                {isDragActive ? 'Drop your photos here' : 'Start your photo collection'}
              </h3>
              <p className="text-muted-foreground">
                {isDragActive 
                  ? 'Release to upload your photos'
                  : 'Drag and drop photos here, or click to browse'
                }
              </p>
            </div>
            
            <Button 
              type="button"
              variant="outline"
              size="lg"
              className="mt-4"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Choose Photos
            </Button>
          </div>
          
          {state.loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-3xl flex items-center justify-center"
            >
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                <span className="text-foreground font-medium">Uploading photos...</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">Your Photos</h2>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={open}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
            disabled={state.loading}
          >
            {state.loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Photos
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`
          relative p-6 border-2 border-dashed border-border 
          rounded-2xl cursor-pointer transition-all duration-200
          hover:border-primary hover:bg-gallery-bg/30
          ${isDragActive ? 'border-primary bg-gallery-bg/50 scale-[1.02]' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex items-center justify-center space-x-3 text-muted-foreground">
          <Upload className="w-5 h-5" />
          <span className="font-medium">
            {isDragActive 
              ? 'Drop photos to add them' 
              : 'Drag photos here or click to browse'
            }
          </span>
        </div>
      </div>
    </motion.div>
  );
}