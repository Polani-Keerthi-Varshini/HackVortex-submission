class FactCheckChatbot {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.init();
    }

    init() {
        this.createChatbotHTML();
        this.bindEvents();
        this.addWelcomeMessage();
    }

    createChatbotHTML() {
        const chatbotHTML = `
            <div class="chatbot-container">
                <button class="chatbot-toggle" id="chatbot-toggle">
                    💬
                </button>
                <div class="chatbot-window" id="chatbot-window">
                    <div class="chatbot-header">
                        <div class="chatbot-title">
                            🔍 TruthLens Fact Checker
                        </div>
                        <button class="chatbot-close" id="chatbot-close">
                            ×
                        </button>
                    </div>
                    <div class="chatbot-messages" id="chatbot-messages">
                        <div class="welcome-message">
                            Ask me to fact-check any claim!
                        </div>
                    </div>
                    <div class="typing-indicator" id="typing-indicator">
                        <span>TruthLens is checking...</span>
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                    <div class="chatbot-input">
                        <div class="input-group">
                            <textarea 
                                class="chat-input" 
                                id="chat-input" 
                                placeholder="Enter a claim to fact-check..."
                                rows="1"
                            ></textarea>
                            <button class="send-button" id="send-button">
                                ➤
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    bindEvents() {
        const toggle = document.getElementById('chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const sendButton = document.getElementById('send-button');
        const input = document.getElementById('chat-input');

        toggle.addEventListener('click', () => this.toggleChatbot());
        close.addEventListener('click', () => this.closeChatbot());
        sendButton.addEventListener('click', () => this.sendMessage());
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        input.addEventListener('input', () => this.autoResize(input));
    }

    toggleChatbot() {
        const window = document.getElementById('chatbot-window');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            window.classList.add('open');
            document.getElementById('chat-input').focus();
        } else {
            window.classList.remove('open');
        }
    }

    closeChatbot() {
        document.getElementById('chatbot-window').classList.remove('open');
        this.isOpen = false;
    }

    autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 80) + 'px';
    }

    addWelcomeMessage() {
        this.addMessage('bot', `Hi! I'm your fact-checking assistant. Send me any claim and I'll verify it with reliable sources.

Try asking me about:
• Health claims
• Scientific statements  
• News headlines
• Social media posts

What would you like me to fact-check?`);
    }

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        input.value = '';
        input.style.height = 'auto';

        // Show typing indicator
        this.showTyping(true);

        try {
            // Send to fact-checking API
            const response = await fetch('/api/fact-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: message })
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            
            // Hide typing indicator
            this.showTyping(false);

            // Process and display results
            this.displayFactCheckResult(data);

        } catch (error) {
            this.showTyping(false);
            this.addMessage('bot', `Sorry, I encountered an error while fact-checking your claim. Please try again later.

Error: ${error.message}`);
        }
    }

    displayFactCheckResult(data) {
        if (!data.results || !data.results[0]) {
            this.addMessage('bot', 'I couldn\'t analyze that claim. Please try rephrasing it or provide more specific information.');
            return;
        }

        const result = data.results[0];
        const score = result.credibility_score || 0;
        const status = result.status || 'unknown';
        const reasoning = result.reasoning || 'No reasoning available';
        const factualNews = result.factual_news || '';

        let statusText = this.getStatusText(status);
        let statusClass = this.getStatusClass(status);

        let responseMessage = `Here's what I found about your claim:

**${statusText}**

**Credibility Score:** ${score.toFixed(1)}/10

**Analysis:** ${reasoning}`;

        if (factualNews && !factualNews.includes('Current available evidence from reputable sources')) {
            responseMessage += `

**Factual Information:**
${factualNews}`;
        }

        if (result.sources && result.sources.length > 0) {
            responseMessage += `

**Sources:** ${result.sources.join(', ')}`;
        }

        this.addMessage('bot', responseMessage, {
            status: statusClass,
            score: score,
            reasoning: reasoning
        });
    }

    getStatusText(status) {
        const statusMap = {
            'true': '✅ VERIFIED - This claim is TRUE',
            'mostly true': '✅ MOSTLY TRUE - This claim is largely accurate',
            'mixed': '⚠️ MIXED - This claim has both true and false elements',
            'mostly false': '❌ MOSTLY FALSE - This claim is largely inaccurate',
            'false': '❌ FALSE - This claim is not supported by evidence',
            'disputed': '⚠️ DISPUTED - This claim is contested by experts',
            'verified': '✅ VERIFIED - This claim is TRUE'
        };
        return statusMap[status] || '❓ UNCLEAR - Unable to verify this claim';
    }

    getStatusClass(status) {
        if (['true', 'verified', 'mostly true'].includes(status)) {
            return 'true';
        } else if (['false', 'mostly false'].includes(status)) {
            return 'false';
        } else {
            return 'mixed';
        }
    }

    showTyping(show) {
        const indicator = document.getElementById('typing-indicator');
        const sendButton = document.getElementById('send-button');
        
        indicator.style.display = show ? 'flex' : 'none';
        sendButton.disabled = show;
        
        if (show) {
            this.scrollToBottom();
        }
    }

    addMessage(sender, text, factCheck = null) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        let messageContent = `<div class="message-bubble">${this.formatMessage(text)}</div>`;

        if (factCheck) {
            messageContent += `
                <div class="fact-check-result">
                    <div class="result-status ${factCheck.status}">
                        ${this.getStatusText(factCheck.status)}
                    </div>
                    <div class="result-score">Score: ${factCheck.score.toFixed(1)}/10</div>
                </div>
            `;
        }

        messageDiv.innerHTML = messageContent;
        messagesContainer.appendChild(messageDiv);

        this.scrollToBottom();
    }

    formatMessage(text) {
        // Convert markdown-style formatting to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '• ');
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbot-messages');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }
}

// Initialize chatbot when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FactCheckChatbot();
});