// Sistema de almacenamiento local
const Storage = {
    // Obtener todos los tickets
    getTickets: function() {
        const tickets = localStorage.getItem('domus_tickets');
        return tickets ? JSON.parse(tickets) : [];
    },
    
    // Guardar tickets
    saveTickets: function(tickets) {
        localStorage.setItem('domus_tickets', JSON.stringify(tickets));
    },
    
    // Obtener logs
    getLogs: function() {
        const logs = localStorage.getItem('domus_logs');
        return logs ? JSON.parse(logs) : [];
    },
    
    // Guardar logs
    saveLogs: function(logs) {
        localStorage.setItem('domus_logs', JSON.stringify(logs));
    },
    
    // Agregar un log
    addLog: function(action, ticketId, ticketTitle, condominium = '') {
        const logs = this.getLogs();
        const log = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            action: action,
            ticketId: ticketId,
            ticketTitle: ticketTitle,
            condominium: condominium,
            type: action === 'creación' ? 'creation' : 
                  action === 'cierre' ? 'closure' : 'modification'
        };
        logs.unshift(log);
        // Mantener solo los últimos 100 logs
        if (logs.length > 100) {
            logs.pop();
        }
        this.saveLogs(logs);
    }
};