/**
 * WhatsApp Bridge Pro - Embed Chat Widget
 * Similar to Tawk.to - Can be embedded on any website
 * Usage: <script src="https://yourdomain.com/chat-widget.js?apiKey=KEY&instanceId=ID"></script>
 */

(function() {
  // Get parameters from script tag
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  const params = new URL(currentScript.src).searchParams;
  
  const apiKey = params.get('apiKey');
  const instanceId = params.get('instanceId');
  const apiBaseUrl = params.get('apiUrl') || 'http://localhost:3000';

  if (!apiKey || !instanceId) {
    console.error('WhatsApp Chat Widget: Missing apiKey or instanceId');
    return;
  }

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'whatsapp-chat-widget';
  widgetContainer.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    height: 500px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 5px 40px rgba(0,0,0,0.16);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    z-index: 999999;
    display: none;
    flex-direction: column;
    overflow: hidden;
  `;

  // Create button (bubble)
  const button = document.createElement('button');
  button.id = 'whatsapp-chat-button';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #25D366 0%, #20BA5A 100%);
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
    z-index: 999998;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  `;
  button.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });

  button.addEventListener('click', () => {
    const isVisible = widgetContainer.style.display === 'flex';
    widgetContainer.style.display = isVisible ? 'none' : 'flex';
    button.style.display = isVisible ? 'flex' : 'none';
  });

  // Create widget header
  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #25D366 0%, #20BA5A 100%);
    color: white;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <div>
      <h3 style="margin: 0; font-size: 16px; font-weight: bold;">Chat with us</h3>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Typically replies in minutes</p>
    </div>
    <button id="close-widget" style="
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 20px;
      padding: 0;
    ">×</button>
  `;

  document.getElementById('close-widget') && header.querySelector('#close-widget')?.addEventListener('click', () => {
    widgetContainer.style.display = 'none';
    button.style.display = 'flex';
  });

  // Create chat messages area
  const messagesArea = document.createElement('div');
  messagesArea.id = 'chat-messages';
  messagesArea.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: #f5f5f5;
  `;

  // Create input area
  const inputArea = document.createElement('div');
  inputArea.style.cssText = `
    padding: 16px;
    background: white;
    border-top: 1px solid #e0e0e0;
    display: flex;
    gap: 8px;
  `;

  const phoneInput = document.createElement('input');
  phoneInput.type = 'text';
  phoneInput.placeholder = 'Your phone (+91...)';
  phoneInput.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 12px;
    outline: none;
  `;

  const messageInput = document.createElement('input');
  messageInput.type = 'text';
  messageInput.placeholder = 'Type message...';
  messageInput.style.cssText = `
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 12px;
    outline: none;
  `;

  const sendBtn = document.createElement('button');
  sendBtn.innerHTML = '📤';
  sendBtn.style.cssText = `
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #25D366;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  `;

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  async function sendMessage() {
    const phone = phoneInput.value.trim();
    const message = messageInput.value.trim();

    if (!phone || !message) {
      alert('Please enter phone and message');
      return;
    }

    // Validate phone number
    if (phone.replace(/\D/g, '').length < 10) {
      alert('Please enter a valid phone number');
      return;
    }

    // Add message to UI
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
      background: #25D366;
      color: white;
      padding: 10px 14px;
      border-radius: 18px;
      margin: 8px 0;
      word-wrap: break-word;
      max-width: 80%;
      margin-left: auto;
      font-size: 13px;
    `;
    msgDiv.textContent = message;
    messagesArea.appendChild(msgDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    messageInput.value = '';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.6';

    try {
      // Send to backend with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${apiBaseUrl}/api/v1/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          instanceId: instanceId,
          to: phone,
          message: message,
          type: 'web_bridge'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Message sent:', data);

      // Add success indicator
      msgDiv.style.background = '#20BA5A';

    } catch (error) {
      console.error('Send error:', error);
      msgDiv.style.background = '#dc2626';
      msgDiv.innerHTML = `<strong>Failed:</strong> ${error.message || 'Unable to send message'}<br><small>${message}</small>`;
    } finally {
      sendBtn.disabled = false;
      sendBtn.style.opacity = '1';
    }
  }

  inputArea.appendChild(phoneInput);
  inputArea.appendChild(messageInput);
  inputArea.appendChild(sendBtn);

  // Assemble widget
  widgetContainer.appendChild(header);
  widgetContainer.appendChild(messagesArea);
  widgetContainer.appendChild(inputArea);

  // Add to page
  document.body.appendChild(widgetContainer);
  document.body.appendChild(button);

  // Add initial message
  const welcomeMsg = document.createElement('div');
  welcomeMsg.style.cssText = `
    background: white;
    padding: 12px;
    border-radius: 12px;
    margin: 8px 0;
    font-size: 13px;
    color: #333;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  `;
  welcomeMsg.textContent = 'Hi! 👋 Feel free to reach out anytime. We\'re here to help!';
  messagesArea.appendChild(welcomeMsg);

  console.log('WhatsApp Chat Widget loaded successfully');
})();
