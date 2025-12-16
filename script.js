const adminPass = "admin123";
const telManicurista = "541158428854";

const horasBase = ["9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","20:30"];

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
const adminFechaTurnos = document.getElementById("adminFechaTurnos");
const listaTurnosAdmin = document.getElementById("listaTurnosAdmin");

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

// ================= CALENDARIO ADMIN =================
/*function mostrarCalendarioAdmin(){
  const calendario = document.getElementById("calendarioAdmin");
  calendario.innerHTML = "";

  const hoy = new Date();
  const mes = hoy.getMonth();
  const anio = hoy.getFullYear();
  const diasMes = new Date(anio, mes+1, 0).getDate();
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];

  for(let d=1; d<=diasMes; d++){
    const fechaStr = `${d.toString().padStart(2,'0')}-${(mes+1).toString().padStart(2,'0')}-${anio}`;
    const diaDiv = document.createElement("div");
    diaDiv.className = "dia-calendario";

    // Marcar si hay turnos
    const turnosDia = turnos.filter(t => {
      const tFecha = t.fecha.split('-').reverse().join('-'); // YYYY-MM-DD -> DD-MM-YYYY
      return tFecha === fechaStr;
    });

    if(turnosDia.length === 1) diaDiv.classList.add("turno");
    if(turnosDia.length > 1) diaDiv.classList.add("turno-multiples");

    diaDiv.textContent = d;
    diaDiv.onclick = () => mostrarTurnosPorDiaMes(fechaStr); // actualizar función
    calendario.appendChild(diaDiv);
  }
}


function mostrarTurnosPorDiaMes(fechaStr){
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  const lista = document.getElementById("listaTurnosAdmin");
  lista.innerHTML = `<h4>Turnos del ${fechaStr}</h4>`;

  // Convertir fechaStr DD-MM-YYYY -> YYYY-MM-DD para comparar con input
  const parts = fechaStr.split('-');
  const fechaISO = `${parts[2]}-${parts[1]}-${parts[0]}`;

  const turnosDia = turnos.filter(t => t.fecha === fechaISO);
  if(turnosDia.length === 0){
    lista.innerHTML += "<p>No hay turnos asignados</p>";
    return;
  }

  turnosDia.forEach((t,i)=>{
    const div = document.createElement("div");
    div.className = "turno-admin";
    div.innerHTML = `
      <strong>${t.hora}</strong> - ${t.nombre} - ${t.servicio}
      <button onclick="cancelarTurno('${fechaISO}', ${i})">Cancelar</button>
    `;
    lista.appendChild(div);
  });
}*/
function mostrarCalendarioAdmin(){
  const calendario = document.getElementById("calendarioAdmin");
  calendario.innerHTML = "";

  const hoy = new Date();
  const bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];

  for(let m = 0; m < 2; m++){
    const fechaMes = new Date(hoy.getFullYear(), hoy.getMonth() + m, 1);
    const mes = fechaMes.getMonth();
    const anio = fechaMes.getFullYear();
    const diasMes = new Date(anio, mes + 1, 0).getDate();

    const titulo = document.createElement("h4");
    titulo.textContent = fechaMes.toLocaleString("es-AR", { month: "long", year: "numeric" });
    calendario.appendChild(titulo);

    const nombres = document.createElement("div");
    nombres.className = "nombres-dias";
    ["L","M","M","J","V","S","D"].forEach(d => {
      const div = document.createElement("div");
      div.textContent = d;
      nombres.appendChild(div);
    });
    calendario.appendChild(nombres);

    const grid = document.createElement("div");
    grid.className = "grid-mes";

    let inicio = new Date(anio, mes, 1).getDay();
    inicio = inicio === 0 ? 6 : inicio - 1;

    for(let i = 0; i < inicio; i++){
      grid.appendChild(document.createElement("div"));
    }

    for(let d = 1; d <= diasMes; d++){
      const diaDiv = document.createElement("div");
      diaDiv.className = "dia-calendario";
      diaDiv.textContent = d;

      const fechaISO = `${anio}-${(mes+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
      const fechaVisual = `${d.toString().padStart(2,'0')}-${(mes+1).toString().padStart(2,'0')}-${anio}`;

      if(fechaISO === hoy.toISOString().split("T")[0]){
        diaDiv.classList.add("hoy");
      }

      const turnosDia = turnos.filter(t => {
        const tFecha = t.fecha.split('-').reverse().join('-');
        return tFecha === fechaVisual;
      });

      if(turnosDia.length === 1) diaDiv.classList.add("turno");
      if(turnosDia.length > 1) diaDiv.classList.add("turno-multiples");

      if(bloqueos[fechaISO]?.length){
        diaDiv.classList.add("bloqueado");
      }

      diaDiv.onclick = () => mostrarTurnosPorDiaMes(fechaVisual);
      grid.appendChild(diaDiv);
    }

    calendario.appendChild(grid);
  }
}

function mostrarTurnosPorDiaMes(fechaStr){
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  const lista = document.getElementById("listaTurnosAdmin");
  lista.innerHTML = `<h4>Agenda del ${fechaStr}</h4>`;

  const parts = fechaStr.split('-');
  const fechaISO = `${parts[2]}-${parts[1]}-${parts[0]}`;

  const turnosDia = turnos.filter(t => t.fecha === fechaISO);

  if(turnosDia.length === 0){
    lista.innerHTML += "<p>No hay turnos asignados</p>";
    return;
  }

  turnosDia
    .sort((a,b) => horasBase.indexOf(a.hora) - horasBase.indexOf(b.hora))
    .forEach((t,i) => {
      const div = document.createElement("div");
      div.className = "turno-admin";
      div.innerHTML = `
        <strong>⏰ ${t.hora}</strong>
        <span>💅 ${t.servicio}</span>
        <span>👤 ${t.nombre}</span>
        <span>📞 ${t.telefono}</span>
        <button onclick="cancelarTurno('${fechaISO}', ${i})">Cancelar</button>
      `;
      lista.appendChild(div);
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
      mostrarTurnosPorDia(fecha);
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
  // Pop-up de confirmación
  const confirmacion = confirm(`Confirma el turno:\n\nCliente: ${turno.nombre}\nFecha: ${turno.fecha}\nHora: ${turno.hora}\nServicio: ${turno.servicio}`);
  if(!confirmacion) return;

  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  turnos.push(turno);
  localStorage.setItem("turnos", JSON.stringify(turnos));

  alert("Turno reservado con éxito");

  enviarWhatsApp(turno);

  formTurno.reset();
};

  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  turnos.push(turno);
  localStorage.setItem("turnos", JSON.stringify(turnos));

  enviarWhatsApp(turno);

  alert("Turno reservado");
  e.target.reset();

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
