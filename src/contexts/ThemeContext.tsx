import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
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

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        console.log("ThemeContext: Carregando configurações...");
        
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('ThemeContext: Erro ao carregar configurações:', error);
          setSettings(defaultSettings);
          return;
        }
        
        if (data) {
          console.log("ThemeContext: Configurações carregadas com sucesso:", data);
          
          // Combine com valores padrão para garantir que todos os campos estejam presentes
          const mergedSettings = {
            ...defaultSettings,
            ...data
          };
          
          setSettings(mergedSettings);
        } else {
          console.log("ThemeContext: Nenhuma configuração encontrada, usando valores padrão");
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('ThemeContext: Erro ao carregar configurações:', error);
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
        console.log('ThemeContext: Mudança detectada nas configurações:', payload);
        if (payload.new) {
          // Combine com valores padrão para garantir que todos os campos estejam presentes
          const mergedSettings = {
            ...defaultSettings,
            ...(payload.new as Partial<Settings>)
          };
          
          setSettings(mergedSettings);
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
      
      console.log("ThemeContext: Aplicando cores:", {
        primary: settings.primary_color,
        secondary: settings.secondary_color,
        accent: settings.accent_color
      });
    }
  }, [settings]);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      setLoading(true);
      console.log("ThemeContext: Atualizando configurações:", newSettings);
      
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
        console.error("ThemeContext: Erro na operação do Supabase:", result.error);
        throw result.error;
      }

      // Recarrega as configurações
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();
        
      if (error) {
        console.error("ThemeContext: Erro ao recarregar configurações:", error);
        throw error;
      }

      // Combine com valores padrão para garantir que todos os campos estejam presentes
      const mergedSettings = {
        ...defaultSettings,
        ...data
      };
      
      setSettings(mergedSettings);
      toast.success('Configurações atualizadas com sucesso!');
    } catch (error) {
      console.error('ThemeContext: Erro ao atualizar configurações:', error);
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