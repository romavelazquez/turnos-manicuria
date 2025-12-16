// ===== CONFIG =====
const adminPass = "admin123";
const telManicurista = "541158428854";

const horasBase = ["9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];

const duraciones = {
  tradicional: 60,
  semi: 60,
  belleza_pies: 60,
  kapping: 60,
  poligel: 90,
  manos_pies: 120,
  softgel: 90
};

// ===== ELEMENTOS =====
const fecha = document.getElementById("fecha");
const servicio = document.getElementById("servicio");
const hora = document.getElementById("hora");
const formTurno = document.getElementById("formTurno");
const nombre = document.getElementById("nombre");
const telefono = document.getElementById("telefono");

const adminPanel = document.getElementById("adminPanel");
const adminFechaBloqueo = document.getElementById("adminFechaBloqueo");
const horariosBloqueo = document.getElementById("horariosBloqueo");
const listaTurnosAdmin = document.getElementById("listaTurnosAdmin");

const calendarioAdmin = document.getElementById("calendarioAdmin");
const mesSelect = document.getElementById("mesSelect");
const anioSelect = document.getElementById("anioSelect");

// ===== ADMIN LOGIN =====
document.getElementById("btnAdmin").onclick = () => {
  const pass = prompt("Contraseña administradora");
  if(pass === adminPass){
    adminPanel.style.display = "block";
    cargarMesesAnios();
    cargarCalendario();
  } else {
    alert("Contraseña incorrecta");
  }
};

function cerrarSesionAdmin(){
  adminPanel.style.display = "none";
}

// ===== LIMPIAR =====
function limpiarTodo(){
  if(confirm("Eliminar TODOS los turnos y bloqueos?")){
    localStorage.clear();
    location.reload();
  }
}

// ===== BLOQUEOS =====
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

// ===== CALENDARIO ADMIN =====
function cargarMesesAnios(){
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  mesSelect.innerHTML = "";
  meses.forEach((m,i)=>{
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m;
    mesSelect.appendChild(opt);
  });

  const anioActual = new Date().getFullYear();
  anioSelect.innerHTML = "";
  for(let a = anioActual; a <= anioActual + 2; a++){
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    anioSelect.appendChild(opt);
  }

  mesSelect.value = new Date().getMonth();
  anioSelect.value = anioActual;
}

function cargarCalendario(){
  calendarioAdmin.innerHTML = "";
  const mes = parseInt(mesSelect.value);
  const anio = parseInt(anioSelect.value);
  const diasMes = new Date(anio, mes+1, 0).getDate();
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];

  for(let d=1; d<=diasMes; d++){
    const fechaISO = `${anio}-${(mes+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
    const diaDiv = document.createElement("div");
    diaDiv.className = "dia-calendario";
    const tieneTurno = turnos.some(t=>t.fecha === fechaISO);
    if(tieneTurno) diaDiv.classList.add("turno");

    diaDiv.textContent = d;
    diaDiv.onclick = () => mostrarTurnosPorDia(fechaISO);
    calendarioAdmin.appendChild(diaDiv);
  }
}

function mostrarTurnosPorDia(fecha){
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  listaTurnosAdmin.innerHTML = `<h4>Turnos del ${fecha}</h4>`;

  const turnosDia = turnos.filter(t => t.fecha === fecha);
  if(turnosDia.length === 0){
    listaTurnosAdmin.innerHTML += "<p>No hay turnos asignados</p>";
    return;
  }

  turnosDia.forEach((t,i)=>{
    const div = document.createElement("div");
    div.className = "turno-admin";
    div.innerHTML = `<strong>${t.hora}</strong> - ${t.nombre} - ${t.servicio} 
                     <button onclick="cancelarTurno('${fecha}', ${i})">Cancelar</button>`;
    listaTurnosAdmin.appendChild(div);
  });
}

function cancelarTurno(fecha, index){
  let turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  const turnosDia = turnos.filter(t=>t.fecha === fecha);

  if(confirm("Cancelar turno?")){
    const idxGlobal = turnos.findIndex(t => t === turnosDia[index]);
    if(idxGlobal > -1){
      turnos.splice(idxGlobal,1);
      localStorage.setItem("turnos", JSON.stringify(turnos));
      cargarCalendario();
      mostrarTurnosPorDia(fecha);
    }
  }
}

// ===== CLIENTA =====
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

// ===== RESERVA =====
formTurno.onsubmit = e =>{
  e.preventDefault();

  const turno = {
    nombre: nombre.value,
    telefono: telefono.value,
    fecha: fecha.value,
    servicio: servicio.value,
    hora: hora.value
  };

  const confirmacion = confirm(`Confirma el turno:\n\nCliente: ${turno.nombre}\nFecha: ${turno.fecha}\nHora: ${turno.hora}\nServicio: ${turno.servicio}`);
  if(!confirmacion) return;

  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  turnos.push(turno);
  localStorage.setItem("turnos", JSON.stringify(turnos));

  alert("Turno reservado con éxito");
  cargarCalendario();
  formTurno.reset();
};
