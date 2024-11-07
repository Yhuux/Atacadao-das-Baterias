// Initialize Material-like ripple effect
function createRipple(event) {
    const button = event.currentTarget;
    // Remove any existing ripples
    button.querySelectorAll('.ripple').forEach(oldRipple => {
        oldRipple.remove();
    });
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;
    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - radius}px`;
    ripple.style.top = `${event.clientY - rect.top - radius}px`;
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    // Remove the ripple element after animation completes
    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });
}
// Add ripple effect to buttons
document.querySelectorAll('.whatsapp-button').forEach(button => {
    button.addEventListener('click', createRipple);
});
// Intersection Observer for animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);
// Apply observer to elements
document.querySelectorAll('.feature-card, .hero h1, .hero-primary, .pill-container, .hero-secondary, .cta-container').forEach(element => {
    element.style.opacity = '0';
    observer.observe(element);
});
