const adminPass = "admin123";
const telManicurista = "541158428854";

const horasBase = [
  "9:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00"
];

const duraciones = {
  tradicional: 60,
  semi: 60,
  belleza_pies: 60,
  poligel: 90,
  softgel: 90
};

// ================= ADMIN LOGIN =================
document.getElementById("btnAdmin").onclick = () => {
  const pass = prompt("Contraseña administrador");
  if(pass === adminPass){
    document.getElementById("adminPanel").style.display = "block";
  } else alert("Contraseña incorrecta");
};

function cerrarSesionAdmin(){
  document.getElementById("adminPanel").style.display = "none";
}

// ================= LIMPIAR =================
function limpiarTodo(){
  if(confirm("Eliminar TODOS los turnos y bloqueos?")){
    localStorage.clear();
    location.reload();
  }
}

// ================= BLOQUEOS =================
adminFechaBloqueo.addEventListener("change", mostrarHorariosBloqueo);

function mostrarHorariosBloqueo(){
  const fecha = adminFechaBloqueo.value;
  const bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  horariosBloqueo.innerHTML = "";

  if(!fecha){
    horariosBloqueo.innerHTML = "<p>Seleccione una fecha</p>";
    return;
  }

  horasBase.forEach(h=>{
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.value = h;
    chk.checked = bloqueos[fecha]?.includes(h) || false;
    horariosBloqueo.append(chk, document.createTextNode(" "+h), document.createElement("br"));
  });
}

function guardarBloqueos(){
  const fecha = adminFechaBloqueo.value;
  if(!fecha) return alert("Seleccione una fecha");

  const checks = horariosBloqueo.querySelectorAll("input");
  let bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  bloqueos[fecha] = [];

  checks.forEach(c=>{ if(c.checked) bloqueos[fecha].push(c.value); });
  localStorage.setItem("bloqueos", JSON.stringify(bloqueos));

  alert("Bloqueos guardados");
}

// ================= TURNOS ADMIN =================
adminFechaTurnos.addEventListener("change", mostrarTurnosAdmin);

function mostrarTurnosAdmin(){
  const fecha = adminFechaTurnos.value;
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  listaTurnosAdmin.innerHTML = "";

  if(!fecha){
    listaTurnosAdmin.innerHTML = "<p>Seleccione una fecha</p>";
    return;
  }

  const turnosDia = turnos.filter(t=>t.fecha === fecha);

  if(turnosDia.length === 0){
    listaTurnosAdmin.innerHTML = "<p>No hay turnos asignados</p>";
    return;
  }

  turnosDia.forEach((t,i)=>{
    const div = document.createElement("div");
    div.className = "turno-admin";
    div.innerHTML = `
      <strong>${t.hora}</strong><br>
      ${t.nombre}<br>
      Servicio: ${t.servicio}
      <button onclick="cancelarTurno(${i})">Cancelar</button>
    `;
    listaTurnosAdmin.appendChild(div);
  });
}

function cancelarTurno(index){
  let turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  if(confirm("Cancelar turno?")){
    turnos.splice(index,1);
    localStorage.setItem("turnos", JSON.stringify(turnos));
    mostrarTurnosAdmin();
  }
}

// ================= CLIENTA =================
fecha.addEventListener("change", cargarHorarios);
servicio.addEventListener("change", cargarHorarios);

function cargarHorarios(){
  const f = fecha.value;
  const s = servicio.value;
  hora.innerHTML = '<option value="">Seleccionar horario</option>';
  if(!f || !s) return;

  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  const bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  const dur = duraciones[s] / 60;

  for(let i=0;i<horasBase.length;i++){
    let libre = true;

    if(bloqueos[f]?.includes(horasBase[i])) libre = false;

    turnos.forEach(t=>{
      if(t.fecha === f){
        const idx = horasBase.indexOf(t.hora);
        const d = duraciones[t.servicio] / 60;
        if(i >= idx && i < idx + d) libre = false;
      }
    });

    if(i + dur > horasBase.length) libre = false;

    if(libre) hora.add(new Option(horasBase[i], horasBase[i]));
  }

  if(hora.options.length === 1){
    hora.add(new Option("No hay horarios disponibles",""));
  }
}

// ================= RESERVA + WHATSAPP =================
formTurno.onsubmit = e =>{
  e.preventDefault();

  const turno = {
    nombre: nombre.value,
    telefono: telefono.value,
    fecha: fecha.value,
    servicio: servicio.value,
    hora: hora.value
  };

  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  turnos.push(turno);
  localStorage.setItem("turnos", JSON.stringify(turnos));

  enviarWhatsApp(turno);

  alert("Turno reservado");
  e.target.reset();
};

function enviarWhatsApp(turno){
  const telCliente = "54" + turno.telefono;

  const msgCliente =
`Hola ${turno.nombre} 😊
Tu turno fue reservado:

📅 ${turno.fecha}
⏰ ${turno.hora}
💅 ${turno.servicio}`;

  const msgAdmin =
`📌 Nuevo turno
Cliente: ${turno.nombre}
Tel: ${turno.telefono}
Fecha: ${turno.fecha}
Hora: ${turno.hora}
Servicio: ${turno.servicio}`;

  window.open(`https://wa.me/${telCliente}?text=${encodeURIComponent(msgCliente)}`, "_blank");
  window.open(`https://wa.me/${telManicurista}?text=${encodeURIComponent(msgAdmin)}`, "_blank");
}
