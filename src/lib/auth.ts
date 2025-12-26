const AUTH_API_URL = 'https://functions.poehali.dev/5d2d42ab-fc1a-4c67-8a43-8553fc546f79';

export interface User {
  id: number;
  username: string;
  email: string;
  minecraft_nick?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  message?: string;
}

export const authService = {
  async register(username: string, email: string, password: string, minecraft_nick?: string): Promise<AuthResponse> {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'register',
        username,
        email,
        password,
        minecraft_nick,
      }),
    });

    return response.json();
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'login',
        username,
        password,
      }),
    });

    return response.json();
  },

  async verify(token: string): Promise<AuthResponse> {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Token': token,
      },
      body: JSON.stringify({
        action: 'verify',
      }),
    });

    return response.json();
  },

  saveToken(token: string) {
    localStorage.setItem('auth_token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  removeToken() {
    localStorage.removeItem('auth_token');
  },

  saveUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  removeUser() {
    localStorage.removeItem('user');
  },

  logout() {
    this.removeToken();
    this.removeUser();
  },
};
