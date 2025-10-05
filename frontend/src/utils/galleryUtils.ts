import { withBasePath } from '@/lib/utils';

export interface PhotoGroup {
  id: string;
  title: string;
  date: string;
  category: '巡演返图' | '工作花絮' | '日常生活';
  folderPath: string;
  coverImage: string;
  images: string[];
  year: string;
  displayDate: string;
}

// 手动配置的照片组数据，按时间倒序排列
export const photoGroups: PhotoGroup[] = [
  // 日常生活
  {
    id: 'daily-2025-04-15',
    title: '汉江的夜色溜溜的面',
    date: '2025-04-15',
    displayDate: '2025年4月15日',
    category: '日常生活',
    folderPath: 'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面',
    coverImage: withBasePath('images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面1.jpg'),
    images: [
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面1.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面2.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面3.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面4.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面5.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面6.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面7.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面8.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面9.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面10.jpg',
      'images/画廊/日常生活/2025.4.15-汉江的夜色溜溜的面/2025.4.15-汉江的夜色溜溜的面11.jpg'
    ].map(path => withBasePath(path)),
    year: '2025'
  },

  // 工作花絮
  {
    id: 'work-2025-04-09',
    title: '排练',
    date: '2025-04-09',
    displayDate: '2025年4月9日',
    category: '工作花絮',
    folderPath: 'images/画廊/工作花絮/2025.4.9-排练',
    coverImage: withBasePath('images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练1.jpg'),
    images: [
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练1.jpg',
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练2.jpg',
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练3.jpg',
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练4.jpg',
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练5.jpg',
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练6.jpg',
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练7.jpg',
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练8.jpg',
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练9.jpg',
      'images/画廊/工作花絮/2025.4.9-排练/2025.4.9-排练10.jpg'
    ].map(path => withBasePath(path)),
    year: '2025'
  },

  // 巡演返图
  {
    id: 'tour-2023-07-08',
    title: 'UNFOLLOW上海站',
    date: '2023-07-08',
    displayDate: '2023年7月8日',
    category: '巡演返图',
    folderPath: 'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站',
    coverImage: withBasePath('images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站1.jpg'),
    images: [
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站1.jpg',
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站2.jpg',
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站3.jpg',
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站4.jpg',
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站5.jpg',
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站6.jpg',
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站7.jpg',
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站8.jpg',
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站9.jpg',
      'images/画廊/巡演返图/2023.7.8-UNFOLLOW上海站/2023.7.8-UNFOLLOW上海站10.jpg'
    ].map(path => withBasePath(path)),
    year: '2023'
  },

  {
    id: 'tour-2023-06-10',
    title: 'UNFOLLOW呼和浩特站',
    date: '2023-06-10',
    displayDate: '2023年6月10日',
    category: '巡演返图',
    folderPath: 'images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站',
    coverImage: withBasePath('images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站1.jpg'),
    images: [
      'images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站1.jpg',
      'images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站2.jpg',
      'images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站3.jpg',
      'images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站4.jpg',
      'images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站5.jpg',
      'images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站6.jpg',
      'images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站7.jpg',
      'images/画廊/巡演返图/2023.6.10-UNFOLLOW呼和浩特站/2023.6.10-UNFOLLOW呼和浩特站8.jpg'
    ].map(path => withBasePath(path)),
    year: '2023'
  },

  {
    id: 'tour-2023-05-13',
    title: 'UNFOLLOW深圳站',
    date: '2023-05-13',
    displayDate: '2023年5月13日',
    category: '巡演返图',
    folderPath: 'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站',
    coverImage: withBasePath('images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站1.jpg'),
    images: [
      'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站1.jpg',
      'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站2.jpg',
      'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站3.jpg',
      'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站4.jpg',
      'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站5.jpg',
      'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站6.jpg',
      'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站7.jpg',
      'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站8.jpg',
      'images/画廊/巡演返图/2023-5.13-UNFOLLOW深圳站/2023-5.13-UNFOLLOW深圳站9.jpg'
    ].map(path => withBasePath(path)),
    year: '2023'
  },

  {
    id: 'tour-2023-04-30',
    title: 'UNFOLLOW长沙站',
    date: '2023-04-30',
    displayDate: '2023年4月30日',
    category: '巡演返图',
    folderPath: 'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站',
    coverImage: withBasePath('images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站1.jpg'),
    images: [
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站1.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站2.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站3.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站4.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站5.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站6.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站7.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站8.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站9.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站10.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站11.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站12.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站13.jpg',
      'images/画廊/巡演返图/2023.4.30-UNFOLLOW长沙站/2023.4.30-UNFOLLOW长沙站14.jpg'
    ].map(path => withBasePath(path)),
    year: '2023'
  },

  {
    id: 'tour-2023-04-15',
    title: 'UNFOLLOW洛阳站',
    date: '2023-04-15',
    displayDate: '2023年4月15日',
    category: '巡演返图',
    folderPath: 'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站',
    coverImage: withBasePath('images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站1.png'),
    images: [
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站1.png',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站2.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站3.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站4.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站5.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站6.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站7.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站8.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站9.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站10.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站11.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站12.jpg',
      'images/画廊/巡演返图/2023.4.15-UNFOLLOW洛阳站/2023.4.15-UNFOLLOW洛阳站13.jpg'
    ].map(path => withBasePath(path)),
    year: '2023'
  },

  {
    id: 'tour-2021-07-03',
    title: 'UNFOLLOW 苏州站',
    date: '2021-07-03',
    displayDate: '2021年7月3日',
    category: '巡演返图',
    folderPath: 'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站',
    coverImage: withBasePath('images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站1.jpg'),
    images: [
      'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站1.jpg',
      'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站2.jpg',
      'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站3.jpg',
      'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站4.jpg',
      'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站5.jpg',
      'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站6.jpg',
      'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站7.jpg',
      'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站8.jpg',
      'images/画廊/巡演返图/2021.7.3-UNFOLLOW 苏州站/2021.7.3-UNFOLLOW 苏州站9.jpg'
    ].map(path => withBasePath(path)),
    year: '2021'
  }
];

// 获取所有分类
export const categories = ['全部', '巡演返图', '工作花絮', '日常生活'] as const;

// 根据分类过滤照片组
export const getPhotoGroupsByCategory = (category: string): PhotoGroup[] => {
  if (category === '全部') {
    return photoGroups;
  }
  return photoGroups.filter(group => group.category === category);
};

// 获取分类的中文显示名称
export const getCategoryDisplayName = (category: string): string => {
  const displayNames: Record<string, string> = {
    '全部': '全部照片',
    '巡演返图': '巡演返图',
    '工作花絮': '工作花絮',
    '日常生活': '日常生活'
  };
  return displayNames[category] || category;
};