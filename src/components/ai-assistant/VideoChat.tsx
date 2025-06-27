import React, { useRef } from 'react';
import { Video } from 'lucide-react';
import Button from '../ui/Button';

interface VideoChatProps {
  showVideo: boolean;
  videoError: string | null;
  isVideoLoading: boolean;
  conversationUrl: "https://tavus.daily.co/c92d67ed8c787437" | null;
  setVideoError: (error: string | null) => void;
  setShowVideo: (show: boolean) => void;
}

const VideoChat: React.FC<VideoChatProps> = ({
  showVideo,
  videoError,
  isVideoLoading,
  conversationUrl,
  setVideoError,
  setShowVideo
}) => {
  const videoRef = useRef<HTMLIFrameElement>(null);

  return (
    <>
      {showVideo ? (
        videoError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <Video className="h-16 w-16 text-red-500 opacity-50 mb-4" />
            <p className="text-white text-sm mb-2">Video chat unavailable</p>
            <p className="text-gray-400 text-xs">{videoError}</p>
            <button 
              onClick={() => {setShowVideo(false); setVideoError(null);}}
              className="mt-4 px-3 py-1 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm"
            >
              Continue with Text Chat
            </button>
          </div>
        ) : isVideoLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mb-4"></div>
            <p className="text-white text-sm">Connecting to video chat...</p>
          </div>
        ) : conversationUrl ? (
          <>
            {console.log("Rendering iframe with URL:", conversationUrl)}
            <iframe
              ref={videoRef}
              src={conversationUrl}
              className="w-full h-full"
              allow="camera; microphone; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={(e) => {
                console.error("iframe error event:", e);
                setVideoError('Failed to load video chat');
                setShowVideo(false);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Video className="h-16 w-16 text-gray-700 opacity-30 mx-auto mb-4" />
              <p className="text-gray-500">Waiting for conversation to start...</p>
              {console.log("Waiting for conversation URL - current value:", conversationUrl)}
            </div>
          </div>
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Video className="h-16 w-16 text-gray-700 opacity-30 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Video chat disabled</p>
            <button 
              onClick={() => setShowVideo(true)}
              className="mt-4 px-3 py-1 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm"
            >
              Enable Video Chat
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoChat;