import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, supabaseError } from '@/lib/supabaseClient';
import type { Settings } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface ThemeContextType {
  settings: Partial<Settings> | null;
  loading: boolean;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
}

const defaultSettings: Partial<Settings> = {
  primary_color: '#3B82F6',
  secondary_color: '#10B981',
  accent_color: '#F3F4F6',
  meta_title: 'Dra. Aymée Frauzino – Odontopediatra',
  meta_description: 'Atendimento odontológico especializado para crianças em Morrinhos-GO. Odontopediatria de qualidade para a saúde bucal dos seus filhos.',
  convenios_text: 'Unimed, Bradesco Saúde, Amil, SulAmérica e outros. Consulte disponibilidade.',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Partial<Settings> | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Carregar configurações do Supabase - executado apenas uma vez
  useEffect(() => {
    async function loadSettings() {
      if (dataLoaded || supabaseError) {
        setSettings(defaultSettings);
        setLoading(false);
        return;
      }
      
      try {
        console.log("ThemeContext - Carregando configurações iniciais");
        setLoading(true);
        
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar configurações (ThemeContext):', error);
          setSettings(defaultSettings);
        } else {
          console.log("ThemeContext - Configurações carregadas:", data);
          setSettings(data || defaultSettings);
        }
        
        setDataLoaded(true);
      } catch (error) {
        console.error('Erro geral ao carregar configurações (ThemeContext):', error);
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
    
    if (supabase) {
      const channel = supabase
        .channel('settings-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'settings' 
        }, payload => {
          console.log('ThemeContext - Mudança detectada nas configurações:', payload);
          if (payload.new) {
            setSettings(payload.new as Partial<Settings>);
          }
        })
        .subscribe((status) => {
          console.log("ThemeContext - Status do canal de realtime:", status);
        });
        
      return () => {
        console.log("ThemeContext - Removendo listener de realtime");
        supabase.removeChannel(channel);
      };
    }
  }, [dataLoaded]);

  // Aplicar as cores do tema quando as configurações mudarem
  useEffect(() => {
    if (settings) {
      console.log("ThemeContext - Aplicando variáveis CSS com as cores");
      document.documentElement.style.setProperty('--color-primary', settings.primary_color || defaultSettings.primary_color!);
      document.documentElement.style.setProperty('--color-secondary', settings.secondary_color || defaultSettings.secondary_color!);
      document.documentElement.style.setProperty('--color-accent', settings.accent_color || defaultSettings.accent_color!);
    }
  }, [settings]);

  // Função para atualizar as configurações
  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!supabase) {
      toast.error('Serviço indisponível. Verifique a configuração.');
      return;
    }
    
    try {
      setLoading(true);
      console.log("ThemeContext - Atualizando configurações:", newSettings);
      
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('id')
        .limit(1);
      
      let result;
      
      if (existingSettings && existingSettings.length > 0) {
        result = await supabase
          .from('settings')
          .update(newSettings)
          .eq('id', existingSettings[0].id);
      } else {
        result = await supabase
          .from('settings')
          .insert([{ ...defaultSettings, ...newSettings }]);
      }

      if (result.error) {
        throw result.error;
      }

      toast.success('Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar configurações (ThemeContext):', error);
      toast.error('Erro ao atualizar configurações. Tente novamente.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ settings, loading, updateSettings }}>
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