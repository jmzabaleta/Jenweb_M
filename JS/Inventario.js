document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.form-card');
  const tb = document.querySelector('#tablaProductos tbody');
  const inputBuscar = document.querySelector('#buscar');
  const selPageSize = document.querySelector('#pageSize');
  const paginacionDiv = document.querySelector('#paginacion');
  const btnExportCsv = document.querySelector('#exportCsv');

  let productos = JSON.parse(localStorage.getItem('productos')) || [];

  const guardar = () => localStorage.setItem('productos', JSON.stringify(productos));
  const money = n => `$${Number(n ?? 0).toFixed(2)}`;

  // Estado UI
  let filtroNombre = '';
  let currentPage = 1;
  let pageSize = parseInt(selPageSize?.value || '10', 10);

  // ================== FUNCIONES ==================
  function ordenar(a, b) {
    return (a.nombre || '').localeCompare(b.nombre || '');
  }

  function filtrar() {
    return productos
      .filter(p => (p.nombre || '').toLowerCase().includes(filtroNombre))
      .sort(ordenar);
  }

  function paginar(lista) {
    const total = lista.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = lista.slice(start, end);
    mostrarTabla(pageItems);
    mostrarPaginacion(totalPages);
  }

  function mostrarTabla(lista) {
    tb.innerHTML = '';
    if (lista.length === 0) {
      tb.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay productos</td></tr>`;
      return;
    }

    for (const p of lista) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.categoria}</td>
        <td class="price">${money(p.precio)}</td>
        <td class="${p.stock <= 0 ? 'stock-out' : p.stock < 5 ? 'stock-low' : 'stock-ok'}">${p.stock}</td>
        <td>
          <button class="btn btn-sm btn-outline editar">Editar</button>
          <button class="btn btn-sm btn-outline text-danger eliminar">Eliminar</button>
        </td>
      `;
      tr.querySelector('.editar').onclick = () => editarProducto(p);
      tr.querySelector('.eliminar').onclick = () => eliminarProducto(p);
      tb.appendChild(tr);
    }
  }

  function mostrarPaginacion(totalPages) {
    paginacionDiv.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = 'page-btn';
      if (i === currentPage) btn.setAttribute('aria-current', 'true');
      btn.onclick = () => {
        currentPage = i;
        paginar(filtrar());
      };
      paginacionDiv.appendChild(btn);
    }
  }

  function editarProducto(p) {
    const nombre = prompt('Nuevo nombre', p.nombre);
    if (nombre === null) return;
    const precio = parseFloat(prompt('Nuevo precio', p.precio));
    const stock = parseInt(prompt('Nuevo stock', p.stock));
    p.nombre = nombre;
    p.precio = precio;
    p.stock = stock;
    guardar();
    paginar(filtrar());
  }

  function eliminarProducto(p) {
    if (confirm(`¿Eliminar "${p.nombre}"?`)) {
      productos = productos.filter(x => x !== p);
      guardar();
      paginar(filtrar());
    }
  }

  function exportarCSV() {
    let csv = 'Nombre,Categoría,Precio,Stock\n';
    productos.forEach(p => {
      csv += `${p.nombre},${p.categoria},${p.precio},${p.stock}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'productos.csv';
    a.click();
  }

  // ================== EVENTOS ==================
  inputBuscar?.addEventListener('input', e => {
    filtroNombre = e.target.value.toLowerCase();
    currentPage = 1;
    paginar(filtrar());
  });

  selPageSize?.addEventListener('change', e => {
    pageSize = parseInt(e.target.value);
    currentPage = 1;
    paginar(filtrar());
  });

  btnExportCsv?.addEventListener('click', exportarCSV);

  // Inicializar tabla
  paginar(filtrar());
});
