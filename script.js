import { db, collection, addDoc, getDocs, doc, deleteDoc, setDoc } from './script.js';

const adminPass = "admin123";
const telManicurista = "541158428854";

const horasBase = ["9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00"];
const duraciones = { tradicional:60, semi:60, belleza_pies:60, kapping:60, poligel:90, manos_pies:120, softgel:90 };

const fecha = document.getElementById("fecha");
const servicio = document.getElementById("servicio");
const hora = document.getElementById("hora");
const formTurno = document.getElementById("formTurno");
const nombre = document.getElementById("nombre");
const telefono = document.getElementById("telefono");

const adminFechaBloqueo = document.getElementById("adminFechaBloqueo");
const horariosBloqueo = document.getElementById("horariosBloqueo");
const calendarioAdmin = document.getElementById("calendarioAdmin");
const listaTurnosAdmin = document.getElementById("listaTurnosAdmin");
const mesSelect = document.getElementById("mesSelect");
const anioSelect = document.getElementById("anioSelect");

// Admin Login
document.getElementById("btnAdmin").addEventListener("click", () => {
  const pass = prompt("Contraseña administrador");
  if(pass === adminPass){
    document.getElementById("adminPanel").style.display = "block";
    inicializarSelects();
    cargarCalendario();
  } else alert("Contraseña incorrecta");
});

function cerrarSesionAdmin(){ document.getElementById("adminPanel").style.display="none"; }

// Bloqueos
adminFechaBloqueo.addEventListener("change", mostrarHorariosBloqueo);
async function mostrarHorariosBloqueo(){
  const fecha = adminFechaBloqueo.value;
  horariosBloqueo.innerHTML = "";
  if(!fecha){ horariosBloqueo.innerHTML="<p>Seleccione una fecha</p>"; return; }

  const bloqueosCol = collection(db, "bloqueos");
  const bloqueosSnap = await getDocs(bloqueosCol);
  let bloqueos = {};
  bloqueosSnap.forEach(doc=>{ bloqueos[doc.id] = doc.data().horas; });

  horasBase.forEach(h=>{
    const chk = document.createElement("input");
    chk.type="checkbox"; chk.value=h;
    chk.checked = bloqueos[fecha]?.includes(h) || false;
    horariosBloqueo.append(chk, document.createTextNode(" "+h), document.createElement("br"));
  });
}

async function guardarBloqueos(){
  const fecha = adminFechaBloqueo.value;
  if(!fecha) return alert("Seleccione una fecha");
  const checks = horariosBloqueo.querySelectorAll("input");
  const horas = [];
  checks.forEach(c=>{ if(c.checked) horas.push(c.value); });
  await setDoc(doc(db,"bloqueos",fecha), { horas });
  alert("Bloqueos guardados");
}

// Calendario
function inicializarSelects(){
  const hoy = new Date();
  for(let m=0;m<12;m++){
    const opt = document.createElement("option");
    opt.value = m; opt.text = m+1;
    if(m===hoy.getMonth()) opt.selected=true;
    mesSelect.appendChild(opt);
  }
  for(let y=hoy.getFullYear(); y<=hoy.getFullYear()+1; y++){
    const opt = document.createElement("option"); opt.value=y; opt.text=y;
    if(y===hoy.getFullYear()) opt.selected=true;
    anioSelect.appendChild(opt);
  }
}

async function cargarCalendario(){
  calendarioAdmin.innerHTML="";
  const mes = parseInt(mesSelect.value), anio = parseInt(anioSelect.value);
  const diasMes = new Date(anio, mes+1,0).getDate();

  const turnosCol = collection(db,"turnos");
  const turnosSnap = await getDocs(turnosCol);
  const turnos = [];
  turnosSnap.forEach(doc=>{ turnos.push(doc.data()); });

  for(let d=1; d<=diasMes; d++){
    const fechaStr = `${anio}-${(mes+1).toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}`;
    const diaDiv = document.createElement("div"); diaDiv.className="dia-calendario"; diaDiv.textContent=d;

    if(turnos.some(t=>t.fecha===fechaStr)) diaDiv.classList.add("turno");

    diaDiv.onclick = ()=>mostrarTurnosPorDia(fechaStr);
    calendarioAdmin.appendChild(diaDiv);
  }
}

