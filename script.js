// Contraseña administrador
const adminPassword = "admin123";

// Botón acceso administrador
document.getElementById("adminButton").addEventListener("click", function() {
    const password = prompt("Ingrese la contraseña de administrador:");
    if(password === adminPassword){
        document.getElementById("adminPanel").style.display = "block";
        alert("Acceso administrador concedido");
    } else {
        alert("Contraseña incorrecta");
    }
});

// Limpiar todos los turnos
function limpiarTurnos() {
    if(confirm("¿Estás seguro que deseas eliminar todos los turnos?")){
        localStorage.removeItem("turnos");
        alert("Todos los turnos han sido eliminados");
        location.reload();
    }
}

// Cargar horarios disponibles
function cargarHorariosDisponibles() {
    const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    const horariosDisponibles = [];
    const horas = ["9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
    
    horas.forEach(hora => {
        if (!turnos.some(turno => turno.hora === hora)) {
            horariosDisponibles.push(hora);
        }
    });

    const selectHora = document.getElementById("hora");
    selectHora.innerHTML = "";
    horariosDisponibles.forEach(hora => {
        const option = document.createElement("option");
        option.value = hora;
        option.textContent = hora;
        selectHora.appendChild(option);
    });
}

window.onload = cargarHorariosDisponibles;

// Manejar reserva
document.getElementById("turnoForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const telefono = document.getElementById("telefono").value;
    const servicio = document.getElementById("servicio").value;
    const hora = document.getElementById("hora").value;

    if (!nombre || !telefono || !servicio || !hora) {
        alert("Por favor complete todos los campos.");
        return;
    }

    const reservaTemp = { nombre, telefono, servicio, hora };
    localStorage.setItem("reservaTemp", JSON.stringify(reservaTemp));

    const detalles = `Nombre: ${nombre}<br>Teléfono: ${telefono}<br>Servicio: ${servicio}<br>Hora: ${hora}`;
    document.getElementById("popupDetails").innerHTML = detalles;
    document.getElementById("popup").style.display = "block";
});

// Confirmar reserva
function confirmarReserva() {
    const reservaTemp = JSON.parse(localStorage.getItem("reservaTemp"));
    if (reservaTemp) {
        const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
        turnos.push(reservaTemp);
        localStorage.setItem("turnos", JSON.stringify(turnos));
        alert("Reserva confirmada!");
        location.reload();
    }
    document.getElementById("popup").style.display = "none";
}

// Cancelar reserva
function cancelarReserva() {
    localStorage.removeItem("reservaTemp");
    document.getElementById("popup").style.display = "none";
}
