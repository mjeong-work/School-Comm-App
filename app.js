document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.search-form');
  const hint = document.querySelector('.search-hint');

  if (!form || !hint) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const query = (formData.get('query') || '').toString().trim();

    if (!query) {
      hint.textContent = 'Enter a keyword to preview how search results will respond.';
      return;
    }

    hint.textContent = `Searching for "${query}"... (demo only)`;
    // TODO: Replace demo feedback with real search results from backend service.
  });

  const yearElement = document.getElementById('copyright-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear().toString();
  }
});
