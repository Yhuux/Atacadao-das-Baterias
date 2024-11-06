// Add ripple effect to buttons and interactive elements
document.addEventListener('DOMContentLoaded', () => {
    const rippleElements = document.querySelectorAll('.button, .card-interactive');
    
    rippleElements.forEach(element => {
        element.addEventListener('click', (e) => {
            const rect = element.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            // Calculate ripple size and position
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            element.appendChild(ripple);
            
            // Clean up
            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        });
    });

    // Add elevation to navbar on scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 0) {
                navbar.classList.add('elevated');
            } else {
                navbar.classList.remove('elevated');
            }
        });
    }
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('ServiceWorker registration successful');
        })
        .catch(err => {
          console.log('ServiceWorker registration failed: ', err);
        });
    });
  }