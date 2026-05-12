// Variable global para almacenar el ticket a editar
let currentEditTicket = null;

// Aplicación principal
function showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Actualizar menú activo
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Encontrar el link clickeado
    const links = document.querySelectorAll('.nav-menu a');
    links.forEach(link => {
        const onclick = link.getAttribute('onclick');
        if (onclick && onclick.includes(`'${sectionName}'`)) {
            link.classList.add('active');
        }
    });
    
    // Actualizar contenido según la sección
    switch(sectionName) {
        case 'dashboard':
            Dashboard.update();
            break;
        case 'tickets':
            filterTickets();
            break;
        case 'thermostats':
            if (typeof ThermostatManager !== 'undefined') {
                ThermostatManager.init();
            }
            break;
        case 'grilles':
            if (typeof GrilleManager !== 'undefined') {
                GrilleManager.init();
            }
            break;
        case 'logs':
            Dashboard.renderLogs();
            break;
        case 'edit-ticket':
            if (!currentEditTicket) {
                const editContainer = document.getElementById('editTicketContainer');
                const noTicket = document.getElementById('noTicketSelected');
                if (editContainer) editContainer.style.display = 'none';
                if (noTicket) noTicket.style.display = 'block';
            }
            break;
    }
}

function createTicket(event) {
    event.preventDefault();
    
    const ticketData = {
        condominium: document.getElementById('ticketCondominium').value,
        title: document.getElementById('ticketTitle').value,
        level: document.getElementById('ticketLevel').value,
        priority: document.getElementById('ticketPriority').value,
        description: document.getElementById('ticketDescription').value,
        system: document.getElementById('ticketSystem').value
    };
    
    TicketManager.create(ticketData);
    
    // Limpiar formulario
    document.getElementById('ticketForm').reset();
    
    // Mostrar mensaje de éxito
    alert('✅ Ticket creado exitosamente');
    
    // Actualizar dashboard
    Dashboard.update();
}

function editTicket(ticketId) {
    const ticket = TicketManager.getById(ticketId);
    
    if (ticket) {
        currentEditTicket = ticket;
        
        // Llenar formulario de edición
        document.getElementById('editTicketId').value = ticket.id;
        document.getElementById('editTicketCondominium').value = ticket.condominium || '';
        document.getElementById('editTicketTitle').value = ticket.title;
        document.getElementById('editTicketLevel').value = ticket.level;
        document.getElementById('editTicketPriority').value = ticket.priority;
        document.getElementById('editTicketDescription').value = ticket.description;
        document.getElementById('editTicketSystem').value = ticket.system;
        
        // Mostrar formulario
        document.getElementById('editTicketContainer').style.display = 'block';
        document.getElementById('noTicketSelected').style.display = 'none';
        
        // Cambiar a sección de edición
        showSection('edit-ticket');
    }
}

function updateTicket(event) {
    event.preventDefault();
    
    if (!currentEditTicket) return;
    
    const ticketData = {
        condominium: document.getElementById('editTicketCondominium').value,
        title: document.getElementById('editTicketTitle').value,
        level: document.getElementById('editTicketLevel').value,
        priority: document.getElementById('editTicketPriority').value,
        description: document.getElementById('editTicketDescription').value,
        system: document.getElementById('editTicketSystem').value
    };
    
    const success = TicketManager.update(currentEditTicket.id, ticketData);
    
    if (success) {
        alert('✅ Ticket actualizado exitosamente');
        cancelEdit();
        showSection('tickets');
        filterTickets();
        Dashboard.update();
    } else {
        alert('❌ Error al actualizar el ticket');
    }
}

function cancelEdit() {
    currentEditTicket = null;
    document.getElementById('editTicketForm').reset();
    document.getElementById('editTicketContainer').style.display = 'none';
    document.getElementById('noTicketSelected').style.display = 'block';
    showSection('tickets');
    filterTickets();
}

function closeTicket(ticketId) {
    if (confirm('¿Estás seguro de que deseas cerrar este ticket?')) {
        const success = TicketManager.close(ticketId);
        if (success) {
            filterTickets();
            Dashboard.update();
            alert('✅ Ticket cerrado exitosamente');
        }
    }
}

