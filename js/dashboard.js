// Módulo del dashboard
const Dashboard = {
    update: function() {
        const tickets = Storage.getTickets();
        
        // Actualizar estadísticas
        document.getElementById('totalTickets').textContent = tickets.length;
        
        const openTickets = tickets.filter(t => t.status !== 'cerrado').length;
        document.getElementById('openTickets').textContent = openTickets;
        
        const closedTickets = tickets.filter(t => t.status === 'cerrado').length;
        document.getElementById('closedTickets').textContent = closedTickets;
        
        // Niveles únicos con tickets abiertos
        const affectedLevels = new Set(
            tickets
                .filter(t => t.status !== 'cerrado')
                .map(t => t.level)
        );
        document.getElementById('affectedLevels').textContent = affectedLevels.size;
        
        // Mostrar últimos 5 tickets
        const recentTickets = tickets.slice(-5).reverse();
        TicketManager.renderList(recentTickets, 'recentTickets');
        
        // Agregar botón de PDF si no existe
        if (!document.getElementById('btnExportPDF')) {
            const dashboardSection = document.getElementById('dashboard');
            const btnPDF = document.createElement('button');
            btnPDF.id = 'btnExportPDF';
            btnPDF.className = 'btn-pdf';
            btnPDF.textContent = '📄 Exportar Informe PDF';
            btnPDF.onclick = Dashboard.exportToPDF;
            
            // Insertar después del grid de estadísticas
            const recentActivity = dashboardSection.querySelector('.recent-activity');
            if (recentActivity) {
                recentActivity.parentNode.insertBefore(btnPDF, recentActivity);
            }
        }
        // En la función update(), agrega:
// Actualizar estadísticas de termostatos y rejillas
if (typeof ThermostatManager !== 'undefined') {
    ThermostatManager.updateSummary();
}
if (typeof GrilleManager !== 'undefined') {
    GrilleManager.updateSummary();
}
    },
    
    // Exportar a PDF
    exportToPDF: function() {
        const tickets = Storage.getTickets();
        const openTickets = tickets.filter(t => t.status !== 'cerrado');
        
        // Crear contenido del informe
        let content = `
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Informe DOMUS HVAC</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #1a237e; border-bottom: 2px solid #1a237e; padding-bottom: 10px; }
                    h2 { color: #283593; margin-top: 20px; }
                    .header { margin-bottom: 30px; }
                    .stats { display: flex; gap: 20px; margin: 20px 0; }
                    .stat-box { 
                        border: 1px solid #ddd; 
                        padding: 15px; 
                        border-radius: 5px;
                        flex: 1;
                        text-align: center;
                    }
                    .stat-number { font-size: 24px; font-weight: bold; color: #1a237e; }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 20px; 
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 8px; 
                        text-align: left; 
                    }
                    th { background-color: #1a237e; color: white; }
                    .priority-critica { color: #d32f2f; font-weight: bold; }
                    .priority-alta { color: #f57c00; font-weight: bold; }
                    .footer { margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>INFORME DE PENDIENTES HVAC</h1>
                    <p><strong>Proyecto:</strong> Torre DOMUS</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Generado por:</strong> Ingeniero Mecánico</p>
                </div>
                
                <div class="stats">
                    <div class="stat-box">
                        <div class="stat-number">${tickets.length}</div>
                        <div>Total Tickets</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${openTickets.length}</div>
                        <div>Pendientes</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${tickets.filter(t => t.status === 'cerrado').length}</div>
                        <div>Cerrados</div>
                    </div>
                </div>
                
                <h2>Tickets Pendientes (${openTickets.length})</h2>
        `;
        
        if (openTickets.length > 0) {
            content += `
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Condominio</th>
                            <th>Título</th>
                            <th>Nivel</th>
                            <th>Sistema</th>
                            <th>Prioridad</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            openTickets.forEach(ticket => {
                content += `
                    <tr>
                        <td>#${ticket.id}</td>
                        <td>${ticket.condominium || 'Torre DOMUS'}</td>
                        <td>${ticket.title}</td>
                        <td>${ticket.level}</td>
                        <td>${ticket.system}</td>
                        <td class="priority-${ticket.priority}">${ticket.priority.toUpperCase()}</td>
                        <td>${ticket.createdAt}</td>
                    </tr>
                `;
            });
            
            content += `
                    </tbody>
                </table>
            `;
        } else {
            content += '<p>No hay tickets pendientes.</p>';
        }
        
        content += `
                <div class="footer">
                    <p>Este informe fue generado automáticamente por el Sistema de Gestión HVAC - Torre DOMUS</p>
                    <p>Página 1 de 1</p>
                </div>
            </body>
            </html>
        `;
        
        // Abrir en nueva ventana para imprimir
        const printWindow = window.open('', '_blank');
        printWindow.document.write(content);
        printWindow.document.close();
        
        // Esperar a que cargue y luego imprimir
        printWindow.onload = function() {
            printWindow.print();
            // printWindow.close(); // Descomentar si quieres que se cierre automáticamente
        };
    },
    
    // Renderizar logs
    renderLogs: function() {
        const logs = Storage.getLogs();
        const container = document.getElementById('projectLogs');
        
        if (logs.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No hay actividad registrada</p>';
            return;
        }
        
        let html = '';
        logs.forEach(log => {
            let icon = '';
            switch(log.action) {
                case 'creación':
                    icon = '🟢';
                    break;
                case 'cierre':
                    icon = '🔵';
                    break;
                case 'modificación':
                    icon = '🟡';
                    break;
                case 'eliminación':
                    icon = '🔴';
                    break;
                default:
                    icon = '⚪';
            }
            
            const condominiumInfo = log.condominium ? ` [${log.condominium}]` : '';
            
            html += `
                <div class="log-entry ${log.type}">
                    <span class="timestamp">${log.timestamp}</span><br>
                    ${icon} Ticket #${log.ticketId}${condominiumInfo} - "${log.ticketTitle}" - ${log.action}
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
};