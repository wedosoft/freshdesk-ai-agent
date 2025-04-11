document.addEventListener('DOMContentLoaded', function() {
    // Initialize Freshdesk client
    client.init();

    // Get modal elements
    const modal = document.getElementById('aiModal');
    const openModalBtn = document.getElementById('openModal');
    const closeModalBtn = document.querySelector('.close');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Open modal
    openModalBtn.addEventListener('click', function() {
        modal.style.display = 'block';
    });

    // Close modal
    closeModalBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Search similar tickets
    document.getElementById('searchSimilarTickets').addEventListener('click', function() {
        const searchInput = document.getElementById('similarTicketsSearch');
        const resultsContainer = document.getElementById('similarTicketsResults');
        
        if (!searchInput.value.trim()) {
            showError(resultsContainer, '검색어를 입력해주세요.');
            return;
        }

        searchSimilarTickets(searchInput.value, resultsContainer);
    });

    // Search FAQ
    document.getElementById('searchFaq').addEventListener('click', function() {
        const searchInput = document.getElementById('faqSearch');
        const resultsContainer = document.getElementById('faqResults');
        
        if (!searchInput.value.trim()) {
            showError(resultsContainer, '검색어를 입력해주세요.');
            return;
        }

        searchFaq(searchInput.value, resultsContainer);
    });

    // Generate AI response
    document.getElementById('generateResponse').addEventListener('click', function() {
        const resultsContainer = document.getElementById('aiResponse');
        generateResponse(resultsContainer);
    });
});

// Helper functions
function showLoading(container) {
    container.innerHTML = '<div class="loading">검색 중...</div>';
}

function showError(container, message) {
    container.innerHTML = `<div class="error">${message}</div>`;
}

function searchSimilarTickets(query, container) {
    showLoading(container);
    
    client.data.get('ticket').then(function(data) {
        const ticketId = data.ticket.id;
        
        // Call your API endpoint for similar tickets
        fetchSimilarTickets(ticketId, query)
            .then(response => {
                if (response.results && response.results.length > 0) {
                    displayResults(container, response.results, 'ticket');
                } else {
                    showError(container, '유사한 티켓이 없습니다.');
                }
            })
            .catch(error => {
                showError(container, '검색 중 오류가 발생했습니다.');
                console.error('Error searching similar tickets:', error);
            });
    });
}

function searchFaq(query, container) {
    showLoading(container);
    
    client.data.get('ticket').then(function(data) {
        const ticketId = data.ticket.id;
        
        // Call your API endpoint for FAQ
        fetchFaq(ticketId, query)
            .then(response => {
                if (response.results && response.results.length > 0) {
                    displayResults(container, response.results, 'faq');
                } else {
                    showError(container, '관련 FAQ가 없습니다.');
                }
            })
            .catch(error => {
                showError(container, '검색 중 오류가 발생했습니다.');
                console.error('Error searching FAQ:', error);
            });
    });
}

function generateResponse(container) {
    showLoading(container);
    
    client.data.get('ticket').then(function(data) {
        const ticketId = data.ticket.id;
        
        // Call your API endpoint for AI response
        fetchAiResponse(ticketId)
            .then(response => {
                if (response.response) {
                    displayAiResponse(container, response.response);
                } else {
                    showError(container, '답변을 생성할 수 없습니다.');
                }
            })
            .catch(error => {
                showError(container, '답변 생성 중 오류가 발생했습니다.');
                console.error('Error generating AI response:', error);
            });
    });
}

function displayResults(container, results, type) {
    const html = results.map(result => `
        <div class="result-item">
            <div class="result-content">${result.text}</div>
            <div class="result-score">유사도: ${(result.score * 100).toFixed(1)}%</div>
            <button class="copy-button" data-text="${result.text}">답변에 추가</button>
        </div>
    `).join('');
    
    container.innerHTML = html;
    
    // Add copy functionality
    container.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', function() {
            const text = this.getAttribute('data-text');
            copyToReply(text);
        });
    });
}

function displayAiResponse(container, response) {
    container.innerHTML = `
        <div class="result-item">
            <div class="result-content">${response}</div>
            <button class="copy-button" data-text="${response}">답변에 추가</button>
        </div>
    `;
    
    // Add copy functionality
    container.querySelector('.copy-button').addEventListener('click', function() {
        const text = this.getAttribute('data-text');
        copyToReply(text);
    });
}

function copyToReply(text) {
    client.instance.send({
        message: {
            type: 'copyToReply',
            text: text
        }
    });
}

// API call functions
async function fetchSimilarTickets(ticketId, query) {
    const apiEndpoint = await client.instance.get('apiEndpoint');
    const response = await fetch(`${apiEndpoint}/similar-tickets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ticket_id: ticketId,
            query: query
        })
    });
    return response.json();
}

async function fetchFaq(ticketId, query) {
    const apiEndpoint = await client.instance.get('apiEndpoint');
    const response = await fetch(`${apiEndpoint}/faq`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ticket_id: ticketId,
            query: query
        })
    });
    return response.json();
}

async function fetchAiResponse(ticketId) {
    const apiEndpoint = await client.instance.get('apiEndpoint');
    const response = await fetch(`${apiEndpoint}/generate-response`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ticket_id: ticketId
        })
    });
    return response.json();
}

app.initialized().then(function(_client) {
    window.client = _client;
    client.events.on('app.activated', function() {
        // AI 응답 생성 버튼 클릭 이벤트
        document.getElementById('generate-response').addEventListener('click', function() {
            const ticketId = document.getElementById('ticket-id').value;
            const query = document.getElementById('user-query').value;
            
            if (!ticketId || !query) {
                showNotification('Please enter both ticket ID and query', 'error');
                return;
            }
            
            generateAIResponse(ticketId, query);
        });
    });
});

async function generateAIResponse(ticketId, query) {
    try {
        showLoading(true);
        
        const response = await client.request.invoke('generateResponse', {
            body: JSON.stringify({
                ticket_id: ticketId,
                query: query
            })
        });
        
        const data = JSON.parse(response.response);
        document.getElementById('ai-response').innerHTML = data.response;
        showNotification('Response generated successfully', 'success');
    } catch (error) {
        console.error('Error generating AI response:', error);
        showNotification('Failed to generate response', 'error');
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const loadingElement = document.getElementById('loading');
    if (show) {
        loadingElement.style.display = 'block';
    } else {
        loadingElement.style.display = 'none';
    }
}

function showNotification(message, type) {
    client.interface.trigger('showNotify', {
        type: type,
        message: message
    });
} 