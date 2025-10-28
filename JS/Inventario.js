document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'jenapp_productos';

  // --- localStorage seguro ---
  const safeLS = {
    get(key) {
      try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    set(key, val) {
      try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }
  };

  // Intenta leer primero la nueva clave; si no, la vieja; si nada, seed demo
  let productos = safeLS.get(STORAGE_KEY)
             ?? safeLS.get('productos')   // compatibilidad con tu clave anterior
             ?? [
                  { nombre: 'Café 250g', categoria: 'Bebidas', precio: 7.5, stock: 12 },
                  { nombre: 'Azúcar 1kg', categoria: 'Abarrotes', precio: 2.9, stock: 20 },
                  { nombre: 'Leche 1L', categoria: 'Lácteos', precio: 1.6, stock: 8 },
                  { nombre: 'Pan baguette', categoria: 'Panadería', precio: 1.2, stock: 0 }
                ];

  const guardar = () => safeLS.set(STORAGE_KEY, productos);
  const money = n => `$${Number(n ?? 0).toFixed(2)}`;

  // ---- UI refs
  const tb = document.querySelector('#tablaProductos tbody');
  const inputBuscar = document.querySelector('#buscar');
  const selPageSize = document.querySelector('#pageSize');
  const paginacionDiv = document.querySelector('#paginacion');
  const btnExportCsv = document.querySelector('#exportCsv');

  // Estado
  let filtroNombre = '';
  let currentPage = 1;
  let pageSize = parseInt(selPageSize?.value || '10', 10);

  function ordenar(a, b){ return (a.nombre || '').localeCompare(b.nombre || ''); }
  function filtrar(){ return productos.filter(p => (p.nombre||'').toLowerCase().includes(filtroNombre)).sort(ordenar); }

  function paginar(lista){
    const totalPages = Math.max(1, Math.ceil(lista.length / pageSize));
    if(currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const pageItems = lista.slice(start, start + pageSize);
    mostrarTabla(pageItems);
    mostrarPaginacion(totalPages);
  }

  function mostrarTabla(lista){
    tb.innerHTML = '';
    if(lista.length === 0){
      tb.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay productos</td></tr>`;
      return;
    }
    for(const p of lista){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.categoria ?? ''}</td>
        <td class="price">${money(p.precio)}</td>
        <td class="${p.stock <= 0 ? 'stock-out' : p.stock < 5 ? 'stock-low' : 'stock-ok'}">${p.stock}</td>
        <td>
          <button class="btn btn-sm btn-outline editar">Editar</button>
          <button class="btn btn-sm btn-outline text-danger eliminar">Eliminar</button>
        </td>
      `;
      tr.querySelector('.editar').onclick = () => editar(p);
      tr.querySelector('.eliminar').onclick = () => eliminar(p);
      tb.appendChild(tr);
    }
  }

  function mostrarPaginacion(totalPages){
    paginacionDiv.innerHTML = '';
    for(let i=1;i<=totalPages;i++){
      const b = document.createElement('button');
      b.textContent = i;
      b.className = 'page-btn';
      if(i===currentPage) b.setAttribute('aria-current','true');
      b.onclick = () => { currentPage = i; paginar(filtrar()); };
      paginacionDiv.appendChild(b);
    }
  }

  function editar(p){
    const nombre = prompt('Nuevo nombre', p.nombre); if(nombre===null) return;
    const precio = parseFloat(prompt('Nuevo precio', p.precio)); if(Number.isNaN(precio)) return;
    const stock = parseInt(prompt('Nuevo stock', p.stock)); if(Number.isNaN(stock)) return;
    p.nombre = nombre; p.precio = precio; p.stock = stock;
    guardar(); paginar(filtrar());
  }

  function eliminar(p){
    if(confirm(`¿Eliminar "${p.nombre}"?`)){
      productos = productos.filter(x => x !== p);
      guardar(); paginar(filtrar());
    }
  }

  function exportarCSV(){
    let csv = 'Nombre,Categoría,Precio,Stock\n';
    productos.forEach(p => { csv += `${p.nombre},${p.categoria??''},${p.precio},${p.stock}\n`; });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'productos.csv';
    a.click();
  }

  // Eventos
  inputBuscar?.addEventListener('input', e => { filtroNombre = e.target.value.toLowerCase(); currentPage=1; paginar(filtrar()); });
  selPageSize?.addEventListener('change', e => { pageSize = parseInt(e.target.value,10); currentPage=1; paginar(filtrar()); });
  btnExportCsv?.addEventListener('click', exportarCSV);

  // Primer render
  guardar(); // asegura persistencia de la clave nueva en este origen
  paginar(filtrar());
});
