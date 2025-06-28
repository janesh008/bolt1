import React, { useRef, useEffect } from 'react';
import { Video } from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from 'react-i18next';
import { isValidConversationUrl } from '../../utils/videoUtils';

interface VideoChatProps {
  showVideo: boolean;
  videoError: string | null;
  isVideoLoading: boolean;
  conversationUrl: string | null;
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
  const { t } = useTranslation();
  const videoRef = useRef<HTMLIFrameElement>(null);
  
  // Validate conversation URL when it changes
  useEffect(() => {
    if (conversationUrl) {
      console.log("Validating conversation URL:", conversationUrl);
      const isValid = isValidConversationUrl(conversationUrl);
      console.log("URL is valid:", isValid);
      
      if (!isValid) {
        console.error("Invalid conversation URL format:", conversationUrl);
        setVideoError(t('assistant.errors.videoFailed'));
      }
    }
  }, [conversationUrl, setVideoError, t]);

  return (
    <>
      {showVideo ? (
        videoError ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            <Video className="h-16 w-16 text-red-500 opacity-50 mb-4" />
            <p className="text-white text-sm mb-2">{t('assistant.errors.videoFailed')}</p>
            <button 
              onClick={() => {setShowVideo(false); setVideoError(null);}}
              className="mt-4 px-3 py-1 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm"
            >
              {t('common.continue')}
            </button>
          </div>
        ) : isVideoLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-gold-200 border-t-gold-500 rounded-full animate-spin mb-4"></div>
            <p className="text-white text-sm">{t('common.loading')}</p>
          </div>
        ) : conversationUrl && isValidConversationUrl(conversationUrl) ? (
          <>
            <iframe
              ref={videoRef}
              src={conversationUrl}
              className="w-full h-full"
              allow="camera; microphone; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onError={(e) => {
                console.error("iframe error event:", e);
                setVideoError(t('assistant.errors.videoFailed'));
                setShowVideo(false);
              }}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Video className="h-16 w-16 text-gray-700 opacity-30 mx-auto mb-4" />
              <p className="text-gray-500">{t('assistant.errors.connectionError')}</p>
            </div>
          </div>
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Video className="h-16 w-16 text-gray-700 opacity-30 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">{t('assistant.errors.videoFailed')}</p>
            <button 
              onClick={() => setShowVideo(true)}
              className="mt-4 px-3 py-1 bg-gold-400 hover:bg-gold-500 text-white rounded-md text-sm"
            >
              {t('assistant.actions.startChat')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoChat;