document.addEventListener("DOMContentLoaded", () => {
    // 1. Injecter les styles pour cacher la bannière Google Translate
    const style = document.createElement('style');
    style.innerHTML = `
        #goog-gt-tt {display:none !important;}
        .goog-te-banner-frame {display:none !important;}
        .goog-te-menu-value:hover {text-decoration:none !important;}
        body {top:0 !important;}
        #google_translate_element2 {display:none!important;}
    `;
    document.head.appendChild(style);

    // 2. Créer l'élément conteneur
    const gtContainer = document.createElement('div');
    gtContainer.id = 'google_translate_element2';
    document.body.appendChild(gtContainer);

    // 3. Injecter le script Google Translate
    window.googleTranslateElementInit2 = function() {
        new google.translate.TranslateElement({pageLanguage: 'fr', autoDisplay: false}, 'google_translate_element2');
    };
    const gtScript = document.createElement('script');
    gtScript.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit2";
    document.body.appendChild(gtScript);

    // 4. Fonction doGTranslate (GTranslate legacy pour trigger le select interne)
    function doGTranslate(langPair) {
        if(langPair == '') return;
        var lang = langPair.split('|')[1];
        var teCombo;
        var sel = document.getElementsByTagName('select');
        for(var i=0; i<sel.length; i++) {
            if(sel[i].className == 'goog-te-combo') teCombo = sel[i];
        }
        if(document.getElementById('google_translate_element2') == null || 
           document.getElementById('google_translate_element2').innerHTML.length == 0 || 
           teCombo == undefined || teCombo.length == 0 || teCombo.innerHTML.length == 0) {
            setTimeout(function(){ doGTranslate(langPair) }, 500);
        } else {
            teCombo.value = lang;
            GTranslateFireEvent(teCombo, 'change');
            GTranslateFireEvent(teCombo, 'change');
        }
    }

    function GTranslateFireEvent(element, event) {
        try {
            if(document.createEventObject) {
                var evt = document.createEventObject();
                element.fireEvent('on'+event, evt);
            } else {
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent(event, true, true);
                element.dispatchEvent(evt);
            }
        } catch(e) {}
    }

    // 5. Gérer le bouton premium
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function setCookie(name, value) {
        document.cookie = `${name}=${value}; path=/`;
        if (window.location.hostname) {
            document.cookie = `${name}=${value}; path=/; domain=${window.location.hostname}`;
        }
    }

    let currentLang = 'fr';
    const googtrans = getCookie('googtrans');
    if (googtrans && googtrans.includes('/en')) {
        currentLang = 'en';
        // Force the translation just in case GTranslate doesn't pick up the cookie immediately
        setTimeout(() => {
            doGTranslate('fr|en');
        }, 1000);
    }

    function updateButtonText(lang) {
        const langToggles = document.querySelectorAll(".lang-toggle-btn");
        langToggles.forEach(btn => {
            btn.textContent = lang === "fr" ? "FR / EN" : "EN / FR";
        });
    }

    updateButtonText(currentLang);

    const langToggles = document.querySelectorAll(".lang-toggle-btn");
    langToggles.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            currentLang = currentLang === 'fr' ? 'en' : 'fr';
            updateButtonText(currentLang);
            setCookie('googtrans', `/fr/${currentLang}`);
            doGTranslate(`fr|${currentLang}`);
        });
    });
});
