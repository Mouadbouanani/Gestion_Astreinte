import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, Bars4Icon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface DraggableSidebarProps {
  children: React.ReactNode;
  title?: string;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  draggable?: boolean;
  onClose?: () => void;
}

const DraggableSidebar: React.FC<DraggableSidebarProps> = ({
  children,
  title = 'Panel',
  defaultPosition = { x: 20, y: 20 },
  defaultSize = { width: 320, height: 600 },
  minWidth = 280,
  minHeight = 400,
  maxWidth = 600,
  maxHeight = 800,
  resizable = true,
  draggable = true,
  onClose
}) => {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const sidebarRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!resizable) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
        
        setPosition({ x: newX, y: newY });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width + deltaX));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height + deltaY));
        
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, size, minWidth, minHeight, maxWidth, maxHeight]);

  return (
    <div
      ref={sidebarRef}
      className={`fixed bg-white shadow-2xl rounded-lg border border-gray-200 z-50 
        ${isDragging ? 'cursor-grabbing' : ''} ${isResizing ? 'cursor-se-resize' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        transition: isDragging || isResizing ? 'none' : 'all 0.2s ease-in-out'
      }}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg 
          ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center space-x-2">
          <Bars4Icon className="h-4 w-4 text-gray-500" />
          <h3 className="font-medium text-gray-900 select-none">{title}</h3>
        </div>
        
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <XMarkIcon className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4" style={{ height: size.height - 60 }}>
        {children}
      </div>

      {/* Resize handle */}
      {resizable && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
        </div>
      )}
    </div>
  );
};

export default DraggableSidebar;