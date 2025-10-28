document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'jenapp_productos';
  const safeGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  let productos = safeGet(STORAGE_KEY) ?? safeGet('productos') ?? [];
  // Si no hay productos, muestra aviso
  if(productos.length === 0){
    productos = [
      { nombre:'Producto demo', categoria:'General', precio: 1.0, stock: 5 }
    ];
  }

  const listaProductos = document.getElementById('listaProductos');
  const carritoLineas = document.getElementById('carritoLineas');
  const totalVenta = document.getElementById('totalVenta');
  const money = n => `$${Number(n ?? 0).toFixed(2)}`;
  let carrito = [];

  function renderProductos(){
    listaProductos.innerHTML = '';
    productos.forEach(p=>{
      const div = document.createElement('div');
      div.className = 'producto-item';
      div.innerHTML = `
        <span>${p.nombre}</span>
        <span class="price">${money(p.precio)}</span>
        <button class="btn btn-sm btn-outline">Agregar</button>
      `;
      div.querySelector('button').onclick = () => agregar(p);
      listaProductos.appendChild(div);
    });
  }

  function agregar(prod){
    if(prod.stock <= 0){ alert('Sin stock'); return; }
    const it = carrito.find(x => x.nombre === prod.nombre);
    if(it){ it.cantidad++; } else { carrito.push({...prod, cantidad:1}); }
    renderCarrito();
  }

  function renderCarrito(){
    carritoLineas.innerHTML = '';
    carrito.forEach(i=>{
      const d = document.createElement('div');
      d.className = 'carrito-linea';
      d.innerHTML = `
        <span>${i.nombre}</span>
        <span>${i.cantidad}</span>
        <span>${money(i.precio)}</span>
        <span>${money(i.precio * i.cantidad)}</span>
      `;
      carritoLineas.appendChild(d);
    });
    const total = carrito.reduce((a,i)=>a + i.precio*i.cantidad, 0);
    totalVenta.textContent = money(total);
  }

  renderProductos();
});
