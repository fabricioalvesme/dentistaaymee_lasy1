import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Settings } from '@/lib/supabaseClient';

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
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Partial<Settings> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar configurações:', error);
          setSettings(defaultSettings);
        } else {
          setSettings(data || defaultSettings);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
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
      
      // Verifica se já existe uma entrada
      const { data: existingSettings } = await supabase
        .from('settings')
        .select('id')
        .limit(1);
      
      let result;
      
      if (existingSettings && existingSettings.length > 0) {
        // Atualiza a entrada existente
        result = await supabase
          .from('settings')
          .update(newSettings)
          .eq('id', existingSettings[0].id);
      } else {
        // Cria uma nova entrada
        result = await supabase
          .from('settings')
          .insert([{ ...defaultSettings, ...newSettings }]);
      }

      if (result.error) {
        throw result.error;
      }

      // Recarrega as configurações
      const { data } = await supabase
        .from('settings')
        .select('*')
        .single();

      setSettings(data || defaultSettings);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
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