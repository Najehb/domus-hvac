// Módulo de gestión de tickets
const TicketManager = {
    // Generar niveles del 1 al 13 (solo un Lobby)
    generateLevels: function() {
        const levels = ['Lobby'];
        for (let i = 2; i <= 13; i++) {
            levels.push(`Nivel ${i}`);
        }
        return levels;
    },
    
    // Inicializar niveles en los select
    initLevels: function() {
        const levels = this.generateLevels();
        const levelSelects = ['ticketLevel', 'filterLevel', 'editTicketLevel'];
        
        levelSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                // Limpiar opciones existentes
                select.innerHTML = '<option value="">Seleccionar nivel</option>';
                
                // Agregar niveles
                levels.forEach(level => {
                    const option = document.createElement('option');
                    option.value = level;
                    option.textContent = level;
                    select.appendChild(option);
                });
                
                // Si es el filtro, agregar opción "Todos"
                if (selectId === 'filterLevel') {
                    select.innerHTML = '<option value="all">Todos los Niveles</option>' + select.innerHTML;
                    select.querySelector('option[value="all"]').selected = true;
                }
            }
        });
    },
    
    // Crear nuevo ticket
    create: function(ticketData) {
        const tickets = Storage.getTickets();
        const newTicket = {
            id: Date.now(),
            condominium: ticketData.condominium,
            title: ticketData.title,
            level: ticketData.level,
            priority: ticketData.priority,
            description: ticketData.description,
            system: ticketData.system,
            status: 'abierto',
            createdAt: new Date().toLocaleString(),
            updatedAt: new Date().toLocaleString()
        };
        
        tickets.push(newTicket);
        Storage.saveTickets(tickets);
        Storage.addLog('creación', newTicket.id, newTicket.title, newTicket.condominium);
        
        return newTicket;
    },
    
    // Actualizar ticket
    update: function(ticketId, ticketData) {
        const tickets = Storage.getTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (ticket) {
            ticket.condominium = ticketData.condominium;
            ticket.title = ticketData.title;
            ticket.level = ticketData.level;
            ticket.priority = ticketData.priority;
            ticket.description = ticketData.description;
            ticket.system = ticketData.system;
            ticket.updatedAt = new Date().toLocaleString();
            
            Storage.saveTickets(tickets);
            Storage.addLog('modificación', ticket.id, ticket.title, ticket.condominium);
            return true;
        }
        return false;
    },
    
    // Cerrar ticket
    close: function(ticketId) {
        const tickets = Storage.getTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (ticket) {
            ticket.status = 'cerrado';
            ticket.updatedAt = new Date().toLocaleString();
            Storage.saveTickets(tickets);
            Storage.addLog('cierre', ticket.id, ticket.title, ticket.condominium);
            return true;
        }
        return false;
    },
    
    // Eliminar ticket
    delete: function(ticketId) {
        const tickets = Storage.getTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        const newTickets = tickets.filter(t => t.id !== ticketId);
        
        if (ticket && newTickets.length < tickets.length) {
            Storage.saveTickets(newTickets);
            Storage.addLog('eliminación', ticket.id, ticket.title, ticket.condominium);
            return true;
        }
        return false;
    },
    
    // Obtener ticket por ID
    getById: function(ticketId) {
        const tickets = Storage.getTickets();
        return tickets.find(t => t.id === ticketId);
    },
    
    // Filtrar tickets
    filter: function(status = 'all', level = 'all', condominium = 'all') {
        let tickets = Storage.getTickets();
        
        if (status !== 'all') {
            tickets = tickets.filter(t => t.status === status);
        }
        
        if (level !== 'all') {
            tickets = tickets.filter(t => t.level === level);
        }
        
        if (condominium !== 'all') {
            tickets = tickets.filter(t => t.condominium === condominium);
        }
        
        return tickets;
    },
    
    // Renderizar lista de tickets
    renderList: function(tickets, containerId, showEditButton = false) {
        const container = document.getElementById(containerId);
        
        if (tickets.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No hay tickets para mostrar</p>';
            return;
        }
        
        let html = '';
        tickets.forEach(ticket => {
            const priorityClass = `priority-${ticket.priority}`;
            const statusClass = `status-${ticket.status}`;
            
            html += `
                <div class="ticket-item">
                    <div class="ticket-info">
                        <h4>${ticket.title} 
                            <small style="color: #666;">[${ticket.condominium}]</small>
                        </h4>
                        <div class="ticket-meta">
                            <span class="${priorityClass}">[${ticket.priority.toUpperCase()}]</span>
                            ${ticket.level} | ${ticket.system} | Creado: ${ticket.createdAt}
                        </div>
                        <p style="margin-top: 5px; color: #666;">${ticket.description}</p>
                        ${ticket.updatedAt !== ticket.createdAt ? 
                            `<small style="color: #999;">Última modificación: ${ticket.updatedAt}</small>` : 
                            ''}
                    </div>
                    <div class="ticket-actions">
                        <span class="status-badge status-${ticket.status}">${ticket.status}</span>
                        ${ticket.status !== 'cerrado' ? 
                            `<button class="btn-close" onclick="closeTicket(${ticket.id})">Cerrar</button>` : 
                            ''}
                        <button class="btn-edit" onclick="editTicket(${ticket.id})">Modificar</button>
                        <button class="btn-delete" onclick="deleteTicket(${ticket.id})">Eliminar</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
};