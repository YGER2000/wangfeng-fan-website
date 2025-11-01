import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
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

  const handleResetZoom = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={cn(
        "relative w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden border shadow-2xl flex flex-col",
        isLight ? "bg-white border-gray-200" : "bg-black/95 border-wangfeng-purple/40"
      )}>
        {/* 顶部标题栏 */}
        <div className={cn(
          "flex items-center justify-between px-6 py-4 border-b flex-shrink-0",
          isLight ? "bg-gray-50 border-gray-200" : "bg-black/50 border-wangfeng-purple/30"
        )}>
          <div>
            <h3 className={cn("text-lg font-bold", isLight ? "text-gray-900" : "text-white")}>
              编辑封面图片
            </h3>
            <p className={cn("text-xs mt-1", isLight ? "text-gray-500" : "text-gray-400")}>
              拖动、缩放和旋转图片来调整合适的位置
            </p>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-white/10",
              isLight ? "text-gray-600" : "text-gray-400"
            )}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 裁剪区域 - 占据中间部分 */}
        <div className="flex-1 overflow-hidden relative bg-black">
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
            showGrid={true}
            gridColor="rgba(139, 92, 246, 0.2)"
          />

          {/* 宽高比标签 */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
            <p className="text-white text-xs font-semibold">{aspect.toFixed(2)} : 1</p>
          </div>
        </div>

        {/* 底部控制栏 */}
        <div className={cn(
          "px-6 py-6 border-t flex-shrink-0",
          isLight ? "bg-gray-50 border-gray-200" : "bg-black/50 border-wangfeng-purple/30"
        )}>
          {/* 工具按钮 - 单一行 */}
          <div className="flex items-center justify-between gap-4">
            {/* 缩放控制 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(1, zoom - 0.2))}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  isLight
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
                title="缩小"
              >
                <ZoomOut className="h-5 w-5" />
              </button>

              <input
                type="number"
                value={Math.round(zoom * 100)}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setZoom(Math.max(100, Math.min(300, val)) / 100);
                  }
                }}
                min="100"
                max="300"
                className={cn(
                  "w-16 px-3 py-2.5 rounded-lg border text-center font-semibold text-sm",
                  isLight
                    ? "bg-white border-gray-300 text-gray-900"
                    : "bg-black/40 border-wangfeng-purple/30 text-white"
                )}
              />

              <span className={cn("text-sm font-medium", isLight ? "text-gray-600" : "text-gray-400")}>
                %
              </span>

              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.2))}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  isLight
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
                title="放大"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
            </div>

            {/* 旋转控制 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  isLight
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
                title="逆时针旋转90°"
              >
                <RotateCcw className="h-5 w-5" />
              </button>

              <input
                type="number"
                value={rotation}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setRotation(((val % 360) + 360) % 360);
                  }
                }}
                min="0"
                max="359"
                className={cn(
                  "w-16 px-3 py-2.5 rounded-lg border text-center font-semibold text-sm",
                  isLight
                    ? "bg-white border-gray-300 text-gray-900"
                    : "bg-black/40 border-wangfeng-purple/30 text-white"
                )}
              />

              <span className={cn("text-sm font-medium", isLight ? "text-gray-600" : "text-gray-400")}>
                °
              </span>

              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  isLight
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
                title="顺时针旋转90°"
              >
                <RotateCcw className="h-5 w-5 transform scale-x-[-1]" />
              </button>
            </div>

            {/* 重置和操作按钮 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetZoom}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                  isLight
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
                title="重置缩放和位置"
              >
                <Maximize2 className="h-4 w-4" />
                重置
              </button>

              <button
                onClick={onClose}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  isLight
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                )}
              >
                取消
              </button>

              <button
                onClick={handleCropConfirm}
                disabled={isProcessing}
                className="px-8 py-2.5 bg-gradient-to-r from-wangfeng-purple to-wangfeng-light text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-wangfeng-purple/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {isProcessing ? '处理中...' : '确认裁剪'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
