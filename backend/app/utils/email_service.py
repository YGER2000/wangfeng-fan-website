# -*- coding: utf-8 -*-
"""阿里云邮件服务 (DirectMail SMTP)"""
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from email.utils import formataddr
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """阿里云 DirectMail 邮件服务"""

    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_username: str,
        smtp_password: str,
        sender_email: str,
        sender_name: str = "感受峰 感受存在"
    ):
        """
        初始化邮件服务

        Args:
            smtp_host: SMTP服务器地址 (如: smtpdm.aliyun.com)
            smtp_port: SMTP端口 (25, 80, 或 465 for SSL)
            smtp_username: SMTP用户名
            smtp_password: SMTP密码
            sender_email: 发件人邮箱
            sender_name: 发件人名称
        """
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_username = smtp_username
        self.smtp_password = smtp_password
        self.sender_email = sender_email
        self.sender_name = sender_name

    def generate_verification_code(self, length: int = 6) -> str:
        """生成数字验证码"""
        return ''.join([str(random.randint(0, 9)) for _ in range(length)])

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        发送邮件

        Args:
            to_email: 收件人邮箱
            subject: 邮件主题
            html_content: HTML邮件内容
            text_content: 纯文本邮件内容 (可选)

        Returns:
            bool: 发送成功返回True, 失败返回False
        """
        try:
            # 创建邮件对象
            message = MIMEMultipart('alternative')
            # 阿里云DirectMail要求使用formataddr格式化From头部 (RFC5322标准)
            message['From'] = formataddr([self.sender_name, self.sender_email])
            message['To'] = formataddr([to_email, to_email])
            message['Subject'] = Header(subject, 'utf-8').encode()

            # 添加纯文本部分
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                message.attach(text_part)

            # 添加HTML部分
            html_part = MIMEText(html_content, 'html', 'utf-8')
            message.attach(html_part)

            # 连接SMTP服务器并发送
            if self.smtp_port == 465:
                # SSL连接
                server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port)
            else:
                # 普通连接
                server = smtplib.SMTP(self.smtp_host, self.smtp_port)

            # 登录
            server.login(self.smtp_username, self.smtp_password)

            # 发送邮件
            server.sendmail(
                self.sender_email,
                [to_email],
                message.as_string()
            )

            # 关闭连接
            server.quit()

            logger.info(f"邮件发送成功: {to_email}")
            return True

        except Exception as e:
            logger.error(f"邮件发送失败: {to_email}, 错误: {str(e)}")
            return False

    def send_verification_code(
        self,
        to_email: str,
        code: str,
        purpose: str = "验证"
    ) -> bool:
        """
        发送验证码邮件

        Args:
            to_email: 收件人邮箱
            code: 验证码
            purpose: 验证码用途 (如: 注册, 找回密码)

        Returns:
            bool: 发送成功返回True
        """
        subject = f"【感受峰 感受存在】{purpose}验证码"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; padding-bottom: 20px; border-bottom: 2px solid #8B5CF6; }}
                .header h1 {{ color: #8B5CF6; margin: 0; }}
                .content {{ padding: 30px 0; text-align: center; }}
                .code {{ font-size: 32px; font-weight: bold; color: #8B5CF6; letter-spacing: 5px; padding: 20px; background: #f9f5ff; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>感受峰 感受存在</h1>
                </div>
                <div class="content">
                    <p>您好!欢迎来到本站！</p>
                    <p>您正在进行<strong>{purpose}</strong>操作,验证码为:</p>
                    <div class="code">{code}</div>
                    <p style="color: #666;">验证码有效期为 <strong>10分钟</strong>,请及时使用。</p>
                    <p style="color: #999; font-size: 14px;">如果这不是您的操作,请忽略此邮件。</p>
                </div>
                <div class="footer">
                    <p>此邮件由系统自动发送,请勿直接回复。</p>
                    <p>© 2025 感受峰 感受存在</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        【感受峰 感受存在】{purpose}验证码

        您好!欢迎来到本站！

        您正在进行{purpose}操作,验证码为: {code}

        验证码有效期为10分钟,请及时使用。

        如果这不是您的操作,请忽略此邮件。

        此邮件由系统自动发送,请勿直接回复。
        © 2025 感受峰 感受存在
        """

        return self.send_email(to_email, subject, html_content, text_content)

    def send_password_reset_email(
        self,
        to_email: str,
        username: str,
        reset_code: str
    ) -> bool:
        """
        发送密码重置邮件

        Args:
            to_email: 收件人邮箱
            username: 用户名
            reset_code: 重置验证码

        Returns:
            bool: 发送成功返回True
        """
        subject = "【感受峰 感受存在】密码重置验证码"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; padding-bottom: 20px; border-bottom: 2px solid #8B5CF6; }}
                .header h1 {{ color: #8B5CF6; margin: 0; }}
                .content {{ padding: 30px 0; }}
                .code {{ font-size: 32px; font-weight: bold; color: #8B5CF6; letter-spacing: 5px; padding: 20px; background: #f9f5ff; border-radius: 5px; margin: 20px 0; text-align: center; }}
                .warning {{ background: #fff3cd; padding: 15px; border-radius: 5px; color: #856404; margin: 20px 0; }}
                .footer {{ text-align: center; color: #666; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>感受峰 感受存在</h1>
                </div>
                <div class="content">
                    <p>尊敬的 <strong>{username}</strong>,</p>
                    <p>您正在申请重置密码,验证码为:</p>
                    <div class="code">{reset_code}</div>
                    <p style="text-align: center; color: #666;">验证码有效期为 <strong>10分钟</strong></p>
                    <div class="warning">
                        <strong>⚠️ 安全提示:</strong><br>
                        • 请勿将验证码告诉他人<br>
                        • 如非本人操作,请立即联系管理员<br>
                        • 建议设置强密码,保护账号安全
                    </div>
                </div>
                <div class="footer">
                    <p>此邮件由系统自动发送,请勿直接回复。</p>
                    <p>© 2025 感受峰 感受存在</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        【感受峰 感受存在】密码重置验证码

        尊敬的 {username},

        您正在申请重置密码,验证码为: {reset_code}

        验证码有效期为10分钟。

        安全提示:
        - 请勿将验证码告诉他人
        - 如非本人操作,请立即联系管理员
        - 建议设置强密码,保护账号安全

        此邮件由系统自动发送,请勿直接回复。
        © 2025 感受峰 感受存在
        """

        return self.send_email(to_email, subject, html_content, text_content)
