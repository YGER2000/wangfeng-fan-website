// 文章分类配置
export interface CategoryConfig {
  primary: string;
  secondary: string[];
}

export const ARTICLE_CATEGORIES: CategoryConfig[] = [
  {
    primary: '峰言峰语',
    secondary: ['汪峰博客', '汪峰语录', '访谈记录']
  },
  {
    primary: '峰迷荟萃',
    secondary: ['闲聊汪峰', '歌曲赏析']
  },
  {
    primary: '资料科普',
    secondary: ['汪峰数据', '辟谣考证', '演唱会资料', '歌曲资料', '乐队资料', '逸闻趣事', '媒体报道']
  }
];

// 获取所有一级分类
export const getPrimaryCategories = (): string[] => {
  return ARTICLE_CATEGORIES.map(cat => cat.primary);
};

// 根据一级分类获取二级分类
export const getSecondaryCategories = (primary: string): string[] => {
  const category = ARTICLE_CATEGORIES.find(cat => cat.primary === primary);
  return category ? category.secondary : [];
};

// 验证分类是否有效
export const isValidCategory = (primary: string, secondary: string): boolean => {
  const category = ARTICLE_CATEGORIES.find(cat => cat.primary === primary);
  return category ? category.secondary.includes(secondary) : false;
};
