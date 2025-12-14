const adminPassword = "admin123";
const numeroManicurista = "+541158428854";

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

// Acceso administrador
document.getElementById("adminButton").addEventListener("click", function() {
    const password = prompt("Ingrese la contraseña de administrador:");
    if(password === adminPassword){
        document.getElementById("adminPanel").style.display = "block";
        mostrarAgenda();
    } else {
        alert("Contraseña incorrecta");
    }
});

// Limpiar turnos
function limpiarTurnos() {
    if(confirm("¿Desea eliminar todos los turnos?")){
        localStorage.removeItem("turnos");
        alert("Todos los turnos eliminados");
        location.reload();
    }
}

// Cargar horarios disponibles según fecha
function cargarHorariosDisponibles() {
    const fecha = document.getElementById("fecha").value;
    if(!fecha) return;

    const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    const servicioSeleccionado = document.getElementById("servicio").value;
    const duracion = serviciosDuracion[servicioSeleccionado];

    let horariosDisponibles = [];

    for(let i=0; i<horasBase.length; i++){
        const hora = horasBase[i];
        let ocupado = false;
        for(const t of turnos){
            if(t.fecha === fecha){
                const tIndex = horasBase.indexOf(t.hora);
                const tDur = Math.ceil(serviciosDuracion[t.servicio]/60);
                if(i >= tIndex && i < tIndex + tDur){
                    ocupado = true;
                    break;
                }
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
document.getElementById("fecha").addEventListener("change", cargarHorariosDisponibles);

// Formulario reserva
document.getElementById("turnoForm").addEventListener("submit", function(event){
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const servicio = document.getElementById("servicio").value;
    const hora = document.getElementById("hora").value;
    const fecha = document.getElementById("fecha").value;

    if(!nombre || !telefono || !servicio || !hora || !fecha){
        alert("Complete todos los campos");
        return;
    }

    const reservaTemp = { nombre, telefono, servicio, hora, fecha };
    localStorage.setItem("reservaTemp", JSON.stringify(reservaTemp));

    document.getElementById("popupDetails").innerHTML =
        `Nombre: ${nombre}<br>Tel: ${telefono}<br>Servicio: ${servicio}<br>Fecha: ${fecha}<br>Hora: ${hora}`;
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
    const telefonoCliente = "+54" + reserva.telefono;

    const mensajeCliente = `Hola ${reserva.nombre}, tu turno de ${reserva.servicio} ha sido confirmado el ${reserva.fecha} a las ${reserva.hora}.`;
    const mensajeManicurista = `Nuevo turno:\nCliente: ${reserva.nombre}\nTel: ${reserva.telefono}\nServicio: ${reserva.servicio}\nFecha: ${reserva.fecha}\nHora: ${reserva.hora}`;

    const urlCliente = `https://wa.me/${telefonoCliente.replace('+','')}?text=${encodeURIComponent(mensajeCliente)}`;
    const urlManicurista = `https://wa.me/${numeroManicurista.replace('+','')}?text=${encodeURIComponent(mensajeManicurista)}`;

    window.open(urlCliente, "_blank");
    window.open(urlManicurista, "_blank");
}

// Mostrar agenda diaria por fecha
function mostrarAgenda(){
    const fecha = prompt("Ingrese fecha para ver agenda (YYYY-MM-DD):");
    const agendaDiv = document.getElementById("agendaDiaria");
    const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    agendaDiv.innerHTML = "";

    const turnosDelDia = turnos.filter(t => t.fecha === fecha);

    if(turnosDelDia.length === 0){
        agendaDiv.innerHTML = "<p>No hay turnos programados ese día.</p>";
        return;
    }

    turnosDelDia.forEach((t,index)=>{
        const turnoDiv = document.createElement("div");
        turnoDiv.className = "turnoItem";
        turnoDiv.innerHTML = `Hora: ${t.hora} | Cliente: ${t.nombre} | Servicio: ${t.servicio} | Tel: ${t.telefono} 
        <button onclick="modificarTurno('${t.fecha}', ${index})">Modificar</button>`;
        agendaDiv.appendChild(turnoDiv);
    });
}

// Modificar turno
function modificarTurno(fecha, index){
    const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    const turnosDelDia = turnos.filter(t => t.fecha === fecha);
    const t = turnosDelDia[index];

    const nuevaHora = prompt(`Modificar horario del turno de ${t.nombre} (actual: ${t.hora})`, t.hora);
    if(nuevaHora && horasBase.includes(nuevaHora)){
        // Actualizar hora en el array original
        const idx = turnos.findIndex(item => item.nombre === t.nombre && item.fecha === t.fecha && item.hora === t.hora);
        turnos[idx].hora = nuevaHora;
        localStorage.setItem("turnos", JSON.stringify(turnos));
        mostrarAgenda();
        cargarHorariosDisponibles();
    } else if(nuevaHora === ""){
        if(confirm("Desea eliminar este turno?")){
            const idx = turnos.findIndex(item => item.nombre === t.nombre && item.fecha === t.fecha && item.hora === t.hora);
            turnos.splice(idx,1);
            localStorage.setItem("turnos", JSON.stringify(turnos));
            mostrarAgenda();
            cargarHorariosDisponibles();
        }
    } else {
        alert("Horario no válido");
    }
}
