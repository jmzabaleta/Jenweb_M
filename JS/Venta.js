document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'jenapp_productos';

  const safeGet = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const safeSet = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  let productos = safeGet(STORAGE_KEY) ?? safeGet('productos') ?? [];
  const listaProductos = document.getElementById('listaProductos');
  const carritoLineas = document.getElementById('carritoLineas');
  const totalVenta = document.getElementById('totalVenta');
  const btnRegistrar = document.getElementById('btnRegistrarVenta') 
                    || document.querySelector('aside.card .btn.btn-primary.w-100'); // fallback
  const inputBuscar = document.getElementById('buscarProducto');
  const filtroCategoria = document.getElementById('filtroCategoria');

  const money = n => `$${Number(n ?? 0).toFixed(2)}`;
  let carrito = [];
  let criterio = '';

  // --------- Render catálogo ---------
  function renderProductos(){
    listaProductos.innerHTML = '';
    // Filtrado simple por nombre y categoría
    let lista = productos.filter(p => (p.nombre||'').toLowerCase().includes(criterio));
    const cat = (filtroCategoria?.value || '').trim();
    if(cat) lista = lista.filter(p => (p.categoria||'') === cat);

    if(lista.length === 0){
      listaProductos.innerHTML = `<p class="muted">No hay productos para mostrar</p>`;
      return;
    }

    lista.forEach(p => {
      const div = document.createElement('div');
      div.className = 'producto-item';
      div.innerHTML = `
        <span>${p.nombre}</span>
        <span class="price">${money(p.precio)}</span>
        <button class="btn btn-sm btn-outline" ${p.stock<=0 ? 'disabled' : ''}>${p.stock<=0 ? 'Sin stock' : 'Agregar'}</button>
      `;
      div.querySelector('button').onclick = () => agregar(p);
      listaProductos.appendChild(div);
    });
  }

  // Llenar select de categorías (si existen)
  (function fillCategorias(){
    if(!filtroCategoria) return;
    const cats = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort();
    filtroCategoria.innerHTML = `<option value="">Todas</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join('');
  })();

  // --------- Carrito ---------
  function agregar(prod){
    if(prod.stock <= 0){ alert('Sin stock'); return; }
    const it = carrito.find(x => x.nombre === prod.nombre);
    if(it) it.cantidad++;
    else carrito.push({ nombre: prod.nombre, precio: prod.precio, cantidad: 1 });
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
    const total = carrito.reduce((a,i)=> a + i.precio * i.cantidad, 0);
    totalVenta.textContent = money(total);
  }

  // --------- Registrar venta (descuenta stock + guarda) ---------
 function registrarVenta(){
  if(carrito.length === 0){
    alert('No hay productos en el carrito.');
    return;
  }

  // Verificar stock suficiente
  for(const item of carrito){
    const p = productos.find(x => x.nombre === item.nombre);
    if(!p || p.stock < item.cantidad){
      alert(`Stock insuficiente para "${item.nombre}". Disponible: ${p ? p.stock : 0}`);
      return;
    }
  }

  // Descontar stock
  for(const item of carrito){
    const p = productos.find(x => x.nombre === item.nombre);
    p.stock -= item.cantidad;
  }

  // Guardar nueva venta
  const ventas = JSON.parse(localStorage.getItem('jenapp_ventas') || '[]');
  const nuevaVenta = {
    id: ventas.length + 1,
    fecha: new Date().toISOString(),
    productos: carrito.map(x => ({ nombre: x.nombre, cantidad: x.cantidad, precio: x.precio })),
    total: carrito.reduce((a, i) => a + i.precio * i.cantidad, 0)
  };
  ventas.push(nuevaVenta);
  localStorage.setItem('jenapp_ventas', JSON.stringify(ventas));

  // Actualizar inventario
  localStorage.setItem('jenapp_productos', JSON.stringify(productos));

  carrito = [];
  renderCarrito();
  renderProductos();

  alert('Venta registrada ✅');
}

  // --------- Eventos ---------
  inputBuscar?.addEventListener('input', e => { criterio = e.target.value.toLowerCase(); renderProductos(); });
  filtroCategoria?.addEventListener('change', renderProductos);
  btnRegistrar?.addEventListener('click', (e) => { e.preventDefault(); registrarVenta(); });

  // --------- Init ---------
  // Si no hay productos en este origen (Pages), no bloquees, pero informa en consola.
  if(productos.length === 0){
    console.warn('No hay productos en localStorage del dominio GitHub Pages. Cárgalos desde Inventario o implementa un import JSON.');
  }
  renderProductos();
  renderCarrito();
});

// --------- Mostrar historial ---------
const btnVerHistorial = document.getElementById('btnVerHistorial');
const tablaVentas = document.getElementById('tablaVentas');
const historialDiv = document.getElementById('historialVentas');

btnVerHistorial?.addEventListener('click', () => {
  const ventas = JSON.parse(localStorage.getItem('jenapp_ventas') || '[]');
  if(ventas.length === 0){
    alert('Aún no hay ventas registradas.');
    return;
  }

  historialDiv.classList.toggle('hidden');
  tablaVentas.innerHTML = '';
  ventas.forEach(v => {
    const tr = document.createElement('tr');
    const fecha = new Date(v.fecha).toLocaleString();
    const productos = v.productos.map(p => `${p.nombre} (${p.cantidad})`).join(', ');
    tr.innerHTML = `
      <td>${v.id}</td>
      <td>${fecha}</td>
      <td>${productos}</td>
      <td class="price">$${v.total.toFixed(2)}</td>
    `;
    tablaVentas.appendChild(tr);
  });
});

