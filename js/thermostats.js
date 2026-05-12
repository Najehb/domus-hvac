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
    
    // Generar niveles
    generateLevels: function() {
        const levels = ['Lobby'];
        for (let i = 2; i <= 13; i++) {
            levels.push(`Nivel ${i}`);
        }
        return levels;
    },
    
    // Agregar o actualizar configuración
    saveConfig: function(level, total, installed) {
        const configs = this.getConfigs();
        const existingIndex = configs.findIndex(c => c.level === level);
        
        if (existingIndex >= 0) {
            // Actualizar existente
            configs[existingIndex].total = parseInt(total);
            configs[existingIndex].installed = parseInt(installed);
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
        if (confirm('¿Estás seguro de eliminar esta configuración?')) {
            const configs = this.getConfigs();
            const filtered = configs.filter(c => c.id !== configId);
            this.saveConfigs(filtered);
            this.renderTable();
            this.updateSummary();
            Dashboard.update();
        }
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
        
        if (!container) return;
        
        if (configs.length === 0) {
            container.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No hay configuraciones de termostatos. Usa el formulario para agregar la primera configuración.</p>';
            return;
        }
        
        // Ordenar por nivel
        configs.sort((a, b) => {
            if (a.level === 'Lobby') return -1;
            if (b.level === 'Lobby') return 1;
            const numA = parseInt(a.level.replace('Nivel ', ''));
            const numB = parseInt(b.level.replace('Nivel ', ''));
            return numA - numB;
        });
        
        let html = `
            <table class="config-table">
                <thead>
                    <tr>
                        <th>Nivel</th>
                        <th>Total</th>
                        <th>Instalados</th>
                        <th>Pendientes</th>
                        <th>Progreso</th>
                        <th>Última Actualización</th>
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
                    <td><small>${config.updatedAt}</small></td>
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
            
            // Cambiar a la sección de termostatos si no está activa
            showSection('thermostats');
            
            // Scroll al formulario
            setTimeout(() => {
                document.querySelector('#thermostats .config-form').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    },
    
    // Actualizar resumen
    updateSummary: function() {
        const stats = this.getStats();
        
        // Actualizar resumen en la página de termostatos
        const totalThermo = document.getElementById('totalThermo');
        const installedThermo = document.getElementById('installedThermo');
        const pendingThermo = document.getElementById('pendingThermo');
        const thermoProgress = document.getElementById('thermoProgress');
        const thermoPercent = document.getElementById('thermoPercent');
        
        if (totalThermo) totalThermo.textContent = stats.total;
        if (installedThermo) installedThermo.textContent = stats.installed;
        if (pendingThermo) pendingThermo.textContent = stats.pending;
        if (thermoProgress) thermoProgress.style.width = stats.percent + '%';
        if (thermoPercent) thermoPercent.textContent = stats.percent + '%';
        
        // Actualizar dashboard
        const dashTotalThermo = document.getElementById('dashTotalThermo');
        const dashInstalledThermo = document.getElementById('dashInstalledThermo');
        const dashPendingThermo = document.getElementById('dashPendingThermo');
        const dashThermoPercent = document.getElementById('dashThermoPercent');
        const dashThermoBar = document.getElementById('dashThermoBar');
        
        if (dashTotalThermo) dashTotalThermo.textContent = stats.total;
        if (dashInstalledThermo) dashInstalledThermo.textContent = stats.installed;
        if (dashPendingThermo) dashPendingThermo.textContent = stats.pending;
        if (dashThermoPercent) dashThermoPercent.textContent = stats.percent + '%';
        if (dashThermoBar) dashThermoBar.style.width = stats.percent + '%';
    },
    
    // Cargar niveles en el select
    loadLevels: function() {
        const select = document.getElementById('thermoLevel');
        if (!select) {
            console.error('No se encontró el elemento thermoLevel');
            return;
        }
        
        // Limpiar opciones existentes
        select.innerHTML = '';
        
        // Agregar opción por defecto
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccionar nivel';
        select.appendChild(defaultOption);
        
        // Generar y agregar niveles
        const levels = this.generateLevels();
        levels.forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level;
            select.appendChild(option);
        });
        
        console.log('Niveles de termostatos cargados:', levels.length);
    },
    
    // Inicializar
    init: function() {
        this.loadLevels();
        this.updateSummary();
        this.renderTable();
    }
};