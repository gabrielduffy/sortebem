import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, Image, Smile, Store, Building2, ShoppingBag, Coffee, 
  Utensils, Pizza, Beer, Wine, Music, Gamepad2, Dumbbell, Heart,
  Star, Gift, Sparkles, Trophy, Crown, Gem, Zap, Flame,
  Leaf, Sun, Moon, Cloud, Umbrella, Snowflake, Rainbow,
  Camera, Film, Tv, Radio, Mic, Headphones, Speaker,
  Car, Bus, Train, Plane, Ship, Bike, MapPin, 
  Home, Briefcase, GraduationCap, Book, Palette, Scissors,
  Stethoscope, Pill, Syringe, Baby, Dog, Cat, Bird, Fish,
  Shirt, Watch, Glasses, Footprints, Flower2, Trees
} from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface LogoIconPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

// Icon categories with icons
const iconCategories = {
  'Negócios': [Store, Building2, ShoppingBag, Briefcase, Home],
  'Comida': [Coffee, Utensils, Pizza, Beer, Wine],
  'Entretenimento': [Music, Gamepad2, Dumbbell, Trophy, Crown],
  'Natureza': [Heart, Star, Gift, Sparkles, Gem, Zap, Flame, Leaf, Sun, Moon, Cloud],
  'Mídia': [Camera, Film, Tv, Radio, Mic, Headphones, Speaker],
  'Transporte': [Car, Bus, Train, Plane, Ship, Bike, MapPin],
  'Educação': [GraduationCap, Book, Palette, Scissors],
  'Saúde': [Stethoscope, Pill, Syringe, Baby],
  'Animais': [Dog, Cat, Bird, Fish],
  'Moda': [Shirt, Watch, Glasses, Footprints, Flower2, Trees],
};

const allIcons = Object.values(iconCategories).flat();

// Icon name mapping for storage
const iconNameMap: Record<string, string> = {
  Store: 'icon:Store',
  Building2: 'icon:Building2',
  ShoppingBag: 'icon:ShoppingBag',
  Coffee: 'icon:Coffee',
  Utensils: 'icon:Utensils',
  Pizza: 'icon:Pizza',
  Beer: 'icon:Beer',
  Wine: 'icon:Wine',
  Music: 'icon:Music',
  Gamepad2: 'icon:Gamepad2',
  Dumbbell: 'icon:Dumbbell',
  Heart: 'icon:Heart',
  Star: 'icon:Star',
  Gift: 'icon:Gift',
  Sparkles: 'icon:Sparkles',
  Trophy: 'icon:Trophy',
  Crown: 'icon:Crown',
  Gem: 'icon:Gem',
  Zap: 'icon:Zap',
  Flame: 'icon:Flame',
  Leaf: 'icon:Leaf',
  Sun: 'icon:Sun',
  Moon: 'icon:Moon',
  Cloud: 'icon:Cloud',
  Umbrella: 'icon:Umbrella',
  Snowflake: 'icon:Snowflake',
  Rainbow: 'icon:Rainbow',
  Camera: 'icon:Camera',
  Film: 'icon:Film',
  Tv: 'icon:Tv',
  Radio: 'icon:Radio',
  Mic: 'icon:Mic',
  Headphones: 'icon:Headphones',
  Speaker: 'icon:Speaker',
  Car: 'icon:Car',
  Bus: 'icon:Bus',
  Train: 'icon:Train',
  Plane: 'icon:Plane',
  Ship: 'icon:Ship',
  Bike: 'icon:Bike',
  MapPin: 'icon:MapPin',
  Home: 'icon:Home',
  Briefcase: 'icon:Briefcase',
  GraduationCap: 'icon:GraduationCap',
  Book: 'icon:Book',
  Palette: 'icon:Palette',
  Scissors: 'icon:Scissors',
  Stethoscope: 'icon:Stethoscope',
  Pill: 'icon:Pill',
  Syringe: 'icon:Syringe',
  Baby: 'icon:Baby',
  Dog: 'icon:Dog',
  Cat: 'icon:Cat',
  Bird: 'icon:Bird',
  Fish: 'icon:Fish',
  Shirt: 'icon:Shirt',
  Watch: 'icon:Watch',
  Glasses: 'icon:Glasses',
  Footprints: 'icon:Footprints',
  Flower2: 'icon:Flower2',
  Trees: 'icon:Trees',
};

