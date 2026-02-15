function getProducts() {
  return JSON.parse(localStorage.getItem("products")) || [];
}

function saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}


let currentProduct = null;

function onScanSuccess(decodedText) {
  const products = getProducts();
  const product = products.find(p => p.id === decodedText);

  if (product) {
    currentProduct = product;
    document.getElementById("productName").innerText = product.name;
    document.getElementById("productCategory").innerText = product.category;
    document.getElementById("productInfo").classList.remove("d-none");
  } else {
    alert("Товар не найден");
  }
}

let html5QrCode = null;
let cameraRunning = false;

function startCamera() {
  if (cameraRunning) return;

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    onScanSuccess
  ).then(() => {
    cameraRunning = true;
  }).catch(err => {
    console.error("Ошибка камеры:", err);
  });
}

function stopCamera() {
  if (!cameraRunning) return;

  html5QrCode.stop().then(() => {
    cameraRunning = false;
  });
}

function saveInventory() {
  const qty = document.getElementById("quantity").value;

  if (!currentProduct) {
    alert("Сначала отсканируй товар");
    return;
  }

  if (!qty || qty <= 0) {
    alert("Введите количество");
    return;
  }

  let data = JSON.parse(localStorage.getItem("inventory")) || [];
  data.push({
    id: currentProduct.id,
    name: currentProduct.name,
    category: currentProduct.category,
    quantity: qty,
    date: new Date()
  });

  localStorage.setItem("inventory", JSON.stringify(data));

  renderTable(); // 🔥 ВОТ ЭТО ГЛАВНОЕ

  document.getElementById("quantity").value = "";
  alert("Сохранено");
}


function renderTable() {
  let data = JSON.parse(localStorage.getItem("inventory")) || [];
  const table = document.getElementById("inventoryTable");
  table.innerHTML = "";

  data.forEach((item, index) => {
    table.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.quantity}</td>
        <td>${new Date(item.date).toLocaleString()}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteItem(${index})">
            ❌
          </button>
        </td>
      </tr>
    `;
  });
}

function deleteItem(index) {
  let data = JSON.parse(localStorage.getItem("inventory")) || [];
  data.splice(index, 1);
  localStorage.setItem("inventory", JSON.stringify(data));
  renderTable();
}

document.addEventListener("DOMContentLoaded", function () {
  renderProducts();
  renderTable();
});


function addProduct() {
  const id = document.getElementById("newId").value.trim();
  const name = document.getElementById("newName").value.trim();
  const category = document.getElementById("newCategory").value.trim();

  if (!id || !name || !category) {
    alert("Заполни все поля");
    return;
  }

  let products = getProducts();

  if (products.find(p => p.id === id)) {
    alert("Товар с таким ID уже существует");
    return;
  }

  products.push({ id, name, category });
  saveProducts(products);

  alert("Товар добавлен");

  document.getElementById("newId").value = "";
  document.getElementById("newName").value = "";
  document.getElementById("newCategory").value = "";
}

function renderProducts() {
  const products = getProducts();
  const table = document.getElementById("productsTable");
  table.innerHTML = "";

  products.forEach((product, index) => {
    table.innerHTML += `
      <tr>
        <td>${product.id}</td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editProduct(${index})">✏</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${index})">❌</button>
        </td>
      </tr>
    `;
  });
}

function deleteProduct(index) {
  let products = getProducts();
  products.splice(index, 1);
  saveProducts(products);
  renderProducts();
}


function editProduct(index) {
  let products = getProducts();
  let product = products[index];

  const newName = prompt("Новое название:", product.name);
  const newCategory = prompt("Новая категория:", product.category);

  if (newName && newCategory) {
    product.name = newName;
    product.category = newCategory;

    saveProducts(products);
    renderProducts();
  }
}
function exportExcel() {
  if (typeof XLSX === "undefined") {
    alert("Библиотека XLSX не подключена");
    return;
  }

  let data = JSON.parse(localStorage.getItem("inventory")) || [];

  if (!data.length) {
    alert("Нет данных для экспорта");
    return;
  }

  const formattedData = data.map((item, index) => ({
    "№": index + 1,
    "ID": item.id,
    "Название": item.name,
    "Категория": item.category,
    "Количество": Number(item.quantity),
    "Дата": new Date(item.date).toLocaleString()
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

  XLSX.writeFile(workbook, "inventory.xlsx");
}

function showSection(sectionId) {
  const sections = document.querySelectorAll(".section");

  sections.forEach(section => {
    section.classList.add("d-none");
  });

  document.getElementById(sectionId).classList.remove("d-none");

  // 🔥 управление камерой
  if (sectionId === "inventorySection") {
    setTimeout(() => {
      startCamera();
    }, 300);
  } else {
    stopCamera();
  }
}

// Подключение библиотеки QRCode.js (через CDN)
const script = document.createElement("script");
script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
document.head.appendChild(script);

function populateProductSelect() {
  const select = document.getElementById("productSelect");
  select.innerHTML = "";

  const products = getProducts();
  products.forEach(p => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.name} (${p.id})`;
    select.appendChild(option);
  });
}

function generateQR() {
  const id = document.getElementById("productSelect").value;
  const products = getProducts();
  const product = products.find(p => p.id === id);

  if (!product) return alert("Товар не найден");

  // очищаем предыдущий QR
  document.getElementById("qrcode").innerHTML = "";

  // создаем новый
  new QRCode(document.getElementById("qrcode"), {
    text: product.id,
    width: 200,
    height: 200
  });
}

// обновляем список при загрузке
document.addEventListener("DOMContentLoaded", populateProductSelect);



renderProducts();
