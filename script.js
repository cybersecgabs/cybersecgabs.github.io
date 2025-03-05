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
  
    // Função para carregar pagamentos do Supabase
    async function carregarPagamentos() {
      const { data, error } = await supabase.from('pagamentos').select('*').order('id');
      if (error) {
        console.error('Erro ao carregar pagamentos:', error);
        return [];
      }
      return data;
    }
  
    // Função para atualizar o status do pagamento no Supabase
    async function atualizarPagamento(id, pago, data_pagamento = null) {
      const { error } = await supabase.from('pagamentos').update({ pago, data_pagamento }).eq('id', id);
      if (error) {
        console.error('Erro ao atualizar pagamento:', error);
        return false;
      }
      return true;
    }
  
    // Função para verificar a senha no Supabase
    async function verificarSenha(senhaDigitada) {
      const { data, error } = await supabase.from('configuracoes').select('valor').eq('chave', 'senha_alteracao');
      if (error || !data || data.length === 0) {
        console.error('Erro ao verificar senha:', error);
        return false;
      }
      return data[0].valor === senhaDigitada;
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
      const payments = await carregarPagamentos();
      const aPagarContainer = document.querySelector('#a-pagar .card-container');
      const pagasContainer = document.querySelector('#pagas .card-container');
      const todasContainer = document.querySelector('#todas .card-container');
  
      const aPagar = payments.filter(payment => !payment.pago);
      const pagas = payments.filter(payment => payment.pago);
  
      renderPayments(aPagar, aPagarContainer, currentPage['a-pagar']);
      renderPayments(pagas, pagasContainer, currentPage['pagas']);
      renderPayments(payments, todasContainer, currentPage['todas']);
    }
  
    // Função para alternar o status com input de senha
    function togglePaymentStatus(id, currentStatus) {
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
    
        // Eventos dos botões
        document.getElementById('confirmar-senha').addEventListener('click', async function() {
            const senha = document.getElementById('senha-input').value;
            const isValid = await verificarSenha(senha);
            if (isValid) {
                const newStatus = !currentStatus;
                const data_pagamento = newStatus ? new Date().toISOString() : null;
                const sucesso = await atualizarPagamento(id, newStatus, data_pagamento);
                if (sucesso) {
                    overlay.remove();
                    renderTabs();
                }
            } else {
                alert('Senha incorreta!');
            }
        });
    
        document.getElementById('cancelar-senha').addEventListener('click', function() {
            overlay.remove();
        });
    }
  
    // Função para abrir abas
    window.openTab = function(event, tabName) {
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
    };
  
    // Eventos de paginação
    document.querySelectorAll('.prev-page').forEach(button => {
      button.addEventListener('click', function() {
        const tab = this.closest('.tab-content').id;
        if (currentPage[tab] > 1) {
          currentPage[tab]--;
          renderTabs();
        }
      });
    });
  
    document.querySelectorAll('.next-page').forEach(button => {
      button.addEventListener('click', async function() {
        const tab = this.closest('.tab-content').id;
        const payments = await carregarPagamentos();
        const paymentsInTab = tab === 'a-pagar' ? payments.filter(p => !p.pago) :
                             tab === 'pagas' ? payments.filter(p => p.pago) : payments;
        const totalPages = Math.ceil(paymentsInTab.length / itemsPerPage);
        if (currentPage[tab] < totalPages) {
          currentPage[tab]++;
          renderTabs();
        }
      });
    });
  
    // Inicializar
    renderTabs();
  });
