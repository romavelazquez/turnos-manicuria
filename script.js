// Configuración
const adminPassword = "admin123";
const numeroManicurista = "+541158428854"; // WhatsApp manicurista

// Duraciones en minutos
const serviciosDuracion = {
    semiDuracion: 60,
    bellezaPies: 60,
    tradicional: 45,
    poligel: 90,
    softgel: 90
};

// Horarios base
const horasBase = ["9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];

// Administrador
document.getElementById("adminButton").addEventListener("click", function() {
    const password = prompt("Ingrese la contraseña de administrador:");
    if(password === adminPassword){
        document.getElementById("adminPanel").style.display = "block";
        mostrarAgenda();
    } else {
        alert("Contraseña incorrecta");
    }
});

// Limpiar todos los turnos
function limpiarTurnos() {
    if(confirm("¿Desea eliminar todos los turnos?")){
        localStorage.removeItem("turnos");
        alert("Todos los turnos eliminados");
        location.reload();
    }
}

// Cargar horarios disponibles según turnos y duración
function cargarHorariosDisponibles() {
    const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    const servicioSeleccionado = document.getElementById("servicio").value;
    const duracion = serviciosDuracion[servicioSeleccionado];
    const slotsDuracion = Math.ceil(duracion/60);

    let horariosDisponibles = [];

    for(let i=0; i<horasBase.length; i++){
        const hora = horasBase[i];
        let ocupado = false;
        for(const t of turnos){
            const tIndex = horasBase.indexOf(t.hora);
            const tDur = Math.ceil(serviciosDuracion[t.servicio]/60);
            if(i >= tIndex && i < tIndex + tDur){
                ocupado = true;
                break;
            }
        }
        if(!ocupado){
            horariosDisponibles.push(hora);
        }
    }

    const selectHora = document.getElementById("hora");
    selectHora.innerHTML = "";
    horariosDisponibles.forEach(h => {
        const option = document.createElement("option");
        option.value = h;
        option.textContent = h;
        selectHora.appendChild(option);
    });
}

window.onload = cargarHorariosDisponibles;
document.getElementById("servicio").addEventListener("change", cargarHorariosDisponibles);

// Formulario reserva
document.getElementById("turnoForm").addEventListener("submit", function(event){
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const servicio = document.getElementById("servicio").value;
    const hora = document.getElementById("hora").value;

    if(!nombre || !telefono || !servicio || !hora){
        alert("Complete todos los campos");
        return;
    }

    const reservaTemp = { nombre, telefono, servicio, hora };
    localStorage.setItem("reservaTemp", JSON.stringify(reservaTemp));

    document.getElementById("popupDetails").innerHTML = 
        `Nombre: ${nombre}<br>Tel: ${telefono}<br>Servicio: ${servicio}<br>Hora: ${hora}`;
    document.getElementById("popup").style.display = "block";
});

// Confirmar reserva
function confirmarReserva(){
    const reservaTemp = JSON.parse(localStorage.getItem("reservaTemp"));
    if(reservaTemp){
        const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
        turnos.push(reservaTemp);
        localStorage.setItem("turnos", JSON.stringify(turnos));

        enviarWhatsApp(reservaTemp);

        alert("Reserva confirmada");
        location.reload();
    }
    document.getElementById("popup").style.display = "none";
}

// Cancelar reserva
function cancelarReserva(){
    localStorage.removeItem("reservaTemp");
    document.getElementById("popup").style.display = "none";
}

// WhatsApp
function enviarWhatsApp(reserva){
    const mensajeCliente = `Hola ${reserva.nombre}, tu turno de ${reserva.servicio} ha sido confirmado a las ${reserva.hora}.`;
    const mensajeManicurista = `Nuevo turno:\nCliente: ${reserva.nombre}\nTel: ${reserva.telefono}\nServicio: ${reserva.servicio}\nHora: ${reserva.hora}`;

    const urlCliente = `https://wa.me/${reserva.telefono.replace('+','')}?text=${encodeURIComponent(mensajeCliente)}`;
    const urlManicurista = `https://wa.me/${numeroManicurista.replace('+','')}?text=${encodeURIComponent(mensajeManicurista)}`;

    window.open(urlCliente, "_blank");
    window.open(urlManicurista, "_blank");
}

// Mostrar agenda diaria en admin
function mostrarAgenda(){
    const agendaDiv = document.getElementById("agendaDiaria");
    const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    agendaDiv.innerHTML = "";

    if(turnos.length === 0){
        agendaDiv.innerHTML = "<p>No hay turnos programados hoy.</p>";
        return;
    }

    turnos.forEach((t,index)=>{
        const turnoDiv = document.createElement("div");
        turnoDiv.className = "turnoItem";
        turnoDiv.innerHTML = `Hora: ${t.hora} | Cliente: ${t.nombre} | Servicio: ${t.servicio} | Tel: ${t.telefono} 
        <button onclick="modificarTurno(${index})">Modificar</button>`;
        agendaDiv.appendChild(turnoDiv);
    });
}

// Modificar turno
function modificarTurno(index){
    const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    const t = turnos[index];

    const nuevaHora = prompt(`Modificar horario del turno de ${t.nombre} (actual: ${t.hora})`, t.hora);
    if(nuevaHora && horasBase.includes(nuevaHora)){
        t.hora = nuevaHora;
        turnos[index] = t;
        localStorage.setItem("turnos", JSON.stringify(turnos));
        mostrarAgenda();
        cargarHorariosDisponibles();
    } else if(nuevaHora === ""){
        if(confirm("Desea eliminar este turno?")){
            turnos.splice(index,1);
            localStorage.setItem("turnos", JSON.stringify(turnos));
            mostrarAgenda();
            cargarHorariosDisponibles();
        }
    } else {
        alert("Horario no válido");
    }
}
