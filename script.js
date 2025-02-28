document.addEventListener('DOMContentLoaded', function() {
    let payments = JSON.parse(localStorage.getItem('payments')) || generatePayments();
    let currentPage = {
        'a-pagar': 1,
        'pagas': 1,
        'todas': 1
    };
    const itemsPerPage = 12;

    // Alternar modo escuro
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });

    // Verificar preferência de modo escuro salva
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    renderTabs(payments);

    function generatePayments() {
        const payments = [];
        const startDate = new Date(2025, 3, 1); // Abril de 2025
        const totalMonths = 25 * 12; // 25 anos

        for (let i = 0; i < totalMonths; i++) {
            const paymentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
            payments.push({
                month: paymentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }),
                amount: 1500,
                paid: false
            });
        }
        return payments;
    }

    function savePayments() {
        localStorage.setItem('payments', JSON.stringify(payments));
    }

    function renderPayments(payments, container, page) {
        container.innerHTML = '';
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedPayments = payments.slice(start, end);

        paginatedPayments.forEach(payment => {
            const card = document.createElement('div');
            card.className = `card ${payment.paid ? 'paid' : 'a-pagar'}`;
            card.innerHTML = `
                <h3>${payment.month}</h3>
                <p>Valor: R$ ${payment.amount.toFixed(2)}</p>
                <p>Status: ${payment.paid ? 'Pago' : 'A Pagar'}</p>
            `;
            card.addEventListener('click', function() {
                togglePaymentStatus(payment.month);
            });
            container.appendChild(card);
        });

        // Atualizar informações de paginação
        const totalPages = Math.ceil(payments.length / itemsPerPage);
        const pageInfo = container.parentElement.querySelector('.page-info');
        pageInfo.textContent = `Página ${page} de ${totalPages}`;

        // Habilitar/desabilitar botões de navegação
        const prevButton = container.parentElement.querySelector('.prev-page');
        const nextButton = container.parentElement.querySelector('.next-page');
        prevButton.disabled = page === 1;
        nextButton.disabled = page === totalPages;
    }

    function renderTabs(payments) {
        const aPagarContainer = document.querySelector('#a-pagar .card-container');
        const pagasContainer = document.querySelector('#pagas .card-container');
        const todasContainer = document.querySelector('#todas .card-container');

        const aPagar = payments.filter(payment => !payment.paid);
        const pagas = payments.filter(payment => payment.paid);

        renderPayments(aPagar, aPagarContainer, currentPage['a-pagar']);
        renderPayments(pagas, pagasContainer, currentPage['pagas']);
        renderPayments(payments, todasContainer, currentPage['todas']);
    }

    function togglePaymentStatus(month) {
        const payment = payments.find(p => p.month === month);
        if (payment) {
            payment.paid = !payment.paid;
            savePayments();
            renderTabs(payments);
        }
    }

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
        renderTabs(payments);
    };

    // Adicionar eventos de paginação
    document.querySelectorAll('.prev-page').forEach(button => {
        button.addEventListener('click', function() {
            const tab = this.closest('.tab-content').id;
            if (currentPage[tab] > 1) {
                currentPage[tab]--;
                renderTabs(payments);
            }
        });
    });

    document.querySelectorAll('.next-page').forEach(button => {
        button.addEventListener('click', function() {
            const tab = this.closest('.tab-content').id;
            const paymentsInTab = tab === 'a-pagar' ? payments.filter(p => !p.paid) :
                                  tab === 'pagas' ? payments.filter(p => p.paid) : payments;
            const totalPages = Math.ceil(paymentsInTab.length / itemsPerPage);
            if (currentPage[tab] < totalPages) {
                currentPage[tab]++;
                renderTabs(payments);
            }
        });
    });
});