// Career Path Simulator - Vanilla JS entry point
console.log('Career Path Simulator initialized');

document.addEventListener('DOMContentLoaded', () => {
  const demoBtn = document.getElementById('demo-mode-btn');
  if (demoBtn) {
    let demoOn = true;
    demoBtn.addEventListener('click', () => {
      demoOn = !demoOn;
      demoBtn.textContent = demoOn ? 'Demo Mode: ON' : 'Demo Mode: OFF';
    });
  }
});
