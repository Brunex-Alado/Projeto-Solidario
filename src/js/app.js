import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyD5Mfhq7gD2fbcjvtHzyBW8EW2cRJQfJNw",
  authDomain: "projeto-solidario-c2f7c.firebaseapp.com",
  projectId: "projeto-solidario-c2f7c",
  storageBucket: "projeto-solidario-c2f7c.firebasestorage.app",
  messagingSenderId: "1078999697455",
  appId: "1:1078999697455:web:e7da8b3b7df1d82cbf1eda"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// CONTROLE DE ADMIN
let isAdmin = false;

// ELEMENTOS
const form = document.getElementById("volunteer-form");
const membersList = document.getElementById("members-list");
const drawBtn = document.getElementById("draw-button");
const drawResult = document.getElementById("draw-result");
const feedback = document.getElementById("form-feedback");
const toggleBtn = document.getElementById("toggle-members");

// MENU TOGGLE (HAMBÚRGUER)
const toggle = document.getElementById("menu-toggle");
const nav = document.getElementById("nav");

toggle.addEventListener("click", () => {
  nav.classList.toggle("active");
});

// MODAL + AUTH

// ELEMENTOS DO LOGIN
const openLogin = document.getElementById("open-login");
const closeLogin = document.getElementById("close-login");
const loginModal = document.getElementById("login-modal");

const loginBtn = document.getElementById("login-btn");
const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

// EDITAR O MODAL
const editModal = document.getElementById("edit-modal");
const editName = document.getElementById("edit-name");
const editPhone = document.getElementById("edit-phone");
const editBirthdate = document.getElementById("edit-birthdate");

const saveEditBtn = document.getElementById("save-edit");
const cancelEditBtn = document.getElementById("cancel-edit");

let currentEditId = null;

// SALVAR MODAL
saveEditBtn.addEventListener("click", async () => {

  if (!currentEditId) return;

  await updateDoc(doc(db, "members", currentEditId), {
    name: editName.value,
    phone: editPhone.value,
    birthdate: editBirthdate.value
  });

  // FECHA MODAL
  editModal.classList.add("hidden");

});

// CANCELAR
cancelEditBtn.addEventListener("click", () => {
  editModal.classList.add("hidden");
});

// ABRIR MODAL
openLogin.addEventListener("click", (e) => {
  e.preventDefault();
  loginModal.classList.remove("hidden");
});

// FECHAR MODAL
closeLogin.addEventListener("click", () => {
  loginModal.classList.add("hidden");
});

// LOGIN FIREBASE
loginBtn.addEventListener("click", async () => {
  const email = loginEmail.value;
  const password = loginPassword.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    loginModal.classList.add("hidden");

    alert("Login realizado com sucesso!");

  } catch (error) {
    loginError.textContent = "Email ou senha inválidos.";
  }
});

// MONITORAR USUÁRIO LOGADO
onAuthStateChanged(auth, (user) => {
  const loginLink = document.getElementById("open-login");

  if (user) {
    console.log("Admin logado:", user.email);

    // DEFINE O ADMIN
    isAdmin = true;

    // MUDA BOTÃO PARA LOGOUT
    loginLink.textContent = "Logout";

    loginLink.onclick = async (e) => {
      e.preventDefault();
      await signOut(auth);
    };

  } else {
    console.log("Nenhum usuário logado");

    // REMOVE O ADMIN
    isAdmin = false;

    // VOLTA PARA LOGIN
    loginLink.textContent = "Login";

    loginLink.onclick = (e) => {
      e.preventDefault();
      loginModal.classList.remove("hidden");
    };

    // CARREGA SÓ NOMES PARA USUÁRIO SE CADASTRAR E VISUALIZAR A LANDINGPAGE
    loadMembers();
  }
});

// FORMATAR DATA PADRÃO BRASIL
function formatDateBR(date) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

// TOGGLE LISTA DE MEMBROS
toggleBtn.addEventListener("click", () => {
  membersList.classList.toggle("hidden");
});

