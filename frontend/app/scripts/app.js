app.initialized().then(function(client) {
    window.client = client;
    const openModalBtn = document.getElementById('openModal');
    // Initialize Claude API
    initializeClaudeApi()
        .then(() => {
            console.log('Claude API initialized successfully');
        })
        .catch(error => {
            console.error('Claude API initialization error:', error);
        });

    // Modal trigger setup
    openModalBtn.addEventListener('click', function() {
        client.interface.trigger("showModal", {
            title: "AI Assistant",
            template: "views/modal.html"
        }).catch(function(error) {
            console.error('Error opening modal:', error);
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

        if (!window.claudeApi) {
            showError(resultsContainer, 'Claude API가 초기화되지 않았습니다.');
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

        if (!window.claudeApi) {
            showError(resultsContainer, 'Claude API가 초기화되지 않았습니다.');
            return;
        }

        searchFaq(searchInput.value, resultsContainer);
    });

    // Generate AI response
    document.getElementById('generateResponse').addEventListener('click', function() {
        const resultsContainer = document.getElementById('aiResponse');
        
        if (!window.claudeApi) {
            showError(resultsContainer, 'Claude API가 초기화되지 않았습니다.');
            return;
        }
        generateResponse(resultsContainer);
    });
});

async function initializeClaudeApi() {
    try {
        const installation = await client.iparams.get();
        const apiKey = installation.claude_api_key;
        const model = installation.ai_model || 'claude-3-opus-20240229';
        
        if (!apiKey) {
            console.error('Claude API 키가 설정되지 않았습니다.');
            return;
        }
        
        window.claudeApi = new ClaudeAPI(apiKey, model);
        return window.claudeApi;
    } catch (error) {
        throw new Error('설치 파라미터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    }
}

// Helper functions
function showLoading(container) {
    container.innerHTML = '<div class="loading">검색 중...</div>';
}

function showError(container, message) {
    container.innerHTML = `<div class="error">${message}</div>`;
}

// Search for similar tickets
function searchSimilarTickets(query, container) {
    showLoading(container);
    
    client.data.get('ticket')
        .then(function(data) {
            const ticketData = prepareTicketData(data);
            return window.claudeApi.searchSimilarTickets(ticketData, query);
        })
        .then(response => {
            displaySearchResults(container, response, 'ticket');
        })
        .catch(error => {
            showError(container, '검색 중 오류가 발생했습니다: ' + error.message);
        });
}

// Search for FAQ entries
function searchFaq(query, container) {
    showLoading(container);
    
    window.claudeApi.searchFAQ(query)
        .then(response => {
            displaySearchResults(container, response, 'faq');
        })
        .catch(error => {
            showError(container, '검색 중 오류가 발생했습니다: ' + error.message);
        });
}

// Generate AI response
function generateResponse(container) {
    showLoading(container);
    
    client.data.get('ticket')
        .then(function(data) {
            const ticketData = prepareTicketData(data);
            const context = prepareContextData(data);
            return window.claudeApi.generateResponse(ticketData, context);
        })
        .then(response => {
            displayAiResponse(container, response);
        })
        .catch(error => {
            showError(container, '답변 생성 중 오류가 발생했습니다: ' + error.message);
        });
}

// Prepare ticket data
function prepareTicketData(data) {
    return {
        subject: data.ticket.subject || '',
        description: data.ticket.description || '',
        priority: data.ticket.priority || 'medium',
        status: data.ticket.status || 'open'
    };
}

// Prepare context data
function prepareContextData(data) {
    return {
        customer: data.ticket.requester || {},
        tags: data.ticket.tags || [],
        custom_fields: data.ticket.custom_fields || {}
    };
}

// Display search results
function displaySearchResults(container, response, type) {
    if (response.results && response.results.length > 0) {
        displayResults(container, response.results, type);
    } else {
        showError(container, type === 'ticket' ? '유사한 티켓이 없습니다.' : '관련 FAQ가 없습니다.');
    }
}

// Display results
function displayResults(container, results, type) {
    try {
        const html = results.map(result => {
            const content = type === 'ticket' ? result.description : result.answer;
            const score = (result.score * 100).toFixed(1);
            
            return `
                <div class="result-item">
                    <div class="result-content">${content}</div>
                    <div class="result-score">유사도: ${score}%</div>
                    <button class="copy-button" data-text="${content}">답변에 추가</button>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        
        // Add copy functionality
        addCopyFunctionality(container);
    } catch (error) {
        showError(container, '결과를 표시하는 중 오류가 발생했습니다: ' + error.message);
    }
}

// Display AI response
function displayAiResponse(container, response) {
    try {
        container.innerHTML = `
            <div class="result-item">
                <div class="result-content">${response}</div>
                <button class="copy-button" data-text="${response}">답변에 추가</button>
            </div>
        `;
        
        // Add copy functionality
        addCopyFunctionality(container);
    } catch (error) {
        showError(container, '답변을 표시하는 중 오류가 발생했습니다: ' + error.message);
    }
}

// Add copy functionality to buttons
function addCopyFunctionality(container) {
    container.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', function() {
            const text = this.getAttribute('data-text');
            // text를 사용해서 실제로 복사하는 코드 추가
            client.interface.trigger('setText', { text: text }).then(() => {
    client.interface.trigger('showNotify', {
        type: 'success',
        message: '답변이 복사되었습니다.'
    });
        });
    });
    });
}
