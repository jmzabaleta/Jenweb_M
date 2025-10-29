document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'jenapp_productos';

  // ---------- localStorage seguro ----------
  const safe = {
    get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  // Datos
  let productos = safe.get(STORAGE_KEY)
             ?? safe.get('productos')
             ?? [
                  { nombre: 'Café 250g', categoria: 'Bebidas', precio: 7.5, stock: 12, desc: '' },
                  { nombre: 'Azúcar 1kg', categoria: 'Abarrotes', precio: 2.9, stock: 20, desc: '' },
                  { nombre: 'Leche 1L', categoria: 'Lácteos', precio: 1.6, stock: 8,  desc: '' },
                  { nombre: 'Pan baguette', categoria: 'Panadería', precio: 1.2, stock: 0,  desc: '' }
                ];
  const guardarLS = () => safe.set(STORAGE_KEY, productos);
  const money = n => `$${Number(n ?? 0).toFixed(2)}`;

  // ---------- UI refs ----------
  const tb = document.querySelector('#tablaProductos tbody');
  const inputBuscar = document.querySelector('#buscar');
  const selPageSize = document.querySelector('#pageSize');
  const paginacionDiv = document.querySelector('#paginacion');

  const formCard = document.querySelector('.form-card');
  const formControls = formCard?.querySelectorAll('.form-control') || [];
  const [inpNombre, inpCategoria, inpPrecio, inpStock, txtDesc] = [...formControls];
  const btnGuardar = formCard?.querySelector('.btn.btn-primary');

  // Estado
  let filtroNombre = '';
  let currentPage = 1;
  let pageSize = parseInt(selPageSize?.value || '10', 10);
  let editIndex = null; // null = creando; número = editando

  // ---------- Helpers ----------
  const ordenar = (a,b) => (a.nombre||'').localeCompare(b.nombre||'');
  const filtrar = () => productos
    .filter(p => (p.nombre||'').toLowerCase().includes(filtroNombre))
    .sort(ordenar);

  function paginar(lista){
    const totalPages = Math.max(1, Math.ceil(lista.length / pageSize));
    if(currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage-1) * pageSize;
    const items = lista.slice(start, start + pageSize);
    renderTabla(items);
    renderPaginacion(totalPages);
  }

  function renderTabla(lista){
    tb.innerHTML = '';
    if(lista.length === 0){
      tb.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No hay productos</td></tr>`;
      return;
    }
    lista.forEach(p => {
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
      tr.querySelector('.editar').onclick = () => prepararEdicion(p);
      tr.querySelector('.eliminar').onclick = () => eliminarProducto(p);
      tb.appendChild(tr);
    });
  }

  function renderPaginacion(totalPages){
    paginacionDiv.innerHTML = '';
    for(let i=1;i<=totalPages;i++){
      const b = document.createElement('button');
      b.textContent = i;
      b.className = 'page-btn';
      if(i === currentPage) b.setAttribute('aria-current','true');
      b.onclick = () => { currentPage = i; paginar(filtrar()); };
      paginacionDiv.appendChild(b);
    }
  }

  function limpiarFormulario(){
    if(!formCard) return;
    inpNombre.value = '';
    inpCategoria.value = '';
    inpPrecio.value = '';
    inpStock.value = '';
    txtDesc.value = '';
    editIndex = null;
    btnGuardar.textContent = 'Guardar';
  }

  function prepararEdicion(p){
    // Buscar índice real en productos
    const idx = productos.findIndex(x => x === p);
    if(idx === -1) return;
    editIndex = idx;
    // Cargar en el formulario
    if(formCard){
      inpNombre.value = p.nombre ?? '';
      inpCategoria.value = p.categoria ?? '';
      inpPrecio.value = p.precio ?? '';
      inpStock.value = p.stock ?? '';
      txtDesc.value = p.desc ?? '';
      btnGuardar.textContent = 'Actualizar';
      // Scroll al formulario (opcional)
      formCard.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }

  function eliminarProducto(p){
    if(confirm(`¿Eliminar "${p.nombre}"?`)){
      productos = productos.filter(x => x !== p);
      guardarLS();
      paginar(filtrar());
      // Si estaba editando este, limpia form
      if(editIndex !== null && productos[editIndex] !== p) limpiarFormulario();
    }
  }

  function guardarDesdeFormulario(){
    if(!formCard) return;
    const nombre = (inpNombre.value || '').trim();
    const categoria = (inpCategoria.value || '').trim();
    const precio = parseFloat(inpPrecio.value);
    const stock = parseInt(inpStock.value, 10);
    const desc = (txtDesc.value || '').trim();

    // Validación simple
    if(!nombre){ alert('El nombre es obligatorio'); return; }
    if(Number.isNaN(precio) || precio < 0){ alert('Precio inválido'); return; }
    if(Number.isNaN(stock)  || stock < 0){ alert('Stock inválido'); return; }

    if(editIndex === null){
      // Crear
      productos.push({ nombre, categoria, precio, stock, desc });
    }else{
      // Actualizar
      productos[editIndex] = { nombre, categoria, precio, stock, desc };
    }
    guardarLS();
    limpiarFormulario();
    paginar(filtrar());
  }

  function exportarCSV(){
    let csv = 'Nombre,Categoría,Precio,Stock,Descripción\n';
    productos.forEach(p => {
      csv += `${p.nombre},${p.categoria??''},${p.precio},${p.stock},"${(p.desc??'').replace(/"/g,'""')}"\n`;
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
    a.download = 'productos.csv';
    a.click();
  }

  // ---------- Eventos ----------
  inputBuscar?.addEventListener('input', e => {
    filtroNombre = e.target.value.toLowerCase();
    currentPage = 1;
    paginar(filtrar());
  });
  selPageSize?.addEventListener('change', e => {
    pageSize = parseInt(e.target.value, 10);
    currentPage = 1;
    paginar(filtrar());
  });

  if(btnGuardar){
    btnGuardar.addEventListener('click', (e) => {
      e.preventDefault();
      guardarDesdeFormulario();
    });
  }
  document.querySelector('#exportCsv')?.addEventListener('click', exportarCSV);

  // ---------- Init ----------
  guardarLS();      // asegura clave propia en este origen (GitHub Pages)
  paginar(filtrar());
});
