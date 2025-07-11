import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ServiceCard } from '@/components/ServiceCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { 
  Smile, 
  Sparkles, 
  Heart, 
  Star,
  Syringe, 
  Baby, 
  Scissors,
  Sun,
  MessageCircle,
  Activity,
  Loader2
} from 'lucide-react';

// Componente SVG personalizado para o ícone de dente
const ToothIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="lucide lucide-activity"
  >
    <path d="M12 2a4 4 0 0 0-4 4 6 6 0 0 1-4.8 5.6C2.4 11.9 2 12.4 2 13v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5c0-.6-.4-1.1-1.2-1.4A6 6 0 0 1 16 6a4 4 0 0 0-4-4Z" />
    <path d="M12 2v10" />
    <path d="M8 8c-1.8 0-4 .5-4 2v2" />
    <path d="M16 8c1.8 0 4 .5 4 2v2" />
  </svg>
);

const Index = () => {
  const { settings, loading } = useTheme();

  // Para garantir que o scroll para as seções funcione
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        // Pequeno timeout para garantir que o componente foi renderizado
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            // Ajuste para o header fixo
            const headerHeight = 80; // Altura aproximada do header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
            
            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    };

    // Verificar ao carregar a página
    handleHashChange();

    // Adicionar listener para mudanças no hash
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Serviços com links personalizados para WhatsApp
  const services = [
    {
      title: 'Atendimento para toda a família',
      description: 'Cuidados odontológicos para pacientes de todas as idades com abordagem humanizada.',
      icon: <Smile className="h-8 w-8" />,
      whatsappLink: "https://api.whatsapp.com/send?phone=556492527548&text=Olá%2C%20gostaria%20de%20agendar%20um%20atendimento%20para%20minha%20família%20com%20a%20Dra.%20Aymée."
    },
    {
      title: 'Prevenção e profilaxia',
      description: 'Limpeza profissional e orientação preventiva para manter a saúde bucal em dia.',
      icon: <Sparkles className="h-8 w-8" />,
      whatsappLink: "https://api.whatsapp.com/send?phone=556492527548&text=Olá%2C%20vim%20do%20site%20e%20quero%20agendar%20uma%20limpeza%20e%20orientação%20preventiva."
    },
    {
      title: 'Cirurgia de freio labial ou lingual',
      description: 'Procedimento para corrigir limitações no movimento da língua ou lábio.',
      icon: <Scissors className="h-8 w-8" />,
      whatsappLink: "https://api.whatsapp.com/send?phone=556492527548&text=Olá%2C%20tenho%20interesse%20em%20fazer%20uma%20cirurgia%20de%20freio%20labial%20ou%20lingual."
    },
    {
      title: 'Restaurações dentárias',
      description: 'Recuperação estética e funcional de dentes com cáries ou fraturas.',
      icon: <Star className="h-8 w-8" />,
      whatsappLink: "https://api.whatsapp.com/send?phone=556492527548&text=Olá%2C%20preciso%20de%20restaurações%20dentárias%20e%20gostaria%20de%20agendar%20uma%20consulta."
    },
    {
      title: 'Tratamento de canal infantil',
      description: 'Procedimentos endodônticos adaptados para crianças com segurança e conforto.',
      icon: <Syringe className="h-8 w-8" />,
      whatsappLink: "https://api.whatsapp.com/send?phone=556492527548&text=Olá%2C%20gostaria%20de%20informações%20sobre%20tratamento%20de%20canal%20infantil."
    },
    {
      title: 'Pré-natal odontológico',
      description: 'Acompanhamento especializado para gestantes, garantindo saúde bucal para mãe e bebê.',
      icon: <Baby className="h-8 w-8" />,
      whatsappLink: "https://api.whatsapp.com/send?phone=556492527548&text=Olá%2C%20quero%20saber%20mais%20sobre%20o%20pré-natal%20odontológico."
    },
    {
      title: 'Cirurgias orais menores',
      description: 'Extrações e outros procedimentos cirúrgicos realizados com técnicas minimamente invasivas.',
      icon: <Heart className="h-8 w-8" />,
      whatsappLink: "https://api.whatsapp.com/send?phone=556492527548&text=Olá%2C%20tenho%20interesse%20em%20realizar%20uma%20cirurgia%20oral%20menor."
    },
    {
      title: 'Clareamento dental',
      description: 'Tratamentos estéticos para um sorriso mais branco e radiante de forma segura.',
      icon: <Sun className="h-8 w-8" />,
      whatsappLink: "https://api.whatsapp.com/send?phone=556492527548&text=Vim%20do%20seu%20site%20https%3A%2F%2Fdraaymeefrauzino.com%20e%20quero%20fazer%20clareamento%20dental."
    }
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <span className="text-lg font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{settings?.meta_title || 'Dra. Aymée Frauzino – Odontopediatra'}</title>
        <meta 
          name="description" 
          content={settings?.meta_description || 'Atendimento odontológico especializado para crianças em Morrinhos-GO. Odontopediatria de qualidade para a saúde bucal dos seus filhos.'}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Helmet>

      <Header />
      
      {/* Hero Section */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Cuidado odontológico especializado para seus filhos
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Proporcionando sorrisos saudáveis para crianças com atendimento humanizado e ambiente acolhedor.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button className="bg-primary hover:bg-primary/90" size="lg" asChild>
                  <a href="https://wa.me/556492527548" target="_blank" rel="noopener noreferrer">
                    Agendar Consulta
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#servicos">
                    Nossos Serviços
                  </a>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              {/* Placeholder para imagens de consultório */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                <div className="col-span-1 md:col-span-2">
                  <div className="w-full h-48 bg-blue-100 rounded-lg shadow-md flex items-center justify-center">
                    <ToothIcon />
                    <span className="ml-2 text-primary font-medium">Consultório Odontopediátrico</span>
                  </div>
                </div>
                <div>
                  <div className="w-full h-40 bg-blue-50 rounded-lg shadow-md flex items-center justify-center">
                    <Smile className="h-12 w-12 text-primary/70" />
                  </div>
                </div>
                <div>
                  <div className="w-full h-40 bg-blue-50 rounded-lg shadow-md flex items-center justify-center">
                    <Baby className="h-12 w-12 text-primary/70" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Sobre Section */}
      <section id="sobre" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Sobre Dra. Aymée Frauzino</h2>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/3 flex justify-center">
              {/* Placeholder para a foto da Dra. Aymée */}
              <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 bg-blue-50 flex items-center justify-center">
                <Activity className="h-20 w-20 text-primary" />
              </div>
            </div>
            
            <div className="md:w-2/3">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ 
                __html: settings?.about_text || `
                  <p>Dra. Aymée Frauzino é especialista em Odontopediatria, dedicada a proporcionar cuidados odontológicos de excelência para crianças de todas as idades.</p>
                  
                  <p>Formada pela Universidade Federal de Goiás, com especialização em Odontopediatria, possui ampla experiência no atendimento infantil, combinando técnica, conhecimento científico e uma abordagem lúdica e acolhedora.</p>
                  
                  <p>Seu consultório foi planejado para oferecer um ambiente tranquilo e divertido, onde as crianças possam se sentir seguras durante o tratamento. Dra. Aymée acredita que uma experiência positiva na infância é fundamental para formar adultos sem medo de ir ao dentista.</p>
                `
              }} />
              
              <div className="mt-6">
                <Button asChild>
                  <a href="https://wa.me/556492527548" target="_blank" rel="noopener noreferrer">
                    Entre em contato
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Serviços Section */}
      <section id="servicos" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Nossos Serviços</h2>
          <div className="text-center text-gray-600 mb-12 max-w-2xl mx-auto" dangerouslySetInnerHTML={{ 
            __html: settings?.services_text || `
              <p>Oferecemos uma variedade de tratamentos odontológicos para garantir a saúde bucal e o bem-estar dos nossos pacientes.</p>
            `
          }} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div key={index} className="flex flex-col h-full">
                <ServiceCard 
                  title={service.title}
                  description={service.description}
                  icon={service.icon}
                  className="flex-1"
                />
                <a 
                  href={service.whatsappLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Agendar via WhatsApp</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Depoimentos/CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Agende sua consulta hoje</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Estamos prontos para cuidar do sorriso da sua família com atendimento humanizado e personalizado.
          </p>
          
          <Button className="bg-primary hover:bg-primary/90" size="lg" asChild>
            <a href="https://wa.me/556492527548" target="_blank" rel="noopener noreferrer">
              Agendar Consulta via WhatsApp
            </a>
          </Button>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default Index;