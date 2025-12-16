import { db, collection, addDoc, getDocs, deleteDoc, doc } from "./index.html"; // ya importado globalmente

// Configuración básica
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

// ELEMENTOS
const fecha = document.getElementById("fecha");
const servicio = document.getElementById("servicio");
const hora = document.getElementById("hora");
const formTurno = document.getElementById("formTurno");
const nombre = document.getElementById("nombre");
const telefono = document.getElementById("telefono");
const adminFechaBloqueo = document.getElementById("adminFechaBloqueo");
const horariosBloqueo = document.getElementById("horariosBloqueo");
const listaTurnosAdmin = document.getElementById("listaTurnosAdmin");
const calendario = document.getElementById("calendarioAdmin");
const mesSelect = document.getElementById("mesSelect");
const anioSelect = document.getElementById("anioSelect");

// ADMIN LOGIN
document.getElementById("btnAdmin").onclick = () => {
  const pass = prompt("Contraseña administrador");
  if(pass === adminPass){
    document.getElementById("adminPanel").style.display = "block";
    cargarMesAnio();
    cargarCalendario();
  } else alert("Contraseña incorrecta");
};

function cerrarSesionAdmin(){
  document.getElementById("adminPanel").style.display = "none";
}

// LIMPIAR
function limpiarTodo(){
  if(confirm("Eliminar TODOS los turnos y bloqueos?")){
    alert("No se puede borrar Firestore desde el cliente sin reglas admin"); 
    // en producción, se debe implementar backend seguro
  }
}

// BLOQUEOS
adminFechaBloqueo.addEventListener("change", mostrarHorariosBloqueo);

function mostrarHorariosBloqueo(){
  const fecha = adminFechaBloqueo.value;
  const bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  horariosBloqueo.innerHTML = "";
  if(!fecha){ horariosBloqueo.innerHTML = "<p>Seleccione una fecha</p>"; return; }
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

// CALENDARIO ADMIN
function cargarMesAnio(){
  const hoy = new Date();
  for(let m=0;m<12;m++){
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = new Date(2025,m,1).toLocaleString("es",{month:"long"});
    if(m===hoy.getMonth()) opt.selected = true;
    mesSelect.appendChild(opt);
  }
  for(let y=2025;y<=2026;y++){
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if(y===hoy.getFullYear()) opt.selected = true;
    anioSelect.appendChild(opt);
  }
}

async function cargarCalendario(){
  calendario.innerHTML = "";
  const mes = parseInt(mesSelect.value);
  const anio = parseInt(anioSelect.value);
  const diasMes = new Date(anio, mes+1, 0).getDate();
  const snapshot = await getDocs(collection(db,"turnos"));
  const turnos = [];
  snapshot.forEach(doc => turnos.push({id:doc.id,...doc.data()}));

  for(let d=1; d<=diasMes; d++){
    const fechaStr = `${d.toString().padStart(2,'0')}-${(mes+1).toString().padStart(2,'0')}-${anio}`;
    const diaDiv = document.createElement("div");
    diaDiv.className = "dia-calendario";

    const turnosDia = turnos.filter(t => t.fecha === `${anio}-${(mes+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`);
    if(turnosDia.length>0) diaDiv.style.backgroundColor="#ffc107";

    diaDiv.textContent = d;
    diaDiv.onclick = ()=>mostrarTurnosPorDia(fechaStr,turnos);
    calendario.appendChild(diaDiv);
  }
}

function mostrarTurnosPorDia(fechaStr, turnos){
  listaTurnosAdmin.innerHTML = `<h4>Turnos del ${fechaStr}</h4>`;
  const parts = fechaStr.split('-');
  const fechaISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
  const turnosDia = turnos.filter(t=>t.fecha===fechaISO);
  if(turnosDia.length===0){ listaTurnosAdmin.innerHTML+="<p>No hay turnos</p>"; return; }
  turnosDia.forEach((t,i)=>{
    const div = document.createElement("div");
    div.className="turno-admin";
    div.innerHTML=`<strong>${t.hora}</strong> - ${t.nombre} - ${t.servicio}`;
    listaTurnosAdmin.appendChild(div);
  });
}

// CLIENTA
fecha.addEventListener("change", cargarHorarios);
servicio.addEventListener("change", cargarHorarios);

async function cargarHorarios(){
  const f = fecha.value;
  const s = servicio.value;
  hora.innerHTML = '<option value="">Seleccionar horario</option>';
  if(!f || !s) return;

  const snapshot = await getDocs(collection(db,"turnos"));
  const turnos = [];
  snapshot.forEach(doc => turnos.push(doc.data()));
  const bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  const dur = duraciones[s]/60;

  for(let i=0;i<horasBase.length;i++){
    let libre = true;
    if(bloqueos[f]?.includes(horasBase[i])) libre=false;
    turnos.forEach(t=>{
      if(t.fecha===f){
        const idx = horasBase.indexOf(t.hora);
        const d = duraciones[t.servicio]/60;
        if(i>=idx && i<idx+d) libre=false;
      }
    });
    if(i+dur>horasBase.length) libre=false;
    if(libre) hora.add(new Option(horasBase[i],horasBase[i]));
  }
  if(hora.options.length===1) hora.add(new Option("No hay horarios disponibles",""));
}

// RESERVA + WHATSAPP
formTurno.onsubmit = async e=>{
  e.preventDefault();
  const turno = {
    nombre: nombre.value,
    telefono: telefono.value,
    fecha: fecha.value,
    servicio: servicio.value,
    hora: hora.value
  };
  if(!confirm(`Confirma el turno:\n\nCliente: ${turno.nombre}\nFecha: ${turno.fecha}\nHora: ${turno.hora}\nServicio: ${turno.servicio}`)) return;

  await addDoc(collection(db,"turnos"),turno);
  alert("Turno reservado con éxito");
  formTurno.reset();
};
