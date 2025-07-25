import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

export interface Photo {
  id: string;
  url: string;
  file: File;
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

  // Load photos from localStorage on mount
  useEffect(() => {
    const savedPhotos = localStorage.getItem('photos');
    if (savedPhotos) {
      try {
        const parsedPhotos = JSON.parse(savedPhotos).map((photo: any) => ({
          ...photo,
          addedAt: new Date(photo.addedAt),
          deletedAt: photo.deletedAt ? new Date(photo.deletedAt) : undefined,
        }));
        dispatch({ type: 'LOAD_PHOTOS', payload: parsedPhotos });
      } catch (error) {
        console.error('Error loading photos from localStorage:', error);
      }
    }
  }, []);

  // Save photos to localStorage whenever photos change
  useEffect(() => {
    if (state.photos.length > 0) {
      localStorage.setItem('photos', JSON.stringify(state.photos));
    }
  }, [state.photos]);

  // Cleanup old deleted photos on mount and periodically
  useEffect(() => {
    dispatch({ type: 'CLEANUP_OLD_PHOTOS' });
    
    const interval = setInterval(() => {
      dispatch({ type: 'CLEANUP_OLD_PHOTOS' });
    }, 24 * 60 * 60 * 1000); // Check daily
    
    return () => clearInterval(interval);
  }, []);

  const addPhotos = async (files: File[], source: 'upload' | 'camera' = 'upload') => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    const newPhotos: Photo[] = [];
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
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
    
    dispatch({ type: 'ADD_PHOTOS', payload: newPhotos });
  };

  const deletePhoto = (id: string) => {
    dispatch({ type: 'DELETE_PHOTO', payload: id });
  };

  const restorePhoto = (id: string) => {
    dispatch({ type: 'RESTORE_PHOTO', payload: id });
  };

  const permanentlyDeletePhoto = (id: string) => {
    const photo = state.photos.find(p => p.id === id);
    if (photo) {
      URL.revokeObjectURL(photo.url);
    }
    dispatch({ type: 'PERMANENTLY_DELETE_PHOTO', payload: id });
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