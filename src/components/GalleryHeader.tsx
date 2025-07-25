import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Trash2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { usePhoto } from '@/context/PhotoContext';

interface GalleryHeaderProps {
  currentView: 'gallery' | 'trash';
  onViewChange: (view: 'gallery' | 'trash') => void;
}

export function GalleryHeader({ currentView, onViewChange }: GalleryHeaderProps) {
  const { getActivePhotos, getDeletedPhotos } = usePhoto();
  
  const activeCount = getActivePhotos().length;
  const deletedCount = getDeletedPhotos().length;

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md"
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-4">
            <motion.div
              className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Camera className="w-6 h-6 text-white" />
            </motion.div>
            
            <div>
              <h1 className="text-2xl font-bold text-foreground">SnapStash</h1>
              <p className="text-sm text-muted-foreground">
                Your beautiful photo collection
              </p>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => onViewChange('gallery')}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-200 relative
                ${currentView === 'gallery'
                  ? 'text-primary-foreground bg-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Camera className="w-4 h-4" />
              <span>Gallery</span>
              {activeCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary-glow text-white">
                  {activeCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => onViewChange('trash')}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-200 relative
                ${currentView === 'trash'
                  ? 'text-primary-foreground bg-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Trash2 className="w-4 h-4" />
              <span>Trash</span>
              {deletedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">
                  {deletedCount}
                </span>
              )}
            </button>
          </div>

          {/* Theme toggle */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </motion.header>
  );
}