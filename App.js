 let projectors = JSON.parse(localStorage.getItem('epson_projectors') || '[]');

function log(msg) {
    const box = document.getElementById('consoleLog');
    box.innerHTML += `[${new Date().toLocaleTimeString()}] ${msg}<br>`;
    box.scrollTop = box.scrollHeight;
}

function playBeep(pitch = 587.33) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = pitch;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
}

function renderProjectors() {
    const list = document.getElementById('projectorList');
    if (projectors.length === 0) {
        list.innerHTML = '<div class="empty-state">No projectors added yet. Tap "+ Add Projector IP" to start.</div>';
        return;
    }

    list.innerHTML = projectors.map((p, index) => `
        <div class="device-item">
            <div class="device-info">
                <h3>${p.name}</h3>
                <p>IP: ${p.ip} | Port: 3629 / HTTP</p>
            </div>
            <div class="actions">
                <button class="secondary-btn" onclick="sendEpsonCmd('${p.ip}', 'MUTE+ON')">Blackout</button>
                <button class="success-btn" onclick="sendEpsonCmd('${p.ip}', 'PWR+ON')">On</button>
                <button class="danger-btn" onclick="sendEpsonCmd('${p.ip}', 'PWR+OFF')">Off</button>
                <button class="secondary-btn" onclick="customPrompt('${p.ip}')">Custom Cmd</button>
                <button class="danger-btn" onclick="removeProjector(${index})" style="padding: 0.5rem 0.6rem;">X</button>
            </div>
        </div>
    `).join('');
}

function addProjector() {
    const ip = prompt("Enter Epson Projector IP Address (e.g. 192.168.1.45):");
    if (!ip) return;
    const name = prompt("Enter Projector Name / Room:", "Classroom Projector") || "Projector";
    projectors.push({ ip, name });
    localStorage.setItem('epson_projectors', JSON.stringify(projectors));
    renderProjectors();
    log(`Added projector: ${name} (${ip})`);
}

function removeProjector(index) {
    log(`Removed projector: ${projectors[index].name}`);
    projectors.splice(index, 1);
    localStorage.setItem('epson_projectors', JSON.stringify(projectors));
    renderProjectors();
}

// Sends command via Epson Web API endpoint (/api/v01/control/escvp21)
function sendEpsonCmd(ip, cmd) {
    playBeep(700);
    log(`Sending command [${cmd}] to Epson projector at ${ip}...`);

    // Epson Web API format: http://<ip>/api/v01/control/escvp21?cmd=<COMMAND>
    const url = `http://${ip}/api/v01/control/escvp21?cmd=${cmd}`;

    fetch(url, { method: 'GET', mode: 'no-cors' })
        .then(() => {
            log(`[Dispatched] Command ${cmd} sent successfully to ${ip}`);
        })
        .catch((err) => {
            log(`[Network Error] Could not reach ${ip}. Check Wi-Fi connection.`);
        });
}

function customPrompt(ip) {
    const cmd = prompt("Enter ESC/VP21 command (e.g. SOURCE+11, CMODE+1A, ONSCREEN+00):");
    if (cmd) {
        sendEpsonCmd(ip, cmd.toUpperCase());
    }
}

function broadcastCommand(cmd) {
    if (projectors.length === 0) {
        alert("Add a projector first!");
        return;
    }
    playBeep(880);
    log(`Broadcasting command [${cmd}] to all configured projectors...`);
    projectors.forEach(p => {
        sendEpsonCmd(p.ip, cmd);
    });
}

renderProjectors();
