<script lang="ts">
  import { tick } from 'svelte';

  type Message = { sender: 'user' | 'ai'; text: string };
  
  let messages: Message[] = $state([]);
  let inputValue = $state('');
  let isLoading = $state(false);
  let sessionId: string | null = $state(null);
  let chatContainer: HTMLDivElement | undefined = $state();

  async function scrollToBottom() {
    await tick();
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  async function sendMessage() {
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    messages = [...messages, { sender: 'user', text: userText }];
    inputValue = '';
    isLoading = true;
    scrollToBottom();

    try {
      const res = await fetch('http://localhost:3000/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, sessionId })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Network error');
      }
      
      const data = await res.json();
      sessionId = data.sessionId; 
      
      messages = [...messages, { sender: 'ai', text: data.reply }];
    } catch (error: any) {
      messages = [...messages, { sender: 'ai', text: `Error: ${error.message}` }];
    } finally {
      isLoading = false;
      scrollToBottom();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') sendMessage();
  }
</script>

<main class="chat-shell">
  <!-- Header -->
  <header class="chat-header">
    <div class="header-avatar">S</div>
    <div class="header-text">
      <span class="header-name">SpurMart Assistant</span>
      <span class="header-status">
        <span class="status-dot"></span>Online
      </span>
    </div>
  </header>

  <!-- Chat Area -->
  <div bind:this={chatContainer} class="chat-body">
    {#if messages.length === 0}
      <div class="empty-state">
        <div class="empty-icon">🛍️</div>
        <p class="empty-title">How can I help you today?</p>
        <p class="empty-sub">Ask about shipping, returns, orders, or anything else.</p>
      </div>
    {/if}

    {#each messages as msg}
      <div class="message-row {msg.sender === 'user' ? 'row-user' : 'row-ai'}">
        {#if msg.sender === 'ai'}
          <div class="ai-avatar">S</div>
        {/if}
        <div class="bubble {msg.sender === 'user' ? 'bubble-user' : 'bubble-ai'}">
          {msg.text}
        </div>
      </div>
    {/each}

    {#if isLoading}
      <div class="message-row row-ai">
        <div class="ai-avatar">S</div>
        <div class="bubble bubble-ai typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Input Area -->
  <div class="chat-input-bar">
    <input 
      type="text" 
      bind:value={inputValue} 
      on:keydown={handleKeydown}
      placeholder="Message SpurMart…" 
      class="chat-input"
      disabled={isLoading}
    />
    <button 
      on:click={sendMessage} 
      disabled={isLoading || !inputValue.trim()}
      class="send-btn"
      aria-label="Send message"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
    </button>
  </div>
</main>

<style>
  :global(body) {
    background: #E8EAF0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  .chat-shell {
    width: 420px;
    height: 620px;
    display: flex;
    flex-direction: column;
    background: #FAFAF8;
    border-radius: 20px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08);
    overflow: hidden;
  }

  /* ── Header ── */
  .chat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: #4F46E5;
    border-bottom: 1px solid rgba(255,255,255,0.12);
  }

  .header-avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(255,255,255,0.2);
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    letter-spacing: 0.02em;
  }

  .header-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .header-name {
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }

  .header-status {
    display: flex;
    align-items: center;
    gap: 5px;
    color: rgba(255,255,255,0.75);
    font-size: 12px;
  }

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #86EFAC;
    box-shadow: 0 0 0 2px rgba(134,239,172,0.3);
  }

  /* ── Chat Body ── */
  .chat-body {
    flex: 1;
    padding: 20px 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scroll-behavior: smooth;
  }

  .chat-body::-webkit-scrollbar {
    width: 4px;
  }
  .chat-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .chat-body::-webkit-scrollbar-thumb {
    background: #D1D5DB;
    border-radius: 4px;
  }

  /* ── Empty State ── */
  .empty-state {
    margin: auto;
    text-align: center;
    padding: 32px 24px;
  }

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
    line-height: 1;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 6px;
  }

  .empty-sub {
    font-size: 13.5px;
    color: #9CA3AF;
    margin: 0;
    line-height: 1.5;
  }

  /* ── Message Rows ── */
  .message-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .row-user {
    flex-direction: row-reverse;
  }

  .ai-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #EEF2FF;
    color: #4F46E5;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-bottom: 2px;
  }

  /* ── Bubbles ── */
  .bubble {
    max-width: 78%;
    padding: 11px 15px;
    font-size: 14px;
    line-height: 1.55;
    border-radius: 18px;
  }

  .bubble-user {
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    color: #fff;
    border-bottom-right-radius: 5px;
    box-shadow: 0 2px 8px rgba(79,70,229,0.3);
  }

  .bubble-ai {
    background: #fff;
    color: #1A1A2E;
    border: 1px solid #E5E7EB;
    border-bottom-left-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }

  /* ── Typing Indicator ── */
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 14px 16px;
  }

  .typing-indicator span {
    display: block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #C4C9D4;
    animation: pulse 1.2s ease-in-out infinite;
  }

  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes pulse {
    0%, 60%, 100% { opacity: 0.35; transform: scale(1); }
    30% { opacity: 1; transform: scale(1.2); }
  }

  /* ── Input Bar ── */
  .chat-input-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    background: #fff;
    border-top: 1px solid #F0F0EE;
  }

  .chat-input {
    flex: 1;
    padding: 11px 16px;
    background: #F4F4F2;
    border: 1.5px solid transparent;
    border-radius: 24px;
    font-size: 14px;
    font-family: inherit;
    color: #1A1A2E;
    outline: none;
    transition: border-color 0.18s, background 0.18s;
  }

  .chat-input::placeholder {
    color: #B0B5C0;
  }

  .chat-input:focus {
    background: #fff;
    border-color: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79,70,229,0.1);
  }

  .chat-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .send-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #4F46E5;
    color: #fff;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.18s, transform 0.12s, box-shadow 0.18s;
    box-shadow: 0 2px 8px rgba(79,70,229,0.35);
  }

  .send-btn:hover:not(:disabled) {
    background: #4338CA;
    transform: scale(1.06);
    box-shadow: 0 4px 12px rgba(79,70,229,0.45);
  }

  .send-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .send-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    box-shadow: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .typing-indicator span { animation: none; opacity: 0.5; }
    .send-btn { transition: none; }
    .chat-input { transition: none; }
  }
</style>