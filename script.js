document.addEventListener('DOMContentLoaded', function() {
    // Configuração do Supabase
    const supabaseUrl = 'https://ffnfmluhpkrzcgodftnw.supabase.co'; // Substitua pela sua URL
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbmZtbHVocGtyemNnb2RmdG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExODIwNTAsImV4cCI6MjA1Njc1ODA1MH0.H-hU8PDyhopKe6nFPVgvcAtK3Wq-CocsAoozEnyAA8I';   // Substitua pela sua chave pública
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  
    let currentPage = {
      'a-pagar': 1,
      'pagas': 1,
      'todas': 1
    };
    const itemsPerPage = 12;

    function openTab(event, tabName) {
        // Esconde todos os conteúdos das abas
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => tab.classList.remove('active'));
      
        // Remove a classe 'active' de todos os botões
        const tabLinks = document.querySelectorAll('.tab-link');
        tabLinks.forEach(link => link.classList.remove('active'));
      
        // Mostra o conteúdo da aba clicada e marca o botão como ativo
        document.getElementById(tabName).classList.add('active');
        event.currentTarget.classList.add('active');
    }
  
    // Alternar modo escuro
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('click', function() {
      document.body.classList.toggle('dark-mode');
      localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
  
    if (localStorage.getItem('darkMode') === 'true') {
      document.body.classList.add('dark-mode');
    }

    // Função para verificar se um pagamento foi atualizado
    async function verificarAtualizacao(id) {
      try {
        const { data, error } = await supabase
          .from('pagamentos')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Erro ao verificar atualização:', error);
          return null;
        }
        
        console.log('Estado atual do pagamento no banco:', data);
        return data;
      } catch (e) {
        console.error('Exceção ao verificar atualização:', e);
        return null;
      }
    }
  
    // Função para carregar pagamentos do Supabase
    async function carregarPagamentos() {
      try {
        console.log('Carregando pagamentos frescos do Supabase...');
        
        // Adicionar um pequeno atraso para dar tempo ao Supabase de processar a atualização
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const { data, error } = await supabase
          .from('pagamentos')
          .select('*')
          .order('id');
          
        if (error) {
          console.error('Erro ao carregar pagamentos:', error);
          return [];
        }
        
        if (!data || data.length === 0) {
          console.warn('Nenhum pagamento retornado do Supabase');
        } else {
          console.log(`${data.length} pagamentos carregados com sucesso`);
        }
        
        return data || [];
      } catch (e) {
        console.error('Exceção ao carregar pagamentos:', e);
        return [];
      }
    }
  
    // Função para atualizar o status do pagamento no Supabase
    async function atualizarPagamento(id, pago, data_pagamento = null) {
      try {
        console.log(`Tentando atualizar pagamento ID ${id} para ${pago ? 'pago' : 'não pago'}`);
        
        const updateData = { pago, data_pagamento };
        console.log('Dados a serem atualizados:', updateData);
        
        const { data, error } = await supabase
          .from('pagamentos')
          .update(updateData)
          .eq('id', id)
          .select();
      
        if (error) {
          console.error('Erro ao atualizar pagamento:', error);
          return false;
        }
        
        // Verifica se data é um array e se tem pelo menos um elemento
        if (Array.isArray(data) && data.length > 0) {
          console.log('Pagamento atualizado com sucesso:', data[0]);
          return true;
        } else if (data) {
          // Se data não for array mas existir
          console.log('Pagamento atualizado com sucesso:', data);
          return true;
        } else {
          console.error('Resposta vazia do Supabase após atualização');
          return false;
        }
      } catch (e) {
        console.error('Exceção ao atualizar pagamento:', e);
        return false;
      }
    }
  
    // Função para verificar a senha no Supabase
    async function verificarSenha(senhaDigitada) {
      try {
        const { data, error } = await supabase
          .from('configuracoes')
          .select('valor')
          .eq('chave', 'senha_alteracao');
          
        if (error || !data || data.length === 0) {
          console.error('Erro ao verificar senha:', error);
          return false;
        }
        return data[0].valor === senhaDigitada;
      } catch (e) {
        console.error('Exceção ao verificar senha:', e);
        return false;
      }
    }
  
    // Função para renderizar os pagamentos
    function renderPayments(payments, container, page) {
      container.innerHTML = '';
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedPayments = payments.slice(start, end);
  
      paginatedPayments.forEach(payment => {
        const card = document.createElement('div');
        card.className = `card ${payment.pago ? 'paid' : 'a-pagar'}`;
        card.innerHTML = `
          <h3>${payment.mes}</h3>
          <p>Valor: R$ ${payment.valor.toFixed(2)}</p>
          <p>Status: ${payment.pago ? 'Pago' : 'A Pagar'}</p>
          ${payment.pago ? `<p>Pago em: ${new Date(payment.data_pagamento).toLocaleDateString('pt-BR')}</p>` : ''}
        `;
        card.dataset.id = payment.id; // Armazenar o ID no card para uso posterior
        card.addEventListener('click', function() {
          togglePaymentStatus(payment.id, payment.pago);
        });
        container.appendChild(card);
      });
  
      const totalPages = Math.ceil(payments.length / itemsPerPage);
      const pageInfo = container.parentElement.querySelector('.page-info');
      pageInfo.textContent = `Página ${page} de ${totalPages}`;
  
      const prevButton = container.parentElement.querySelector('.prev-page');
      const nextButton = container.parentElement.querySelector('.next-page');
      prevButton.disabled = page === 1;
      nextButton.disabled = page === totalPages;
    }
  
    // Função para renderizar as abas
    async function renderTabs() {
      try {
        console.log('Iniciando renderização das abas...');
        
        // Forçar recarregamento dos dados
        const payments = await carregarPagamentos();
        console.log('Dados recuperados para renderização:', payments);
        
        if (!payments || payments.length === 0) {
          console.warn('Sem dados para renderizar!');
          return;
        }
      
        // Limpar os containers antes de renderizar novamente
        const containers = {
          'a-pagar': document.querySelector('#a-pagar .card-container'),
          'pagas': document.querySelector('#pagas .card-container'),
          'todas': document.querySelector('#todas .card-container')
        };
      
        const aPagar = payments.filter(payment => !payment.pago);
        const pagas = payments.filter(payment => payment.pago);
      
        console.log(`Total: ${payments.length}, A pagar: ${aPagar.length}, Pagas: ${pagas.length}`);
      
        // Resetar a paginação se necessário
        currentPage['a-pagar'] = Math.min(currentPage['a-pagar'], Math.ceil(aPagar.length / itemsPerPage) || 1);
        currentPage['pagas'] = Math.min(currentPage['pagas'], Math.ceil(pagas.length / itemsPerPage) || 1);
        currentPage['todas'] = Math.min(currentPage['todas'], Math.ceil(payments.length / itemsPerPage) || 1);
      
        renderPayments(aPagar, containers['a-pagar'], currentPage['a-pagar']);
        renderPayments(pagas, containers['pagas'], currentPage['pagas']);
        renderPayments(payments, containers['todas'], currentPage['todas']);
        
        console.log('Renderização das abas concluída');
      } catch (e) {
        console.error('Erro durante a renderização das abas:', e);
      }
    }
  
    // Função para alternar o status com input de senha
    async function togglePaymentStatus(id, currentStatus) {
      try {
        console.log(`Tentando alternar status do pagamento ID ${id}, status atual: ${currentStatus}`);
        
        // Remover qualquer input de senha anterior
        const existingInput = document.querySelector('.senha-overlay');
        if (existingInput) existingInput.remove();
    
        // Criar overlay para o input de senha
        const overlay = document.createElement('div');
        overlay.className = 'senha-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
    
        // Verificar se o modo escuro está ativo
        const isDarkMode = document.body.classList.contains('dark-mode');
    
        // Criar a caixa de input com estilos condicionais
        const inputBox = document.createElement('div');
        inputBox.style.cssText = `
            background: ${isDarkMode ? '#34495e' : 'white'};
            padding: 20px;
            border-radius: 5px;
            text-align: center;
            color: ${isDarkMode ? '#ecf0f1' : '#2c3e50'};
        `;
    
        // Conteúdo da caixa de input com estilos condicionais
        inputBox.innerHTML = `
            <p>Digite a senha para alterar o status:</p>
            <input type="password" id="senha-input" style="
                margin: 10px;
                padding: 5px;
                background: ${isDarkMode ? '#2c3e50' : '#fff'};
                color: ${isDarkMode ? '#ecf0f1' : '#2c3e50'};
                border: 1px solid ${isDarkMode ? '#7f8c8d' : '#bdc3c7'};
                border-radius: 3px;
            ">
            <br>
            <button id="confirmar-senha" style="
                background: ${isDarkMode ? '#3498db' : '#3498db'};
                color: #fff;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
            ">Confirmar</button>
            <button id="cancelar-senha" style="
                margin-left: 10px;
                background: ${isDarkMode ? '#e74c3c' : '#e74c3c'};
                color: #fff;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
            ">Cancelar</button>
        `;
    
        overlay.appendChild(inputBox);
        document.body.appendChild(overlay);
    
        // Focar no input de senha
        setTimeout(() => {
          const senhaInput = document.getElementById('senha-input');
          if (senhaInput) senhaInput.focus();
        }, 100);
    
        // Eventos dos botões
        document.getElementById('confirmar-senha').addEventListener('click', async function() {
          try {
            const senha = document.getElementById('senha-input').value;
            console.log('Verificando senha...');
            const isValid = await verificarSenha(senha);
            
            if (isValid) {
              console.log('Senha válida! Atualizando status...');
              const newStatus = !currentStatus;
              const data_pagamento = newStatus ? new Date().toISOString() : null;
              
              try {
                const sucesso = await atualizarPagamento(id, newStatus, data_pagamento);
                
                console.log('Resultado da atualização:', sucesso);
                
                // Verificar se foi realmente atualizado
                const estadoAtual = await verificarAtualizacao(id);
                console.log('Estado atual verificado após atualização:', estadoAtual);
                
                // Remover o overlay independentemente do resultado
                overlay.remove();
                
                // Forçar atualização da interface
                console.log('Atualizando interface após alteração...');
                await carregarPagamentos(); // Limpar qualquer cache
                await renderTabs();
                console.log('Interface atualizada com sucesso!');
                
                if (!sucesso) {
                  // Mostrar alerta somente se houver falha explícita
                  alert('Aviso: Houve um problema na atualização, mas tentamos recarregar a interface. Verifique se a mudança foi aplicada.');
                }
              } catch (err) {
                console.error('Erro na atualização:', err);
                overlay.remove();
                alert('Erro ao processar a atualização.');
              }
            } else {
              console.warn('Senha inválida');
              alert('Senha incorreta!');
            }
          } catch (e) {
            console.error('Erro ao processar confirmação:', e);
            alert('Ocorreu um erro. Por favor, tente novamente.');
          }
        });
    
        document.getElementById('cancelar-senha').addEventListener('click', function() {
          console.log('Operação cancelada pelo usuário');
          overlay.remove();
        });
        
        // Permitir que a tecla Enter confirme a senha
        document.getElementById('senha-input').addEventListener('keypress', function(event) {
          if (event.key === 'Enter') {
            document.getElementById('confirmar-senha').click();
          }
        });
      } catch (e) {
        console.error('Erro ao abrir o diálogo de senha:', e);
      }
    }
  
    // Função para abrir abas (versão global)
    window.openTab = function(event, tabName) {
      try {
        console.log(`Abrindo aba: ${tabName}`);
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => {
          tab.style.display = 'none';
          tab.classList.remove('active');
        });
    
        const tabLinks = document.querySelectorAll('.tab-link');
        tabLinks.forEach(link => link.classList.remove('active'));
    
        const selectedTab = document.getElementById(tabName);
        selectedTab.style.display = 'block';
        setTimeout(() => selectedTab.classList.add('active'), 10);
        event.currentTarget.classList.add('active');
        renderTabs();
      } catch (e) {
        console.error(`Erro ao abrir a aba ${tabName}:`, e);
      }
    };
  
    // Eventos de paginação
    document.querySelectorAll('.prev-page').forEach(button => {
      button.addEventListener('click', function() {
        try {
          const tab = this.closest('.tab-content').id;
          console.log(`Navegando para página anterior na aba ${tab}`);
          if (currentPage[tab] > 1) {
            currentPage[tab]--;
            renderTabs();
          }
        } catch (e) {
          console.error('Erro ao navegar para página anterior:', e);
        }
      });
    });
  
    document.querySelectorAll('.next-page').forEach(button => {
      button.addEventListener('click', async function() {
        try {
          const tab = this.closest('.tab-content').id;
          console.log(`Navegando para próxima página na aba ${tab}`);
          const payments = await carregarPagamentos();
          const paymentsInTab = tab === 'a-pagar' ? payments.filter(p => !p.pago) :
                               tab === 'pagas' ? payments.filter(p => p.pago) : payments;
          const totalPages = Math.ceil(paymentsInTab.length / itemsPerPage);
          if (currentPage[tab] < totalPages) {
            currentPage[tab]++;
            renderTabs();
          }
        } catch (e) {
          console.error('Erro ao navegar para próxima página:', e);
        }
      });
    });
  
    // Inicializar
    console.log('Inicializando aplicação...');
    renderTabs().catch(error => {
      console.error('Erro durante a inicialização:', error);
    });
});
