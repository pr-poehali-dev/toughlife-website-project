import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AuthDialog = ({ open, onOpenChange, onSuccess }: AuthDialogProps) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    minecraft_nick: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await authService.login(loginForm.username, loginForm.password);

      if (result.success && result.user && result.token) {
        authService.saveToken(result.token);
        authService.saveUser(result.user);
        toast({
          title: '✅ Вход выполнен!',
          description: `Добро пожаловать, ${result.user.username}!`,
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: '❌ Ошибка входа',
          description: result.error || 'Неверные данные',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerForm.password !== registerForm.confirmPassword) {
      toast({
        title: '❌ Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive',
      });
      return;
    }

    if (registerForm.password.length < 6) {
      toast({
        title: '❌ Ошибка',
        description: 'Пароль должен быть минимум 6 символов',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register(
        registerForm.username,
        registerForm.email,
        registerForm.password,
        registerForm.minecraft_nick
      );

      if (result.success && result.user && result.token) {
        authService.saveToken(result.token);
        authService.saveUser(result.user);
        toast({
          title: '✅ Регистрация успешна!',
          description: `Аккаунт ${result.user.username} создан!`,
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: '❌ Ошибка регистрации',
          description: result.error || 'Не удалось создать аккаунт',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-3xl font-black glow text-primary text-center">ToughLife</DialogTitle>
          <DialogDescription className="text-center">
            Создайте аккаунт для сохранения прогресса и защиты данных
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Логин или Email</Label>
                <div className="relative">
                  <Icon name="User" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Введите логин или email"
                    className="pl-10"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <div className="relative">
                  <Icon name="Lock" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Введите пароль"
                    className="pl-10"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full glow-box" disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Вход...
                  </>
                ) : (
                  <>
                    <Icon name="LogIn" size={18} className="mr-2" />
                    Войти
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username">Логин</Label>
                <div className="relative">
                  <Icon name="User" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Придумайте логин"
                    className="pl-10"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    required
                    minLength={3}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Icon name="Mail" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Ваш email"
                    className="pl-10"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-minecraft">Minecraft ник (опционально)</Label>
                <div className="relative">
                  <Icon name="Gamepad2" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="register-minecraft"
                    type="text"
                    placeholder="Ваш ник в Minecraft"
                    className="pl-10"
                    value={registerForm.minecraft_nick}
                    onChange={(e) => setRegisterForm({ ...registerForm, minecraft_nick: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Пароль</Label>
                <div className="relative">
                  <Icon name="Lock" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Минимум 6 символов"
                    className="pl-10"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-confirm">Подтвердите пароль</Label>
                <div className="relative">
                  <Icon name="Lock" size={18} className="absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="register-confirm"
                    type="password"
                    placeholder="Повторите пароль"
                    className="pl-10"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full glow-box" disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  <>
                    <Icon name="UserPlus" size={18} className="mr-2" />
                    Создать аккаунт
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
