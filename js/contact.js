/* ============================================================
   DAVYCAS INTERNATIONAL — CONTACT PAGE SCRIPTS
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. NAVBAR SCROLL EFFECT
    const navbar = document.querySelector('.premium-nav');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('nav-scrolled');
        } else {
            navbar.classList.remove('nav-scrolled');
        }
    });

    // 2. SCROLL REVEAL ANIMATION
    const reveals = document.querySelectorAll('.reveal');
    
    const revealOnScroll = () => {
        const triggerBottom = window.innerHeight / 5 * 4;
        
        reveals.forEach(reveal => {
            const revealTop = reveal.getBoundingClientRect().top;
            
            if (revealTop < triggerBottom) {
                reveal.classList.add('active');
            }
        });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger initial check

    // 3. FORM HANDLING (SUBMISSION SIMULATION)
    const form = document.getElementById('premium-contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btn = form.querySelector('.btn-submit-premium');
            const originalText = btn.innerHTML;
            
            // Loading state
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';
            
            setTimeout(() => {
                // Success state
                btn.innerHTML = '<i class="fas fa-check"></i> Message envoyé !';
                btn.style.background = 'var(--color-accent)';
                btn.style.opacity = '1';
                
                form.reset();
                
                setTimeout(() => {
                    // Reset button
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.pointerEvents = 'all';
                }, 3000);
            }, 2000);
        });
    }

    // 4. MOBILE MENU (SIMPLE)
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            // This is a placeholder for a more complex mobile menu
            // For now, let's keep it simple as per the clean design
            alert("Menu mobile - Implémentation minimaliste");
        });
    }
});