export function LogoIconPicker({ value, onChange, label = 'Logo' }: LogoIconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Selecione apenas arquivos de imagem.', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'A imagem deve ter no máximo 2MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
      setIsOpen(false);
      toast({ title: 'Sucesso!', description: 'Imagem carregada.' });
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast({ title: 'Erro', description: 'Informe uma URL válida.', variant: 'destructive' });
      return;
    }
    onChange(urlInput.trim());
    setUrlInput('');
    setIsOpen(false);
    toast({ title: 'Sucesso!', description: 'URL da imagem definida.' });
  };

  const handleIconSelect = (IconComponent: any) => {
    const iconName = IconComponent.displayName || IconComponent.name;
    onChange(iconNameMap[iconName] || `icon:${iconName}`);
    setIsOpen(false);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    onChange(`emoji:${emojiData.emoji}`);
    setIsOpen(false);
  };

  const renderPreview = () => {
    if (!value) {
      return (
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
          <Image className="w-6 h-6 text-muted-foreground" />
        </div>
      );
    }

    if (value.startsWith('emoji:')) {
      const emoji = value.replace('emoji:', '');
      return (
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-3xl">
          {emoji}
        </div>
      );
    }

    if (value.startsWith('icon:')) {
      const iconName = value.replace('icon:', '');
      const IconComponent = allIcons.find(
        (icon) => (icon.displayName || icon.name) === iconName
      );
      if (IconComponent) {
        return (
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-primary" />
          </div>
        );
      }
    }

    // URL or base64 image
    return (
      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
        <img src={value} alt="Logo" className="w-full h-full object-cover" onError={(e) => {
          (e.target as HTMLImageElement).src = '';
          (e.target as HTMLImageElement).style.display = 'none';
        }} />
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        {renderPreview()}
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Alterar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[380px] p-0" align="start">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
                <TabsTrigger value="upload" className="text-xs">Upload</TabsTrigger>
                <TabsTrigger value="url" className="text-xs">URL</TabsTrigger>
                <TabsTrigger value="icon" className="text-xs">Ícone</TabsTrigger>
                <TabsTrigger value="emoji" className="text-xs">Emoji</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">Faça upload de uma imagem (máx 2MB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Escolher arquivo
                </Button>
              </TabsContent>

              <TabsContent value="url" className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">Cole a URL de uma imagem</p>
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                />
                <Button variant="outline" className="w-full" onClick={handleUrlSubmit}>
                  Usar esta URL
                </Button>
              </TabsContent>

              <TabsContent value="icon" className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-4 space-y-4">
                    {Object.entries(iconCategories).map(([category, icons]) => (
                      <div key={category}>
                        <p className="text-xs font-medium text-muted-foreground mb-2">{category}</p>
                        <div className="grid grid-cols-5 gap-2">
                          {icons.map((IconComponent, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="icon"
                              className="h-10 w-10"
                              onClick={() => handleIconSelect(IconComponent)}
                            >
                              <IconComponent className="w-5 h-5" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="emoji" className="p-0">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  width="100%"
                  height={350}
                  theme={Theme.AUTO}
                  searchPlaceholder="Buscar emoji..."
                  previewConfig={{ showPreview: false }}
                />
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>

        {value && (
          <Button variant="ghost" size="sm" onClick={() => onChange('')}>
            Remover
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper component to render the logo/icon/emoji in lists
export function LogoDisplay({ value, size = 'md' }: { value: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  if (!value) {
    return (
      <div className={`${sizeClasses[size]} rounded-xl bg-muted flex items-center justify-center`}>
        <Image className={iconSizes[size] + ' text-muted-foreground'} />
      </div>
    );
  }

  if (value.startsWith('emoji:')) {
    const emoji = value.replace('emoji:', '');
    return (
      <div className={`${sizeClasses[size]} rounded-xl bg-muted flex items-center justify-center`}>
        {emoji}
      </div>
    );
  }

  if (value.startsWith('icon:')) {
    const iconName = value.replace('icon:', '');
    const IconComponent = allIcons.find(
      (icon) => (icon.displayName || icon.name) === iconName
    );
    if (IconComponent) {
      return (
        <div className={`${sizeClasses[size]} rounded-xl bg-primary/10 flex items-center justify-center`}>
          <IconComponent className={iconSizes[size] + ' text-primary'} />
        </div>
      );
    }
  }

  // URL or base64 image
  return (
    <div className={`${sizeClasses[size]} rounded-xl bg-muted flex items-center justify-center overflow-hidden`}>
      <img 
        src={value} 
        alt="Logo" 
        className="w-full h-full object-cover" 
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }} 
      />
    </div>
  );
}
