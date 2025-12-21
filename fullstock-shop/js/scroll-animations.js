/**
 * Sistema de Animaciones Scroll Reveal
 * Detecta elementos con la clase .reveal y los anima al entrar en el viewport.
 * Soporta contenido dinámico (AJAX/JS injection) automáticamente.
 */

document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Aumentamos un poco para asegurar que ya "asomó"
    };

    const revealCallback = (entries, observer) => {
        let staggerDelay = 0; // Contador para el retraso en cascada

        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Asignar delay dinámico: 0ms, 100ms, 200ms, etc.
                entry.target.style.transitionDelay = `${staggerDelay}ms`;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Animar solo una vez
                staggerDelay += 100; // Incremento de 0.1s entre cada elemento
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