const adminPass = "admin123";

const horasBase = [
  "9:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00"
];

const duraciones = {
  tradicional: 60,
  semi: 60,
  poligel: 90,
  softgel: 90
};

// ================= ADMIN LOGIN =================
document.getElementById("btnAdmin").onclick = () => {
  const pass = prompt("Contraseña administrador");
  if(pass === adminPass){
    document.getElementById("adminPanel").style.display = "block";
  } else {
    alert("Contraseña incorrecta");
  }
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
document.getElementById("adminFechaBloqueo")
  .addEventListener("change", mostrarHorariosBloqueo);

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

    horariosBloqueo.append(chk, document.createTextNode(" "+h));
    horariosBloqueo.append(document.createElement("br"));
  });
}

function guardarBloqueos(){
  const fecha = adminFechaBloqueo.value;
  if(!fecha){
    alert("Seleccione una fecha");
    return;
  }

  const checks = horariosBloqueo.querySelectorAll("input");
  let bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  bloqueos[fecha] = [];

  checks.forEach(c=>{
    if(c.checked) bloqueos[fecha].push(c.value);
  });

  localStorage.setItem("bloqueos", JSON.stringify(bloqueos));
  alert("Horarios bloqueados guardados");
}

// ================= TURNOS ADMIN =================
document.getElementById("adminFechaTurnos")
  .addEventListener("change", mostrarTurnosAdmin);

function mostrarTurnosAdmin(){
  const fecha = adminFechaTurnos.value;
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  listaTurnosAdmin.innerHTML = "";

  if(!fecha){
    listaTurnosAdmin.innerHTML = "<p>Seleccione una fecha</p>";
    return;
  }

  const turnosDia = turnos.filter(t => t.fecha === fecha);

  if(turnosDia.length === 0){
    listaTurnosAdmin.innerHTML = "<p>No hay turnos asignados para este día.</p>";
    return;
  }

  turnosDia.forEach((t,index)=>{
    const div = document.createElement("div");
    div.className = "turno-admin";
    div.innerHTML = `
      <strong>${t.hora}</strong><br>
      Cliente: ${t.nombre}<br>
      Servicio: ${t.servicio}
      <button onclick="cancelarTurno(${index})">Cancelar</button>
    `;
    listaTurnosAdmin.appendChild(div);
  });
}

function cancelarTurno(index){
  let turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  if(confirm("Cancelar este turno?")){
    turnos.splice(index,1);
    localStorage.setItem("turnos", JSON.stringify(turnos));
    mostrarTurnosAdmin();
  }
}

// ================= CLIENTA =================
document.getElementById("fecha").addEventListener("change", cargarHorarios);
document.getElementById("servicio").addEventListener("change", cargarHorarios);

function cargarHorarios(){
  const fecha = document.getElementById("fecha").value;
  const servicio = document.getElementById("servicio").value;
  const selectHora = document.getElementById("hora");

  selectHora.innerHTML = '<option value="">Seleccionar horario</option>';

  if(fecha === "" || servicio === "") return;

  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  const bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  const dur = duraciones[servicio] / 60;

  for(let i=0;i<horasBase.length;i++){
    let libre = true;

    if(bloqueos[fecha]?.includes(horasBase[i])) libre = false;

    turnos.forEach(t=>{
      if(t.fecha === fecha){
        const idx = horasBase.indexOf(t.hora);
        const d = duraciones[t.servicio] / 60;
        if(i >= idx && i < idx + d) libre = false;
      }
    });

    if(i + dur > horasBase.length) libre = false;

    if(libre){
      selectHora.add(new Option(horasBase[i], horasBase[i]));
    }
  }

  if(selectHora.options.length === 1){
    selectHora.add(new Option("No hay horarios disponibles",""));
  }
}

// ================= RESERVAR =================
document.getElementById("formTurno").onsubmit = e =>{
  e.preventDefault();

  const turno = {
    nombre: nombre.value,
    telefono: telefono.value,
    fecha: fecha.value,
    servicio: servicio.value,
    hora: hora.value
  };

  let turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  turnos.push(turno);
  localStorage.setItem("turnos", JSON.stringify(turnos));

  alert("Turno reservado correctamente");
  e.target.reset();
};
