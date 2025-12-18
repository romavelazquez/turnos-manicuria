import { 
  db, collection, addDoc, getDocs, doc, deleteDoc, setDoc, getDoc 
} from "./firebase.js";

document.addEventListener("DOMContentLoaded", async () => {

  const SERVICIOS = {
    60: ["Tradicional", "Semi", "Pies", "Retiro de Servicio"],
    90: ["Soft Gel", "Poli Gel"],
    120: ["Manos y Pies"]
  };

  const ADMIN_PHONE = "1158428854";

  const nombre = document.getElementById("nombre");
  const telefono = document.getElementById("telefono");
  const fecha = document.getElementById("fecha");
  const servicio = document.getElementById("servicio");
  const hora = document.getElementById("hora");
  const btnReservar = document.getElementById("btnReservar");

  const listaTurnosHoy = document.getElementById("listaTurnos");

  const adminPanel = document.getElementById("adminPanel");
  const btnAdmin = document.getElementById("btnAdmin");
  const cerrarAdmin = document.getElementById("cerrarAdmin");
  const adminFechaTurnos = document.getElementById("adminFechaTurnos");
  const adminListaTurnos = document.getElementById("adminListaTurnos");

  const adminFechaBloqueo = document.getElementById("adminFechaBloqueo");
  const bloqueoDiaCompleto = document.getElementById("bloqueoDiaCompleto");
  const adminBloqueos = document.getElementById("adminBloqueos");
  const btnGuardarBloqueos = document.getElementById("guardarBloqueos");
  const btnLimpiarReservas = document.getElementById("btnLimpiarReservas");

  let turnos = [];
  let bloqueos = [];

  /* ==========================
        UTILIDADES
  ========================== */

  function horaAMinutos(h) {
    const [HH, MM] = h.split(":").map(Number);
    return HH * 60 + MM;
  }

  function minutosAHora(m) {
    const HH = String(Math.floor(m / 60)).padStart(2, "0");
    const MM = String(m % 60).padStart(2, "0");
    return `${HH}:${MM}`;
  }

  function limpiarFormulario() {
    nombre.value = "";
    telefono.value = "";
    fecha.value = "";
    servicio.value = "";
    hora.innerHTML = `<option value="">Seleccionar horario</option>`;
  }

  function validarTelefono(num) {
    num = num.replace(/\D/g, "");

    if (num.startsWith("01115")) num = num.replace("01115", "11");
    if (num.startsWith("15")) num = num.substring(2);

    return num.length >= 8 && num.length <= 12;
  }

  /* ==========================
        CARGAR TURNOS 
  ========================== */

  async function cargarTurnos() {
    turnos = [];
    const snap = await getDocs(collection(db, "turnos"));
    snap.forEach(d => turnos.push({ id: d.id, ...d.data() }));
  }

  /* ==========================
       CARGAR BLOQUEOS 
  ========================== */

  async function cargarBloqueos() {
  bloqueos = [];
  const snap = await getDocs(collection(db, "bloqueos"));
  snap.forEach(d => bloqueos.push({ id: d.id, ...d.data() }));  // ✔ BIEN
}


  /* ==========================
      CARGAR SERVICIOS
  ========================== */

  function cargarServicios() {
    servicio.innerHTML = `<option value="">Seleccionar servicio</option>`;

    Object.keys(SERVICIOS).forEach(duracion => {
      SERVICIOS[duracion].forEach(nombre => {
        const op = document.createElement("option");
        op.value = `${nombre}|${duracion}`;
        op.textContent = `${nombre} (${duracion} min)`;
        servicio.appendChild(op);
      });
    });
  }

  /* ==========================
   GENERAR HORARIOS POSIBLES
  ========================== */

  function generarHorarios(duracion) {
    const horarios = [];
    let inicio = 9 * 60;
    let fin = 18 * 60;

    for (let m = inicio; m + duracion <= fin; m += 30) {
      horarios.push(minutosAHora(m));
    }

    return horarios;
  }

  /* ==========================
      CARGAR HORARIOS DISPONIBLES
  ========================== */

  async function cargarHorariosDisponibles() {
    const fechaSel = fecha.value;
    if (!fechaSel || !servicio.value) return;

    const [nombreServicio, duracion] = servicio.value.split("|");
    const dur = Number(duracion);

    await cargarTurnos();

    let horarios = generarHorarios(dur);

    horarios = horarios.filter(h => {
      let inicio = horaAMinutos(h);
      let fin = inicio + dur;

      for (const t of turnos) {
        if (t.fecha !== fechaSel) continue;

        const tInicio = horaAMinutos(t.hora);
        const tFin = tInicio + Number(t.duracion);

        if (!(fin <= tInicio || inicio >= tFin)) return false;
      }
      return true;
    });

    await cargarBloqueos();

    const bloqueosDia = bloqueos.filter(b => b.fecha === fechaSel);

    if (bloqueosDia.some(b => b.diaCompleto)) horarios = [];

    bloqueosDia.forEach(b => {
      if (b.hora) horarios = horarios.filter(h => h !== b.hora);
    });

    hora.innerHTML = `<option value="">Seleccionar horario</option>`;
    horarios.forEach(h => {
      const o = document.createElement("option");
      o.value = h;
      o.textContent = h;
      hora.appendChild(o);
    });
  }

  servicio.addEventListener("change", cargarHorariosDisponibles);
  fecha.addEventListener("change", cargarHorariosDisponibles);

  /* ==========================
         RESERVAR
  ========================== */

  btnReservar.addEventListener("click", async () => {
    if (!nombre.value || !telefono.value || !fecha.value || !servicio.value || !hora.value) {
      alert("Completar todos los campos");
      return;
    }

    if (!validarTelefono(telefono.value)) {
      alert("Número de teléfono inválido. Quitá el 15 o el 01115 si corresponde.");
      return;
    }

    const [nombreServicio, duracion] = servicio.value.split("|");

    await addDoc(collection(db, "turnos"), {
      nombre: nombre.value,
      telefono: telefono.value.replace(/\D/g, ""),
      fecha: fecha.value,
      servicio: nombreServicio,
      duracion,
      hora: hora.value
    });

    alert("Turno reservado correctamente");

    const msg = `Hola! Soy ${nombre.value}. Reservé un turno de ${nombreServicio} el día ${fecha.value} a las ${hora.value}.`;
    window.open(
      `https://wa.me/549${ADMIN_PHONE}?text=${encodeURIComponent(msg)}`,
      "_blank"
    );
    const msgCliente = `Hola ${nombre.value}! Tu turno de ${nombreServicio} quedó reservado para el día ${fecha.value} a las ${hora.value}. 💅`;

window.open(
  `https://wa.me/549${telefono.value.replace(/\D/g,"")}?text=${encodeURIComponent(msgCliente)}`,
  "_blank"
);


    limpiarFormulario();
    mostrarTurnosHoy();
  });

  /* ==========================
      MOSTRAR TURNOS DEL DÍA
  ========================== */

  async function mostrarTurnosHoy() {
    const hoy = new Date().toISOString().split("T")[0];

    await cargarTurnos();

    const lista = turnos
      .filter(t => t.fecha === hoy)
      .sort((a, b) => horaAMinutos(a.hora) - horaAMinutos(b.hora));

    listaTurnosHoy.innerHTML = "";

    if (lista.length === 0) {
      listaTurnosHoy.innerHTML = `<div class="agenda-vacio">No hay turnos para hoy</div>`;
      return;
    }

    lista.forEach(t => {
      const div = document.createElement("div");
      div.className = `agenda-item servicio-${t.servicio.replace(/ /g, "\\ ")}`;

      div.innerHTML = `
        <div class="agenda-hora">${t.hora}</div>
        <div>
          <div class="agenda-servicio">${t.servicio}</div>
          <div class="agenda-nombre">${t.nombre}</div>
          <div class="agenda-telefono">${t.telefono}</div>
        </div>
      `;

      listaTurnosHoy.appendChild(div);
    });
  }

  /* ==========================
      PANEL ADMIN
  ========================== */

  btnAdmin.addEventListener("click", () => {
    const pass = prompt("Contraseña de administradora:");
    if (pass === "admin123") {
      adminPanel.style.display = "block";
      document.body.classList.add("admin-mode");
    }
  });

  cerrarAdmin.addEventListener("click", () => {
    adminPanel.style.display = "none";
    document.body.classList.remove("admin-mode");
  });

  adminFechaTurnos.addEventListener("change", async () => {
    const f = adminFechaTurnos.value;

    await cargarTurnos();

    const lista = turnos
      .filter(t => t.fecha === f)
      .sort((a, b) => horaAMinutos(a.hora) - horaAMinutos(b.hora));

    adminListaTurnos.innerHTML = "";

    if (lista.length === 0) {
      adminListaTurnos.innerHTML = `<div class="agenda-vacio">No hay turnos en esta fecha</div>`;
      return;
    }

    lista.forEach(t => {
      const d = document.createElement("div");
      d.className = `agenda-item servicio-${t.servicio.replace(/ /g, "\\ ")}`;

      d.innerHTML = `
        <div class="agenda-hora">${t.hora}</div>
        <div>
          <div class="agenda-servicio">${t.servicio}</div>
          <div class="agenda-nombre">${t.nombre}</div>
          <div class="agenda-telefono">${t.telefono}</div>
        </div>
        <button class="btn-cancelar" data-id="${t.id}">X</button>
      `;

      adminListaTurnos.appendChild(d);
    });

    document.querySelectorAll(".btn-cancelar").forEach(btn => {
      btn.addEventListener("click", async () => {
        await deleteDoc(doc(db, "turnos", btn.dataset.id));
        adminFechaTurnos.dispatchEvent(new Event("change"));
      });
    });
  });

  /* ==========================
      BLOQUEOS
  ========================== */

  async function cargarBloqueosPanel() {
    adminBloqueos.innerHTML = "";

    const horas = generarHorarios(30);

    horas.forEach(h => {
      const div = document.createElement("div");
      div.innerHTML = `
        <label>
          <input type="checkbox" class="chkBloq" value="${h}">
          Bloquear ${h}
        </label>
      `;

      adminBloqueos.appendChild(div);
    });
  }

  adminFechaBloqueo.addEventListener("change", async () => {
    await cargarBloqueos();
    await cargarBloqueosPanel();

    const fechaSel = adminFechaBloqueo.value;

    bloqueoDiaCompleto.checked = bloqueos.some(b => b.fecha === fechaSel && b.diaCompleto);

    const horariosBloq = bloqueos.filter(b => b.fecha === fechaSel && b.hora).map(b => b.hora);

    document.querySelectorAll(".chkBloq").forEach(chk => {
      chk.checked = horariosBloq.includes(chk.value);
    });
  });

  btnGuardarBloqueos.addEventListener("click", async () => {
    const fechaSel = adminFechaBloqueo.value;
    if (!fechaSel) return;

    await setDoc(doc(db, "bloqueos", fechaSel + "_diacompleto"), {
      fecha: fechaSel,
      diaCompleto: bloqueoDiaCompleto.checked
    });

    const checks = [...document.querySelectorAll(".chkBloq")];

    for (const chk of checks) {
      const id = fechaSel + "_" + chk.value;

      if (chk.checked) {
        await setDoc(doc(db, "bloqueos", id), {
          fecha: fechaSel,
          hora: chk.value
        });
      } else {
        await deleteDoc(doc(db, "bloqueos", id));
      }
    }

    alert("Bloqueos actualizados");
  });

  /* ==========================
     ELIMINAR TODOS LOS TURNOS
  ========================== */

  btnLimpiarReservas.addEventListener("click", async () => {
    if (!confirm("¿Eliminar TODAS las reservas?")) return;

    const snap = await getDocs(collection(db, "turnos"));
    for (const d of snap.docs) {
      await deleteDoc(doc(db, "turnos", d.id));
    }

    alert("Todas las reservas eliminadas");
  });

  /* ==========================
         INIT
  ========================== */

  cargarServicios();
  mostrarTurnosHoy();

});
