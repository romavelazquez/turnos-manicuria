import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {

  /* ===== CONFIG ===== */
  const ADMIN_PASS = "admin123";
  const ADMIN_PHONE = "1158428854";

  const SERVICIOS = {
    60: "Servicio básico",
    90: "Servicio completo",
    120: "Servicio premium"
  };

  const horasBase = [
    "09:00","09:30","10:00","10:30","11:00","11:30",
    "12:00","12:30","13:00","13:30","14:00","14:30",
    "15:00","15:30","16:00","16:30","17:00"
  ];

  /* ===== ELEMENTOS CLIENTE ===== */
  const nombre = document.getElementById("nombre");
  const telefono = document.getElementById("telefono");
  const fecha = document.getElementById("fecha");
  const servicio = document.getElementById("servicio");
  const hora = document.getElementById("hora");
  const btnReservar = document.getElementById("btnReservar");
  const listaTurnos = document.getElementById("listaTurnos");

  /* ===== ELEMENTOS ADMIN ===== */
  const btnAdmin = document.getElementById("btnAdmin");
  const adminPanel = document.getElementById("adminPanel");
  const adminFechaTurnos = document.getElementById("adminFechaTurnos");
  const adminListaTurnos = document.getElementById("adminListaTurnos");
  const adminFechaBloqueo = document.getElementById("adminFechaBloqueo");
  const adminBloqueos = document.getElementById("adminBloqueos");
  const guardarBloqueosBtn = document.getElementById("guardarBloqueos");
  const cerrarAdmin = document.getElementById("cerrarAdmin");
  const btnLimpiarReservas = document.getElementById("btnLimpiarReservas");

  let turnos = [];

  /* ===== UTILIDADES ===== */
  function horaAMinutos(h) {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
  }

  async function cargarTurnos() {
    turnos = [];
    const snap = await getDocs(collection(db, "turnos"));
    snap.forEach(d => turnos.push({ id: d.id, ...d.data() }));
  }

  async function cargarBloqueos(fechaSel) {
    const ref = doc(db, "bloqueos", fechaSel);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().horas : [];
  }

  /* ===== MOSTRAR TURNOS DEL DÍA ACTUAL ===== */
  async function mostrarTurnosHoy() {
    listaTurnos.innerHTML = "";

    const hoy = new Date().toISOString().split("T")[0];
    await cargarTurnos();

    const turnosHoy = turnos
      .filter(t => t.fecha === hoy)
      .sort((a, b) => horaAMinutos(a.hora) - horaAMinutos(b.hora));

    if (turnosHoy.length === 0) {
      listaTurnos.innerHTML = "<p>No hay turnos para hoy</p>";
      return;
    }

    turnosHoy.forEach(t => {
      const div = document.createElement("div");
      div.textContent = `${t.hora} - ${t.servicio}`;
      listaTurnos.appendChild(div);
    });
  }

  /* ===== HORARIOS DISPONIBLES ===== */
  async function cargarHorarios() {
    hora.innerHTML = '<option value="">Seleccionar horario</option>';
    if (!fecha.value || !servicio.value) return;

    await cargarTurnos();
    const bloqueos = await cargarBloqueos(fecha.value);

    const duracion = Number(servicio.value);
    const cierre = horaAMinutos("17:30");

    horasBase.forEach(h => {
      const inicio = horaAMinutos(h);
      const fin = inicio + duracion;
      let libre = fin <= cierre && !bloqueos.includes(h);

      turnos.forEach(t => {
        if (t.fecha === fecha.value) {
          const ti = horaAMinutos(t.hora);
          const tf = ti + t.duracion;
          if (inicio < tf && fin > ti) libre = false;
        }
      });

      if (libre) hora.add(new Option(h, h));
    });

    if (hora.options.length === 1) {
      hora.add(new Option("No hay horarios disponibles", ""));
    }
  }

  /* ===== RESERVAR TURNO ===== */
  btnReservar.addEventListener("click", async () => {
    if (!nombre.value || !telefono.value || !fecha.value || !servicio.value || !hora.value) {
      alert("Complete todos los datos");
      return;
    }

    const telLimpio = telefono.value.replace(/\D/g, "");
    const nombreServicio = SERVICIOS[servicio.value];

    await addDoc(collection(db, "turnos"), {
      nombre: nombre.value,
      telefono: telLimpio,
      fecha: fecha.value,
      hora: hora.value,
      duracion: Number(servicio.value),
      servicio: nombreServicio
    });

    const mensajeCliente = `
Hola ${nombre.value}! 👋
Tu turno fue reservado correctamente 💅

📌 Servicio: ${nombreServicio}
⏳ Duración: ${servicio.value} minutos
📅 Fecha: ${fecha.value}
⏰ Hora: ${hora.value}

¡Te esperamos!
`;

    const mensajeAdmin = `
📢 NUEVO TURNO RESERVADO

👤 Cliente: ${nombre.value}
📞 Teléfono: ${telLimpio}

📌 Servicio: ${nombreServicio}
📅 ${fecha.value} ⏰ ${hora.value}
`;

    window.open(`https://wa.me/549${telLimpio}?text=${encodeURIComponent(mensajeCliente)}`, "_blank");
    window.open(`https://wa.me/549${ADMIN_PHONE}?text=${encodeURIComponent(mensajeAdmin)}`, "_blank");

    alert("Turno reservado correctamente");

    await cargarHorarios();
    await mostrarTurnosHoy();
  });

  fecha.addEventListener("change", cargarHorarios);
  servicio.addEventListener("change", cargarHorarios);

  /* ===== LOGIN ADMIN ===== */
  btnAdmin.addEventListener("click", () => {
    const pass = prompt("Ingrese contraseña de administradora");
    if (pass === ADMIN_PASS) adminPanel.style.display = "block";
    else alert("Contraseña incorrecta");
  });

  cerrarAdmin.addEventListener("click", () => {
    adminPanel.style.display = "none";
  });

  /* ===== ADMIN VER TURNOS ===== */
  adminFechaTurnos.addEventListener("change", async () => {
    adminListaTurnos.innerHTML = "";
    await cargarTurnos();

    const delDia = turnos.filter(t => t.fecha === adminFechaTurnos.value);

    if (delDia.length === 0) {
      adminListaTurnos.innerHTML = "<p>No hay turnos para este día</p>";
      return;
    }

    delDia.forEach(t => {
      const div = document.createElement("div");
      div.innerHTML = `${t.hora} - ${t.servicio} <button>Cancelar</button>`;
      div.querySelector("button").onclick = async () => {
        await deleteDoc(doc(db, "turnos", t.id));
        adminFechaTurnos.dispatchEvent(new Event("change"));
        mostrarTurnosHoy();
      };
      adminListaTurnos.appendChild(div);
    });
  });

  /* ===== ADMIN BLOQUEOS ===== */
  adminFechaBloqueo.addEventListener("change", async () => {
    adminBloqueos.innerHTML = "";
    const bloqueos = await cargarBloqueos(adminFechaBloqueo.value);

    horasBase.forEach(h => {
      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.value = h;
      chk.checked = bloqueos.includes(h);
      adminBloqueos.append(chk, " " + h, document.createElement("br"));
    });
  });

  guardarBloqueosBtn.addEventListener("click", async () => {
    const horas = [...adminBloqueos.querySelectorAll("input:checked")].map(c => c.value);
    await setDoc(doc(db, "bloqueos", adminFechaBloqueo.value), { horas });
    alert("Bloqueos guardados");
    cargarHorarios();
  });

  /* ===== ADMIN LIMPIAR RESERVAS ===== */
  btnLimpiarReservas.addEventListener("click", async () => {
    if (!confirm("¿Eliminar TODAS las reservas?")) return;

    const snap = await getDocs(collection(db, "turnos"));
    for (const d of snap.docs) {
      await deleteDoc(doc(db, "turnos", d.id));
    }

    alert("Reservas eliminadas");
    mostrarTurnosHoy();
  });

  /* ===== INIT ===== */
  mostrarTurnosHoy();

});
