document.addEventListener('DOMContentLoaded', () => {
  const listaProductos = document.getElementById('listaProductos');
  const carritoLineas = document.getElementById('carritoLineas');
  const totalVenta = document.getElementById('totalVenta');
  
  let productos = JSON.parse(localStorage.getItem('productos')) || [];
  let carrito = [];

  const money = n => `$${Number(n ?? 0).toFixed(2)}`;

  function renderProductos() {
    listaProductos.innerHTML = '';
    if (productos.length === 0) {
      listaProductos.innerHTML = `<p class="muted">No hay productos disponibles</p>`;
      return;
    }
    productos.forEach(p => {
      const div = document.createElement('div');
      div.className = 'producto-item';
      div.innerHTML = `
        <span>${p.nombre}</span>
        <span class="price">${money(p.precio)}</span>
        <button class="btn btn-sm btn-outline">Agregar</button>
      `;
      div.querySelector('button').onclick = () => agregarAlCarrito(p);
      listaProductos.appendChild(div);
    });
  }

  function agregarAlCarrito(prod) {
    const existente = carrito.find(i => i.nombre === prod.nombre);
    if (existente) {
      existente.cantidad++;
    } else {
      carrito.push({ ...prod, cantidad: 1 });
    }
    renderCarrito();
  }

  function renderCarrito() {
    carritoLineas.innerHTML = '';
    carrito.forEach(item => {
      const div = document.createElement('div');
      div.className = 'carrito-linea';
      div.innerHTML = `
        <span>${item.nombre}</span>
        <span>${item.cantidad}</span>
        <span>${money(item.precio)}</span>
        <span>${money(item.precio * item.cantidad)}</span>
      `;
      carritoLineas.appendChild(div);
    });
    const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
    totalVenta.textContent = money(total);
  }

  renderProductos();
});
