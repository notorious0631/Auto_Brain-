const createBtn = document.getElementById('create-knowledge-btn');
const statusMsg = document.getElementById('status-msg');
const chatHistory = document.getElementById('chat-history');
const questionInput = document.getElementById('question-input');
const sendBtn = document.getElementById('send-btn');
const loader = createBtn.querySelector('.loader');
const btnText = createBtn.querySelector('.btn-text');

// Base URL - assumes backend is serving frontend or running on same host/port
// If running separately (e.g. during dev), might need to point to localhost:8000
const API_BASE_URL = '';

const csvFileInput = document.getElementById('csv-file');

createBtn.addEventListener('click', async () => {
    const file = csvFileInput.files[0];
    if (!file) {
        statusMsg.textContent = 'Please select a CSV file first.';
        statusMsg.className = 'status-msg status-error';
        return;
    }

    setLoading(true);
    statusMsg.textContent = 'Uploading and creating vector database... Please wait ⏳';
    statusMsg.className = 'status-msg';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/create_knowledge`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Failed to create knowledge base');
        }

        const data = await response.json();
        statusMsg.textContent = 'Knowledge base created successfully ✅';
        statusMsg.className = 'status-msg status-success';
        enableChat();
    } catch (error) {
        console.error(error);
        statusMsg.textContent = 'Error creating knowledge base. Check console.';
        statusMsg.className = 'status-msg status-error';
    } finally {
        setLoading(false);
    }
});

function setLoading(isLoading) {
    createBtn.disabled = isLoading;
    if (isLoading) {
        loader.classList.remove('hidden');
        btnText.textContent = 'Processing...';
    } else {
        loader.classList.add('hidden');
        btnText.textContent = 'Create Knowledge Base';
    }
}

function enableChat() {
    questionInput.disabled = false;
    sendBtn.disabled = false;
    questionInput.focus();
}

async function handleSend() {
    const question = questionInput.value.trim();
    if (!question) return;

    // Add user message
    addMessage(question, 'user');
    questionInput.value = '';
    questionInput.disabled = true;
    sendBtn.disabled = true;

    // Add loading placeholder
    const loadingId = addMessage('Thinking...', 'bot', true);

    try {
        const response = await fetch(`${API_BASE_URL}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Failed to get answer');
        }

        const data = await response.json();

        // Remove loading message
        removeMessage(loadingId);

        // Add bot response
        addMessage(data.answer, 'bot');

    } catch (error) {
        console.error(error);
        removeMessage(loadingId);
        addMessage(`Error: ${error.message}`, 'bot');
    } finally {
        questionInput.disabled = false;
        sendBtn.disabled = false;
        questionInput.focus();
    }
}

sendBtn.addEventListener('click', handleSend);
questionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

function addMessage(text, sender, isLoading = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message');
    msgDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    msgDiv.textContent = text;

    if (isLoading) {
        msgDiv.id = 'loading-' + Date.now();
        msgDiv.style.opacity = '0.7';
    }

    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return msgDiv.id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
