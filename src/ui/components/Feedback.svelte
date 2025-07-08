<script lang="ts">
  export let feedback: { type: string; message: string };
</script>

{#if feedback && feedback.message}
  <div class="feedback {feedback.type}">
    {feedback.message}
  </div>
{/if}

<style>
  .feedback {
    margin-top: 1rem;
    padding: 0.7rem 1rem;
    border-radius: 5px;
    font-size: 1rem;
    font-weight: 500;
  }
  .feedback.info {
    background: #e3f2fd;
    color: #1976d2;
  }
  .feedback.success {
    background: #e8f5e9;
    color: #388e3c;
  }
  .feedback.error {
    background: #ffebee;
    color: #c62828;
  }
</style> 