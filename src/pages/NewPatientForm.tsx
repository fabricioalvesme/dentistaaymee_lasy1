// Apenas modificando a parte específica com o espaço extra
// Este é um trecho parcial focado na correção do problema

import { useState } from 'react';
// Outros imports permanecem inalterados

const NewPatientForm = () => {
  // Estados e métodos permanecem inalterados

  // Apenas a parte que contém os botões "Voltar" e "Próximo" será modificada
  
  // A função que renderiza os botões de navegação com espaçamento corrigido
  const renderNavigationButtons = (previousTab: string, nextAction: () => void) => {
    return (
      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setActiveTab(previousTab)}
        >
          Voltar
        </Button>
        
        <Button type="button" onClick={nextAction}>
          Próximo
        </Button>
      </div>
    );
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Novo Formulário - Dra. Aymée Frauzino</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Novo Formulário Clínico</h1>
          <p className="text-gray-500">Preencha os dados do paciente e histórico de saúde</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data, false))}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* TabsList e outros conteúdos permanecem inalterados */}
              
              {/* Modificando apenas a parte dos botões de navegação no histórico de saúde */}
              <TabsContent value="historico-saude" className="space-y-6 pt-4">
                {/* Conteúdo do histórico de saúde permanece inalterado */}
                
                {/* Botões de navegação com espaçamento corrigido */}
                {renderNavigationButtons('termo-atendimento', validateTabAndContinue)}
              </TabsContent>
              
              {/* Outras abas permanecem inalteradas */}
            </Tabs>
          </form>
        </Form>
      </div>
      
      {/* Diálogos permanecem inalterados */}
    </AdminLayout>
  );
};

export default NewPatientForm;