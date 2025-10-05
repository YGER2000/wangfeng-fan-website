from enum import Enum


class UserRole(str, Enum):
    """用户角色枚举"""
    GUEST = "guest"          # 游客（未登录）
    USER = "user"            # 普通用户  
    ADMIN = "admin"          # 管理员
    SUPER_ADMIN = "super_admin"  # 超级管理员

    @classmethod
    def get_chinese_name(cls, role: str) -> str:
        """获取角色的中文名称"""
        role_names = {
            cls.GUEST: "游客",
            cls.USER: "用户", 
            cls.ADMIN: "管理员",
            cls.SUPER_ADMIN: "超级管理员"
        }
        return role_names.get(role, "未知角色")

    @classmethod
    def get_role_hierarchy(cls) -> dict:
        """获取角色层级（数字越大权限越高）"""
        return {
            cls.GUEST: 0,
            cls.USER: 1,
            cls.ADMIN: 2, 
            cls.SUPER_ADMIN: 3
        }

    @classmethod
    def has_permission(cls, user_role: str, required_role: str) -> bool:
        """检查用户角色是否有足够权限"""
        hierarchy = cls.get_role_hierarchy()
        return hierarchy.get(user_role, 0) >= hierarchy.get(required_role, 0)