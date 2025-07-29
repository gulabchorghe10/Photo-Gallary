import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Trash2, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { usePhoto } from '@/context/PhotoContext';

interface GalleryHeaderProps {
  currentView: 'uploads' | 'trash' | 'camera';
  onViewChange: (view: 'uploads' | 'trash' | 'camera') => void;
  onCameraClick: () => void;
}

export function GalleryHeader({ currentView, onViewChange, onCameraClick }: GalleryHeaderProps) {
  const { getActivePhotos, getDeletedPhotos, getCameraPhotos, getUploadedPhotos } = usePhoto();
  
  const activeCount = getActivePhotos().length;
  const deletedCount = getDeletedPhotos().length;
  const cameraCount = getCameraPhotos().length;
  const uploadCount = getUploadedPhotos().length;

  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 z-50 w-full border-b border-white/20 bg-white/30 dark:bg-black/30 backdrop-blur-lg shadow-lg"
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between h-auto sm:h-16 gap-2 sm:gap-0">
          {/* Logo and hamburger */}
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={onCameraClick}
                className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center cursor-pointer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-6 h-6 text-white" />
              </motion.button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">SnapStash</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Your beautiful photo collection</p>
              </div>
            </div>
            {/* Hamburger menu button (mobile only) */}
            <button
              className="sm:hidden ml-2 p-2 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Open menu"
            >
              <Menu className="w-7 h-7" />
            </button>
          </div>

          {/* Navigation tabs and theme toggle (desktop) */}
          <div className="hidden sm:flex w-full sm:w-auto items-center justify-center sm:justify-end space-x-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => onViewChange('uploads')}
              className={`
                flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium
                transition-all duration-200 relative
                ${currentView === 'uploads'
                  ? 'text-primary-foreground bg-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Camera className="w-4 h-4" />
              <span>Uploads</span>
              {uploadCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary-glow text-white">
                  {uploadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onViewChange('camera')}
              className={`
                flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium
                transition-all duration-200 relative
                ${currentView === 'camera'
                  ? 'text-primary-foreground bg-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <Camera className="w-4 h-4" />
              <span>Camera</span>
              {cameraCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white">
                  {cameraCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onViewChange('trash')}
              className={`
                flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium
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
          <div className="hidden sm:flex items-center space-x-4 w-full sm:w-auto justify-center sm:justify-end mt-2 sm:mt-0">
            <ThemeToggle />
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden absolute top-16 left-0 w-full bg-background border-b border-muted shadow-lg z-50 flex flex-col items-center space-y-2 py-4 animate-fade-in">
              <div className="flex flex-col w-full items-center space-y-2">
                <button
                  onClick={() => { onViewChange('uploads'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium w-11/12 justify-center ${currentView === 'uploads' ? 'text-primary-foreground bg-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Uploads</span>
                  {uploadCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary-glow text-white">{uploadCount}</span>
                  )}
                </button>
                <button
                  onClick={() => { onViewChange('camera'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium w-11/12 justify-center ${currentView === 'camera' ? 'text-primary-foreground bg-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Camera</span>
                  {cameraCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-green-500 text-white">{cameraCount}</span>
                  )}
                </button>
                <button
                  onClick={() => { onViewChange('trash'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium w-11/12 justify-center ${currentView === 'trash' ? 'text-primary-foreground bg-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Trash</span>
                  {deletedCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">{deletedCount}</span>
                  )}
                </button>
              </div>
              <div className="flex w-full items-center justify-center mt-2">
                <ThemeToggle />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
}