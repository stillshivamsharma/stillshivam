(function() {
    const body = document.body;

    // Page transitions
    document.querySelectorAll('a.internal-link, a:not([target="_blank"]):not([href^="#"]):not([href^="http"])').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href.startsWith('#') || this.getAttribute('target') === '_blank') return;
            e.preventDefault();
            body.classList.add('page-transition-out');
            setTimeout(() => { window.location = href; }, 400);
        });
    });

    // Mobile nav
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('show');
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('show');
            });
        });
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('show');
            }
        });
    }

    // Floating clouds
    const fl = document.getElementById('floatLayer');
    if (fl) {
        const cloudImages = [
            { src: 'images/cloud-big1.png', size: 'big' },
            { src: 'images/cloud-big2.png', size: 'big' },
            { src: 'images/cloud-small.png', size: 'small' }
        ];
        function spawnCloud() {
            const cloudData = cloudImages[Math.floor(Math.random() * cloudImages.length)];
            const container = document.createElement('div');
            container.className = 'cloud-img ' + cloudData.size;
            const img = document.createElement('img');
            img.src = cloudData.src; img.style.width = '100%'; img.style.height = 'auto';
            img.style.pointerEvents = 'none'; img.alt = 'cloud';
            container.appendChild(img);
            container.style.top = (Math.random() * 75 + 5) + '%';
            container.classList.add(Math.random() > 0.5 ? 'move-left' : 'move-right');
            container.style.animationDuration = (Math.random() * 13 + 15) + 's';
            fl.appendChild(container);
            container.addEventListener('animationend', () => { container.remove(); });
        }
        for (let i = 0; i < 4; i++) setTimeout(spawnCloud, i * 800);
        setInterval(() => { if (document.querySelectorAll('.cloud-img').length < 5) spawnCloud(); }, 7000);
    }

    // Scroll progress
    const progressBar = document.getElementById('scrollProgress');
    window.addEventListener('scroll', () => {
        progressBar.style.width = Math.min(100, Math.max(0, (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)) + '%';
    }, {passive: true});
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 50), {passive: true});

    // Reveal on scroll
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('visible'); });
    }, {threshold: 0.1});
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // Smooth scroll
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.getElementById(this.getAttribute('href').substring(1));
            if (target) target.scrollIntoView({behavior: 'smooth'});
        });
    });

    // Collab form (modified to handle dynamic action)
    const collabForm = document.getElementById('collabForm');
    if (collabForm) {
        const formMessage = document.getElementById('formMessage');
        collabForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Ensure action is set (might still be empty if fetch hasn't completed, but good to check)
            if (!collabForm.action || collabForm.action === window.location.href) {
                formMessage.style.display = 'block';
                formMessage.style.background = 'rgba(255, 225, 225, 0.7)';
                formMessage.style.color = '#7a2e3b';
                formMessage.textContent = 'Form endpoint not configured. Please set FORMSPREE_ENDPOINT env var.';
                return;
            }
            const submitBtn = collabForm.querySelector('.btn-submit');
            submitBtn.textContent = 'sending...'; submitBtn.disabled = true;
            formMessage.style.display = 'none';
            try {
                const response = await fetch(collabForm.action, { method: 'POST', body: new FormData(collabForm), headers: { 'Accept': 'application/json' } });
                if (response.ok) {
                    formMessage.style.display = 'block';
                    formMessage.style.background = 'rgba(210, 245, 210, 0.7)';
                    formMessage.style.color = '#2d5a3b';
                    formMessage.style.border = '1px solid rgba(150, 220, 150, 0.6)';
                    formMessage.textContent = '✨ Your message floated gently into my inbox. I\'ll reply soon!';
                    collabForm.reset();
                } else throw new Error('Form not OK');
            } catch (error) {
                formMessage.style.display = 'block';
                formMessage.style.background = 'rgba(255, 225, 225, 0.7)';
                formMessage.style.color = '#7a2e3b';
                formMessage.style.border = '1px solid rgba(220, 140, 140, 0.6)';
                formMessage.textContent = '🥀 Oops, something went wrong.';
            }
            submitBtn.textContent = 'send with love'; submitBtn.disabled = false;
        });
    }

    // Calculators + AI
    const dowryForm = document.getElementById('dowryForm');
    const alimonyForm = document.getElementById('alimonyForm');
    if (dowryForm && alimonyForm) {
        dowryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const salary = parseFloat(document.getElementById('dSalary').value) || 0;
            const height = parseFloat(document.getElementById('dHeight').value) || 160;
            const skin = document.getElementById('dSkin').value;
            const education = document.getElementById('dEducation').value;
            const location = document.getElementById('dLocation').value;
            const vehicle = document.getElementById('dVehicle').value;
            const horoscope = document.getElementById('dHoroscope').value;
            let base = salary * 12, multiplier = 1;
            if (height > 180) multiplier += 0.2; else if (height > 170) multiplier += 0.1;
            if (skin === 'fair') multiplier += 0.3; else if (skin === 'wheatish') multiplier += 0.1;
            if (education === 'iit') multiplier += 0.5; else if (education === 'mba') multiplier += 0.4;
            else if (education === 'graduate') multiplier += 0.2; else if (education === 'selfmade') multiplier += 0.25;
            if (location === 'foreign') multiplier += 0.4; else if (location === 'metro') multiplier += 0.2;
            if (vehicle === 'bmw') multiplier += 0.3; else if (vehicle === 'swift') multiplier += 0.1;
            if (horoscope === 'perfect') multiplier += 0.1;
            const dowry = Math.round(base * multiplier);
            const formatted = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(dowry);
            document.getElementById('dowryResult').style.display = 'block';
            document.getElementById('dowryResult').innerHTML = `💸 Estimated Dowry: <strong>${formatted}</strong><br><span style="font-size:0.8rem">(plus a Swift Dzire and gold chain, probably)</span>`;
            document.getElementById('dowryAiBtn').style.display = 'inline-block';
            window.dowryData = { salary, height, skin, education, location, vehicle, horoscope, dowry, formatted };
        });

        alimonyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const years = parseFloat(document.getElementById('aYears').value) || 0;
            const husbandIncome = parseFloat(document.getElementById('aHusbandIncome').value) || 0;
            const wifeIncome = parseFloat(document.getElementById('aWifeIncome').value) || 0;
            const children = parseInt(document.getElementById('aChildren').value) || 0;
            const lifestyle = document.getElementById('aLifestyle').value;
            const reason = document.getElementById('aReason').value;
            const incomeDiff = Math.max(0, husbandIncome - wifeIncome);
            let factor = 0.25 + children * 0.05;
            if (lifestyle === 'influencer') factor += 0.1; else if (lifestyle === 'luxury') factor += 0.2;
            if (reason === 'cheating') factor += 0.2; else if (reason === 'inlaws') factor += 0.1; else if (reason === 'alien') factor += 0.5;
            const monthlyAlimony = Math.round(incomeDiff * factor);
            const yearly = monthlyAlimony * 12;
            const fmtM = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(monthlyAlimony);
            const fmtY = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(yearly);
            document.getElementById('alimonyResult').style.display = 'block';
            document.getElementById('alimonyResult').innerHTML = monthlyAlimony <= 0 ? `😇 No alimony needed!` : `💰 Monthly alimony: <strong>${fmtM}</strong><br>(~ ${fmtY} per year)`;
            document.getElementById('alimonyAiBtn').style.display = 'inline-block';
            window.alimonyData = { years, husbandIncome, wifeIncome, children, lifestyle, reason, monthlyAlimony, formattedMonthly: fmtM };
        });

        async function analyzeWithAI(data, type, resultDivId) {
            const resultDiv = document.getElementById(resultDivId);
            resultDiv.style.display = 'block'; resultDiv.textContent = '🥸 Dada Ji soch rahe hain...';
            try {
                const response = await fetch('/api/advisor', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, data })
                });
                const json = await response.json();
                resultDiv.textContent = json.analysis || '🥸 Beta, samajh nahi aaya.';
            } catch (error) {
                resultDiv.textContent = '☁️ Dada Ji ki chai gir gayi.';
            }
        }

        document.getElementById('dowryAiBtn').addEventListener('click', () => {
            if (window.dowryData) analyzeWithAI(window.dowryData, 'dowry', 'dowryAiResult');
        });
        document.getElementById('alimonyAiBtn').addEventListener('click', () => {
            if (window.alimonyData) analyzeWithAI(window.alimonyData, 'alimony', 'alimonyAiResult');
        });

        // General Chat
        const chatArea = document.getElementById('chatArea');
        const generalInput = document.getElementById('generalAiInput');
        const generalSend = document.getElementById('generalAiSend');

        function addMessage(text, sender) {
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble ' + sender;
            if (sender === 'ai') {
                const avatar = document.createElement('img');
                avatar.src = 'images/dadaji_aipfp.png';
                avatar.alt = 'Dada Ji'; avatar.className = 'ai-avatar';
                const contentDiv = document.createElement('div');
                contentDiv.style.flex = '1';
                const header = document.createElement('div');
                header.className = 'ai-header'; header.textContent = 'Dada Ji 🥸';
                const textSpan = document.createElement('span');
                textSpan.textContent = text;
                contentDiv.appendChild(header);
                contentDiv.appendChild(textSpan);
                bubble.appendChild(avatar);
                bubble.appendChild(contentDiv);
            } else {
                bubble.textContent = text;
            }
            chatArea.appendChild(bubble);
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        async function sendGeneralMessage() {
            const message = generalInput.value.trim();
            if (!message) return;
            addMessage(message, 'user'); generalInput.value = '';
            addMessage('🥸 Soch raha hoon beta...', 'ai');
            try {
                const response = await fetch('/api/advisor', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'general', message })
                });
                const json = await response.json();
                chatArea.lastChild.remove();
                addMessage(json.analysis || '🥸 Beta, samajh nahi aaya.', 'ai');
            } catch (error) {
                chatArea.lastChild.remove();
                addMessage('☁️ Dada Ji so gaye.', 'ai');
            }
        }

        generalSend.addEventListener('click', sendGeneralMessage);
        generalInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendGeneralMessage(); });
    }
})();