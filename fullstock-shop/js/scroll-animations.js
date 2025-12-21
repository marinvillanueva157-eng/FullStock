/**
 * Sistema de Animaciones Scroll Reveal
 * Detecta elementos con la clase .reveal y los anima al entrar en el viewport.
 * Soporta contenido dinámico (AJAX/JS injection) automáticamente.
 */

document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Se activa cuando el 10% del elemento es visible
    };

    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animar solo una vez
            }
        });
    };

    const scrollObserver = new IntersectionObserver(revealCallback, observerOptions);

    // Función para registrar nuevos elementos
    const observeElements = () => {
        const elements = document.querySelectorAll('.reveal:not(.observed)');
        elements.forEach(el => {
            scrollObserver.observe(el);
            el.classList.add('observed'); // Marcar como observado para evitar duplicados
        });
    };

    // 1. Observar elementos iniciales
    observeElements();

    // 2. Observar cambios en el DOM (para productos cargados dinámicamente)
    const mutationObserver = new MutationObserver(() => {
        observeElements();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });
});