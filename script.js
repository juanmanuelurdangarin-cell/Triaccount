const countriesByLang = {
    es: [
        { name: "Argentina", currency: "ARS", label: "Peso Argentino" },
        { name: "España", currency: "EUR", label: "Euro" },
        { name: "México", currency: "MXN", label: "Peso Mexicano" },
        { name: "Chile", currency: "CLP", label: "Peso Chileno" }
    ],
    en: [
        { name: "USA", currency: "USD", label: "US Dollar" },
        { name: "UK", currency: "GBP", label: "British Pound" }
    ],
    pt: [
        { name: "Brasil", currency: "BRL", label: "Real" },
        { name: "Portugal", currency: "EUR", label: "Euro" }
    ]
    // Se pueden seguir sumando...
};

const i18n = {
    es: { history_title: "Mis Eventos", btn_new_event: "+ Nuevo Evento", setup_title: "Configuración", placeholder_title: "Título", placeholder_name: "Nombre amigo", btn_add: "Añadir", btn_save_continue: "Empezar", tab_expenses: "Gastos", tab_balances: "Saldos", tab_payments: "Pagos", modal_title: "Nuevo Gasto", placeholder_expense: "¿Qué compraste?", placeholder_amount: "Monto", label_payer: "¿Quién pagó?", label_participants: "¿Quiénes participan?", btn_cancel: "Cerrar", btn_save: "Guardar", ad_text: "¿Hambre? Pedí en <b>PedidosYa</b>", welcome: "Bienvenido" },
    en: { history_title: "My Events", btn_new_event: "+ New Event", setup_title: "Setup", placeholder_title: "Title", placeholder_name: "Friend's name", btn_add: "Add", btn_save_continue: "Start", tab_expenses: "Expenses", tab_balances: "Balances", tab_payments: "Payments", modal_title: "New Expense", placeholder_expense: "What for?", placeholder_amount: "Amount", label_payer: "Who paid?", label_participants: "Participants", btn_cancel: "Close", btn_save: "Save", ad_text: "Hungry? Order on <b>PedidosYa</b>", welcome: "Welcome" }
};

let currentLang = localStorage.getItem('dg_lang') || '';
let userCountry = JSON.parse(localStorage.getItem('dg_country')) || null;
let allEvents = JSON.parse(localStorage.getItem('dg_events_v3')) || [];
let currentEvent = null;

window.onload = () => {
    if (!currentLang || !userCountry) {
        document.getElementById('welcome-screen').classList.remove('hidden');
    } else {
        showHistory();
    }
};

function onLanguageChange(lang) {
    if(!lang) return;
    const countries = countriesByLang[lang] || countriesByLang['en'];
    const selector = document.getElementById('main-country-selector');
    selector.innerHTML = countries.map(c => `<option value='${JSON.stringify(c)}'>${c.name} (${c.currency})</option>`).join('');
    document.getElementById('country-wrapper').classList.remove('hidden');
    document.getElementById('welcome-msg').innerText = i18n[lang]?.welcome || "Welcome";
}

function confirmIdentity() {
    currentLang = document.getElementById('main-lang-selector').value;
    userCountry = JSON.parse(document.getElementById('main-country-selector').value);
    
    localStorage.setItem('dg_lang', currentLang);
    localStorage.setItem('dg_country', JSON.stringify(userCountry));
    
    document.getElementById('welcome-screen').classList.add('hidden');
    applyLanguage();
    showHistory();
}

function applyLanguage() {
    const texts = i18n[currentLang] || i18n.es;
    document.querySelectorAll('[data-i18n]').forEach(el => el.innerText = texts[el.getAttribute('data-i18n')]);
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => el.placeholder = texts[el.getAttribute('data-i18n-placeholder')]);
    document.getElementById('ad-text').innerHTML = texts.ad_text;
}

function showHistory() {
    applyLanguage();
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('ads-container').classList.remove('hidden');
    document.getElementById('history-screen').classList.remove('hidden');
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.add('hidden');
    
    const list = document.getElementById('history-list');
    list.innerHTML = allEvents.length ? allEvents.map(e => `
        <div class="card" style="margin:5px 0; cursor:pointer" onclick="loadEvent(${e.id})">
            <strong>${e.title}</strong> (${e.currency})
        </div>
    `).join('') : "<p>No hay eventos guardados.</p>";
}

function createNewEvent() {
    currentEvent = { id: Date.now(), title: "", currency: userCountry.currency, friends: [], expenses: [] };
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.remove('hidden');
    
    // Cargar monedas: Local + USD + EUR
    const curSelect = document.getElementById('event-currency');
    const currencies = [...new Set([userCountry.currency, 'USD', 'EUR'])];
    curSelect.innerHTML = currencies.map(c => `<option value="${c}">${c}</option>`).join('');
}

function startEvent() {
    const title = document.getElementById('event-title').value;
    if(!title || currentEvent.friends.length < 2) return alert("Completa los datos");
    currentEvent.title = title;
    currentEvent.currency = document.getElementById('event-currency').value;
    saveEvent();
    showMainScreen();
}

function loadEvent(id) {
    currentEvent = allEvents.find(e => e.id === id);
    showMainScreen();
}

function saveEvent() {
    const idx = allEvents.findIndex(e => e.id === currentEvent.id);
    if(idx > -1) allEvents[idx] = currentEvent;
    else allEvents.push(currentEvent);
    localStorage.setItem('dg_events_v3', JSON.stringify(allEvents));
}

function showMainScreen() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('event-title-display').innerText = currentEvent.title;
    document.getElementById('currency-display').innerText = currentEvent.currency;
    // ... lógica de render de gastos/saldos (igual a la anterior) ...
}

function addFriend() {
    const name = document.getElementById('friend-name').value.trim();
    if(name) {
        currentEvent.friends.push(name);
        document.getElementById('friends-list').innerHTML += `<li>${name}</li>`;
        document.getElementById('friend-name').value = "";
    }
}
