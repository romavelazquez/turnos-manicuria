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
const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ELEMENTOS
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

// ================= ADMIN LOGIN =================
document.getElementById("btnAdmin").onclick = () => {
  const pass = prompt("Contraseña administrador");
  if(pass === adminPass){
    adminPanel.style.display = "block";
    cargarSelectMesAnio();
    mostrarCalendarioAdmin();
  } else alert("Contraseña incorrecta");
};

function cerrarSesionAdmin(){
  adminPanel.style.display = "none";
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
  const f = adminFechaBloqueo.value;
  const bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  horariosBloqueo.innerHTML = "";
  if(!f){
    horariosBloqueo.innerHTML = "<p>Seleccione una fecha</p>";
    return;
  }
  horasBase.forEach(h=>{
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.value = h;
    chk.checked = bloqueos[f]?.includes(h) || false;
    horariosBloqueo.append(chk, document.createTextNode(" "+h), document.createElement("br"));
  });
}

function guardarBloqueos(){
  const f = adminFechaBloqueo.value;
  if(!f) return alert("Seleccione una fecha");
  const checks = horariosBloqueo.querySelectorAll("input");
  let bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  bloqueos[f] = [];
  checks.forEach(c=>{ if(c.checked) bloqueos[f].push(c.value); });
  localStorage.setItem("bloqueos", JSON.stringify(bloqueos));
  alert("Bloqueos guardados");
}

// ================= CALENDARIO ADMIN =================
function cargarSelectMesAnio(){
  const mesSelect = document.getElementById("mesSelect");
  const anioSelect = document.getElementById("anioSelect");
  const hoy = new Date();
  mesSelect.innerHTML = "";
  meses.forEach((m,i)=>{
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = m;
    if(i === hoy.getMonth()) opt.selected = true;
    mesSelect.appendChild(opt);
  });
  anioSelect.innerHTML = "";
  for(let y=hoy.getFullYear()-1; y<=hoy.getFullYear()+2; y++){
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if(y === hoy.getFullYear()) opt.selected = true;
    anioSelect.appendChild(opt);
  }
  mesSelect.addEventListener("change", mostrarCalendarioAdmin);
  anioSelect.addEventListener("change", mostrarCalendarioAdmin);
}

function mostrarCalendarioAdmin(){
  const calendario = document.getElementById("calendarioAdmin");
  calendario.innerHTML = "";
  const mes = parseInt(document.getElementById("mesSelect").value);
  const anio = parseInt(document.getElementById("anioSelect").value);
  const diasMes = new Date(anio, mes+1, 0).getDate();
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];

  for(let d=1; d<=diasMes; d++){
    const fechaStr = `${d.toString().padStart(2,'0')}-${(mes+1).toString().padStart(2,'0')}-${anio}`;
    const diaDiv = document.createElement("div");
    diaDiv.className = "dia-calendario";

    const turnosDia = turnos.filter(t => {
      const parts = t.fecha.split("-");
      const tFechaStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
      return t.fecha === t.fecha || t.fecha === t.fecha;
    });

    if(turnosDia.length === 1) diaDiv.classList.add("turno");
    if(turnosDia.length > 1) diaDiv.classList.add("turno-multiples");

    diaDiv.textContent = d;
    diaDiv.onclick = () => mostrarTurnosPorDiaMes(`${d.toString().padStart(2,'0')}-${(mes+1).toString().padStart(2,'0')}-${anio}`);
    calendario.appendChild(diaDiv);
  }
}

function mostrarTurnosPorDiaMes(fechaStr){
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  listaTurnosAdmin.innerHTML = `<h4>Turnos del ${fechaStr}</h4>`;
  const parts = fechaStr.split('-');
  const fechaISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
  const turnosDia = turnos.filter(t => t.fecha === fechaISO);
  if(turnosDia.length === 0){
    listaTurnosAdmin.innerHTML += "<p>No hay turnos asignados</p>";
    return;
  }
  turnosDia.forEach((t,i)=>{
    const div = document.createElement("div");
    div.className = "turno-admin";
    div.innerHTML = `<strong>${t.hora}</strong> - ${t.nombre} - ${t.servicio} <button onclick="cancelarTurno('${fechaISO}', ${i})">Cancelar</button>`;
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
      mostrarCalendarioAdmin();
      mostrarTurnosPorDiaMes(fecha);
    }
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
  const confirmacion = confirm(`Confirma el turno:\n\nCliente: ${turno.nombre}\nFecha: ${turno.fecha}\nHora: ${turno.hora}\nServicio: ${turno.servicio}`);
  if(!confirmacion) return;
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  turnos.push(turno);
  localStorage.setItem("turnos", JSON.stringify(turnos));
  alert("Turno reservado con éxito");
  enviarWhatsApp(turno);
  formTurno.reset();
};

function enviarWhatsApp(turno){
  const telCliente = "54" + turno.telefono;
  const msgCliente = `Hola ${turno.nombre} 😊\nTu turno fue reservado:\n📅 ${turno.fecha}\n⏰ ${turno.hora}\n💅 ${turno.servicio}`;
  const msgAdmin = `📌 Nuevo turno\nCliente: ${turno.nombre}\nTel: ${turno.telefono}\nFecha: ${turno.fecha}\nHora: ${turno.hora}\nServicio: ${turno.servicio}`;
  window.open(`https://wa.me/${telCliente}?text=${encodeURIComponent(msgCliente)}`, "_blank");
  window.open(`https://wa.me/${telManicurista}?text=${encodeURIComponent(msgAdmin)}`, "_blank");
}
