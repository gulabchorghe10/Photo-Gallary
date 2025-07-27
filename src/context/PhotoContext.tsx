import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { photoDB } from '@/lib/database';
import { DatabasePhoto } from '@/lib/supabase';

export interface Photo {
  id: string;
  url: string;
  file?: File; // Optional since we don't always have the file object
  name: string;
  size: number;
  addedAt: Date;
  deletedAt?: Date;
  status: 'active' | 'deleted' | 'permanently-deleted';
  source: 'upload' | 'camera';
}

interface PhotoState {
  photos: Photo[];
  loading: boolean;
  selectedPhoto: Photo | null;
}

type PhotoAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_PHOTOS'; payload: Photo[] }
  | { type: 'DELETE_PHOTO'; payload: string }
  | { type: 'RESTORE_PHOTO'; payload: string }
  | { type: 'PERMANENTLY_DELETE_PHOTO'; payload: string }
  | { type: 'SET_SELECTED_PHOTO'; payload: Photo | null }
  | { type: 'LOAD_PHOTOS'; payload: Photo[] }
  | { type: 'CLEANUP_OLD_PHOTOS' };

const initialState: PhotoState = {
  photos: [],
  loading: false,
  selectedPhoto: null,
};

function photoReducer(state: PhotoState, action: PhotoAction): PhotoState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'ADD_PHOTOS':
      return { 
        ...state, 
        photos: [...state.photos, ...action.payload],
        loading: false 
      };
    
    case 'DELETE_PHOTO':
      return {
        ...state,
        photos: state.photos.map(photo =>
          photo.id === action.payload
            ? { ...photo, status: 'deleted' as const, deletedAt: new Date() }
            : photo
        )
      };
    
    case 'RESTORE_PHOTO':
      return {
        ...state,
        photos: state.photos.map(photo =>
          photo.id === action.payload
            ? { ...photo, status: 'active' as const, deletedAt: undefined }
            : photo
        )
      };
    
    case 'PERMANENTLY_DELETE_PHOTO':
      return {
        ...state,
        photos: state.photos.filter(photo => photo.id !== action.payload)
      };
    
    case 'SET_SELECTED_PHOTO':
      return { ...state, selectedPhoto: action.payload };
    
    case 'LOAD_PHOTOS':
      return { ...state, photos: action.payload };
    
    case 'CLEANUP_OLD_PHOTOS':
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      return {
        ...state,
        photos: state.photos.filter(photo => {
          if (photo.status === 'deleted' && photo.deletedAt) {
            return photo.deletedAt > tenDaysAgo;
          }
          return true;
        })
      };
    
    default:
      return state;
  }
}

interface PhotoContextType {
  state: PhotoState;
  addPhotos: (files: File[], source?: 'upload' | 'camera') => void;
  deletePhoto: (id: string) => void;
  restorePhoto: (id: string) => void;
  permanentlyDeletePhoto: (id: string) => void;
  setSelectedPhoto: (photo: Photo | null) => void;
  getActivePhotos: () => Photo[];
  getDeletedPhotos: () => Photo[];
  getCameraPhotos: () => Photo[];
  getUploadedPhotos: () => Photo[];
  getPhotoTimeInfo: (photo: Photo) => { addedText: string; deletedText?: string };
}

