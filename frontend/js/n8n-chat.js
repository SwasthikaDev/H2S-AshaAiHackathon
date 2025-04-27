// n8n Chat Integration
document.addEventListener('DOMContentLoaded', function() {
    // Get all elements with the data-chat="open" attribute
    const chatButtons = document.querySelectorAll('[data-chat="open"]');
    
    // Add click event listener to each button
    chatButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Create a modal container for the chat
            const modalContainer = document.createElement('div');
            modalContainer.id = 'chat-modal-container';
            modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
            
            // Create the modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'bg-white rounded-lg shadow-xl w-full max-w-lg h-[600px] flex flex-col relative';
            
            // Create the modal header
            const modalHeader = document.createElement('div');
            modalHeader.className = 'flex justify-between items-center p-4 border-b';
            modalHeader.innerHTML = `
                <h3 class="text-lg font-semibold text-gray-800">Talk to Asha AI</h3>
                <button id="close-chat-modal" class="text-gray-500 hover:text-gray-700">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            
            // Create the chat container
            const chatContainer = document.createElement('div');
            chatContainer.id = 'n8n-chat-popup';
            chatContainer.className = 'flex-1';
            
            // Append elements to the DOM
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(chatContainer);
            modalContainer.appendChild(modalContent);
            document.body.appendChild(modalContainer);
            
            // Add event listener to close button
            document.getElementById('close-chat-modal').addEventListener('click', function() {
                document.body.removeChild(modalContainer);
            });
            
            // Initialize n8n chat
            if (typeof createChat === 'function') {
                createChat({
                    webhookUrl: 'https://swasthikadev.app.n8n.cloud/webhook/1c1f408c-25b5-4776-a3cf-da267611b299/chat',
                    target: '#n8n-chat-popup',
                    mode: 'fullscreen',
                    showWelcomeScreen: true,
                    defaultLanguage: 'en',
                    i18n: {
                        en: {
                            title: 'JobsForHer Foundation',
                            subtitle: 'Your smart career growth assistant',
                            // footer: 'Powered by JobsForHer Foundation',
                            getStarted: 'Talk To Asha',
                            inputPlaceholder: 'Type your question...',
                        }
                    },
                    initialMessages: [
                        'Hello! I\'m Asha AI, your career growth assistant.',
                        'I can help with career guidance, resume analysis, and connecting you to opportunities. How can I assist you today?'
                    ]
                });
            } else {
                console.error('n8n chat library not loaded');
                chatContainer.innerHTML = '<div class="p-4 text-center">Chat service is currently unavailable. Please try again later.</div>';
            }
        });
    });
});