function listenMembers() {

  onSnapshot(collection(db, "members"), (snapshot) => {

    membersList.innerHTML = "";

    snapshot.forEach(docSnap => {

      const m = docSnap.data();
      const id = docSnap.id;

      const li = document.createElement("li");

      if (isAdmin) {
        li.innerHTML = `
          <strong>${m.name}</strong><br>
          ${m.phone} | ${formatDateBR(m.birthdate)}
          <br><br>

          <button class="btn-edit" data-id="${id}">Editar</button>
          <button class="btn-delete" data-id="${id}">Excluir</button>
        `;
      } else {
        li.innerHTML = `<strong>${m.name}</strong>`;
      }

      membersList.appendChild(li);
    });

    // ATIVAR EVENTO DOS BOTÕES DE ADMIN
    if (isAdmin) {
      attachAdminEvents();
    }
  });
}

// CADASTRO
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const birthdate = document.getElementById("birthdate").value;
  const phone = document.getElementById("phone").value;
  const participate = document.getElementById("participate").checked;

  try {
    await addDoc(collection(db, "members"), {
      name,
      birthdate,
      phone,
      participate,
      createdAt: new Date()
    });

    feedback.textContent = "Cadastrado com sucesso!";
    form.reset();

  } catch (error) {
    console.error("Erro ao cadastrar:", error);
    feedback.textContent = "Erro ao cadastrar.";
  }
});

drawBtn.addEventListener("click", async () => {

  drawResult.innerHTML = "<p>Sorteando...</p>";

  const snapshot = await getDocs(collection(db, "members"));

  const participants = [];

  snapshot.forEach(doc => {
    const m = doc.data();
    if (m.participate) participants.push(m);
  });

  if (participants.length === 0) {
    drawResult.textContent = "Nenhum participante disponível.";
    return;
  }

  const teams = [
    "Compartilhando o Pão",
    "Semeando a Palavra",
    "Edificando a Casa"
  ];

  // EMBARALHAR
  const shuffled = participants.sort(() => Math.random() - 0.5);

  let counter = 0;

  const interval = setInterval(() => {

    const random = shuffled[Math.floor(Math.random() * shuffled.length)];
    const team = teams[Math.floor(Math.random() * teams.length)];

    drawResult.innerHTML = `
      <p style="opacity:0.5;">
        ${random.name} → ${team}
      </p>
    `;

    counter++;

    if (counter > 15) {
      clearInterval(interval);

      // RESULTADO EM COLUNAS 
      let resultHTML = `
        <h3 style="margin-bottom:20px;">Resultado do Sorteio</h3>
    `;

      // AGRUPAR TIMES
      const teamGroups = {
        "Compartilhando o Pão": [],
        "Semeando a Palavra": [],
        "Edificando a Casa": []
      };

      // DISTRIBUIÇÃO BALANCEADA
      shuffled.forEach((member, index) => {
        const team = teams[index % teams.length];
        teamGroups[team].push(member.name);
      });

      // MONTAR GRID
      resultHTML += `
        <div class="draw-grid">
          ${Object.keys(teamGroups).map(team => `
            <div class="team-column">
              <h4>${team}</h4>
              <ul>
                ${teamGroups[team].map(name => `<li>${name}</li>`).join("")}
              </ul>
            </div>
          `).join("")}
        </div>
      `;

      drawResult.innerHTML = resultHTML;
    }

  }, 100);
});

// INIT
listenMembers();

// ANIMAÇÃO AO SCROLL
const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
    }
  });
}, {
  threshold: 0.2
});

reveals.forEach(el => observer.observe(el));

function attachAdminEvents() {

// ANIMAÇÃO DE SCROLL PARA O HEADER
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");

  if (window.scrollY > 50) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

  // EDITAR MEMBROS COM MODAL
document.querySelectorAll(".btn-edit").forEach(btn => {
  btn.addEventListener("click", async () => {

    const id = btn.dataset.id;
    currentEditId = id;

    const docSnap = await getDocs(collection(db, "members"));
    const member = docSnap.docs.find(d => d.id === id);

    if (member) {
      const m = member.data();

      editName.value = m.name;
      editPhone.value = m.phone;
      editBirthdate.value = m.birthdate;
      }

    // ABRE MODAL
    editModal.classList.remove("hidden");
    });
  });

  // EXCLUIR MEMBROS
  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", async () => {

      const id = btn.dataset.id;

      const confirmDelete = confirm("Tem certeza que deseja excluir?");

      if (!confirmDelete) return;

      await deleteDoc(doc(db, "members", id));

      alert("Excluído com sucesso!");
    });
  });

}