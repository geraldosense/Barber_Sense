/**
 * Sense Barbershop — i18n (PT, EN, FR, ES)
 */
(function () {
    const STORAGE_KEY = 'sense_lang';
    const DEFAULT_LANG = 'pt';
    const SUPPORTED = ['pt', 'en', 'fr', 'es'];

    const LANG_META = {
        pt: { label: 'Português', short: 'PT', html: 'pt', flag: '🇵🇹' },
        en: { label: 'English', short: 'EN', html: 'en', flag: '🇬🇧' },
        fr: { label: 'Français', short: 'FR', html: 'fr', flag: '🇫🇷' },
        es: { label: 'Español', short: 'ES', html: 'es', flag: '🇪🇸' }
    };

    const T = {
        pt: {
            'meta.title': 'Sense Barbershop - Agendamento Online',
            'nav.home': 'Início',
            'nav.services': 'Serviços',
            'nav.barber': 'Barbeiro',
            'nav.gallery': 'Galeria',
            'nav.contact': 'Contactos',
            'nav.myArea': 'Minha Área',
            'nav.openMenu': 'Abrir menu',
            'hero.cta': 'Reservar Marcação',
            'services.title': 'Nossos Serviços',
            'barber.eyebrow': 'A mão por trás do estilo',
            'barber.title': 'O Barbeiro',
            'barber.lead': 'Precisão, estilo e dedicação em cada detalhe.',
            'barber.viewPhoto': 'Ver foto',
            'barber.viewPhotoFull': 'Ver fotografia completa de {name}',
            'barber.experience': '4 anos de profissionalismo na área da barbearia',
            'barber.quote': '«Cada cliente sai da cadeira com confiança renovada.»',
            'barber.bookWith': 'Marcar com {name}',
            'gallery.title': 'Galeria de Cortes',
            'gallery.intro': 'Trabalhos publicados na Sense Barbershop',
            'gallery.loading': 'A carregar galeria...',
            'gallery.empty': 'Ainda não há cortes publicados.',
            'contact.title': 'Fale Connosco',
            'contact.lead': 'Estamos prontos para o receber. Entre em contacto ou agende o seu corte online.',
            'info.location': 'Localização',
            'info.hours': 'Horário',
            'info.hoursValue': 'Seg-Sex: 9h-20h | Sáb: 9h-18h',
            'info.phone': 'Telefone',
            'footer.quickLinks': 'Links Rápidos',
            'footer.social': 'Redes Sociais',
            'footer.rights': '© 2026 Sense Barbershop. Todos os direitos reservados.',
            'footer.admin': 'Admin',
            'footer.phoneLabel': 'Telefone:',
            'footer.emailLabel': 'Email:',
            'common.continue': 'Continuar',
            'common.back': 'Voltar',
            'common.logout': 'Sair',
            'common.loading': 'A carregar...',
            'common.select': 'Selecione...',
            'common.min': 'min',
            'lang.select': 'Idioma',
            'marcacao.title': 'Reservar Marcação',
            'marcacao.subtitle': 'Escolha o serviço e horário — com Geraldo Sense.',
            'marcacao.myBookings': 'As Minhas Marcações',
            'marcacao.chooseService': 'Escolha o Serviço',
            'marcacao.chooseBarber': 'Escolha o Barbeiro',
            'marcacao.dateTime': 'Data e Horário',
            'marcacao.date': 'Data',
            'marcacao.time': 'Horário disponível',
            'marcacao.confirmTitle': 'Confirmar Reserva',
            'marcacao.confirmBtn': 'Confirmar Marcação',
            'marcacao.confirmed': 'Marcação Confirmada!',
            'marcacao.newBooking': 'Nova Marcação',
            'marcacao.backToSite': 'Voltar ao site',
            'marcacao.step.service': 'Serviço',
            'marcacao.step.barber': 'Barbeiro',
            'marcacao.step.datetime': 'Data & Hora',
            'marcacao.step.confirm': 'Confirmar',
            'marcacao.err.service': 'Selecione um serviço para continuar.',
            'marcacao.err.barber': 'Selecione um barbeiro.',
            'marcacao.err.datetime': 'Selecione data e horário.',
            'marcacao.empty': 'Ainda não tem marcações.',
            'marcacao.status.confirmed': 'Confirmado',
            'marcacao.status.cancelled': 'Cancelada',
            'finalizar.title': 'Finalizar marcação',
            'finalizar.sub': 'Confirme a sua marcação e efetue o pagamento de forma segura.',
            'finalizar.btn': 'Finalizar marcação',
            'finalizar.secure': 'Pagamento seguro',
            'payment.mode': 'Modo de pagamento',
            'payment.summary': 'Resumo',
            'auth.login': 'Entrar',
            'auth.register': 'Registar',
            'auth.logout': 'Sair',
            'auth.backToSite': 'Voltar ao site',
            'auth.titleLogin': 'Entrar na Sense Barbershop',
            'auth.subLogin': 'Use Google ou email para reservar o seu corte',
            'auth.titleRegister': 'Criar conta na Sense Barbershop',
            'auth.subRegister': 'Registe-se com Google ou email para marcar o seu corte',
            'auth.titleRecover': 'Recuperar palavra-passe',
            'auth.subRecover': 'Enviaremos instruções para o seu email',
            'auth.googleNote': 'Entrar com conta Google verificada',
            'auth.orEmail': 'ou com email',
            'auth.email': 'Email',
            'auth.password': 'Palavra-passe',
            'auth.forgot': 'Esqueci a palavra-passe',
            'auth.noAccount': 'Ainda não tem conta?',
            'auth.hasAccount': 'Já tem conta?',
            'auth.fullName': 'Nome completo',
            'auth.phone': 'Telefone',
            'auth.confirmPassword': 'Confirmar palavra-passe',
            'auth.createAccount': 'Criar Conta',
            'auth.completeProfile': 'Último passo',
            'auth.completeProfileSub': 'Indique o telefone para concluir o registo.',
            'auth.completeBtn': 'Concluir e Reservar',
            'auth.adminHint': 'Administração da barbearia: use o link Admin no rodapé do site.',
            'auth.bookNow': 'Reservar Marcação',
            'auth.bookShort': 'Reservar',
            'auth.myAccount': 'Minha Conta'
        },
        en: {
            'meta.title': 'Sense Barbershop - Online Booking',
            'nav.home': 'Home',
            'nav.services': 'Services',
            'nav.barber': 'Barber',
            'nav.gallery': 'Gallery',
            'nav.contact': 'Contact',
            'nav.myArea': 'My Area',
            'nav.openMenu': 'Open menu',
            'hero.cta': 'Book Appointment',
            'services.title': 'Our Services',
            'barber.eyebrow': 'The hand behind the style',
            'barber.title': 'The Barber',
            'barber.lead': 'Precision, style and dedication in every detail.',
            'barber.viewPhoto': 'View photo',
            'barber.viewPhotoFull': 'View full photo of {name}',
            'barber.experience': '4 years of professionalism in barbering',
            'barber.quote': '"Every client leaves the chair with renewed confidence."',
            'barber.bookWith': 'Book with {name}',
            'gallery.title': 'Haircut Gallery',
            'gallery.intro': 'Work published at Sense Barbershop',
            'gallery.loading': 'Loading gallery...',
            'gallery.empty': 'No haircuts published yet.',
            'contact.title': 'Contact Us',
            'contact.lead': 'We are ready to welcome you. Get in touch or book your haircut online.',
            'info.location': 'Location',
            'info.hours': 'Hours',
            'info.hoursValue': 'Mon-Fri: 9am-8pm | Sat: 9am-6pm',
            'info.phone': 'Phone',
            'footer.quickLinks': 'Quick Links',
            'footer.social': 'Social Media',
            'footer.rights': '© 2026 Sense Barbershop. All rights reserved.',
            'footer.admin': 'Admin',
            'footer.phoneLabel': 'Phone:',
            'footer.emailLabel': 'Email:',
            'common.continue': 'Continue',
            'common.back': 'Back',
            'common.logout': 'Log out',
            'common.loading': 'Loading...',
            'common.select': 'Select...',
            'common.min': 'min',
            'lang.select': 'Language',
            'marcacao.title': 'Book Appointment',
            'marcacao.subtitle': 'Choose your service and time — with Geraldo Sense.',
            'marcacao.myBookings': 'My Appointments',
            'marcacao.chooseService': 'Choose a Service',
            'marcacao.chooseBarber': 'Choose a Barber',
            'marcacao.dateTime': 'Date & Time',
            'marcacao.date': 'Date',
            'marcacao.time': 'Available time',
            'marcacao.confirmTitle': 'Confirm Booking',
            'marcacao.confirmBtn': 'Confirm Appointment',
            'marcacao.confirmed': 'Appointment Confirmed!',
            'marcacao.newBooking': 'New Appointment',
            'marcacao.backToSite': 'Back to site',
            'marcacao.step.service': 'Service',
            'marcacao.step.barber': 'Barber',
            'marcacao.step.datetime': 'Date & Time',
            'marcacao.step.confirm': 'Confirm',
            'marcacao.err.service': 'Please select a service to continue.',
            'marcacao.err.barber': 'Please select a barber.',
            'marcacao.err.datetime': 'Please select date and time.',
            'marcacao.empty': 'You have no appointments yet.',
            'marcacao.status.confirmed': 'Confirmed',
            'marcacao.status.cancelled': 'Cancelled',
            'finalizar.title': 'Complete booking',
            'finalizar.sub': 'Confirm your appointment and pay securely.',
            'finalizar.btn': 'Complete booking',
            'finalizar.secure': 'Secure payment',
            'payment.mode': 'Payment method',
            'payment.summary': 'Summary',
            'auth.login': 'Sign in',
            'auth.register': 'Register',
            'auth.logout': 'Log out',
            'auth.backToSite': 'Back to site',
            'auth.titleLogin': 'Sign in to Sense Barbershop',
            'auth.subLogin': 'Use Google or email to book your haircut',
            'auth.titleRegister': 'Create a Sense Barbershop account',
            'auth.subRegister': 'Register with Google or email to book your haircut',
            'auth.titleRecover': 'Reset password',
            'auth.subRecover': 'We will send instructions to your email',
            'auth.googleNote': 'Sign in with a verified Google account',
            'auth.orEmail': 'or with email',
            'auth.email': 'Email',
            'auth.password': 'Password',
            'auth.forgot': 'Forgot password',
            'auth.noAccount': "Don't have an account?",
            'auth.hasAccount': 'Already have an account?',
            'auth.fullName': 'Full name',
            'auth.phone': 'Phone',
            'auth.confirmPassword': 'Confirm password',
            'auth.createAccount': 'Create Account',
            'auth.completeProfile': 'Last step',
            'auth.completeProfileSub': 'Enter your phone number to complete registration.',
            'auth.completeBtn': 'Complete & Book',
            'auth.adminHint': 'Barbershop administration: use the Admin link in the site footer.',
            'auth.bookNow': 'Book Appointment',
            'auth.bookShort': 'Book',
            'auth.myAccount': 'My Account'
        },
        fr: {
            'meta.title': 'Sense Barbershop - Réservation en ligne',
            'nav.home': 'Accueil',
            'nav.services': 'Services',
            'nav.barber': 'Barbier',
            'nav.gallery': 'Galerie',
            'nav.contact': 'Contact',
            'nav.myArea': 'Mon Espace',
            'nav.openMenu': 'Ouvrir le menu',
            'hero.cta': 'Réserver',
            'services.title': 'Nos Services',
            'barber.eyebrow': 'La main derrière le style',
            'barber.title': 'Le Barbier',
            'barber.lead': 'Précision, style et dévouement dans chaque détail.',
            'barber.viewPhoto': 'Voir la photo',
            'barber.viewPhotoFull': 'Voir la photo complète de {name}',
            'barber.experience': '4 ans de professionnalisme dans le domaine de la barberie',
            'barber.quote': '« Chaque client quitte le fauteuil avec une confiance renouvelée. »',
            'barber.bookWith': 'Réserver avec {name}',
            'gallery.title': 'Galerie de Coupes',
            'gallery.intro': 'Travaux publiés chez Sense Barbershop',
            'gallery.loading': 'Chargement de la galerie...',
            'gallery.empty': 'Aucune coupe publiée pour le moment.',
            'contact.title': 'Contactez-nous',
            'contact.lead': 'Nous sommes prêts à vous accueillir. Contactez-nous ou réservez votre coupe en ligne.',
            'info.location': 'Adresse',
            'info.hours': 'Horaires',
            'info.hoursValue': 'Lun-Ven: 9h-20h | Sam: 9h-18h',
            'info.phone': 'Téléphone',
            'footer.quickLinks': 'Liens Rapides',
            'footer.social': 'Réseaux Sociaux',
            'footer.rights': '© 2026 Sense Barbershop. Tous droits réservés.',
            'footer.admin': 'Admin',
            'footer.phoneLabel': 'Téléphone :',
            'footer.emailLabel': 'Email :',
            'common.continue': 'Continuer',
            'common.back': 'Retour',
            'common.logout': 'Déconnexion',
            'common.loading': 'Chargement...',
            'common.select': 'Sélectionner...',
            'common.min': 'min',
            'lang.select': 'Langue',
            'marcacao.title': 'Réserver',
            'marcacao.subtitle': 'Choisissez le service et l\'horaire — avec Geraldo Sense.',
            'marcacao.myBookings': 'Mes Réservations',
            'marcacao.chooseService': 'Choisir un Service',
            'marcacao.chooseBarber': 'Choisir un Barbier',
            'marcacao.dateTime': 'Date et Heure',
            'marcacao.date': 'Date',
            'marcacao.time': 'Horaire disponible',
            'marcacao.confirmTitle': 'Confirmer la Réservation',
            'marcacao.confirmBtn': 'Confirmer la Réservation',
            'marcacao.confirmed': 'Réservation Confirmée !',
            'marcacao.newBooking': 'Nouvelle Réservation',
            'marcacao.backToSite': 'Retour au site',
            'marcacao.step.service': 'Service',
            'marcacao.step.barber': 'Barbier',
            'marcacao.step.datetime': 'Date & Heure',
            'marcacao.step.confirm': 'Confirmer',
            'marcacao.err.service': 'Veuillez sélectionner un service pour continuer.',
            'marcacao.err.barber': 'Veuillez sélectionner un barbier.',
            'marcacao.err.datetime': 'Veuillez sélectionner la date et l\'heure.',
            'marcacao.empty': 'Vous n\'avez pas encore de réservations.',
            'marcacao.status.confirmed': 'Confirmé',
            'marcacao.status.cancelled': 'Annulé',
            'finalizar.title': 'Finaliser la réservation',
            'finalizar.sub': 'Confirmez votre réservation et payez en toute sécurité.',
            'finalizar.btn': 'Finaliser la réservation',
            'finalizar.secure': 'Paiement sécurisé',
            'payment.mode': 'Mode de paiement',
            'payment.summary': 'Résumé',
            'auth.login': 'Connexion',
            'auth.register': 'Inscription',
            'auth.logout': 'Déconnexion',
            'auth.backToSite': 'Retour au site',
            'auth.titleLogin': 'Connexion à Sense Barbershop',
            'auth.subLogin': 'Utilisez Google ou email pour réserver votre coupe',
            'auth.titleRegister': 'Créer un compte Sense Barbershop',
            'auth.subRegister': 'Inscrivez-vous avec Google ou email pour réserver',
            'auth.titleRecover': 'Récupérer le mot de passe',
            'auth.subRecover': 'Nous enverrons les instructions à votre email',
            'auth.googleNote': 'Connexion avec un compte Google vérifié',
            'auth.orEmail': 'ou avec email',
            'auth.email': 'Email',
            'auth.password': 'Mot de passe',
            'auth.forgot': 'Mot de passe oublié',
            'auth.noAccount': 'Pas encore de compte ?',
            'auth.hasAccount': 'Déjà un compte ?',
            'auth.fullName': 'Nom complet',
            'auth.phone': 'Téléphone',
            'auth.confirmPassword': 'Confirmer le mot de passe',
            'auth.createAccount': 'Créer un Compte',
            'auth.completeProfile': 'Dernière étape',
            'auth.completeProfileSub': 'Indiquez votre téléphone pour terminer l\'inscription.',
            'auth.completeBtn': 'Terminer et Réserver',
            'auth.adminHint': 'Administration du salon : utilisez le lien Admin dans le pied de page.',
            'auth.bookNow': 'Réserver',
            'auth.bookShort': 'Réserver',
            'auth.myAccount': 'Mon Compte'
        },
        es: {
            'meta.title': 'Sense Barbershop - Reserva Online',
            'nav.home': 'Inicio',
            'nav.services': 'Servicios',
            'nav.barber': 'Barbero',
            'nav.gallery': 'Galería',
            'nav.contact': 'Contacto',
            'nav.myArea': 'Mi Área',
            'nav.openMenu': 'Abrir menú',
            'hero.cta': 'Reservar Cita',
            'services.title': 'Nuestros Servicios',
            'barber.eyebrow': 'La mano detrás del estilo',
            'barber.title': 'El Barbero',
            'barber.lead': 'Precisión, estilo y dedicación en cada detalle.',
            'barber.viewPhoto': 'Ver foto',
            'barber.viewPhotoFull': 'Ver fotografía completa de {name}',
            'barber.experience': '4 años de profesionalismo en el área de la barbería',
            'barber.quote': '«Cada cliente sale de la silla con confianza renovada.»',
            'barber.bookWith': 'Reservar con {name}',
            'gallery.title': 'Galería de Cortes',
            'gallery.intro': 'Trabajos publicados en Sense Barbershop',
            'gallery.loading': 'Cargando galería...',
            'gallery.empty': 'Aún no hay cortes publicados.',
            'contact.title': 'Contáctanos',
            'contact.lead': 'Estamos listos para recibirte. Contáctanos o reserva tu corte en línea.',
            'info.location': 'Ubicación',
            'info.hours': 'Horario',
            'info.hoursValue': 'Lun-Vie: 9h-20h | Sáb: 9h-18h',
            'info.phone': 'Teléfono',
            'footer.quickLinks': 'Enlaces Rápidos',
            'footer.social': 'Redes Sociales',
            'footer.rights': '© 2026 Sense Barbershop. Todos los derechos reservados.',
            'footer.admin': 'Admin',
            'footer.phoneLabel': 'Teléfono:',
            'footer.emailLabel': 'Email:',
            'common.continue': 'Continuar',
            'common.back': 'Volver',
            'common.logout': 'Salir',
            'common.loading': 'Cargando...',
            'common.select': 'Seleccionar...',
            'common.min': 'min',
            'lang.select': 'Idioma',
            'marcacao.title': 'Reservar Cita',
            'marcacao.subtitle': 'Elige el servicio y horario — con Geraldo Sense.',
            'marcacao.myBookings': 'Mis Citas',
            'marcacao.chooseService': 'Elige el Servicio',
            'marcacao.chooseBarber': 'Elige el Barbero',
            'marcacao.dateTime': 'Fecha y Hora',
            'marcacao.date': 'Fecha',
            'marcacao.time': 'Horario disponible',
            'marcacao.confirmTitle': 'Confirmar Reserva',
            'marcacao.confirmBtn': 'Confirmar Cita',
            'marcacao.confirmed': '¡Cita Confirmada!',
            'marcacao.newBooking': 'Nueva Cita',
            'marcacao.backToSite': 'Volver al sitio',
            'marcacao.step.service': 'Servicio',
            'marcacao.step.barber': 'Barbero',
            'marcacao.step.datetime': 'Fecha y Hora',
            'marcacao.step.confirm': 'Confirmar',
            'marcacao.err.service': 'Selecciona un servicio para continuar.',
            'marcacao.err.barber': 'Selecciona un barbero.',
            'marcacao.err.datetime': 'Selecciona fecha y horario.',
            'marcacao.empty': 'Aún no tienes citas.',
            'marcacao.status.confirmed': 'Confirmado',
            'marcacao.status.cancelled': 'Cancelada',
            'finalizar.title': 'Finalizar reserva',
            'finalizar.sub': 'Confirma tu cita y realiza el pago de forma segura.',
            'finalizar.btn': 'Finalizar reserva',
            'finalizar.secure': 'Pago seguro',
            'payment.mode': 'Modo de pago',
            'payment.summary': 'Resumen',
            'auth.login': 'Entrar',
            'auth.register': 'Registrarse',
            'auth.logout': 'Salir',
            'auth.backToSite': 'Volver al sitio',
            'auth.titleLogin': 'Entrar en Sense Barbershop',
            'auth.subLogin': 'Usa Google o email para reservar tu corte',
            'auth.titleRegister': 'Crear cuenta en Sense Barbershop',
            'auth.subRegister': 'Regístrate con Google o email para reservar tu corte',
            'auth.titleRecover': 'Recuperar contraseña',
            'auth.subRecover': 'Enviaremos instrucciones a tu email',
            'auth.googleNote': 'Entrar con cuenta Google verificada',
            'auth.orEmail': 'o con email',
            'auth.email': 'Email',
            'auth.password': 'Contraseña',
            'auth.forgot': 'Olvidé la contraseña',
            'auth.noAccount': '¿Aún no tienes cuenta?',
            'auth.hasAccount': '¿Ya tienes cuenta?',
            'auth.fullName': 'Nombre completo',
            'auth.phone': 'Teléfono',
            'auth.confirmPassword': 'Confirmar contraseña',
            'auth.createAccount': 'Crear Cuenta',
            'auth.completeProfile': 'Último paso',
            'auth.completeProfileSub': 'Indica tu teléfono para completar el registro.',
            'auth.completeBtn': 'Completar y Reservar',
            'auth.adminHint': 'Administración de la barbería: usa el enlace Admin en el pie de página.',
            'auth.bookNow': 'Reservar Cita',
            'auth.bookShort': 'Reservar',
            'auth.myAccount': 'Mi Cuenta'
        }
    };

    let currentLang = DEFAULT_LANG;

    function normalizeLang(lang) {
        const code = String(lang || '').toLowerCase().slice(0, 2);
        return SUPPORTED.includes(code) ? code : DEFAULT_LANG;
    }

    function getLang() {
        return currentLang;
    }

    function t(key, vars = {}) {
        const dict = T[currentLang] || T[DEFAULT_LANG];
        let text = dict[key] ?? T[DEFAULT_LANG][key] ?? key;
        Object.entries(vars).forEach(([k, v]) => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
        });
        return text;
    }

    function applyPage() {
        document.documentElement.lang = LANG_META[currentLang]?.html || 'pt';

        document.querySelectorAll('[data-i18n]').forEach((el) => {
            const key = el.dataset.i18n;
            if (key) el.textContent = t(key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
            const key = el.dataset.i18nPlaceholder;
            if (key) el.placeholder = t(key);
        });

        document.querySelectorAll('[data-i18n-title]').forEach((el) => {
            const key = el.dataset.i18nTitle;
            if (key) el.title = t(key);
        });

        document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
            const key = el.dataset.i18nAria;
            if (key) el.setAttribute('aria-label', t(key));
        });

        const titleKey = document.body?.dataset?.i18nTitle;
        if (titleKey) document.title = t(titleKey);

        document.querySelectorAll('.lang-switcher-option').forEach((btn) => {
            const active = btn.dataset.lang === currentLang;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });

        document.querySelectorAll('.lang-switcher').forEach((sw) => {
            const flag = sw.querySelector('.lang-switcher-flag');
            const label = sw.querySelector('.lang-switcher-current');
            const kicker = sw.querySelector('.lang-switcher-kicker');
            if (flag) flag.textContent = LANG_META[currentLang]?.flag || '🌐';
            if (label) label.textContent = LANG_META[currentLang]?.label || 'Português';
            if (kicker) kicker.textContent = t('lang.select');
        });

        document.dispatchEvent(new CustomEvent('sense:langchange', { detail: { lang: currentLang } }));
    }

    function setLang(lang) {
        currentLang = normalizeLang(lang);
        localStorage.setItem(STORAGE_KEY, currentLang);
        applyPage();
    }

    function mountLangSwitcher(container) {
        if (!container || container.dataset.mounted) return;
        container.dataset.mounted = '1';
        container.className = 'lang-switcher';

        const options = SUPPORTED.map((code) => {
            const meta = LANG_META[code];
            return `
                <button type="button" class="lang-switcher-option" role="option" data-lang="${code}" aria-selected="false">
                    <span class="lang-switcher-option-flag">${meta.flag}</span>
                    <span class="lang-switcher-option-text">
                        <strong>${meta.label}</strong>
                        <small>${meta.short}</small>
                    </span>
                    <i class="fas fa-check lang-switcher-option-check" aria-hidden="true"></i>
                </button>
            `;
        }).join('');

        const meta = LANG_META[currentLang];
        container.innerHTML = `
            <button type="button" class="lang-switcher-btn" aria-haspopup="listbox" aria-expanded="false" aria-label="${t('lang.select')}">
                <span class="lang-switcher-glow" aria-hidden="true"></span>
                <span class="lang-switcher-ring" aria-hidden="true"></span>
                <span class="lang-switcher-flag">${meta.flag}</span>
                <span class="lang-switcher-text">
                    <span class="lang-switcher-kicker">${t('lang.select')}</span>
                    <span class="lang-switcher-current">${meta.label}</span>
                </span>
                <span class="lang-switcher-globe" aria-hidden="true"><i class="fas fa-globe-americas"></i></span>
            </button>
            <div class="lang-switcher-menu hidden" role="listbox" aria-label="${t('lang.select')}">
                <p class="lang-switcher-menu-title">${t('lang.select')}</p>
                ${options}
            </div>
        `;

        const btn = container.querySelector('.lang-switcher-btn');
        const menu = container.querySelector('.lang-switcher-menu');

        btn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const open = menu?.classList.toggle('hidden') === false;
            btn.classList.toggle('is-open', open);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        menu?.querySelectorAll('.lang-switcher-option').forEach((opt) => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                setLang(opt.dataset.lang);
                menu.classList.add('hidden');
                btn?.classList.remove('is-open');
                btn?.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', () => {
            menu?.classList.add('hidden');
            btn?.classList.remove('is-open');
            btn?.setAttribute('aria-expanded', 'false');
        });
    }

    function init() {
        currentLang = normalizeLang(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG);
        document.querySelectorAll('[data-lang-mount]').forEach(mountLangSwitcher);
        applyPage();
    }

    window.t = t;
    window.getLang = getLang;
    window.setLang = setLang;
    window.I18n = { t, getLang, setLang, applyPage, init };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
