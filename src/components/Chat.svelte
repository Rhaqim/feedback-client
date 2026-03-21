<script lang="ts">
  import { createEventDispatcher, afterUpdate } from 'svelte';
  import type { ChatMessage } from '../lib/types';

  export let messages: ChatMessage[] = [];
  export let currentPlayerId: string = '';

  const dispatch = createEventDispatcher();

  let input = '';
  let isOpen = false;
  let messagesContainer: HTMLElement;

  afterUpdate(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  });

  function sendMessage() {
    if (!input.trim()) return;
    dispatch('send', input.trim());
    input = '';
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="chat-container" class:open={isOpen}>
  <button class="chat-toggle" on:click={() => (isOpen = !isOpen)}>
    <span class="chat-icon">
      {#if isOpen}&times;{:else}Chat{/if}
    </span>
    {#if !isOpen && messages.length > 0}
      <span class="msg-count">{messages.length}</span>
    {/if}
  </button>

  {#if isOpen}
    <div class="chat-panel card fade-in">
      <div class="chat-header">
        <h4>Chat</h4>
      </div>
      <div class="chat-messages" bind:this={messagesContainer}>
        {#if messages.length === 0}
          <p class="empty">No messages yet</p>
        {:else}
          {#each messages as msg}
            <div class="message" class:own={msg.player_id === currentPlayerId}>
              <div class="msg-meta">
                <span class="msg-name">{msg.player_name}</span>
                <span class="msg-time">{formatTime(msg.timestamp)}</span>
              </div>
              <p class="msg-text">{msg.message}</p>
            </div>
          {/each}
        {/if}
      </div>
      <form class="chat-input" on:submit|preventDefault={sendMessage}>
        <input type="text" bind:value={input} placeholder="Type a message..." maxlength="200" />
        <button type="submit" class="btn-primary" disabled={!input.trim()}>Send</button>
      </form>
    </div>
  {/if}
</div>

<style>
  .chat-container {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    z-index: 50;
  }

  .chat-toggle {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--accent);
    color: white;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    font-weight: 700;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    z-index: 2;
  }

  .chat-toggle:hover {
    transform: scale(1.05);
  }

  .chat-container.open .chat-toggle {
    bottom: auto;
    top: -20px;
    right: -10px;
    width: 32px;
    height: 32px;
    font-size: 1.1rem;
  }

  .msg-count {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--danger);
    color: white;
    font-size: 0.6rem;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .chat-panel {
    width: 320px;
    height: 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-header h4 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-right: 0.25rem;
  }

  .message {
    padding: 0.4rem 0.6rem;
    background: var(--bg-secondary);
    border-radius: 8px;
  }

  .message.own {
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
  }

  .msg-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.15rem;
  }

  .msg-name {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--accent);
  }

  .msg-time {
    font-size: 0.6rem;
    color: var(--text-muted);
  }

  .msg-text {
    font-size: 0.8rem;
    color: var(--text-primary);
    word-break: break-word;
  }

  .chat-input {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }

  .chat-input input {
    flex: 1;
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }

  .chat-input .btn-primary {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .empty {
    color: var(--text-muted);
    text-align: center;
    font-size: 0.8rem;
    padding: 2rem 0;
  }
</style>