const PhotoContext = createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(photoReducer, initialState);

  // Load photos from database on mount
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const dbPhotos = await photoDB.getPhotos();
        
        // Convert database format to app format
        const photos: Photo[] = dbPhotos.map((dbPhoto: DatabasePhoto) => ({
          id: dbPhoto.id,
          url: dbPhoto.url,
          name: dbPhoto.name,
          size: dbPhoto.size,
          addedAt: new Date(dbPhoto.added_at),
          deletedAt: dbPhoto.deleted_at ? new Date(dbPhoto.deleted_at) : undefined,
          status: dbPhoto.status,
          source: dbPhoto.source,
        }));
        
        dispatch({ type: 'LOAD_PHOTOS', payload: photos });
      } catch (error) {
        console.error('Error loading photos from database:', error);
        // Fallback to localStorage if database fails
        const savedPhotos = localStorage.getItem('photos');
        if (savedPhotos) {
          try {
            const parsedPhotos = JSON.parse(savedPhotos).map((photo: any) => ({
              ...photo,
              addedAt: new Date(photo.addedAt),
              deletedAt: photo.deletedAt ? new Date(photo.deletedAt) : undefined,
            }));
            dispatch({ type: 'LOAD_PHOTOS', payload: parsedPhotos });
          } catch (localError) {
            console.error('Error loading photos from localStorage:', localError);
          }
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadPhotos();
  }, []);

  // Save photos to localStorage as backup whenever photos change
  useEffect(() => {
    if (state.photos.length > 0) {
      localStorage.setItem('photos', JSON.stringify(state.photos));
    }
  }, [state.photos]);

  // Cleanup old deleted photos on mount and periodically
  useEffect(() => {
    const cleanup = async () => {
      try {
        await photoDB.cleanupOldPhotos();
        dispatch({ type: 'CLEANUP_OLD_PHOTOS' });
      } catch (error) {
        console.error('Error cleaning up old photos:', error);
        dispatch({ type: 'CLEANUP_OLD_PHOTOS' });
      }
    };
    
    cleanup();
    
    const interval = setInterval(cleanup, 24 * 60 * 60 * 1000); // Check daily
    
    return () => clearInterval(interval);
  }, []);

  const addPhotos = async (files: File[], source: 'upload' | 'camera' = 'upload') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    const newPhotos: Photo[] = [];
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        try {
          // Upload to database
          const dbPhoto = await photoDB.uploadPhoto({
            file,
            name: file.name,
            size: file.size,
            source,
          });
          
          // Convert to app format
          const photo: Photo = {
            id: dbPhoto.id,
            url: dbPhoto.url,
            file,
            name: dbPhoto.name,
            size: dbPhoto.size,
            addedAt: new Date(dbPhoto.added_at),
            status: dbPhoto.status,
            source: dbPhoto.source,
          };
          
          newPhotos.push(photo);
        } catch (error) {
          console.error('Error uploading photo:', error);
          // Fallback to local storage
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const url = URL.createObjectURL(file);
          
          newPhotos.push({
            id,
            url,
            file,
            name: file.name,
            size: file.size,
            addedAt: new Date(),
            status: 'active',
            source,
          });
        }
      }
    }
    
    dispatch({ type: 'ADD_PHOTOS', payload: newPhotos });
  };

  const deletePhoto = async (id: string) => {
    try {
      await photoDB.deletePhoto(id);
      dispatch({ type: 'DELETE_PHOTO', payload: id });
    } catch (error) {
      console.error('Error deleting photo from database:', error);
      // Still update local state even if database fails
      dispatch({ type: 'DELETE_PHOTO', payload: id });
    }
  };

  const restorePhoto = async (id: string) => {
    try {
      await photoDB.restorePhoto(id);
      dispatch({ type: 'RESTORE_PHOTO', payload: id });
    } catch (error) {
      console.error('Error restoring photo from database:', error);
      // Still update local state even if database fails
      dispatch({ type: 'RESTORE_PHOTO', payload: id });
    }
  };

  const permanentlyDeletePhoto = async (id: string) => {
    try {
      await photoDB.permanentlyDeletePhoto(id);
      const photo = state.photos.find(p => p.id === id);
      if (photo && photo.file) {
        URL.revokeObjectURL(photo.url);
      }
      dispatch({ type: 'PERMANENTLY_DELETE_PHOTO', payload: id });
    } catch (error) {
      console.error('Error permanently deleting photo from database:', error);
      // Still update local state even if database fails
      const photo = state.photos.find(p => p.id === id);
      if (photo && photo.file) {
        URL.revokeObjectURL(photo.url);
      }
      dispatch({ type: 'PERMANENTLY_DELETE_PHOTO', payload: id });
    }
  };

  const setSelectedPhoto = (photo: Photo | null) => {
    dispatch({ type: 'SET_SELECTED_PHOTO', payload: photo });
  };

  const getActivePhotos = () => {
    return state.photos.filter(photo => photo.status === 'active');
  };

  const getDeletedPhotos = () => {
    return state.photos.filter(photo => photo.status === 'deleted');
  };

  const getCameraPhotos = () => {
    return state.photos.filter(photo => photo.status === 'active' && photo.source === 'camera');
  };

  const getUploadedPhotos = () => {
    return state.photos.filter(photo => photo.status === 'active' && photo.source === 'upload');
  };

  const getPhotoTimeInfo = (photo: Photo) => {
    const addedText = formatDistanceToNow(photo.addedAt, { addSuffix: true });
    const deletedText = photo.deletedAt 
      ? formatDistanceToNow(photo.deletedAt, { addSuffix: true })
      : undefined;
    
    return { addedText, deletedText };
  };

  return (
    <PhotoContext.Provider
      value={{
        state,
        addPhotos,
        deletePhoto,
        restorePhoto,
        permanentlyDeletePhoto,
        setSelectedPhoto,
        getActivePhotos,
        getDeletedPhotos,
        getCameraPhotos,
        getUploadedPhotos,
        getPhotoTimeInfo,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
}

export function usePhoto() {
  const context = useContext(PhotoContext);
  if (context === undefined) {
    throw new Error('usePhoto must be used within a PhotoProvider');
  }
  return context;
}