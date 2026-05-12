// Módulo de gestión de termostatos
const ThermostatManager = {
    // Obtener configuraciones de termostatos
    getConfigs: function() {
        const configs = localStorage.getItem('domus_thermostats');
        return configs ? JSON.parse(configs) : [];
    },
    
    // Guardar configuraciones
    saveConfigs: function(configs) {
        localStorage.setItem('domus_thermostats', JSON.stringify(configs));
    },
    
    // Agregar o actualizar configuración
    saveConfig: function(level, total, installed) {
        const configs = this.getConfigs();
        const existingIndex = configs.findIndex(c => c.level === level);
        
        if (existingIndex >= 0) {
            // Actualizar existente
            configs[existingIndex].total = total;
            configs[existingIndex].installed = installed;
            configs[existingIndex].updatedAt = new Date().toLocaleString();
        } else {
            // Agregar nuevo
            configs.push({
                id: Date.now(),
                level: level,
                total: parseInt(total),
                installed: parseInt(installed),
                createdAt: new Date().toLocaleString(),
                updatedAt: new Date().toLocaleString()
            });
        }
        
        this.saveConfigs(configs);
        Storage.addLog('configuración', Date.now(), `Termostatos - ${level}`);
    },
    
    // Eliminar configuración
    deleteConfig: function(configId) {
        const configs = this.getConfigs();
        const filtered = configs.filter(c => c.id !== configId);
        this.saveConfigs(filtered);
    },
    
    // Obtener estadísticas
    getStats: function() {
        const configs = this.getConfigs();
        const total = configs.reduce((sum, c) => sum + c.total, 0);
        const installed = configs.reduce((sum, c) => sum + c.installed, 0);
        const pending = total - installed;
        const percent = total > 0 ? Math.round((installed / total) * 100) : 0;
        
        return { total, installed, pending, percent };
    },
    
    // Renderizar tabla
    renderTable: function() {
        const configs = this.getConfigs();
        const container = document.getElementById('thermostatTable');
        
        if (configs.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No hay configuraciones de termostatos</p>';
            return;
        }
        
        let html = `
            <table class="config-table">
                <thead>
                    <tr>
                        <th>Nivel</th>
                        <th>Total</th>
                        <th>Instalados</th>
                        <th>Pendientes</th>
                        <th>Progreso</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        configs.forEach(config => {
            const pending = config.total - config.installed;
            const percent = config.total > 0 ? Math.round((config.installed / config.total) * 100) : 0;
            const statusClass = pending === 0 ? 'status-complete' : 'status-pending';
            
            html += `
                <tr>
                    <td><strong>${config.level}</strong></td>
                    <td>${config.total}</td>
                    <td>${config.installed}</td>
                    <td class="${statusClass}">${pending}</td>
                    <td>
                        <div class="progress-bar" style="height: 15px;">
                            <div class="progress-fill thermo-fill" style="width: ${percent}%"></div>
                        </div>
                        <small>${percent}%</small>
                    </td>
                    <td class="actions">
                        <button class="btn-small btn-edit-config" onclick="ThermostatManager.editConfig('${config.level}')">Editar</button>
                        <button class="btn-small btn-delete-config" onclick="ThermostatManager.deleteConfig(${config.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table>';
        container.innerHTML = html;
    },
    
    // Editar configuración
    editConfig: function(level) {
        const configs = this.getConfigs();
        const config = configs.find(c => c.level === level);
        
        if (config) {
            document.getElementById('thermoLevel').value = config.level;
            document.getElementById('thermoTotal').value = config.total;
            document.getElementById('thermoInstalled').value = config.installed;
            
            // Scroll al formulario
            document.querySelector('.config-form').scrollIntoView({ behavior: 'smooth' });
        }
    },
    
    // Actualizar resumen
    updateSummary: function() {
        const stats = this.getStats();
        
        document.getElementById('totalThermo').textContent = stats.total;
        document.getElementById('installedThermo').textContent = stats.installed;
        document.getElementById('pendingThermo').textContent = stats.pending;
        document.getElementById('thermoProgress').style.width = stats.percent + '%';
        document.getElementById('thermoPercent').textContent = stats.percent + '%';
        
        // Actualizar dashboard
        document.getElementById('dashTotalThermo').textContent = stats.total;
        document.getElementById('dashInstalledThermo').textContent = stats.installed;
        document.getElementById('dashPendingThermo').textContent = stats.pending;
        document.getElementById('dashThermoPercent').textContent = stats.percent + '%';
        document.getElementById('dashThermoBar').style.width = stats.percent + '%';
    },
    
    // Inicializar
    init: function() {
        const levels = ['Lobby'];
        for (let i = 2; i <= 13; i++) {
            levels.push(`Nivel ${i}`);
        }
        
        const select = document.getElementById('thermoLevel');
        levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level;
            select.appendChild(option);
        });
        
        this.updateSummary();
        this.renderTable();
    }
};