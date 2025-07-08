<script lang="ts">
  import { onMount } from 'svelte';
  import LoginAppleID from './LoginAppleID.svelte';
  import LoadCookies from './LoadCookies.svelte';
  import Feedback from './Feedback.svelte';

  let flow: 'none' | 'apple' | 'cookies' = 'none';
  let feedback = { type: '', message: '' };

  function selectFlow(selected: 'apple' | 'cookies') {
    flow = selected;
    feedback = { type: '', message: '' };
  }

  function handleFeedback(event) {
    feedback = event.detail;
  }
</script>

<div class="main-ui">
  <h1>Iniciar sesión en Farfetch</h1>
  {#if flow === 'none'}
    <div class="options">
      <button on:click={() => selectFlow('apple')}>Iniciar sesión con Apple ID</button>
      <button on:click={() => selectFlow('cookies')}>Cargar sesión/cookies manualmente</button>
    </div>
  {/if}

  {#if flow === 'apple'}
    <LoginAppleID on:feedback={handleFeedback} />
    <button on:click={() => (flow = 'none')}>Volver</button>
  {/if}

  {#if flow === 'cookies'}
    <LoadCookies on:feedback={handleFeedback} />
    <button on:click={() => (flow = 'none')}>Volver</button>
  {/if}

  <Feedback {feedback} />
</div>

<style>
  .main-ui {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 8px #0001;
  }
  .options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  button {
    padding: 0.7rem 1.2rem;
    font-size: 1rem;
    border-radius: 5px;
    border: none;
    background: #222;
    color: #fff;
    cursor: pointer;
  }
  button:hover {
    background: #444;
  }
</style> 