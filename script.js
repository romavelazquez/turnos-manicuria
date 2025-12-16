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

const adminFechaBloqueo = document.getElementById("adminFechaBloqueo");
const horariosBloqueo = document.getElementById("horariosBloqueo");
const listaTurnosAdmin = document.getElementById("listaTurnosAdmin");
const calendarioAdmin = document.getElementById("calendarioAdmin");

const mesSelector = document.getElementById("mesSelector");
const anioSelector = document.getElementById("anioSelector");

// ===== NORMALIZAR TURNOS ANTIGUOS =====
(function normalizarTurnos() {
  let turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  let cambiados = false;

  turnos = turnos.map(t => {
    if(/^\d{2}-\d{2}-\d{4}$/.test(t.fecha)){
      const partes = t.fecha.split('-');
      t.fecha = `${partes[2]}-${partes[1]}-${partes[0]}`;
      cambiados = true;
    }
    return t;
  });

  if(cambiados){
    localStorage.setItem("turnos", JSON.stringify(turnos));
    console.log("Turnos antiguos normalizados a formato ISO YYYY-MM-DD");
  }
})();

// ================= ADMIN LOGIN =================
document.getElementById("btnAdmin").onclick = () => {
  const pass = prompt("Contraseña administrador");
  if(pass === adminPass){
    document.getElementById("adminPanel").style.display = "block";
    mostrarCalendarioAdmin();
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
const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Llenar selectores
meses.forEach((m,i)=>{
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = m;
  mesSelector.appendChild(opt);
});

for(let a=2025; a<=2030; a++){
  const opt = document.createElement("option");
  opt.value = a;
  opt.textContent = a;
  anioSelector.appendChild(opt);
}

const hoy = new Date();
mesSelector.value = hoy.getMonth();
anioSelector.value = hoy.getFullYear();

mesSelector.addEventListener("change", mostrarCalendarioAdmin);
anioSelector.addEventListener("change", mostrarCalendarioAdmin);

function mostrarCalendarioAdmin(){
  calendarioAdmin.innerHTML = "";

  const mes = parseInt(mesSelector.value);
  const anio = parseInt(anioSelector.value);
  const diasMes = new Date(anio, mes+1, 0).getDate();
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];

  // Encabezado de semana
  const diasSemana = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  diasSemana.forEach(d => {
    const div = document.createElement("div");
    div.className = "dia-calendario-header";
    div.textContent = d;
    calendarioAdmin.appendChild(div);
  });

  const primerDia = new Date(anio, mes, 1).getDay();

  for(let i=0;i<primerDia;i++){
    const div = document.createElement("div");
    div.className = "dia-calendario-empty";
    calendarioAdmin.appendChild(div);
  }

  for(let d=1; d<=diasMes; d++){
    const fechaISO = `${anio}-${(mes+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
    const diaDiv = document.createElement("div");
    diaDiv.className = "dia-calendario";

    const turnosDia = turnos.filter(t => t.fecha === fechaISO);

    if(turnosDia.length === 1) diaDiv.classList.add("turno");
    if(turnosDia.length > 1) diaDiv.classList.add("turno-multiples");

    diaDiv.textContent = d;
    diaDiv.onclick = () => mostrarTurnosPorDiaMes(fechaISO);
    calendarioAdmin.appendChild(diaDiv);
  }
}

function mostrarTurnosPorDiaMes(fechaISO){
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  listaTurnosAdmin.innerHTML = `<h4>Turnos del ${fechaISO}</h4>`;

  const turnosDia = turnos.filter(t => t.fecha === fechaISO);

  if(turnosDia.length===0){
    listaTurnosAdmin.innerHTML += "<p>No hay turnos asignados</p>";
    return;
  }

  turnosDia
    .sort((a,b)=>horasBase.indexOf(a.hora)-horasBase.indexOf(b.hora))
    .forEach((t,i)=>{
      const div = document.createElement("div");
      div.className = "turno-admin";
      div.innerHTML = `
        <strong>⏰ ${t.hora}</strong>
        <span>💅 ${t.servicio}</span>
        <span>👤 ${t.nombre}</span>
        <span>📞 ${t.telefono}</span>
        <button onclick="cancelarTurno('${t.fecha}', ${i})">Cancelar</button>
      `;
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
