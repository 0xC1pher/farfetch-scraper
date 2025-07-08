<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let cookies = '';
  let loading = false;
  let done = false;

  async function handleSubmit() {
    loading = true;
    // Aquí iría el fetch al backend para subir las cookies
    // Simulación:
    setTimeout(() => {
      loading = false;
      done = true;
      dispatch('feedback', { type: 'success', message: 'Cookies cargadas y sesión guardada.' });
    }, 1200);
  }
</script>

{#if !done}
  <form on:submit|preventDefault={handleSubmit}>
    <label>Pega aquí tus cookies de sesión (JSON)</label>
    <textarea bind:value={cookies} rows="6" required></textarea>
    <button type="submit" disabled={loading}>{loading ? 'Cargando...' : 'Guardar sesión'}</button>
  </form>
{:else}
  <div class="success">¡Sesión cargada correctamente!</div>
{/if}

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-bottom: 1rem;
  }
  textarea {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-family: monospace;
  }
  .success {
    color: green;
    font-weight: bold;
    margin-top: 1rem;
  }
</style> 