async function mostrarTurnosPorDia(fechaStr){
  listaTurnosAdmin.innerHTML=`<h4>Turnos del ${fechaStr}</h4>`;
  const turnosCol = collection(db,"turnos");
  const turnosSnap = await getDocs(turnosCol);
  const turnosDia = [];
  turnosSnap.forEach(doc=>{
    if(doc.data().fecha===fechaStr) turnosDia.push({id:doc.id,...doc.data()});
  });

  if(turnosDia.length===0){ listaTurnosAdmin.innerHTML+="<p>No hay turnos asignados</p>"; return; }

  turnosDia.forEach((t)=>{
    const div = document.createElement("div"); div.className="turno-admin";
    div.innerHTML=`<strong>${t.hora}</strong> - ${t.nombre} - ${t.servicio} 
      <button onclick="cancelarTurnoFirebase('${t.id}')">Cancelar</button>`;
    listaTurnosAdmin.appendChild(div);
  });
}

async function cancelarTurnoFirebase(id){
  if(confirm("Cancelar turno?")){
    await deleteDoc(doc(db,"turnos",id));
    cargarCalendario();
    alert("Turno cancelado");
  }
}

// Cliente
fecha.addEventListener("change", cargarHorarios);
servicio.addEventListener("change", cargarHorarios);

async function cargarHorarios(){
  const f=fecha.value, s=servicio.value;
  hora.innerHTML='<option value="">Seleccionar horario</option>';
  if(!f || !s) return;

  const turnosCol = collection(db,"turnos");
  const turnosSnap = await getDocs(turnosCol);
  const turnos = [];
  turnosSnap.forEach(doc=>{ turnos.push(doc.data()); });

  const bloqueosCol = collection(db,"bloqueos");
  const bloqueosSnap = await getDocs(bloqueosCol);
  const bloqueosData = {};
  bloqueosSnap.forEach(doc=>{ bloqueosData[doc.id]=doc.data().horas; });

  const dur = duraciones[s]/60;

  for(let i=0;i<horasBase.length;i++){
    let libre=true;
    if(bloqueosData[f]?.includes(horasBase[i])) libre=false;
    turnos.forEach(t=>{
      if(t.fecha===f){
        const idx=horasBase.indexOf(t.hora);
        const d=duraciones[t.servicio]/60;
        if(i>=idx && i<idx+d) libre=false;
      }
    });
    if(i+dur>horasBase.length) libre=false;
    if(libre) hora.add(new Option(horasBase[i],horasBase[i]));
  }
  if(hora.options.length===1) hora.add(new Option("No hay horarios disponibles",""));
}

formTurno.addEventListener("submit", async e=>{
  e.preventDefault();
  const turno={ nombre:nombre.value, telefono:telefono.value, fecha:fecha.value, servicio:servicio.value, hora:hora.value };
  if(!confirm(`Confirma el turno:\nCliente: ${turno.nombre}\nFecha: ${turno.fecha}\nHora: ${turno.hora}\nServicio: ${turno.servicio}`)) return;

  const docRef = await addDoc(collection(db,"turnos"),turno);

  // Mensaje WhatsApp cliente
  const msjCliente = encodeURIComponent(`Hola ${turno.nombre}, tu turno fue reservado para el ${turno.fecha} a las ${turno.hora} (${turno.servicio})`);
  window.open(`https://wa.me/${turno.telefono}?text=${msjCliente}`,'_blank');

  // Mensaje WhatsApp administradora
  const msjAdmin = encodeURIComponent(`Nuevo turno: ${turno.nombre} - ${turno.fecha} - ${turno.hora} - ${turno.servicio}`);
  window.open(`https://wa.me/${telManicurista}?text=${msjAdmin}`,'_blank');

  alert("Turno reservado y mensajes enviados");
  formTurno.reset();
  cargarHorarios();
  cargarCalendario();
});