function deleteTicket(ticketId) {
    if (confirm('¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer.')) {
        const success = TicketManager.delete(ticketId);
        if (success) {
            filterTickets();
            Dashboard.update();
            alert('✅ Ticket eliminado exitosamente');
        }
    }
}

function filterTickets() {
    const status = document.getElementById('filterStatus').value;
    const level = document.getElementById('filterLevel').value;
    
    const filteredTickets = TicketManager.filter(status, level);
    TicketManager.renderList(filteredTickets, 'allTickets', true);
}

// Funciones para Termostatos
function saveThermostatConfig(event) {
    event.preventDefault();
    
    const level = document.getElementById('thermoLevel').value;
    const total = parseInt(document.getElementById('thermoTotal').value);
    const installed = parseInt(document.getElementById('thermoInstalled').value);
    
    if (installed > total) {
        alert('❌ Los termostatos instalados no pueden ser mayores que el total');
        return;
    }
    
    ThermostatManager.saveConfig(level, total, installed);
    
    // Limpiar formulario
    document.getElementById('thermostatConfigForm').reset();
    
    // Actualizar vista
    ThermostatManager.updateSummary();
    ThermostatManager.renderTable();
    Dashboard.update();
    
    alert('✅ Configuración de termostatos guardada exitosamente');
}

// Funciones para Rejillas
function saveGrilleConfig(event) {
    event.preventDefault();
    
    const level = document.getElementById('grilleLevel').value;
    const returnTotal = parseInt(document.getElementById('grilleTotalReturn').value);
    const returnInstalled = parseInt(document.getElementById('grilleInstalledReturn').value);
    const supplyTotal = parseInt(document.getElementById('grilleTotalSupply').value);
    const supplyInstalled = parseInt(document.getElementById('grilleInstalledSupply').value);
    
    if (returnInstalled > returnTotal) {
        alert('❌ Las rejillas de retorno instaladas no pueden ser mayores que el total');
        return;
    }
    
    if (supplyInstalled > supplyTotal) {
        alert('❌ Las rejillas de suministro instaladas no pueden ser mayores que el total');
        return;
    }
    
    GrilleManager.saveConfig(level, returnTotal, returnInstalled, supplyTotal, supplyInstalled);
    
    // Limpiar formulario
    document.getElementById('grilleConfigForm').reset();
    
    // Actualizar vista
    GrilleManager.updateSummary();
    GrilleManager.renderTable();
    Dashboard.update();
    
    alert('✅ Configuración de rejillas guardada exitosamente');
}

// Función para limpiar todos los datos
function cleanAllData() {
    if (confirm('⚠️ ¿Estás ABSOLUTAMENTE seguro?\n\nEsta acción eliminará:\n- Todos los tickets\n- Configuración de termostatos\n- Configuración de rejillas\n- Todos los logs\n\nEsta acción NO se puede deshacer.')) {
        if (confirm('⚠️ ÚLTIMA ADVERTENCIA\n\nSe borrarán TODOS los datos del sistema.\n¿Deseas continuar?')) {
            
            // Limpiar todo el localStorage
            localStorage.removeItem('domus_tickets');
            localStorage.removeItem('domus_logs');
            localStorage.removeItem('domus_thermostats');
            localStorage.removeItem('domus_grilles');
            
            // Actualizar interfaz
            Dashboard.update();
            
            // Mostrar mensaje
            alert('✅ Todos los datos han sido eliminados exitosamente.\nEl sistema está como nuevo.');
            
            // Recargar para asegurar limpieza completa
            location.reload();
        }
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar niveles en los formularios de tickets
    TicketManager.initLevels();
    
    // Inicializar módulos de termostatos y rejillas
    if (typeof ThermostatManager !== 'undefined') {
        ThermostatManager.init();
    }
    
    if (typeof GrilleManager !== 'undefined') {
        GrilleManager.init();
    }
    
    // Actualizar dashboard
    Dashboard.update();
});