let currentEvent = { id: Date.now(), title: "", currency: "$", friends: [], expenses: [] };
let allEvents = [];
let editingIndex = null;

// INICIALIZACIÓN
window.onload = () => {
    const saved = localStorage.getItem('divideGastos_v2');
    if (saved) allEvents = JSON.parse(saved);

    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');

    if (sharedData) {
        try {
            const decoded = JSON.parse(atob(sharedData));
            currentEvent = decoded;
            if (!allEvents.find(e => e.id === decoded.id)) {
                allEvents.push(decoded);
                saveToLocal();
            }
            showMainScreen();
        } catch (e) { console.error("Error al cargar link compartido"); }
    } else if (allEvents.length > 0) {
        showHistory();
    }
};

function saveToLocal() {
    localStorage.setItem('divideGastos_v2', JSON.stringify(allEvents));
}

// NAVEGACIÓN Y MULTI-EVENTO
function showHistory() {
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('history-screen').classList.remove('hidden');
    document.getElementById('btn-back').classList.add('hidden');
    
    const list = document.getElementById('history-list');
    list.innerHTML = allEvents.map(e => `
        <div class="history-item" onclick="loadEvent(${e.id})">
            <div><strong>${e.title}</strong><br><small>${e.friends.length} amigos • ${e.expenses.length} gastos</small></div>
            <i class="fas fa-chevron-right" style="color:#ccc"></i>
        </div>
    `).join('');
}

function createNewEvent() {
    currentEvent = { id: Date.now(), title: "", currency: "$", friends: [], expenses: [] };
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.remove('hidden');
    document.getElementById('event-title').value = "";
    renderFriendsList();
}

function loadEvent(id) {
    currentEvent = allEvents.find(e => e.id === id);
    showMainScreen();
}

function goBackToSetup() {
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.remove('hidden');
    document.getElementById('event-title').value = currentEvent.title;
}

// CONFIGURACIÓN DE MIEMBROS
function addFriend() {
    const input = document.getElementById('friend-name');
    const name = input.value.trim();
    if (name && !currentEvent.friends.includes(name)) {
        currentEvent.friends.push(name);
        renderFriendsList();
        input.value = "";
    }
}

function renderFriendsList() {
    const list = document.getElementById('friends-list');
    list.innerHTML = currentEvent.friends.map(f => `<li><i class="fas fa-user"></i> ${f}</li>`).join('');
}

function startEvent() {
    if (currentEvent.friends.length < 2) return alert("Agregá al menos 2 personas");
    currentEvent.title = document.getElementById('event-title').value || "Evento";
    currentEvent.currency = document.getElementById('event-currency').value;
    
    const idx = allEvents.findIndex(e => e.id === currentEvent.id);
    if (idx > -1) allEvents[idx] = currentEvent;
    else allEvents.push(currentEvent);
    
    saveToLocal();
    showMainScreen();
}

function showMainScreen() {
    document.getElementById('history-screen').classList.add('hidden');
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('btn-back').classList.remove('hidden');
    document.getElementById('event-title-display').innerText = currentEvent.title;
    document.getElementById('currency-display').innerText = currentEvent.currency;
    updatePayerList();
    calculateAll();
}

// GASTOS
function openExpenseModal(index = null) {
    editingIndex = index;
    const modal = document.getElementById('expense-modal');
    modal.classList.remove('hidden');
    
    const partDiv = document.getElementById('exp-participants');
    partDiv.innerHTML = currentEvent.friends.map(f => `
        <label class="participant-item">
            <input type="checkbox" name="p-check" value="${f}" checked>
            <span>${f}</span>
        </label>
    `).join('');

    if (index !== null) {
        const exp = currentEvent.expenses[index];
        document.getElementById('exp-title').value = exp.title;
        document.getElementById('exp-amount').value = exp.amount;
        document.getElementById('exp-payer').value = exp.payer;
        document.querySelectorAll('input[name="p-check"]').forEach(c => c.checked = exp.participants.includes(c.value));
    } else {
        document.getElementById('exp-title').value = "";
        document.getElementById('exp-amount').value = "";
    }
}

function closeExpenseModal() {
    document.getElementById('expense-modal').classList.add('hidden');
}

function toggleAllFriends(val) {
    document.querySelectorAll('input[name="p-check"]').forEach(c => c.checked = val);
}

function saveExpense() {
    const title = document.getElementById('exp-title').value;
    const amount = parseFloat(document.getElementById('exp-amount').value);
    const payer = document.getElementById('exp-payer').value;
    const participants = Array.from(document.querySelectorAll('input[name="p-check"]:checked')).map(c => c.value);

    if (!title || isNaN(amount) || participants.length === 0) return alert("Datos incompletos");

    const exp = { title, amount, payer, participants };
    if (editingIndex !== null) currentEvent.expenses[editingIndex] = exp;
    else currentEvent.expenses.push(exp);

    const idx = allEvents.findIndex(e => e.id === currentEvent.id);
    allEvents[idx] = currentEvent;
    saveToLocal();
    calculateAll();
    closeExpenseModal();
}

// CÁLCULOS Y RENDER
function calculateAll() {
    let balances = {};
    currentEvent.friends.forEach(f => balances[f] = 0);

    currentEvent.expenses.forEach(e => {
        balances[e.payer] += e.amount;
        const share = e.amount / e.participants.length;
        e.participants.forEach(p => balances[p] -= share);
    });

    renderUI(balances);
}

function renderUI(balances) {
    // Gastos
    document.getElementById('expenses-list').innerHTML = currentEvent.expenses.map((e, i) => `
        <div class="expense-card" onclick="openExpenseModal(${i})">
            <div><strong>${e.title}</strong><br><small>Pagó ${e.payer}</small></div>
            <div>${currentEvent.currency}${e.amount.toFixed(2)}</div>
        </div>
    `).join('') || '<p style="text-align:center; opacity:0.5; margin-top:20px;">No hay gastos aún</p>';

    // Saldos
    document.getElementById('balances-list').innerHTML = currentEvent.friends.map(f => `
        <div class="balance-item">
            <span>${f}</span>
            <span class="${balances[f] >= 0 ? 'positive' : 'negative'}">
                ${balances[f] >= 0 ? '+' : ''}${balances[f].toFixed(2)}
            </span>
        </div>
    `).join('');

    // Deudas
    let html = "";
    let d = [], c = [];
    for(let f in balances) {
        if(balances[f] < -0.01) d.push({n:f, a:Math.abs(balances[f])});
        if(balances[f] > 0.01) c.push({n:f, a:balances[f]});
    }
    d.forEach(deb => {
        c.forEach(cre => {
            if(deb.a > 0 && cre.a > 0) {
                let m = Math.min(deb.a, cre.a);
                html += `<div class="card">💸 <b>${deb.n}</b> le paga <b>${m.toFixed(2)} ${currentEvent.currency}</b> a <b>${cre.n}</b></div>`;
                deb.a -= m; cre.a -= m;
            }
        });
    });
    document.getElementById('settlements-list').innerHTML = html || '<p style="text-align:center;">¡Están a mano!</p>';
}

// COMPARTIR LINK EDITABLE
function shareEventLink() {
    const dataString = btoa(JSON.stringify(currentEvent));
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${dataString}`;
    
    if (navigator.share) {
        navigator.share({ title: currentEvent.title, url: shareUrl });
    } else {
        navigator.clipboard.writeText(shareUrl);
        alert("Link editable copiado al portapapeles.");
    }
}

function updatePayerList() {
    document.getElementById('exp-payer').innerHTML = currentEvent.friends.map(f => `<option value="${f}">${f}</option>`).join('');
}

function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
}
