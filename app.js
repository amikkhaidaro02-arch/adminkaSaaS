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
    document.getElementById("productCategory").innerText =
      `Категория: ${product.category}
       | Склад: ${product.warehouse}
       | Вес: ${product.weight}
       | Размер: ${product.size}`;

    document.getElementById("productInfo").classList.remove("d-none");
  } else {
    showModal("Ошибка", "Товар не найден", "danger");
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
    showModal("Ошибка", "Сначала отсканируй товар", "danger");
    return;
  }

  if (!qty || qty <= 0) {
    showModal("Ошибка", "Введите количество", "warning");
    return;
  }

  let data = JSON.parse(localStorage.getItem("inventory")) || [];
  data.push({
    id: currentProduct.id,
    name: currentProduct.name,
    category: currentProduct.category,
    warehouse: currentProduct.warehouse,
    weight: currentProduct.weight,
    size: currentProduct.size,
    quantity: qty,
    date: new Date()
  });



  localStorage.setItem("inventory", JSON.stringify(data));

  renderTable(); // 🔥 ВОТ ЭТО ГЛАВНОЕ

  document.getElementById("quantity").value = "";
  showModal("Готово", "Инвентаризация сохранена", "success");
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
        <td>${item.warehouse}</td>
        <td>${item.weight}</td>
        <td>${item.size}</td>
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
  const warehouse = document.getElementById("newWarehouse").value.trim();
  const weight = document.getElementById("newWeight").value.trim();
  const size = document.getElementById("newSize").value.trim();

  if (!id || !name || !category || !warehouse || !weight || !size) {
    showModal("Ошибка", "Заполни все поля", "danger");
    return;
  }

  let products = getProducts();

  if (products.find(p => p.id === id)) {
    showModal("Ошибка", "Товар с таким ID уже существует", "warning");
    return;
  }

  products.push({ id, name, category, warehouse, weight, size });
  saveProducts(products);

  showModal("Успех", "Товар добавлен", "success");

  document.getElementById("newId").value = "";
  document.getElementById("newName").value = "";
  document.getElementById("newCategory").value = "";
  document.getElementById("newWarehouse").value = "";
  document.getElementById("newWeight").value = "";
  document.getElementById("newSize").value = "";

  renderProducts();
  populateProductSelect();
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
        <td>${product.warehouse || "-"}</td>
        <td>${product.weight || "-"}</td>
        <td>${product.size || "-"}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editProduct(${index})">✏</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(${index})">❌</button>
        </td>
      </tr>
    `;
  });
}



function deleteProduct(index) {
  const products = getProducts();
  const product = products[index];

  document.getElementById("deleteIndex").value = index;
  document.getElementById("deleteMessage").innerText =
    `Вы действительно хотите удалить товар "${product.name}"?`;

  const modal = new bootstrap.Modal(document.getElementById("deleteConfirmModal"));
  modal.show();
}
function confirmDelete() {
  const index = document.getElementById("deleteIndex").value;

  let products = getProducts();
  products.splice(index, 1);

  saveProducts(products);
  renderProducts();
  populateProductSelect();

  bootstrap.Modal.getInstance(document.getElementById("deleteConfirmModal")).hide();

  showModal("Удалено", "Товар успешно удален", "danger");
}



function editProduct(index) {
  const products = getProducts();
  const product = products[index];

  document.getElementById("editIndex").value = index;
  document.getElementById("editName").value = product.name;
  document.getElementById("editCategory").value = product.category;
  document.getElementById("editWarehouse").value = product.warehouse || "";
  document.getElementById("editWeight").value = product.weight || "";
  document.getElementById("editSize").value = product.size || "";

  const modal = new bootstrap.Modal(document.getElementById("editProductModal"));
  modal.show();
}

function saveEditedProduct() {
  const index = document.getElementById("editIndex").value;

  let products = getProducts();

  products[index].name = document.getElementById("editName").value.trim();
  products[index].category = document.getElementById("editCategory").value.trim();
  products[index].warehouse = document.getElementById("editWarehouse").value.trim();
  products[index].weight = document.getElementById("editWeight").value.trim();
  products[index].size = document.getElementById("editSize").value.trim();

  saveProducts(products);

  renderProducts();
  populateProductSelect();

  bootstrap.Modal.getInstance(document.getElementById("editProductModal")).hide();

  showModal("Успех", "Товар обновлен", "success");
}


function exportExcel() {
  if (typeof XLSX === "undefined") {
    showModal("Информация", "Библиотека XLSX не подключена", "warning");
    return;
  }

  let data = JSON.parse(localStorage.getItem("inventory")) || [];

  if (!data.length) {
    showModal("Информация", "Нет данных для экспорта", "secondary");
    return;
  }

  const formattedData = data.map((item, index) => ({
    "№": index + 1,
    "ID": item.id,
    "Название": item.name,
    "Категория": item.category,
    "Склад": item.warehouse,
    "Вес": item.weight,
    "Размер": item.size,
    "Количество": Number(item.quantity),
    "Дата": new Date(item.date).toLocaleString()
  }));



  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

  XLSX.writeFile(workbook, "inventory.xlsx");
}

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.add('d-none');
  });

  document.getElementById(sectionId).classList.remove('d-none');

  // подсветка активной кнопки
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('text-primary');
    btn.classList.add('text-dark');
  });

  event.currentTarget.classList.remove('text-dark');
  event.currentTarget.classList.add('text-primary');
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

  if (!product) {
    showModal("Ошибка", "Товар не найден", "danger");
    return;
  }

  // очищаем старый QR
  document.getElementById("qrcode").innerHTML = "";

  // создаем новый QR
  new QRCode(document.getElementById("qrcode"), {
    text: product.id,
    width: 200,
    height: 200
  });

  // показываем кнопку
  const btn = document.getElementById("shareWhatsappBtn");
  btn.classList.remove("d-none");

  // передаём ПРАВИЛЬНЫЙ текст
  btn.onclick = function () {
    shareToWhatsApp(product);
  };
}

function shareToWhatsApp(product) {
  const message = encodeURIComponent(
    `QR код товара:
    ID: ${product.id}
    Название: ${product.name}
    Категория: ${product.category}
    Склад: ${product.warehouse}
    Вес: ${product.weight}
    Размер: ${product.size}`
      );

      const whatsappUrl = `https://wa.me/?text=${message}`;
      window.open(whatsappUrl, "_blank");
}


// обновляем список при загрузке
document.addEventListener("DOMContentLoaded", populateProductSelect);

function showModal(title, message, type = "primary") {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalBody").innerText = message;

  const modalHeader = document.querySelector("#appModal .modal-header");
  modalHeader.className = "modal-header bg-" + type + " text-white";

  const modal = new bootstrap.Modal(document.getElementById("appModal"));
  modal.show();
}


renderProducts();
