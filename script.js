// ---------------- CONSTANTES ----------------
const MANICURISTA_TEL = "5491158428854"; // Teléfono de la manicurista (Argentina)
const CLAVE_ADMIN = "admin123"; // Clave para ingresar al panel admin

// Duración de los servicios (minutos)
const servicios = {
    semi: 60,
    pies: 60,
    tradicional: 60,
    poligel: 90,
    softgel: 90
};

// ---------------- VARIABLES ----------------
let turnosReservados = JSON.parse(localStorage.getItem("turnos")) || [];
let adminLogueado = false;

// ---------------- UTILIDADES ----------------
function convertirAMinutos(hora) {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}

function convertirAHora(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`;
}

// ---------------- ADMIN ----------------
function loginAdmin() {
    const clave = document.getElementById("claveAdmin").value;
    if(clave === CLAVE_ADMIN) {
        adminLogueado = true;
        document.getElementById("loginAdmin").style.display = "none";
        document.getElementById("panelAdmin").style.display = "block";
    } else {
        alert("Clave incorrecta");
    }
}

function cerrarSesion() {
    adminLogueado = false;
    document.getElementById("panelAdmin").style.display = "none";
    document.getElementById("loginAdmin").style.display = "block";
}

function mostrarAgendaAdmin() {
    const fecha = document.getElementById("fechaAgendaAdmin").value;
    const ul = document.getElementById("agendaAdmin");
    ul.innerHTML = "";

    if(!fecha) return;

    const turnosDelDia = turnosReservados
        .filter(t => t.fecha === fecha)
        .sort((a,b)=>a.inicio-b.inicio);

    if(turnosDelDia.length===0){
        ul.innerHTML="<li>Sin turnos</li>";
        return;
    }

    turnosDelDia.forEach((t,i)=>{
        const li=document.createElement("li");
        li.innerHTML = `${convertirAHora(t.inicio)} - ${t.nombre} (${t.servicio}) 📞 ${t.telefono} 
        <button onclick="eliminarTurno(${i})">❌</button>`;
        ul.appendChild(li);
    });
}

function eliminarTurno(i){
    turnosReservados.splice(i,1);
    localStorage.setItem("turnos", JSON.stringify(turnosReservados));
    mostrarAgendaAdmin();
}

function borrarTodosLosTurnos(){
    if(confirm("¿Borrar TODOS los turnos?")){
        turnosReservados=[];
        localStorage.removeItem("turnos");
        alert("Agenda limpia");
        mostrarAgendaAdmin();
    }
}

// ---------------- HORARIOS DISPONIBLES ----------------
function cargarHorariosDisponibles() {
    const fecha = document.getElementById("fecha").value;
    const select = document.getElementById("hora");
    select.innerHTML = "";

    if(!fecha) return;

    for(let min=9*60; min<=16*60; min+=30){
        const ocupado = turnosReservados.some(t=> t.fecha===fecha && min >= t.inicio && min < t.fin);
        if(!ocupado){
            const opt = document.createElement("option");
            opt.value = convertirAHora(min);
            opt.textContent = convertirAHora(min);
            select.appendChild(opt);
        }
    }
}

// ---------------- RESERVA CON POPUP ----------------
function confirmarReserva() {
    const nombre = document.getElementById("nombre").value.trim();
    const telefono = document.getElementById("telefono").value.trim();
    const fecha = document.getElementById("fecha").value;
    const hora = document.getElementById("hora").value;
    const servicio = document.getElementById("servicio").value;

    if (!nombre || !telefono || !fecha || !hora || !servicio) {
        alert("Completá todos los campos");
        return;
    }

    const duracion = servicios[servicio];
    const inicio = convertirAMinutos(hora);
    const fin = inicio + duracion;

    if (fin > 17 * 60) {
        alert("El servicio no entra en el horario laboral");
        return;
    }

    const solapa = turnosReservados.some(t => t.fecha === fecha && inicio < t.fin && fin > t.inicio);
    if (solapa) {
        alert("Horario no disponible");
        return;
    }

    // ------------------ POPUP DE CONFIRMACIÓN ------------------
    const mensaje = `Vas a reservar un turno 💅\n\n` +
                    `Nombre: ${nombre}\n` +
                    `Teléfono: ${telefono}\n` +
                    `Fecha: ${fecha}\n` +
                    `Hora: ${hora}\n` +
                    `Servicio: ${servicio}\n\n` +
                    `Confirmás la reserva y pagás el 50%?`;

    const confirmado = confirm(mensaje);

    if (!confirmado) {
        alert("Modificá la fecha, hora o servicio antes de confirmar.");
        return;
    }

    // ------------------ CREAR EL TURNO ------------------
    const turno = { nombre, telefono, fecha, inicio, fin, servicio };
    turnosReservados.push(turno);
    localStorage.setItem("turnos", JSON.stringify(turnosReservados));

    // ------------------ ENVIAR WHATSAPP ------------------
    enviarConfirmacion(turno);

    alert("✅ Turno reservado correctamente");

    // Actualizar horarios y agenda
    cargarHorariosDisponibles();
    mostrarAgenda();
}

// ---------------- ENVIAR WHATSAPP ----------------
function enviarConfirmacion(turno){
    const msgClienta = `Hola ${turno.nombre} 💅
Tu turno quedó CONFIRMADO ✅
📅 Fecha: ${turno.fecha}
🕘 Hora: ${convertirAHora(turno.inicio)}
💅 Servicio: ${turno.servicio}
Gracias por tu seña 💖`;

    const msgManicurista = `Nuevo turno confirmado 💅
👩 Clienta: ${turno.nombre}
📞 Tel: ${turno.telefono}
📅 ${turno.fecha}
🕘 ${convertirAHora(turno.inicio)}
💅 ${turno.servicio}`;

    window.open(`https://wa.me/${turno.telefono}?text=${encodeURIComponent(msgClienta)}`, "_blank");
    window.open(`https://wa.me/${MANICURISTA_TEL}?text=${encodeURIComponent(msgManicurista)}`, "_blank");
}

