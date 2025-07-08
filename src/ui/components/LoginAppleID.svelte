<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let proxy = '';
  let twofa = '';
  let step: 'login' | '2fa' | 'done' = 'login';
  let loading = false;

  async function handleLogin() {
    loading = true;
    // Aquí iría el fetch al backend para iniciar login
    // Simulación:
    setTimeout(() => {
      step = '2fa';
      loading = false;
      dispatch('feedback', { type: 'info', message: 'Ingresa el código 2FA recibido en tu dispositivo.' });
    }, 1200);
  }

  async function handle2FA() {
    loading = true;
    // Aquí iría el fetch al backend para enviar el código 2FA
    // Simulación:
    setTimeout(() => {
      step = 'done';
      loading = false;
      dispatch('feedback', { type: 'success', message: '¡Sesión iniciada correctamente!' });
    }, 1200);
  }
</script>

{#if step === 'login'}
  <form on:submit|preventDefault={handleLogin}>
    <label>Email Apple ID</label>
    <input type="email" bind:value={email} required />
    <label>Contraseña</label>
    <input type="password" bind:value={password} required />
    <label>Proxy (opcional)</label>
    <input type="text" bind:value={proxy} placeholder="ip:puerto o url" />
    <button type="submit" disabled={loading}>{loading ? 'Cargando...' : 'Iniciar sesión'}</button>
  </form>
{/if}

{#if step === '2fa'}
  <form on:submit|preventDefault={handle2FA}>
    <label>Código 2FA</label>
    <input type="text" bind:value={twofa} required maxlength="6" />
    <button type="submit" disabled={loading}>{loading ? 'Verificando...' : 'Enviar código'}</button>
  </form>
{/if}

{#if step === 'done'}
  <div class="success">¡Sesión iniciada y guardada!</div>
{/if}

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-bottom: 1rem;
  }
  input {
    padding: 0.5rem;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
  .success {
    color: green;
    font-weight: bold;
    margin-top: 1rem;
  }
</style> 