import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

interface IJewelViewerProps {
  ijewelUrl: string;
  productName: string;
  className?: string;
  height?: string;
  showFullscreenButton?: boolean;
  lazy?: boolean;
}

const IJewelViewer: React.FC<IJewelViewerProps> = ({
  ijewelUrl,
  productName,
  className,
  height = '500px',
  showFullscreenButton = true,
  lazy = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isVisible]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleFullscreen = () => {
    setIsFullscreen(true);
  };

  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Validate iJewel URL
  const isValidIJewelUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'ijewel.design' && urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  if (!isValidIJewelUrl(ijewelUrl)) {
    return (
      <div className={cn("rounded-2xl border border-red-200 bg-red-50 p-6", className)}>
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <div>
            <h3 className="font-medium">Invalid 3D Viewer URL</h3>
            <p className="text-sm text-red-600">
              The 3D model URL must be from ijewel.design
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gray-50",
          className
        )}
        style={{ height }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h3 className="font-medium text-sm">3D Model Viewer</h3>
              <p className="text-xs opacity-90">{productName}</p>
            </div>
            <div className="flex items-center gap-2">
              {hasError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReload}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
              {showFullscreenButton && !hasError && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleFullscreen}
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && isVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading 3D Model...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Failed to Load 3D Model</h3>
              <p className="text-sm text-gray-600 mb-4">
                There was an error loading the 3D viewer. Please try again.
              </p>
              <Button onClick={handleReload} size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Lazy Loading Placeholder */}
        {!isVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Maximize2 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600">3D Model Viewer</p>
              <p className="text-xs text-gray-500">Scroll down to load</p>
            </div>
          </div>
        )}

        {/* iFrame */}
        {isVisible && (
          <iframe
            ref={iframeRef}
            src={ijewelUrl}
            title={`3D Model Viewer - ${productName}`}
            width="100%"
            height="100%"
            allowFullScreen
            loading="lazy"
            className={cn(
              "w-full h-full border-0 transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        )}

        {/* Controls Overlay */}
        {/* {!isLoading && !hasError && isVisible && (
          <div className="abqsolute bottom-4 left-4 right-4">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-white text-xs text-center">
                Use mouse to rotate • Scroll to zoom • Drag to pan
              </p>
            </div>
          </div>
        )} */}
      </div>

      {/* Fullscreen Modal */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <DialogHeader className="absolute top-4 left-4 right-4 z-10 bg-black/50 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white">
                3D Model Viewer - {productName}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="w-full h-full">
            <iframe
              src={ijewelUrl}
              title={`3D Model Viewer Fullscreen - ${productName}`}
              width="100%"
              height="100%"
              allowFullScreen
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IJewelViewer;