// ---------------- CANCELAR ----------------
function cancelarTurno(){
    const tel = document.getElementById("telefonoCancelar").value.trim();
    const index = turnosReservados.findIndex(t=> t.telefono===tel);

    if(index===-1){
        alert("Turno no encontrado");
        return;
    }

    const turno = turnosReservados[index];

    if(!confirm("¿Cancelar este turno?")) return;

    turnosReservados.splice(index,1);
    localStorage.setItem("turnos", JSON.stringify(turnosReservados));

    enviarCancelacion(turno);
    alert("Turno cancelado");
    cargarHorariosDisponibles();
    mostrarAgenda();
}

function enviarCancelacion(turno){
    const msgClienta = `Hola ${turno.nombre} ❌
Tu turno del ${turno.fecha} a las ${convertirAHora(turno.inicio)} fue CANCELADO.
Cualquier consulta, escribinos 💖`;

    const msgManicurista = `Turno cancelado ❌
👩 Clienta: ${turno.nombre}
📞 Tel: ${turno.telefono}
📅 ${turno.fecha}
🕘 ${convertirAHora(turno.inicio)}`;

    window.open(`https://wa.me/${turno.telefono}?text=${encodeURIComponent(msgClienta)}`, "_blank");
    window.open(`https://wa.me/${MANICURISTA_TEL}?text=${encodeURIComponent(msgManicurista)}`, "_blank");
}

// ---------------- AGENDA DIARIA ----------------
function mostrarAgenda(){
    const fecha = document.getElementById("fechaAgenda").value;
    const ul = document.getElementById("agenda");
    ul.innerHTML = "";

    if(!fecha) return;

    const turnosDelDia = turnosReservados
        .filter(t=> t.fecha===fecha)
        .sort((a,b)=> a.inicio-b.inicio);

    if(turnosDelDia.length===0){
        ul.innerHTML="<li>Sin turnos para este día</li>";
        return;
    }

    turnosDelDia.forEach(t=>{
        const li = document.createElement("li");
        li.textContent = `${convertirAHora(t.inicio)} - ${t.nombre} (${t.servicio}) 📞 ${t.telefono}`;
        ul.appendChild(li);
    });
}
