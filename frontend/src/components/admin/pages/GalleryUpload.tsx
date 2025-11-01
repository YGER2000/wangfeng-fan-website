import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  X,
  Image as ImageIcon,
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { TagData } from '@/utils/api';
import TagSelectionPanel from '@/components/admin/shared/TagSelectionPanel';
import SimpleToast, { ToastType } from '@/components/ui/SimpleToast';

interface UploadedImage {
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  uploadedUrls?: {
    original: string;
    medium: string;
    thumb: string;
  };
  error?: string;
}

const categoryOptions = [
  { value: '巡演返图', label: '巡演返图' },
  { value: '工作花絮', label: '工作花絮' },
  { value: '日常生活', label: '日常生活' }
];

const GalleryUpload = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const navigate = useNavigate();

  // 步骤管理
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // 图组信息
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('巡演返图');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // 标签数据
  const [selectedTags, setSelectedTags] = useState<TagData[]>([]);

  // 图片上传
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);

  // Toast 提示
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // 生成标签上下文文本
  const tagContext = useMemo(
    () => [
      title,
      description,
      category
    ].filter(Boolean).join(' '),
    [title, description, category]
  );

  // 处理下一步
  const handleNextStep = () => {
    if (!title.trim()) {
      setToast({ message: '请输入图组标题', type: 'error' });
      return;
    }
    if (images.length === 0) {
      setToast({ message: '请至少上传一张图片', type: 'error' });
      return;
    }
    setCurrentStep(2);
  };

  // 处理上一步
  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const
      }));

    setImages(prev => [...prev, ...newImages]);
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // 拖放处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // 上传单张图片 - 返回更新后的图片对象
  const uploadSingleImage = async (image: UploadedImage, index: number): Promise<UploadedImage> => {
    try {
      const formData = new FormData();
      formData.append('file', image.file);

      const token = localStorage.getItem('access_token');
      console.log('开始上传图片', index + 1);

      const response = await fetch('http://localhost:1994/api/gallery/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('上传失败:', response.status, errorText);
        throw new Error(`上传失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('上传成功，返回结果:', result);

      const updatedImage: UploadedImage = {
        ...image,
        status: 'success',
        uploadedUrls: {
          original: result.file_url,
          medium: result.medium_url,
          thumb: result.thumb_url
        }
      };

      return updatedImage;
    } catch (error) {
      console.error('上传图片出错:', error);
      return {
        ...image,
        status: 'error',
        error: error instanceof Error ? error.message : '上传失败'
      };
    }
  };

  // 提交图组
  const handleSubmit = async () => {
    if (currentStep !== 2) {
      setToast({ message: '请先完成基础信息填写', type: 'error' });
      return;
    }

    if (!title.trim()) {
      setToast({ message: '请输入图组标题', type: 'error' });
      return;
    }

    if (images.length === 0) {
      setToast({ message: '请至少上传一张图片', type: 'error' });
      return;
    }

    setIsUploading(true);

    try {
      console.log('=== 开始提交图组 ===');
      console.log('总图片数:', images.length);

      // 1. 上传所有图片 - 收集所有上传后的图片对象
      const uploadedImages: UploadedImage[] = [];
      for (let i = 0; i < images.length; i++) {
        if (images[i].status === 'success') {
          uploadedImages.push(images[i]);
          continue;
        }

        setImages(prev => {
          const newImages = [...prev];
          newImages[i] = { ...newImages[i], status: 'uploading' };
          return newImages;
        });

        const uploadedImage = await uploadSingleImage(images[i], i);
        uploadedImages.push(uploadedImage);

        // 更新UI状态
        setImages(prev => {
          const newImages = [...prev];
          newImages[i] = uploadedImage;
          return newImages;
        });

        setUploadProgress(Math.round(((i + 1) / images.length) * 100));
      }

      const successfulImages = uploadedImages.filter(img => img.status === 'success');
      const successCount = successfulImages.length;

      console.log('上传完成，成功:', successCount, '失败:', uploadedImages.length - successCount);

      if (successCount === 0) {
        setToast({ message: '所有图片上传失败', type: 'error' });
        setIsUploading(false);
        return;
      }

      // 2. 创建图组
      const token = localStorage.getItem('access_token');

      // 获取第一张成功上传的图片作为封面
      const firstSuccessImage = successfulImages[0];

      console.log('=== 准备创建图组 ===');
      console.log('封面图URL:', firstSuccessImage.uploadedUrls);
      console.log('成功的图片数:', successfulImages.length);

      const photoGroupData = {
        title,
        category,
        date: new Date(date).toISOString(),
        display_date: new Date(date).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        year: new Date(date).getFullYear().toString(),
        description: description || null,
        cover_image_url: firstSuccessImage.uploadedUrls?.original || '',
        cover_image_thumb_url: firstSuccessImage.uploadedUrls?.thumb || '',
        storage_type: 'oss',
        is_published: false,  // 提交审核时不发布
        review_status: 'pending',  // 待审核状态
        tags: selectedTags.map(tag => tag.display_name || tag.name || tag.value).filter(Boolean).join(',')
      };

      console.log('发送图组创建请求:', photoGroupData);

      const groupResponse = await fetch('http://localhost:1994/api/gallery/admin/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(photoGroupData)
      });

      if (!groupResponse.ok) {
        const errorText = await groupResponse.text();
        console.error('创建图组失败:', groupResponse.status, errorText);
        throw new Error(`创建图组失败: ${groupResponse.status}`);
      }

      const photoGroup = await groupResponse.json();
      console.log('图组创建成功:', photoGroup);

      // 3. 添加图片到图组
      console.log('=== 开始添加图片到图组 ===');
      console.log('待添加图片数:', successfulImages.length);

      for (let i = 0; i < successfulImages.length; i++) {
        const image = successfulImages[i];
        const photoData = {
          photo_group_id: photoGroup.id,
          original_filename: image.file.name,
          image_url: image.uploadedUrls!.original,
          image_medium_url: image.uploadedUrls!.medium,
          image_thumb_url: image.uploadedUrls!.thumb,
          file_size: image.file.size,
          mime_type: image.file.type,
          storage_type: 'oss',
          storage_path: image.uploadedUrls!.original,
          sort_order: i
        };

        console.log(`添加图片 ${i + 1}/${successfulImages.length}:`, photoData);

        const photoResponse = await fetch('http://localhost:1994/api/gallery/admin/photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(photoData)
        });

        if (!photoResponse.ok) {
          const errorText = await photoResponse.text();
          console.error(`添加图片 ${i + 1} 失败:`, photoResponse.status, errorText);
        } else {
          const photoResult = await photoResponse.json();
          console.log(`图片 ${i + 1} 添加成功:`, photoResult);
        }
      }

      console.log('=== 图组创建完成 ===');
      setToast({ message: '图组已提交审核！', type: 'success' });
      setTimeout(() => navigate('/admin/gallery/list'), 1500);
    } catch (error) {
      console.error('=== 提交失败 ===', error);
      setToast({ message: '提交失败: ' + (error instanceof Error ? error.message : '未知错误'), type: 'error' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className={cn(
      "h-full flex flex-col",
      isLight ? "bg-gray-50" : "bg-transparent"
    )}>
      {/* 顶部标题栏 */}
      <div className={cn(
        "flex-shrink-0 border-b px-6 py-4",
        isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="h-6 w-6 text-wangfeng-purple" />
            <h1 className={cn(
              "text-2xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>
              上传图组
              <span className={cn(
                "text-sm font-normal ml-2",
                isLight ? "text-gray-500" : "text-gray-400"
              )}>
                步骤 {currentStep}/2
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/gallery/list')}
              className={cn(
                "px-4 py-2 rounded-lg border transition-colors text-sm font-medium",
                isLight
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "border-wangfeng-purple/30 text-gray-300 hover:bg-wangfeng-purple/10"
              )}
            >
              返回列表
            </button>
            {currentStep === 1 && (
              <button
                onClick={handleNextStep}
                className="px-5 py-2 bg-wangfeng-purple text-white rounded-lg text-sm font-medium hover:bg-wangfeng-purple/90 transition-colors flex items-center gap-2"
              >
                下一步
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {currentStep === 2 && (
              <>
                <button
                  onClick={handlePrevStep}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isLight
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  )}
                >
                  上一步
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || !title.trim() || images.length === 0}
                  className={cn(
                    "px-6 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2",
                    "bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90",
                    (isUploading || !title.trim() || images.length === 0) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isUploading && <Loader className="h-4 w-4 animate-spin" />}
                  {isUploading ? `上传中 ${uploadProgress}%` : '提交审核'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 步骤1: 基础信息和图片上传 */}
          {currentStep === 1 && (
            <>
              {/* 图组信息表单 */}
              <div className={cn(
            "rounded-lg border p-6",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <h2 className={cn(
              "text-lg font-semibold mb-4 flex items-center gap-2",
              isLight ? "text-gray-900" : "text-white"
            )}>
              <FileText className="h-5 w-5 text-wangfeng-purple" />
              图组信息
            </h2>

            <div className="space-y-4">
              {/* 标题 */}
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-2",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：UNFOLLOW上海站"
                  className={cn(
                    "w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                    isLight
                      ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  )}
                />
              </div>

              {/* 日期 */}
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-2 flex items-center gap-1",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  <Calendar className="h-4 w-4" />
                  日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                    isLight
                      ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  )}
                />
              </div>

              {/* 描述 */}
              <div>
                <label className={cn(
                  "block text-sm font-medium mb-2",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  描述（可选）
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="添加图组描述..."
                  rows={3}
                  className={cn(
                    "w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 resize-none",
                    isLight
                      ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                      : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                  )}
                />
              </div>
            </div>
          </div>

          {/* 图片上传区域 */}
          <div className={cn(
            "rounded-lg border p-6",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <h2 className={cn(
              "text-lg font-semibold mb-4 flex items-center gap-2",
              isLight ? "text-gray-900" : "text-white"
            )}>
              <ImageIcon className="h-5 w-5 text-wangfeng-purple" />
              上传图片
            </h2>

            {/* 拖拽上传区域 */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-wangfeng-purple bg-wangfeng-purple/10"
                  : isLight
                  ? "border-gray-300 hover:border-wangfeng-purple"
                  : "border-wangfeng-purple/30 hover:border-wangfeng-purple"
              )}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className={cn(
                "h-12 w-12 mx-auto mb-4",
                isLight ? "text-gray-400" : "text-gray-500"
              )} />
              <p className={cn(
                "text-sm mb-2",
                isLight ? "text-gray-600" : "text-gray-400"
              )}>
                拖拽图片到这里，或点击选择文件
              </p>
              <p className={cn(
                "text-xs",
                isLight ? "text-gray-500" : "text-gray-500"
              )}>
                支持 JPG、PNG、WebP 格式，单个文件最大 20MB
              </p>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* 图片预览 */}
            {images.length > 0 && (
              <div className="mt-6">
                <p className={cn(
                  "text-sm font-medium mb-3",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  已选择 {images.length} 张图片
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={cn(
                        "relative group rounded-lg overflow-hidden border",
                        isLight ? "border-gray-200" : "border-wangfeng-purple/20"
                      )}
                    >
                      <img
                        src={image.preview}
                        alt={`预览 ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />

                      {/* 状态覆盖层 */}
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        {image.status === 'pending' && (
                          <span className="text-white text-xs">待上传</span>
                        )}
                        {image.status === 'uploading' && (
                          <Loader className="h-6 w-6 text-white animate-spin" />
                        )}
                        {image.status === 'success' && (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        )}
                        {image.status === 'error' && (
                          <AlertCircle className="h-6 w-6 text-red-500" />
                        )}
                      </div>

                      {/* 删除按钮 */}
                      {image.status === 'pending' && (
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
              </>
            )}

          {/* 步骤2: 分类与标签 */}
          {currentStep === 2 && (
            <>
              {/* 分类选择 */}
              <div className={cn(
                "rounded-lg border p-6",
                isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
              )}>
                <h2 className={cn(
                  "text-lg font-semibold mb-4 pb-2 border-b",
                  isLight ? "text-gray-900 border-gray-200" : "text-white border-wangfeng-purple/20"
                )}>
                  图组分类
                </h2>

                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2 flex items-center gap-1",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    <Tag className="h-4 w-4" />
                    分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                      isLight
                        ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                    )}
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 标签管理 */}
              <TagSelectionPanel
                contextText={tagContext}
                selectedTags={selectedTags}
                onChange={setSelectedTags}
                isLight={isLight}
                infoMessage="我们会根据图组标题、描述、分类等信息推荐相关标签，也可以搜索或直接创建新标签。"
              />
            </>
          )}
        </div>
      </div>

      {/* Toast 提示 */}
      {toast && (
        <SimpleToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default GalleryUpload;
