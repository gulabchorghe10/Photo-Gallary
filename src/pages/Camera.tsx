import React from 'react';
import { CameraCapture } from '../components/CameraCapture';

export default function Camera() {
  // Always open, no close button for page
  return (
    <div className="min-h-screen bg-black">
      <CameraCapture isOpen={true} onClose={() => {}} />
    </div>
  );
} 