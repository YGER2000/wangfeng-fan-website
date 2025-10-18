import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCw } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ImageCropModalProps {
  image: string;
  onCropComplete: (croppedImage: File) => void;
  onClose: () => void;
  aspect?: number; // 默认 16/9
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const ImageCropModal = ({ image, onCropComplete, onClose, aspect = 16 / 9 }: ImageCropModalProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'white';

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法获取 canvas context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
      0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropConfirm = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels, rotation);
      const croppedFile = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' });
      onCropComplete(croppedFile);
    } catch (error) {
      console.error('裁剪图片失败:', error);
      alert('裁剪图片失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className={cn(
        "relative w-full max-w-4xl h-[80vh] mx-4 rounded-xl overflow-hidden border shadow-2xl",
        isLight ? "bg-white border-gray-200" : "bg-black/90 border-wangfeng-purple/30"
      )}>
        {/* 顶部操作栏 */}
        <div className={cn(
          "absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 border-b",
          isLight ? "bg-white/95 backdrop-blur-md border-gray-200" : "bg-black/95 backdrop-blur-md border-wangfeng-purple/30"
        )}>
          <h3 className={cn("text-lg font-semibold", isLight ? "text-gray-900" : "text-white")}>
            裁剪封面图片（16:9）
          </h3>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isLight ? "hover:bg-gray-100" : "hover:bg-white/10"
            )}
          >
            <X className={cn("h-5 w-5", isLight ? "text-gray-600" : "text-gray-400")} />
          </button>
        </div>

        {/* 裁剪区域 */}
        <div className="absolute inset-0 mt-16 mb-32">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropAreaChange}
          />
        </div>

        {/* 底部控制栏 */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 z-10 px-6 py-6 border-t space-y-4",
          isLight ? "bg-white/95 backdrop-blur-md border-gray-200" : "bg-black/95 backdrop-blur-md border-wangfeng-purple/30"
        )}>
          {/* 缩放控制 */}
          <div>
            <label className={cn("block text-sm font-medium mb-2", isLight ? "text-gray-700" : "text-gray-300")}>
              缩放
            </label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 旋转控制 */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className={cn("block text-sm font-medium mb-2", isLight ? "text-gray-700" : "text-gray-300")}>
                旋转
              </label>
              <input
                type="range"
                value={rotation}
                min={0}
                max={360}
                step={1}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className={cn(
                "mt-6 p-2 rounded-lg transition-colors",
                isLight
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  : "bg-white/10 hover:bg-white/20 text-gray-300"
              )}
              title="旋转90度"
            >
              <RotateCw className="h-5 w-5" />
            </button>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-colors",
                isLight
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              )}
            >
              取消
            </button>
            <button
              onClick={handleCropConfirm}
              disabled={isProcessing}
              className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              {isProcessing ? '处理中...' : '确认裁剪'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
