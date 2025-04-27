// n8n Chat Integration
document.addEventListener('DOMContentLoaded', function() {
    // Get all elements with the data-chat="open" attribute
    const chatButtons = document.querySelectorAll('[data-chat="open"]');
    
    // Add click event listener to each button
    chatButtons.forEach((button, idx) => {
        button.addEventListener('click', function() {
            // Create a modal container for the chat
            const modalContainer = document.createElement('div');
            modalContainer.id = 'chat-modal-container';
            modalContainer.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
            
            // Create the modal content with fixed dimensions
            const modalContent = document.createElement('div');
            modalContent.className = 'bg-white rounded-lg shadow-xl w-full max-w-3xl h-[600px] flex flex-col relative overflow-hidden'; // Increased max width to max-w-3xl for wider chat area
            
            // Create the modal header with tab-like interface
            const modalHeader = document.createElement('div');
            modalHeader.className = 'flex flex-col p-4 border-b flex-shrink-0';
            
            // Create the top part of the header with close button
            const headerTop = document.createElement('div');
            headerTop.className = 'flex justify-between items-center w-full mb-3';
            headerTop.innerHTML = `
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-primary-green flex items-center justify-center mr-3">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2v-6a2 2 0 012-2h14a2 2 0 012 2v6a2 2 0 01-2 2h-5l-5 5v-5z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-800">Asha AI Assistant</h3>
                </div>
                <button id="close-chat-modal" class="text-gray-500 hover:text-gray-700 transition duration-300">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            `;
            
            // Create the chat container with fixed height and scrollable content
            const chatContainer = document.createElement('div');
            chatContainer.id = 'n8n-chat-popup';
            chatContainer.className = 'flex-1 min-w-[500px] max-w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-4'; // Increased min width and made scrollable with visible scrollbar and padding
            
            // Create a container for Gemini (initially hidden)
            const geminiContainer = document.createElement('div');
            geminiContainer.id = 'gemini-container';
            geminiContainer.className = 'flex-1 min-w-[500px] max-w-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 p-4';
            geminiContainer.innerHTML = `
                <div class="flex flex-col h-full p-4">
                    <div class="chat-messages-container flex-1 mb-4 p-2">
                        <div class="bg-gray-100 rounded-lg p-3 mb-3 max-w-[80%]">
                            <p>Hello! I'm your Career Growth Chatbot dedicated to supporting women at different stages of their professional journey. How can I help you today?</p>
                        </div>
                    </div>
                    <div class="flex items-center border-t p-2">
                        <label for="resume-upload" class="cursor-pointer mr-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500 hover:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <input id="resume-upload" type="file" accept="application/pdf" class="hidden" />
                        </label>
                        <input type="text" placeholder="Type your message..." class="flex-1 border rounded-lg px-4 py-2 mr-2">
                        <button class="bg-green-500 text-white rounded-lg px-4 py-2">Send</button>
                            <button class="bg-primary-green text-white px-4 py-2 rounded-r-lg hover:bg-dark-green">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Append elements to the DOM
            modalHeader.appendChild(headerTop);
            modalContent.appendChild(modalHeader);
            if (idx === 0) {
                // Show only n8n bot
                chatContainer.classList.remove('hidden');
                geminiContainer.classList.add('hidden');
            } else {
                // Show only Gemini bot
                chatContainer.classList.add('hidden');
                geminiContainer.classList.remove('hidden');
            }
            modalContent.appendChild(chatContainer);
            modalContent.appendChild(geminiContainer);
            modalContainer.appendChild(modalContent);
            document.body.appendChild(modalContainer);
            
            // Add event listener to close button
            document.getElementById('close-chat-modal').addEventListener('click', function() {
                document.body.removeChild(modalContainer);
            });
            
            // Initialize only the selected bot
            if (idx === 0) {
                initializeChat();
            } else {
                initializeGemini();
            }

            // Add a mutation observer to ensure the chat messages container has proper scrolling
            const setupScrolling = () => {
                const messagesContainer = document.querySelector('.n8n-chat-messages-container');
                if (messagesContainer) {
                    // Ensure the container has the right classes for scrolling
                    messagesContainer.classList.add('overflow-y-auto', 'flex-1');
                    
                    // Create a mutation observer to scroll to bottom when new messages are added
                    const observer = new MutationObserver(() => {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    });
                    
                    // Start observing the container for changes
                    observer.observe(messagesContainer, { childList: true, subtree: true });
                    
                    // Force initial scroll to bottom
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    
                    return true;
                }
                return false;
            };

            // Try to set up scrolling with retries
            let attempts = 0;
            const maxAttempts = 10;
            const checkInterval = setInterval(() => {
                if (setupScrolling() || attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                }
                attempts++;
            }, 300);
        });
    });
});

// Initialize n8n chat
function initializeChat() {
    // Get user context if logged in
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userName') || 'Guest';
    
    let userContext = {
        name: userName
    };
    
    if (userId && token) {
        userContext = {
            ...userContext,
            userId: userId,
            authenticated: true
        };
    }
    
    // Create a custom message handler to process responses
    const customMessageHandler = (message) => {
        // Handle when message is a string containing JSON
        if (typeof message === 'string') {
            try {
                // Check if it's a JSON string
                if (message.trim().startsWith('{')) {
                    const jsonMessage = JSON.parse(message);
                    
                    // Extract response field if it exists
                    if (jsonMessage && jsonMessage.response) {
                        return jsonMessage.response;
                    }
                    
                    // Handle rich responses with multiple parts
                    if (jsonMessage && jsonMessage.parts) {
                        return jsonMessage.parts.map(part => part.content).join('\n\n');
                    }
                }
            } catch (e) {
                console.log("Failed to parse JSON message:", e);
            }
        }
        
        // Handle when message is already an object
        if (typeof message === 'object' && message !== null) {
            // Extract response field if it exists
            if (message.response) {
                return message.response;
            }
            
            // Handle rich responses with multiple parts
            if (message.parts) {
                return message.parts.map(part => part.content).join('\n\n');
            }
        }
        
        // If we couldn't extract a structured response, return the original message
        return message;
    };

    // Initialize n8n chat
    if (typeof createChat === 'function') {
        createChat({
            webhookUrl: 'https://swasthikadev.app.n8n.cloud/webhook/74fde653-82e8-4a4c-83db-5f4c987720a1/chat',
            target: '#n8n-chat-popup',
            mode: 'fullscreen',
            showWelcomeScreen: true,
            messageHandler: customMessageHandler,
            context: userContext, // Pass user context to the chatbot
            showTypingIndicator: true, // Show typing indicator
            typingIndicatorTimeout: 1500, // Typing indicator timeout in ms
            i18n: {
                en: {
                    title: 'Asha AI - Your Career Assistant',
                    subtitle: 'Ask me anything about your career journey!',
                    getStarted: 'Talk To Asha',
                    inputPlaceholder: 'Type your career question...',
                    sendButtonLabel: 'Send',
                    uploadButtonLabel: 'Upload Resume',
                    errorMessage: 'Something went wrong. Please try again.'
                }
            },
            initialMessages: [
                "👋 Hello! I'm Asha, from JobsForHer Foundation.",
                "Talk to me, I can help you with career advice, job search strategies, resume tips, interview preparation, and more!"
            ],
            theme: {
                chatWindow: {
                    backgroundColor: '#ffffff',
                    textColor: '#333333',
                },
                userMessage: {
                    backgroundColor: '#00A650',
                    textColor: '#ffffff',
                },
                botMessage: {
                    backgroundColor: '#f5f5f5',
                    textColor: '#333333',
                },
                inputField: {
                    backgroundColor: '#ffffff',
                    textColor: '#333333',
                    placeholderColor: '#999999',
                    borderColor: '#e0e0e0',
                    focusBorderColor: '#00A650',
                },
                button: {
                    backgroundColor: '#00A650',
                    textColor: '#ffffff',
                    hoverBackgroundColor: '#008C44',
                }
            },
            // Add file upload capability for resumes
            fileUpload: {
                enabled: true,
                acceptedFileTypes: '.pdf,.doc,.docx',
                maxFileSize: 5, // in MB
                uploadButtonText: 'Upload Resume',
                uploadingText: 'Uploading...',
                errorText: 'Upload failed'
            },
            // Add suggested responses for common questions
            suggestedResponses: [
                'How do I create a good resume?',
                'Tips for job interviews',
                'Career change advice',
                'How to negotiate salary'
            ]
        });
    } else {
        console.error('n8n Chat widget not loaded properly');
    }
    
    // Add a style element to ensure proper scrolling
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        #n8n-chat-popup {
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
        }
        .n8n-chat {
            height: 100% !important;
            max-height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
        }
        .n8n-chat-messages-container {
            flex: 1 1 auto !important;
            overflow-y: auto !important;
            padding: 16px !important;
            scroll-behavior: smooth !important;
            height: calc(100% - 120px) !important;
            max-height: none !important;
            min-height: 0 !important;
        }
        .n8n-chat-input-container {
            flex: 0 0 auto !important;
            position: relative !important;
            bottom: 0 !important;
            width: 100% !important;
        }
    `;
    document.head.appendChild(styleElement);
}

// Initialize Gemini functionality
function initializeGemini() {
    // Check if already initialized
    if (window.geminiInitialized) return;
    
    // Get the input field and send button
    const geminiContainer = document.getElementById('gemini-container');
    const messagesContainer = geminiContainer.querySelector('.chat-messages-container');
    const inputField = geminiContainer.querySelector('input[type="text"]');
    const sendButton = geminiContainer.querySelector('button');
    const fileUploadInput = geminiContainer.querySelector('input[type="file"]');
    
    // Generate a unique session ID if not already exists
    if (!window.geminiSessionId) {
        window.geminiSessionId = 'gemini_' + Date.now();
    }
    
    // Function to add a message to the chat
    const addMessage = (message, isUser = false) => {
        const messageElement = document.createElement('div');
        messageElement.className = isUser 
            ? 'bg-primary-green text-white rounded-lg p-3 mb-3 ml-auto max-w-[80%]' 
            : 'bg-gray-100 rounded-lg p-3 mb-3 max-w-[80%]';
        
        // Convert newlines to <br> tags
        const formattedMessage = message.replace(/\n/g, '<br>');
        messageElement.innerHTML = `<p>${formattedMessage}</p>`;
        
        messagesContainer.appendChild(messageElement);
        
        // Smooth scroll to bottom with a slight delay to ensure content is rendered
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    };
    
    // Function to show typing indicator
    const showTypingIndicator = () => {
        const typingElement = document.createElement('div');
        typingElement.id = 'typing-indicator';
        typingElement.className = 'bg-gray-100 rounded-lg p-3 mb-3 max-w-[80%] flex';
        typingElement.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        messagesContainer.appendChild(typingElement);
        
        // Ensure typing indicator is visible by scrolling to it
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 50);
    };
    
    // Function to remove typing indicator
    const removeTypingIndicator = () => {
        const typingElement = document.getElementById('typing-indicator');
        if (typingElement) {
            typingElement.remove();
        }
    };
    
    // Function to handle resume file uploads
    const handleResumeUpload = async (file) => {
        if (!file) return;
        
        // Check if file is a PDF
        if (file.type !== 'application/pdf') {
            addMessage("Please upload a PDF file for your resume.", false);
            return;
        }
        
        try {
            // Show upload message and typing indicator
            addMessage(`Uploading your resume: ${file.name}`, true);
            showTypingIndicator();
            
            // Create form data for file upload
            const formData = new FormData();
            formData.append('resume', file);
            formData.append('sessionId', window.geminiSessionId);
            
            // Send file to backend
            const response = await fetch('http://localhost:9002/api/resume-upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            removeTypingIndicator();
            
            if (data.response) {
                addMessage(data.response);
            } else {
                addMessage("I'm sorry, I couldn't analyze your resume. Please try again or ask me any questions about resume improvement.");
            }
        } catch (error) {
            console.error('Error uploading resume:', error);
            removeTypingIndicator();
            addMessage("I'm sorry, there was an error uploading your resume. Please try again later.");
        }
    };
    
    // Function to detect job portal URLs in a message
    const detectJobURL = (message) => {
        // Regular expression to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = message.match(urlRegex);
        
        if (!urls) return null;
        
        // Check if any URL is from a job portal
        const jobPortals = ['linkedin.com/jobs', 'indeed.com/job', 'naukri.com', 'monster.com/job', 'glassdoor.com/job', 'ziprecruiter.com', 'dice.com', 'careerbuilder.com', 'jobsforher.com'];
        
        for (const url of urls) {
            if (jobPortals.some(portal => url.includes(portal))) {
                return url;
            }
        }
        
        return null;
    };
    
    // Function to analyze a job link
    const analyzeJobLink = async (url) => {
        try {
            showTypingIndicator();
            addMessage(`I'll analyze this job posting for you: ${url}`, false);
            
            const response = await fetch('http://localhost:9002/api/analyze-job-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    sessionId: window.geminiSessionId
                })
            });
            
            const data = await response.json();
            
            removeTypingIndicator();
            
            if (data.response) {
                addMessage(data.response);
            } else {
                addMessage("I'm sorry, I couldn't analyze that job posting. Please check if the URL is correct and try again.");
            }
        } catch (error) {
            console.error('Error analyzing job link:', error);
            removeTypingIndicator();
            addMessage("I'm sorry, I had trouble analyzing that job posting. Please try again later or share a different job link.");
        }
    };
    
    // Function to call the Gemini API
    const callGeminiAPI = async (message) => {
        try {
            // Check if message contains a job URL
            const jobURL = detectJobURL(message);
            if (jobURL) {
                // If a job URL is found, analyze it instead of sending to regular chat
                await analyzeJobLink(jobURL);
                return;
            }
            
            showTypingIndicator();
            
            const response = await fetch('http://localhost:9002/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: window.geminiSessionId
                })
            });
            
            const data = await response.json();
            
            removeTypingIndicator();
            
            if (data.response) {
                addMessage(data.response);
            } else {
                addMessage("I'm sorry, I encountered an error. Please try again.");
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            removeTypingIndicator();
            addMessage("I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again in a moment.");
        }
    };
    
    // Event listeners for sending messages
    const sendMessage = () => {
        const message = inputField.value.trim();
        if (message) {
            addMessage(message, true);
            inputField.value = '';
            callGeminiAPI(message);
        }
    };
    
    // Event listener for file upload
    fileUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleResumeUpload(file);
            // Reset the input so the same file can be uploaded again if needed
            fileUploadInput.value = '';
        }
    });
    
    // Add a message about resume upload capability
    setTimeout(() => {
        addMessage("You can upload your resume (PDF format) using the paperclip icon, and I'll analyze it for you!");
    }, 1000);
    
    sendButton.addEventListener('click', sendMessage);
    
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Add custom CSS for the chat modal
    const style = document.createElement('style');
    style.textContent = `
        /* Custom scrollbar styling */
        .chat-messages-container {
            height: 400px;
            max-height: 60vh;
            overflow-y: auto;
            padding-right: 6px;
            margin-bottom: 12px;
            scroll-behavior: smooth;
            border-radius: 8px;
            background-color: #f9f9f9;
        }
        
        /* Webkit browsers (Chrome, Safari, newer versions of Edge) */
        .chat-messages-container::-webkit-scrollbar {
            width: 8px;
        }
        
        .chat-messages-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }
        
        .chat-messages-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
        }
        
        .chat-messages-container::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
        
        /* Firefox */
        .chat-messages-container {
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
        }
        
        /* Typing indicator animation */
        .typing-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #888;
            margin: 0 2px;
            animation: typing-dot 1.4s infinite ease-in-out both;
        }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-dot {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // Mark as initialized
    window.geminiInitialized = true;
}
