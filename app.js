const form = document.getElementById("transactionForm");
const description = document.getElementById("description");
const amount = document.getElementById("amount");
const type = document.getElementById("type");
const list = document.getElementById("transactionList");

const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");

const category = document.getElementById("category");
const dateInput = document.getElementById("date");

const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const sortBy = document.getElementById("sortBy");

const budgetInput = document.getElementById("budgetInput");
const setBudgetBtn = document.getElementById("setBudgetBtn");

let expenseChart;

/* =========================
   STATE MANAGEMENT
========================= */

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let monthlyBudget = Number(localStorage.getItem("monthlyBudget")) || 0;

budgetInput.value = monthlyBudget;

/* =========================
   LOCAL STORAGE
========================= */

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function saveBudget() {
    localStorage.setItem("monthlyBudget", monthlyBudget);
}

/* =========================
   ADD TRANSACTION
========================= */

form.addEventListener("submit", function (e) {
    e.preventDefault();

    const transaction = {
        id: Date.now(),
        description: description.value.trim(),
        amount: Number(amount.value),
        type: type.value,
        category: category.value,
        date: dateInput.value
    };

    if (!transaction.description || transaction.amount <= 0 || !transaction.date) {
        alert("Please enter valid details");
        return;
    }

    transactions.push(transaction);
    saveTransactions();
    updateUI();
    form.reset();
});

/* =========================
   DELETE TRANSACTION
========================= */

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
}

/* =========================
   MAIN RENDER FUNCTION
========================= */

function updateUI() {

    list.innerHTML = "";

    let totalIncome = 0;
    let totalExpense = 0;

    // ===== CALCULATIONS =====
    transactions.forEach(t => {
        if (t.type === "income") {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }
    });

    // ===== FILTER PIPELINE =====
    let filtered = [...transactions];

    // Search
    filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchInput.value.toLowerCase())
    );

    // Category Filter
    if (filterCategory.value !== "all") {
        filtered = filtered.filter(t => t.category === filterCategory.value);
    }

    // Sorting
    switch (sortBy.value) {
        case "newest":
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case "oldest":
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case "high":
            filtered.sort((a, b) => b.amount - a.amount);
            break;
        case "low":
            filtered.sort((a, b) => a.amount - b.amount);
            break;
    }

    // ===== TABLE RENDER =====
    filtered.forEach(t => {

        const row = document.createElement("tr");
        row.classList.add(t.type === "income" ? "income-row" : "expense-row");

        row.innerHTML = `
      <td>${t.description}</td>
      <td>${t.category}</td>
      <td>${t.date}</td>
      <td>${t.type}</td>
      <td>₹${t.amount}</td>
      <td><button onclick="deleteTransaction(${t.id})">X</button></td>
    `;

        list.appendChild(row);
    });

    // ===== DASHBOARD UPDATE =====
    income.textContent = "₹" + totalIncome;
    expense.textContent = "₹" + totalExpense;

    const currentBalance = totalIncome - totalExpense;
    balance.textContent = "₹" + currentBalance;

    balance.style.color = currentBalance < 0 ? "#dc2626" : "#2563eb";

    // ===== BUDGET BAR UPDATE =====
    updateBudgetStatus(totalExpense);

    // ===== UPDATE CHART =====
    updateChart(filtered);
}

/* =========================
   BUDGET LOGIC
========================= */

setBudgetBtn.addEventListener("click", () => {
    monthlyBudget = Number(budgetInput.value);
    saveBudget();
    updateUI();
});

function updateBudgetStatus(totalExpense) {

    const bar = document.getElementById("budgetBar");

    if (!bar) return;

    if (!monthlyBudget || monthlyBudget <= 0) {
        bar.style.width = "0%";
        return;
    }

    const percentUsed = (totalExpense / monthlyBudget) * 100;
    bar.style.width = Math.min(percentUsed, 100) + "%";

    if (percentUsed > 100) {
        bar.style.background = "#dc2626";
    } else if (percentUsed > 75) {
        bar.style.background = "#f59e0b";
    } else {
        bar.style.background = "#22c55e";
    }
}

/* =========================
   CHART LOGIC
========================= */

function updateChart(data) {

    const ctx = document.getElementById("expenseChart");
    if (!ctx) return;

    const categoryTotals = {};

    data.forEach(t => {
        if (t.type === "expense") {
            categoryTotals[t.category] =
                (categoryTotals[t.category] || 0) + t.amount;
        }
    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    "#ef4444",
                    "#f97316",
                    "#eab308",
                    "#22c55e",
                    "#3b82f6",
                    "#8b5cf6"
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "70%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        padding: 20,
                        boxWidth: 14
                    }
                }
            }
        }
    });
}
/* =========================
   DARK MODE TOGGLE
========================= */

const toggleBtn = document.getElementById("themeToggle");

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️";
}

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        localStorage.setItem("theme", "dark");
        toggleBtn.textContent = "☀️";
    } else {
        localStorage.setItem("theme", "light");
        toggleBtn.textContent = "🌙";
    }
});


searchInput.addEventListener("input", updateUI);
filterCategory.addEventListener("change", updateUI);
sortBy.addEventListener("change", updateUI);

updateUI();