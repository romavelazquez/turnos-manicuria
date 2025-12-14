const adminPass = "admin123";
const horasBase = ["9:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];

const duraciones = {
  tradicional: 60,
  semi: 60,
  poligel: 90,
  softgel: 90
};

// ===== ADMIN LOGIN =====
document.getElementById("btnAdmin").onclick = () => {
  const pass = prompt("Contraseña admin");
  if(pass === adminPass){
    document.getElementById("adminPanel").style.display = "block";
  } else alert("Incorrecta");
};

// ===== LIMPIAR =====
function limpiarTodo(){
  if(confirm("Eliminar TODOS los turnos?")){
    localStorage.clear();
    location.reload();
  }
}

// ===== BLOQUEOS =====
document.getElementById("adminFechaBloqueo").addEventListener("change", mostrarHorariosBloqueo);

function mostrarHorariosBloqueo(){
  const fecha = adminFechaBloqueo.value;
  const bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  horariosBloqueo.innerHTML = "";

  horasBase.forEach(h=>{
    const chk = document.createElement("input");
    chk.type="checkbox";
    chk.value=h;
    chk.checked = bloqueos[fecha]?.includes(h);

    horariosBloqueo.append(chk, document.createTextNode(" "+h), document.createElement("br"));
  });
}

function guardarBloqueos(){
  const fecha = adminFechaBloqueo.value;
  const checks = horariosBloqueo.querySelectorAll("input");
  let bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  bloqueos[fecha] = [];

  checks.forEach(c=>{
    if(c.checked) bloqueos[fecha].push(c.value);
  });

  localStorage.setItem("bloqueos", JSON.stringify(bloqueos));
  alert("Bloqueos guardados");
}

// ===== VER / MODIFICAR TURNOS =====
document.getElementById("adminFechaTurnos").addEventListener("change", mostrarTurnosAdmin);

function mostrarTurnosAdmin(){
  const fecha = adminFechaTurnos.value;
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  listaTurnosAdmin.innerHTML="";

  turnos.filter(t=>t.fecha===fecha).forEach((t,i)=>{
    const div=document.createElement("div");
    div.innerHTML=`
    ${t.hora} - ${t.nombre}
    <button onclick="cancelarTurno(${i})">❌</button>
    `;
    listaTurnosAdmin.appendChild(div);
  });
}

function cancelarTurno(i){
  let turnos = JSON.parse(localStorage.getItem("turnos"));
  turnos.splice(i,1);
  localStorage.setItem("turnos",JSON.stringify(turnos));
  mostrarTurnosAdmin();
}

// ===== CLIENTA =====
document.getElementById("fecha").addEventListener("change", cargarHorarios);
document.getElementById("servicio").addEventListener("change", cargarHorarios);

function cargarHorarios(){
  const fecha = fechaInput.value;
  const bloqueos = JSON.parse(localStorage.getItem("bloqueos")) || {};
  hora.innerHTML="";

  horasBase.forEach(h=>{
    if(!bloqueos[fecha]?.includes(h)){
      hora.add(new Option(h,h));
    }
  });
}

formTurno.onsubmit = e =>{
  e.preventDefault();
  const turno={
    nombre:nombre.value,
    telefono:telefono.value,
    fecha:fecha.value,
    hora:hora.value,
    servicio:servicio.value
  };
  const turnos = JSON.parse(localStorage.getItem("turnos")) || [];
  turnos.push(turno);
  localStorage.setItem("turnos",JSON.stringify(turnos));
  alert("Turno reservado");
  formTurno.reset();
};
