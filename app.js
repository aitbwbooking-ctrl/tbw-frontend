// ⬅️ OVDJE STAVI SVOJ BACKEND LINK
const BACKEND_URL = "https://tbw-backend.vercel.app";

document.addEventListener("DOMContentLoaded", () => {
    const app = document.getElementById("app");

    // ---- KARTICE ----
    const cards = [
        { id: "weather", name: "Vrijeme", endpoint: "/tbw?route=weather&city=Split" },
        { id: "traffic", name: "Promet uživo", endpoint: "/tbw?route=traffic&city=Split" },
        { id: "sea", name: "Stanje mora", endpoint: "/tbw?route=sea&city=Split" },
        { id: "shops", name: "Servisi", endpoint: "/tbw?route=services&city=Split" },
        { id: "bus", name: "Javni prijevoz", endpoint: "/tbw?route=transit&city=Split" },
        { id: "flights", name: "Letovi", endpoint: "/tbw?route=airport&city=Split" }
    ];

    // RENDER KARTICA
    app.innerHTML = `
        <div class="card-grid">
            ${cards.map(c => `
                <div class="card" data-endpoint="${c.endpoint}">
                    <h3>${c.name}</h3>
                    <p>Klikni za info</p>
                </div>
            `).join("")}
        </div>
    `;

    // ---- KLIK NA KARTICE ----
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const endpoint = card.getAttribute("data-endpoint");

            try {
                const res = await fetch(BACKEND_URL + endpoint);
                const data = await res.json();
                openModal(JSON.stringify(data, null, 2));

            } catch (err) {
                openModal("Greška pri učitavanju!");
            }
        });
    });
});

// ---- MODAL ----
function openModal(content) {
    const modal = document.getElementById("cardModal");
    modal.innerHTML = `
        <div class="modal-box">
            <pre>${content}</pre>
            <button id="closeModal">Zatvori</button>
        </div>
    `;
    modal.classList.remove("hidden");

    document.getElementById("closeModal").addEventListener("click", () => {
        modal.classList.add("hidden");
    });
}
