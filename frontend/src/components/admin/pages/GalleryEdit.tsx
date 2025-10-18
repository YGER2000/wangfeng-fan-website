import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Trash2,
  GripVertical,
  Save
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  photo_group_id: string;
  original_filename?: string;
  title?: string;
  description?: string;
  image_url: string;
  image_thumb_url?: string;
  image_medium_url?: string;
  file_size?: number;
  width?: number;
  height?: number;
  mime_type?: string;
  storage_type: string;
  storage_path: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface PhotoGroup {
  id: string;
  title: string;
  category: string;
  date: string;
  display_date: string;
  year: string;
  description?: string;
  cover_image_url?: string;
  cover_image_thumb_url?: string;
  storage_type: string;
  is_published: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

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

const GalleryEdit = () => {
  const { theme } = useTheme();
  const isLight = theme === 'white';
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // 照片组信息
  const [photoGroup, setPhotoGroup] = useState<PhotoGroup | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('巡演返图');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // 现有照片
  const [existingPhotos, setExistingPhotos] = useState<Photo[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);

  // 新上传的图片
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);

  // 状态
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (id) {
      loadPhotoGroup();
    }
  }, [id]);

  const loadPhotoGroup = async () => {
    try {
      const token = localStorage.getItem('access_token');

      // 获取照片组详情
      const groupResponse = await fetch(`http://localhost:1994/api/gallery/groups/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!groupResponse.ok) {
        throw new Error('加载照片组失败');
      }

      const groupData = await groupResponse.json();
      setPhotoGroup(groupData);
      setTitle(groupData.title);
      setCategory(groupData.category);
      setDate(new Date(groupData.date).toISOString().split('T')[0]);
      setDescription(groupData.description || '');
      setIsPublished(groupData.is_published);
      setExistingPhotos(groupData.photos || []);
    } catch (error) {
      console.error('加载照片组失败:', error);
      alert('加载照片组失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理文件选择
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const images: UploadedImage[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'pending' as const
      }));

    setNewImages(prev => [...prev, ...images]);
  };

  // 移除新图片
  const removeNewImage = (index: number) => {
    setNewImages(prev => {
      const newArr = [...prev];
      URL.revokeObjectURL(newArr[index].preview);
      newArr.splice(index, 1);
      return newArr;
    });
  };

  // 删除现有照片
  const deleteExistingPhoto = (photoId: string) => {
    setDeletedPhotoIds(prev => [...prev, photoId]);
    setExistingPhotos(prev => prev.filter(p => p.id !== photoId));
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

  // 上传单张图片
  const uploadSingleImage = async (image: UploadedImage, index: number): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', image.file);

      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:1994/api/gallery/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const result = await response.json();

      setNewImages(prev => {
        const arr = [...prev];
        arr[index] = {
          ...arr[index],
          status: 'success',
          uploadedUrls: {
            original: result.file_url,
            medium: result.medium_url,
            thumb: result.thumb_url
          }
        };
        return arr;
      });

      return true;
    } catch (error) {
      setNewImages(prev => {
        const arr = [...prev];
        arr[index] = {
          ...arr[index],
          status: 'error',
          error: error instanceof Error ? error.message : '上传失败'
        };
        return arr;
      });
      return false;
    }
  };

  // 保存更改
  const handleSave = async () => {
    if (!title.trim() || !id) {
      alert('请输入标题');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('access_token');

      // 1. 上传新图片
      for (let i = 0; i < newImages.length; i++) {
        if (newImages[i].status === 'success') continue;

        setNewImages(prev => {
          const arr = [...prev];
          arr[i] = { ...arr[i], status: 'uploading' };
          return arr;
        });

        await uploadSingleImage(newImages[i], i);
      }

      // 2. 更新照片组信息
      const groupUpdateData = {
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
        is_published: isPublished
      };

      const groupResponse = await fetch(`http://localhost:1994/api/gallery/admin/groups/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(groupUpdateData)
      });

      if (!groupResponse.ok) {
        throw new Error('更新照片组失败');
      }

      // 3. 删除标记为删除的照片
      for (const photoId of deletedPhotoIds) {
        await fetch(`http://localhost:1994/api/gallery/admin/photos/${photoId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      // 4. 添加新照片
      const successfulImages = newImages.filter(img => img.status === 'success');
      const currentMaxOrder = existingPhotos.length > 0
        ? Math.max(...existingPhotos.map(p => p.sort_order))
        : -1;

      for (let i = 0; i < successfulImages.length; i++) {
        const image = successfulImages[i];
        const photoData = {
          photo_group_id: id,
          original_filename: image.file.name,
          image_url: image.uploadedUrls!.original,
          image_medium_url: image.uploadedUrls!.medium,
          image_thumb_url: image.uploadedUrls!.thumb,
          file_size: image.file.size,
          mime_type: image.file.type,
          storage_type: 'local',
          storage_path: image.uploadedUrls!.original,
          sort_order: currentMaxOrder + i + 1
        };

        await fetch('http://localhost:1994/api/gallery/admin/photos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(photoData)
        });
      }

      alert('保存成功！');
      navigate('/admin/gallery/list');
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  // 删除照片组
  const handleDelete = async () => {
    if (!id) return;

    if (!confirm('确定要删除这个照片组吗？此操作不可恢复。')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:1994/api/gallery/admin/groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      alert('删除成功！');
      navigate('/admin/gallery/list');
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "h-full flex items-center justify-center",
        isLight ? "bg-gray-50" : "bg-black"
      )}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wangfeng-purple"></div>
          <p className={cn("text-sm", isLight ? "text-gray-600" : "text-gray-400")}>
            加载中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-full flex flex-col",
      isLight ? "bg-gray-50" : "bg-black"
    )}>
      {/* 顶部标题栏 */}
      <div className={cn(
        "flex-shrink-0 border-b px-6 py-4",
        isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-wangfeng-purple" />
            <h1 className={cn(
              "text-2xl font-bold",
              isLight ? "text-gray-900" : "text-white"
            )}>
              编辑照片组
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={saving}
              className={cn(
                "px-4 py-2 rounded-lg border transition-colors text-sm font-medium flex items-center gap-2",
                "border-red-500 text-red-500 hover:bg-red-500 hover:text-white",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              <Trash2 className="h-4 w-4" />
              删除照片组
            </button>

            <button
              onClick={() => navigate('/admin/gallery/list')}
              disabled={saving}
              className={cn(
                "px-4 py-2 rounded-lg border transition-colors text-sm font-medium",
                isLight
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "border-wangfeng-purple/30 text-gray-300 hover:bg-wangfeng-purple/10",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              取消
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 照片组信息表单 */}
          <div className={cn(
            "rounded-lg border p-6",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <h2 className={cn(
              "text-lg font-semibold mb-4 flex items-center gap-2",
              isLight ? "text-gray-900" : "text-white"
            )}>
              <FileText className="h-5 w-5 text-wangfeng-purple" />
              照片组信息
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

              {/* 分类、日期和发布状态 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2 flex items-center gap-1",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    <Tag className="h-4 w-4" />
                    分类
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

                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2 flex items-center gap-1",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    <Calendar className="h-4 w-4" />
                    日期
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

                <div>
                  <label className={cn(
                    "block text-sm font-medium mb-2",
                    isLight ? "text-gray-700" : "text-gray-300"
                  )}>
                    发布状态
                  </label>
                  <select
                    value={isPublished ? 'published' : 'draft'}
                    onChange={(e) => setIsPublished(e.target.value === 'published')}
                    className={cn(
                      "w-full px-4 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2",
                      isLight
                        ? "bg-white border-gray-300 text-gray-900 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                        : "bg-black/50 border-wangfeng-purple/30 text-gray-200 focus:border-wangfeng-purple focus:ring-wangfeng-purple/20"
                    )}
                  >
                    <option value="published">已发布</option>
                    <option value="draft">草稿</option>
                  </select>
                </div>
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
                  placeholder="添加照片组描述..."
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

          {/* 现有照片 */}
          {existingPhotos.length > 0 && (
            <div className={cn(
              "rounded-lg border p-6",
              isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
            )}>
              <h2 className={cn(
                "text-lg font-semibold mb-4 flex items-center gap-2",
                isLight ? "text-gray-900" : "text-white"
              )}>
                <ImageIcon className="h-5 w-5 text-wangfeng-purple" />
                现有照片 ({existingPhotos.length} 张)
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {existingPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={cn(
                      "relative group rounded-lg overflow-hidden border",
                      isLight ? "border-gray-200" : "border-wangfeng-purple/20"
                    )}
                  >
                    <img
                      src={photo.image_thumb_url || photo.image_url}
                      alt={photo.title || photo.original_filename || '照片'}
                      className="w-full h-32 object-cover"
                    />

                    {/* 删除按钮 */}
                    <button
                      onClick={() => deleteExistingPhoto(photo.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="删除照片"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 添加新照片 */}
          <div className={cn(
            "rounded-lg border p-6",
            isLight ? "bg-white border-gray-200" : "bg-black/40 border-wangfeng-purple/20"
          )}>
            <h2 className={cn(
              "text-lg font-semibold mb-4 flex items-center gap-2",
              isLight ? "text-gray-900" : "text-white"
            )}>
              <Upload className="h-5 w-5 text-wangfeng-purple" />
              添加新照片
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
              onClick={() => document.getElementById('file-input-edit')?.click()}
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
                id="file-input-edit"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* 新图片预览 */}
            {newImages.length > 0 && (
              <div className="mt-6">
                <p className={cn(
                  "text-sm font-medium mb-3",
                  isLight ? "text-gray-700" : "text-gray-300"
                )}>
                  新添加 {newImages.length} 张图片
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {newImages.map((image, index) => (
                    <div
                      key={index}
                      className={cn(
                        "relative group rounded-lg overflow-hidden border",
                        isLight ? "border-gray-200" : "border-wangfeng-purple/20"
                      )}
                    >
                      <img
                        src={image.preview}
                        alt={`新图片 ${index + 1}`}
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
                          onClick={() => removeNewImage(index)}
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

          {/* 保存按钮 */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => navigate('/admin/gallery/list')}
              disabled={saving}
              className={cn(
                "px-6 py-2 rounded-lg border transition-colors text-sm font-medium",
                isLight
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "border-wangfeng-purple/30 text-gray-300 hover:bg-wangfeng-purple/10",
                saving && "opacity-50 cursor-not-allowed"
              )}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className={cn(
                "px-6 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2",
                "bg-wangfeng-purple text-white hover:bg-wangfeng-purple/90",
                (saving || !title.trim()) && "opacity-50 cursor-not-allowed"
              )}
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存更改
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryEdit;
