import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { AuthDialog } from '@/components/AuthDialog';
import { authService, User } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: number;
  user: string;
  message: string;
  time: string;
}

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [serverStatus, setServerStatus] = useState({ online: true, players: 47, maxPlayers: 100 });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!user) {
      toast({
        title: '⚠️ Требуется вход',
        description: 'Войдите или зарегистрируйтесь для отправки сообщений',
        variant: 'destructive',
      });
      setAuthDialogOpen(true);
      return;
    }
    if (newMessage.trim()) {
      try {
        const response = await fetch('https://functions.poehali.dev/7556f644-973f-4c22-94af-f53a550098d2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': authService.getToken() || ''
          },
          body: JSON.stringify({ message: newMessage })
        });
        
        if (response.ok) {
          const newMsg = await response.json();
          setChatMessages([...chatMessages, {
            id: newMsg.id,
            user: newMsg.minecraft_nick || newMsg.username,
            message: newMsg.message,
            time: new Date(newMsg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
          }]);
          setNewMessage('');
        } else {
          toast({
            title: 'Ошибка',
            description: 'Не удалось отправить сообщение',
            variant: 'destructive'
          });
        }
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Проблема с подключением',
          variant: 'destructive'
        });
      }
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadMessages = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/7556f644-973f-4c22-94af-f53a550098d2?limit=50');
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data.messages.map((msg: any) => ({
          id: msg.id,
          user: msg.minecraft_nick || msg.username,
          message: msg.message,
          time: new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        })));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = authService.getToken();
    const savedUser = authService.getUser();
    if (token && savedUser) {
      authService.verify(token).then((result) => {
        if (result.success && result.user) {
          setUser(result.user);
        } else {
          authService.logout();
        }
      });
    }
  }, []);

  const handleAuthSuccess = () => {
    const savedUser = authService.getUser();
    setUser(savedUser);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    toast({
      title: '👋 До встречи!',
      description: 'Вы вышли из аккаунта',
    });
  };

  const donatePackages = [
    { name: 'Стартовый', price: '99₽', features: ['Приват территории', 'Набор инструментов', 'x2 к опыту'] },
    { name: 'Продвинутый', price: '299₽', features: ['Всё из Стартового', 'Уникальный скин', 'x3 к опыту', 'Доступ к /home'] },
    { name: 'Элитный', price: '599₽', features: ['Всё из Продвинутого', 'Креативный режим', 'x5 к опыту', 'Эксклюзивные команды'] },
  ];

  const rules = [
    'Запрещен читерский софт и использование багов',
    'Уважайте других игроков',
    'Запрещен гриферство без причины',
    'Не спамьте в чате',
    'Слушайте администрацию сервера',
    'Запрещена реклама других серверов',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/30">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-black glow text-primary">ToughLife</h1>
          <div className="hidden md:flex gap-6">
            {['home', 'about', 'rules', 'map', 'status'].map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={`text-sm font-medium transition-all hover:text-primary hover:glow ${
                  activeSection === section ? 'text-primary glow' : 'text-foreground/70'
                }`}
              >
                {section === 'home' && 'Главная'}
                {section === 'about' && 'О сервере'}
                {section === 'rules' && 'Правила'}
                {section === 'donate' && 'Донат'}
                {section === 'map' && 'Карта'}
                {section === 'status' && 'Статус'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="glow-box hidden md:flex">
                    <Icon name="User" size={18} className="mr-2" />
                    {user.username}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-background/95 backdrop-blur-xl border-primary/20">
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Icon name="User" size={16} />
                    <div>
                      <div className="font-bold">{user.username}</div>
                      {user.minecraft_nick && <div className="text-xs text-muted-foreground">{user.minecraft_nick}</div>}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <Icon name="LogOut" size={16} className="mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => setAuthDialogOpen(true)} className="glow-box hidden md:flex">
                <Icon name="LogIn" size={18} className="mr-2" />
                Войти
              </Button>
            )}
            <Badge variant={serverStatus.online ? 'default' : 'destructive'} className="animate-pulse-glow hidden sm:flex">
              <Icon name="Circle" size={8} className="mr-1 fill-current" />
              {serverStatus.online ? 'ONLINE' : 'OFFLINE'}
            </Badge>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="glow-box">
                  <Icon name="Menu" size={24} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background/95 backdrop-blur-xl border-primary/20">
                <div className="flex flex-col gap-6 mt-8">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-black glow text-primary mb-2">ToughLife</h2>
                    <Badge variant={serverStatus.online ? 'default' : 'destructive'} className="animate-pulse-glow">
                      <Icon name="Circle" size={8} className="mr-1 fill-current" />
                      {serverStatus.online ? 'ONLINE' : 'OFFLINE'}
                    </Badge>
                  </div>
                  {['home', 'about', 'rules', 'map', 'status'].map((section) => (
                    <button
                      key={section}
                      onClick={() => scrollToSection(section)}
                      className={`text-lg font-medium transition-all hover:text-primary hover:glow text-left py-2 px-4 rounded-lg ${
                        activeSection === section ? 'text-primary glow bg-primary/10' : 'text-foreground/70'
                      }`}
                    >
                      {section === 'home' && '🏠 Главная'}
                      {section === 'about' && '📖 О сервере'}
                      {section === 'rules' && '⚖️ Правила'}
                      {section === 'donate' && '💎 Донат'}
                      {section === 'map' && '🗺️ Карта'}
                      {section === 'status' && '📊 Статус'}
                    </button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <section id="home" className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="space-y-4">
            <h2 className="text-7xl md:text-9xl font-black glow text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent animate-float">
              ToughLife
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Выживай. Строй. Побеждай.
            </p>
            <div className="bg-card/80 backdrop-blur border-2 border-primary/30 rounded-lg p-4 max-w-md mx-auto glow-box">
              <div className="text-sm text-muted-foreground mb-2">IP для подключения:</div>
              <div className="flex items-center justify-between gap-3">
                <code className="text-lg font-bold text-primary">ToughLife.aternos.me:21635</code>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText('ToughLife.aternos.me:21635');
                  }}
                >
                  <Icon name="Copy" size={16} className="mr-1" />
                  Копировать
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-2 text-center">Версия: 1.20.1</div>
            </div>
          </div>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="glow-box text-lg px-8">
              <Icon name="Gamepad2" size={20} className="mr-2" />
              Начать играть
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <Icon name="Users" size={20} className="mr-2" />
              Сообщество
            </Button>
          </div>
          <div className="flex gap-8 justify-center text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{serverStatus.players}</div>
              <div className="text-sm text-muted-foreground">Игроков онлайн</div>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className="text-3xl font-bold text-secondary">24/7</div>
              <div className="text-sm text-muted-foreground">Без лагов</div>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className="text-3xl font-bold text-accent">Любая</div>
              <div className="text-sm text-muted-foreground">Версия Minecraft</div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="min-h-screen flex items-center py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-5xl font-black mb-12 text-center glow">О сервере</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: 'Sword', title: 'PvP', desc: 'Эпичные сражения и арены' },
              { icon: 'Home', title: 'Выживание', desc: 'Постройте свою империю' },
              { icon: 'Zap', title: 'Плагины', desc: 'Уникальные механики игры' },
              { icon: 'Trophy', title: 'События', desc: 'Регулярные турниры с призами' },
              { icon: 'Shield', title: 'Защита', desc: 'Приват территорий' },
            ].map((feature, i) => (
              <Card key={i} className="bg-card/50 backdrop-blur border-primary/20 hover:border-primary/50 transition-all hover:scale-105 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-box">
                    <Icon name={feature.icon as any} size={32} />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="rules" className="min-h-screen flex items-center py-20 px-4 bg-gradient-to-b from-transparent to-card/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-5xl font-black mb-12 text-center glow">Правила сервера</h2>
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-8">
              <div className="space-y-6">
                {rules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 glow-box">
                      <span className="text-sm font-bold">{i + 1}</span>
                    </div>
                    <p className="text-lg pt-1">{rule}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="map" className="min-h-screen flex items-center py-20 px-4 bg-gradient-to-b from-transparent to-card/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-5xl font-black mb-12 text-center glow">Карта мира</h2>
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-8">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Icon name="Map" size={64} className="mx-auto text-primary glow" />
                  <p className="text-xl text-muted-foreground">Интерактивная карта загружается...</p>
                  <p className="text-sm text-muted-foreground">Здесь будет отображаться карта сервера в реальном времени</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="status" className="min-h-screen flex items-center py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-5xl font-black mb-12 text-center glow">Статус сервера</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-card/50 backdrop-blur border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Server" size={24} className="text-primary" />
                  Информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">IP адрес:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary">ToughLife.aternos.me:21635</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText('ToughLife.aternos.me:21635');
                      }}
                    >
                      <Icon name="Copy" size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Версия:</span>
                  <span className="font-bold text-secondary">1.20.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Онлайн:</span>
                  <span className="font-bold text-primary">{serverStatus.players} / {serverStatus.maxPlayers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Режим:</span>
                  <span className="font-bold">Survival + PvP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Статус:</span>
                  <Badge variant={serverStatus.online ? 'default' : 'destructive'}>
                    {serverStatus.online ? 'РАБОТАЕТ' : 'ОФФЛАЙН'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MessageSquare" size={24} className="text-secondary" />
                  Чат игроков
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] mb-4 pr-4">
                  <div className="space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="bg-background/50 rounded-lg p-3 animate-slide-in">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-primary">{msg.user}</span>
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Напишите сообщение..."
                    className="bg-background/50"
                  />
                  <Button onClick={sendMessage} className="glow-box">
                    <Icon name="Send" size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t border-primary/20 bg-card/30 backdrop-blur py-8">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h3 className="text-2xl font-black glow text-primary">ToughLife</h3>
          <p className="text-muted-foreground">© 2024 ToughLife Server. Все права защищены.</p>
          <div className="flex gap-4 justify-center">
            <Button variant="ghost" size="icon">
              <Icon name="MessageCircle" size={20} />
            </Button>
            <Button variant="ghost" size="icon">
              <Icon name="Youtube" size={20} />
            </Button>
            <Button variant="ghost" size="icon">
              <Icon name="Mail" size={20} />
            </Button>
          </div>
        </div>
      </footer>

      <AuthDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;