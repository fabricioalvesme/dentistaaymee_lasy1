import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Settings } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface ThemeContextType {
  settings: Partial<Settings> | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  settingsId: string | null;
}

const defaultSettings: Partial<Settings> = {
  primary_color: '#3B82F6',
  secondary_color: '#10B981',
  accent_color: '#F3F4F6',
  meta_title: 'Dra. Aymée Frauzino – Odontopediatra',
  meta_description: 'Atendimento odontológico especializado para crianças em Morrinhos-GO. Odontopediatria de qualidade para a saúde bucal dos seus filhos.',
  about_text: '',
  services_text: '',
  convenios_text: 'Unimed, Bradesco Saúde, Amil, SulAmérica e outros. Consulte disponibilidade.',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Partial<Settings> | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        console.log("Carregando configurações do Supabase...");
        
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar configurações:', error);
          setSettings(defaultSettings);
        } else if (data) {
          console.log("Configurações carregadas com sucesso:", data);
          setSettingsId(data.id);
          setSettings(data);
        } else {
          console.log("Nenhuma configuração encontrada, usando padrões");
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
    
    // Inscrever para mudanças em tempo real nas configurações
    const subscription = supabase
      .channel('settings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'settings' 
      }, payload => {
        console.log('Mudança detectada nas configurações:', payload);
        if (payload.new) {
          setSettings(payload.new as Partial<Settings>);
          setSettingsId((payload.new as Settings).id);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (settings) {
      // Aplicar variáveis CSS com as cores
      document.documentElement.style.setProperty('--color-primary', settings.primary_color || defaultSettings.primary_color!);
      document.documentElement.style.setProperty('--color-secondary', settings.secondary_color || defaultSettings.secondary_color!);
      document.documentElement.style.setProperty('--color-accent', settings.accent_color || defaultSettings.accent_color!);
    }
  }, [settings]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      setLoading(true);
      console.log("Atualizando configurações:", newSettings);
      
      // Verifica se já existe uma entrada
      if (settingsId) {
        console.log("Atualizando configuração existente com ID:", settingsId);
        // Atualiza a entrada existente
        const { data, error } = await supabase
          .from('settings')
          .update(newSettings)
          .eq('id', settingsId)
          .select();
        
        if (error) {
          console.error("Erro ao atualizar configurações:", error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log("Configurações atualizadas com sucesso:", data[0]);
          setSettings(data[0]);
        }
      } else {
        // Cria uma nova entrada
        console.log("Criando nova configuração");
        const { data, error } = await supabase
          .from('settings')
          .insert([{ ...defaultSettings, ...newSettings }])
          .select();
        
        if (error) {
          console.error("Erro ao criar configurações:", error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log("Configurações criadas com sucesso:", data[0]);
          setSettingsId(data[0].id);
          setSettings(data[0]);
        }
      }
      
      toast.success('Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      toast.error('Erro ao atualizar configurações. Tente novamente.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ settings, loading, updateSettings, settingsId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  
  return context;
}