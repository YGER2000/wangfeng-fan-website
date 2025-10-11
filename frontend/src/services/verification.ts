/**
 * 验证码服务API
 */

const API_BASE_URL = 'http://localhost:1994';

export interface SendCodeRequest {
  email: string;
  type: 'register' | 'reset_password' | 'login' | 'change_email';
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
  expires_in?: number;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
  type: string;
}

export interface RegisterWithEmailRequest {
  email: string;
  code: string;
  username: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  new_password: string;
}

/**
 * 发送验证码
 */
export const sendVerificationCode = async (
  email: string,
  type: 'register' | 'reset_password' | 'login' | 'change_email'
): Promise<SendCodeResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/verification/send-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, type }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '发送验证码失败');
  }

  return response.json();
};

/**
 * 验证验证码
 */
export const verifyCode = async (
  email: string,
  code: string,
  type: string
): Promise<SendCodeResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/verification/verify-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, code, type }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '验证码错误或已过期');
  }

  return response.json();
};

/**
 * 邮箱注册
 */
export const registerWithEmail = async (
  data: RegisterWithEmailRequest
): Promise<any> => {
  const response = await fetch(`${API_BASE_URL}/api/verification/register-with-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '注册失败');
  }

  return response.json();
};

/**
 * 重置密码
 */
export const resetPassword = async (
  data: ResetPasswordRequest
): Promise<SendCodeResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/verification/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '重置密码失败');
  }

  return response.json();
};

/**
 * 邮箱登录
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<{ access_token: string; token_type: string }> => {
  const response = await fetch(`${API_BASE_URL}/api/verification/login-with-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '登录失败');
  }

  return response.json();
};
